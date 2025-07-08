#!/bin/sh

# Azure App Service startup script for Next.js + Prisma

echo "🚀 Starting Azure App Service deployment..."
echo "Environment: $NODE_ENV"
echo "Port: $PORT"
echo "Working directory: $(pwd)"
echo "User: $(whoami)"

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
if npx prisma generate; then
    echo "✅ Prisma client generated successfully"
else
    echo "❌ Prisma client generation failed"
    echo "Prisma schema content (first 10 lines):"
    head -10 prisma/schema.prisma || echo "Cannot read schema.prisma"
    exit 1
fi

echo "🚀 Running database migrations..."
if npx prisma migrate deploy; then
    echo "✅ Database migrations completed successfully"
else
    echo "❌ Database migrations failed"
    echo "This might be normal for the first deployment if database doesn't exist yet"
    echo "Continuing with application startup..."
fi

echo "🌐 Starting Next.js application on port $PORT..."
echo "Available files in current directory:"
ls -la

# Next.js アプリケーション起動
echo "Starting with: npx next start -p $PORT"
exec npx next start -p $PORT
