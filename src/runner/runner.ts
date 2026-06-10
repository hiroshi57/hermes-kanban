#!/usr/bin/env node
// =============================================================
// EoM ランナー — GitHub Actions から実行される Node.js エントリポイント
// 環境変数: SUPABASE_URL, SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY,
//           OPENAI_API_KEY, CARD_ID
// =============================================================
import { createClient } from '@supabase/supabase-js';
import { runEpisode } from '../lib/eom/orchestrator.js';

async function main(): Promise<void> {
  const supabaseUrl = process.env['SUPABASE_URL'];
  const serviceKey  = process.env['SUPABASE_SERVICE_KEY'];
  const cardId      = process.env['CARD_ID'];

  if (!supabaseUrl)  throw new Error('SUPABASE_URL is required');
  if (!serviceKey)   throw new Error('SUPABASE_SERVICE_KEY is required');
  if (!cardId)       throw new Error('CARD_ID is required');
  if (!process.env['ANTHROPIC_API_KEY'] && !process.env['OPENAI_API_KEY']) {
    throw new Error('At least one of ANTHROPIC_API_KEY or OPENAI_API_KEY is required');
  }

  console.log('='.repeat(60));
  console.log('Economy of Minds — Runner');
  console.log(`Card ID: ${cardId}`);
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log('='.repeat(60));

  // service role client は RLS をバイパスして書き込み可能
  const client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const run = await runEpisode(client, cardId);

  console.log('='.repeat(60));
  console.log('Episode Complete!');
  console.log(`Run ID:       ${run.id}`);
  console.log(`Status:       ${run.status}`);
  console.log(`Total Reward: ${run.totalReward.toFixed(2)}`);
  console.log(`Subtasks:     ${run.subtasks.length}`);
  if (run.result) {
    console.log('\n--- Result Preview (first 500 chars) ---');
    console.log(run.result.slice(0, 500));
    if (run.result.length > 500) console.log('...[truncated]');
  }
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('Runner failed:', err);
  process.exit(1);
});
