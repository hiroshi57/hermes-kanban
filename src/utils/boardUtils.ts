import type { Card, Column, SortBy } from '@/types';

/** CardModal 用: targetColumnId / card から初期列 ID を正しく解決 */
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

/** カードがフィルター条件に一致するか */
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
  const matchPriority  = filterPriority  === '全て' || card.priority  === filterPriority;
  const matchAssignee  = filterAssignee  === '全て' || card.assignee  === filterAssignee;
  return matchSearch && matchPriority && matchAssignee;
}

// 優先度の数値マッピング（高=0 が最上位）
const PRIORITY_ORDER: Record<string, number> = { 高: 0, 中: 1, 低: 2 };

/** 2.6 ソート: カード配列をソートして返す */
export function sortCards(cards: Card[], sortBy: SortBy): Card[] {
  if (sortBy === 'none') return cards;
  return [...cards].sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
      case 'dueDate': {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;   // 期限なしは末尾
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      case 'createdAt':
        return a.createdAt.localeCompare(b.createdAt);
      default:
        return 0;
    }
  });
}

/**
 * テキストを検索クエリでハイライト用に分割
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
