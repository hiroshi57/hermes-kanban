#!/bin/sh
# validators/check-types.sh
# TypeScript 型エラーを即時チェック
# 使い方: bash validators/check-types.sh [ファイルパス]

if [ -n "$1" ]; then
  echo "🔍 型チェック: $1"
else
  echo "🔍 プロジェクト全体の型チェック..."
fi

npx tsc --noEmit

if [ $? -eq 0 ]; then
  echo "✅ 型エラーなし"
else
  echo "❌ 型エラーがあります。修正してください。"
  exit 1
fi
