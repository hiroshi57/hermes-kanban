# integrations/ — システム連携

チームメンバー全員が同じパターン・バリデーター・モジュールを利用し、初日から完璧な連携を実現します。

---

## 連携マップ

```
┌─────────────────────────────────────────────────────┐
│                  Hermes Kanban                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  React App (Vite)                                   │
│    ↕ localStorage（オフライン時）                     │
│    ↕ Supabase（接続時・リアルタイム同期）             │
│                                                     │
│  CI/CD: GitHub Actions → Vercel                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Supabase 連携

| 環境 | 設定ファイル | 説明 |
|------|------------|------|
| ローカル | `.env.local` | git 管理外、各自設定 |
| Preview | Vercel 環境変数 | PR ごとに自動デプロイ |
| Production | Vercel 環境変数 | main ブランチで自動デプロイ |

### セットアップ手順

```bash
# 1. Supabase プロジェクト作成
# https://supabase.com でプロジェクト作成

# 2. スキーマ適用
# Supabase ダッシュボード > SQL Editor で supabase/schema.sql を実行

# 3. 環境変数設定
cp .env.example .env.local
# .env.local に VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を記入

# 4. 確認
bash validators/check-env.sh
```

---

## Vercel 連携

### 初回セットアップ

```bash
npm i -g vercel
vercel login
vercel link    # プロジェクトに紐付け
```

### 環境変数を Vercel に登録

```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

### デプロイフロー

```
git push origin main
  → GitHub Actions: lint + test + build チェック
  → Vercel: 自動本番デプロイ
```

---

## GitHub Actions 連携

`.github/workflows/ci.yml` が以下を自動実行：

| トリガー | 実行内容 |
|---------|---------|
| `push main` | lint + 型チェック + テスト + ビルド |
| `push develop` | 同上 |
| `pull_request → main` | 同上（マージ前チェック） |

---

## Codex 連携

Codex がタスクを受け取ったとき、自動で以下を参照：

1. `SPEC.md` → 命名規則・禁止事項を確認
2. `patterns/` → タスクに合致するパターンを選択
3. `validators/` → コード生成後に自動検証
4. `modules/` → 機能ごとのモジュールを確認

### Codex へのタスク指示テンプレート

```
[タスク]: {具体的な実装内容}
[参照パターン]: patterns/{関連ファイル}.md
[制約]: SPEC.md の禁止事項を遵守
[検証]: validators/pre-commit.sh で確認
```
