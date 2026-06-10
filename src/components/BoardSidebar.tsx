import { useState } from 'react';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, LayoutDashboard, Share2 } from 'lucide-react';
import type { FullBoard } from '@/types';

interface Props {
  boards: FullBoard[];
  activeBoardId: string;
  onSelect: (boardId: string) => void;
  onAdd: () => void;
  onEdit: (board: FullBoard) => void;
  onDelete: (boardId: string) => void;
  /** 共有モーダルを開く（Supabase 設定済みの場合のみ渡す） */
  onShare?: (board: FullBoard) => void;
}

export default function BoardSidebar({
  boards, activeBoardId, onSelect, onAdd, onEdit, onDelete, onShare,
}: Props) {
  const [expanded, setExpanded] = useState(true);

  return (
    <aside
      className={`
        flex flex-col flex-shrink-0 h-full
        bg-white dark:bg-slate-900
        border-r border-slate-200 dark:border-slate-800
        transition-all duration-200
        ${expanded ? 'w-52' : 'w-14'}
      `}
    >
      {/* サイドバーヘッダー */}
      <div className={`flex items-center h-14 border-b border-slate-200 dark:border-slate-800 px-3 flex-shrink-0 ${expanded ? 'justify-between' : 'justify-center'}`}>
        {expanded && (
          <div className="flex items-center gap-2 min-w-0">
            <LayoutDashboard size={15} className="text-violet-500 flex-shrink-0" />
            <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              ボード
            </span>
          </div>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          title={expanded ? 'サイドバーを閉じる' : 'サイドバーを開く'}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300
            hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
        >
          {expanded ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
        </button>
      </div>

      {/* ボードリスト */}
      <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        {boards.map(board => {
          const isActive = board.id === activeBoardId;
          return (
            <div
              key={board.id}
              className={`
                group flex items-center mx-2 mb-0.5 rounded-lg cursor-pointer
                transition-all duration-100 relative
                ${isActive
                  ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                }
                ${expanded ? 'px-2.5 py-2 gap-2.5' : 'px-0 py-2.5 justify-center'}
              `}
              onClick={() => onSelect(board.id)}
              title={!expanded ? board.name : undefined}
            >
              {/* アクティブインジケーター */}
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-violet-500 rounded-full" />
              )}

              {/* 絵文字 */}
              <span className={`text-base flex-shrink-0 ${expanded ? '' : 'text-lg'}`}>
                {board.emoji}
              </span>

              {/* ボード名 */}
              {expanded && (
                <span className="text-[13px] font-medium truncate flex-1">
                  {board.name}
                </span>
              )}

              {/* 編集・共有・削除ボタン（展開時のみ） */}
              {expanded && (
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={e => { e.stopPropagation(); onEdit(board); }}
                    title="ボードを編集"
                    className="p-1 rounded text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                  >
                    <Pencil size={12} />
                  </button>
                  {onShare && (
                    <button
                      onClick={e => { e.stopPropagation(); onShare(board); }}
                      title="ボードを共有"
                      className="p-1 rounded text-slate-400 hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                    >
                      <Share2 size={12} />
                    </button>
                  )}
                  {boards.length > 1 && (
                    <button
                      onClick={e => { e.stopPropagation(); onDelete(board.id); }}
                      title="ボードを削除"
                      className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 新規ボードボタン */}
      <div className="p-2 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
        <button
          onClick={onAdd}
          title="新しいボードを作成"
          className={`
            w-full flex items-center rounded-lg text-[12px] font-medium
            text-slate-400 hover:text-violet-500
            hover:bg-violet-50 dark:hover:bg-violet-900/20
            transition-colors
            ${expanded ? 'gap-2 px-2.5 py-2' : 'justify-center py-2.5'}
          `}
        >
          <Plus size={14} />
          {expanded && 'ボードを追加'}
        </button>
      </div>
    </aside>
  );
}
