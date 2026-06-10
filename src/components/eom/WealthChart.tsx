// 追加依存なし — SVG で全エージェントの wealth 推移を描画
import { useMemo, useState } from 'react';
import type { EomAgent, EomWealthEvent } from '@/lib/eom/types';

interface Props {
  agents: EomAgent[];
  events: EomWealthEvent[];
  height?: number;
}

const AGENT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
];

export default function WealthChart({ agents, events, height = 200 }: Props) {
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);

  // エージェントごとに時系列 wealth データを構築
  const series = useMemo(() => {
    const activeAgents = agents.filter(a => a.isActive).slice(0, 8);

    return activeAgents.map((agent, colorIdx) => {
      const agentEvents = events
        .filter(e => e.agentId === agent.id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      // 初期点 (wealth=10) + イベント後の wealth 推移
      const points: number[] = agentEvents.length > 0
        ? [10, ...agentEvents.map(e => e.wealthAfter)]
        : [agent.wealth];

      return {
        agent,
        points,
        color: AGENT_COLORS[colorIdx % AGENT_COLORS.length],
      };
    });
  }, [agents, events]);

  if (series.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        エージェントデータを取得中...
      </div>
    );
  }

  const allValues = series.flatMap(s => s.points);
  const minVal = Math.min(...allValues, 0);
  const maxVal = Math.max(...allValues, 20);
  const range  = maxVal - minVal || 1;

  const W = 600;
  const H = height;
  const PAD = { top: 10, right: 10, bottom: 20, left: 35 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxPoints = Math.max(...series.map(s => s.points.length), 2);

  function toX(i: number, total: number) {
    return PAD.left + (i / Math.max(total - 1, 1)) * chartW;
  }
  function toY(val: number) {
    return PAD.top + chartH - ((val - minVal) / range) * chartH;
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height }}
      >
        {/* グリッドライン */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const y = PAD.top + chartH * (1 - t);
          const val = minVal + range * t;
          return (
            <g key={t}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                stroke="#e5e7eb" strokeWidth={0.5} strokeDasharray="4,4" />
              <text x={PAD.left - 4} y={y + 4}
                textAnchor="end" fontSize={9} fill="#9ca3af">
                {val.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* ゼロライン */}
        {minVal < 0 && (
          <line
            x1={PAD.left} y1={toY(0)} x2={W - PAD.right} y2={toY(0)}
            stroke="#ef4444" strokeWidth={1} strokeDasharray="4,2" opacity={0.5}
          />
        )}

        {/* エージェントの wealth 折れ線 */}
        {series.map(({ agent, points, color }) => {
          const isHovered = hoveredAgent === agent.id;
          const coords = points.map((v, i) => ({ x: toX(i, points.length), y: toY(v) }));
          const pathD = coords
            .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
            .join(' ');

          return (
            <g key={agent.id}>
              <path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth={isHovered ? 2.5 : 1.5}
                strokeLinejoin="round"
                opacity={hoveredAgent && !isHovered ? 0.2 : 0.9}
                onMouseEnter={() => setHoveredAgent(agent.id)}
                onMouseLeave={() => setHoveredAgent(null)}
                style={{ cursor: 'pointer' }}
              />
              {/* 最終点のドット */}
              {coords.length > 0 && (
                <circle
                  cx={coords[coords.length - 1].x}
                  cy={coords[coords.length - 1].y}
                  r={isHovered ? 4 : 3}
                  fill={color}
                  opacity={hoveredAgent && !isHovered ? 0.2 : 1}
                />
              )}
            </g>
          );
        })}

        {/* X 軸ラベル */}
        <text x={PAD.left} y={H - 4} fontSize={9} fill="#9ca3af">start</text>
        <text x={W - PAD.right} y={H - 4} fontSize={9} fill="#9ca3af" textAnchor="end">
          t={maxPoints}
        </text>
      </svg>

      {/* 凡例 */}
      <div className="flex flex-wrap gap-3 mt-2 px-2">
        {series.map(({ agent, color }) => (
          <button
            key={agent.id}
            className="flex items-center gap-1.5 text-xs"
            onMouseEnter={() => setHoveredAgent(agent.id)}
            onMouseLeave={() => setHoveredAgent(null)}
            onClick={() => setHoveredAgent(v => v === agent.id ? null : agent.id)}
          >
            <span
              className="inline-block w-4 h-0.5 rounded"
              style={{ backgroundColor: color }}
            />
            <span className="text-gray-600 dark:text-gray-300">{agent.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
