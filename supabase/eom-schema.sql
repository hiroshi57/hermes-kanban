-- ==========================================================
-- Economy of Minds (EoM) — Supabase スキーマ拡張
-- arXiv 2606.02859 実装: エージェント経済による自律タスク処理
-- 使い方: Supabase ダッシュボード > SQL Editor に貼り付けて実行
-- ==========================================================

-- ── eom_agents: エージェント個体 ──────────────────────────────────
-- 論文の agent tuple: (φ_a triggering predicate, π_a policy, b_a bid, W_a wealth)
-- 多様性は system_prompt で表現（共通の frozen LLM backbone を使用）
create table if not exists eom_agents (
  id               text primary key default gen_random_uuid()::text,
  name             text not null,
  role             text not null check (role in
                     ('decomposer','planner','researcher','writer','reviewer','coder','coordinator')),
  model            text not null check (model in
                     ('claude-haiku-4-5','gpt-4o-mini','claude-sonnet-4-5','gpt-4o')),
  system_prompt    text not null default '',
  trigger_condition text not null default 'always',  -- triggering predicate φ_a
  bid_amount       float not null default 1.0,       -- 固定 bid b_a
  wealth           float not null default 10.0,      -- 現在の富 W_a
  is_active        boolean not null default true,
  generation       int not null default 0,           -- 何世代目か
  parent_id        text references eom_agents(id),   -- 変異元
  created_at       timestamptz not null default now()
);

-- ── eom_runs: カード1枚 = 1 エピソード ───────────────────────────
create table if not exists eom_runs (
  id           text primary key default gen_random_uuid()::text,
  card_id      text not null references cards(id) on delete cascade,
  board_id     text not null references boards(id) on delete cascade,
  status       text not null default 'pending'
                 check (status in ('pending','running','completed','failed')),
  subtasks     jsonb not null default '[]',  -- SubTask[] JSON
  result       text,                          -- 最終統合結果
  total_reward float not null default 0,
  error_msg    text,
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);

-- ── eom_auctions: subtask 1件 = 1 オークション ───────────────────
-- 論文 Fig.2: 各ステップで agent が入札 → 最高 bid の agent が行動権を獲得
create table if not exists eom_auctions (
  id                  text primary key default gen_random_uuid()::text,
  run_id              text not null references eom_runs(id) on delete cascade,
  subtask_index       int not null,
  subtask_description text not null,
  role_hint           text not null default 'any',
  status              text not null default 'open'
                        check (status in ('open','closed','completed','failed')),
  winner_agent_id     text references eom_agents(id),
  winning_bid         float,
  agent_output        text,     -- LLM の出力
  reward              float not null default 0,
  created_at          timestamptz not null default now(),
  completed_at        timestamptz
);

-- ── eom_bids: 各エージェントの入札記録 ───────────────────────────
create table if not exists eom_bids (
  id         text primary key default gen_random_uuid()::text,
  auction_id text not null references eom_auctions(id) on delete cascade,
  agent_id   text not null references eom_agents(id) on delete cascade,
  amount     float not null,
  created_at timestamptz not null default now()
);

-- ── eom_wealth_events: 富変動ログ（ダッシュボード時系列グラフ用）──
-- 論文 Fig.3: Bucket Brigade — 報酬が軌跡を逆伝播
create table if not exists eom_wealth_events (
  id           text primary key default gen_random_uuid()::text,
  agent_id     text not null references eom_agents(id) on delete cascade,
  event_type   text not null check (event_type in
                  ('bid_win','bucket_brigade','rent','born','bankrupt','mutation','reward')),
  delta        float not null,
  wealth_after float not null,
  auction_id   text references eom_auctions(id),
  run_id       text references eom_runs(id),
  created_at   timestamptz not null default now()
);

-- ── Row Level Security ─────────────────────────────────────────
alter table eom_agents        enable row level security;
alter table eom_runs          enable row level security;
alter table eom_auctions      enable row level security;
alter table eom_bids          enable row level security;
alter table eom_wealth_events enable row level security;

-- eom_agents: 認証ユーザー全員が読める（エージェントはグローバル共有）
create policy "eom_agents_read" on eom_agents
  for select using (true);
create policy "eom_agents_service_write" on eom_agents
  for all using (auth.role() = 'service_role');

-- eom_runs: カードの board に対してアクセス権があるユーザーが読める
create policy "eom_runs_read" on eom_runs
  for select using (
    board_id in (
      select id from boards where user_id = auth.uid() or user_id is null
    )
  );
create policy "eom_runs_service_write" on eom_runs
  for all using (auth.role() = 'service_role');

-- eom_auctions / bids / wealth_events: run を通じて間接的に認可
create policy "eom_auctions_read" on eom_auctions
  for select using (
    run_id in (
      select r.id from eom_runs r
      join boards b on b.id = r.board_id
      where b.user_id = auth.uid() or b.user_id is null
    )
  );
create policy "eom_auctions_service_write" on eom_auctions
  for all using (auth.role() = 'service_role');

create policy "eom_bids_read" on eom_bids
  for select using (
    auction_id in (
      select a.id from eom_auctions a
      join eom_runs r on r.id = a.run_id
      join boards b on b.id = r.board_id
      where b.user_id = auth.uid() or b.user_id is null
    )
  );
create policy "eom_bids_service_write" on eom_bids
  for all using (auth.role() = 'service_role');

create policy "eom_wealth_events_read" on eom_wealth_events
  for select using (true);
create policy "eom_wealth_events_service_write" on eom_wealth_events
  for all using (auth.role() = 'service_role');

-- ── インデックス ──────────────────────────────────────────────────
create index if not exists idx_eom_agents_active     on eom_agents(is_active, role);
create index if not exists idx_eom_runs_card         on eom_runs(card_id, created_at desc);
create index if not exists idx_eom_runs_status       on eom_runs(status);
create index if not exists idx_eom_auctions_run      on eom_auctions(run_id, subtask_index);
create index if not exists idx_eom_bids_auction      on eom_bids(auction_id);
create index if not exists idx_eom_wealth_agent      on eom_wealth_events(agent_id, created_at desc);
create index if not exists idx_eom_wealth_run        on eom_wealth_events(run_id);
