# syntax=docker/dockerfile:1.6
# Multi-stage build for the Komplexáci Next.js app.
# Built by .github/workflows/docker-publish.yml and pushed to GHCR.

# ---------- Stage 1: build ----------
FROM node:22.12.0-alpine3.20 AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Native-module toolchain (better-sqlite3, bufferutil, utf-8-validate, ...).
RUN apk add --no-cache python3 py3-setuptools make g++
ENV PYTHON=/usr/bin/python3

# Dependency layer — kept separate so source changes don't invalidate it.
COPY package.json package-lock.json ./
# `npm install` (not `npm ci`) because `bufferutil` / `utf-8-validate` are
# optional native deps that can't compile on Windows dev machines, so the
# committed lock file omits them. Linux here can compile them.
RUN npm install --no-audit --no-fund

COPY . .

# Build-time public env vars (only NEXT_PUBLIC_* are allowed to be baked in).
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}

RUN npm run build

# ---------- Stage 2: runtime ----------
FROM node:22.12.0-alpine3.20 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# Standalone server.js binds to localhost by default; force all-interfaces.
ENV HOSTNAME=0.0.0.0

# Non-root user. /app/data is the analytics DB mount target (compose-mounted).
RUN addgroup -S nodejs -g 1001 \
 && adduser -S nextjs -u 1001 -G nodejs \
 && mkdir -p /app/data \
 && chown -R nextjs:nodejs /app

# wget (busybox applet) is used by HEALTHCHECK — already present in alpine.

# Next.js standalone output: a self-contained server.js plus the minimal
# node_modules traced by nft. Avoids shipping the full dev tree.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

# Liveness probe — Alpine ships BusyBox wget which only supports a tiny flag
# set: --spider performs a HEAD-style existence check ($? == 0 if the URL is
# reachable). The GNU-only --no-verbose / --tries / --method flags break here.
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3000/api/health || exit 1

# Direct exec so SIGTERM reaches Node and Next shuts down gracefully.
CMD ["node", "server.js"]
