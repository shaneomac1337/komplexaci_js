# Multi-stage build for smaller image
# This Dockerfile is used by GitHub Actions to build and push to GHCR

# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 py3-setuptools make g++
ENV PYTHON=/usr/bin/python3

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build args for Next.js public env vars (required at build time)
# Other secrets (SUPABASE_SERVICE_ROLE_KEY, NEXTAUTH_*, etc.) are runtime-only
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}

# Build the application
RUN npm run build

# Remove devDependencies
RUN npm prune --production

# Stage 2: Production
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/data ./src/data

# Create data directory for analytics
RUN mkdir -p /app/data

EXPOSE 3000
CMD ["npm", "start"]
