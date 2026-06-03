/**
 * auth.ts
 * Supabase Auth v2 ヘルパー関数
 *
 * 認証フロー:
 * 1. signInWithGoogle() → Google OAuth リダイレクト
 * 2. リダイレクト帰還後、onAuthStateChange が user を通知
 * 3. signOut() → セッションをクリア
 */
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';

export type { User, Session };

/** Google OAuth でサインイン（リダイレクトフロー） */
export async function signInWithGoogle(): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

/** サインアウト */
export async function signOut(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) console.error('[auth] signOut error:', error.message);
}

/** 現在のユーザー ID を取得（未ログイン時は null） */
export async function getCurrentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * 認証状態変化を監視する。
 * コンポーネントの useEffect で呼び、cleanup 関数を返す。
 */
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  if (!supabase) {
    // Supabase 未設定 → 認証不要モードとして即時 null を返す
    callback(null);
    return () => undefined;
  }
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => callback(session?.user ?? null)
  );
  return () => subscription.unsubscribe();
}

export { isSupabaseConfigured };
