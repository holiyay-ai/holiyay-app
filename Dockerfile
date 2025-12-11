# Holiyay API Dockerfile
# Multi-stage build for Bun-based Hono API server
# Adapted for monorepo structure with packages/api

# ============================================
# Stage 1: Base image with Node
# ============================================
FROM node:24-alpine AS base

WORKDIR /app

# ============================================
# Stage 2: Install dependencies
# ============================================
FROM base AS deps

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api/package.json ./packages/api/
COPY packages/web/package.json ./packages/web/

# Install production dependencies only
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate && pnpm install --prod

# ============================================
# Stage 3: Development stage (for dev compose)
# ============================================
FROM base AS dev

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api/package.json ./packages/api/
COPY packages/web/package.json ./packages/web/

# Install all dependencies including dev
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate && pnpm install

# Copy source code
COPY tsconfig.base.json ./
COPY packages/api ./packages/api

WORKDIR /app/packages/api

# Start dev server with hot reload
CMD ["pnpm", "run", "dev"]

# ============================================
# Stage 4: Build stage
# ============================================
FROM base AS builder

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api/package.json ./packages/api/
COPY packages/web/package.json ./packages/web/

# Install all dependencies (including dev for build tools)
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate && pnpm install

# Copy source code and config
COPY tsconfig.base.json ./
COPY packages/api ./packages/api

# Build the API package
WORKDIR /app/packages/api
RUN pnpm run build

# ============================================
# Stage 5: Production runtime
# ============================================
FROM base AS runtime

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S holiyay && \
    adduser -S -u 1001 -G holiyay holiyay

# Copy production dependencies from deps stage
COPY --from=deps /app/.pnpm ./node_modules/.pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules

# Copy built files from builder
COPY --from=builder /app/tsconfig.base.json ./
COPY --from=builder /app/packages/api/dist ./packages/api/dist

# Set ownership to non-root user
RUN chown -R holiyay:holiyay /app

# Switch to non-root user
USER holiyay

WORKDIR /app/packages/api

# Expose the application port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
