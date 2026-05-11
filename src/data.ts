import type { AppState } from '@/types';

const BOARD_ID = 'board-1';

export const initialAppState: AppState = {
  activeBoardId: BOARD_ID,
  boardOrder: [BOARD_ID],
  boards: {
    [BOARD_ID]: {
      id:        BOARD_ID,
      name:      'メインプロジェクト',
      emoji:     '🚀',
      createdAt: '2026-05-11',
      cards: {
        'card-1': {
          id: 'card-1', title: 'ログイン画面のUI改善',
          description: 'レスポンシブ対応とアクセシビリティの向上',
          priority: '高', assignee: '田中 太郎', dueDate: '2026-05-15',
          tags: [{ id: 't1', label: 'フロントエンド', color: '#6366f1' }],
          createdAt: '2026-05-01',
        },
        'card-2': {
          id: 'card-2', title: 'APIレート制限の実装',
          description: '不正アクセス対策としてレート制限を追加する',
          priority: '高', assignee: '佐藤 花子', dueDate: '2026-05-20',
          tags: [{ id: 't2', label: 'バックエンド', color: '#10b981' }],
          createdAt: '2026-05-02',
        },
        'card-3': {
          id: 'card-3', title: 'ダッシュボードのパフォーマンス最適化',
          description: 'データ取得の遅延を改善し、初期表示を高速化する',
          priority: '中', assignee: '鈴木 一郎', dueDate: '2026-05-25',
          tags: [{ id: 't3', label: 'パフォーマンス', color: '#f59e0b' }],
          createdAt: '2026-05-03',
        },
        'card-4': {
          id: 'card-4', title: 'ユーザー権限管理機能',
          description: 'ロールベースのアクセス制御を実装する',
          priority: '高', assignee: '山田 美咲', dueDate: '2026-05-18',
          tags: [
            { id: 't2', label: 'バックエンド',   color: '#10b981' },
            { id: 't4', label: 'セキュリティ',   color: '#ef4444' },
          ],
          createdAt: '2026-05-04',
        },
        'card-5': {
          id: 'card-5', title: 'テスト自動化の整備',
          description: 'CI/CDパイプラインにE2Eテストを追加する',
          priority: '中', assignee: '伊藤 健二', dueDate: '2026-06-01',
          tags: [{ id: 't5', label: 'テスト', color: '#8b5cf6' }],
          createdAt: '2026-05-05',
        },
        'card-6': {
          id: 'card-6', title: 'ドキュメントの更新',
          description: 'APIドキュメントとReadmeを最新状態に更新する',
          priority: '低', assignee: '中村 愛', dueDate: '2026-05-30',
          tags: [{ id: 't6', label: 'ドキュメント', color: '#64748b' }],
          createdAt: '2026-05-06',
        },
        'card-7': {
          id: 'card-7', title: 'メール通知機能の追加',
          description: 'タスク完了時にアサイニーへ通知メールを送信する',
          priority: '中', assignee: '田中 太郎', dueDate: null,
          tags: [{ id: 't2', label: 'バックエンド', color: '#10b981' }],
          createdAt: '2026-05-07',
        },
        'card-8': {
          id: 'card-8', title: 'ダークモード対応',
          description: 'ユーザー設定でテーマを切り替え可能にする',
          priority: '低', assignee: '佐藤 花子', dueDate: '2026-06-10',
          tags: [{ id: 't1', label: 'フロントエンド', color: '#6366f1' }],
          createdAt: '2026-05-08',
        },
      },
      columns: {
        'col-todo':       { id: 'col-todo',       title: '未着手',   color: '#6b7280', cardIds: ['card-1', 'card-2', 'card-7'] },
        'col-inprogress': { id: 'col-inprogress', title: '進行中',   color: '#3b82f6', cardIds: ['card-3', 'card-4'] },
        'col-review':     { id: 'col-review',     title: 'レビュー中', color: '#f59e0b', cardIds: ['card-5', 'card-8'] },
        'col-done':       { id: 'col-done',       title: '完了',     color: '#10b981', cardIds: ['card-6'] },
      },
      columnOrder: ['col-todo', 'col-inprogress', 'col-review', 'col-done'],
    },
  },
};
