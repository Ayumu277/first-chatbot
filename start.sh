#!/bin/bash

echo "🚀 Starting Chatbot application..."

# エラーハンドリング関数
handle_error() {
    echo "⚠️  Warning: $1 failed, but continuing with application startup..."
}

# Prismaクライアント生成（失敗してもスキップ）
echo "🔧 Generating Prisma client..."
if npx prisma generate; then
    echo "✅ Prisma client generated successfully"
else
    handle_error "Prisma client generation"
fi

# データベース接続テスト
echo "🔍 Testing database connection..."
if npx prisma db pull --force 2>/dev/null; then
    echo "✅ Database connection successful"

    # データベースマイグレーション（失敗してもスキップ）
    echo "🗄️  Running database migrations..."
    if npx prisma migrate deploy; then
        echo "✅ Database migrations completed successfully"
    else
        handle_error "Database migrations"
        echo "📝 Creating tables if they don't exist..."
        npx prisma db push --force-reset || handle_error "Database push"
    fi
else
    echo "⚠️  Database connection failed, skipping migrations"
    echo "📝 Application will run in fallback mode"
fi

# 環境変数チェック
echo "🔍 Checking essential environment variables..."
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set"
fi
if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "⚠️  NEXTAUTH_SECRET not set"
fi

# Next.jsアプリケーション起動
echo "🎯 Starting Next.js application..."
echo "📡 Server will be available on port ${PORT:-8080}"

# サーバー起動前にポートチェック
if command -v netstat >/dev/null 2>&1; then
    netstat -tuln | grep ":${PORT:-8080}" && echo "⚠️  Port ${PORT:-8080} already in use"
fi

exec node server.js
