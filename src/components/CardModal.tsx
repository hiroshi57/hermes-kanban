import { useState, useRef } from 'react';
import {
  X, Calendar, User, Tag as TagIcon, FileText, Layers,
  Plus, Trash2, CheckSquare, MessageSquare, Send, Check,
} from 'lucide-react';
import type { Card, Priority, Column, ChecklistItem, Comment } from '@/types';
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

// カスタムタグ用カラーパレット (4.4)
const CUSTOM_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#64748b','#ec4899','#0ea5e9','#f97316','#14b8a6'];

const ASSIGNEES = ['田中 太郎', '佐藤 花子', '鈴木 一郎', '山田 美咲', '伊藤 健二', '中村 愛'];
const TABS = ['詳細', 'チェックリスト', 'コメント'] as const;
type Tab = typeof TABS[number];

export default function CardModal({ card, targetColumnId, columns, onSave, onClose }: Props) {
  const isNew = !card;

  const [activeTab,    setActiveTab]    = useState<Tab>('詳細');
  const [title,        setTitle]        = useState(card?.title ?? '');
  const [description,  setDescription]  = useState(card?.description ?? '');
  const [priority,     setPriority]     = useState<Priority>(card?.priority ?? '中');
  const [assignee,     setAssignee]     = useState(card?.assignee ?? ASSIGNEES[0]);
  const [dueDate,      setDueDate]      = useState(card?.dueDate ?? '');
  const [selectedTags, setSelectedTags] = useState(card?.tags ?? []);
  const [columnId,     setColumnId]     = useState(() =>
    resolveInitialColumnId(targetColumnId, card, columns)
  );

  // 2.4 チェックリスト
  const [checklist,    setChecklist]    = useState<ChecklistItem[]>(card?.checklist ?? []);
  const [newCheckText, setNewCheckText] = useState('');

  // 2.2 コメント
  const [comments,     setComments]     = useState<Comment[]>(card?.comments ?? []);
  const [newComment,   setNewComment]   = useState('');
  const commentRef = useRef<HTMLTextAreaElement>(null);

  // 4.4 カスタムタグ
  const [customTagLabel, setCustomTagLabel] = useState('');
  const [customTagColor, setCustomTagColor] = useState(CUSTOM_COLORS[0]);
  const [showCustomTag,  setShowCustomTag]  = useState(false);

  const toggleTag = (tag: typeof TAG_PRESETS[0]) => {
    setSelectedTags(prev =>
      prev.some(t => t.id === tag.id)
        ? prev.filter(t => t.id !== tag.id)
        : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    if (!customTagLabel.trim()) return;
    const newTag = { id: `custom-${Date.now()}`, label: customTagLabel.trim(), color: customTagColor };
    setSelectedTags(prev => [...prev, newTag]);
    setCustomTagLabel('');
    setShowCustomTag(false);
  };

  // チェックリスト操作
  const addCheckItem = () => {
    if (!newCheckText.trim()) return;
    setChecklist(prev => [...prev, { id: `cl-${Date.now()}`, text: newCheckText.trim(), done: false }]);
    setNewCheckText('');
  };
  const toggleCheck = (id: string) =>
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, done: !c.done } : c));
  const removeCheck = (id: string) =>
    setChecklist(prev => prev.filter(c => c.id !== id));

  // コメント操作
  const addComment = () => {
    if (!newComment.trim()) return;
    const c: Comment = {
      id: `cmt-${Date.now()}`,
      author: assignee,
      text: newComment.trim(),
      createdAt: new Date().toISOString(),
    };
    setComments(prev => [...prev, c]);
    setNewComment('');
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
      checklist,
      comments,
      archived:    card?.archived ?? false,
    };
    onSave(saved, columnId || columns[0]?.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
  };

  const doneCount = checklist.filter(c => c.done).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onKeyDown={handleKeyDown}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl
        shadow-2xl shadow-black/20 dark:shadow-black/60 overflow-hidden flex flex-col max-h-[90vh]">

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4
          bg-gradient-to-r from-violet-600 to-indigo-600 flex-shrink-0">
          <h2 className="text-[15px] font-semibold text-white">
            {isNew ? '✦ 新しいタスクを追加' : '✎ タスクを編集'}
          </h2>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-violet-200 hover:text-white hover:bg-white/20 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* タブ */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}>
              {tab}
              {tab === 'チェックリスト' && checklist.length > 0 && (
                <span className="ml-1.5 text-[11px] bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded-full">
                  {doneCount}/{checklist.length}
                </span>
              )}
              {tab === 'コメント' && comments.length > 0 && (
                <span className="ml-1.5 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full">
                  {comments.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* タブコンテンツ */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">

          {/* ── 詳細タブ ── */}
          {activeTab === '詳細' && (
            <div className="px-6 py-5 space-y-4">
              {/* タイトル */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  <FileText size={11} /> タイトル <span className="text-red-400 normal-case font-medium">必須</span>
                </label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="タスクのタイトルを入力" autoFocus
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700
                    bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100
                    placeholder-slate-300 dark:placeholder-slate-600
                    focus:outline-none focus:ring-2 focus:ring-violet-400/60 focus:border-transparent transition" />
              </div>

              {/* 説明 */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">説明</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="タスクの詳細を入力（任意）" rows={3}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700
                    bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100
                    placeholder-slate-300 dark:placeholder-slate-600
                    focus:outline-none focus:ring-2 focus:ring-violet-400/60 focus:border-transparent transition resize-none leading-relaxed" />
              </div>

              {/* 優先度 + ステータス */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">優先度</label>
                  <div className="flex gap-1.5">
                    {PRIORITY_OPTIONS.map(p => (
                      <button key={p} onClick={() => setPriority(p)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                          priority === p
                            ? p === '高' ? 'bg-red-500 border-red-500 text-white shadow-sm shadow-red-500/30'
                              : p === '中' ? 'bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-500/30'
                              : 'bg-slate-500 border-slate-500 text-white shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 bg-transparent'
                        }`}>{p}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    <Layers size={11} /> ステータス
                  </label>
                  <select value={columnId} onChange={e => setColumnId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700
                      bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100
                      focus:outline-none focus:ring-2 focus:ring-violet-400/60 focus:border-transparent">
                    {columns.map(col => <option key={col.id} value={col.id}>{col.title}</option>)}
                  </select>
                </div>
              </div>

              {/* 担当者 + 期限 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    <User size={11} /> 担当者
                  </label>
                  <select value={assignee} onChange={e => setAssignee(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700
                      bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100
                      focus:outline-none focus:ring-2 focus:ring-violet-400/60 focus:border-transparent">
                    {ASSIGNEES.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    <Calendar size={11} /> 期限日
                  </label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700
                      bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100
                      focus:outline-none focus:ring-2 focus:ring-violet-400/60 focus:border-transparent" />
                </div>
              </div>

              {/* タグ (4.4 カスタムタグ含む) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <TagIcon size={11} /> タグ
                  </label>
                  <button onClick={() => setShowCustomTag(!showCustomTag)}
                    className="text-[11px] text-violet-500 hover:text-violet-600 font-medium flex items-center gap-1">
                    <Plus size={11} /> カスタム
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TAG_PRESETS.map(tag => {
                    const active = selectedTags.some(t => t.id === tag.id);
                    return (
                      <button key={tag.id} onClick={() => toggleTag(tag)}
                        style={active ? { backgroundColor: tag.color, borderColor: tag.color } : {}}
                        className={`text-[12px] px-2.5 py-1 rounded-full font-medium border transition-all duration-150 ${
                          active
                            ? 'text-white scale-105'
                            : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}>{tag.label}</button>
                    );
                  })}
                  {/* カスタムタグ表示 */}
                  {selectedTags.filter(t => t.id.startsWith('custom-')).map(tag => (
                    <span key={tag.id}
                      className="text-[12px] px-2.5 py-1 rounded-full font-medium text-white flex items-center gap-1"
                      style={{ backgroundColor: tag.color }}>
                      {tag.label}
                      <button onClick={() => setSelectedTags(p => p.filter(t2 => t2.id !== tag.id))}>
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                {/* カスタムタグ追加フォーム */}
                {showCustomTag && (
                  <div className="mt-2 flex items-center gap-2">
                    <input type="text" value={customTagLabel} onChange={e => setCustomTagLabel(e.target.value)}
                      placeholder="タグ名"
                      className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700
                        bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100
                        focus:outline-none focus:ring-2 focus:ring-violet-400/60" />
                    <div className="flex gap-1">
                      {CUSTOM_COLORS.map(c => (
                        <button key={c} onClick={() => setCustomTagColor(c)}
                          className={`w-5 h-5 rounded-full border-2 transition-transform ${customTagColor === c ? 'scale-125 border-white' : 'border-transparent'}`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <button onClick={addCustomTag}
                      className="px-2.5 py-1.5 text-xs bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700">
                      追加
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── チェックリストタブ (2.4) ── */}
          {activeTab === 'チェックリスト' && (
            <div className="px-6 py-5">
              {checklist.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-slate-400">{doneCount}/{checklist.length} 完了</span>
                    <span className="text-[11px] font-bold text-violet-500">
                      {checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${doneCount === checklist.length ? 'bg-emerald-500' : 'bg-violet-500'}`}
                      style={{ width: `${checklist.length > 0 ? (doneCount / checklist.length) * 100 : 0}%` }} />
                  </div>
                </div>
              )}

              <div className="space-y-1.5 mb-4">
                {checklist.map(item => (
                  <div key={item.id}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 group transition-colors">
                    <button onClick={() => toggleCheck(item.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        item.done
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 dark:border-slate-600 hover:border-violet-400'
                      }`}>
                      {item.done && <Check size={11} />}
                    </button>
                    <span className={`flex-1 text-sm ${item.done ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {item.text}
                    </span>
                    <button onClick={() => removeCheck(item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-300 hover:text-red-400">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input type="text" value={newCheckText} onChange={e => setNewCheckText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addCheckItem(); }}
                  placeholder="チェック項目を追加… (Enter)"
                  className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700
                    bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100
                    placeholder-slate-300 dark:placeholder-slate-600
                    focus:outline-none focus:ring-2 focus:ring-violet-400/60 transition" />
                <button onClick={addCheckItem}
                  disabled={!newCheckText.trim()}
                  className="px-3 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl transition-all">
                  <CheckSquare size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── コメントタブ (2.2) ── */}
          {activeTab === 'コメント' && (
            <div className="px-6 py-5">
              <div className="space-y-3 mb-4">
                {comments.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-slate-300 dark:text-slate-700">
                    <MessageSquare size={28} className="mb-2" />
                    <p className="text-sm">まだコメントがありません</p>
                  </div>
                ) : (
                  comments.map(cmt => (
                    <div key={cmt.id} className="flex gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600
                        flex items-center justify-center flex-shrink-0">
                        <User size={12} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">{cmt.author}</span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(cmt.createdAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed
                          bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-700">
                          {cmt.text}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <textarea ref={commentRef} value={newComment} onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addComment(); }}
                  placeholder="コメントを追加… (⌘Enter で送信)"
                  rows={2}
                  className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700
                    bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100
                    placeholder-slate-300 dark:placeholder-slate-600
                    focus:outline-none focus:ring-2 focus:ring-violet-400/60 transition resize-none" />
                <button onClick={addComment} disabled={!newComment.trim()}
                  className="px-3 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl transition-all self-end">
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="flex gap-2.5 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex-shrink-0">
          <p className="flex-1 text-[11px] text-slate-400 self-center">⌘ Enter で保存</p>
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-500
              border border-slate-200 dark:border-slate-700 rounded-xl
              hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            キャンセル
          </button>
          <button onClick={handleSubmit} disabled={!title.trim()}
            className="px-5 py-2 text-sm font-semibold text-white
              bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed
              rounded-xl shadow-sm shadow-violet-500/30 transition-all">
            {isNew ? '追加する' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  );
}
