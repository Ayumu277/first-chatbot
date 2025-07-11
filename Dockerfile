# ===== NEXT.JS CHATBOT APPLICATION - PRODUCTION BUILD =====
# Build timestamp: 2025-01-11-19:00
# Version: 0.1.2 - Fix build dependencies
FROM node:18-alpine

WORKDIR /app

# Force cache invalidation
RUN echo "Build time: $(date)" > /tmp/build_time.txt

# 基本パッケージとOpenSSL（Prisma対応）
RUN apk add --no-cache \
    curl \
    bash \
    libc6-compat \
    openssl \
    openssl-dev

# 環境変数
ENV PORT=8080
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:./dev.db"
ENV NEXTAUTH_URL="https://chatbot-app-container-fse7g9cnf8hfgpej.japaneast-01.azurewebsites.net"
ENV NEXTAUTH_SECRET="fallback-secret-for-build"
ENV RESEND_API_KEY="fallback-resend-key-for-build"

# package.json と package-lock.json をコピー
COPY package*.json ./

# 依存関係をインストール（devDependenciesも含める - ビルドに必要）
RUN echo "📦 Installing dependencies..." && \
    npm ci && \
    npm cache clean --force && \
    echo "✅ Dependencies installed successfully"

# Prismaスキーマをコピー
COPY prisma ./prisma/

# Prismaクライアント生成（Alpineバイナリ指定）
RUN echo "🔧 Generating Prisma client..." && \
    npx prisma generate --generator client && \
    echo "✅ Prisma client generated successfully"

# アプリケーションコードをコピー
COPY . .

# Next.jsアプリケーションをビルド（詳細ログ付き）
RUN echo "🚀 Building Next.js application..." && \
    SKIP_ENV_VALIDATION=true npm run build && \
    echo "✅ Next.js build completed successfully"

# start.sh スクリプトに実行権限付与
RUN chmod +x start.sh

# 本番用依存関係のみ残す（ビルド後なので安全）
RUN echo "🧹 Cleaning up dev dependencies..." && \
    npm prune --production && \
    echo "✅ Dev dependencies removed"

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080 || exit 1

# ポート公開
EXPOSE 8080

# アプリケーション起動
CMD ["./start.sh"]
