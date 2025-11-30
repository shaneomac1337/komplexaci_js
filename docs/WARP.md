# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Komplexáci Gaming Clan Website - A modern Next.js 15 application for a Czech gaming community featuring real-time Discord integration, League of Legends player tracking, CS2 databases, WWE games collection, and comprehensive analytics.

**Tech Stack**: Next.js 15.3.3 (App Router) | TypeScript 5 (Strict) | React 19 | Tailwind CSS 4 | Supabase | Discord.js | better-sqlite3

## Development Commands

### Core Commands
```bash
npm run dev          # Start development server with Turbopack on port 3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Testing
There is no automated test runner. Test scripts are located in `tests/` directory and are run manually with Node.js:
```bash
node tests/test-daily-reset.js
node tests/check-db-tables.js
```

## Environment Setup

### Required Environment Variables
```bash
# Discord Integration (Required for homepage and server stats)
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_SERVER_ID=your_server_id
ENABLE_DISCORD_GATEWAY=true  # For real-time presence updates

# League of Legends Features (Required for /league-of-legends)
RIOT_API_KEY=RGAPI-your-api-key  # Development keys expire every 24 hours

# Authentication (Required for admin panel)
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000  # Or production URL

# Database (Optional - for Supabase features)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Local Database
Analytics data is stored in SQLite at `data/analytics.db`. The database auto-initializes on first run with proper schema migrations. Can be customized via `ANALYTICS_DATA_DIR` environment variable.

## Architecture

### Next.js App Router Structure
- **Pages**: `src/app/` - Homepage, CS2, League of Legends, WWE Games, Admin
- **API Routes**: `src/app/api/` - Discord, LoL, CS2, Analytics endpoints
- **Components**: `src/app/components/` (page-specific), `src/components/` (global)
- **Types**: `src/app/types/` - TypeScript interfaces for CS2, WWE, etc.
- **Utils**: `src/app/utils/`, `src/lib/` - Helper functions and services

### Key Architectural Patterns

#### Discord Integration
- **Two Data Sources**: Real-time Gateway (WebSocket) via `discord-gateway.ts` OR REST API fallback
- **Gateway Lifecycle**: Initialized once at server startup via `discord-startup.ts`, maintains persistent connection
- **Presence Detection**: Real-time voice channel status, streaming detection, activity tracking
- **Analytics**: Tracks user online time, voice minutes, game sessions, Spotify listening
- **Endpoints**: `/api/discord/server-stats`, `/api/discord/streaming-status`

#### Analytics System (`src/lib/analytics/`)
- **Database**: better-sqlite3 with WAL mode for concurrent access
- **Session Tracking**: Game sessions, voice sessions, Spotify sessions with active/ended/stale states
- **Reset Logic**: Daily (24h) and Monthly (30d) statistics with automatic reset via background jobs
- **Stale Detection**: Sessions inactive for >5 minutes automatically marked as stale
- **Data Retention**: Configurable retention period (default 365 days)

#### League of Legends Integration
- **Service Layer**: `src/app/api/lol/services/RiotAPIService.ts` - Centralized Riot API client
- **Endpoints**: Summoner lookup, live game status, champion data
- **Rate Limiting**: Built-in rate limit handling for Riot API
- **Caching**: API responses cached with appropriate headers

#### Performance Optimization
- **Context**: `src/contexts/PerformanceContext.tsx` - Global performance mode toggle
- **GPU Acceleration**: Animations use `transform` and `will-change` for smooth rendering
- **Lazy Loading**: Images and components load on demand
- **Turbopack**: Development builds use Turbopack for faster HMR

### Server-Side Considerations

#### Discord.js Server-Only
Discord.js and its native dependencies (zlib-sync, bufferutil, utf-8-validate) are **server-only** packages. They are configured in `next.config.ts` under `serverExternalPackages` to prevent client-side bundling. Never import Discord.js in client components.

#### Image Configuration
Remote image patterns configured for:
- League of Legends CDN (`ddragon.leagueoflegends.com`)
- Discord CDN (`cdn.discordapp.com`)
- Steam CDN (`steamcdn-a.akamaihd.net`, `steamuserimages-a.akamaihd.net`)

### Database Schema

#### User Stats Table
Tracks daily and monthly metrics per user:
- Online minutes, voice minutes, game sessions, Spotify listening, streaming time
- Separate daily/monthly counters with automatic reset timestamps
- Indexed on user_id, reset dates for performance

#### Session Tables
Three session types (game_sessions, voice_sessions, spotify_sessions):
- Active sessions: Currently ongoing
- Ended sessions: Properly closed
- Stale sessions: Inactive >5 minutes, auto-recovered on daily reset

## Common Development Tasks

### Adding a New API Route
1. Create route handler in `src/app/api/[feature]/route.ts`
2. Use `NextResponse` for JSON responses
3. Add proper error handling with try/catch
4. Set cache headers if data is cacheable: `{ next: { revalidate: 3600 } }`
5. For Discord features, use `getDiscordGateway()` from `@/lib/discord-gateway`

### Modifying Analytics
1. Update TypeScript interfaces in `src/lib/analytics/database.ts`
2. Add migration in `runMigrations()` method to alter existing tables
3. Update corresponding service methods in `src/lib/analytics/service.ts`
4. Test with manual scripts in `tests/` directory

### Adding New Components
- **Global components**: Place in `src/components/` for use across the app
- **Page-specific components**: Place in `src/app/[page]/components/`
- Use TypeScript interfaces for props
- Wrap client-side interactivity with `"use client"` directive
- Consider performance mode from `PerformanceContext` for animations

### Working with Discord Data
- Always check if Gateway is ready: `gateway.isReady()`
- Use `getDiscordGateway()` singleton for consistent access
- Avatar URLs: Use `getBestDiscordAvatarUrl()` helper for proper Discord CDN URLs
- Streaming detection: Check `member.voice.streaming` property
- Handle both online and offline members in UI

## Build Configuration

### TypeScript
- **Strict Mode**: Enabled
- **Path Alias**: `@/*` maps to `./src/*`
- **Build Errors**: Intentionally ignored in production builds (see `next.config.ts`)

### ESLint
Uses Next.js recommended config (`next/core-web-vitals`, `next/typescript`). Errors are ignored during builds but should be fixed in development.

### CSS
- **Tailwind CSS 4**: Primary styling framework
- **CSS Modules**: Used for page-specific styles (e.g., `cs2.module.css`, `lol.module.css`)
- **Global Styles**: `src/app/globals.css` for base styles, `low-performance.css` for reduced animation mode

## Deployment

### Vercel (Recommended)
1. Connect GitHub repository
2. Set environment variables in Vercel dashboard
3. Automatic deployments on push to main

### Manual Server
```bash
npm run build
npm run start
# Or use PM2: pm2 start npm --name "komplexaci" -- start
```

### Maintenance Mode
Use `maintenance.sh` script for scheduled maintenance:
```bash
maintenance on   # Enable maintenance page
maintenance off  # Disable maintenance page
maintenance status  # Check status
```

See `DEPLOYMENT.md` for Nginx configuration and detailed setup.

## API Documentation

### Discord API
- **GET /api/discord/server-stats**: Complete server stats with member presence, streaming status, daily online times
- **GET /api/discord/streaming-status**: Dedicated streaming detection with voice channel details

### League of Legends API  
- **GET /api/lol/summoner/[name]**: Summoner profile lookup
- **GET /api/lol/live-game/[name]**: Current game status
- **GET /api/lol/champions**: Champion database

### CS2 API
- **GET /api/cs2/weapons**: Weapon statistics database
- **GET /api/cs2/maps**: Map information
- **GET /api/cs2/game-info**: General CS2 game data

### Analytics API
- **GET /api/analytics/admin/status**: Database health check
- **GET /api/analytics/admin/user/[userId]**: User statistics
- **POST /api/analytics/admin/reset-daily**: Trigger daily stats reset
- **POST /api/analytics/admin/cleanup**: Clean up stale sessions

See `API.md` for detailed endpoint documentation.

## Important Notes

### Data Sources
- **Discord Gateway** (real-time): Preferred when available, provides instant presence updates
- **REST API** (polling): Fallback when Gateway is not ready or unavailable
- **SQLite Analytics**: Local database for historical tracking and statistics

### Rate Limits
- **Riot API**: 20 requests per second (development key), handle 429 responses
- **Discord API**: 50 requests per second, automatic retries implemented
- **Gateway Events**: No rate limits, but requires proper intent configuration

### Path Aliases
Always use `@/` prefix for imports from `src/` directory:
```typescript
import { getAnalyticsDatabase } from '@/lib/analytics/database';
import Header from '@/app/components/Header';
```

### Client vs Server Components
- Default: Server Components (can use Discord.js, access env vars directly)
- Add `"use client"` only when using hooks, browser APIs, or event handlers
- Never import Discord.js in client components

## Troubleshooting

### Discord Gateway Not Connecting
1. Check `DISCORD_BOT_TOKEN` and `DISCORD_SERVER_ID` are set
2. Verify bot has proper intents enabled in Discord Developer Portal
3. Check server logs for connection errors
4. API will automatically fall back to REST API if Gateway unavailable

### Analytics Database Issues
1. Check `data/` directory exists and is writable
2. Database auto-creates on first run with migrations
3. Use `/api/analytics/admin/status` to check database health
4. Stale sessions can be cleaned with `/api/analytics/admin/cleanup`

### Build Errors
- TypeScript and ESLint errors are intentionally ignored during builds
- Fix errors in development, but builds will succeed even with type errors
- Check `next.config.ts` if build behavior needs to change

### Riot API Key Expired
Development keys expire every 24 hours. Get a new key from https://developer.riotgames.com/ and update `.env.local`. For production, apply for a personal or production API key.
