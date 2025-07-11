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

# ビルド用のダミー環境変数を設定
ENV DATABASE_URL="sqlserver://localhost:1433;database=dummy;user=dummy;password=dummy;encrypt=true"
ENV NEXTAUTH_SECRET="dummy-secret-for-build"
ENV NEXTAUTH_URL="http://localhost:8080"
ENV OPENAI_API_KEY="dummy-key-for-build"
ENV EMAIL_USER="dummy@example.com"
ENV GMAIL_APP_PASSWORD="dummy-password"

# デバッグ：Node.jsとnpmのバージョン確認
RUN echo "Node.js version: $(node --version)" && \
    echo "npm version: $(npm --version)" && \
    echo "Available memory: $(free -h)" && \
    echo "Platform: $TARGETPLATFORM"

# ビルドに必要な全ての依存関係をインストール（--omit=devを削除）
RUN npm ci --verbose

# アプリケーションソースをコピー
COPY . .

# デバッグ：Prisma生成前の状況確認
RUN echo "Generating Prisma client..." && \
    npx prisma generate && \
    echo "Prisma client generated successfully"

# デバッグ：ビルド前の状況確認
RUN echo "Starting Next.js build..." && \
    echo "NODE_ENV: $NODE_ENV" && \
    echo "NODE_OPTIONS: $NODE_OPTIONS" && \
    ls -la .next 2>/dev/null || echo "No .next directory yet"

# Next.jsアプリケーションをビルド
RUN npm run build

# ビルド完了確認
RUN echo "✅ Build completed successfully" && \
    ls -la .next/ && \
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
