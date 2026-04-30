# syntax=docker/dockerfile:1.7
# Multi-stage Dockerfile for the Dynamically web app.
# Builds Next.js with `output: standalone` and ships a minimal runtime image.

ARG NODE_VERSION=20

###############
# 1. Deps     #
###############
FROM node:${NODE_VERSION}-bookworm-slim AS deps
WORKDIR /repo

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/client/package.json packages/client/

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN pnpm install --frozen-lockfile

###############
# 2. Build    #
###############
FROM node:${NODE_VERSION}-bookworm-slim AS builder
WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@10 --activate

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /repo/packages/client/node_modules ./packages/client/node_modules

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @dynamically/web build

# Bundle the migration runner so it has no runtime drizzle-orm dependency
# (better-sqlite3 stays external — it's a native binding the standalone
# output already provides).
RUN npx esbuild apps/web/lib/db/migrate.mjs \
    --bundle --format=esm --platform=node --target=node20 \
    --external:better-sqlite3 \
    --outfile=apps/web/lib/db/migrate.bundled.mjs

###############
# 3. Runtime  #
###############
FROM node:${NODE_VERSION}-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3030
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL=/data/dynamically.db
ENV UPLOAD_DIR=/data/uploads

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs \
  && mkdir -p /data /data/uploads \
  && chown -R nextjs:nodejs /data

# Standalone output
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/standalone /app
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/static /app/apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/public /app/apps/web/public

# Migration files + esbuild-bundled migration runner. The bundle inlines
# drizzle-orm so the only external dep is better-sqlite3, which is already
# traced into the standalone output's node_modules.
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/lib/db/migrations /app/apps/web/lib/db/migrations
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/lib/db/migrate.bundled.mjs /app/apps/web/lib/db/migrate.mjs

USER nextjs
EXPOSE 3030

# Run pending migrations, then start the standalone Next.js server.
CMD ["sh", "-c", "cd /app/apps/web && node lib/db/migrate.mjs && node server.js"]
