import type { EomAuction, EomAgent } from '@/lib/eom/types';

interface Props {
  auctions: EomAuction[];
  agents: EomAgent[];
}

const STATUS_STYLE: Record<string, string> = {
  open:      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  closed:    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  failed:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const STATUS_LABEL: Record<string, string> = {
  open: '入札中', closed: '落札', completed: '完了', failed: '失敗',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)  return `${Math.floor(diff / 1000)}秒前`;
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}分前`;
  return `${Math.floor(diff / 3600_000)}時間前`;
}

export default function AuctionLog({ auctions, agents }: Props) {
  const agentMap = Object.fromEntries(agents.map(a => [a.id, a]));

  if (auctions.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        オークション履歴なし
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
      {auctions.map(a => {
        const winner = a.winnerAgentId ? agentMap[a.winnerAgentId] : null;
        return (
          <div
            key={a.id}
            className="rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-xs"
          >
            {/* ヘッダー行 */}
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-medium text-gray-700 dark:text-gray-200 truncate max-w-[60%]">
                #{a.subtaskIndex + 1} {a.subtaskDescription.slice(0, 40)}
                {a.subtaskDescription.length > 40 ? '…' : ''}
              </span>
              <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${STATUS_STYLE[a.status] ?? ''}`}>
                {STATUS_LABEL[a.status] ?? a.status}
              </span>
            </div>

            {/* 詳細行 */}
            <div className="flex items-center gap-3 text-gray-400">
              {/* 落札者 */}
              {winner ? (
                <span className="text-gray-600 dark:text-gray-300">
                  🏆 {winner.name}
                </span>
              ) : (
                <span>–</span>
              )}

              {/* 入札額 */}
              {a.winningBid != null && (
                <span>bid: <span className="font-mono text-gray-500">{a.winningBid.toFixed(2)}</span></span>
              )}

              {/* Reward */}
              {a.reward > 0 && (
                <span className="text-green-600 dark:text-green-400">
                  +{a.reward.toFixed(2)} 💰
                </span>
              )}

              <span className="ml-auto">{timeAgo(a.createdAt)}</span>
            </div>

            {/* 出力プレビュー */}
            {a.agentOutput && (
              <div className="mt-1.5 text-gray-500 dark:text-gray-400 text-[11px] line-clamp-2 border-t border-gray-50 dark:border-gray-700 pt-1">
                {a.agentOutput.slice(0, 120)}
                {a.agentOutput.length > 120 ? '…' : ''}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
