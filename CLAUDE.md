# CLAUDE.md — TaskZen

## 本番 URL
- **アプリ**: https://hermes-kanban-glyy.vercel.app/（Vercel再デプロイ後に更新）
- **Supabase**: https://supabase.com/dashboard/project/mmjqexpnypidgdkjigmz
- **GitHub**: https://github.com/hiroshi57/hermes-kanban

> **プロジェクト**: taskzen
> **作成日**: 2026-05-11
> **言語**: ja / TypeScript

---

## プロジェクト概要

React + Vite + Tailwind CSS で構築した日本語対応の Kanban ダッシュボード。

```
src/
├── App.tsx              ← メインコンポーネント（ボード全体の状態管理）
├── types.ts             ← Board / Card / Column / Tag / Priority 型定義
├── data.ts              ← 初期サンプルデータ（日本語）
├── index.css            ← Tailwind ディレクティブ
└── components/
    ├── KanbanCard.tsx   ← ドラッグ対応カード
    ├── KanbanColumn.tsx ← Droppable 列
    ├── CardModal.tsx    ← カード追加/編集モーダル
    └── StatsBar.tsx     ← 統計バー（完了率プログレスバー）
```

---

## 開発コマンド

```bash
npm run dev      # 開発サーバー起動（http://localhost:5173）
npm run build    # 本番ビルド
npm run preview  # ビルド結果をプレビュー
npm run lint     # ESLint 実行
```

---

## Claude Code の責務

### ✅ 担当する作業
- コンポーネントの追加・修正
- 型定義の拡張
- テスト実装
- ビルドエラーの修正

### ❌ 禁止事項
- `localStorage` キーの変更（データ互換性が壊れる）
- `@hello-pangea/dnd` を他のライブラリへ差し替え（既存の DnD ロジックが壊れる）
- `tailwind.config.js` の `brand` カラーパレット削除

---

## 状態管理方針

- グローバル状態は `App.tsx` の `useLocalBoard` フックで管理
- `localStorage` キー: `hermes-kanban-board`
- サーバーサイド状態管理は現時点で不要

---

## コーディング規約

- コンポーネントは関数コンポーネント + TypeScript
- スタイルは Tailwind CSS のみ（インライン style は最小限）
- アイコンは `lucide-react` で統一
- 日本語 UI テキストはコンポーネント内にハードコード（i18n 不要）

---

## 追加機能候補（next.task.md 参照）

- バックエンド連携（REST API / Supabase）
- 複数ボード対応
- コメント機能
- 活動ログ
