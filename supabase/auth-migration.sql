-- ==========================================================
-- auth-migration.sql
-- 既存の Hermes Kanban DB に認証（RLS）を後付けするマイグレーション
--
-- 使い方:
--   Supabase ダッシュボード > SQL Editor に貼り付けて実行
--   ※ schema.sql を新規実行した場合はこのファイルは不要
-- ==========================================================

-- 1. boards テーブルに user_id 列を追加（未設定 = 移行期間は NULL 許容）
alter table boards
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- 2. RLS を有効化
alter table boards       enable row level security;
alter table columns      enable row level security;
alter table cards        enable row level security;
alter table comments     enable row level security;
alter table activity_log enable row level security;

-- 3. 既存ポリシーを一旦削除（冪等に実行可能にする）
drop policy if exists "boards_owner"    on boards;
drop policy if exists "columns_owner"   on columns;
drop policy if exists "cards_owner"     on cards;
drop policy if exists "comments_owner"  on comments;
drop policy if exists "activity_owner"  on activity_log;

-- 4. boards ポリシー: 自分の boards または未オーナー（NULL）
create policy "boards_owner" on boards
  for all using (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid() or user_id is null);

-- 5. columns ポリシー
create policy "columns_owner" on columns
  for all using (
    board_id in (
      select id from boards where user_id = auth.uid() or user_id is null
    )
  );

-- 6. cards ポリシー
create policy "cards_owner" on cards
  for all using (
    board_id in (
      select id from boards where user_id = auth.uid() or user_id is null
    )
  );

-- 7. comments ポリシー
create policy "comments_owner" on comments
  for all using (
    card_id in (
      select c.id from cards c
      join boards b on b.id = c.board_id
      where b.user_id = auth.uid() or b.user_id is null
    )
  );

-- 8. activity_log ポリシー
create policy "activity_owner" on activity_log
  for all using (
    board_id in (
      select id from boards where user_id = auth.uid() or user_id is null
    )
  );

-- ── 補足 ─────────────────────────────────────────────────────────
-- 既存データの ownership を特定ユーザーに割り当てる場合:
--   UPDATE boards SET user_id = '<your-user-uuid>' WHERE user_id IS NULL;
-- ユーザー UUID は Supabase ダッシュボード > Authentication > Users で確認できます。
