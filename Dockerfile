# ============ BUILD STAGE ============================================
FROM --platform=linux/amd64 node:18-bullseye AS builder

WORKDIR /app

# 依存関係をコピーしてインストール
COPY package*.json ./
COPY prisma ./prisma/

# プラットフォーム固有の環境変数
ENV PRISMA_CLI_BINARY_TARGETS="rhel-openssl-1.0.x"
ENV PRISMA_ENGINES_MIRROR="https://binaries.prisma.sh"

RUN npm ci --verbose

# アプリケーションソースをコピー
COPY . .

# Prismaクライアントを生成（linux/amd64用）
RUN npx prisma generate

# Next.jsアプリケーションをビルド（standalone出力）
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ============ PRODUCTION STAGE ========================================
FROM --platform=linux/amd64 node:18-bullseye AS runner

# 必要なパッケージをインストール
RUN apt-get update && apt-get install -y \
    openssl \
    libssl1.1 \
    libssl-dev \
    ca-certificates \
    dumb-init \
    curl \
    libc6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ユーザー作成
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nextjs

# Prisma環境変数設定
ENV PRISMA_CLI_BINARY_TARGETS="rhel-openssl-1.0.x"
ENV PRISMA_ENGINES_MIRROR="https://binaries.prisma.sh"
ENV OPENSSL_CONF=/etc/ssl/openssl.cnf

# ビルド済みアプリケーションをコピー
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./
COPY --from=builder --chown=nextjs:nodejs /app/start.sh ./

# 実行権限と所有者を設定
RUN chmod +x start.sh

# 環境変数設定
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080

USER nextjs

EXPOSE 8080

ENTRYPOINT ["dumb-init", "--"]
CMD ["./start.sh"]
