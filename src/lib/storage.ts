/**
 * ストレージ抽象層 — ローカルファースト + Supabase 同期
 *
 * 動作フロー:
 * 1. loadAppState()      → localStorage から即時ロード（同期）
 * 2. initSupabaseSync()  → Supabase からロードして状態を上書き（非同期）
 * 3. saveAppState()      → localStorage に即時保存 + Supabase にデバウンス保存
 */
import type { AppState } from '@/types';
import { initialAppState, normalizeAppState } from '@/data';
import { isSupabaseConfigured } from './supabase';
import { fetchFromSupabase, saveToSupabase, migrateLocalStorageToSupabase } from './supabase-sync';

const LS_KEY = 'hermes-kanban-app-v2';

// ── localStorage 実装 ──────────────────────────────────────────
function loadFromLocalStorage(): AppState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return initialAppState;
    return normalizeAppState(JSON.parse(raw) as Record<string, unknown>);
  } catch {
    return initialAppState;
  }
}

function saveToLocalStorage(state: AppState): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch { /* quota exceeded は無視 */ }
}

// ── デバウンス付き Supabase 保存 ───────────────────────────────
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function debouncedSaveToSupabase(state: AppState, delay = 1500): void {
  if (!isSupabaseConfigured) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveToSupabase(state).catch(err =>
      console.error('[storage] Supabase save failed:', err)
    );
  }, delay);
}

// ── 公開 API ──────────────────────────────────────────────────
/** 同期ロード（localStorage から即時返す） */
export function loadAppState(): AppState {
  return loadFromLocalStorage();
}

/** 保存（localStorage 即時 + Supabase デバウンス） */
export function saveAppState(state: AppState): void {
  saveToLocalStorage(state);
  debouncedSaveToSupabase(state);
}

/**
 * Supabase 初期化（App 起動時に 1 回だけ呼ぶ）
 * - localStorage のデータを Supabase に移行（初回のみ）
 * - Supabase のデータで状態を上書き
 * - setAppState コールバックで React state を更新
 */
export async function initSupabaseSync(
  currentState: AppState,
  setAppState: (state: AppState) => void,
): Promise<void> {
  if (!isSupabaseConfigured) {
    console.info('[storage] Supabase not configured — using localStorage only');
    return;
  }

  try {
    // localStorage → Supabase 初回マイグレーション
    await migrateLocalStorageToSupabase(currentState);

    // Supabase からロードして状態を上書き
    const remoteState = await fetchFromSupabase();
    if (remoteState) {
      // activeBoardId は localStorage のものを優先（UI の連続性）
      const merged: AppState = {
        ...remoteState,
        activeBoardId: currentState.activeBoardId in remoteState.boards
          ? currentState.activeBoardId
          : remoteState.activeBoardId,
      };
      setAppState(merged);
      saveToLocalStorage(merged);
      console.info('[storage] Hydrated from Supabase ✅');
    }
  } catch (err) {
    console.error('[storage] Supabase init failed, using localStorage:', err);
  }
}

export { isSupabaseConfigured };
export { subscribeToRealtime } from './realtime';
