# SPEC.md — Hermes Kanban プロジェクト憲法

> このファイルはプロジェクトのグローバルルールを定義します。
> Codex・Claude Code・全エージェントはこのファイルを最初に読んでください。

---

## プロジェクト概要

| 項目 | 値 |
|------|---|
| 名前 | hermes-kanban |
| スタック | React 19 + Vite + TypeScript + Tailwind CSS |
| バックエンド | Supabase（LocalStorage からの移行中） |
| 言語 | 日本語 UI / TypeScript コード |

---

## 命名規則

### ファイル・コンポーネント
- コンポーネント: `PascalCase.tsx`（例: `KanbanCard.tsx`）
- ユーティリティ: `camelCase.ts`（例: `boardUtils.ts`）
- テスト: `*.test.ts` または `*.test.tsx`
- 型定義: `types.ts` に集約

### 変数・関数
- React コンポーネント: `PascalCase`
- 関数・変数: `camelCase`
- 定数: `UPPER_SNAKE_CASE`
- 型・インターフェース: `PascalCase`

### CSS クラス
- Tailwind CSS のみ使用（インライン style は最小限）
- カスタムカラー: `brand-*`（tailwind.config.js で定義）

---

## ディレクトリ構造

```
src/
├── App.tsx              # メインコンポーネント（状態管理）
├── types.ts             # 全型定義
├── data.ts              # 初期データ・normalizer
├── index.css            # Tailwind ディレクティブ
├── components/          # UI コンポーネント
├── lib/                 # ライブラリ設定（supabase.ts, storage.ts）
├── utils/               # ピュア関数ユーティリティ
└── test/                # テストファイル
```

---

## 型定義のルール

- 全型は `src/types.ts` に定義する
- コンポーネントの Props 型はコンポーネントファイル内に `interface Props` として定義
- `any` は禁止。不明な型は `unknown` を使い型ガードで絞る

---

## 状態管理ルール

- グローバル状態: `App.tsx` の `useAppState` フック
- localStorage キー: `hermes-kanban-app-v2`（変更禁止）
- Supabase 同期: `src/lib/storage.ts` 経由でのみアクセス
- コンポーネントは状態を持たず Props で受け取る（原則）

---

## 禁止事項（Codex・エージェント共通）

| # | 禁止 | 理由 |
|---|------|------|
| 1 | `localStorage` キーの変更 | データ互換性が壊れる |
| 2 | `@hello-pangea/dnd` の差し替え | DnD ロジックが壊れる |
| 3 | `tailwind.config.js` の `brand` 削除 | デザインシステムが壊れる |
| 4 | `any` 型の使用 | 型安全性が損なわれる |
| 5 | インライン style の乱用 | Tailwind 一貫性が壊れる |
| 6 | 本番デプロイの直接実行 | Vercel 経由のみ許可 |

---

## テスト方針

- ユニットテスト: Vitest + React Testing Library
- テスト対象: `src/utils/`, `src/lib/` のピュア関数を優先
- カバレッジ目標: ユーティリティ関数 80%以上
- コンポーネントテスト: 主要なユーザーインタラクションのみ

---

## Supabase 連携ルール

- 接続情報は `.env.local`（git 管理外）に記述
- クライアントは `src/lib/supabase.ts` から import する
- RLS（Row Level Security）は認証実装時に必ず有効化
- スキーマ変更は `supabase/schema.sql` に反映する

---

## コミットメッセージ規約

```
feat: 新機能追加
fix: バグ修正
style: スタイル変更（機能変更なし）
refactor: リファクタリング
test: テスト追加・修正
docs: ドキュメント更新
chore: ビルド設定・依存関係の変更
```
