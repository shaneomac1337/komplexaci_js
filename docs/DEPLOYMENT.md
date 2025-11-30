# Komplexaci Deployment Reference

Comprehensive technical reference for deploying Komplexaci, a Next.js 15 gaming community website with Discord.js integration and SQLite analytics.

**Application Stack:**
- Next.js 15.3.3 with App Router
- Node.js 18.17+ (LTS recommended)
- SQLite 3 (analytics and data persistence)
- Discord.js 14.20.0 (gateway and REST integration)
- Supabase (authentication)

---

## Table of Contents

1. [Vercel Deployment](#vercel-deployment)
2. [Manual Server Deployment](#manual-server-deployment)
3. [Environment Variables](#environment-variables)
4. [Database Configuration](#database-configuration)
5. [Nginx Reverse Proxy](#nginx-reverse-proxy)
6. [Maintenance Mode](#maintenance-mode)
7. [Discord Gateway Configuration](#discord-gateway-configuration)
8. [Health Checks](#health-checks)
9. [Monitoring and Logging](#monitoring-and-logging)
10. [Rollback Procedures](#rollback-procedures)
11. [SSL/TLS Configuration](#ssltls-configuration)
12. [Troubleshooting](#troubleshooting)

---

## Vercel Deployment

### Overview

Vercel is the recommended deployment platform for Next.js applications, offering automatic optimizations, edge function support, and seamless CI/CD integration.

### Automatic Deployment (Recommended)

#### Prerequisites

- GitHub repository with Komplexaci code
- Vercel account (https://vercel.com)
- GitHub account with repository access

#### Setup Steps

1. **Connect Repository to Vercel**
   - Navigate to https://vercel.com/new
   - Select "Continue with GitHub"
   - Authorize Vercel to access your repositories
   - Select the `komplexaci_js` repository
   - Click "Import"

2. **Configure Environment Variables**

   In the Vercel dashboard under "Settings" > "Environment Variables", add:

   ```
   RIOT_API_KEY=RGAPI-xxxxxxxxxx
   DISCORD_BOT_TOKEN=NzM4MTI0NTY3NzM4MTI0NTY3Nw==
   DISCORD_SERVER_ID=738124567738124567
   ENABLE_DISCORD_GATEWAY=true
   NEXTAUTH_URL=https://komplexaci.cz
   NEXTAUTH_SECRET=your-256-bit-base64-encoded-secret
   DATABASE_PATH=/var/data/analytics.db
   NODE_ENV=production
   ```

3. **Deployment Behavior**

   - **Automatic**: Every push to `master` branch triggers deployment
   - **Preview Deployments**: Pull requests generate preview URLs
   - **Rollback**: Previous deployments accessible in Vercel dashboard

#### Build Configuration

**Build Command**
```bash
next build
```

**Output Directory**
```
.next
```

**Install Command**
```bash
npm ci
```

**Start Command** (automatic, do not modify)
```bash
next start
```

#### Vercel-Specific Settings

In `vercel.json` (if needed):

```json
{
  "buildCommand": "next build",
  "installCommand": "npm ci",
  "framework": "nextjs",
  "nodeVersion": "20.x",
  "env": {
    "NEXT_PUBLIC_ANALYTICS_ID": "@komplexaci/analytics"
  },
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 60,
      "memory": 1024
    }
  }
}
```

#### Known Vercel Limitations

- **Serverless Function Timeout**: 60 seconds (Pro plan allows 900 seconds)
- **File System**: Read-only except `/tmp` directory
- **Database**: SQLite on Vercel requires `/tmp` or external solution
- **Discord Gateway**: WebSocket connections limited to serverless duration

**SQLite on Vercel Recommendation**: Use external SQLite provider (e.g., Cloudflare D1) or self-hosted database.

---

## Manual Server Deployment

### Prerequisites

- Ubuntu 20.04 LTS or later (or equivalent Linux distribution)
- Node.js 18.17+ installed
- npm or yarn package manager
- 2GB+ RAM minimum, 4GB+ recommended
- Sufficient disk space for application and SQLite database

### Initial Setup

#### 1. Prepare Server Environment

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS (recommended)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # v20.x.x
npm --version   # 10.x.x

# Install additional dependencies
sudo apt install -y build-essential python3 git nginx
```

#### 2. Create Application User

```bash
# Create dedicated application user
sudo useradd -m -s /bin/bash komplexaci

# Create application directory
sudo mkdir -p /var/www/komplexaci
sudo chown komplexaci:komplexaci /var/www/komplexaci
sudo chmod 755 /var/www/komplexaci
```

#### 3. Clone Repository

```bash
# Switch to application user
sudo su - komplexaci

# Clone repository
git clone https://github.com/your-org/komplexaci_js.git /var/www/komplexaci
cd /var/www/komplexaci

# Create directories for runtime data
mkdir -p /var/www/komplexaci/data
mkdir -p /var/www/komplexaci/logs
```

### Build and Installation

#### 1. Install Dependencies

```bash
cd /var/www/komplexaci

# Install npm dependencies
npm ci --omit=dev

# Verify installation
npm list discord.js next
```

#### 2. Build Application

```bash
# Build Next.js application
npm run build

# Output should be in .next directory
ls -la .next/
```

#### 3. Configuration Files

Create `.env.production` in application root:

```bash
# Discord Integration
DISCORD_BOT_TOKEN=NzM4MTI0NTY3NzM4MTI0NTY3Nw==
DISCORD_SERVER_ID=738124567738124567
ENABLE_DISCORD_GATEWAY=true

# Riot Games API
RIOT_API_KEY=RGAPI-xxxxxxxxxx

# NextAuth
NEXTAUTH_URL=https://komplexaci.cz
NEXTAUTH_SECRET=your-256-bit-base64-encoded-secret

# Database
DATABASE_PATH=/var/www/komplexaci/data/analytics.db
DATABASE_BACKUP_PATH=/var/www/komplexaci/data/backups

# Application
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=2048

# Logging
LOG_LEVEL=info
LOG_DIR=/var/www/komplexaci/logs
```

**Important**: Never commit `.env.production` to version control.

### Process Management with PM2

#### 1. Install PM2

```bash
sudo npm install -g pm2

# Install PM2 log rotation
pm2 install pm2-logrotate
```

#### 2. Create PM2 Ecosystem Configuration

Create `ecosystem.config.js` in application root:

```javascript
module.exports = {
  apps: [
    {
      name: 'komplexaci',
      script: './node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/komplexaci',
      instances: 'max',
      exec_mode: 'cluster',
      error_file: '/var/www/komplexaci/logs/error.log',
      out_file: '/var/www/komplexaci/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      merge_logs: true,
      max_memory_restart: '500M',
      watch: false,
      ignore_watch: ['node_modules', '.next', 'data', 'logs'],
      max_restarts: 10,
      min_uptime: '30s',
      autorestart: true,
      shutdown_with_message: true
    }
  ],
  deploy: {
    production: {
      user: 'komplexaci',
      host: 'your-domain.com',
      ref: 'origin/master',
      repo: 'https://github.com/your-org/komplexaci_js.git',
      path: '/var/www/komplexaci',
      'post-deploy': 'npm ci && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
};
```

#### 3. Start Application

```bash
# Start application with PM2
pm2 start ecosystem.config.js --env production

# Verify process is running
pm2 status

# View logs
pm2 logs komplexaci

# Set PM2 to start on system boot
pm2 startup systemd -u komplexaci --hp /var/www/komplexaci
pm2 save
```

#### 4. PM2 Common Commands

```bash
# Monitor application
pm2 monit

# Restart application
pm2 restart komplexaci

# Stop application
pm2 stop komplexaci

# Delete from PM2
pm2 delete komplexaci

# View last 100 lines
pm2 logs komplexaci --lines 100

# Clear logs
pm2 flush

# View detailed info
pm2 info komplexaci

# Real-time CPU/Memory monitoring
pm2 web  # Access at http://localhost:9615
```

### Process Management with systemd

Alternative to PM2 using native systemd service.

#### 1. Create systemd Service File

Create `/etc/systemd/system/komplexaci.service`:

```ini
[Unit]
Description=Komplexaci Gaming Community Website
Documentation=https://github.com/your-org/komplexaci_js
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=komplexaci
WorkingDirectory=/var/www/komplexaci
EnvironmentFile=/var/www/komplexaci/.env.production

ExecStart=/usr/bin/node /var/www/komplexaci/node_modules/.bin/next start

Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=komplexaci

# Security
ProtectSystem=strict
ProtectHome=yes
NoNewPrivileges=true
PrivateTmp=true

# Resource limits
LimitNOFILE=65535
LimitNPROC=512

[Install]
WantedBy=multi-user.target
```

#### 2. Enable and Start Service

```bash
# Reload systemd daemon
sudo systemctl daemon-reload

# Enable service on boot
sudo systemctl enable komplexaci

# Start service
sudo systemctl start komplexaci

# Check status
sudo systemctl status komplexaci

# View logs
sudo journalctl -u komplexaci -f
```

#### 3. systemd Common Commands

```bash
# Start service
sudo systemctl start komplexaci

# Stop service
sudo systemctl stop komplexaci

# Restart service
sudo systemctl restart komplexaci

# Check status
sudo systemctl status komplexaci

# View last 50 lines of logs
sudo journalctl -u komplexaci -n 50

# Follow logs in real-time
sudo journalctl -u komplexaci -f

# View logs for specific time range
sudo journalctl -u komplexaci --since "2 hours ago"

# View verbose error information
sudo journalctl -u komplexaci -p err --no-pager
```

---

## Environment Variables

### Reference Table

| Variable | Type | Required | Default | Purpose |
|----------|------|----------|---------|---------|
| `RIOT_API_KEY` | String | Yes | N/A | Riot Games API authentication |
| `DISCORD_BOT_TOKEN` | String | Yes | N/A | Discord bot authentication token |
| `DISCORD_SERVER_ID` | String | Yes | N/A | Target Discord server ID |
| `ENABLE_DISCORD_GATEWAY` | Boolean | No | `false` | Enable real-time Discord WebSocket |
| `NEXTAUTH_URL` | URL | Yes | N/A | NextAuth callback URL |
| `NEXTAUTH_SECRET` | String | Yes | N/A | NextAuth encryption secret (minimum 32 characters) |
| `DATABASE_PATH` | String | No | `./data/analytics.db` | SQLite database file path |
| `DATABASE_BACKUP_PATH` | String | No | `./data/backups` | SQLite backup directory |
| `NODE_ENV` | String | No | `development` | Environment mode |
| `NODE_OPTIONS` | String | No | N/A | Node.js runtime options |
| `LOG_LEVEL` | String | No | `info` | Logging verbosity |
| `LOG_DIR` | String | No | `./logs` | Log file directory |
| `PORT` | Number | No | `3000` | Server port (ignored in production) |

### Environment-Specific Configurations

#### Development Environment

```bash
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
ENABLE_DISCORD_GATEWAY=false
LOG_LEVEL=debug
DATABASE_PATH=./data/analytics.db
```

#### Staging Environment

```bash
NODE_ENV=production
NEXTAUTH_URL=https://staging.komplexaci.cz
ENABLE_DISCORD_GATEWAY=true
LOG_LEVEL=info
DATABASE_PATH=/var/www/komplexaci/data/analytics.db
```

#### Production Environment

```bash
NODE_ENV=production
NEXTAUTH_URL=https://komplexaci.cz
ENABLE_DISCORD_GATEWAY=true
LOG_LEVEL=info
DATABASE_PATH=/var/www/komplexaci/data/analytics.db
```

### Secret Generation

#### Generate NEXTAUTH_SECRET

```bash
# Generate 32-byte base64 encoded secret
openssl rand -base64 32

# Example output
RmzEj4QpR8TwXjK9mL2vNpZvGh5sTt3uWx0yYpAqBrC=
```

#### Store Secrets Securely

```bash
# On Linux/macOS with restricted permissions
umask 0077
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> /var/www/komplexaci/.env.production

# Verify permissions
ls -la /var/www/komplexaci/.env.production
# Should show: -rw------- (600)
```

#### Vault Integration (Optional)

For production deployments, use environment secret management:

- **AWS Systems Manager Parameter Store**
- **HashiCorp Vault**
- **Azure Key Vault**
- **Vercel Environment Variables**

---

## Database Configuration

### SQLite Setup

SQLite serves as the primary data store for analytics and application state.

#### Directory Structure

```
/var/www/komplexaci/
├── data/
│   ├── analytics.db        # Main database file
│   └── backups/
│       ├── analytics-2024-01-15-120000.db
│       ├── analytics-2024-01-15-140000.db
│       └── ...
├── logs/
│   ├── out.log
│   ├── error.log
│   └── ...
└── .env.production
```

#### File Permissions

```bash
# Set proper permissions for database directory
sudo chown -R komplexaci:komplexaci /var/www/komplexaci/data
sudo chmod 755 /var/www/komplexaci/data
sudo chmod 644 /var/www/komplexaci/data/analytics.db

# Ensure logs are writable
sudo chmod 755 /var/www/komplexaci/logs
```

#### Database Initialization

```bash
# Connect to database
sqlite3 /var/www/komplexaci/data/analytics.db

# List tables
.tables

# Check database integrity
PRAGMA integrity_check;

# Exit
.quit
```

### Database Backup Strategy

#### Automated Backup with Cron

Create `/var/www/komplexaci/scripts/backup.sh`:

```bash
#!/bin/bash
set -e

DB_PATH="/var/www/komplexaci/data/analytics.db"
BACKUP_DIR="/var/www/komplexaci/data/backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y-%m-%d-%H%M%S)

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

# Create backup
sqlite3 "$DB_PATH" ".backup '$BACKUP_DIR/analytics-$TIMESTAMP.db'"

# Log backup operation
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup created: analytics-$TIMESTAMP.db" >> "$BACKUP_DIR/backup.log"

# Remove backups older than retention period
find "$BACKUP_DIR" -name "analytics-*.db" -mtime +$RETENTION_DAYS -delete

# Clean old log entries
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cleanup: Removed backups older than $RETENTION_DAYS days" >> "$BACKUP_DIR/backup.log"
```

Install cron job:

```bash
# Make script executable
sudo chmod +x /var/www/komplexaci/scripts/backup.sh

# Edit crontab for komplexaci user
sudo -u komplexaci crontab -e

# Add backup job (runs every 6 hours)
0 */6 * * * /var/www/komplexaci/scripts/backup.sh

# List cron jobs
crontab -l
```

#### Manual Backup

```bash
# Create manual backup
sqlite3 /var/www/komplexaci/data/analytics.db ".backup '/var/www/komplexaci/data/backups/analytics-manual-$(date +%Y%m%d-%H%M%S).db'"

# Verify backup
ls -lh /var/www/komplexaci/data/backups/
```

#### Restore from Backup

```bash
# Stop application
sudo systemctl stop komplexaci

# Restore from backup
sqlite3 /var/www/komplexaci/data/analytics.db ".restore '/var/www/komplexaci/data/backups/analytics-2024-01-15-120000.db'"

# Start application
sudo systemctl start komplexaci

# Verify restore
sudo systemctl status komplexaci
```

### Database Optimization

#### VACUUM Operation

```bash
# Optimize database file size
sqlite3 /var/www/komplexaci/data/analytics.db "VACUUM;"

# Check database size before and after
du -sh /var/www/komplexaci/data/analytics.db
```

#### Create Indexes

```bash
sqlite3 /var/www/komplexaci/data/analytics.db

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_user_id ON analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_timestamp ON analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_event_type ON analytics(event_type);

-- Verify indexes
.indices

-- Exit
.quit
```

---

## Nginx Reverse Proxy

### Overview

Nginx serves as reverse proxy, handling SSL termination, compression, and static file caching.

### Basic Configuration

Create `/etc/nginx/sites-available/komplexaci`:

```nginx
upstream komplexaci_backend {
    # Connect to Next.js application
    server localhost:3000;
    keepalive 32;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name komplexaci.cz www.komplexaci.cz;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name komplexaci.cz www.komplexaci.cz;

    # SSL certificate configuration (certbot)
    ssl_certificate /etc/letsencrypt/live/komplexaci.cz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/komplexaci.cz/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Logging
    access_log /var/log/nginx/komplexaci-access.log;
    error_log /var/log/nginx/komplexaci-error.log warn;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/javascript application/json;

    # Client size limit
    client_max_body_size 50M;

    # Timeout settings
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # Proxy configuration
    location / {
        proxy_pass http://komplexaci_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # WebSocket support
        proxy_buffering off;
    }

    # Maintenance mode
    set $maintenance_flag "/var/www/maintenance.flag";
    if (-f $maintenance_flag) {
        return 503;
    }

    error_page 503 /maintenance.html;
    location = /maintenance.html {
        root /var/www/html;
        internal;
    }
}
```

### Enable Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/komplexaci /etc/nginx/sites-enabled/komplexaci

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Nginx Common Commands

```bash
# Test configuration
sudo nginx -t

# Reload configuration without restarting
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/komplexaci-error.log

# View access logs
sudo tail -f /var/log/nginx/komplexaci-access.log

# Monitor in real-time
sudo tail -f /var/log/nginx/komplexaci-access.log | grep -v "^$"
```

---

## Maintenance Mode

### Overview

Maintenance mode displays a static page to visitors while allowing backend updates.

### Setup

#### 1. Create Maintenance HTML Page

Create `/var/www/html/maintenance.html`:

```html
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Údržba - Komplexaci</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #333;
        }

        .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            text-align: center;
        }

        h1 {
            font-size: 32px;
            margin-bottom: 20px;
            color: #667eea;
        }

        .message {
            font-size: 18px;
            color: #666;
            margin-bottom: 30px;
            line-height: 1.6;
        }

        .status {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 14px;
            margin-top: 20px;
        }

        .footer {
            margin-top: 30px;
            font-size: 14px;
            color: #999;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Stránky jsou v údržbě</h1>
        <div class="message">
            Momentálně provádíme údržbu našich serverů pro lepší herní zážitek. Stránky budou brzy opět dostupné!
        </div>
        <div class="status">Vylepšujeme systém</div>
        <div class="footer">
            Pokud máte otázky, kontaktujte nás na <a href="https://discord.gg/your-server">Discord</a>
        </div>
    </div>
</body>
</html>
```

#### 2. Set Permissions

```bash
sudo chown www-data:www-data /var/www/html/maintenance.html
sudo chmod 644 /var/www/html/maintenance.html
```

### Enabling Maintenance Mode

#### Flag-Based Activation

```bash
# Enable maintenance mode
sudo touch /var/www/maintenance.flag
sudo systemctl reload nginx

# Disable maintenance mode
sudo rm /var/www/maintenance.flag
sudo systemctl reload nginx
```

#### With Error Handling

```bash
# Check if application is responding
curl -f http://localhost:3000/api/health || {
    echo "Application not responding, activating maintenance mode"
    sudo touch /var/www/maintenance.flag
    sudo systemctl reload nginx
}
```

### Maintenance Mode Script

Create `/usr/local/bin/maintenance`:

```bash
#!/bin/bash

MAINTENANCE_FLAG="/var/www/maintenance.flag"

case "$1" in
    on)
        sudo touch "$MAINTENANCE_FLAG"
        sudo systemctl reload nginx
        echo "Maintenance mode ENABLED"
        ;;
    off)
        sudo rm -f "$MAINTENANCE_FLAG"
        sudo systemctl reload nginx
        echo "Maintenance mode DISABLED"
        ;;
    status)
        if [ -f "$MAINTENANCE_FLAG" ]; then
            echo "Maintenance mode: ENABLED"
        else
            echo "Maintenance mode: DISABLED"
        fi
        ;;
    *)
        echo "Usage: $0 {on|off|status}"
        exit 1
        ;;
esac
```

Enable script:

```bash
sudo chmod +x /usr/local/bin/maintenance

# Usage
maintenance on
maintenance off
maintenance status
```

---

## Discord Gateway Configuration

### Overview

Discord.js supports two modes: REST API polling (scalable) and Gateway WebSocket (real-time).

### REST API Mode (Recommended for Serverless)

Configuration:

```bash
# .env.production
ENABLE_DISCORD_GATEWAY=false
DISCORD_BOT_TOKEN=your_token
DISCORD_SERVER_ID=your_server_id
```

Implementation example:

```typescript
import { REST, Routes } from 'discord.js';

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

// Fetch guild data via REST API
const members = await rest.get(
  Routes.guildMembers(process.env.DISCORD_SERVER_ID)
);
```

### Gateway WebSocket Mode (Recommended for Dedicated Servers)

**Requirements:**
- Dedicated server (not serverless)
- Node.js process running 24/7
- Persistent memory for client state
- Gateway intents configured in Discord Developer Portal

Configuration:

```bash
# .env.production
ENABLE_DISCORD_GATEWAY=true
DISCORD_BOT_TOKEN=your_token
DISCORD_SERVER_ID=your_server_id
```

Implementation example:

```typescript
import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMembers,
  ],
});

client.on('ready', () => {
  console.log(`Bot logged in as ${client.user.tag}`);
});

// Connect to gateway
await client.login(process.env.DISCORD_BOT_TOKEN);
```

### Intents Configuration

Discord.js requires specific intents enabled in Discord Developer Portal:

1. Go to https://discord.com/developers/applications
2. Select your application
3. Go to "Bot" section
4. Enable these intents:
   - **Guilds** (basic guild information)
   - **Guild Members** (member list updates)
   - **Guild Presences** (online/offline status)

### Gateway Behavior in Production

**Connection Handling:**
- Client maintains persistent WebSocket connection
- Automatic reconnection with exponential backoff
- Heartbeat interval every 41.25 seconds
- Latency monitoring via ping/pong

**Memory Considerations:**
- Discord.js client caches guild/member data in memory
- Typical memory usage: 50-200MB for large guilds
- Set PM2 `max_memory_restart` to 500MB

**Troubleshooting Gateway Issues:**

```bash
# Check bot token validity
curl -H "Authorization: Bot YOUR_TOKEN" https://discord.com/api/v10/users/@me

# Monitor connection status
pm2 logs komplexaci | grep "discord\|gateway\|ready"

# Restart bot on token error
pm2 restart komplexaci
```

---

## Health Checks

### Application Health Check Endpoint

Implement in `app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    // Check database connectivity
    const dbPath = process.env.DATABASE_PATH || './data/analytics.db';
    const dbExists = await fs.stat(dbPath)
      .then(() => true)
      .catch(() => false);

    if (!dbExists) {
      return NextResponse.json(
        { status: 'error', message: 'Database not found' },
        { status: 503 }
      );
    }

    // Check Discord bot status
    const discordToken = process.env.DISCORD_BOT_TOKEN ? 'configured' : 'missing';

    // Check required environment variables
    const requiredEnv = [
      'DISCORD_BOT_TOKEN',
      'DISCORD_SERVER_ID',
      'NEXTAUTH_SECRET',
    ];

    const missingEnv = requiredEnv.filter(env => !process.env[env]);

    if (missingEnv.length > 0) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Missing environment variables',
          missing: missingEnv,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      discord: discordToken,
      database: dbExists,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
```

### Monitoring Health Endpoint

#### With Nginx

```bash
# Check application health
curl -f http://localhost:3000/api/health || echo "Health check failed"
```

#### With Systemd

Add to systemd service configuration:

```ini
[Service]
ExecHealthCheck=/bin/bash -c 'curl -f http://localhost:3000/api/health || exit 1'
HealthChecks=5
HealthStartupTime=30
HealthInterval=10
HealthOnFailure=restart
```

#### With PM2

```bash
# Monitor application with health checks
pm2 monitor komplexaci
pm2 logs komplexaci --err --lines 50
```

---

## Monitoring and Logging

### Application Logging

#### Structured Logging Setup

Create `lib/logger.ts`:

```typescript
import fs from 'fs';
import path from 'path';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: Record<string, any>;
}

class Logger {
  private logDir: string;

  constructor() {
    this.logDir = process.env.LOG_DIR || './logs';
    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private write(entry: LogEntry) {
    const logFile = path.join(
      this.logDir,
      `${entry.level}.log`
    );

    const logLine = JSON.stringify(entry) + '\n';
    fs.appendFileSync(logFile, logLine);

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${entry.level.toUpperCase()}] ${entry.message}`, entry.context || '');
    }
  }

  info(message: string, context?: Record<string, any>) {
    this.write({
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context,
    });
  }

  error(message: string, context?: Record<string, any>) {
    this.write({
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      context,
    });
  }

  warn(message: string, context?: Record<string, any>) {
    this.write({
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      context,
    });
  }

  debug(message: string, context?: Record<string, any>) {
    this.write({
      timestamp: new Date().toISOString(),
      level: 'debug',
      message,
      context,
    });
  }
}

export const logger = new Logger();
```

#### Log Rotation with Logrotate

Create `/etc/logrotate.d/komplexaci`:

```
/var/www/komplexaci/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 komplexaci komplexaci
    sharedscripts
    postrotate
        systemctl reload komplexaci > /dev/null 2>&1 || true
    endscript
}
```

### System Monitoring

#### CPU and Memory Monitoring

```bash
# Real-time monitoring
top -u komplexaci

# View process details
ps aux | grep "next start"

# Check memory usage
free -h

# Check disk usage
df -h /var/www/komplexaci
```

#### PM2 Web Dashboard

```bash
# Start web dashboard
pm2 web

# Access at http://localhost:9615
# Monitor CPU, memory, and request count
```

#### Monitoring with Grafana/Prometheus

Install Prometheus Node Exporter:

```bash
sudo apt install prometheus-node-exporter

# Check metrics
curl http://localhost:9100/metrics
```

### Database Monitoring

#### Monitor Database Size

```bash
# Check database file size
du -sh /var/www/komplexaci/data/analytics.db

# Set up size monitoring
du -sh /var/www/komplexaci/data/analytics.db | tee -a /var/www/komplexaci/logs/db_size.log
```

Add to crontab:

```bash
# Log database size hourly
0 * * * * du -sh /var/www/komplexaci/data/analytics.db >> /var/www/komplexaci/logs/db_size.log
```

#### Database Performance

```bash
# Check database statistics
sqlite3 /var/www/komplexaci/data/analytics.db "PRAGMA page_count; PRAGMA page_size;"

# Analyze query performance
sqlite3 /var/www/komplexaci/data/analytics.db ".eqp on"
sqlite3 /var/www/komplexaci/data/analytics.db "EXPLAIN QUERY PLAN SELECT * FROM analytics;"
```

---

## Rollback Procedures

### Deployment Rollback

#### Vercel Rollback

1. Go to Vercel dashboard
2. Select project "Komplexaci"
3. Navigate to "Deployments" tab
4. Find previous stable deployment
5. Click "Promote to Production"
6. Confirm rollback

#### Manual Server Rollback

```bash
# Check recent commits
git log --oneline -10

# Revert to previous commit
git revert HEAD

# Or reset to specific commit
git reset --hard abc123def

# Rebuild application
npm run build

# Restart service
sudo systemctl restart komplexaci

# Verify status
sudo systemctl status komplexaci
```

### Database Rollback

#### From Automated Backup

```bash
# List available backups
ls -lh /var/www/komplexaci/data/backups/

# Stop application
sudo systemctl stop komplexaci

# Restore from specific backup
sqlite3 /var/www/komplexaci/data/analytics.db ".restore '/var/www/komplexaci/data/backups/analytics-2024-01-15-120000.db'"

# Start application
sudo systemctl start komplexaci
```

### Service Rollback Script

Create `/var/www/komplexaci/scripts/rollback.sh`:

```bash
#!/bin/bash
set -e

VERSION=${1:-}

if [ -z "$VERSION" ]; then
    echo "Usage: rollback.sh <commit-hash>"
    echo ""
    echo "Recent commits:"
    git log --oneline -5
    exit 1
fi

echo "Rolling back to $VERSION..."

# Stop application
echo "Stopping application..."
sudo systemctl stop komplexaci

# Backup current database
echo "Backing up current database..."
cp /var/www/komplexaci/data/analytics.db \
   /var/www/komplexaci/data/backups/analytics-pre-rollback-$(date +%s).db

# Revert code
echo "Reverting code to $VERSION..."
cd /var/www/komplexaci
git checkout "$VERSION"

# Rebuild application
echo "Rebuilding application..."
npm run build

# Start application
echo "Starting application..."
sudo systemctl start komplexaci

# Verify
echo "Verifying deployment..."
sleep 5
curl -f http://localhost:3000/api/health || {
    echo "Health check failed, manual intervention required"
    exit 1
}

echo "Rollback complete!"
```

Enable script:

```bash
sudo chmod +x /var/www/komplexaci/scripts/rollback.sh

# Usage
/var/www/komplexaci/scripts/rollback.sh abc123def
```

---

## SSL/TLS Configuration

### Let's Encrypt Certificate Setup

#### Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx

# Verify installation
certbot --version
```

#### Obtain Certificate

```bash
# Obtain certificate for domain
sudo certbot certonly --nginx -d komplexaci.cz -d www.komplexaci.cz

# Interactive prompts will guide certificate generation
```

#### Automatic Certificate Renewal

```bash
# Enable automatic renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal process (dry-run)
sudo certbot renew --dry-run

# Check renewal status
sudo systemctl status certbot.timer
```

#### Certificate Configuration

Update Nginx configuration with certificate paths:

```nginx
ssl_certificate /etc/letsencrypt/live/komplexaci.cz/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/komplexaci.cz/privkey.pem;
ssl_trusted_certificate /etc/letsencrypt/live/komplexaci.cz/chain.pem;
```

### SSL Testing

```bash
# Test SSL configuration
openssl s_client -connect komplexaci.cz:443

# Check certificate expiration
openssl x509 -in /etc/letsencrypt/live/komplexaci.cz/fullchain.pem -text -noout | grep -A 2 "Validity"

# Test SSL rating (online)
# https://www.ssllabs.com/ssltest/analyze.html?d=komplexaci.cz
```

### HSTS Configuration

Add to Nginx configuration:

```nginx
# Strict Transport Security (1 year)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

Register domain for HSTS preload list:
https://hstspreload.org/

---

## Troubleshooting

### Common Issues and Solutions

#### Application Not Starting

**Symptom**: `systemctl status komplexaci` shows failed state

**Diagnosis**:
```bash
# Check logs
sudo journalctl -u komplexaci -n 50 --no-pager

# Check process
ps aux | grep "next start"

# Test build
cd /var/www/komplexaci && npm run build
```

**Solutions**:
```bash
# Clear build cache
rm -rf .next

# Reinstall dependencies
npm ci

# Rebuild
npm run build

# Restart service
sudo systemctl restart komplexaci
```

#### High Memory Usage

**Symptom**: Process uses >500MB RAM

**Diagnosis**:
```bash
# Check memory usage
ps aux | grep komplexaci

# Check Node.js heap
node --expose-gc -e "console.log(require('v8').getHeapStatistics())"
```

**Solutions**:
```bash
# Enable memory limits in PM2
pm2 start ecosystem.config.js --max-memory-restart 500M

# Check for memory leaks
pm2 logs komplexaci | grep "memory\|heap"

# Restart service
sudo systemctl restart komplexaci
```

#### Discord Bot Not Responding

**Symptom**: Bot offline or commands not working

**Diagnosis**:
```bash
# Check token validity
curl -H "Authorization: Bot YOUR_TOKEN" https://discord.com/api/v10/users/@me

# Check logs
sudo journalctl -u komplexaci -f | grep -i discord

# Verify gateway status
pm2 logs komplexaci | grep "gateway\|ready"
```

**Solutions**:
```bash
# Regenerate bot token in Discord Developer Portal
# Update DISCORD_BOT_TOKEN in .env.production

# Restart application
sudo systemctl restart komplexaci

# Verify connection
curl -f http://localhost:3000/api/health
```

#### Database Locked

**Symptom**: SQLite "database is locked" error

**Diagnosis**:
```bash
# Check for file locks
lsof /var/www/komplexaci/data/analytics.db

# Check database integrity
sqlite3 /var/www/komplexaci/data/analytics.db "PRAGMA integrity_check;"
```

**Solutions**:
```bash
# Stop application
sudo systemctl stop komplexaci

# Recover database
sqlite3 /var/www/komplexaci/data/analytics.db "PRAGMA recovery;"

# Restart application
sudo systemctl start komplexaci
```

#### Nginx 502 Bad Gateway

**Symptom**: Error 502 when accessing website

**Diagnosis**:
```bash
# Check Nginx logs
sudo tail -f /var/log/nginx/komplexaci-error.log

# Check if Next.js is running
curl -f http://localhost:3000/api/health

# Check Nginx configuration
sudo nginx -t
```

**Solutions**:
```bash
# Restart Next.js application
sudo systemctl restart komplexaci

# Reload Nginx
sudo systemctl reload nginx

# Check port binding
sudo netstat -tlnp | grep 3000
```

#### SSL Certificate Issues

**Symptom**: Mixed content or certificate errors

**Diagnosis**:
```bash
# Check certificate validity
openssl x509 -in /etc/letsencrypt/live/komplexaci.cz/fullchain.pem -text -noout

# Test SSL connection
openssl s_client -connect komplexaci.cz:443 -servername komplexaci.cz
```

**Solutions**:
```bash
# Renew certificate
sudo certbot renew --force-renewal

# Update Nginx configuration
sudo systemctl reload nginx

# Clear browser cache and test
```

### Useful Commands Reference

#### Service Management

```bash
# Systemd
sudo systemctl start komplexaci
sudo systemctl stop komplexaci
sudo systemctl restart komplexaci
sudo systemctl status komplexaci
sudo journalctl -u komplexaci -f

# PM2
pm2 start komplexaci
pm2 stop komplexaci
pm2 restart komplexaci
pm2 status
pm2 logs komplexaci
```

#### Log Inspection

```bash
# Application logs
sudo journalctl -u komplexaci -n 100
sudo journalctl -u komplexaci --since "1 hour ago"
sudo journalctl -u komplexaci -p err

# Nginx logs
sudo tail -f /var/log/nginx/komplexaci-error.log
sudo tail -f /var/log/nginx/komplexaci-access.log

# Database logs
ls -lh /var/www/komplexaci/logs/
```

#### Performance Analysis

```bash
# Resource usage
top -u komplexaci
ps aux | grep "next\|nodejs"
free -h
df -h

# Network connections
sudo netstat -tlnp | grep 3000
sudo ss -tulnp | grep 3000

# Disk I/O
iostat -x 1 5
vmstat 1 5
```

---

## Deployment Checklists

### Pre-Deployment Checklist

- [ ] Code reviewed and tested locally
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database backup created
- [ ] SSL certificate valid and renewed
- [ ] Nginx configuration tested with `nginx -t`
- [ ] Application health check endpoint responding
- [ ] Discord bot token valid
- [ ] Monitoring and logging configured
- [ ] Rollback procedure documented

### Post-Deployment Checklist

- [ ] Application started without errors
- [ ] Health check endpoint responding
- [ ] Website accessible over HTTPS
- [ ] Discord bot online and responsive
- [ ] Database queries working
- [ ] Static assets loading correctly
- [ ] Logs showing normal operation
- [ ] Performance metrics within acceptable ranges
- [ ] SSL certificate valid (check expiration)
- [ ] Monitoring alerts configured

### Maintenance Checklist

- [ ] Database backups running successfully
- [ ] Log rotation working
- [ ] Certificate renewal scheduled
- [ ] Security updates applied
- [ ] Performance metrics reviewed
- [ ] Disk space monitored
- [ ] Error logs reviewed weekly
- [ ] Dependencies updated periodically
- [ ] Disaster recovery procedure tested
- [ ] Documentation kept up to date

---

## References

- **Next.js Documentation**: https://nextjs.org/docs
- **Discord.js Documentation**: https://discord.js.org/docs
- **Vercel Deployment Docs**: https://vercel.com/docs
- **Nginx Documentation**: https://nginx.org/en/docs/
- **Let's Encrypt**: https://letsencrypt.org/docs/
- **SQLite Documentation**: https://www.sqlite.org/docs.html
- **PM2 Documentation**: https://pm2.keymetrics.io/docs
- **Systemd Manual**: https://www.freedesktop.org/software/systemd/man/

---

**Last Updated**: 2024-01-15
**Deployment Version**: 15.3.3
**Status**: Production Ready
