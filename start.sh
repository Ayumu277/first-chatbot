#!/bin/sh

# Azure App Service startup script for Next.js + Prisma

set -e  # Exit on any error

echo "🚀 Starting Azure App Service deployment..."
echo "Environment: $NODE_ENV"
echo "Port: $PORT"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🚀 Running database migrations..."
npx prisma migrate deploy

echo "✅ Prisma setup completed successfully"

echo "🌐 Starting Next.js application on port $PORT..."

# 🔥 修正ポイント：Next.js アプリは next start で起動
exec npx next start -p $PORT
