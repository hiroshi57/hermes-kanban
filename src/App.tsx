import { useState, useCallback, useEffect, useRef } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { Plus, Search, Moon, Sun, SlidersHorizontal, X, Keyboard } from 'lucide-react';
import KanbanColumn from '@/components/KanbanColumn';
import CardModal from '@/components/CardModal';
import BoardSidebar from '@/components/BoardSidebar';
import BoardModal from '@/components/BoardModal';
import StatsBar from '@/components/StatsBar';
import type { AppState, Card, Column, FullBoard } from '@/types';
import { initialAppState } from '@/data';
import { matchesFilter } from '@/utils/boardUtils';

// ─── ローカルストレージ永続化 ────────────────────────────────────
const STORAGE_KEY = 'hermes-kanban-app-v2';

function useAppState() {
  const [appState, setAppState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as AppState) : initialAppState;
    } catch {
      return initialAppState;
    }
  });

  const update = useCallback((next: AppState) => {
    setAppState(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* quota */ }
  }, []);

  return [appState, update] as const;
}

// ─── メインコンポーネント ────────────────────────────────────────
export default function App() {
  const [appState, setAppState] = useAppState();
  const [darkMode, setDarkMode] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );

  // ── フィルター ──
  const [search,          setSearch]          = useState('');
  const [filterPriority,  setFilterPriority]  = useState('全て');
  const [filterAssignee,  setFilterAssignee]  = useState('全て');
  const searchRef = useRef<HTMLInputElement>(null);

  // ── モーダル ──
  const [editingCard,    setEditingCard]    = useState<Card | null>(null);
  const [addToColumnId,  setAddToColumnId]  = useState<string | null>(null);
  const [cardModalOpen,  setCardModalOpen]  = useState(false);
  const [boardModalOpen, setBoardModalOpen] = useState(false);
  const [editingBoard,   setEditingBoard]   = useState<FullBoard | null>(null);

  // ── アクティブボード ──
  const activeBoard = appState.boards[appState.activeBoardId];
  const allBoards = appState.boardOrder.map(id => appState.boards[id]).filter(Boolean);

  // 担当者リスト（アクティブボードのカードから収集）
  const assigneeList = ['全て', ...Array.from(
    new Set(Object.values(activeBoard.cards).map(c => c.assignee))
  ).sort()];

  // ── フィルター ──
  const isFiltering = search.trim() !== '' || filterPriority !== '全て' || filterAssignee !== '全て';

  // ─── カード追加モーダルを開く（useEffect より前に宣言が必要）───
  const openAdd = useCallback((columnId: string) => {
    setEditingCard(null); setAddToColumnId(columnId); setCardModalOpen(true);
  }, []);

  const getFilteredCards = useCallback(
    (col: Column): Card[] =>
      col.cardIds
        .map(id => activeBoard.cards[id])
        .filter((c): c is Card => c !== undefined && matchesFilter(c, search, filterPriority, filterAssignee)),
    [activeBoard.cards, search, filterPriority, filterAssignee]
  );

  // ── キーボードショートカット (4.1) ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
      if (isTyping) return;

      switch (e.key) {
        case 'n': case 'N':
          e.preventDefault();
          openAdd(activeBoard.columnOrder[0]);
          break;
        case '/':
          e.preventDefault();
          searchRef.current?.focus();
          break;
        case 'Escape':
          setSearch('');
          setFilterPriority('全て');
          setFilterAssignee('全て');
          break;
        case 'd': case 'D':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            setDarkMode(m => !m);
          }
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeBoard.columnOrder]);

  // ─── Drag & Drop ────────────────────────────────────────────
  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const srcColFull = activeBoard.columns[source.droppableId];
    const dstColFull = activeBoard.columns[destination.droppableId];
    if (!srcColFull || !dstColFull) return;

    const getVisibleIds = (ids: string[]) =>
      ids.filter(id => {
        const c = activeBoard.cards[id];
        return c ? matchesFilter(c, search, filterPriority, filterAssignee) : false;
      });

    const newSrcIds = [...srcColFull.cardIds];
    const actualSrcIdx = newSrcIds.indexOf(draggableId);
    if (actualSrcIdx === -1) return;
    newSrcIds.splice(actualSrcIdx, 1);

    if (source.droppableId === destination.droppableId) {
      const visible = getVisibleIds(newSrcIds);
      const insertAt = destination.index >= visible.length
        ? (visible.at(-1) ? newSrcIds.indexOf(visible.at(-1)!) + 1 : newSrcIds.length)
        : newSrcIds.indexOf(visible[destination.index]);
      newSrcIds.splice(Math.max(0, insertAt), 0, draggableId);
      updateBoard({
        ...activeBoard,
        columns: { ...activeBoard.columns, [srcColFull.id]: { ...srcColFull, cardIds: newSrcIds } },
      });
    } else {
      const newDstIds = [...dstColFull.cardIds];
      const dstVisible = getVisibleIds(newDstIds);
      const insertAt = destination.index >= dstVisible.length
        ? (dstVisible.at(-1) ? newDstIds.indexOf(dstVisible.at(-1)!) + 1 : newDstIds.length)
        : newDstIds.indexOf(dstVisible[destination.index]);
      newDstIds.splice(Math.max(0, insertAt), 0, draggableId);
      updateBoard({
        ...activeBoard,
        columns: {
          ...activeBoard.columns,
          [srcColFull.id]: { ...srcColFull, cardIds: newSrcIds },
          [dstColFull.id]: { ...dstColFull, cardIds: newDstIds },
        },
      });
    }
  };

  // ─── ボード CRUD ────────────────────────────────────────────
  const updateBoard = (board: FullBoard) => {
    setAppState({
      ...appState,
      boards: { ...appState.boards, [board.id]: board },
    });
  };

  const handleSelectBoard = (boardId: string) => {
    setAppState({ ...appState, activeBoardId: boardId });
    setSearch(''); setFilterPriority('全て'); setFilterAssignee('全て');
  };

  const handleAddBoard = (name: string, emoji: string) => {
    const id = `board-${Date.now()}`;
    const newBoard: FullBoard = {
      id, name, emoji,
      createdAt: new Date().toISOString().slice(0, 10),
      cards: {},
      columns: {
        'col-todo':       { id: 'col-todo',       title: '未着手',   color: '#6b7280', cardIds: [] },
        'col-inprogress': { id: 'col-inprogress', title: '進行中',   color: '#3b82f6', cardIds: [] },
        'col-review':     { id: 'col-review',     title: 'レビュー中', color: '#f59e0b', cardIds: [] },
        'col-done':       { id: 'col-done',       title: '完了',     color: '#10b981', cardIds: [] },
      },
      columnOrder: ['col-todo', 'col-inprogress', 'col-review', 'col-done'],
    };
    setAppState({
      ...appState,
      boards: { ...appState.boards, [id]: newBoard },
      boardOrder: [...appState.boardOrder, id],
      activeBoardId: id,
    });
    setBoardModalOpen(false);
  };

  const handleEditBoard = (name: string, emoji: string) => {
    if (!editingBoard) return;
    updateBoard({ ...editingBoard, name, emoji });
    setEditingBoard(null);
    setBoardModalOpen(false);
  };

  const handleDeleteBoard = (boardId: string) => {
    if (appState.boardOrder.length <= 1) return;
    const newOrder = appState.boardOrder.filter(id => id !== boardId);
    const newBoards = { ...appState.boards };
    delete newBoards[boardId];
    setAppState({
      ...appState,
      boards: newBoards,
      boardOrder: newOrder,
      activeBoardId: appState.activeBoardId === boardId ? newOrder[0] : appState.activeBoardId,
    });
  };

  // ─── カード CRUD ────────────────────────────────────────────
  const openEdit = (card: Card) => {
    setEditingCard(card); setAddToColumnId(null); setCardModalOpen(true);
  };
  const closeCardModal = () => {
    setCardModalOpen(false); setEditingCard(null); setAddToColumnId(null);
  };

  const handleSaveCard = (card: Card, columnId: string) => {
    const isNew = !activeBoard.cards[card.id];
    const newCards = { ...activeBoard.cards, [card.id]: card };

    if (isNew) {
      const col = activeBoard.columns[columnId];
      updateBoard({
        ...activeBoard,
        cards: newCards,
        columns: { ...activeBoard.columns, [columnId]: { ...col, cardIds: [...col.cardIds, card.id] } },
      });
    } else {
      const srcColId = Object.values(activeBoard.columns).find(c => c.cardIds.includes(card.id))?.id;
      if (srcColId && srcColId !== columnId) {
        const srcCol = activeBoard.columns[srcColId];
        const dstCol = activeBoard.columns[columnId];
        updateBoard({
          ...activeBoard,
          cards: newCards,
          columns: {
            ...activeBoard.columns,
            [srcColId]: { ...srcCol, cardIds: srcCol.cardIds.filter(id => id !== card.id) },
            [columnId]: { ...dstCol, cardIds: [...dstCol.cardIds, card.id] },
          },
        });
      } else {
        updateBoard({ ...activeBoard, cards: newCards });
      }
    }
    closeCardModal();
  };

  const handleDeleteCard = (cardId: string, columnId: string) => {
    const col = activeBoard.columns[columnId];
    if (!col) return;
    const newCards = { ...activeBoard.cards };
    delete newCards[cardId];
    updateBoard({
      ...activeBoard,
      cards: newCards,
      columns: { ...activeBoard.columns, [columnId]: { ...col, cardIds: col.cardIds.filter(id => id !== cardId) } },
    });
  };

  const clearFilters = () => { setSearch(''); setFilterPriority('全て'); setFilterAssignee('全て'); };

  const PRIORITIES = ['全て', '高', '中', '低'] as const;

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="h-screen flex bg-slate-100 dark:bg-[#0d0f14] overflow-hidden">

        {/* ══ サイドバー (2.1) ══ */}
        <BoardSidebar
          boards={allBoards}
          activeBoardId={appState.activeBoardId}
          onSelect={handleSelectBoard}
          onAdd={() => { setEditingBoard(null); setBoardModalOpen(true); }}
          onEdit={board => { setEditingBoard(board); setBoardModalOpen(true); }}
          onDelete={handleDeleteBoard}
        />

        {/* ══ メインエリア ══ */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* ── ヘッダー ── */}
          <header className="sticky top-0 z-20 flex items-center justify-between
            px-5 h-14 flex-shrink-0
            bg-white/90 dark:bg-slate-900/90
            border-b border-slate-200 dark:border-slate-800
            backdrop-blur-md shadow-sm">

            {/* ボード名 */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl">{activeBoard.emoji}</span>
              <h1 className="text-[15px] font-bold text-slate-800 dark:text-white tracking-tight truncate">
                {activeBoard.name}
              </h1>
            </div>

            {/* ツールバー */}
            <div className="flex items-center gap-2 flex-shrink-0">

              {/* 検索 (/ でフォーカス) */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="検索… (/)"
                  className="pl-8 pr-7 py-1.5 text-[13px] w-44 rounded-lg
                    border border-slate-200 dark:border-slate-700
                    bg-slate-50 dark:bg-slate-800
                    text-slate-700 dark:text-slate-200
                    placeholder-slate-400 dark:placeholder-slate-500
                    focus:outline-none focus:ring-2 focus:ring-violet-400/60 transition-all"
                />
                {search && (
                  <button onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* 優先度フィルター */}
              <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <SlidersHorizontal size={12} className="text-slate-400 mx-1" />
                {PRIORITIES.map(p => (
                  <button key={p} onClick={() => setFilterPriority(p)}
                    className={`text-[12px] px-2 py-1 rounded-md font-medium transition-all ${
                      filterPriority === p
                        ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}>
                    {p}
                  </button>
                ))}
              </div>

              {/* 担当者フィルター (2.5) */}
              <select
                value={filterAssignee}
                onChange={e => setFilterAssignee(e.target.value)}
                className="text-[12px] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700
                  bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300
                  focus:outline-none focus:ring-2 focus:ring-violet-400/60"
              >
                {assigneeList.map(a => <option key={a} value={a}>{a}</option>)}
              </select>

              {/* タスク追加 (N キー) */}
              <button
                onClick={() => openAdd(activeBoard.columnOrder[0])}
                className="flex items-center gap-1.5 px-3 py-1.5
                  bg-violet-600 hover:bg-violet-700 active:bg-violet-800
                  text-white text-[13px] font-semibold rounded-lg
                  shadow-sm shadow-violet-500/30 transition-all"
              >
                <Plus size={14} />
                追加 <kbd className="ml-1 text-[10px] opacity-60 font-mono">N</kbd>
              </button>

              {/* ダークモード */}
              <button onClick={() => setDarkMode(!darkMode)}
                title={darkMode ? 'ライトモード (⌘D)' : 'ダークモード (⌘D)'}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700
                  bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400
                  hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                {darkMode ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>
          </header>

          {/* ── 統計バー ── */}
          <StatsBar board={activeBoard} />

          {/* ── フィルター中バナー ── */}
          {isFiltering && (
            <div className="flex items-center justify-between px-5 py-1.5
              bg-violet-50 dark:bg-violet-900/20
              border-b border-violet-200 dark:border-violet-800/50 text-[12px] flex-shrink-0">
              <span className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400 font-medium">
                <Keyboard size={12} />
                フィルター適用中 — ドラッグ&ドロップは有効（非表示カードの順序は維持）
              </span>
              <button onClick={clearFilters}
                className="text-violet-600 dark:text-violet-400 hover:underline font-semibold">
                クリア (Esc)
              </button>
            </div>
          )}

          {/* ── ボード本体 ── */}
          <main className="flex-1 overflow-auto">
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex gap-4 p-5 h-full" style={{ minWidth: 'max-content' }}>
                {activeBoard.columnOrder.map(colId => {
                  const col = activeBoard.columns[colId];
                  if (!col) return null;
                  return (
                    <KanbanColumn
                      key={colId}
                      column={col}
                      cards={getFilteredCards(col)}
                      totalCount={col.cardIds.length}
                      searchQuery={search}
                      onAddCard={openAdd}
                      onEditCard={openEdit}
                      onDeleteCard={handleDeleteCard}
                    />
                  );
                })}
              </div>
            </DragDropContext>
          </main>
        </div>
      </div>

      {/* ══ カードモーダル ══ */}
      {cardModalOpen && (
        <CardModal
          card={editingCard}
          targetColumnId={addToColumnId}
          columns={activeBoard.columnOrder.map(id => activeBoard.columns[id]).filter(Boolean) as Column[]}
          onSave={handleSaveCard}
          onClose={closeCardModal}
        />
      )}

      {/* ══ ボードモーダル (2.1) ══ */}
      {boardModalOpen && (
        <BoardModal
          board={editingBoard}
          onSave={editingBoard ? handleEditBoard : handleAddBoard}
          onClose={() => { setBoardModalOpen(false); setEditingBoard(null); }}
        />
      )}
    </div>
  );
}
