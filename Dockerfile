# Multi-stage build for Next.js 14 + Prisma on Azure App Service

# ===== BUILD STAGE =====
FROM node:18-alpine AS builder

# Install dependencies only when needed
RUN apk add --no-cache libc6-compat vips-dev
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# ===== PRODUCTION STAGE =====
FROM node:18-alpine AS runner

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init vips

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# Copy Prisma schema
COPY --from=builder /app/prisma ./prisma/

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy necessary files
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./

# Copy startup script
COPY start.sh ./
RUN chmod +x start.sh

# Set proper permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port 8080 (Azure App Service default)
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["./start.sh"]