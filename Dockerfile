# ============ BUILD STAGE ============================================
FROM node:18-bullseye AS builder

# プラットフォームを動的に設定
ARG TARGETPLATFORM
ARG BUILDPLATFORM

WORKDIR /app

# 依存関係をコピーしてインストール
COPY package*.json ./
COPY prisma ./prisma/

# プラットフォーム固有の環境変数
ENV PRISMA_CLI_BINARY_TARGETS="debian-openssl-1.1.x,rhel-openssl-1.0.x,linux-musl"
ENV PRISMA_ENGINES_MIRROR="https://binaries.prisma.sh"
ENV OPENSSL_CONF=/etc/ssl/openssl.cnf

# Node.js環境設定
ENV NODE_OPTIONS="--max_old_space_size=2048"
ENV CI=true
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# ビルド用の安全な環境変数を設定（実際のシークレットは含まない）
ENV DATABASE_URL="file:./build.db"
ENV NEXTAUTH_SECRET="build-time-secret"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV OPENAI_API_KEY="sk-build-time-key"
ENV EMAIL_USER="build@example.com"
ENV EMAIL_PASSWORD="build-password"

# デバッグ：Node.jsとnpmのバージョン確認
RUN echo "Node.js version: $(node --version)" && \
    echo "npm version: $(npm --version)" && \
    echo "Available memory: $(free -h)" && \
    echo "Platform: $TARGETPLATFORM"

# 全ての依存関係をインストール
RUN npm ci

# アプリケーションソースをコピー
COPY . .

# Prismaクライアント生成（ビルド用データベースファイルを使用）
RUN echo "Generating Prisma client for build..." && \
    touch build.db && \
    npx prisma db push --force-reset --accept-data-loss || echo "DB push failed, continuing..." && \
    npx prisma generate && \
    echo "Prisma client generated successfully"

# Next.jsアプリケーションをビルド
RUN echo "Starting Next.js build..." && \
    npm run build && \
    echo "✅ Build completed successfully"

# ビルド完了確認
RUN ls -la .next/ && \
    echo "📦 Build artifacts ready for production"

# ============ PRODUCTION STAGE ========================================
FROM node:18-bullseye-slim AS runner

# 必要なパッケージをインストール
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    dumb-init \
    netstat-nat \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ユーザー作成
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nextjs

# package.jsonとprismaディレクトリを先にコピー（postinstall用）
COPY --from=builder /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# 全ての依存関係をインストール（postinstallでprisma generateが実行される）
RUN npm ci && npm cache clean --force

# ビルド成果物をコピー
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./

# 改善されたスクリプトファイルをコピー
COPY --from=builder --chown=nextjs:nodejs /app/start.sh ./start.sh
COPY --from=builder --chown=nextjs:nodejs /app/server.js ./server.js

# Prismaクライアントをコピー
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# 実行権限設定
RUN chmod +x start.sh && chown nextjs:nodejs start.sh server.js

USER nextjs

# 環境変数設定
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080

EXPOSE 8080

ENTRYPOINT ["dumb-init", "--"]
CMD ["./start.sh"]
