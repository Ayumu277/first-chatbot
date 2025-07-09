# =====================================================================
# 確実に動作するNext.js 14 + Prisma Dockerfile for Azure App Service
# =====================================================================

# ============ BUILD STAGE ============================================
FROM node:18-alpine AS builder

# ---- build-time deps -------------------------------------------------
RUN apk add --no-cache libc6-compat openssl openssl-dev

WORKDIR /app

# ---- copy package files & install ALL deps (dev + prod) ------------
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --verbose

# ---- copy source code -----------------------------------------------
COPY . .

# ---- generate prisma client -----------------------------------------
ENV PRISMA_CLI_BINARY_TARGETS=linux-musl
RUN npx prisma generate

# ---- build next.js app ----------------------------------------------
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ============ PRODUCTION STAGE ========================================
FROM node:18-alpine AS runner

# ---- install runtime deps -------------------------------------------
RUN apk add --no-cache \
      libc6-compat \
      openssl \
      openssl-dev \
      ca-certificates

WORKDIR /app

# ---- create user -----------------------------------------------------
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# ---- copy built application -----------------------------------------
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.js ./next.config.js

# ---- copy startup script --------------------------------------------
COPY --from=builder --chown=nextjs:nodejs /app/start.sh ./start.sh
RUN chmod +x start.sh

# ---- set environment ------------------------------------------------
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOST=0.0.0.0
ENV HOSTNAME=0.0.0.0
ENV PRISMA_CLI_BINARY_TARGETS=linux-musl

# ---- user permissions -----------------------------------------------
RUN chown -R nextjs:nodejs /app
USER nextjs

# ---- health check ---------------------------------------------------
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080',{timeout:5000},r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# ---- expose port & start --------------------------------------------
EXPOSE 8080
CMD ["./start.sh"]
