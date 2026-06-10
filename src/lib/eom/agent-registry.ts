// =============================================================
// エージェントレジストリ — Supabase を使った CRUD + 富更新
// =============================================================
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  EomAgent, AgentRow, WealthEventType, AgentRole, LlmModel,
} from './types.js';
import { agentFromRow } from './types.js';

// ── 読み込み ──────────────────────────────────────────────────
export async function loadActiveAgents(
  client: SupabaseClient,
): Promise<EomAgent[]> {
  const { data, error } = await client
    .from('eom_agents')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`loadActiveAgents: ${error.message}`);
  return ((data ?? []) as AgentRow[]).map(agentFromRow);
}

export async function loadAllAgents(
  client: SupabaseClient,
): Promise<EomAgent[]> {
  const { data, error } = await client
    .from('eom_agents')
    .select('*')
    .order('wealth', { ascending: false });

  if (error) throw new Error(`loadAllAgents: ${error.message}`);
  return ((data ?? []) as AgentRow[]).map(agentFromRow);
}

// ── 作成 ──────────────────────────────────────────────────────
export async function createAgent(
  client: SupabaseClient,
  partial: {
    name: string;
    role: AgentRole;
    model: LlmModel;
    systemPrompt: string;
    triggerCondition?: string;
    bidAmount?: number;
    wealth?: number;
    generation?: number;
    parentId?: string | null;
  },
): Promise<EomAgent> {
  const { data, error } = await client
    .from('eom_agents')
    .insert({
      name:              partial.name,
      role:              partial.role,
      model:             partial.model,
      system_prompt:     partial.systemPrompt,
      trigger_condition: partial.triggerCondition ?? 'always',
      bid_amount:        partial.bidAmount  ?? 1.0,
      wealth:            partial.wealth     ?? 10.0,
      generation:        partial.generation ?? 0,
      parent_id:         partial.parentId   ?? null,
      is_active:         true,
    })
    .select()
    .single();

  if (error) throw new Error(`createAgent: ${error.message}`);
  return agentFromRow(data as AgentRow);
}

// ── 富更新（ログ付き） ────────────────────────────────────────
export async function updateWealth(
  client: SupabaseClient,
  agentId: string,
  delta: number,
  eventType: WealthEventType,
  opts?: { auctionId?: string; runId?: string },
): Promise<number> {
  // 現在の wealth を取得
  const { data: agentData, error: fetchError } = await client
    .from('eom_agents')
    .select('wealth')
    .eq('id', agentId)
    .single();

  if (fetchError) throw new Error(`updateWealth fetch: ${fetchError.message}`);
  const current = (agentData as { wealth: number }).wealth;
  const next    = current + delta;

  // wealth を更新
  const { error: updateError } = await client
    .from('eom_agents')
    .update({ wealth: next })
    .eq('id', agentId);

  if (updateError) throw new Error(`updateWealth update: ${updateError.message}`);

  // 富変動イベントを記録
  const { error: eventError } = await client
    .from('eom_wealth_events')
    .insert({
      agent_id:     agentId,
      event_type:   eventType,
      delta,
      wealth_after: next,
      auction_id:   opts?.auctionId ?? null,
      run_id:       opts?.runId     ?? null,
    });

  if (eventError) throw new Error(`updateWealth event: ${eventError.message}`);

  return next;
}

// ── 非アクティブ化（破産処理） ─────────────────────────────────
export async function deactivateAgent(
  client: SupabaseClient,
  agentId: string,
): Promise<void> {
  const { error } = await client
    .from('eom_agents')
    .update({ is_active: false })
    .eq('id', agentId);

  if (error) throw new Error(`deactivateAgent: ${error.message}`);

  // 破産イベントを記録
  await client.from('eom_wealth_events').insert({
    agent_id:     agentId,
    event_type:   'bankrupt',
    delta:        0,
    wealth_after: 0,
    auction_id:   null,
    run_id:       null,
  });
}

// ── system_prompt を更新（mutation 後） ───────────────────────
export async function updateAgentPrompt(
  client: SupabaseClient,
  agentId: string,
  newPrompt: string,
): Promise<void> {
  const { error } = await client
    .from('eom_agents')
    .update({ system_prompt: newPrompt })
    .eq('id', agentId);

  if (error) throw new Error(`updateAgentPrompt: ${error.message}`);
}
