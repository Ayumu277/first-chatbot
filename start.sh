#!/bin/bash
# ⭐ 確実にHTTP 200にするためのstart.sh v3 ⭐
# TailwindCSS本番環境対応版

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

# 🎨 TailwindCSS環境変数設定
export DISABLE_CSSNANO=true
export TAILWIND_MODE=build
export CSS_MINIMIZE=false

echo "🎨 TailwindCSS settings:"
echo "- DISABLE_CSSNANO: ${DISABLE_CSSNANO}"
echo "- TAILWIND_MODE: ${TAILWIND_MODE}"
echo "- CSS_MINIMIZE: ${CSS_MINIMIZE}"

# ファイル確認
echo "📁 File check:"
echo "- package.json: $(test -f package.json && echo '✅' || echo '❌')"
echo "- .next folder: $(test -d .next && echo '✅' || echo '❌')"
echo "- prisma folder: $(test -d prisma && echo '✅' || echo '❌')"
echo "- node_modules: $(test -d node_modules && echo '✅' || echo '❌')"
echo "- tailwind.config.js: $(test -f tailwind.config.js && echo '✅' || echo '❌')"
echo "- postcss.config.js: $(test -f postcss.config.js && echo '✅' || echo '❌')"

# TailwindCSS設定確認
if [ -f "tailwind.config.js" ]; then
    echo "✅ TailwindCSS config found"
    # safelistの行数をチェック
    safelist_lines=$(grep -c "safelist\|pattern" tailwind.config.js || echo "0")
    echo "- Safelist patterns: ${safelist_lines}"
else
    echo "⚠️ TailwindCSS config not found"
fi

# Node.js情報
echo "🔧 Environment:"
echo "- Node.js: $(node --version)"
echo "- npm: $(npm --version)"

# Prismaクライアント生成（最重要 - エラーハンドリング強化）
echo "🔧 Setting up Prisma..."
export PRISMA_CLI_BINARY_TARGETS=linux-musl,linux-musl-openssl-3.0.x
export OPENSSL_CONF=""

# Prismaクライアント確認・生成
if [ ! -d "node_modules/.prisma" ]; then
    echo "🔄 Generating Prisma client..."
    if npx prisma generate --schema=./prisma/schema.prisma; then
        echo "✅ Prisma client generated successfully"
    else
        echo "⚠️ Prisma client generation failed, trying alternative method..."
        # 代替手段：既存のnode_modulesからコピー
        if [ -d "node_modules/@prisma/client" ]; then
            echo "✅ Using existing Prisma client from node_modules"
        else
            echo "❌ Prisma client not available, proceeding without database features"
        fi
    fi
else
    echo "✅ Prisma client already exists"
fi

# データベース接続テスト（オプション、失敗しても続行）
echo "🔍 Testing database connection..."
if command -v npx >/dev/null 2>&1; then
    if timeout 10s npx prisma db pull --schema=./prisma/schema.prisma 2>/dev/null; then
        echo "✅ Database connection successful"
    else
        echo "⚠️ Database connection failed or timed out, proceeding without DB features"
    fi
else
    echo "⚠️ npx not available, skipping database test"
fi

# Next.jsアプリ起動準備
echo "🚀 Starting Next.js application..."
echo "- Host: ${HOST}"
echo "- Port: ${PORT}"
echo "- TailwindCSS Mode: ${TAILWIND_MODE}"

# プロセス監視とクリーンアップ
cleanup() {
    echo "🛑 [$(date)] Received shutdown signal, cleaning up..."
    if [ ! -z "$NEXTJS_PID" ]; then
        kill $NEXTJS_PID 2>/dev/null || true
        wait $NEXTJS_PID 2>/dev/null || true
    fi
    exit 0
}

trap cleanup SIGTERM SIGINT SIGQUIT

# Next.js起動（複数の方法を試行）
echo "🎯 Attempting to start Next.js server..."

# 方法1: npm start（推奨）
if npm start &
then
    NEXTJS_PID=$!
    echo "✅ Next.js started with npm start (PID: $NEXTJS_PID)"

    # プロセス監視
    wait $NEXTJS_PID
    exit_code=$?

    if [ $exit_code -eq 0 ]; then
        echo "✅ Next.js exited normally"
    else
        echo "❌ Next.js exited with code $exit_code"
    fi

    exit $exit_code
else
    echo "❌ npm start failed, trying alternative method..."

    # 方法2: 直接node実行
    if [ -f ".next/server.js" ]; then
        echo "🔄 Trying direct node execution..."
        exec node .next/server.js
    elif [ -f "server.js" ]; then
        echo "🔄 Trying custom server.js..."
        exec node server.js
    else
        echo "❌ No server file found, critical error"
        exit 1
    fi
fi
