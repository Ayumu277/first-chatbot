# ===== NEXT.JS CHATBOT APPLICATION - PRODUCTION BUILD =====
# Build timestamp: 2025-01-11
FROM node:18-alpine

WORKDIR /app

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

# package.json と package-lock.json をコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci --only=production && npm cache clean --force

# Prismaスキーマをコピー
COPY prisma ./prisma/

# Prismaクライアント生成（Alpineバイナリ指定）
RUN npx prisma generate --generator client

# アプリケーションコードをコピー
COPY . .

# Next.js設定を修正（動的ルート対応）
RUN echo 'module.exports = { output: "standalone", experimental: { appDir: true } }' > next.config.temp.js

# Next.jsアプリケーションをビルド（静的生成無効）
RUN SKIP_ENV_VALIDATION=true npm run build

# start.sh スクリプトに実行権限付与
RUN chmod +x start.sh

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080 || exit 1

# ポート公開
EXPOSE 8080

# アプリケーション起動
CMD ["./start.sh"]
