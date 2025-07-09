#!/bin/bash
# ⭐ 確実にHTTP 200にするためのstart.sh ⭐

set -e  # エラーで停止

echo "🚀 [$(date)] Starting Next.js application..."
echo "Environment: ${NODE_ENV:-production}"
echo "Port: ${PORT:-8080}"
echo "Working directory: $(pwd)"
echo "User: $(whoami)"

# 環境変数設定
export NODE_ENV=production
export PORT=${PORT:-8080}
export HOST=0.0.0.0
export HOSTNAME=0.0.0.0

# ファイル確認
echo "📁 File check:"
echo "- package.json: $(test -f package.json && echo '✅' || echo '❌')"
echo "- .next folder: $(test -d .next && echo '✅' || echo '❌')"
echo "- prisma folder: $(test -d prisma && echo '✅' || echo '❌')"

# Node.js情報
echo "🔧 Environment:"
echo "- Node.js: $(node --version)"
echo "- npm: $(npm --version)"

# Prismaクライアント生成（重要）
echo "🔧 Generating Prisma client..."
if npx prisma generate; then
    echo "✅ Prisma client generated successfully"
else
    echo "⚠️ Prisma generate failed, continuing..."
fi

# データベースマイグレーション（必要に応じて）
if [ -n "$DATABASE_URL" ]; then
    echo "🗃️ Running database migrations..."
    npx prisma migrate deploy || echo "⚠️ Migration failed, continuing..."
else
    echo "⚠️ DATABASE_URL not set, skipping migrations"
fi

# Next.jsアプリケーション起動 - 確実に動く方法
echo "🌐 Starting Next.js application on port $PORT..."

# 通常のNext.js startコマンドを使用
echo "✅ Starting with: npm start"
exec npm start
