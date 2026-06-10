// =============================================================
// EoM オーケストレーター — メインループ
// 1 カード = 1 エピソード。並列実行可能な subtask は Promise.all で並走。
// =============================================================
import type { SupabaseClient } from '@supabase/supabase-js';
import type { EomRun, AuctionResult, RunRow } from './types.js';
import { runFromRow } from './types.js';
import { loadActiveAgents } from './agent-registry.js';
import { decomposeCard }    from './decomposer.js';
import { runAuction }       from './auction-engine.js';
import { applyBucketBrigade } from './bucket-brigade.js';
import { runEconomicSelection } from './economic-selection.js';
import { seedAgents }       from './seed-agents.js';

/**
 * roleHint が異なる subtask は並列実行可能（依存関係なし）。
 * 同じ roleHint を持つ subtask は順次実行（後続が前の出力を参照）。
 */
function groupSubtasks(
  subtasks: Array<{ index: number; description: string; roleHint: string }>,
): Array<Array<typeof subtasks[0]>> {
  // roleHint でグループ化し、異なる role は並列グループに
  const seen = new Set<string>();
  const groups: Array<Array<typeof subtasks[0]>> = [];
  let currentGroup: Array<typeof subtasks[0]> = [];

  for (const st of subtasks) {
    if (seen.has(st.roleHint) && st.roleHint !== 'any') {
      // 同 roleHint が再登場 → 新しい sequential グループへ
      if (currentGroup.length > 0) groups.push(currentGroup);
      currentGroup = [st];
      seen.clear();
      seen.add(st.roleHint);
    } else {
      currentGroup.push(st);
      seen.add(st.roleHint);
    }
  }
  if (currentGroup.length > 0) groups.push(currentGroup);

  return groups;
}

/**
 * 1 エピソード（1 カード）を実行する。
 * - subtask への分解
 * - グループ内の並列オークション実行
 * - Bucket Brigade クレジット割当
 * - 経済的選択（rent / mutation / replacement）
 */
export async function runEpisode(
  client: SupabaseClient,
  cardId: string,
): Promise<EomRun> {
  console.log(`[orchestrator] Starting episode for card: ${cardId}`);

  // ── 0. 初期シード（初回のみ） ─────────────────────────────────
  await seedAgents(client);

  // ── 1. カード情報を取得 ───────────────────────────────────────
  const { data: cardData, error: cardErr } = await client
    .from('cards')
    .select('id, board_id, title, description')
    .eq('id', cardId)
    .single();

  if (cardErr) throw new Error(`getCard: ${cardErr.message}`);
  const card = cardData as { id: string; board_id: string; title: string; description: string };

  // ── 2. Run レコードを作成 ─────────────────────────────────────
  const { data: runData, error: runErr } = await client
    .from('eom_runs')
    .insert({
      card_id:  card.id,
      board_id: card.board_id,
      status:   'running',
      subtasks: [],
    })
    .select()
    .single();

  if (runErr) throw new Error(`createRun: ${runErr.message}`);
  const runId = (runData as RunRow).id;
  console.log(`[orchestrator] Run created: ${runId}`);

  try {
    // ── 3. エージェントをロード ────────────────────────────────
    const agents = await loadActiveAgents(client);
    if (agents.length === 0) throw new Error('No active agents found');
    console.log(`[orchestrator] ${agents.length} active agents loaded`);

    // ── 4. タスク分解 ──────────────────────────────────────────
    const subtasks = await decomposeCard(client, agents, {
      title:       card.title,
      description: card.description,
    });
    console.log(`[orchestrator] Decomposed into ${subtasks.length} subtasks`);

    // subtasks を DB の run に保存
    await client
      .from('eom_runs')
      .update({ subtasks: subtasks as unknown as object[] })
      .eq('id', runId);

    // ── 5. 並列グループ化してオークション実行 ─────────────────
    const groups = groupSubtasks(subtasks);
    const allResults: AuctionResult[] = [];

    for (const group of groups) {
      // 前グループの出力をコンテキストとして蓄積
      const context = allResults
        .map(r => `[${r.winner.role}]\n${r.output}`)
        .join('\n\n---\n\n');

      // 同グループ内は並列実行
      const groupResults = await Promise.all(
        group.map(st =>
          runAuction(
            client,
            agents,
            runId,
            st.index,
            st.description,
            st.roleHint,
            context,
          )
        )
      );
      allResults.push(...groupResults);
    }

    console.log(`[orchestrator] All ${allResults.length} auctions completed`);

    // ── 6. Bucket Brigade クレジット割当 ──────────────────────
    await applyBucketBrigade(client, allResults, runId);

    // ── 7. 最終結果を統合 ──────────────────────────────────────
    const totalReward = allResults.reduce((sum, r) => sum + r.reward, 0);
    const finalResult = allResults
      .map((r, i) => `## サブタスク ${i + 1}: ${r.auction.subtaskDescription}\n\n${r.output}`)
      .join('\n\n---\n\n');

    // ── 8. Run を完了に更新 ────────────────────────────────────
    const { data: completedRun, error: completeErr } = await client
      .from('eom_runs')
      .update({
        status:       'completed',
        result:       finalResult,
        total_reward: totalReward,
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId)
      .select()
      .single();

    if (completeErr) throw new Error(`completeRun: ${completeErr.message}`);

    // ── 9. 経済的選択（rent / mutation / replacement） ─────────
    await runEconomicSelection(client, agents, runId);

    console.log(`[orchestrator] Episode completed. Total reward: ${totalReward.toFixed(2)}`);
    return runFromRow(completedRun as RunRow);

  } catch (error) {
    // エラー時は run を failed に更新
    await client
      .from('eom_runs')
      .update({
        status:    'failed',
        error_msg: String(error),
      })
      .eq('id', runId);

    throw error;
  }
}
