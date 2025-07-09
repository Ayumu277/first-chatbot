#!/bin/bash

# Azure App Service startup script for Next.js + Prisma

echo "🚀 Starting Azure App Service deployment..."
echo "Environment: $NODE_ENV"
echo "Port: $PORT"
echo "Working directory: $(pwd)"
echo "User: $(whoami)"

# ポート設定の確認と修正
if [ -z "$PORT" ]; then
    export PORT=8080
    echo "PORT not set, defaulting to 8080"
fi

# 必要な環境変数を設定
export NODE_ENV=production
export HOST=0.0.0.0
export HOSTNAME=0.0.0.0

# .envファイルを読み込む
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# デバッグ：環境変数を確認
echo "🔍 Environment variables check:"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "HOST: $HOST"
echo "DATABASE_URL: ${DATABASE_URL:0:50}..." # 最初の50文字だけ表示（セキュリティのため）
echo "OPENAI_API_KEY: ${OPENAI_API_KEY:+SET}" # 設定されているかどうかのみ表示
echo "NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:+SET}"
echo "NEXTAUTH_URL: $NEXTAUTH_URL"

# ファイル存在チェック
echo "🔍 File existence check:"
echo "package.json exists: $(test -f package.json && echo 'YES' || echo 'NO')"
echo "server.js exists: $(test -f server.js && echo 'YES' || echo 'NO')"
echo "prisma/schema.prisma exists: $(test -f prisma/schema.prisma && echo 'YES' || echo 'NO')"
echo ".next directory exists: $(test -d .next && echo 'YES' || echo 'NO')"

# Node.js とnpm のバージョン確認
echo "🔍 Node.js version: $(node --version)"
echo "🔍 npm version: $(npm --version)"

echo "🔧 Generating Prisma client..."
npx prisma generate || echo "⚠ prisma generate failed (ignoring and continuing)"

# DATABASE_URLが設定されている場合のみマイグレーション実行
if [ -n "$DATABASE_URL" ]; then
    echo "🚀 Running database migrations..."
    npx prisma migrate deploy || echo "⚠ migrate failed (ignoring and continuing)"
else
    echo "⚠ DATABASE_URL not set, skipping migrations"
fi

echo "🌐 Starting Next.js application on port $PORT..."
echo "Available files in current directory:"
ls -la

# ヘルスチェック用エンドポイントを作成
echo "🔍 Creating health check endpoint..."
cat > health-check.js << 'EOF'
const http = require('http');

const healthServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

healthServer.listen(8081, '0.0.0.0', () => {
  console.log('Health check server running on port 8081');
});
EOF

# ヘルスチェックサーバーをバックグラウンドで起動
node health-check.js &

# Next.js アプリケーション起動（Next.js 14 standalone対応）
echo "Starting with: node .next/standalone/server.js on port $PORT"
exec node .next/standalone/server.js
