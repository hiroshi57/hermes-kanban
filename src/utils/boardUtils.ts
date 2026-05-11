import type { Card, Column } from '@/types';

/**
 * CardModal 用: targetColumnId / card から初期列 ID を正しく解決する
 * （演算子優先順位バグの修正版）
 */
export function resolveInitialColumnId(
  targetColumnId: string | null,
  card: Card | null,
  columns: Column[]
): string {
  if (targetColumnId) return targetColumnId;
  if (card) {
    return columns.find(c => c.cardIds.includes(card.id))?.id ?? columns[0]?.id ?? '';
  }
  return columns[0]?.id ?? '';
}

/**
 * カードがフィルター条件に一致するか判定
 */
export function matchesFilter(
  card: Card,
  search: string,
  filterPriority: string,
  filterAssignee: string
): boolean {
  const q = search.trim().toLowerCase();
  const matchSearch =
    !q ||
    card.title.toLowerCase().includes(q) ||
    card.description.toLowerCase().includes(q) ||
    card.assignee.toLowerCase().includes(q);
  const matchPriority = filterPriority === '全て' || card.priority === filterPriority;
  const matchAssignee = filterAssignee === '全て' || card.assignee === filterAssignee;
  return matchSearch && matchPriority && matchAssignee;
}

/**
 * テキストを検索クエリでハイライトする部品リストに分割
 * 例: split('Hello World', 'llo') → ['He', 'llo', ' World']
 */
export function splitHighlight(text: string, query: string): { text: string; highlight: boolean }[] {
  if (!query.trim()) return [{ text, highlight: false }];
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi')).filter(p => p !== '');
  return parts.map(part => ({
    text: part,
    highlight: part.toLowerCase() === query.trim().toLowerCase(),
  }));
}
