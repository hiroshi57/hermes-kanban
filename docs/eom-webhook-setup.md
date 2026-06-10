# EoM — Supabase Webhook → GitHub Actions 設定手順

カードが作成された際に自動で EoM エージェントが起動するよう、
Supabase の Database Webhook と GitHub Actions を接続します。

---

## 1. GitHub Personal Access Token (PAT) を作成

1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. 以下の権限を付与:
   - **Actions: Read and write** (workflow を dispatch するため)
3. トークンをコピーして保存

---

## 2. GitHub Secrets に登録

GitHub リポジトリ → Settings → Secrets and variables → Actions → New repository secret:

| Secret 名 | 値 |
|-----------|-----|
| `SUPABASE_SERVICE_KEY` | Supabase Dashboard → Settings → API → service_role key |
| `ANTHROPIC_API_KEY` | Anthropic Console → API keys |
| `OPENAI_API_KEY` | OpenAI Platform → API keys |
| `GH_PAT` | 手順 1 で作成した PAT (Webhook 設定で使用) |

---

## 3. Supabase Database Webhook を設定

Supabase Dashboard → Database → Webhooks → Create new webhook:

**基本設定:**
- Name: `eom-card-trigger`
- Table: `cards`
- Events: `INSERT` のみ ✓

**HTTP Request:**
- Method: `POST`
- URL: `https://api.github.com/repos/{owner}/{repo}/dispatches`
  - `{owner}` = GitHub ユーザー名 (例: `hiroshi57`)
  - `{repo}` = リポジトリ名 (例: `hermes-kanban`)

**Headers:**
```
Authorization: token {GH_PAT の値}
Accept: application/vnd.github.v3+json
Content-Type: application/json
```

**Payload:**
```json
{
  "event_type": "eom-card-trigger",
  "client_payload": {
    "card_id": "{{ NEW_RECORD.id }}",
    "board_id": "{{ NEW_RECORD.board_id }}"
  }
}
```

---

## 4. 動作確認

### 手動テスト (workflow_dispatch)
1. GitHub → Actions → EoM Agent Run → Run workflow
2. `card_id` に Supabase の `cards` テーブルから任意のカード ID を入力
3. Run → ログを確認

### 自動テスト (Webhook)
1. hermes-kanban でカードを新規作成
2. GitHub → Actions → EoM Agent Run が自動起動されることを確認
3. Supabase → `eom_runs` テーブルに completed レコードが入ることを確認

---

## 5. ダッシュボードで確認

hermes-kanban の「🤖 エージェント」タブを開くと:
- エージェントの富 (Wealth) リアルタイム表示
- オークション履歴
- 実行中のランのステータス

---

## トラブルシューティング

| 症状 | 対処 |
|------|------|
| `SUPABASE_SERVICE_KEY is required` | GitHub Secrets に `SUPABASE_SERVICE_KEY` を追加 |
| `No active agents found` | 初回 run 前に `CARD_ID=xxx npm run runner:run` でシードを確認 |
| Webhook が届かない | Supabase の Webhook ログを確認 → GitHub PAT の権限を確認 |
| LLM エラー | `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` の Secrets を確認 |
