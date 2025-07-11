# ===== NEXT.JS CHATBOT APPLICATION - PRODUCTION BUILD =====
FROM node:18-alpine

WORKDIR /app

# 基本パッケージ
RUN apk add --no-cache \
    curl \
    bash \
    libc6-compat

# 環境変数
ENV PORT=8080
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# package.json と package-lock.json をコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci --only=production && npm cache clean --force

# Prismaスキーマをコピー
COPY prisma ./prisma/

# Prismaクライアント生成
RUN npx prisma generate

# アプリケーションコードをコピー
COPY . .

# Next.jsアプリケーションをビルド
RUN npm run build

# start.sh スクリプトに実行権限付与
RUN chmod +x start.sh

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080 || exit 1

# ポート公開
EXPOSE 8080

# アプリケーション起動
CMD ["./start.sh"]
