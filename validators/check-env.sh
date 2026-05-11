#!/bin/sh
# validators/check-env.sh
# 環境変数が正しく設定されているかチェック
# 使い方: bash validators/check-env.sh

ERRORS=0

check_env() {
  VAR_NAME="$1"
  VAR_VALUE="$2"
  PLACEHOLDER="$3"

  if [ -z "$VAR_VALUE" ]; then
    echo "❌ $VAR_NAME が未設定です"
    ERRORS=$((ERRORS + 1))
  elif [ "$VAR_VALUE" = "$PLACEHOLDER" ]; then
    echo "⚠️  $VAR_NAME がプレースホルダーのままです"
    ERRORS=$((ERRORS + 1))
  else
    echo "✅ $VAR_NAME 設定済み"
  fi
}

# .env.local を読み込む
if [ -f ".env.local" ]; then
  export $(grep -v '^#' .env.local | xargs)
  echo "📄 .env.local を読み込みました"
else
  echo "⚠️  .env.local が見つかりません（localStorage モードで動作します）"
  echo "   Supabase を使う場合は .env.example をコピーして設定してください:"
  echo "   cp .env.example .env.local"
  exit 0
fi

echo ""
echo "--- 環境変数チェック ---"
check_env "VITE_SUPABASE_URL" "$VITE_SUPABASE_URL" "https://xxxxxxxxxxxxxxxxxxxx.supabase.co"
check_env "VITE_SUPABASE_ANON_KEY" "$VITE_SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

echo ""
if [ $ERRORS -eq 0 ]; then
  echo "✅ 全環境変数が正しく設定されています"
else
  echo "❌ $ERRORS 件の問題があります。.env.local を確認してください。"
  exit 1
fi
