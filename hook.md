# hook.md — Git フック設定

## 概要

このファイルは `hermes-kanban` プロジェクトの git フック設定を説明します。

---

## 推奨フック

### pre-commit（コミット前チェック）

`.git/hooks/pre-commit` に以下を配置してください。

```bash
#!/bin/sh
# 型チェックと lint を実行
echo "🔍 型チェックを実行中..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
  echo "❌ TypeScript の型エラーがあります。修正してからコミットしてください。"
  exit 1
fi

echo "🔍 ESLint を実行中..."
npx eslint src --ext .ts,.tsx --max-warnings 0
if [ $? -ne 0 ]; then
  echo "❌ ESLint の警告/エラーがあります。修正してからコミットしてください。"
  exit 1
fi

echo "✅ pre-commit チェック通過"
exit 0
```

フックを有効化：

```bash
chmod +x .git/hooks/pre-commit
```

---

### pre-push（プッシュ前チェック）

`.git/hooks/pre-push` に以下を配置してください。

```bash
#!/bin/sh
echo "🏗️  ビルドチェックを実行中..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ ビルドに失敗しました。プッシュを中止します。"
  exit 1
fi

echo "✅ pre-push チェック通過"
exit 0
```

フックを有効化：

```bash
chmod +x .git/hooks/pre-push
```

---

## husky を使う場合（推奨）

```bash
npm install -D husky
npx husky init
```

`.husky/pre-commit`:
```bash
npx tsc --noEmit && npx eslint src --ext .ts,.tsx --max-warnings 0
```

`.husky/pre-push`:
```bash
npm run build
```

---

## コミットメッセージ規約

```
feat: 新機能追加
fix: バグ修正
style: スタイル変更（機能変更なし）
refactor: リファクタリング
docs: ドキュメント更新
test: テスト追加・修正
chore: ビルド設定・依存関係の変更
```

例：
```
feat: カードにコメント機能を追加
fix: ドラッグ後に統計バーが更新されない問題を修正
style: ダークモードのカード背景色を調整
```

---

## lint-staged と組み合わせる（高速化）

```bash
npm install -D lint-staged
```

`package.json` に追加：

```json
{
  "lint-staged": {
    "src/**/*.{ts,tsx}": [
      "eslint --fix",
      "tsc --noEmit"
    ]
  }
}
```
