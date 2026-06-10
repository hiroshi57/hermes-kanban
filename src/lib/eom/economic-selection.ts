// =============================================================
// 経済的選択 — 論文 Section 2.3 (Exploration + Exploitation)
// 富んだ agent を変異(搾取)、破産した agent を置換(探索)
// =============================================================
import type { SupabaseClient } from '@supabase/supabase-js';
import type { EomAgent } from './types.js';
import {
  createAgent,
  deactivateAgent,
  updateWealth,
} from './agent-registry.js';
import { callLlm } from './llm-adapter.js';

const RENT_PER_EPISODE      = 0.5;   // ρ: 毎 episode 後に全 agent から徴収
const BANKRUPTCY_THRESHOLD  = 0.0;   // wealth < 0 → bankrupt
const MUTATION_THRESHOLD    = 15.0;  // wealth > 15 → mutation 候補
const INITIAL_WEALTH        = 10.0;  // W_0: 新生 agent の初期 wealth

/**
 * 論文 式(2) の novice rule:
 * 新規エージェントが最初の eligible auction で必ず 1 回行動できるよう、
 * 現在の最高 bid + ε を初期 bid に設定するのではなく、
 * 新規 agent には wealth ブースト + 若干高めの bid を設定する。
 * （実装簡略化: 新規 agent は wealth = INITIAL_WEALTH からスタート）
 */

// ── Exploitation: 成功 agent の system_prompt を変異 ──────────
/**
 * 富んだ親 agent の system_prompt を LLM で変異させ、新 agent を生成。
 * 成功パターンを保持しながら小さな行動変異を導入する。
 */
export async function mutateAgent(
  client: SupabaseClient,
  parent: EomAgent,
): Promise<EomAgent> {
  console.log(`[selection] Mutating ${parent.name} (wealth: ${parent.wealth.toFixed(1)})`);

  // Claude で system_prompt を変異
  let mutatedPrompt: string;
  try {
    const res = await callLlm({
      model:       'claude-haiku-4-5',
      systemPrompt: `あなたはAIエージェントの改善専門家です。
与えられたエージェントのシステムプロンプトを改善して、
より効果的なバージョンを作成してください。
改善のポイント:
- より具体的な指示を追加
- エッジケースへの対処を強化
- 出力フォーマットをより明確に
元のプロンプトの意図を保ちながら、小さな変異を加えてください。
改善後のプロンプトのみを出力してください。`,
      userPrompt:  `改善するプロンプト:\n${parent.systemPrompt}`,
      maxTokens:   512,
    });
    mutatedPrompt = res.content.trim() || parent.systemPrompt;
  } catch {
    mutatedPrompt = parent.systemPrompt + '\n\nより簡潔で具体的な回答を心がけてください。';
  }

  const child = await createAgent(client, {
    name:             `${parent.name.split('-')[0]}-${String.fromCharCode(945 + Math.floor(Math.random() * 20))}${parent.generation + 1}`,
    role:             parent.role,
    model:            parent.model,
    systemPrompt:     mutatedPrompt,
    triggerCondition: parent.triggerCondition,
    bidAmount:        parent.bidAmount,
    wealth:           INITIAL_WEALTH,
    generation:       parent.generation + 1,
    parentId:         parent.id,
  });

  // 誕生イベントを記録
  await updateWealth(client, child.id, 0, 'born');

  // 変異イベントを親に記録
  await updateWealth(client, parent.id, 0, 'mutation');

  console.log(`[selection] Created child: ${child.name} (gen ${child.generation})`);
  return child;
}

// ── Exploration: 破産 agent を置換 ───────────────────────────
/**
 * 破産した agent の失敗パターンを反省し、改良版の新 agent を生成。
 * 失敗から学び、新しい行動を探索する。
 */
export async function replaceAgent(
  client: SupabaseClient,
  bankrupt: EomAgent,
): Promise<EomAgent> {
  console.log(`[selection] Replacing bankrupt ${bankrupt.name}`);

  // 破産 agent を非アクティブ化
  await deactivateAgent(client, bankrupt.id);

  // 失敗パターンを反省したプロンプトを生成
  let newPrompt: string;
  try {
    const res = await callLlm({
      model:       'claude-haiku-4-5',
      systemPrompt: `あなたはAIエージェントの修正専門家です。
失敗したエージェントのシステムプロンプトを修正して、
より良いパフォーマンスが期待できるバージョンを作成してください。
修正の方向性:
- より明確なタスク定義
- 失敗しやすいパターンを回避する指示を追加
- 出力品質を高める具体的なガイドライン
修正後のプロンプトのみを出力してください。`,
      userPrompt:  `修正が必要なプロンプト（このエージェントは業績不振でした）:\n${bankrupt.systemPrompt}`,
      maxTokens:   512,
    });
    newPrompt = res.content.trim() || bankrupt.systemPrompt;
  } catch {
    newPrompt = bankrupt.systemPrompt + '\n\n必ず具体的で実用的な回答を提供してください。';
  }

  // 新 agent を bid をやや下げて作成（novice rule の簡略実装）
  const replacement = await createAgent(client, {
    name:             `${bankrupt.name.split('-')[0]}-new${Date.now().toString(36).slice(-4)}`,
    role:             bankrupt.role,
    model:            bankrupt.model,
    systemPrompt:     newPrompt,
    triggerCondition: bankrupt.triggerCondition,
    bidAmount:        Math.max(bankrupt.bidAmount * 0.9, 0.3),
    wealth:           INITIAL_WEALTH,
    generation:       bankrupt.generation + 1,
    parentId:         bankrupt.id,
  });

  await updateWealth(client, replacement.id, 0, 'born');

  console.log(`[selection] Replacement created: ${replacement.name}`);
  return replacement;
}

// ── メイン: 1 エピソード終了後に経済的選択を実行 ──────────────
/**
 * 1. 全 active agent から rent を徴収
 * 2. 破産 agent を探索的に置換
 * 3. 富んだ agent を搾取的に変異
 */
export async function runEconomicSelection(
  client: SupabaseClient,
  agents: EomAgent[],
  runId: string,
): Promise<void> {
  console.log(`[selection] Running economic selection on ${agents.length} agents...`);

  for (const agent of agents) {
    // 1. Rent 徴収
    const wealthAfterRent = await updateWealth(
      client,
      agent.id,
      -RENT_PER_EPISODE,
      'rent',
      { runId },
    );

    // 2. Exploration: 破産判定
    if (wealthAfterRent < BANKRUPTCY_THRESHOLD) {
      await replaceAgent(client, { ...agent, wealth: wealthAfterRent });
      continue;
    }

    // 3. Exploitation: 変異判定（確率的: 富が多いほど高確率）
    if (wealthAfterRent > MUTATION_THRESHOLD) {
      const mutationProb = Math.min((wealthAfterRent - MUTATION_THRESHOLD) / 20, 0.3);
      if (Math.random() < mutationProb) {
        await mutateAgent(client, { ...agent, wealth: wealthAfterRent });
      }
    }
  }

  console.log('[selection] Done.');
}
