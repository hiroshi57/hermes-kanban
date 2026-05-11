import { useState } from 'react';
import { X } from 'lucide-react';
import type { FullBoard } from '@/types';

interface Props {
  board: FullBoard | null;   // null = 新規作成
  onSave: (name: string, emoji: string) => void;
  onClose: () => void;
}

const EMOJI_OPTIONS = ['🚀', '📋', '💡', '🎯', '🛠️', '📊', '🌟', '🔥', '💼', '🎨', '🧪', '📱'];

export default function BoardModal({ board, onSave, onClose }: Props) {
  const [name,  setName]  = useState(board?.name  ?? '');
  const [emoji, setEmoji] = useState(board?.emoji ?? EMOJI_OPTIONS[0]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave(name.trim(), emoji);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onKeyDown={handleKeyDown}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl
        shadow-2xl shadow-black/20 dark:shadow-black/60 overflow-hidden">

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4
          bg-gradient-to-r from-violet-600 to-indigo-600">
          <h2 className="text-[15px] font-semibold text-white">
            {board ? 'ボードを編集' : '新しいボードを作成'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-violet-200 hover:text-white hover:bg-white/20 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* フォーム */}
        <div className="px-5 py-5 space-y-4">
          {/* 絵文字選択 */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
              アイコン
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map(e => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`text-xl w-9 h-9 flex items-center justify-center rounded-lg border-2 transition-all ${
                    emoji === e
                      ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20 scale-110'
                      : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* ボード名 */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              ボード名 <span className="text-red-400 normal-case font-medium">必須</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例: フロントエンド開発"
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
        </div>

        {/* フッター */}
        <div className="flex gap-2.5 px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
          <p className="flex-1 text-[11px] text-slate-400 self-center">⌘ Enter で保存</p>
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
            disabled={!name.trim()}
            className="px-5 py-2 text-sm font-semibold text-white
              bg-violet-600 hover:bg-violet-700 disabled:opacity-40
              disabled:cursor-not-allowed rounded-xl
              shadow-sm shadow-violet-500/30 transition-all"
          >
            {board ? '保存する' : '作成する'}
          </button>
        </div>
      </div>
    </div>
  );
}
