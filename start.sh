#!/usr/bin/env bash
set -e

# AzureのPORT指定
PORT=${PORT:-8080}

# Prisma用バイナリを明示（Azureで必要になることがある）
export PRISMA_CLI_QUERY_ENGINE_TYPE=binary
export PRISMA_SCHEMA_ENGINE_BINARY="/app/node_modules/.prisma/client/schema-engine-debian-openssl-1.1.x"
export PRISMA_QUERY_ENGINE_BINARY="/app/node_modules/.prisma/client/query-engine-debian-openssl-1.1.x"

# 環境変数の確認ログ
echo "🔍 DATABASE_URL: ${DATABASE_URL:0:50}..."
echo "🔍 OPENAI_API_KEY: ${OPENAI_API_KEY:+SET}"
echo "🔍 NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:+SET}"
echo "🔍 NEXTAUTH_URL: $NEXTAUTH_URL"

# DB接続チェック
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL not set"
    env | grep DATABASE
    exit 1
fi

# Prisma Clientの生成
echo "🔧 Generating Prisma client..."
npx prisma generate || {
    echo "❌ Prisma generate failed"
    exit 1
}

# マイグレーションの適用
echo "🚀 Running migrations..."
npx prisma migrate deploy || {
    echo "⚠️ Migration failed or skipped"
}

# 最後にNext.jsアプリを起動
echo "🌐 Starting Next.js app on port $PORT..."
exec node .next/standalone/server.js
