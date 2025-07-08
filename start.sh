#!/bin/bash

# Azure App Service startup script for Next.js + Prisma

echo "🚀 Starting Azure App Service deployment..."
echo "Environment: $NODE_ENV"
echo "Port: $PORT"
echo "Working directory: $(pwd)"
echo "User: $(whoami)"

# .envファイルを読み込む
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# デバッグ：環境変数を確認
echo "🔍 Environment variables check:"
echo "DATABASE_URL: ${DATABASE_URL:0:50}..." # 最初の50文字だけ表示（セキュリティのため）
echo "OPENAI_API_KEY: ${OPENAI_API_KEY:+SET}" # 設定されているかどうかのみ表示
echo "NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:+SET}"
echo "NEXTAUTH_URL: $NEXTAUTH_URL"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "Available environment variables:"
    env | grep -E "(DATABASE|PRISMA|NEXTAUTH|OPENAI)" || echo "No relevant env vars found"
    exit 1
fi

# ファイル存在チェック
echo "🔍 File existence check:"
echo "package.json exists: $(test -f package.json && echo 'YES' || echo 'NO')"
echo "prisma/schema.prisma exists: $(test -f prisma/schema.prisma && echo 'YES' || echo 'NO')"
echo ".next directory exists: $(test -d .next && echo 'YES' || echo 'NO')"

# Node.js とnpm のバージョン確認
echo "🔍 Node.js version: $(node --version)"
echo "🔍 npm version: $(npm --version)"

echo "🔧 Generating Prisma client..."
npx prisma generate || echo "⚠ prisma generate failed (ignoring and continuing)"

echo "🚀 Running database migrations..."
npx prisma migrate deploy || echo "⚠ migrate failed (ignoring and continuing)"

echo "🌐 Starting Next.js application on port $PORT..."
echo "Available files in current directory:"
ls -la

# Next.js アプリケーション起動（execを使ってPID 1をNode.jsに）
echo "Starting with: node server.js"
exec node server.js
