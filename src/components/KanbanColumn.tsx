import { Droppable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import type { Column, Card } from '@/types';
import KanbanCard from './KanbanCard';

interface Props {
  column: Column;
  cards: Card[];
  totalCount: number;
  searchQuery: string;
  onAddCard: (columnId: string) => void;
  onEditCard: (card: Card) => void;
  onDeleteCard: (cardId: string, columnId: string) => void;
}

export default function KanbanColumn({
  column, cards, totalCount, searchQuery, onAddCard, onEditCard, onDeleteCard,
}: Props) {
  const isFiltered = cards.length !== totalCount;

  return (
    <div className="flex flex-col w-[280px] flex-shrink-0">
      {/* 列ヘッダー */}
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: column.color, boxShadow: `0 0 6px ${column.color}55` }}
          />
          <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200 tracking-tight">
            {column.title}
          </span>
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500
            bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
            {isFiltered ? `${cards.length}/${totalCount}` : totalCount}
          </span>
        </div>
        <button
          onClick={() => onAddCard(column.id)}
          title="カードを追加"
          className="p-1 rounded-lg text-slate-400 dark:text-slate-500
            hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
        >
          <Plus size={15} />
        </button>
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
                />
              ))}
            </div>
            {provided.placeholder}

            {/* 空の状態 */}
            {totalCount === 0 && !snapshot.isDraggingOver && (
              <button
                onClick={() => onAddCard(column.id)}
                className="w-full flex flex-col items-center justify-center py-8 rounded-lg
                  border-2 border-dashed border-slate-200 dark:border-slate-700
                  hover:border-violet-300 dark:hover:border-violet-700
                  hover:bg-violet-50/50 dark:hover:bg-violet-900/10 group transition-all"
              >
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

            {/* フィルターで全件非表示 */}
            {totalCount > 0 && cards.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-col items-center justify-center py-6">
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
