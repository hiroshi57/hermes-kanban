-- ==========================================================
-- sharing-schema.sql
-- チームメンバー管理・共有ボード スキーマ
--
-- 使い方:
--   Supabase ダッシュボード > SQL Editor に貼り付けて実行
--   auth-migration.sql 適用済みであることが前提
-- ==========================================================

-- ── profiles ── auth.users のミラー（公開可能な情報）───────────
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  avatar_url text,
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- 誰でも参照可（メンバー名・アバターの表示に必要）
create policy "profiles_select" on profiles
  for select using (true);

-- 自分のプロフィールのみ更新
create policy "profiles_update" on profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- 自分のプロフィールのみ挿入
create policy "profiles_insert" on profiles
  for insert with check (id = auth.uid());

-- auth.users の INSERT/UPDATE 時に profiles を自動同期するトリガー
create or replace function sync_profile_from_auth()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email      = excluded.email,
    full_name  = excluded.full_name,
    avatar_url = excluded.avatar_url,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute function sync_profile_from_auth();

-- ── board_members ─────────────────────────────────────────────
create table if not exists board_members (
  id         uuid primary key default gen_random_uuid(),
  board_id   text not null references boards(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'editor' check (role in ('owner', 'editor')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (board_id, user_id)
);

alter table board_members enable row level security;

-- 自分がメンバーのボードのメンバー一覧を参照可
create policy "board_members_select" on board_members
  for select using (
    board_id in (
      select id from boards
      where user_id = auth.uid()
         or user_id is null
         or id in (select board_id from board_members bm2 where bm2.user_id = auth.uid())
    )
  );

-- 自分自身の参加（invite 受諾時）
create policy "board_members_insert_self" on board_members
  for insert with check (user_id = auth.uid());

-- ボードオーナーのみ削除（メンバー除名）
create policy "board_members_delete" on board_members
  for delete using (
    board_id in (select id from boards where user_id = auth.uid() or user_id is null)
  );

-- ── board_invites ─────────────────────────────────────────────
create table if not exists board_invites (
  id         uuid primary key default gen_random_uuid(),
  board_id   text not null references boards(id) on delete cascade,
  token      text not null unique default encode(gen_random_bytes(32), 'hex'),
  role       text not null default 'editor',
  created_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default now() + interval '7 days',
  use_count  int not null default 0,
  created_at timestamptz not null default now()
);

alter table board_invites enable row level security;

-- ボードオーナーのみ招待リンクを作成・参照
create policy "board_invites_owner" on board_invites
  for all using (
    board_id in (select id from boards where user_id = auth.uid() or user_id is null)
  )
  with check (
    board_id in (select id from boards where user_id = auth.uid() or user_id is null)
  );

-- トークン検証（招待受諾時）は誰でも参照可
create policy "board_invites_token_select" on board_invites
  for select using (true);

-- ── boards RLS 更新 ── メンバーも参照・更新可能に ──────────────
drop policy if exists "boards_owner" on boards;

-- SELECT: 自分の / NULL owner / 自分がメンバー
create policy "boards_select" on boards
  for select using (
    user_id = auth.uid()
    or user_id is null
    or id in (select board_id from board_members where user_id = auth.uid())
  );

-- INSERT: 自分のみ
create policy "boards_insert" on boards
  for insert with check (user_id = auth.uid() or user_id is null);

-- UPDATE: オーナー or メンバー（editor）
create policy "boards_update" on boards
  for update using (
    user_id = auth.uid()
    or user_id is null
    or id in (select board_id from board_members where user_id = auth.uid() and role = 'editor')
  );

-- DELETE: オーナーのみ
create policy "boards_delete" on boards
  for delete using (user_id = auth.uid() or user_id is null);

-- ── columns / cards / comments / activity_log RLS 更新 ─────────
-- 共有ボードのメンバーも読み書き可能にするためサブクエリを拡張

drop policy if exists "columns_owner"  on columns;
drop policy if exists "cards_owner"    on cards;
drop policy if exists "comments_owner" on comments;
drop policy if exists "activity_owner" on activity_log;

create policy "columns_access" on columns
  for all using (
    board_id in (
      select id from boards
      where user_id = auth.uid()
         or user_id is null
         or id in (select board_id from board_members where user_id = auth.uid())
    )
  );

create policy "cards_access" on cards
  for all using (
    board_id in (
      select id from boards
      where user_id = auth.uid()
         or user_id is null
         or id in (select board_id from board_members where user_id = auth.uid())
    )
  );

create policy "comments_access" on comments
  for all using (
    card_id in (
      select c.id from cards c
      join boards b on b.id = c.board_id
      where b.user_id = auth.uid()
         or b.user_id is null
         or b.id in (select board_id from board_members where user_id = auth.uid())
    )
  );

create policy "activity_access" on activity_log
  for all using (
    board_id in (
      select id from boards
      where user_id = auth.uid()
         or user_id is null
         or id in (select board_id from board_members where user_id = auth.uid())
    )
  );

-- ── インデックス ──────────────────────────────────────────────
create index if not exists idx_board_members_user  on board_members(user_id);
create index if not exists idx_board_members_board on board_members(board_id);
create index if not exists idx_board_invites_token on board_invites(token);
create index if not exists idx_board_invites_board on board_invites(board_id);
