#!/bin/bash

echo "🚀 Starting Chatbot application..."

# Prismaクライアント生成
echo "🔧 Generating Prisma client..."
npx prisma generate

# データベースマイグレーション実行
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# アプリケーション起動
echo "🎯 Starting Next.js application..."
exec node server.js
