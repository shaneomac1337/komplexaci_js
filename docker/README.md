# Komplexaci Docker Documentation

Complete reference for building, running, and managing the Komplexaci Next.js gaming community website in containerized environments.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Dockerfile Reference](#dockerfile-reference)
- [Docker Compose Configuration](#docker-compose-configuration)
- [Volume Mounts](#volume-mounts)
- [Environment Variables](#environment-variables)
- [Building and Running](#building-and-running)
- [Development vs Production](#development-vs-production)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

Komplexaci is a Next.js 15.3.3 gaming community website with the following components:
- Next.js application running on Node.js 24 Alpine
- SQLite database for analytics persistence
- Discord.js bot integration with persistent connection
- Supabase authentication
- Tailwind CSS styling

The Docker setup includes:
- **Dockerfile**: Multi-stage build optimized for production
- **docker-compose.yml**: Orchestration with persistent data volumes and health checks

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Git with LFS support (for large file handling)
- `.env` file in the docker context directory

### Basic Setup

```bash
# Navigate to the docker directory
cd docker/

# Build the image
docker build -t komplexaci:latest .

# Run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f komplexaci-app

# Check container status
docker-compose ps

# Stop the application
docker-compose down
```

### Verify Running Application

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# View container logs
docker-compose logs -f

# Inspect container details
docker-compose exec komplexaci-app sh
```

## Dockerfile Reference

### Build Base Image

**Base Image**: `node:24-alpine`

Alpine Linux provides a minimal image (5-6MB) while Node.js 24 ensures modern JavaScript support and security patches.

```dockerfile
FROM node:24-alpine
```

### Build Dependencies Installation

Required for compiling native modules (better-sqlite3, sqlite3):

```dockerfile
RUN apk add --no-cache \
    python3 \
    python3-dev \
    py3-setuptools \
    make \
    g++ \
    git \
    git-lfs
```

**Dependencies Rationale**:
- `python3`, `python3-dev`, `py3-setuptools`: Required by node-gyp for native module compilation
- `make`, `g++`: Compilation tools for C++ native modules
- `git`, `git-lfs`: Repository cloning and Large File Storage support

### Python Environment Configuration

```dockerfile
ENV PYTHON=/usr/bin/python3
```

Explicitly sets Python path for node-gyp to prevent build failures.

### Repository Cloning

```dockerfile
RUN git clone https://github.com/shaneomac1337/komplexaci_js.git . && \
    git lfs pull
```

**Note**: This approach requires the Dockerfile to be located in the docker/ directory with proper build context configuration.

### Dependency Installation

```dockerfile
RUN npm ci
```

Uses `npm ci` (clean install) instead of `npm install` for:
- Deterministic dependency resolution (respects package-lock.json)
- Better Docker layer caching
- Faster and more reliable installations

### Build Process

```dockerfile
RUN npm run build
```

Executes Next.js build process (from package.json scripts):
```json
{
  "scripts": {
    "build": "next build"
  }
}
```

Generates optimized production bundle in `.next/` directory.

### Dependency Pruning

```dockerfile
RUN npm prune --production && \
    apk del python3 python3-dev py3-setuptools make g++ git git-lfs
```

**Purpose**:
- Removes devDependencies (@types, eslint, tailwindcss, typescript, etc.)
- Deletes build tools no longer needed at runtime
- Reduces final image size from ~800MB to ~300MB

**Removed Packages**:
- `python3`: Not required at runtime
- Compilation tools: Only needed during build phase
- Git/LFS: Source already cloned
- Build tools (g++, make): Not needed for running application

### Port Exposure

```dockerfile
EXPOSE 3000
```

Declares that the application listens on port 3000. This is informational; actual port mapping occurs in docker-compose.yml or run command.

### Container Startup

```dockerfile
CMD ["npm", "start"]
```

Starts the Next.js production server (from package.json):
```json
{
  "scripts": {
    "start": "next start"
  }
}
```

## Docker Compose Configuration

### Version and Schema

```yaml
version: '3.8'
```

Supports:
- Named volumes
- Health checks
- User/group support
- Advanced networking

### Service Configuration

#### Service Name: `komplexaci-app`

```yaml
komplexaci-app:
  build:
    context: .
    dockerfile: Dockerfile
  image: komplexaci:latest
  container_name: komplexaci-web
  restart: unless-stopped
```

**Configuration Details**:

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `build.context` | `.` | Build context (docker/ directory) |
| `build.dockerfile` | `Dockerfile` | Dockerfile location relative to context |
| `image` | `komplexaci:latest` | Image name and tag |
| `container_name` | `komplexaci-web` | Container hostname |
| `restart` | `unless-stopped` | Auto-restart on crash (except manual stop) |

### Networking Configuration

```yaml
network_mode: host
ports:
  - "3000:3000"
```

**Network Mode: `host`**

- Container shares host network interface
- Eliminates network overhead
- Direct access to host network resources
- Required for Discord.js bot maintaining persistent connections
- Enables better performance for local development

**Restrictions**:
- Cannot use bridge networking with host mode
- Port mapping is redundant but documented for clarity
- Limited to Linux hosts (Windows/Mac use default network)

### Environment Variables

```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
  - ANALYTICS_DATA_DIR=/app/data
```

**Environment Variables**:

| Variable | Value | Purpose |
|----------|-------|---------|
| `NODE_ENV` | `production` | Next.js optimization level, disables debug output |
| `PORT` | `3000` | Server listening port |
| `ANALYTICS_DATA_DIR` | `/app/data` | SQLite database directory in container |

Additional environment variables should be loaded from `.env` file (mounted at runtime or copied during build).

### Volume Mounts

```yaml
volumes:
  - /etc/localtime:/etc/localtime:ro
  - analytics-data:/app/data
```

**Volume Details**:

| Mount Path | Type | Purpose | Mode |
|-----------|------|---------|------|
| `/etc/localtime` | Bind | Container timezone sync | `ro` (read-only) |
| `analytics-data` | Named | SQLite database persistence | `rw` (read-write) |

### Health Check Configuration

```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

**Health Check Parameters**:

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `test` | wget health endpoint | Verifies application responsiveness |
| `interval` | 30s | Check frequency |
| `timeout` | 10s | Maximum wait for response |
| `retries` | 3 | Consecutive failures before unhealthy |
| `start_period` | 40s | Grace period before first check |

**Health Check Endpoint**: `/api/health`

- Must return HTTP 200 status code
- Implement in your Next.js API routes if not existing

Example implementation:

```typescript
// app/api/health/route.ts
export async function GET() {
  return new Response(JSON.stringify({ status: 'ok' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### Volume Definitions

```yaml
volumes:
  analytics-data:
    driver: local
```

**Volume Configuration**:
- **Name**: `analytics-data`
- **Driver**: `local` (stored on host machine)
- **Path**: Typically `/var/lib/docker/volumes/analytics-data/_data/`

## Volume Mounts

### Analytics Data Persistence

The `analytics-data` volume ensures SQLite database persistence across container restarts.

### Volume Location Reference

**Linux/macOS (Docker Desktop)**:
```
/var/lib/docker/volumes/analytics-data/_data/
```

**Windows (Docker Desktop)**:
```
\\wsl.localhost\docker-desktop-data\version-pack-data\community\docker\volumes\analytics-data\_data\
```

### Database File Paths

SQLite database files stored in `/app/data` within container:
- Analytics database: `/app/data/analytics.db`
- User data: `/app/data/users.db`

### Backup and Restore

#### Backup Analytics Data

```bash
# Create backup directory
mkdir -p ./backups

# Copy volume data to host
docker cp komplexaci-web:/app/data ./backups/data_$(date +%Y%m%d_%H%M%S)
```

#### Restore from Backup

```bash
# Stop container
docker-compose down

# Copy backup to volume
docker run --rm -v analytics-data:/app/data \
  -v "$(pwd)/backups/data:/backup" \
  alpine cp -r /backup/* /app/data/

# Restart container
docker-compose up -d
```

#### Export Volume to Archive

```bash
# Create compressed backup
docker run --rm -v analytics-data:/app/data \
  -v "$(pwd):/backup" \
  alpine tar czf /backup/analytics_backup_$(date +%Y%m%d).tar.gz -C /app/data .

# Verify backup
tar tzf ./analytics_backup_*.tar.gz | head -10
```

### Volume Cleanup

**Caution**: This permanently deletes data.

```bash
# Remove unused volumes
docker volume prune

# Remove specific volume
docker volume rm analytics-data

# List all volumes
docker volume ls
```

## Environment Variables

### Build-Time Variables

Passed to Dockerfile during build process. Modify `docker-compose.yml` build section:

```yaml
build:
  context: .
  dockerfile: Dockerfile
  args:
    BUILD_ENV: production
```

### Runtime Variables

Loaded by the application at startup. Set in `docker-compose.yml` or `.env` file.

### Complete Environment Variable Reference

#### Core Application Variables

| Variable | Type | Default | Required | Purpose |
|----------|------|---------|----------|---------|
| `NODE_ENV` | string | `production` | Yes | Node.js environment (affects optimizations) |
| `PORT` | number | `3000` | Yes | Server listening port |
| `ANALYTICS_DATA_DIR` | string | `/app/data` | Yes | SQLite database directory |

#### Next.js Specific Variables

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `NEXT_PUBLIC_*` | any | N/A | Exposed to browser (prefix required) |
| `NEXT_TELEMETRY_DISABLED` | boolean | `false` | Disable telemetry (set `1` to disable) |
| `__NEXT_PRIVATE_STANDALONE` | boolean | `false` | Standalone build flag |

#### Authentication Variables

| Variable | Type | Required | Purpose |
|----------|------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | string | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | string | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | string | Yes | Supabase service role key |

#### Discord Bot Variables

| Variable | Type | Required | Purpose |
|----------|------|----------|---------|
| `DISCORD_BOT_TOKEN` | string | Yes | Bot token for Discord API |
| `DISCORD_CLIENT_ID` | string | Yes | Application client ID |
| `DISCORD_CLIENT_SECRET` | string | Yes | Application secret |

#### NextAuth Variables

| Variable | Type | Required | Purpose |
|----------|------|----------|---------|
| `NEXTAUTH_SECRET` | string | Yes | Encryption key (generate with `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | string | Yes | Callback URL (e.g., `http://localhost:3000`) |

### Setting Environment Variables

#### Method 1: Docker Compose `.env` File

Create `.env` in docker/ directory:

```env
NODE_ENV=production
PORT=3000
ANALYTICS_DATA_DIR=/app/data

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here

NEXTAUTH_SECRET=your_random_secret_here
NEXTAUTH_URL=http://localhost:3000
```

Docker Compose automatically loads this file.

#### Method 2: Environment File in docker-compose.yml

```yaml
services:
  komplexaci-app:
    environment:
      - NODE_ENV=production
      - PORT=3000
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - DISCORD_BOT_TOKEN=${DISCORD_BOT_TOKEN}
```

#### Method 3: Command Line Override

```bash
docker-compose run -e NODE_ENV=development komplexaci-app npm run dev
```

#### Method 4: .env File in Project Root

Place `.env.production` in project root before building:

```env
# .env.production
ANALYTICS_DATA_DIR=/app/data
NEXTAUTH_SECRET=your_secret
```

Docker build copies this via `COPY .env .env` in Dockerfile.

### Environment Variable Validation

Add validation in Next.js app:

```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  DISCORD_BOT_TOKEN: z.string(),
  NEXTAUTH_SECRET: z.string().min(32),
});

export const env = envSchema.parse(process.env);
```

## Building and Running

### Build Commands

#### Standard Build

```bash
cd docker/
docker build -t komplexaci:latest .
```

**Build Output**:
- Creates image tag `komplexaci:latest`
- Estimated size: 300-350MB (after pruning)
- Build time: 3-5 minutes (depending on network/hardware)

#### Build with Build Arguments

```bash
docker build \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  -t komplexaci:latest \
  .
```

#### Build Specific Stage (Multi-stage)

```bash
# Build only to specific stage
docker build --target builder -t komplexaci:builder .
```

#### Build with No Cache

```bash
docker build --no-cache -t komplexaci:latest .
```

### Running Containers

#### Start with Docker Compose

```bash
# Start in background
docker-compose up -d

# Start and view logs
docker-compose up -f

# Start specific service
docker-compose up -d komplexaci-app
```

#### Run Single Container

```bash
# Run with port mapping
docker run -p 3000:3000 \
  -v analytics-data:/app/data \
  -e NODE_ENV=production \
  komplexaci:latest

# Run with environment file
docker run -p 3000:3000 \
  --env-file .env \
  -v analytics-data:/app/data \
  komplexaci:latest
```

#### Run with Interactive Shell

```bash
# Execute bash in running container
docker-compose exec komplexaci-app sh

# OR run new container with shell
docker run -it --rm komplexaci:latest sh
```

### Container Management Commands

#### View Container Status

```bash
# List running containers
docker-compose ps

# View all containers
docker-compose ps -a

# Inspect container details
docker-compose logs komplexaci-app

# View last 100 lines
docker-compose logs --tail 100 komplexaci-app

# Follow logs in real-time
docker-compose logs -f komplexaci-app
```

#### Container Operations

```bash
# Pause container
docker-compose pause komplexaci-app

# Unpause container
docker-compose unpause komplexaci-app

# Restart container
docker-compose restart komplexaci-app

# Stop container gracefully (30s timeout)
docker-compose stop komplexaci-app

# Force stop container
docker-compose kill komplexaci-app

# Remove stopped container
docker-compose rm komplexaci-app

# Stop all services and remove containers
docker-compose down

# Remove everything including volumes
docker-compose down -v
```

#### Inspect Container Details

```bash
# View container configuration
docker-compose config

# Inspect running processes
docker-compose top komplexaci-app

# View port mappings
docker-compose port komplexaci-app 3000

# View resource usage
docker stats komplexaci-app
```

## Development vs Production

### Development Configuration

Used for local development with faster iteration and debug capabilities.

#### Development docker-compose.yml Override

Create `docker-compose.override.yml`:

```yaml
version: '3.8'

services:
  komplexaci-app:
    build:
      context: ..
      dockerfile: docker/Dockerfile
      target: development
    volumes:
      - ../:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DEBUG=komplexaci:*
    command: npm run dev
    ports:
      - "3000:3000"
      - "9229:9229"  # Node.js debugging port
```

#### Development Build with Volume Mounting

```bash
# Mount source code for hot reload
docker run -it \
  -v "$(pwd):/app" \
  -v /app/node_modules \
  -p 3000:3000 \
  -e NODE_ENV=development \
  komplexaci:latest \
  npm run dev
```

#### Development Features

- Hot module reloading (HMR)
- Source maps for debugging
- Extended logging output
- Dev tools and React DevTools
- Turbopack compiler (configured in package.json)

### Production Configuration

Current configuration in docker-compose.yml optimized for production.

#### Production Characteristics

| Aspect | Configuration | Benefit |
|--------|---------------|---------|
| Build | Multi-stage, pruned | ~300MB image size |
| Base Image | Alpine | Fast startup, minimal attack surface |
| Node.js | 24-LTS | Security patches, performance |
| Health Checks | Enabled | Automatic restart on failure |
| Restart Policy | `unless-stopped` | Persistent operation |
| Network | Host mode | Direct network access |
| Logging | Structured output | Container log aggregation |

#### Production Deployment Checklist

- [ ] All environment variables set securely (.env file not committed)
- [ ] Database volume created and mounted
- [ ] Health check endpoint implemented
- [ ] NEXTAUTH_SECRET generated and configured
- [ ] Discord bot token secured in secrets
- [ ] Supabase keys configured for production project
- [ ] NEXTAUTH_URL points to production domain
- [ ] Container image built and tagged
- [ ] Volumes backed up before deployment
- [ ] Logs monitored via Docker Compose or log driver
- [ ] Network policies reviewed for security

#### Scaling in Production

##### Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml komplexaci

# Scale service
docker service scale komplexaci_komplexaci-app=3
```

##### Kubernetes

Convert docker-compose.yml to Kubernetes manifests:

```bash
# Using Kompose
kompose convert -f docker-compose.yml -o k8s/

# Deploy to cluster
kubectl apply -f k8s/
```

#### Production Environment Variables

Sensitive variables should be managed via:
- Secrets management (Docker Secrets, Kubernetes Secrets)
- Environment-specific .env files (not committed)
- CI/CD pipeline variable injection

```bash
# Example for production
export NODE_ENV=production
export NEXTAUTH_SECRET="$(openssl rand -base64 32)"
export DISCORD_BOT_TOKEN="your_secure_token"
```

## Troubleshooting

### Container Fails to Start

**Issue**: Container exits immediately

**Diagnosis**:
```bash
# View container logs
docker-compose logs komplexaci-app

# Check exit code
docker-compose ps

# Inspect last few lines of logs
docker-compose logs --tail 50 komplexaci-app
```

**Common Causes**:

1. **Missing environment variables**
   - Error: `Error: NEXTAUTH_SECRET is not defined`
   - Solution: Ensure `.env` file exists with required variables
   ```bash
   # Verify .env file
   ls -la docker/.env
   cat docker/.env | grep NEXTAUTH_SECRET
   ```

2. **Missing .env file**
   - Error: `COPY .env: file not found`
   - Solution: Create .env in docker context before building
   ```bash
   touch docker/.env
   docker build --no-cache -t komplexaci:latest docker/
   ```

3. **Port already in use**
   - Error: `bind: address already in use`
   - Solution: Change port mapping or stop conflicting service
   ```bash
   # Find process using port 3000
   lsof -i :3000
   # Change docker-compose port
   docker-compose down
   # Edit docker-compose.yml ports: "3001:3000"
   docker-compose up -d
   ```

4. **Build dependencies missing**
   - Error: `command not found: python3`
   - Solution: Rebuild with updated Dockerfile
   ```bash
   docker build --no-cache -t komplexaci:latest docker/
   ```

### Health Check Failing

**Issue**: Container marked as unhealthy

**Diagnosis**:
```bash
# View health check status
docker-compose ps

# Check container health details
docker inspect komplexaci-web | grep -A 10 '"Health"'

# Test health endpoint manually
curl -v http://localhost:3000/api/health
```

**Solutions**:

1. **Health endpoint not responding**
   - Verify endpoint exists in Next.js API routes
   - Check application startup is complete
   - Increase `start_period` if startup is slow
   ```yaml
   healthcheck:
     start_period: 60s  # Increase from 40s
   ```

2. **Network connectivity issue**
   - Test from container
   ```bash
   docker-compose exec komplexaci-app wget -O - http://localhost:3000/api/health
   ```

3. **Application errors**
   - Check application logs
   ```bash
   docker-compose logs -f komplexaci-app | grep -i error
   ```

### Database Issues

**Issue**: Analytics database not persisting

**Diagnosis**:
```bash
# Check volume is mounted
docker-compose exec komplexaci-app ls -la /app/data

# Verify volume exists
docker volume ls | grep analytics-data

# Check volume location
docker volume inspect analytics-data
```

**Solutions**:

1. **Volume not created**
   ```bash
   # Create volume explicitly
   docker volume create analytics-data

   # Restart with volume
   docker-compose down
   docker-compose up -d
   ```

2. **Permission issues**
   - Ensure container user can write to /app/data
   ```bash
   # Check permissions
   docker-compose exec komplexaci-app ls -la /app/data

   # Fix permissions
   docker-compose exec -u root komplexaci-app chmod 755 /app/data
   ```

3. **Database file corruption**
   - Restore from backup
   ```bash
   # Backup corrupted database
   docker cp komplexaci-web:/app/data/analytics.db ./analytics.db.backup

   # Restore from clean backup
   docker run --rm -v analytics-data:/app/data \
     -v "$(pwd)/backups/data:/backup" \
     alpine cp /backup/analytics.db /app/data/
   ```

### Memory or Resource Issues

**Issue**: Container running slowly or being killed

**Diagnosis**:
```bash
# Monitor resource usage
docker stats komplexaci-app

# Check available disk space
docker system df

# View Docker logs for OOMKilled
docker-compose logs komplexaci-app | grep -i oom
```

**Solutions**:

1. **Out of memory**
   - Increase Docker memory limit (Docker Desktop settings)
   - Optimize Next.js build (enable SWC minification)
   ```bash
   # Rebuild without cache
   docker build --no-cache -t komplexaci:latest docker/
   ```

2. **Disk space low**
   - Clean up unused images, containers, volumes
   ```bash
   # Remove unused resources
   docker system prune -a

   # Safely remove dangling images
   docker image prune
   ```

3. **Database file large**
   - Check analytics.db size
   ```bash
   docker-compose exec komplexaci-app du -sh /app/data/analytics.db

   # Vacuum database to reclaim space
   docker-compose exec komplexaci-app sqlite3 /app/data/analytics.db VACUUM
   ```

### Networking Issues

**Issue**: Application inaccessible or connection problems

**Diagnosis**:
```bash
# Test connectivity from host
curl -v http://localhost:3000

# Test from container
docker-compose exec komplexaci-app wget -O - http://localhost:3000

# Check network configuration
docker-compose exec komplexaci-app ip addr

# Test DNS resolution
docker-compose exec komplexaci-app nslookup github.com
```

**Solutions**:

1. **Host mode network issues (Linux)**
   - Host mode on Linux requires privileged mode
   ```bash
   # Verify host mode works
   docker-compose exec komplexaci-app netstat -tulpn | grep 3000
   ```

2. **Windows/Mac Docker Desktop**
   - Host mode unsupported; falls back to bridge
   - Change docker-compose.yml to use bridge network
   ```yaml
   services:
     komplexaci-app:
       # Remove or change: network_mode: host
       ports:
         - "3000:3000"
   ```

3. **Firewall blocking**
   - Allow port 3000 in firewall
   - Check host firewall settings

### Discord Bot Connection Issues

**Issue**: Bot not connecting or commands not responding

**Diagnosis**:
```bash
# Check bot token validity
# View Discord-related logs
docker-compose logs komplexaci-app | grep -i discord

# Test bot connection from container
docker-compose exec komplexaci-app \
  node -e "console.log('Bot token:', process.env.DISCORD_BOT_TOKEN ? 'set' : 'missing')"
```

**Solutions**:

1. **Invalid token**
   - Regenerate token in Discord Developer Portal
   - Update DISCORD_BOT_TOKEN in .env
   - Restart container
   ```bash
   docker-compose down
   docker-compose up -d
   ```

2. **Missing intents**
   - Ensure bot has required intents enabled in Discord Developer Portal
   - Verify discord.js intents configuration in code

3. **Rate limiting**
   - Check Discord API rate limit status
   - Implement exponential backoff in bot code

### Build Failures

**Issue**: Docker build fails

**Diagnosis**:
```bash
# Rebuild with full output
docker build --progress=plain -t komplexaci:latest docker/ 2>&1 | tail -100

# Check npm install issues
docker build --target builder -t komplexaci:builder docker/
docker run komplexaci:builder npm list
```

**Common Build Errors**:

1. **Git clone fails**
   - Error: `fatal: not a git repository`
   - Solution: Ensure git is installed in Dockerfile
   - Verify repository URL is accessible

2. **npm ci fails**
   - Error: `npm ERR! cipm can only install packages with an existing package-lock.json`
   - Solution: Commit package-lock.json to repository
   ```bash
   cd project/
   npm ci
   git add package-lock.json
   git commit -m "Update dependencies"
   ```

3. **Native module compilation fails**
   - Error: `gyp ERR! build error`
   - Solution: Ensure build dependencies installed in Dockerfile
   ```bash
   # Install additional dependencies if needed
   apk add --no-cache libc6-compat
   ```

### Docker System Issues

**Issue**: Docker daemon or system problems

**Diagnosis**:
```bash
# Check Docker daemon status
docker info

# Verify Docker socket permissions
ls -la /var/run/docker.sock

# Check Docker logs
docker logs
```

**Solutions**:

1. **Docker daemon not running**
   - Start Docker Desktop or Docker daemon
   ```bash
   # Linux systemd
   sudo systemctl start docker

   # macOS
   open /Applications/Docker.app
   ```

2. **Permission denied errors**
   - Add user to docker group
   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```

3. **Disk space full**
   - Clean Docker resources
   ```bash
   docker system prune -a --volumes
   ```

## Best Practices

### Image Size Optimization

1. **Multi-stage builds**: Current Dockerfile uses implicit multi-stage approach
2. **Alpine base**: Reduces image from 1GB+ to 300MB
3. **Dependency pruning**: Removes devDependencies post-build
4. **Minimal layers**: Combines RUN commands with &&

**Image size benchmarks**:
- Base node:24-alpine: ~200MB
- With dependencies: ~600MB
- After build and prune: ~300MB

### Security Best Practices

1. **Don't run as root**
   - Add USER directive to Dockerfile
   ```dockerfile
   RUN addgroup -g 1001 -S nodejs && \
       adduser -S nodejs -u 1001
   USER nodejs
   ```

2. **Secret management**
   - Never commit .env files
   - Use Docker Secrets for sensitive data
   - Rotate secrets regularly
   ```bash
   # Generate new NEXTAUTH_SECRET
   openssl rand -base64 32
   ```

3. **Image scanning**
   - Use trivy or similar tools
   ```bash
   trivy image komplexaci:latest
   ```

4. **Network security**
   - Use bridge network instead of host in production
   - Implement network policies
   - Use TLS for external connections

### Performance Optimization

1. **Layer caching**
   - Order Dockerfile commands by change frequency
   - Install dependencies before copying code
   ```dockerfile
   # Dependencies change less frequently
   RUN npm ci
   # Code changes frequently
   COPY . .
   ```

2. **Build cache**
   - Use --cache-from for CI/CD
   ```bash
   docker build --cache-from komplexaci:latest -t komplexaci:latest .
   ```

3. **Resource limits**
   - Set memory limits in docker-compose.yml
   ```yaml
   services:
     komplexaci-app:
       mem_limit: 512m
       memswap_limit: 1g
       cpus: '1.0'
   ```

### Logging Best Practices

1. **Structured logging**
   - Log to stdout/stderr for Docker capture
   ```typescript
   console.log(JSON.stringify({
     timestamp: new Date().toISOString(),
     level: 'info',
     message: 'Application started'
   }));
   ```

2. **Log rotation**
   - Configure Docker logging driver
   ```yaml
   services:
     komplexaci-app:
       logging:
         driver: json-file
         options:
           max-size: '10m'
           max-file: '10'
   ```

3. **Centralized logging**
   - Forward logs to ELK Stack, Datadog, or similar
   ```bash
   docker-compose logs -f | gzip > logs_$(date +%Y%m%d).log.gz
   ```

### Backup and Disaster Recovery

1. **Regular backups**
   ```bash
   # Daily backup script
   #!/bin/bash
   BACKUP_DIR="./backups/$(date +%Y%m%d)"
   mkdir -p "$BACKUP_DIR"
   docker run --rm -v analytics-data:/app/data \
     -v "$BACKUP_DIR:/backup" \
     alpine tar czf /backup/analytics.tar.gz -C /app/data .
   ```

2. **Backup retention policy**
   - Keep 7 daily, 4 weekly, 12 monthly backups
   - Store offsite for disaster recovery

3. **Recovery testing**
   - Test backup restoration regularly
   - Document recovery procedures

### Monitoring and Alerting

1. **Health checks**
   - Implemented in docker-compose.yml
   - Monitor health status
   ```bash
   watch 'docker-compose ps | grep komplexaci'
   ```

2. **Metrics collection**
   - Use Prometheus or similar
   ```bash
   docker run -d -p 9090:9090 prom/prometheus
   ```

3. **Alert configuration**
   - Set up alerts for:
     - Container health failures
     - High memory usage
     - Frequent restarts

### CI/CD Integration

#### GitHub Actions Example

```yaml
name: Build and Push Image

on:
  push:
    branches: [master]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: docker/build-push-action@v4
        with:
          context: ./docker
          push: true
          tags: komplexaci:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

## Reference Information

### Docker Commands Cheat Sheet

```bash
# Build
docker build -t komplexaci:latest docker/

# Run
docker run -p 3000:3000 komplexaci:latest

# Compose
docker-compose up -d
docker-compose down
docker-compose logs -f

# Container Management
docker-compose ps
docker-compose exec komplexaci-app sh
docker-compose restart komplexaci-app

# Volume Management
docker volume ls
docker volume inspect analytics-data
docker volume rm analytics-data

# Image Management
docker images
docker image rm komplexaci:latest
docker image prune
```

### File Structure

```
docker/
├── Dockerfile              # Multi-stage build configuration
├── docker-compose.yml      # Production orchestration
├── docker-compose.override.yml  # Development overrides (optional)
└── README.md              # This documentation
```

### Related Documentation

- [Next.js Docker Deployment](https://nextjs.org/docs/deployment/docker)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Node.js Best Practices](https://github.com/nodejs/docker-node/blob/master/docs/BestPractices.md)
- [Discord.js Documentation](https://discord.js.org/)
- [Alpine Linux Packages](https://pkgs.alpinelinux.org/)

### Support and Resources

- Docker Documentation: https://docs.docker.com/
- Stack Overflow: Tag questions with `docker` and `next.js`
- GitHub Issues: Report bugs in the Komplexaci repository
- Discord Support: Join the Komplexaci community server

---

**Last Updated**: 2025-11-30
**Documentation Version**: 1.0
**Next.js Version**: 15.3.3
**Node.js Version**: 24
**Docker Version**: 24+
