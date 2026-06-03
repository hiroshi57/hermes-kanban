/**
 * sharing.ts
 * チームメンバー管理・共有ボード ロジック
 *
 * 招待フロー:
 * 1. createInviteLink(boardId) → トークン生成 → invite URL を返す
 * 2. 相手が URL を開く → ?invite=TOKEN が URL に含まれる
 * 3. ログイン後、acceptInvite(token) で board_members に追加
 */
import { supabase, isSupabaseConfigured } from './supabase';
import type { BoardMember } from '@/types';

// ── 型 ───────────────────────────────────────────────────────
interface InviteRow {
  id: string;
  board_id: string;
  token: string;
  role: string;
  expires_at: string;
  use_count: number;
}

interface MemberRow {
  id: string;
  board_id: string;
  user_id: string;
  role: string;
  invited_by: string | null;
  created_at: string;
  profiles: {
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

// ── 現在ユーザー ID ──────────────────────────────────────────
async function myUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ── プロフィール同期（ログイン時に 1 回）─────────────────────
export async function upsertMyProfile(): Promise<void> {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.['full_name'] ?? null,
    avatar_url: user.user_metadata?.['avatar_url'] ?? null,
  }, { onConflict: 'id' });
}

// ── 招待リンクを生成（有効期限 7 日）────────────────────────
export async function createInviteLink(boardId: string): Promise<string | null> {
  if (!supabase || !isSupabaseConfigured) return null;
  const userId = await myUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('board_invites')
    .insert({ board_id: boardId, created_by: userId })
    .select('token')
    .single();

  if (error || !data) {
    console.error('[sharing] createInviteLink error:', error?.message);
    return null;
  }

  return `${window.location.origin}?invite=${data.token as string}`;
}

// ── 招待を受諾（board_members に追加）────────────────────────
export async function acceptInvite(token: string): Promise<{ boardId: string } | null> {
  if (!supabase || !isSupabaseConfigured) return null;
  const userId = await myUserId();
  if (!userId) return null;

  // トークン検証
  const { data: invite, error: fetchErr } = await supabase
    .from('board_invites')
    .select('*')
    .eq('token', token)
    .single();

  if (fetchErr || !invite) {
    console.warn('[sharing] invite not found:', token);
    return null;
  }

  const inv = invite as InviteRow;

  // 期限チェック
  if (new Date(inv.expires_at) < new Date()) {
    console.warn('[sharing] invite expired');
    return null;
  }

  // 既にメンバーかチェック
  const { data: existing } = await supabase
    .from('board_members')
    .select('id')
    .eq('board_id', inv.board_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!existing) {
    // board_members に追加
    const { error: insertErr } = await supabase
      .from('board_members')
      .insert({
        board_id: inv.board_id,
        user_id: userId,
        role: inv.role,
        invited_by: inv.id,
      });

    if (insertErr) {
      console.error('[sharing] acceptInvite insert error:', insertErr.message);
      return null;
    }
  }

  // use_count をインクリメント
  await supabase
    .from('board_invites')
    .update({ use_count: (inv.use_count ?? 0) + 1 })
    .eq('id', inv.id);

  return { boardId: inv.board_id };
}

// ── ボードのメンバー一覧を取得 ────────────────────────────────
export async function getBoardMembers(boardId: string): Promise<BoardMember[]> {
  if (!supabase || !isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('board_members')
    .select('*, profiles(email, full_name, avatar_url)')
    .eq('board_id', boardId)
    .order('created_at');

  if (error) {
    console.error('[sharing] getBoardMembers error:', error.message);
    return [];
  }

  return ((data ?? []) as MemberRow[]).map(row => ({
    id: row.id,
    boardId: row.board_id,
    userId: row.user_id,
    role: row.role as BoardMember['role'],
    email: row.profiles?.email ?? undefined,
    fullName: row.profiles?.full_name ?? undefined,
    avatarUrl: row.profiles?.avatar_url ?? undefined,
    createdAt: row.created_at,
  }));
}

// ── メンバーを除名（オーナーのみ）────────────────────────────
export async function removeBoardMember(boardId: string, memberRowId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('board_members')
    .delete()
    .eq('id', memberRowId)
    .eq('board_id', boardId);

  if (error) console.error('[sharing] removeMember error:', error.message);
}

// ── 保留中の招待トークンを localStorage で受け渡し ───────────
const PENDING_INVITE_KEY = 'hermes-kanban-pending-invite';

/** OAuth リダイレクト前に招待トークンを保存 */
export function savePendingInvite(token: string): void {
  localStorage.setItem(PENDING_INVITE_KEY, token);
}

/** ログイン後に保留中の招待トークンを取り出す（1 回限り） */
export function popPendingInvite(): string | null {
  const token = localStorage.getItem(PENDING_INVITE_KEY);
  if (token) localStorage.removeItem(PENDING_INVITE_KEY);
  return token;
}
