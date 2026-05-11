import { Draggable } from '@hello-pangea/dnd';
import { Calendar, User, AlertCircle, ChevronUp, Minus, Trash2 } from 'lucide-react';
import type { Card } from '@/types';
import { isOverdue, formatDate } from '@/utils/date';
import { splitHighlight } from '@/utils/boardUtils';

interface Props {
  card: Card;
  index: number;
  searchQuery: string;
  onEdit: (card: Card) => void;
  onDelete: (cardId: string) => void;
}

const PRIORITY = {
  高: { dot: 'bg-red-500',  badge: 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400',     icon: AlertCircle },
  中: { dot: 'bg-amber-400', badge: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400', icon: ChevronUp  },
  低: { dot: 'bg-slate-300 dark:bg-slate-600', badge: 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400', icon: Minus },
} as const;

/** 検索ハイライト付きテキスト */
function Highlight({ text, query }: { text: string; query: string }) {
  const parts = splitHighlight(text, query);
  return (
    <>
      {parts.map((p, i) =>
        p.highlight
          ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-700/60 text-inherit rounded-sm px-0.5 not-italic">{p.text}</mark>
          : <span key={i}>{p.text}</span>
      )}
    </>
  );
}

export default function KanbanCard({ card, index, searchQuery, onEdit, onDelete }: Props) {
  const p     = PRIORITY[card.priority];
  const PIcon = p.icon;
  const over  = isOverdue(card.dueDate);

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onEdit(card)}
          className={`
            group relative rounded-xl border cursor-pointer
            bg-white dark:bg-slate-800/80
            transition-all duration-150
            ${snapshot.isDragging
              ? 'border-violet-400 shadow-lg shadow-violet-400/25 rotate-1 scale-[1.03] z-50'
              : 'border-slate-200 dark:border-slate-700/80 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md dark:hover:shadow-black/30'
            }
          `}
        >
          {/* 優先度カラーバー */}
          <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full ${p.dot} opacity-70`} />

          <div className="p-3.5 pl-4">
            {/* 上段 */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${p.badge}`}>
                <PIcon size={10} />
                {card.priority}
              </span>
              <button
                onClick={e => { e.stopPropagation(); onDelete(card.id); }}
                title="削除"
                className="opacity-0 group-hover:opacity-100 transition-opacity
                  p-1 rounded-md text-slate-300 dark:text-slate-600
                  hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20
                  flex-shrink-0 -mt-0.5 -mr-0.5"
              >
                <Trash2 size={12} />
              </button>
            </div>

            {/* タイトル（ハイライト付き） */}
            <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 leading-snug mb-2 line-clamp-2">
              <Highlight text={card.title} query={searchQuery} />
            </h3>

            {/* 説明（ハイライト付き） */}
            {card.description && (
              <p className="text-[12px] text-slate-400 dark:text-slate-500 line-clamp-2 mb-2.5 leading-relaxed">
                <Highlight text={card.description} query={searchQuery} />
              </p>
            )}

            {/* タグ */}
            {card.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2.5">
                {card.tags.map(tag => (
                  <span key={tag.id}
                    className="text-[11px] px-2 py-0.5 rounded-full text-white font-medium"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            )}

            {/* フッター */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600
                  flex items-center justify-center flex-shrink-0">
                  <User size={10} className="text-white" />
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[100px]">
                  <Highlight text={card.assignee} query={searchQuery} />
                </span>
              </div>
              {card.dueDate && (
                <div className={`flex items-center gap-1 text-[11px] font-medium ${over ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
                  <Calendar size={10} />
                  {formatDate(card.dueDate)}
                  {over && <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-500 px-1 rounded">期限超過</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
