#!/usr/bin/env bash
set -e

# AzureのPORT指定
PORT=${PORT:-8080}

echo "🚀 Starting Next.js chatbot application..."
echo "📍 Port: $PORT"
echo "🔧 Environment: ${NODE_ENV:-production}"
echo "🏗️ Platform: $(uname -m)"

# 環境変数の確認ログ
echo "🔍 DATABASE_URL: ${DATABASE_URL:0:50}..."
echo "🔍 OPENAI_API_KEY: ${OPENAI_API_KEY:+SET}"
echo "🔍 NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:+SET}"
echo "🔍 NEXTAUTH_URL: $NEXTAUTH_URL"

# DB接続チェック
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL not set"
    env | grep DATABASE || echo "No DATABASE environment variables found"
    exit 1
fi

# Prismaエンジンの診断
echo "🔧 Prisma engine diagnostics..."
echo "- Prisma client location: $(find /app -name "*.prisma" -type f 2>/dev/null | head -3)"
echo "- Prisma engines: $(find /app -name "*query*engine*" -type f 2>/dev/null | head -3)"
echo "- OpenSSL version: $(openssl version 2>/dev/null || echo 'OpenSSL not found')"

# Prisma Clientの生成（本番環境でも実行）
echo "🔧 Generating Prisma client..."
if npx prisma generate; then
    echo "✅ Prisma client generated successfully"
else
    echo "❌ Prisma generate failed"
    exit 1
fi

# マイグレーションの適用（本番環境）
echo "🚀 Running migrations..."
if npx prisma migrate deploy; then
    echo "✅ Migrations applied successfully"
else
    echo "⚠️ Migration failed or skipped, continuing..."
fi

# ファイル確認
echo "📁 Checking required files..."
echo "- server.js: $(test -f server.js && echo '✅ Found' || echo '❌ Missing')"
echo "- .next directory: $(test -d .next && echo '✅ Found' || echo '❌ Missing')"
echo "- node_modules: $(test -d node_modules && echo '✅ Found' || echo '❌ Missing')"

# Next.jsアプリケーションを起動
echo "🌐 Starting Next.js app on port $PORT..."
exec node server.js
