-- ==========================================================
-- Hermes Kanban — Supabase スキーマ定義
-- 使い方: Supabase ダッシュボード > SQL Editor に貼り付けて実行
-- ==========================================================

-- UUID 拡張
create extension if not exists "pgcrypto";

-- ── boards ──────────────────────────────────────────────────
create table if not exists boards (
  id           text primary key default gen_random_uuid()::text,
  user_id      uuid references auth.users(id) on delete cascade,
  name         text not null,
  emoji        text not null default '📋',
  column_order text[] not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── columns ─────────────────────────────────────────────────
create table if not exists columns (
  id        text primary key default gen_random_uuid()::text,
  board_id  text not null references boards(id) on delete cascade,
  title     text not null,
  color     text not null default '#6b7280',
  card_ids  text[] not null default '{}',
  position  int  not null default 0
);

-- ── cards ───────────────────────────────────────────────────
create table if not exists cards (
  id          text primary key default gen_random_uuid()::text,
  board_id    text not null references boards(id) on delete cascade,
  column_id   text not null references columns(id) on delete cascade,
  title       text not null,
  description text not null default '',
  priority    text not null default '中' check (priority in ('高', '中', '低')),
  assignee    text not null default '',
  due_date    date,
  tags        jsonb not null default '[]',
  checklist   jsonb not null default '[]',
  archived    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── comments ────────────────────────────────────────────────
create table if not exists comments (
  id         text primary key default gen_random_uuid()::text,
  card_id    text not null references cards(id) on delete cascade,
  author     text not null,
  text       text not null,
  created_at timestamptz not null default now()
);

-- ── activity_log ────────────────────────────────────────────
create table if not exists activity_log (
  id         text primary key default gen_random_uuid()::text,
  board_id   text not null references boards(id) on delete cascade,
  card_id    text references cards(id) on delete set null,
  action     text not null,
  detail     text not null default '',
  created_at timestamptz not null default now()
);

-- ── updated_at トリガー ──────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists boards_updated_at on boards;
create trigger boards_updated_at before update on boards
  for each row execute function update_updated_at();

drop trigger if exists cards_updated_at on cards;
create trigger cards_updated_at before update on cards
  for each row execute function update_updated_at();

-- ── Row Level Security ──────────────────────────────────────
-- boards は user_id で分離。columns/cards/comments は board を通じて制御。
alter table boards       enable row level security;
alter table columns      enable row level security;
alter table cards        enable row level security;
alter table comments     enable row level security;
alter table activity_log enable row level security;

-- boards: 自分の boards のみ、または未オーナー（移行用）
drop policy if exists "boards_owner" on boards;
create policy "boards_owner" on boards
  for all using (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid() or user_id is null);

-- columns: 親 board が自分のものか未オーナー
drop policy if exists "columns_owner" on columns;
create policy "columns_owner" on columns
  for all using (
    board_id in (
      select id from boards where user_id = auth.uid() or user_id is null
    )
  );

-- cards: 親 board が自分のものか未オーナー
drop policy if exists "cards_owner" on cards;
create policy "cards_owner" on cards
  for all using (
    board_id in (
      select id from boards where user_id = auth.uid() or user_id is null
    )
  );

-- comments: 親 card が自分のものか未オーナー
drop policy if exists "comments_owner" on comments;
create policy "comments_owner" on comments
  for all using (
    card_id in (
      select c.id from cards c
      join boards b on b.id = c.board_id
      where b.user_id = auth.uid() or b.user_id is null
    )
  );

-- activity_log: 親 board が自分のものか未オーナー
drop policy if exists "activity_owner" on activity_log;
create policy "activity_owner" on activity_log
  for all using (
    board_id in (
      select id from boards where user_id = auth.uid() or user_id is null
    )
  );

-- ── インデックス ─────────────────────────────────────────────
create index if not exists idx_cards_board_id   on cards(board_id);
create index if not exists idx_cards_column_id  on cards(column_id);
create index if not exists idx_cards_archived   on cards(archived);
create index if not exists idx_comments_card_id on comments(card_id);
create index if not exists idx_activity_board   on activity_log(board_id, created_at desc);
