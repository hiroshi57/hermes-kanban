export type Priority = '高' | '中' | '低';

export type Tag = {
  id: string;
  label: string;
  color: string;
};

export type Card = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  assignee: string;
  dueDate: string | null;
  tags: Tag[];
  createdAt: string;
};

export type Column = {
  id: string;
  title: string;
  color: string;
  cardIds: string[];
};

export type Board = {
  cards: Record<string, Card>;
  columns: Record<string, Column>;
  columnOrder: string[];
};

// ── 複数ボード対応 ────────────────────────────────────────────
export type BoardMeta = {
  id: string;
  name: string;
  emoji: string;
  createdAt: string;
};

export type FullBoard = Board & BoardMeta;

export type AppState = {
  boards: Record<string, FullBoard>;
  boardOrder: string[];
  activeBoardId: string;
};
