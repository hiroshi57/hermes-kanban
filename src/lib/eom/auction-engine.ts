// =============================================================
// オークションエンジン — 論文 Section 2.2
// エージェントが入札し、最高 bid の agent が行動権を獲得・実行する
// =============================================================
import type { SupabaseClient } from '@supabase/supabase-js';
import type { EomAgent, AuctionResult, AuctionRow } from './types.js';
import { auctionFromRow } from './types.js';
import { callLlm, scoreOutput } from './llm-adapter.js';
import { updateWealth } from './agent-registry.js';

const MAX_REWARD    = 5.0;   // 1 subtask の最大報酬
const BID_NOISE_MAX = 0.1;   // ε ~ Uniform(0, BID_NOISE_MAX) (論文式 2)

/**
 * triggering predicate φ_a(o) — エージェントがこの subtask に応札可能かを判定
 */
function isEligible(agent: EomAgent, roleHint: string): boolean {
  if (!agent.isActive) return false;

  // trigger_condition チェック
  if (agent.triggerCondition === 'always')       return true;
  if (agent.triggerCondition === 'task_start')   return roleHint === 'decomposer' || roleHint === 'any';
  if (agent.triggerCondition === 'review_needed') return roleHint === 'reviewer'  || roleHint === 'any';
  if (agent.triggerCondition === 'code_task')    return roleHint === 'coder'      || roleHint === 'any';
  if (agent.triggerCondition === 'finalize')     return roleHint === 'coordinator'|| roleHint === 'any';

  // roleHint 一致チェック
  return agent.role === roleHint || roleHint === 'any';
}

/**
 * 入札額を計算: b_a + ε, ε ~ Uniform(0, MAX_BID_NOISE)
 * 新規エージェント（novice rule 論文式 2）: max{b_a | a ∈ C_t} + ε を保証するのは
 * economic-selection.ts で扱う。ここでは通常入札のみ。
 */
function computeBid(agent: EomAgent): number {
  const noise = Math.random() * BID_NOISE_MAX;
  return agent.bidAmount + noise;
}

/**
 * 1 オークションを実行する。
 * 1. eligible agents がリストアップ
 * 2. 全員が入札 → DB に記録
 * 3. 最高 bid の agent が winner
 * 4. winner が LLM を呼び出して subtask を実行
 * 5. reward を計算して DB 更新
 */
export async function runAuction(
  client: SupabaseClient,
  agents: EomAgent[],
  runId: string,
  subtaskIndex: number,
  subtaskDescription: string,
  roleHint: string,
  context: string,
): Promise<AuctionResult> {
  // ── 1. オークションレコード作成 ───────────────────────────────
  const { data: auctionData, error: auctionErr } = await client
    .from('eom_auctions')
    .insert({
      run_id:              runId,
      subtask_index:       subtaskIndex,
      subtask_description: subtaskDescription,
      role_hint:           roleHint,
      status:              'open',
    })
    .select()
    .single();

  if (auctionErr) throw new Error(`runAuction create: ${auctionErr.message}`);
  const auctionId = (auctionData as AuctionRow).id;

  // ── 2. eligible agents の選定 & 入札 ──────────────────────────
  const eligible = agents.filter(a => isEligible(a, roleHint));
  if (eligible.length === 0) {
    // フォールバック: 全 active agents に広げる
    eligible.push(...agents.filter(a => a.isActive));
  }
  if (eligible.length === 0) {
    throw new Error(`runAuction: no eligible agents for subtask ${subtaskIndex}`);
  }

  const bids = eligible.map(a => ({ agent: a, amount: computeBid(a) }));

  // 入札を DB に記録
  await client.from('eom_bids').insert(
    bids.map(b => ({
      auction_id: auctionId,
      agent_id:   b.agent.id,
      amount:     b.amount,
    }))
  );

  // ── 3. 落札者決定（最高 bid） ──────────────────────────────────
  const winner = bids.reduce((best, cur) =>
    cur.amount > best.amount ? cur : best
  );

  // ── 4. LLM 実行 ───────────────────────────────────────────────
  const userPrompt = context
    ? `## コンテキスト\n${context}\n\n## サブタスク\n${subtaskDescription}`
    : `## サブタスク\n${subtaskDescription}`;

  let output: string;
  try {
    const llmRes = await callLlm({
      model:       winner.agent.model,
      systemPrompt: winner.agent.systemPrompt,
      userPrompt,
      maxTokens:   1024,
    });
    output = llmRes.content;
  } catch (e) {
    output = `[ERROR] LLM呼び出し失敗: ${String(e)}`;
  }

  // ── 5. reward 計算 ────────────────────────────────────────────
  const score  = scoreOutput(output, subtaskDescription);
  const reward = score * MAX_REWARD;

  // ── 6. オークションレコードを完了に更新 ───────────────────────
  const { data: completedData, error: completeErr } = await client
    .from('eom_auctions')
    .update({
      status:          'completed',
      winner_agent_id: winner.agent.id,
      winning_bid:     winner.amount,
      agent_output:    output,
      reward,
      completed_at:    new Date().toISOString(),
    })
    .eq('id', auctionId)
    .select()
    .single();

  if (completeErr) throw new Error(`runAuction complete: ${completeErr.message}`);

  // winner の wealth に即時 reward を反映（bucket brigade の分は後で精算）
  await updateWealth(client, winner.agent.id, reward - winner.amount, 'reward', {
    auctionId,
    runId,
  });

  return {
    auction: auctionFromRow(completedData as AuctionRow),
    winner:  winner.agent,
    output,
    reward,
  };
}
