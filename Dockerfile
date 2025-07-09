# =====================================================================
# 確実に動作するNext.js 14 + Prisma Dockerfile for Azure App Service
# =====================================================================

# ============ BUILD STAGE ============================================
FROM node:18-alpine AS builder

# ---- build-time deps -------------------------------------------------
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# ---- copy package files & install ALL deps (dev + prod) ------------
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --verbose

# ---- copy source code -----------------------------------------------
COPY . .

# ---- generate prisma client -----------------------------------------
RUN npx prisma generate

# ---- build next.js app ----------------------------------------------
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ============ RUNTIME STAGE ==========================================
FROM node:18-slim AS runner

# ---- install runtime dependencies -----------------------------------
RUN apt-get update && \
    apt-get install -y libssl3 dumb-init && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ---- create non-root user ------------------------------------------
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# ---- copy package files & install production deps -----------------
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ---- copy built application from builder ---------------------------
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js

# ---- copy prisma configuration -------------------------------------
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# ---- copy app source for API routes --------------------------------
COPY --from=builder /app/app ./app
COPY --from=builder /app/types ./types

# ---- copy startup script -------------------------------------------
COPY start.sh ./
RUN chmod +x start.sh

# ---- set proper permissions ----------------------------------------
RUN chown -R nextjs:nodejs /app
USER nextjs

# ---- environment configuration -------------------------------------
EXPOSE 8080
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0
ENV HOSTNAME=0.0.0.0

# ---- healthcheck ---------------------------------------------------
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080',{timeout:5000},r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# ---- startup -------------------------------------------------------
ENTRYPOINT ["dumb-init", "--"]
CMD ["./start.sh"]
