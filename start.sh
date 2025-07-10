#!/bin/bash

# AzureのPORT指定
PORT=${PORT:-8080}

# Set Prisma environment variables for Azure
export PRISMA_CLI_QUERY_ENGINE_TYPE=binary
export PRISMA_SCHEMA_ENGINE_BINARY="/app/node_modules/.prisma/client/schema-engine-debian-openssl-1.1.x"
export PRISMA_QUERY_ENGINE_BINARY="/app/node_modules/.prisma/client/query-engine-debian-openssl-1.1.x"

# 環境変数の確認
echo "🔍 DATABASE_URL: ${DATABASE_URL:0:50}..."
echo "🔍 OPENAI_API_KEY: ${OPENAI_API_KEY:+SET}"
echo "🔍 NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:+SET}"
echo "🔍 NEXTAUTH_URL: $NEXTAUTH_URL"

# DB接続必須
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL not set"
    env | grep DATABASE
    exit 1
fi

# Prisma generate
echo "🔧 Generating Prisma client..."
if ! npx prisma generate; then
    echo "❌ Prisma generate failed"
    exit 1
fi

# Prisma migrate deploy
echo "🚀 Running migrations..."
if ! npx prisma migrate deploy; then
    echo "⚠️ Migration failed or skipped"
fi

# 最後にアプリ起動
echo "🌐 Starting Next.js app on port $PORT..."
exec node .next/standalone/server.js
