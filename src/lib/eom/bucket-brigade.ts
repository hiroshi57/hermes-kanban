// =============================================================
// Bucket Brigade — 論文 Section 2.2, 式(1) + Figure 3
// 報酬がオークション連鎖を逆伝播し、成功に貢献した agent が富を得る
// =============================================================
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuctionResult } from './types.js';
import { updateWealth } from './agent-registry.js';

/**
 * Bucket Brigade 転送ルール（論文 式(1)）:
 *
 *   W[a*_{t-1}] += b[a*_t]         (前の落札者が次の落札者の入札額を受け取る)
 *   W[a*_t]     += r_t - b[a*_t]   (落札者は環境報酬 - 入札コストを受け取る)
 *
 * これにより、良い下流状態に繋げた agent が富を蓄積する
 * (decentralized credit assignment)
 *
 * auctionChain: [auction_0, auction_1, ..., auction_N-1] (時系列順)
 */
export async function applyBucketBrigade(
  client: SupabaseClient,
  auctionChain: AuctionResult[],
  runId: string,
): Promise<void> {
  if (auctionChain.length === 0) return;

  for (let t = 0; t < auctionChain.length; t++) {
    const current = auctionChain[t];
    if (!current.auction.winnerAgentId || current.auction.winningBid === null) {
      continue;
    }

    const bid     = current.auction.winningBid;
    const reward  = current.auction.reward;

    // 前の落札者への支払い（bucket brigade 転送）
    if (t > 0) {
      const prev = auctionChain[t - 1];
      if (prev.auction.winnerAgentId) {
        await updateWealth(
          client,
          prev.auction.winnerAgentId,
          bid,                 // delta = 次の agent の bid
          'bucket_brigade',
          { auctionId: current.auction.id, runId },
        );
      }
    }

    // 最初の落札者は house に支払い（house 側は追跡しない）
    // → 落札者自身の wealth 調整のみ（reward - bid は auction-engine で既に処理済み）
    // ここでは bucket_brigade の追加報酬のみ処理

    // 最後の落札者は環境報酬を全額受け取る（追加ボーナス）
    if (t === auctionChain.length - 1 && reward > 0) {
      await updateWealth(
        client,
        current.auction.winnerAgentId,
        reward * 0.2,          // 最終実行者への追加インセンティブ (20% bonus)
        'reward',
        { auctionId: current.auction.id, runId },
      );
    }
  }
}
