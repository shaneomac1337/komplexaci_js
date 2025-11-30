# System Architecture

Technical architecture documentation for the Komplexaci gaming clan website.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Application Architecture](#application-architecture)
- [Data Flow](#data-flow)
- [Database Schema](#database-schema)
- [External Integrations](#external-integrations)
- [Authentication](#authentication)
- [Performance Optimizations](#performance-optimizations)

---

## Overview

Komplexaci is a monolithic Next.js 15 application using the App Router architecture. The application serves as a gaming community hub with real-time Discord integration, League of Legends API integration, and comprehensive analytics tracking.

### Architecture Principles

- **Server-First Rendering**: React Server Components by default, client components only when necessary
- **Real-Time Data**: Discord Gateway WebSocket for instant presence updates
- **Local Analytics**: SQLite database for session tracking without external dependencies
- **API-Driven Content**: Dynamic content loading with appropriate caching strategies

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Framework** | Next.js | 15.3.3 | Full-stack React framework with App Router |
| **Runtime** | React | 19.0.0 | UI library with Server Components |
| **Language** | TypeScript | 5.x | Type safety with strict mode |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS framework |
| **Build** | Turbopack | - | Fast development builds |
| **Database** | SQLite (better-sqlite3) | 12.1.1 | Local analytics storage |
| **Discord** | discord.js | 14.20.0 | Discord Gateway integration |
| **Auth** | NextAuth.js | 4.24.11 | Discord OAuth authentication |
| **External DB** | Supabase | 2.50.0 | Optional PostgreSQL backend |

---

## Application Architecture

### Directory Structure

```
komplexaci_js/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Homepage
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Global styles
│   │   │
│   │   ├── api/               # API Route Handlers
│   │   │   ├── discord/       # Discord integration
│   │   │   ├── lol/           # League of Legends API
│   │   │   ├── cs2/           # Counter-Strike 2 data
│   │   │   ├── wwe/           # WWE games data
│   │   │   ├── analytics/     # Analytics endpoints
│   │   │   ├── music/         # Audio management
│   │   │   ├── auth/          # NextAuth handlers
│   │   │   └── debug/         # Debug endpoints
│   │   │
│   │   ├── league-of-legends/ # LoL feature pages
│   │   ├── cs2/               # CS2 feature pages
│   │   ├── wwe-games/         # WWE feature pages
│   │   ├── videotvorba/       # YouTube content
│   │   ├── admin/             # Admin dashboard
│   │   ├── auth/              # Auth pages
│   │   │
│   │   ├── components/        # Shared React components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── types/             # TypeScript definitions
│   │   ├── utils/             # Utility functions
│   │   └── contexts/          # React Context providers
│   │
│   ├── lib/                   # Server-side libraries
│   │   ├── discord-gateway.ts # Discord WebSocket service
│   │   ├── discord-startup.ts # Gateway initialization
│   │   ├── discord-avatar-utils.ts
│   │   ├── supabase.ts        # Supabase client
│   │   └── analytics/         # Analytics system
│   │       ├── database.ts    # SQLite operations
│   │       ├── service.ts     # Business logic
│   │       └── index.ts       # Module exports
│   │
│   ├── hooks/                 # Shared hooks
│   └── data/                  # Static data (playlist.json)
│
├── public/                    # Static assets
│   ├── komplexaci/           # Clan assets (audio, images)
│   ├── cs2/                  # CS2 weapon images
│   └── league-of-legends/    # LoL assets
│
├── data/                      # Runtime data
│   └── analytics.db          # SQLite database
│
└── docker/                    # Docker configuration
```

### Component Hierarchy

```
RootLayout (Server Component)
├── SessionProvider (Client)
│   └── PerformanceProvider (Client)
│       ├── Header (Client - navigation)
│       └── Page Content
│           ├── Homepage
│           │   ├── MemberCards
│           │   ├── AudioPlayer
│           │   ├── DiscordServerStats
│           │   ├── MostActiveMembers
│           │   └── DailyAwards
│           │
│           ├── League of Legends
│           │   ├── SummonerSearch
│           │   ├── KomplexaciStatus
│           │   ├── ChampionGrid
│           │   └── ChampionModal
│           │
│           ├── CS2
│           │   ├── WeaponCards
│           │   └── MapGallery
│           │
│           └── WWE Games
│               ├── GameCards
│               └── WWEMusicPlayer
```

---

## Data Flow

### Discord Real-Time Integration

```
Discord Gateway (WebSocket)
         │
         ▼
┌─────────────────────────────────────────┐
│     DiscordGatewayService (Singleton)    │
│  - Maintains WebSocket connection        │
│  - Caches member presence data           │
│  - Tracks voice states                   │
└─────────────────────────────────────────┘
         │
         │ Events: presenceUpdate, voiceStateUpdate
         ▼
┌─────────────────────────────────────────┐
│         AnalyticsService                 │
│  - Tracks game sessions                  │
│  - Tracks voice sessions                 │
│  - Tracks Spotify listening              │
│  - Manages daily/monthly stats           │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│     AnalyticsDatabase (SQLite)           │
│  - Persists session data                 │
│  - Stores user statistics                │
│  - Maintains daily snapshots             │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│          API Routes                      │
│  GET /api/discord/server-stats          │
│  GET /api/analytics/user/[userId]       │
│  GET /api/analytics/status              │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│        React Components                  │
│  - DiscordServerStats                   │
│  - MostActiveMembers                    │
│  - UserAnalyticsModal                   │
└─────────────────────────────────────────┘
```

### League of Legends API Flow

```
User Search Input
         │
         ▼
┌─────────────────────────────────────────┐
│      SummonerSearch Component            │
│  - Validates input (gameName#tagLine)   │
│  - Manages search state                  │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│     GET /api/lol/summoner               │
│  - Parses Riot ID                       │
│  - Calls RiotAPIService                 │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         RiotAPIService                   │
│                                          │
│  1. getAccountByRiotId()                │
│     └─► americas/europe/asia API        │
│         (riot/account/v1)               │
│                                          │
│  2. getSummonerByPuuid()                │
│     └─► Platform API (euw1, na1, etc)   │
│         (lol/summoner/v4)               │
│                                          │
│  3. getRankedStats()                    │
│     └─► lol/league/v4/entries/by-puuid  │
│                                          │
│  4. getChampionMastery()                │
│     └─► lol/champion-mastery/v4         │
│                                          │
│  5. getCurrentGame()                    │
│     └─► lol/spectator/v5                │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│        Response to Client                │
│  - SummonerProfile object               │
│  - Cached for 5 minutes                 │
└─────────────────────────────────────────┘
```

### Region Routing (Riot API)

```
Platform Regions          Regional Clusters
─────────────────         ─────────────────
euw1, eun1, tr1, ru   →   europe
na1, br1, la1, la2    →   americas
kr, jp1               →   asia
oc1                   →   sea

Usage:
- account-v1, match-v5  →  Regional cluster URL
- summoner-v4, league-v4, spectator-v5  →  Platform URL
```

---

## Database Schema

### SQLite Analytics Database

Located at `data/analytics.db`, uses WAL mode for concurrent access.

#### Tables

**user_stats** - Cumulative user statistics
```sql
CREATE TABLE user_stats (
  user_id TEXT PRIMARY KEY,

  -- Daily counters (reset at midnight CET)
  daily_online_minutes INTEGER DEFAULT 0,
  daily_voice_minutes INTEGER DEFAULT 0,
  daily_games_played INTEGER DEFAULT 0,
  daily_games_minutes INTEGER DEFAULT 0,
  daily_spotify_minutes INTEGER DEFAULT 0,
  daily_spotify_songs INTEGER DEFAULT 0,
  daily_streaming_minutes INTEGER DEFAULT 0,

  -- Monthly counters (30-day rolling window)
  monthly_online_minutes INTEGER DEFAULT 0,
  monthly_voice_minutes INTEGER DEFAULT 0,
  monthly_games_played INTEGER DEFAULT 0,
  monthly_games_minutes INTEGER DEFAULT 0,
  monthly_spotify_minutes INTEGER DEFAULT 0,
  monthly_spotify_songs INTEGER DEFAULT 0,
  monthly_streaming_minutes INTEGER DEFAULT 0,

  -- Reset tracking
  last_daily_reset TEXT,
  last_monthly_reset TEXT,
  created_at TEXT,
  updated_at TEXT
);
```

**game_sessions** - Individual game play sessions
```sql
CREATE TABLE game_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  game_name TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  duration_minutes INTEGER DEFAULT 0,
  last_updated TEXT,
  status TEXT DEFAULT 'active',  -- 'active', 'ended', 'stale'
  created_at TEXT
);
```

**voice_sessions** - Voice channel participation
```sql
CREATE TABLE voice_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  duration_minutes INTEGER DEFAULT 0,
  screen_share_minutes INTEGER DEFAULT 0,
  last_updated TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT
);
```

**spotify_sessions** - Spotify listening activity
```sql
CREATE TABLE spotify_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  track_name TEXT NOT NULL,
  artist TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  duration_minutes INTEGER DEFAULT 0,
  last_updated TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT
);
```

**daily_snapshots** - Historical daily aggregates
```sql
CREATE TABLE daily_snapshots (
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,  -- YYYY-MM-DD
  online_minutes INTEGER DEFAULT 0,
  voice_minutes INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  spotify_minutes INTEGER DEFAULT 0,
  created_at TEXT,
  PRIMARY KEY (user_id, date)
);
```

### Session Lifecycle

```
Session States:
┌─────────┐     ┌─────────┐     ┌─────────┐
│ active  │ ──► │  ended  │     │  stale  │
└─────────┘     └─────────┘     └─────────┘
     │                               ▲
     │    (>5 min no update)         │
     └───────────────────────────────┘

Transitions:
- active → ended: Normal session completion (user stops activity)
- active → stale: Session inactive for >5 minutes (detected by cleanup)
```

---

## External Integrations

### Discord.js Gateway

**Configuration** (`src/lib/discord-gateway.ts`)
```typescript
// Required Gateway Intents
const intents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildPresences,
  GatewayIntentBits.GuildVoiceStates
];
```

**Events Handled:**
- `ready` - Initialize member cache, recover sessions
- `presenceUpdate` - Track game/Spotify activity
- `voiceStateUpdate` - Track voice channel participation
- `guildMemberAdd/Remove` - Update member cache

**Singleton Pattern:**
```typescript
let discordGateway: DiscordGatewayService | null = null;

export function getDiscordGateway(): DiscordGatewayService {
  if (!discordGateway) {
    discordGateway = new DiscordGatewayService();
  }
  return discordGateway;
}
```

### Riot Games API

**Service Location:** `src/app/api/lol/services/RiotAPIService.ts`

**API Endpoints Used:**
| Endpoint | Purpose |
|----------|---------|
| `riot/account/v1/accounts/by-riot-id` | Lookup account by gameName#tagLine |
| `lol/summoner/v4/summoners/by-puuid` | Get summoner profile |
| `lol/league/v4/entries/by-puuid` | Get ranked statistics |
| `lol/champion-mastery/v4/champion-masteries/by-puuid` | Get mastery data |
| `lol/spectator/v5/active-games/by-summoner` | Check live game |
| `lol/match/v5/matches/by-puuid` | Get match history |

**Rate Limiting:**
- Development keys: 20 requests/second
- Production keys: Higher limits (requires approval)
- Service includes automatic retry logic for 429 responses

### Supabase

**Configuration:** `src/lib/supabase.ts`

Used for:
- Optional user data persistence
- Track/music metadata storage
- Potential future PostgreSQL migration

---

## Authentication

### NextAuth.js Configuration

**Provider:** Discord OAuth2

**Flow:**
```
User clicks "Sign In"
         │
         ▼
┌─────────────────────────────────────────┐
│     /api/auth/signin                     │
│  - Redirects to Discord OAuth           │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│     Discord Authorization               │
│  - User grants permissions              │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│     /api/auth/callback/discord          │
│  - Exchanges code for token             │
│  - Creates session                      │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│     SessionProvider                      │
│  - Provides session context             │
│  - Used by protected routes             │
└─────────────────────────────────────────┘
```

**Protected Routes:**
- `/admin` - Requires authentication

---

## Performance Optimizations

### Build Configuration

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  // Server-only packages (not bundled for client)
  serverExternalPackages: [
    'discord.js',
    'better-sqlite3',
    'zlib-sync',
    'bufferutil',
    'utf-8-validate',
    // ... other native modules
  ],
};
```

### Database Optimizations

```typescript
// WAL mode for concurrent reads
this.db.pragma('journal_mode = WAL');

// Memory optimizations
this.db.pragma('synchronous = NORMAL');
this.db.pragma('cache_size = 10000');
this.db.pragma('temp_store = MEMORY');
```

### Caching Strategy

| Data Type | Cache Duration | Method |
|-----------|---------------|--------|
| Champion data | 5 minutes | Next.js fetch cache |
| Summoner profiles | 5 minutes | Next.js fetch cache |
| Discord stats | Real-time | In-memory cache |
| Static assets | Long-term | Public folder |

### Image Optimization

Configured remote patterns for external images:
- `ddragon.leagueoflegends.com` - LoL assets
- `cdn.discordapp.com` - Discord avatars
- `steamcdn-a.akamaihd.net` - Steam assets
- `community.cloudflare.steamstatic.com` - Steam community

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RIOT_API_KEY` | Yes | Riot Games API key |
| `DISCORD_BOT_TOKEN` | Yes | Discord bot token |
| `DISCORD_SERVER_ID` | Yes | Target Discord server ID |
| `NEXTAUTH_SECRET` | Yes | NextAuth encryption secret |
| `NEXTAUTH_URL` | Yes | Application URL |
| `SUPABASE_URL` | No | Supabase project URL |
| `SUPABASE_ANON_KEY` | No | Supabase anonymous key |
| `ANALYTICS_DATA_DIR` | No | Custom analytics DB path |
| `RIOT_API_DEBUG` | No | Enable Riot API debug logs |
| `ENABLE_DISCORD_GATEWAY` | No | Force enable Discord Gateway |

---

## Related Documentation

**[View Full Documentation Index](./DOCS.md)**

| Document | Description |
|----------|-------------|
| [README.md](./README.md) | Project overview and quick start |
| [API.md](./API.md) | Complete API endpoint reference |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Deployment instructions |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Development workflow |
| [src/lib/analytics/README.md](./src/lib/analytics/README.md) | Analytics system details |
| [src/lib/README.md](./src/lib/README.md) | Server-side library code |
