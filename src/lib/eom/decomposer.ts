// =============================================================
// タスク分解 — decomposer agent が card を SubTask[] に変換
// =============================================================
import type { SupabaseClient } from '@supabase/supabase-js';
import type { EomAgent, SubTask } from './types.js';
import { callLlm } from './llm-adapter.js';

const FALLBACK_SUBTASKS: SubTask[] = [
  { index: 0, description: '要件の整理と分析',       roleHint: 'planner' },
  { index: 1, description: '関連情報の調査',          roleHint: 'researcher' },
  { index: 2, description: '成果物の作成',            roleHint: 'writer' },
  { index: 3, description: 'レビューと改善提案',      roleHint: 'reviewer' },
  { index: 4, description: '最終まとめと次のアクション', roleHint: 'coordinator' },
];

/**
 * decomposer ロールのエージェントを使ってカードを SubTask[] に分解する。
 * decomposer が居ない場合はフォールバック subtask を使用。
 */
export async function decomposeCard(
  client: SupabaseClient,
  agents: EomAgent[],
  card: { title: string; description: string },
): Promise<SubTask[]> {
  void client; // currently unused — future: log decomposition event

  const decomposer = agents.find(a => a.role === 'decomposer' && a.isActive);

  if (!decomposer) {
    console.warn('[decompose] No active decomposer found — using fallback subtasks.');
    return FALLBACK_SUBTASKS;
  }

  const userPrompt = `タスクタイトル: ${card.title}

タスクの詳細:
${card.description || '（詳細なし）'}

このタスクを 3〜5 個の具体的なサブタスクに分解してください。
JSON 配列のみを返してください。`;

  let output: string;
  try {
    const res = await callLlm({
      model:       decomposer.model,
      systemPrompt: decomposer.systemPrompt,
      userPrompt,
      maxTokens:   512,
    });
    output = res.content;
  } catch (e) {
    console.warn(`[decompose] LLM error: ${e} — using fallback`);
    return FALLBACK_SUBTASKS;
  }

  // JSON を抽出して parse
  try {
    const jsonMatch = output.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('no JSON array found');

    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      index?: number;
      description: string;
      roleHint?: string;
    }>;

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('empty array');
    }

    return parsed.map((item, i) => ({
      index:       item.index ?? i,
      description: item.description,
      roleHint:    (item.roleHint ?? 'any') as SubTask['roleHint'],
    }));
  } catch (e) {
    console.warn(`[decompose] JSON parse error: ${e} — using fallback`);
    return FALLBACK_SUBTASKS;
  }
}
