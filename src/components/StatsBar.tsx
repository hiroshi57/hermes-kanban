import type { Board } from '@/types';
import { CheckCircle2, Clock, AlertTriangle, LayoutList } from 'lucide-react';
import { getTodayStr } from '@/utils/date';

interface Props {
  board: Board;
}

export default function StatsBar({ board }: Props) {
  const allCards   = Object.values(board.cards);
  const total      = allCards.length;
  const doneCol    = board.columns['col-done'];
  const done       = doneCol?.cardIds.length ?? 0;
  const inProgress = board.columns['col-inprogress']?.cardIds.length ?? 0;
  const today      = getTodayStr();

  const overdue = allCards.filter(c =>
    c.dueDate && c.dueDate < today && !doneCol?.cardIds.includes(c.id)
  ).length;

  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  const STATS = [
    {
      label: '総タスク',
      value: total,
      icon:  LayoutList,
      color: 'text-slate-500 dark:text-slate-400',
      ring:  'ring-slate-200 dark:ring-slate-700',
      bg:    'bg-white dark:bg-slate-800/60',
    },
    {
      label: '進行中',
      value: inProgress,
      icon:  Clock,
      color: 'text-blue-500',
      ring:  'ring-blue-100 dark:ring-blue-900/40',
      bg:    'bg-blue-50/80 dark:bg-blue-900/20',
    },
    {
      label: '期限超過',
      value: overdue,
      icon:  AlertTriangle,
      color: overdue > 0 ? 'text-red-500' : 'text-slate-400 dark:text-slate-600',
      ring:  overdue > 0 ? 'ring-red-100 dark:ring-red-900/40' : 'ring-slate-200 dark:ring-slate-700',
      bg:    overdue > 0 ? 'bg-red-50/80 dark:bg-red-900/20' : 'bg-white dark:bg-slate-800/60',
    },
    {
      label: '完了',
      value: done,
      icon:  CheckCircle2,
      color: 'text-emerald-500',
      ring:  'ring-emerald-100 dark:ring-emerald-900/40',
      bg:    'bg-emerald-50/80 dark:bg-emerald-900/20',
    },
  ] as const;

  return (
    <div className="flex items-center gap-3 px-5 py-3
      bg-white dark:bg-slate-900
      border-b border-slate-200 dark:border-slate-800">

      {STATS.map(s => (
        <div
          key={s.label}
          className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl ring-1 ${s.bg} ${s.ring}`}
        >
          <s.icon size={16} className={s.color} />
          <div className="leading-none">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mb-0.5">{s.label}</p>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        </div>
      ))}

      {/* 完了率プログレスバー */}
      <div className="flex-1 ml-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-slate-400 font-medium">完了率</span>
          <span className="text-[13px] font-bold text-emerald-500">{completionRate}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out
              bg-gradient-to-r from-violet-500 to-emerald-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>
    </div>
  );
}
