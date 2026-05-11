import { Droppable } from '@hello-pangea/dnd';
import { Plus, ArrowUpDown } from 'lucide-react';
import type { Column, Card, SortBy } from '@/types';
import KanbanCard from './KanbanCard';

interface Props {
  column: Column;
  cards: Card[];
  totalCount: number;
  searchQuery: string;
  sortBy: SortBy;
  onSortChange: (columnId: string, sort: SortBy) => void;
  onAddCard: (columnId: string) => void;
  onEditCard: (card: Card) => void;
  onDeleteCard: (cardId: string, columnId: string) => void;
  onArchiveCard: (cardId: string) => void;
}

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'none',      label: 'なし' },
  { value: 'priority',  label: '優先度' },
  { value: 'dueDate',   label: '期限' },
  { value: 'createdAt', label: '作成日' },
];

export default function KanbanColumn({
  column, cards, totalCount, searchQuery, sortBy,
  onSortChange, onAddCard, onEditCard, onDeleteCard, onArchiveCard,
}: Props) {
  const isFiltered = cards.length !== totalCount;

  return (
    <div className="flex flex-col w-[280px] flex-shrink-0">
      {/* 列ヘッダー */}
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: column.color, boxShadow: `0 0 6px ${column.color}55` }} />
          <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200 tracking-tight">
            {column.title}
          </span>
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500
            bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
            {isFiltered ? `${cards.length}/${totalCount}` : totalCount}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* 2.6 ソート */}
          <div className="relative group">
            <button
              title="ソート"
              className={`p-1 rounded-lg transition-colors ${
                sortBy !== 'none'
                  ? 'text-violet-500 bg-violet-50 dark:bg-violet-900/20'
                  : 'text-slate-400 dark:text-slate-500 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20'
              }`}
            >
              <ArrowUpDown size={14} />
            </button>
            {/* ソートドロップダウン */}
            <div className="absolute right-0 top-7 z-30 bg-white dark:bg-slate-800 rounded-xl shadow-lg
              border border-slate-200 dark:border-slate-700 overflow-hidden
              opacity-0 scale-95 pointer-events-none
              group-focus-within:opacity-100 group-focus-within:scale-100 group-focus-within:pointer-events-auto
              group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto
              transition-all duration-100 origin-top-right w-28">
              {SORT_OPTIONS.map(opt => (
                <button key={opt.value}
                  onClick={() => onSortChange(column.id, opt.value)}
                  className={`w-full text-left px-3 py-2 text-[12px] font-medium transition-colors ${
                    sortBy === opt.value
                      ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* カード追加 */}
          <button onClick={() => onAddCard(column.id)} title="カードを追加"
            className="p-1 rounded-lg text-slate-400 dark:text-slate-500
              hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors">
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* Droppable エリア */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex-1 rounded-xl p-2 min-h-[100px] transition-all duration-150
              ${snapshot.isDraggingOver
                ? 'bg-violet-50 dark:bg-violet-900/10 ring-2 ring-violet-300 dark:ring-violet-700/60'
                : 'bg-slate-200/60 dark:bg-slate-800/40'
              }
            `}
          >
            <div className="flex flex-col gap-2">
              {cards.map((card, index) => (
                <KanbanCard
                  key={card.id}
                  card={card}
                  index={index}
                  searchQuery={searchQuery}
                  onEdit={onEditCard}
                  onDelete={cardId => onDeleteCard(cardId, column.id)}
                  onArchive={onArchiveCard}
                />
              ))}
            </div>
            {provided.placeholder}

            {totalCount === 0 && !snapshot.isDraggingOver && (
              <button onClick={() => onAddCard(column.id)}
                className="w-full flex flex-col items-center justify-center py-8 rounded-lg
                  border-2 border-dashed border-slate-200 dark:border-slate-700
                  hover:border-violet-300 dark:hover:border-violet-700
                  hover:bg-violet-50/50 dark:hover:bg-violet-900/10 group transition-all">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800
                  group-hover:bg-violet-100 dark:group-hover:bg-violet-900/20
                  flex items-center justify-center mb-1.5 transition-colors">
                  <Plus size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-violet-400 transition-colors" />
                </div>
                <p className="text-[12px] text-slate-300 dark:text-slate-600 group-hover:text-violet-400 transition-colors">
                  タスクを追加
                </p>
              </button>
            )}

            {totalCount > 0 && cards.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex items-center justify-center py-6">
                <p className="text-[11px] text-slate-300 dark:text-slate-700">
                  フィルター条件に一致するタスクなし
                </p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
