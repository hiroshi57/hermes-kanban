import type { EomAgent } from '@/lib/eom/types';

const ROLE_EMOJI: Record<string, string> = {
  decomposer:  '🔍',
  planner:     '📋',
  researcher:  '📚',
  writer:      '✍️',
  reviewer:    '🔎',
  coder:       '💻',
  coordinator: '🎯',
};

const MODEL_LABEL: Record<string, string> = {
  'claude-haiku-4-5':  'Haiku',
  'gpt-4o-mini':       'GPT-mini',
  'claude-sonnet-4-5': 'Sonnet',
  'gpt-4o':            'GPT-4o',
};

const MODEL_COLOR: Record<string, string> = {
  'claude-haiku-4-5':  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'gpt-4o-mini':       'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'claude-sonnet-4-5': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'gpt-4o':            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
};

function wealthColor(wealth: number, isActive: boolean): string {
  if (!isActive) return 'text-gray-400 dark:text-gray-600';
  if (wealth < 3)  return 'text-red-500';
  if (wealth < 8)  return 'text-yellow-500';
  if (wealth < 15) return 'text-green-500';
  return 'text-emerald-400 font-bold';
}

function wealthBarColor(wealth: number): string {
  if (wealth < 3)  return 'bg-red-400';
  if (wealth < 8)  return 'bg-yellow-400';
  if (wealth < 15) return 'bg-green-400';
  return 'bg-emerald-400';
}

interface Props {
  agent: EomAgent;
}

export default function AgentCard({ agent }: Props) {
  const isBankrupt = !agent.isActive;
  const wealthPct  = Math.min(Math.max(agent.wealth / 20, 0), 1) * 100;

  return (
    <div
      className={`
        relative rounded-xl border p-4 transition-all duration-300
        ${isBankrupt
          ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 opacity-50'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md'
        }
      `}
    >
      {/* 破産バッジ */}
      {isBankrupt && (
        <span className="absolute -top-2 -right-2 text-xs bg-red-500 text-white rounded-full px-2 py-0.5">
          破産
        </span>
      )}

      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{ROLE_EMOJI[agent.role] ?? '🤖'}</span>
            <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
              {agent.name}
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            Gen.{agent.generation} · {agent.role}
          </div>
        </div>

        {/* モデルバッジ */}
        <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${MODEL_COLOR[agent.model] ?? 'bg-gray-100 text-gray-600'}`}>
          {MODEL_LABEL[agent.model] ?? agent.model}
        </span>
      </div>

      {/* Wealth バー */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-500">Wealth</span>
          <span className={`text-sm font-mono ${wealthColor(agent.wealth, agent.isActive)}`}>
            {agent.wealth.toFixed(1)}
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${wealthBarColor(agent.wealth)}`}
            style={{ width: `${wealthPct}%` }}
          />
        </div>
      </div>

      {/* Bid */}
      <div className="flex justify-between text-xs text-gray-400">
        <span>入札額: <span className="font-mono text-gray-600 dark:text-gray-300">{agent.bidAmount.toFixed(1)}</span></span>
        {agent.parentId && <span>🧬 変異体</span>}
      </div>
    </div>
  );
}
