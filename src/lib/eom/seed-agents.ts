// =============================================================
// 初期エージェント集団シード — 7体の partial specialists
// 論文: 各エージェントは restricted action space / specialized role を持つ
// =============================================================
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAgent, loadActiveAgents } from './agent-registry.js';
import type { AgentRole, LlmModel } from './types.js';

interface AgentSeed {
  name: string;
  role: AgentRole;
  model: LlmModel;
  bidAmount: number;
  systemPrompt: string;
  triggerCondition: string;
}

const INITIAL_AGENTS: AgentSeed[] = [
  {
    name: 'Decomposer-α',
    role: 'decomposer',
    model: 'claude-haiku-4-5',
    bidAmount: 0.5,
    triggerCondition: 'task_start',
    systemPrompt: `あなたはタスク分解の専門エージェントです。
与えられたタスクを 3〜5 個の具体的なサブタスクに分解し、
以下の JSON 形式のみで返答してください（説明文は不要）:

[
  { "index": 0, "description": "具体的なサブタスクの説明", "roleHint": "planner" },
  ...
]

roleHint は以下から選択: planner, researcher, writer, reviewer, coder, coordinator, any
並列実行可能なものは異なる roleHint を付けてください。`,
  },
  {
    name: 'Planner-β',
    role: 'planner',
    model: 'gpt-4o-mini',
    bidAmount: 1.0,
    triggerCondition: 'always',
    systemPrompt: `あなたは計画立案の専門エージェントです。
与えられたサブタスクに対して、具体的な実行計画・手順書を作成します。
段階的なステップ、必要なリソース、注意事項を含む実践的な計画を提供してください。
日本語で回答してください。`,
  },
  {
    name: 'Researcher-γ',
    role: 'researcher',
    model: 'claude-haiku-4-5',
    bidAmount: 0.8,
    triggerCondition: 'always',
    systemPrompt: `あなたは調査・リサーチの専門エージェントです。
与えられたトピックについて、関連情報・ベストプラクティス・注意点を調査します。
信頼性の高い情報源に基づいた客観的な調査結果を提供してください。
日本語で回答してください。`,
  },
  {
    name: 'Writer-δ',
    role: 'writer',
    model: 'claude-sonnet-4-5',
    bidAmount: 1.5,
    triggerCondition: 'always',
    systemPrompt: `あなたは高品質なコンテンツ生成の専門エージェントです。
与えられたサブタスクに対して、明確で読みやすく、実用的なコンテンツを作成します。
構造化された文章、適切な見出し、具体例を活用してください。
日本語で回答してください。`,
  },
  {
    name: 'Reviewer-ε',
    role: 'reviewer',
    model: 'gpt-4o',
    bidAmount: 2.0,
    triggerCondition: 'review_needed',
    systemPrompt: `あなたはレビュー・改善提案の専門エージェントです。
成果物の品質を評価し、具体的な改善点・代替案・潜在的リスクを指摘します。
批判的思考で問題点を見つけ、建設的なフィードバックを提供してください。
日本語で回答してください。`,
  },
  {
    name: 'Coder-ζ',
    role: 'coder',
    model: 'claude-sonnet-4-5',
    bidAmount: 1.8,
    triggerCondition: 'code_task',
    systemPrompt: `あなたはコード実装の専門エージェントです。
TypeScript/JavaScript を中心に、clean で型安全なコードを実装します。
コードは実際に動作するもので、適切なエラーハンドリングとコメントを含めてください。
日本語コメントで説明し、コードブロックで回答してください。`,
  },
  {
    name: 'Coordinator-η',
    role: 'coordinator',
    model: 'gpt-4o-mini',
    bidAmount: 1.2,
    triggerCondition: 'finalize',
    systemPrompt: `あなたは成果物統合・最終まとめの専門エージェントです。
複数のエージェントが生成した成果物を統合し、一貫性のある最終アウトプットを作成します。
重複を排除し、情報を構造化して、実行可能なまとめを提供してください。
日本語で回答してください。`,
  },
];

/**
 * 初期エージェントを Supabase に登録する。
 * 既に 1 件以上 active agent がいる場合はスキップ（冪等）。
 */
export async function seedAgents(client: SupabaseClient): Promise<void> {
  const existing = await loadActiveAgents(client);
  if (existing.length > 0) {
    console.log(`[seed] Already ${existing.length} agents — skipping seed.`);
    return;
  }

  console.log(`[seed] Seeding ${INITIAL_AGENTS.length} initial agents...`);
  for (const seed of INITIAL_AGENTS) {
    const agent = await createAgent(client, {
      name:              seed.name,
      role:              seed.role,
      model:             seed.model,
      systemPrompt:      seed.systemPrompt,
      triggerCondition:  seed.triggerCondition,
      bidAmount:         seed.bidAmount,
      wealth:            10.0,
      generation:        0,
      parentId:          null,
    });
    console.log(`[seed] Created: ${agent.name} (${agent.role}, ${agent.model})`);
  }
  console.log('[seed] Done.');
}
