/**
 * realtime.ts
 * Supabase Realtime — 他タブ / 他ユーザーの変更をリアルタイム反映
 *
 * 仕組み:
 * - boards / columns / cards / comments / activity_log テーブルの
 *   INSERT / UPDATE / DELETE を subscribe
 * - 変更を受信したら debounce して fetchFromSupabase() → setAppState()
 */
import type { AppState } from '@/types';
import { supabase, isSupabaseConfigured } from './supabase';
import { fetchFromSupabase } from './supabase-sync';

type SetAppState = (state: AppState) => void;

const DEBOUNCE_MS = 800;
const TABLES = ['boards', 'columns', 'cards', 'comments', 'activity_log'] as const;

/** アクティブな Realtime チャンネル（cleanup 用） */
let activeChannel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;

/**
 * Realtime 購読を開始する。
 * App 起動時に `initSupabaseSync` の後に 1 回だけ呼ぶ。
 *
 * @returns cleanup 関数（コンポーネント unmount 時に呼ぶ）
 */
export function subscribeToRealtime(
  setAppState: SetAppState,
): () => void {
  if (!isSupabaseConfigured || !supabase) {
    return () => undefined;
  }

  // 既存チャンネルがあれば先にクリーンアップ
  if (activeChannel) {
    supabase.removeChannel(activeChannel);
    activeChannel = null;
  }

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let isUnmounted = false;

  /** debounce して Supabase からフル再取得 → React state 更新 */
  function scheduleRefresh() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      if (isUnmounted) return;
      try {
        const remoteState = await fetchFromSupabase();
        if (remoteState && !isUnmounted) {
          setAppState(remoteState);
        }
      } catch (err) {
        console.error('[realtime] refresh failed:', err);
      }
    }, DEBOUNCE_MS);
  }

  // チャンネルを作成し全テーブルを購読
  const channel = supabase.channel('hermes-kanban:changes');

  for (const table of TABLES) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      () => scheduleRefresh(),
    );
  }

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.info('[realtime] subscribed ✅');
    } else if (status === 'CHANNEL_ERROR') {
      console.warn('[realtime] channel error — realtime sync unavailable');
    }
  });

  activeChannel = channel;

  return () => {
    isUnmounted = true;
    if (debounceTimer) clearTimeout(debounceTimer);
    if (supabase && activeChannel) {
      supabase.removeChannel(activeChannel);
      activeChannel = null;
    }
  };
}
