# Ubuntu ベースのNode.jsイメージを使用（Prismaエンジン互換性のため）
FROM node:18-bullseye

# 必要なパッケージをインストール
RUN apt-get update && apt-get install -y \
    openssl \
    libssl1.1 \
    ca-certificates \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ユーザー作成
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nextjs

# Prismaがバイナリエンジンを使うよう指定（最重要）
ENV PRISMA_CLI_QUERY_ENGINE_TYPE="binary"

# 依存関係をコピーしてインストール
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci && npm cache clean --force \
    && npx prisma generate

# アプリケーションファイルをコピー
COPY --chown=nextjs:nodejs .next/standalone ./
COPY --chown=nextjs:nodejs .next/static ./.next/static
COPY --chown=nextjs:nodejs public ./public
COPY --chown=nextjs:nodejs next.config.js ./
COPY --chown=nextjs:nodejs web.config ./
COPY --chown=nextjs:nodejs start.sh ./

# 実行権限と所有者を設定
RUN chmod +x start.sh
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 8080

ENTRYPOINT ["dumb-init", "--"]
CMD ["./start.sh"]
