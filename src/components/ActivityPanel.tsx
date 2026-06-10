import { X, Activity, ArchiveRestore, MessageSquare, CheckSquare, FilePlus, Pencil, ArrowRight, Trash2 } from 'lucide-react';
import type { ActivityEntry, ActivityAction } from '@/types';

interface Props {
  entries: ActivityEntry[];
  onClose: () => void;
}

const ACTION_META: Record<ActivityAction, { icon: React.ElementType; color: string; label: string }> = {
  card_created:        { icon: FilePlus,       color: 'text-violet-500', label: 'カード作成' },
  card_updated:        { icon: Pencil,          color: 'text-blue-500',   label: 'カード更新' },
  card_moved:          { icon: ArrowRight,      color: 'text-amber-500',  label: 'カード移動' },
  card_deleted:        { icon: Trash2,          color: 'text-red-500',    label: 'カード削除' },
  card_archived:       { icon: ArchiveRestore,  color: 'text-slate-500',  label: 'アーカイブ' },
  comment_added:       { icon: MessageSquare,   color: 'text-emerald-500', label: 'コメント追加' },
  checklist_completed: { icon: CheckSquare,     color: 'text-teal-500',   label: 'チェック完了' },
  board_created:       { icon: FilePlus,        color: 'text-violet-500', label: 'ボード作成' },
  board_updated:       { icon: Pencil,          color: 'text-blue-500',   label: 'ボード更新' },
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60)   return 'たった今';
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}時間前`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function ActivityPanel({ entries, onClose }: Props) {
  const sorted = [...entries].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 100);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* バックドロップ */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* パネル */}
      <div className="relative w-80 h-full bg-white dark:bg-slate-900
        border-l border-slate-200 dark:border-slate-800
        flex flex-col shadow-2xl shadow-black/20">

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-3
          border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <Activity size={16} className="text-violet-500" />
            <span className="text-[14px] font-bold">活動ログ</span>
            <span className="text-[11px] text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
              {sorted.length}
            </span>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300
              hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* ログ一覧 */}
        <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-300 dark:text-slate-700">
              <Activity size={32} className="mb-2" />
              <p className="text-sm">まだ活動がありません</p>
            </div>
          ) : (
            sorted.map(entry => {
              const meta = ACTION_META[entry.action] ?? ACTION_META.card_updated;
              const Icon = meta.icon;
              return (
                <div key={entry.id}
                  className="flex gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
                    bg-slate-100 dark:bg-slate-800 ${meta.color}`}>
                    <Icon size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-snug">
                      {entry.detail}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{formatTime(entry.timestamp)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
