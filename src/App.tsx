import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { Plus, Search, Moon, Sun, SlidersHorizontal, X, Keyboard, Activity, Archive, ArchiveRestore, LogOut } from 'lucide-react';
import KanbanColumn from '@/components/KanbanColumn';
import BoardSidebar from '@/components/BoardSidebar';
import StatsBar from '@/components/StatsBar';
// ── オンデマンドでロードするモーダル（コード分割でバンドル削減）──
const CardModal    = lazy(() => import('@/components/CardModal'));
const BoardModal   = lazy(() => import('@/components/BoardModal'));
const ActivityPanel = lazy(() => import('@/components/ActivityPanel'));
import type { AppState, Card, Column, FullBoard, ActivityEntry, ActivityAction, SortBy } from '@/types';
import { loadAppState, saveAppState, initSupabaseSync, subscribeToRealtime } from '@/lib/storage';
import { matchesFilter, sortCards } from '@/utils/boardUtils';
import { isOverdue } from '@/utils/date';
import { useAuth } from '@/contexts/useAuth';
import { acceptInvite, popPendingInvite, savePendingInvite, upsertMyProfile } from '@/lib/sharing';
// ShareBoardModal はオンデマンドで読み込む
const ShareBoardModal = lazy(() => import('@/components/ShareBoardModal'));
// PWA プロンプト（インストール + 更新通知）
const PwaPrompt = lazy(() => import('@/components/PwaPrompt'));
// EoM ダッシュボード（オンデマンド）
const EomDashboard = lazy(() => import('@/components/EomDashboard'));

// ─── 活動ログ生成 ────────────────────────────────────────────────
function makeLog(
  boardId: string,
  action: ActivityAction,
  detail: string,
  cardId?: string
): ActivityEntry {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    boardId, cardId, action, detail,
    timestamp: new Date().toISOString(),
  };
}

// ─── ストレージフック ─────────────────────────────────────────────
function useAppState() {
  const [appState, setAppState] = useState<AppState>(() => loadAppState());

  const update = useCallback((next: AppState) => {
    setAppState(next);
    saveAppState(next);
  }, []);

  return [appState, update] as const;
}

// ─── 期限通知 (4.5) ──────────────────────────────────────────────
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => undefined);
  }
}

function sendOverdueNotification(titles: string[]) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (titles.length === 0) return;
  const body = titles.slice(0, 3).join('、') + (titles.length > 3 ? ` 他${titles.length - 3}件` : '');
  new Notification('⚠️ 期限超過のタスク', { body, icon: '/favicon.svg' });
}

// ─── メインコンポーネント ─────────────────────────────────────────
export default function App() {
  const [appState, setAppState] = useAppState();
  const { user, signOut, isConfigured } = useAuth();
  const [darkMode, setDarkMode] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
  );

  // ── タブ切り替え (kanban | agents) ──
  const [activeTab, setActiveTab] = useState<'kanban' | 'agents'>('kanban');

  // ── フィルター ──
  const [search,         setSearch]         = useState('');
  const [filterPriority, setFilterPriority] = useState('全て');
  const [filterAssignee, setFilterAssignee] = useState('全て');
  const [showArchived,   setShowArchived]   = useState(false);    // 4.3
  const searchRef = useRef<HTMLInputElement>(null);

  // ── ソート（列ごと）2.6 ──
  const [columnSorts, setColumnSorts] = useState<Record<string, SortBy>>({});

  // ── モーダル ──
  const [editingCard,    setEditingCard]    = useState<Card | null>(null);
  const [addToColumnId,  setAddToColumnId]  = useState<string | null>(null);
  const [cardModalOpen,  setCardModalOpen]  = useState(false);
  const [boardModalOpen, setBoardModalOpen] = useState(false);
  const [editingBoard,   setEditingBoard]   = useState<FullBoard | null>(null);
  const [activityOpen,   setActivityOpen]   = useState(false);   // 2.3
  const [shareBoard,     setShareBoard]     = useState<typeof activeBoard | null>(null); // 3.5

  // ── アクティブボード ──
  const activeBoard = appState.boards[appState.activeBoardId];
  const allBoards   = appState.boardOrder.map(id => appState.boards[id]).filter(Boolean);
  const assigneeList = ['全て', ...Array.from(
    new Set(Object.values(activeBoard.cards).map(c => c.assignee))
  ).sort()];

  const isFiltering = search.trim() !== '' || filterPriority !== '全て' || filterAssignee !== '全て';

  // ── 活動ログを追記するヘルパー ──
  const addLog = useCallback((entry: ActivityEntry, current: AppState) => ({
    ...current,
    activityLog: [entry, ...(current.activityLog ?? [])].slice(0, 200),
  }), []);

  // ── Supabase 初期化 + Realtime 購読 + 招待処理（起動時 1 回）──
  useEffect(() => {
    async function init() {
      // プロフィールを同期（ログイン後のメンバー名表示のため）
      await upsertMyProfile();

      // URL の ?invite=TOKEN を検出 → localStorage に保存
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('invite');
      if (urlToken) {
        savePendingInvite(urlToken);
        // URL をクリーン（token を消す）
        const url = new URL(window.location.href);
        url.searchParams.delete('invite');
        window.history.replaceState({}, '', url.toString());
      }

      // 保留中の招待を受諾
      const pendingToken = popPendingInvite();
      if (pendingToken) {
        const result = await acceptInvite(pendingToken);
        if (result) {
          // 招待されたボードを選択するよう Supabase から再取得
          await initSupabaseSync(appState, (next) => {
            setAppState({ ...next, activeBoardId: result.boardId });
          });
        }
      } else {
        await initSupabaseSync(appState, setAppState);
      }
    }

    init();
    const unsubscribe = subscribeToRealtime(setAppState);
    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 通知初期化 (4.5) ──
  useEffect(() => {
    requestNotificationPermission();
    const overdueTitles = Object.values(activeBoard.cards)
      .filter(c => !c.archived && isOverdue(c.dueDate))
      .map(c => c.title);
    sendOverdueNotification(overdueTitles);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState.activeBoardId]);

  // ── カード追加（useEffect より前に宣言）──
  const openAdd = useCallback((columnId: string) => {
    setEditingCard(null); setAddToColumnId(columnId); setCardModalOpen(true);
  }, []);

  // ── キーボードショートカット (4.1) ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
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
          setSearch(''); setFilterPriority('全て'); setFilterAssignee('全て');
          break;
        case 'a': case 'A':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            setActivityOpen(o => !o);
          }
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
  }, [activeBoard.columnOrder, openAdd]);

  // ── フィルター ──
  const getFilteredCards = useCallback(
    (col: Column): Card[] => {
      const raw = col.cardIds
        .map(id => activeBoard.cards[id])
        .filter((c): c is Card =>
          c !== undefined &&
          (showArchived ? c.archived : !c.archived) &&
          matchesFilter(c, search, filterPriority, filterAssignee)
        );
      return sortCards(raw, columnSorts[col.id] ?? 'none');
    },
    [activeBoard.cards, search, filterPriority, filterAssignee, showArchived, columnSorts]
  );

  // ── Drag & Drop ──
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
        return c ? !c.archived && matchesFilter(c, search, filterPriority, filterAssignee) : false;
      });

    const newSrcIds = [...srcColFull.cardIds];
    const actualSrcIdx = newSrcIds.indexOf(draggableId);
    if (actualSrcIdx === -1) return;
    newSrcIds.splice(actualSrcIdx, 1);

    let next: AppState;
    if (source.droppableId === destination.droppableId) {
      const visible = getVisibleIds(newSrcIds);
      const insertAt = destination.index >= visible.length
        ? (visible.at(-1) ? newSrcIds.indexOf(visible.at(-1)!) + 1 : newSrcIds.length)
        : newSrcIds.indexOf(visible[destination.index]);
      newSrcIds.splice(Math.max(0, insertAt), 0, draggableId);
      next = updateBoardInState(appState, {
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
      const movedCard = activeBoard.cards[draggableId];
      next = updateBoardInState(appState, {
        ...activeBoard,
        columns: {
          ...activeBoard.columns,
          [srcColFull.id]: { ...srcColFull, cardIds: newSrcIds },
          [dstColFull.id]: { ...dstColFull, cardIds: newDstIds },
        },
      });
      if (movedCard) {
        next = addLog(makeLog(
          activeBoard.id, 'card_moved',
          `「${movedCard.title}」を「${srcColFull.title}」→「${dstColFull.title}」へ移動`,
          movedCard.id
        ), next);
      }
    }
    setAppState(next);
  };

  // ── ボード CRUD ──
  function updateBoardInState(state: AppState, board: FullBoard): AppState {
    return { ...state, boards: { ...state.boards, [board.id]: board } };
  }

  const handleSelectBoard = (boardId: string) => {
    setAppState({ ...appState, activeBoardId: boardId });
    setSearch(''); setFilterPriority('全て'); setFilterAssignee('全て');
    setColumnSorts({});
  };

  const handleAddBoard = (name: string, emoji: string) => {
    const id = `board-${Date.now()}`;
    const newBoard: FullBoard = {
      id, name, emoji, createdAt: new Date().toISOString().slice(0, 10),
      cards: {},
      columns: {
        'col-todo':       { id: 'col-todo',       title: '未着手',   color: '#6b7280', cardIds: [] },
        'col-inprogress': { id: 'col-inprogress', title: '進行中',   color: '#3b82f6', cardIds: [] },
        'col-review':     { id: 'col-review',     title: 'レビュー中', color: '#f59e0b', cardIds: [] },
        'col-done':       { id: 'col-done',       title: '完了',     color: '#10b981', cardIds: [] },
      },
      columnOrder: ['col-todo', 'col-inprogress', 'col-review', 'col-done'],
    };
    let next: AppState = {
      ...appState,
      boards: { ...appState.boards, [id]: newBoard },
      boardOrder: [...appState.boardOrder, id],
      activeBoardId: id,
    };
    next = addLog(makeLog(id, 'board_created', `ボード「${name}」を作成`), next);
    setAppState(next);
    setBoardModalOpen(false);
  };

  const handleEditBoard = (name: string, emoji: string) => {
    if (!editingBoard) return;
    let next = updateBoardInState(appState, { ...editingBoard, name, emoji });
    next = addLog(makeLog(editingBoard.id, 'board_updated', `ボード名を「${name}」に変更`), next);
    setAppState(next);
    setEditingBoard(null); setBoardModalOpen(false);
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

  // ── カード CRUD ──
  const openEdit = (card: Card) => {
    setEditingCard(card); setAddToColumnId(null); setCardModalOpen(true);
  };
  const closeCardModal = () => {
    setCardModalOpen(false); setEditingCard(null); setAddToColumnId(null);
  };

  const handleSaveCard = (card: Card, columnId: string) => {
    const isNew = !activeBoard.cards[card.id];
    const newCards = { ...activeBoard.cards, [card.id]: card };
    let newBoard: FullBoard;

    if (isNew) {
      const col = activeBoard.columns[columnId];
      newBoard = {
        ...activeBoard,
        cards: newCards,
        columns: { ...activeBoard.columns, [columnId]: { ...col, cardIds: [...col.cardIds, card.id] } },
      };
    } else {
      const srcColId = Object.values(activeBoard.columns).find(c => c.cardIds.includes(card.id))?.id;
      if (srcColId && srcColId !== columnId) {
        const srcCol = activeBoard.columns[srcColId];
        const dstCol = activeBoard.columns[columnId];
        newBoard = {
          ...activeBoard,
          cards: newCards,
          columns: {
            ...activeBoard.columns,
            [srcColId]: { ...srcCol, cardIds: srcCol.cardIds.filter(id => id !== card.id) },
            [columnId]: { ...dstCol, cardIds: [...dstCol.cardIds, card.id] },
          },
        };
      } else {
        newBoard = { ...activeBoard, cards: newCards };
      }
    }

    let next = updateBoardInState(appState, newBoard);
    next = addLog(makeLog(
      activeBoard.id,
      isNew ? 'card_created' : 'card_updated',
      isNew ? `カード「${card.title}」を作成` : `カード「${card.title}」を更新`,
      card.id
    ), next);
    setAppState(next);
    closeCardModal();
  };

  const handleDeleteCard = (cardId: string, columnId: string) => {
    const col = activeBoard.columns[columnId];
    if (!col) return;
    const card = activeBoard.cards[cardId];
    const newCards = { ...activeBoard.cards };
    delete newCards[cardId];
    let next = updateBoardInState(appState, {
      ...activeBoard,
      cards: newCards,
      columns: { ...activeBoard.columns, [columnId]: { ...col, cardIds: col.cardIds.filter(id => id !== cardId) } },
    });
    if (card) {
      next = addLog(makeLog(activeBoard.id, 'card_deleted', `カード「${card.title}」を削除`, cardId), next);
    }
    setAppState(next);
  };

  // 4.3 アーカイブ
  const handleArchiveCard = (cardId: string) => {
    const card = activeBoard.cards[cardId];
    if (!card) return;
    const updated = { ...card, archived: !card.archived };
    let next = updateBoardInState(appState, {
      ...activeBoard,
      cards: { ...activeBoard.cards, [cardId]: updated },
    });
    next = addLog(makeLog(
      activeBoard.id, 'card_archived',
      updated.archived ? `カード「${card.title}」をアーカイブ` : `カード「${card.title}」をアーカイブから復元`,
      cardId
    ), next);
    setAppState(next);
  };

  const clearFilters = () => { setSearch(''); setFilterPriority('全て'); setFilterAssignee('全て'); };

  const PRIORITIES = ['全て', '高', '中', '低'] as const;

  const archivedCount = Object.values(activeBoard.cards).filter(c => c.archived).length;
  const activityCount = (appState.activityLog ?? []).filter(e => e.boardId === activeBoard.id).length;

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="h-screen flex bg-slate-100 dark:bg-[#0d0f14] overflow-hidden">

        {/* ══ サイドバー ══ */}
        <BoardSidebar
          boards={allBoards}
          activeBoardId={appState.activeBoardId}
          onSelect={handleSelectBoard}
          onAdd={() => { setEditingBoard(null); setBoardModalOpen(true); }}
          onEdit={board => { setEditingBoard(board); setBoardModalOpen(true); }}
          onDelete={handleDeleteBoard}
          onShare={isConfigured ? board => setShareBoard(board) : undefined}
        />

        {/* ══ メインエリア ══ */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* ── ヘッダー ── */}
          <header className="sticky top-0 z-20 flex items-center justify-between
            px-5 h-14 flex-shrink-0
            bg-white/90 dark:bg-slate-900/90
            border-b border-slate-200 dark:border-slate-800
            backdrop-blur-md shadow-sm">

            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl">{activeBoard.emoji}</span>
              <h1 className="text-[15px] font-bold text-slate-800 dark:text-white tracking-tight truncate">
                {activeBoard.name}
              </h1>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* 検索 */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input ref={searchRef} type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="検索… (/)"
                  className="pl-8 pr-7 py-1.5 text-[13px] w-44 rounded-lg
                    border border-slate-200 dark:border-slate-700
                    bg-slate-50 dark:bg-slate-800
                    text-slate-700 dark:text-slate-200
                    placeholder-slate-400 dark:placeholder-slate-500
                    focus:outline-none focus:ring-2 focus:ring-violet-400/60 transition-all" />
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
                    }`}>{p}</button>
                ))}
              </div>

              {/* 担当者フィルター */}
              <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}
                className="text-[12px] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700
                  bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300
                  focus:outline-none focus:ring-2 focus:ring-violet-400/60">
                {assigneeList.map(a => <option key={a} value={a}>{a}</option>)}
              </select>

              {/* 4.3 アーカイブ表示トグル */}
              <button onClick={() => setShowArchived(!showArchived)}
                title={showArchived ? 'アクティブを表示' : `アーカイブを表示 (${archivedCount}件)`}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[12px] font-medium transition-all ${
                  showArchived
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-amber-500 hover:border-amber-300'
                }`}>
                {showArchived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
                {showArchived ? '復元モード' : archivedCount > 0 ? archivedCount : ''}
              </button>

              {/* 2.3 活動ログ */}
              <button onClick={() => setActivityOpen(!activityOpen)}
                title="活動ログ (⌘A)"
                className={`relative p-1.5 rounded-lg border transition-colors ${
                  activityOpen
                    ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-300 dark:border-violet-700 text-violet-500'
                    : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-violet-500 hover:border-violet-300'
                }`}>
                <Activity size={15} />
                {activityCount > 0 && !activityOpen && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-bold
                    bg-violet-500 text-white rounded-full flex items-center justify-center">
                    {activityCount > 9 ? '9+' : activityCount}
                  </span>
                )}
              </button>

              {/* タスク追加 */}
              <button onClick={() => openAdd(activeBoard.columnOrder[0])}
                className="flex items-center gap-1.5 px-3 py-1.5
                  bg-violet-600 hover:bg-violet-700 active:bg-violet-800
                  text-white text-[13px] font-semibold rounded-lg
                  shadow-sm shadow-violet-500/30 transition-all">
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

              {/* ユーザーアバター & ログアウト (3.4) */}
              {isConfigured && user && (
                <div className="flex items-center gap-1.5">
                  {user.user_metadata?.['avatar_url'] ? (
                    <img
                      src={user.user_metadata['avatar_url'] as string}
                      alt={user.user_metadata?.['full_name'] as string ?? 'User'}
                      className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-600"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center
                                    text-white text-xs font-bold">
                      {(user.email ?? '?')[0].toUpperCase()}
                    </div>
                  )}
                  <button
                    onClick={() => signOut()}
                    title="ログアウト"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700
                      bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400
                      hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 hover:border-red-200
                      transition-colors"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* ── 統計バー ── */}
          <StatsBar board={activeBoard} />

          {/* ── フィルターバナー ── */}
          {(isFiltering || showArchived) && (
            <div className="flex items-center justify-between px-5 py-1.5
              bg-violet-50 dark:bg-violet-900/20
              border-b border-violet-200 dark:border-violet-800/50 text-[12px] flex-shrink-0">
              <span className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400 font-medium">
                <Keyboard size={12} />
                {showArchived ? '📦 アーカイブ済みを表示中' : 'フィルター適用中'}
              </span>
              <button onClick={() => { clearFilters(); setShowArchived(false); }}
                className="text-violet-600 dark:text-violet-400 hover:underline font-semibold">
                クリア (Esc)
              </button>
            </div>
          )}

          {/* ── タブ切り替え ── */}
          <div className="flex border-b border-slate-200 dark:border-slate-700 px-5 bg-white dark:bg-slate-900">
            <button
              onClick={() => setActiveTab('kanban')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px
                ${activeTab === 'kanban'
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
            >
              📋 カンバン
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px
                ${activeTab === 'agents'
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
            >
              🤖 エージェント
            </button>
          </div>

          {/* ── EoM ダッシュボード ── */}
          {activeTab === 'agents' && (
            <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950">
              <Suspense fallback={<div className="p-8 text-center text-slate-400">読込中...</div>}>
                <EomDashboard darkMode={darkMode} />
              </Suspense>
            </main>
          )}

          {/* ── ボード ── */}
          {activeTab === 'kanban' && (
          <main className="flex-1 overflow-auto">
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex gap-4 p-5" style={{ minWidth: 'max-content', minHeight: '100%' }}>
                {activeBoard.columnOrder.map(colId => {
                  const col = activeBoard.columns[colId];
                  if (!col) return null;
                  const totalCount = col.cardIds.filter(id => {
                    const c = activeBoard.cards[id];
                    return c ? (showArchived ? c.archived : !c.archived) : false;
                  }).length;
                  return (
                    <KanbanColumn
                      key={colId}
                      column={col}
                      cards={getFilteredCards(col)}
                      totalCount={totalCount}
                      searchQuery={search}
                      sortBy={columnSorts[colId] ?? 'none'}
                      onSortChange={(id, sort) => setColumnSorts(prev => ({ ...prev, [id]: sort }))}
                      onAddCard={openAdd}
                      onEditCard={openEdit}
                      onDeleteCard={handleDeleteCard}
                      onArchiveCard={handleArchiveCard}
                    />
                  );
                })}
              </div>
            </DragDropContext>
          </main>
          )}
        </div>
      </div>

      {/* ══ モーダル群（lazy: 初回クリック時だけ JS をロード）══ */}
      <Suspense fallback={null}>
        {/* 3.5 共有モーダル */}
        {shareBoard && (
          <ShareBoardModal
            boardId={shareBoard.id}
            boardName={shareBoard.name}
            boardEmoji={shareBoard.emoji}
            onClose={() => setShareBoard(null)}
          />
        )}
        {cardModalOpen && (
          <CardModal
            card={editingCard}
            targetColumnId={addToColumnId}
            columns={activeBoard.columnOrder.map(id => activeBoard.columns[id]).filter(Boolean) as Column[]}
            onSave={handleSaveCard}
            onClose={closeCardModal}
          />
        )}
        {boardModalOpen && (
          <BoardModal
            board={editingBoard}
            onSave={editingBoard ? handleEditBoard : handleAddBoard}
            onClose={() => { setBoardModalOpen(false); setEditingBoard(null); }}
          />
        )}
        {activityOpen && (
          <ActivityPanel
            entries={(appState.activityLog ?? []).filter(e => e.boardId === activeBoard.id)}
            onClose={() => setActivityOpen(false)}
          />
        )}
      </Suspense>

      {/* ══ PWA プロンプト（インストール促進・更新通知）══ */}
      <Suspense fallback={null}>
        <PwaPrompt />
      </Suspense>
    </div>
  );
}
