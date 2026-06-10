// =============================================================
// EoM ダッシュボード — エージェント経済のリアルタイム監視
// Supabase Realtime で自動更新
// =============================================================
import { Bot, TrendingUp, Gavel, Zap, AlertTriangle } from 'lucide-react';
import AgentCard   from './eom/AgentCard';
import AuctionLog  from './eom/AuctionLog';
import WealthChart from './eom/WealthChart';
import RunCard     from './eom/RunCard';
import {
  useAgents,
  useRuns,
  useAuctions,
  useWealthHistory,
} from '@/lib/eom/realtime-hooks';
import { isSupabaseConfigured } from '@/lib/supabase';

// ── KPI カード ─────────────────────────────────────────────────
function KpiCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
      <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
      <div>
        <div className="text-2xl font-bold text-gray-800 dark:text-gray-100 leading-none">
          {value}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-gray-400">{sub}</div>}
      </div>
    </div>
  );
}

// ── メインダッシュボード ─────────────────────────────────────────
export default function EomDashboard({ darkMode }: { darkMode: boolean }) {
  const { agents,   loading: agentsLoading   } = useAgents();
  const { runs,     loading: runsLoading     } = useRuns(20);
  const { auctions, loading: auctionsLoading } = useAuctions(30);
  const { events }                              = useWealthHistory(undefined, 200);

  // Supabase 未設定の場合
  if (!isSupabaseConfigured) {
    return (
      <div className={`flex flex-col items-center justify-center h-64 gap-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        <AlertTriangle size={40} className="text-yellow-500" />
        <div className="text-center">
          <p className="font-medium mb-1">Supabase が設定されていません</p>
          <p className="text-sm text-gray-400">
            .env に VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を設定してください。
          </p>
        </div>
      </div>
    );
  }

  const activeAgents  = agents.filter(a => a.isActive);
  const bankruptCount = agents.filter(a => !a.isActive).length;
  const avgWealth     = activeAgents.length > 0
    ? activeAgents.reduce((s, a) => s + a.wealth, 0) / activeAgents.length
    : 0;
  const completedRuns = runs.filter(r => r.status === 'completed').length;

  return (
    <div className={`p-4 space-y-6 ${darkMode ? 'dark' : ''}`}>
      {/* ヘッダー */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Bot size={22} />
          EoM エージェント経済
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          arXiv 2606.02859 — Economy of Minds · Realtime
        </p>
      </div>

      {/* KPI カード */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          icon={<Bot size={18} className="text-indigo-600" />}
          label="Active Agents"
          value={activeAgents.length}
          sub={bankruptCount > 0 ? `${bankruptCount}体破産` : undefined}
          color="bg-indigo-50 dark:bg-indigo-900/20"
        />
        <KpiCard
          icon={<TrendingUp size={18} className="text-green-600" />}
          label="Avg. Wealth"
          value={avgWealth.toFixed(1)}
          sub="全 active"
          color="bg-green-50 dark:bg-green-900/20"
        />
        <KpiCard
          icon={<Gavel size={18} className="text-purple-600" />}
          label="Total Auctions"
          value={auctions.length}
          sub="直近30件"
          color="bg-purple-50 dark:bg-purple-900/20"
        />
        <KpiCard
          icon={<Zap size={18} className="text-yellow-600" />}
          label="Completed Runs"
          value={completedRuns}
          sub={`/ ${runs.length} runs`}
          color="bg-yellow-50 dark:bg-yellow-900/20"
        />
      </div>

      {/* Wealth チャート */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-1.5">
          <TrendingUp size={14} />
          エージェント富推移
        </h3>
        {agentsLoading ? (
          <div className="h-40 flex items-center justify-center text-gray-400 text-sm">読込中...</div>
        ) : (
          <WealthChart agents={activeAgents} events={events} height={180} />
        )}
      </div>

      {/* エージェントグリッド + ランログ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* エージェントグリッド */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-1.5">
            <Bot size={14} />
            エージェント一覧 ({activeAgents.length} active)
          </h3>
          {agentsLoading ? (
            <div className="text-center text-gray-400 text-sm py-8">読込中...</div>
          ) : agents.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-8">
              エージェントがいません。<br />
              カードを作成して EoM を実行してください。
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
              {agents.map(agent => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}
        </div>

        {/* 右カラム: ランログ + オークションログ */}
        <div className="space-y-4">
          {/* ランログ */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-1.5">
              <Zap size={14} />
              実行履歴 (直近)
            </h3>
            {runsLoading ? (
              <div className="text-center text-gray-400 text-sm py-4">読込中...</div>
            ) : runs.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-4">
                まだ実行がありません
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {runs.slice(0, 5).map(run => (
                  <RunCard key={run.id} run={run} />
                ))}
              </div>
            )}
          </div>

          {/* オークションログ */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-1.5">
              <Gavel size={14} />
              オークション履歴
            </h3>
            {auctionsLoading ? (
              <div className="text-center text-gray-400 text-sm py-4">読込中...</div>
            ) : (
              <AuctionLog auctions={auctions} agents={agents} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
