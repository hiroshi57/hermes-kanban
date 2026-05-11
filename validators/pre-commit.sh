#!/bin/sh
# validators/pre-commit.sh
# コミット前に実行するバリデーター
# 使い方: bash validators/pre-commit.sh

set -e

echo "🔍 [validator] TypeScript 型チェック..."
npx tsc --noEmit
echo "✅ 型チェック通過"

echo "🔍 [validator] ESLint..."
npx eslint src --ext .ts,.tsx --max-warnings 0
echo "✅ ESLint 通過"

echo "🔍 [validator] テスト実行..."
npm test
echo "✅ テスト通過"

echo "🔍 [validator] ビルドチェック..."
npm run build > /dev/null 2>&1
echo "✅ ビルド通過"

echo ""
echo "🎉 全バリデーター通過！コミット可能です。"
