// =============================================================
// Economy of Minds — 型定義
// arXiv 2606.02859: エージェント経済によるマルチエージェントシステム
// =============================================================

export type LlmModel =
  | 'claude-haiku-4-5'
  | 'gpt-4o-mini'
  | 'claude-sonnet-4-5'
  | 'gpt-4o';

export type AgentRole =
  | 'decomposer'
  | 'planner'
  | 'researcher'
  | 'writer'
  | 'reviewer'
  | 'coder'
  | 'coordinator';

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed';
export type AuctionStatus = 'open' | 'closed' | 'completed' | 'failed';
export type WealthEventType =
  | 'bid_win'
  | 'bucket_brigade'
  | 'rent'
  | 'born'
  | 'bankrupt'
  | 'mutation'
  | 'reward';

// ── 論文の agent tuple: (φ_a, π_a, b_a, W_a) ──────────────────
export interface EomAgent {
  id: string;
  name: string;
  role: AgentRole;
  model: LlmModel;
  systemPrompt: string;
  triggerCondition: string;
  bidAmount: number;
  wealth: number;
  isActive: boolean;
  generation: number;
  parentId: string | null;
  createdAt: string;
}

// ── 1カード = 1エピソード ─────────────────────────────────────────
export interface EomRun {
  id: string;
  cardId: string;
  boardId: string;
  status: RunStatus;
  subtasks: SubTask[];
  result: string | null;
  totalReward: number;
  errorMsg: string | null;
  createdAt: string;
  completedAt: string | null;
}

// ── タスク分解の単位 ─────────────────────────────────────────────
export interface SubTask {
  index: number;
  description: string;
  roleHint: AgentRole | 'any';
}

// ── オークション: subtask 1件 ────────────────────────────────────
export interface EomAuction {
  id: string;
  runId: string;
  subtaskIndex: number;
  subtaskDescription: string;
  roleHint: string;
  status: AuctionStatus;
  winnerAgentId: string | null;
  winningBid: number | null;
  agentOutput: string | null;
  reward: number;
  createdAt: string;
  completedAt: string | null;
}

// ── 入札記録 ──────────────────────────────────────────────────────
export interface EomBid {
  id: string;
  auctionId: string;
  agentId: string;
  amount: number;
  createdAt: string;
}

// ── 富変動ログ ───────────────────────────────────────────────────
export interface EomWealthEvent {
  id: string;
  agentId: string;
  eventType: WealthEventType;
  delta: number;
  wealthAfter: number;
  auctionId: string | null;
  runId: string | null;
  createdAt: string;
}

// ── オークション結果（engine の戻り値） ───────────────────────────
export interface AuctionResult {
  auction: EomAuction;
  winner: EomAgent;
  output: string;
  reward: number;
}

// ── LLM アダプター ───────────────────────────────────────────────
export interface LlmRequest {
  model: LlmModel;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}

export interface LlmResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
}

// ── Supabase 行型（DB の snake_case → camelCase 変換用） ──────────
export interface AgentRow {
  id: string;
  name: string;
  role: string;
  model: string;
  system_prompt: string;
  trigger_condition: string;
  bid_amount: number;
  wealth: number;
  is_active: boolean;
  generation: number;
  parent_id: string | null;
  created_at: string;
}

export interface RunRow {
  id: string;
  card_id: string;
  board_id: string;
  status: string;
  subtasks: unknown;
  result: string | null;
  total_reward: number;
  error_msg: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface AuctionRow {
  id: string;
  run_id: string;
  subtask_index: number;
  subtask_description: string;
  role_hint: string;
  status: string;
  winner_agent_id: string | null;
  winning_bid: number | null;
  agent_output: string | null;
  reward: number;
  created_at: string;
  completed_at: string | null;
}

export interface WealthEventRow {
  id: string;
  agent_id: string;
  event_type: string;
  delta: number;
  wealth_after: number;
  auction_id: string | null;
  run_id: string | null;
  created_at: string;
}

// ── 行 → 型変換ヘルパー ──────────────────────────────────────────
export function agentFromRow(row: AgentRow): EomAgent {
  return {
    id: row.id,
    name: row.name,
    role: row.role as AgentRole,
    model: row.model as LlmModel,
    systemPrompt: row.system_prompt,
    triggerCondition: row.trigger_condition,
    bidAmount: row.bid_amount,
    wealth: row.wealth,
    isActive: row.is_active,
    generation: row.generation,
    parentId: row.parent_id,
    createdAt: row.created_at,
  };
}

export function runFromRow(row: RunRow): EomRun {
  return {
    id: row.id,
    cardId: row.card_id,
    boardId: row.board_id,
    status: row.status as RunStatus,
    subtasks: (row.subtasks as SubTask[]) ?? [],
    result: row.result,
    totalReward: row.total_reward,
    errorMsg: row.error_msg,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

export function auctionFromRow(row: AuctionRow): EomAuction {
  return {
    id: row.id,
    runId: row.run_id,
    subtaskIndex: row.subtask_index,
    subtaskDescription: row.subtask_description,
    roleHint: row.role_hint,
    status: row.status as AuctionStatus,
    winnerAgentId: row.winner_agent_id,
    winningBid: row.winning_bid,
    agentOutput: row.agent_output,
    reward: row.reward,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

export function wealthEventFromRow(row: WealthEventRow): EomWealthEvent {
  return {
    id: row.id,
    agentId: row.agent_id,
    eventType: row.event_type as WealthEventType,
    delta: row.delta,
    wealthAfter: row.wealth_after,
    auctionId: row.auction_id,
    runId: row.run_id,
    createdAt: row.created_at,
  };
}
