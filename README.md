# Komplexaci

Next.js 15 gaming community website with real-time Discord integration, Riot Games API, and analytics tracking.

**Live:** [komplexaci.cz](https://komplexaci.cz)

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Next.js (App Router) | 15.3.3 |
| Runtime | React | 19.0.0 |
| Language | TypeScript (strict) | 5.x |
| Styling | Tailwind CSS | 4.x |
| Database | SQLite (better-sqlite3) | 12.1.1 |
| Discord | discord.js | 14.20.0 |
| Auth | NextAuth.js | 4.24.11 |

## Quick Start

### Prerequisites

- Node.js 18+
- Discord Bot Token (with Gateway Intents: Guilds, Members, Presence, Voice)
- Riot Games API Key

### Installation

```bash
git clone https://github.com/shaneomac1337/komplexaci_js.git
cd komplexaci_js
npm install
cp .env.example .env.local
```

### Environment Configuration

```bash
# Required - Riot Games API
RIOT_API_KEY=RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Required - Discord Bot
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_SERVER_ID=your_server_id

# Required - NextAuth
NEXTAUTH_SECRET=random_32_char_string
NEXTAUTH_URL=http://localhost:3000

# Optional - Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key

# Optional - Debug
RIOT_API_DEBUG=true
ENABLE_DISCORD_GATEWAY=true
```

### Development

```bash
npm run dev      # Start with Turbopack (port 3000)
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint check
```

## Project Structure

```
komplexaci_js/
├── src/                     # Application source code
│   ├── app/                 # Next.js App Router (pages, API, components)
│   └── lib/                 # Server-side libraries
│
├── docs/                    # Documentation
│   ├── DOCS.md             # Documentation index
│   ├── ARCHITECTURE.md     # System architecture
│   ├── API.md              # API reference
│   ├── DEPLOYMENT.md       # Deployment guide
│   └── CONTRIBUTING.md     # Contribution guidelines
│
├── scripts/                 # Utility scripts
│   ├── setup-dev.js        # Development setup
│   └── maintenance.sh      # Server maintenance
│
├── config/                  # Configuration files
│   ├── nginx/              # Nginx server config
│   └── maintenance.html    # Maintenance page
│
├── data/                    # Runtime data (SQLite database)
├── docker/                  # Docker configuration
├── tests/                   # Test scripts
├── public/                  # Static assets
└── .assets/                 # Reference images
```

See [src/README.md](./src/README.md) for detailed source code organization.

## Core Systems

### Discord Gateway

Real-time WebSocket connection tracking member presence, voice states, and activities.

```typescript
// Singleton access
import { getDiscordGateway } from '@/lib/discord-gateway';

const gateway = getDiscordGateway();
const stats = gateway.getServerStats();
const online = gateway.getOnlineMembers();
```

**Events tracked:**
- Presence updates (online/idle/dnd/offline)
- Voice channel joins/leaves
- Screen sharing/streaming
- Game activity
- Spotify listening

### Analytics System

SQLite-based tracking with daily/monthly aggregation.

**Tables:**
- `user_stats` - Cumulative statistics per user
- `game_sessions` - Individual game sessions
- `voice_sessions` - Voice channel sessions
- `spotify_sessions` - Spotify listening sessions
- `daily_snapshots` - Historical daily data

**Session states:** `active` | `ended` | `stale`

Sessions inactive >5 minutes are marked as `stale`.

### Riot Games API

PUUID-based API integration for League of Legends data.

```typescript
import { RiotAPIService } from '@/app/api/lol/services/RiotAPIService';

const api = new RiotAPIService();
const profile = await api.getSummonerProfile('GameName', 'TAG', 'euw1');
```

**Supported regions:** euw1, eun1, na1, kr, jp1, br1, la1, la2, oc1, tr1, ru

## API Endpoints

### Discord

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/discord/server-stats` | GET | Server statistics and online members |
| `/api/discord/streaming-status` | GET | Streaming member detection |

### League of Legends

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/lol/summoner` | GET | Summoner lookup by Riot ID |
| `/api/lol/champions` | GET | Champion database |
| `/api/lol/mastery` | GET | Champion mastery data |
| `/api/lol/matches` | GET | Match history |
| `/api/lol/live-game` | GET | Current game info |

### Analytics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/status` | GET | Analytics system status |
| `/api/analytics/user/[userId]` | GET | User statistics |
| `/api/analytics/reset-daily` | POST | Trigger daily reset |
| `/api/analytics/reset-monthly` | POST | Trigger monthly reset |

See [docs/API.md](./docs/API.md) for complete endpoint documentation.

## Database

Analytics data stored in `data/analytics.db` (SQLite with WAL mode).

```bash
# Database auto-initializes on first run
# Location can be customized with ANALYTICS_DATA_DIR env var
```

**Performance settings:**
- WAL journal mode
- Synchronous: NORMAL
- Cache size: 10000 pages
- Temp store: MEMORY

## Authentication

Discord OAuth via NextAuth.js.

**Protected routes:**
- `/admin` - Requires Discord authentication

## Build Configuration

```typescript
// next.config.ts
serverExternalPackages: [
  'discord.js',
  'better-sqlite3',
  'zlib-sync',
  // ... native modules excluded from client bundle
]
```

**Note:** ESLint and TypeScript errors are ignored during production builds (development convenience).

## Deployment

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for:
- Vercel deployment
- Manual server deployment
- Nginx configuration
- Maintenance mode setup

## Documentation

**[View Full Documentation Index](./docs/DOCS.md)** - Central hub for all 17 documentation files.

### Quick Links

| Category | Documents |
|----------|-----------|
| **Getting Started** | [ARCHITECTURE](./docs/ARCHITECTURE.md), [CONTRIBUTING](./docs/CONTRIBUTING.md) |
| **API Reference** | [API.md](./docs/API.md), [src/app/api/README](./src/app/api/README.md) |
| **Features** | [LoL](./src/app/league-of-legends/README.md), [CS2](./src/app/cs2/README.md), [WWE](./src/app/wwe-games/README.md), [Admin](./src/app/admin/README.md) |
| **Infrastructure** | [DEPLOYMENT](./docs/DEPLOYMENT.md), [data/README](./data/README.md), [docker/README](./docker/README.md) |
| **Source Code** | [src/README](./src/README.md), [src/lib/README](./src/lib/README.md), [Analytics](./src/lib/analytics/README.md) |

## Development Notes

### Client vs Server Components

Default to Server Components. Add `"use client"` only when needed for:
- React hooks (useState, useEffect, etc.)
- Browser APIs (window, document)
- Event handlers
- Client-side state

### Import Aliases

```typescript
import { Component } from '@/app/components/Component';
import { getAnalyticsDatabase } from '@/lib/analytics/database';
```

### Type Definitions

Located in `src/app/types/`:
- `cs2.ts` - CS2 weapon/map types
- `wwe.ts` - WWE game types

Located in `src/app/api/lol/types/`:
- `summoner.ts` - Riot API response types

Located in `src/app/league-of-legends/types/`:
- `lol.ts` - Champion types

## License

Private and proprietary to the Komplexaci gaming clan.

## Contact

- Website: [komplexaci.cz](https://komplexaci.cz)
- GitHub: [@shaneomac1337](https://github.com/shaneomac1337)
