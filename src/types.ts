export type Priority = '高' | '中' | '低';

export type Tag = {
  id: string;
  label: string;
  color: string;
};

// 2.4 チェックリスト
export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

// 2.2 コメント
export type Comment = {
  id: string;
  author: string;
  text: string;
  createdAt: string;
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
  checklist: ChecklistItem[];   // 2.4
  comments: Comment[];          // 2.2
  archived: boolean;            // 4.3
};

export type Column = {
  id: string;
  title: string;
  color: string;
  cardIds: string[];
};

// 2.6 ソート
export type SortBy = 'none' | 'priority' | 'dueDate' | 'createdAt';

export type Board = {
  cards: Record<string, Card>;
  columns: Record<string, Column>;
  columnOrder: string[];
};

// 2.3 活動ログ
export type ActivityAction =
  | 'card_created'
  | 'card_updated'
  | 'card_moved'
  | 'card_deleted'
  | 'card_archived'
  | 'comment_added'
  | 'checklist_completed'
  | 'board_created'
  | 'board_updated';

export type ActivityEntry = {
  id: string;
  boardId: string;
  cardId?: string;
  action: ActivityAction;
  detail: string;
  timestamp: string;
};

// 複数ボード
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
  activityLog: ActivityEntry[];   // 2.3
};

// 3.5 チームメンバー管理
export type MemberRole = 'owner' | 'editor';

export type BoardMember = {
  id: string;
  boardId: string;
  userId: string;
  role: MemberRole;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  createdAt: string;
};
