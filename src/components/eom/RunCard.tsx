import type { EomRun } from '@/lib/eom/types';

interface Props {
  run: EomRun;
}

const STATUS_CONFIG = {
  pending:   { label: '待機中',   color: 'text-gray-500',  dot: 'bg-gray-400',  pulse: false },
  running:   { label: '実行中',   color: 'text-blue-600',  dot: 'bg-blue-500',  pulse: true  },
  completed: { label: '完了',     color: 'text-green-600', dot: 'bg-green-500', pulse: false },
  failed:    { label: '失敗',     color: 'text-red-600',   dot: 'bg-red-500',   pulse: false },
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('ja-JP', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

export default function RunCard({ run }: Props) {
  const cfg = STATUS_CONFIG[run.status] ?? STATUS_CONFIG.pending;

  return (
    <div className="rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
      {/* ステータス + 日時 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`}
          />
          <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
        </div>
        <span className="text-xs text-gray-400">{formatDate(run.createdAt)}</span>
      </div>

      {/* Run ID + Subtasks 数 */}
      <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
        <span className="font-mono truncate max-w-[60%]" title={run.id}>
          {run.id.slice(0, 8)}…
        </span>
        <span>{run.subtasks.length} サブタスク</span>
      </div>

      {/* 合計報酬 */}
      {run.status === 'completed' && run.totalReward > 0 && (
        <div className="text-xs text-green-600 dark:text-green-400 font-medium">
          Total reward: {run.totalReward.toFixed(2)} 💰
        </div>
      )}

      {/* エラー */}
      {run.status === 'failed' && run.errorMsg && (
        <div className="text-xs text-red-500 truncate" title={run.errorMsg}>
          ⚠️ {run.errorMsg.slice(0, 60)}
        </div>
      )}

      {/* 結果プレビュー */}
      {run.result && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 border-t border-gray-50 dark:border-gray-700 pt-1">
          {run.result.slice(0, 100)}…
        </div>
      )}
    </div>
  );
}
