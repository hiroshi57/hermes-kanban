import { useState } from 'react';
import { X, Calendar, User, Tag as TagIcon, FileText, Layers } from 'lucide-react';
import type { Card, Priority, Column } from '@/types';
import { resolveInitialColumnId } from '@/utils/boardUtils';

interface Props {
  card: Card | null;
  targetColumnId: string | null;
  columns: Column[];
  onSave: (card: Card, columnId: string) => void;
  onClose: () => void;
}

const PRIORITY_OPTIONS: Priority[] = ['高', '中', '低'];

const TAG_PRESETS = [
  { id: 't1', label: 'フロントエンド', color: '#6366f1' },
  { id: 't2', label: 'バックエンド',   color: '#10b981' },
  { id: 't3', label: 'パフォーマンス', color: '#f59e0b' },
  { id: 't4', label: 'セキュリティ',   color: '#ef4444' },
  { id: 't5', label: 'テスト',         color: '#8b5cf6' },
  { id: 't6', label: 'ドキュメント',   color: '#64748b' },
  { id: 't7', label: 'デザイン',       color: '#ec4899' },
  { id: 't8', label: 'インフラ',       color: '#0ea5e9' },
];

const ASSIGNEES = ['田中 太郎', '佐藤 花子', '鈴木 一郎', '山田 美咲', '伊藤 健二', '中村 愛'];

export default function CardModal({ card, targetColumnId, columns, onSave, onClose }: Props) {
  const isNew = !card;

  const [title,        setTitle]        = useState(card?.title ?? '');
  const [description,  setDescription]  = useState(card?.description ?? '');
  const [priority,     setPriority]     = useState<Priority>(card?.priority ?? '中');
  const [assignee,     setAssignee]     = useState(card?.assignee ?? ASSIGNEES[0]);
  const [dueDate,      setDueDate]      = useState(card?.dueDate ?? '');
  const [selectedTags, setSelectedTags] = useState(card?.tags ?? []);
  // B1 修正: 初期値を正しく計算
  const [columnId,     setColumnId]     = useState(() =>
    resolveInitialColumnId(targetColumnId, card, columns)
  );

  const toggleTag = (tag: typeof TAG_PRESETS[0]) => {
    setSelectedTags(prev =>
      prev.some(t => t.id === tag.id)
        ? prev.filter(t => t.id !== tag.id)
        : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    const saved: Card = {
      id:          card?.id ?? `card-${Date.now()}`,
      title:       title.trim(),
      description: description.trim(),
      priority,
      assignee,
      dueDate:     dueDate || null,
      tags:        selectedTags,
      createdAt:   card?.createdAt ?? new Date().toISOString().slice(0, 10),
    };
    onSave(saved, columnId || columns[0]?.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      {/* バックドロップ */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* モーダル本体 */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl
        shadow-2xl shadow-black/20 dark:shadow-black/60 overflow-hidden
        animate-in fade-in zoom-in-95 duration-150">

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4
          bg-gradient-to-r from-violet-600 to-indigo-600">
          <h2 className="text-[15px] font-semibold text-white">
            {isNew ? '✦ 新しいタスクを追加' : '✎ タスクを編集'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-violet-200 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* フォーム */}
        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">

          {/* タイトル */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold
              text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              <FileText size={11} />
              タイトル <span className="text-red-400 normal-case font-medium">必須</span>
            </label>
            <input
              type="text"
              id="modal-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="タスクのタイトルを入力"
              autoFocus
              className="w-full px-3.5 py-2.5 text-sm rounded-xl
                border border-slate-200 dark:border-slate-700
                bg-slate-50 dark:bg-slate-800
                text-slate-800 dark:text-slate-100
                placeholder-slate-300 dark:placeholder-slate-600
                focus:outline-none focus:ring-2 focus:ring-violet-400/60 focus:border-transparent
                transition"
            />
          </div>

          {/* 説明 */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400
              uppercase tracking-wider block mb-1.5">
              説明
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="タスクの詳細を入力（任意）"
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl
                border border-slate-200 dark:border-slate-700
                bg-slate-50 dark:bg-slate-800
                text-slate-800 dark:text-slate-100
                placeholder-slate-300 dark:placeholder-slate-600
                focus:outline-none focus:ring-2 focus:ring-violet-400/60 focus:border-transparent
                transition resize-none leading-relaxed"
            />
          </div>

          {/* 優先度 + ステータス */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400
                uppercase tracking-wider block mb-1.5">
                優先度
              </label>
              <div className="flex gap-1.5">
                {PRIORITY_OPTIONS.map(p => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                      priority === p
                        ? p === '高'
                          ? 'bg-red-500 border-red-500 text-white shadow-sm shadow-red-500/30'
                          : p === '中'
                          ? 'bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-500/30'
                          : 'bg-slate-500 border-slate-500 text-white shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 bg-transparent'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-semibold
                text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                <Layers size={11} />
                ステータス
              </label>
              <select
                value={columnId}
                onChange={e => setColumnId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl
                  border border-slate-200 dark:border-slate-700
                  bg-slate-50 dark:bg-slate-800
                  text-slate-800 dark:text-slate-100
                  focus:outline-none focus:ring-2 focus:ring-violet-400/60 focus:border-transparent"
              >
                {columns.map(col => (
                  <option key={col.id} value={col.id}>{col.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 担当者 + 期限 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-semibold
                text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                <User size={11} />
                担当者
              </label>
              <select
                value={assignee}
                onChange={e => setAssignee(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl
                  border border-slate-200 dark:border-slate-700
                  bg-slate-50 dark:bg-slate-800
                  text-slate-800 dark:text-slate-100
                  focus:outline-none focus:ring-2 focus:ring-violet-400/60 focus:border-transparent"
              >
                {ASSIGNEES.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-semibold
                text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                <Calendar size={11} />
                期限日
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl
                  border border-slate-200 dark:border-slate-700
                  bg-slate-50 dark:bg-slate-800
                  text-slate-800 dark:text-slate-100
                  focus:outline-none focus:ring-2 focus:ring-violet-400/60 focus:border-transparent"
              />
            </div>
          </div>

          {/* タグ */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold
              text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              <TagIcon size={11} />
              タグ
            </label>
            <div className="flex flex-wrap gap-2">
              {TAG_PRESETS.map(tag => {
                const active = selectedTags.some(t => t.id === tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag)}
                    style={active ? { backgroundColor: tag.color, borderColor: tag.color } : {}}
                    className={`text-[12px] px-2.5 py-1 rounded-full font-medium border
                      transition-all duration-150
                      ${active
                        ? 'text-white scale-105'
                        : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="flex gap-2.5 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
          <p className="flex-1 text-[11px] text-slate-400 self-center">
            ⌘ Enter で保存
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-500
              border border-slate-200 dark:border-slate-700 rounded-xl
              hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="px-5 py-2 text-sm font-semibold text-white
              bg-violet-600 hover:bg-violet-700 active:bg-violet-800
              disabled:opacity-40 disabled:cursor-not-allowed
              rounded-xl shadow-sm shadow-violet-500/30
              transition-all"
          >
            {isNew ? '追加する' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  );
}
