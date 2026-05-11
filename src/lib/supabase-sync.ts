/**
 * supabase-sync.ts
 * AppState ↔ Supabase テーブル 変換・同期ロジック
 */
import type { AppState, FullBoard, Card, Column, ActivityEntry } from '@/types';
import { supabase } from './supabase';
import { normalizeAppState } from '@/data';

// ── Supabase 行型 ──────────────────────────────────────────────
interface BoardRow {
  id: string;
  name: string;
  emoji: string;
  column_order: string[];
  created_at: string;
}

interface ColumnRow {
  id: string;
  board_id: string;
  title: string;
  color: string;
  card_ids: string[];
  position: number;
}

interface CardRow {
  id: string;
  board_id: string;
  column_id: string;
  title: string;
  description: string;
  priority: string;
  assignee: string;
  due_date: string | null;
  tags: unknown;
  checklist: unknown;
  archived: boolean;
  created_at: string;
}

interface CommentRow {
  id: string;
  card_id: string;
  author: string;
  text: string;
  created_at: string;
}

interface ActivityRow {
  id: string;
  board_id: string;
  card_id: string | null;
  action: string;
  detail: string;
  created_at: string;
}

// ── Supabase → AppState 変換 ───────────────────────────────────
function toAppState(
  boards: BoardRow[],
  columns: ColumnRow[],
  cards: CardRow[],
  comments: CommentRow[],
  activityRows: ActivityRow[],
): AppState {
  // コメントを card_id でグループ化
  const commentsByCard: Record<string, CommentRow[]> = {};
  for (const c of comments) {
    (commentsByCard[c.card_id] ??= []).push(c);
  }

  // カードを board_id でグループ化
  const cardsByBoard: Record<string, CardRow[]> = {};
  for (const c of cards) {
    (cardsByBoard[c.board_id] ??= []).push(c);
  }

  // カラムを board_id でグループ化
  const colsByBoard: Record<string, ColumnRow[]> = {};
  for (const c of columns) {
    (colsByBoard[c.board_id] ??= []).push(c);
  }

  const boardMap: Record<string, FullBoard> = {};
  const boardOrder: string[] = [];

  for (const b of boards) {
    boardOrder.push(b.id);

    // Cards
    const cardsRecord: Record<string, Card> = {};
    for (const row of cardsByBoard[b.id] ?? []) {
      const cardComments = (commentsByCard[row.id] ?? []).map(cm => ({
        id: cm.id,
        author: cm.author,
        text: cm.text,
        createdAt: cm.created_at,
      }));
      cardsRecord[row.id] = {
        id: row.id,
        title: row.title,
        description: row.description,
        priority: row.priority as Card['priority'],
        assignee: row.assignee,
        dueDate: row.due_date,
        tags: Array.isArray(row.tags) ? row.tags as Card['tags'] : [],
        checklist: Array.isArray(row.checklist) ? row.checklist as Card['checklist'] : [],
        comments: cardComments,
        archived: row.archived,
        createdAt: row.created_at,
      };
    }

    // Columns
    const colsRecord: Record<string, Column> = {};
    const colRows = [...(colsByBoard[b.id] ?? [])].sort((a, z) => a.position - z.position);
    for (const col of colRows) {
      colsRecord[col.id] = {
        id: col.id,
        title: col.title,
        color: col.color,
        cardIds: col.card_ids,
      };
    }

    boardMap[b.id] = {
      id: b.id,
      name: b.name,
      emoji: b.emoji,
      createdAt: b.created_at,
      cards: cardsRecord,
      columns: colsRecord,
      columnOrder: b.column_order,
    };
  }

  const activityLog: ActivityEntry[] = activityRows.map(r => ({
    id: r.id,
    boardId: r.board_id,
    cardId: r.card_id ?? undefined,
    action: r.action as ActivityEntry['action'],
    detail: r.detail,
    timestamp: r.created_at,
  }));

  const activeBoardId = boardOrder[0] ?? '';

  return normalizeAppState({ boards: boardMap, boardOrder, activeBoardId, activityLog });
}

// ── Supabase からロード ─────────────────────────────────────────
export async function fetchFromSupabase(): Promise<AppState | null> {
  if (!supabase) return null;

  const [boardsRes, columnsRes, cardsRes, commentsRes, activityRes] = await Promise.all([
    supabase.from('boards').select('*').order('created_at'),
    supabase.from('columns').select('*'),
    supabase.from('cards').select('*'),
    supabase.from('comments').select('*'),
    supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(200),
  ]);

  if (boardsRes.error) {
    console.error('[supabase-sync] load error:', boardsRes.error.message);
    return null;
  }

  const boards = (boardsRes.data ?? []) as BoardRow[];
  if (boards.length === 0) return null;   // まだデータがない → localStorage を使う

  return toAppState(
    boards,
    (columnsRes.data ?? []) as ColumnRow[],
    (cardsRes.data ?? []) as CardRow[],
    (commentsRes.data ?? []) as CommentRow[],
    (activityRes.data ?? []) as ActivityRow[],
  );
}

// ── AppState → Supabase 保存 ────────────────────────────────────
export async function saveToSupabase(state: AppState): Promise<void> {
  if (!supabase) return;

  for (const board of state.boardOrder.map(id => state.boards[id]).filter(Boolean)) {
    // Board upsert
    await supabase.from('boards').upsert({
      id: board.id,
      name: board.name,
      emoji: board.emoji,
      column_order: board.columnOrder,
    }, { onConflict: 'id' });

    // Columns upsert
    const colUpserts = board.columnOrder.map((colId, position) => {
      const col = board.columns[colId];
      if (!col) return null;
      return {
        id: col.id,
        board_id: board.id,
        title: col.title,
        color: col.color,
        card_ids: col.cardIds,
        position,
      };
    }).filter((x): x is NonNullable<typeof x> => x !== null);

    if (colUpserts.length > 0) {
      await supabase.from('columns').upsert(colUpserts, { onConflict: 'id' });
    }

    // Cards upsert
    const cards = Object.values(board.cards);
    if (cards.length > 0) {
      const colIdForCard: Record<string, string> = {};
      for (const col of Object.values(board.columns)) {
        for (const cardId of col.cardIds) colIdForCard[cardId] = col.id;
      }

      const cardUpserts = cards.map(card => ({
        id: card.id,
        board_id: board.id,
        column_id: colIdForCard[card.id] ?? board.columnOrder[0],
        title: card.title,
        description: card.description,
        priority: card.priority,
        assignee: card.assignee,
        due_date: card.dueDate,
        tags: card.tags,
        checklist: card.checklist,
        archived: card.archived,
      }));

      await supabase.from('cards').upsert(cardUpserts, { onConflict: 'id' });

      // Comments upsert（全コメントを一括）
      const allComments = cards.flatMap(card =>
        (card.comments ?? []).map(cm => ({
          id: cm.id,
          card_id: card.id,
          author: cm.author,
          text: cm.text,
          created_at: cm.createdAt,
        }))
      );
      if (allComments.length > 0) {
        await supabase.from('comments').upsert(allComments, { onConflict: 'id' });
      }
    }
  }

  // 活動ログ upsert（最新 100 件）
  const recentLogs = (state.activityLog ?? []).slice(0, 100).map(e => ({
    id: e.id,
    board_id: e.boardId,
    card_id: e.cardId ?? null,
    action: e.action,
    detail: e.detail,
    created_at: e.timestamp,
  }));
  if (recentLogs.length > 0) {
    await supabase.from('activity_log').upsert(recentLogs, { onConflict: 'id' });
  }
}

// ── localStorage → Supabase 初回マイグレーション ──────────────
export async function migrateLocalStorageToSupabase(state: AppState): Promise<void> {
  if (!supabase) return;

  // Supabase にデータが既にあるか確認
  const { data } = await supabase.from('boards').select('id').limit(1);
  if (data && data.length > 0) {
    console.info('[supabase-sync] Already has data, skip migration');
    return;
  }

  console.info('[supabase-sync] Migrating localStorage → Supabase...');
  await saveToSupabase(state);
  console.info('[supabase-sync] Migration complete');
}
