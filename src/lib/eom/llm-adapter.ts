// =============================================================
// LLM アダプター — Claude (Anthropic) + OpenAI GPT マルチモデル対応
// =============================================================
import type { LlmRequest, LlmResponse, LlmModel } from './types.js';

// モデル → プロバイダー分類
function isAnthropicModel(model: LlmModel): boolean {
  return model.startsWith('claude-');
}

// ── Anthropic (Claude) ────────────────────────────────────────
async function callAnthropic(req: LlmRequest): Promise<LlmResponse> {
  // dynamic import でブラウザバンドルから分離
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({
    apiKey: process.env['ANTHROPIC_API_KEY'],
  });

  // モデル名マッピング（API 送信名に変換）
  const modelMap: Record<string, string> = {
    'claude-haiku-4-5':  'claude-haiku-4-5',
    'claude-sonnet-4-5': 'claude-sonnet-4-5',
  };

  const response = await client.messages.create({
    model: modelMap[req.model] ?? req.model,
    max_tokens: req.maxTokens ?? 1024,
    system: req.systemPrompt,
    messages: [{ role: 'user', content: req.userPrompt }],
  });

  const content = response.content
    .filter(b => b.type === 'text')
    .map(b => (b as { type: 'text'; text: string }).text)
    .join('');

  return {
    content,
    inputTokens:  response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

// ── OpenAI (GPT) ──────────────────────────────────────────────
async function callOpenAI(req: LlmRequest): Promise<LlmResponse> {
  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
  });

  const modelMap: Record<string, string> = {
    'gpt-4o-mini': 'gpt-4o-mini',
    'gpt-4o':      'gpt-4o',
  };

  const response = await client.chat.completions.create({
    model: modelMap[req.model] ?? req.model,
    max_tokens: req.maxTokens ?? 1024,
    messages: [
      { role: 'system', content: req.systemPrompt },
      { role: 'user',   content: req.userPrompt },
    ],
  });

  const content = response.choices[0]?.message?.content ?? '';
  const usage   = response.usage;

  return {
    content,
    inputTokens:  usage?.prompt_tokens     ?? 0,
    outputTokens: usage?.completion_tokens ?? 0,
  };
}

// ── 公開 API ─────────────────────────────────────────────────
/**
 * モデルに応じて Anthropic または OpenAI を呼び出す統一アダプター
 */
export async function callLlm(req: LlmRequest): Promise<LlmResponse> {
  if (isAnthropicModel(req.model)) {
    return callAnthropic(req);
  }
  return callOpenAI(req);
}

/**
 * 品質スコアリング: 出力の充実度に基づいてリワードを 0.0〜1.0 で返す
 * （実際の EoM では環境からの報酬を使うが、ここでは heuristic を採用）
 */
export function scoreOutput(output: string, subtaskDescription: string): number {
  if (!output || output.trim().length < 20) return 0.0;

  let score = 0.5;

  // 長さボーナス（情報量の proxy）
  const wordCount = output.trim().split(/\s+/).length;
  if (wordCount > 50)  score += 0.15;
  if (wordCount > 150) score += 0.15;

  // 構造ボーナス（番号付きリスト / 見出し）
  if (/^\d+\./m.test(output) || /^[-*]/m.test(output)) score += 0.1;
  if (/^#{1,3} /m.test(output)) score += 0.05;

  // subtask キーワード重複ボーナス
  const keywords = subtaskDescription
    .toLowerCase()
    .split(/\W+/)
    .filter(w => w.length > 3);
  const outputLower = output.toLowerCase();
  const hits = keywords.filter(kw => outputLower.includes(kw)).length;
  score += Math.min(hits / Math.max(keywords.length, 1), 1) * 0.05;

  return Math.min(score, 1.0);
}
