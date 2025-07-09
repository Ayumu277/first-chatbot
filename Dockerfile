# =====================================================================
# Multi-stage build for Next.js 14 + Prisma on Azure App Service
# =====================================================================

# ============ BUILD STAGE ============================================
FROM node:18-alpine AS builder

# ---- build-time deps -------------------------------------------------
RUN apk add --no-cache \
      libc6-compat \
      vips-dev \
      openssl

WORKDIR /app

# ---- install node deps (incl. dev) ----------------------------------
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --verbose

# ---- copy source & generate client ----------------------------------
COPY . .
# Prisma生成（エラーハンドリング付き）
RUN npx prisma generate || echo "Prisma generate failed, continuing..."

# ---- build ----------------------------------------------------------
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# ✅ TailwindはNext.jsがPostCSS経由で処理するのでCLIビルド不要！
RUN npm run build

# ============ RUNTIME STAGE ==========================================
FROM node:18-slim AS runner

# ---- runtime deps ----------------------------------------------------
RUN apt-get update && \
    apt-get install -y \
      libssl3 \
      dumb-init \
      libvips-dev && \
    rm -rf /var/lib/apt/lists/*

# ---- app dir --------------------------------------------------------
WORKDIR /app

# ---- copy prisma first for postinstall script ----------------------
COPY --from=builder /app/prisma            ./prisma/

# ---- install production deps ----------------------------------------
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ---- create non-root user ------------------------------------------
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# ---- copy application files -----------------------------------------
COPY --from=builder /app/.next/standalone  ./
COPY --from=builder /app/.next/static      ./.next/static
COPY --from=builder /app/public            ./public
COPY --from=builder /app/next.config.js    ./
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/app/globals.css   ./app/globals.css

# ---- startup script -------------------------------------------------
COPY start.sh ./
RUN chmod +x start.sh

# ---- set permissions for nextjs user --------------------------------
RUN chown -R nextjs:nodejs /app

# ---- switch to non-root ---------------------------------------------
USER nextjs

# ---- ports & env ----------------------------------------------------
EXPOSE 8080
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0
ENV HOSTNAME=0.0.0.0

# ---- healthcheck ---------------------------------------------------
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=5 \
  CMD node -e "require('http').get('http://localhost:8080', {timeout: 10000}, r => process.exit(r.statusCode===200?0:1)).on('error', () => process.exit(1))"

# ---- entrypoint ----------------------------------------------------
ENTRYPOINT ["dumb-init", "--"]
CMD ["./start.sh"]
