# Komplexaci API Routes Documentation

Reference documentation for API route handlers in the Komplexaci Next.js 15 gaming community website. This directory contains all backend HTTP endpoints following Next.js App Router conventions.

## Table of Contents

1. [Directory Structure](#directory-structure)
2. [Route Handler Conventions](#route-handler-conventions)
3. [Common Response Patterns](#common-response-patterns)
4. [Error Handling Standards](#error-handling-standards)
5. [Caching Strategies](#caching-strategies)
6. [Parameter Validation](#parameter-validation)
7. [Service Layer Integration](#service-layer-integration)
8. [Adding New Endpoints](#adding-new-endpoints)
9. [API Modules Reference](#api-modules-reference)

---

## Directory Structure

The API routes are organized by feature/domain in nested directories, following Next.js App Router file-based routing conventions.

```
src/app/api/
├── auth/                           # Authentication routes
│   └── [...nextauth]/route.ts     # NextAuth.js configuration
├── lol/                            # League of Legends API endpoints
│   ├── champions/route.ts          # Get champion data
│   ├── summoner/route.ts           # Get summoner profile
│   ├── live-game/route.ts          # Get current game info
│   ├── matches/route.ts            # Get match history
│   ├── mastery/route.ts            # Get champion mastery
│   ├── regions/route.ts            # Get available LoL regions
│   └── ...                         # Other LoL endpoints
├── discord/                        # Discord integration endpoints
│   ├── server-stats/route.ts       # Get Discord server statistics
│   └── streaming-status/route.ts   # Get streaming members
├── analytics/                      # User activity analytics
│   ├── user/[userId]/route.ts      # Get user stats
│   ├── status/route.ts             # Analytics health check
│   ├── export/route.ts             # Export analytics data
│   └── ...                         # Admin/debug endpoints
├── music/                          # Music playlist management
│   ├── playlist/route.ts           # Get/manage playlist
│   ├── track/route.ts              # Track operations
│   └── upload/route.ts             # Upload new tracks
├── cs2/                            # Counter-Strike 2 data
│   ├── game-info/route.ts          # Game information
│   ├── maps/route.ts               # Map data
│   └── weapons/route.ts            # Weapon information
├── daily-awards/                   # Daily achievement system
│   ├── route.ts                    # Get daily awards
│   └── standings/route.ts          # Get leaderboard
├── health/route.ts                 # Application health check
├── health-check/route.ts           # External service probe
├── hello/route.ts                  # Example/debug endpoint
├── probe/route.ts                  # Basic health probe
└── debug/                          # Debug utilities
    ├── activities/route.ts
    ├── voice/route.ts
    └── voice-states/route.ts
```

### File Naming Conventions

- **route.ts**: Main handler for a route (contains GET, POST, PUT, DELETE, PATCH exports)
- **[param]**: Dynamic segment matching a single route parameter
- **[...param]**: Catch-all segment matching multiple levels (e.g., NextAuth)
- **(group)**: Optional grouping folder that doesn't affect routing

### URL Mapping Examples

| File Path | URL |
|-----------|-----|
| `api/hello/route.ts` | `/api/hello` |
| `api/lol/summoner/route.ts` | `/api/lol/summoner` |
| `api/analytics/user/[userId]/route.ts` | `/api/analytics/user/USER_ID` |
| `api/music/track/[id]/route.ts` | `/api/music/track/TRACK_ID` |

---

## Route Handler Conventions

### Standard Handler Signature

All route handlers follow this pattern:

```typescript
import { NextRequest, NextResponse } from 'next/server';

// GET request handler
export async function GET(request: NextRequest) {
  try {
    // Extract parameters from query string or URL
    const { searchParams } = new URL(request.url);
    const param = searchParams.get('param');

    // Validate parameters
    if (!param) {
      return NextResponse.json(
        { error: 'param is required' },
        { status: 400 }
      );
    }

    // Process request
    const result = await someService.getData(param);

    // Return with cache headers
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    // Log and return error response
    console.error('Endpoint Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// POST request handler (for mutations)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate body
    if (!body.requiredField) {
      return NextResponse.json(
        { error: 'requiredField is required' },
        { status: 400 }
      );
    }

    // Process request
    const result = await someService.create(body);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    );
  }
}
```

### Handler Function Signatures

Each HTTP method has a specific signature:

```typescript
// GET - No body, searchParams from URL
export async function GET(request: NextRequest): Promise<NextResponse>

// POST - JSON body required
export async function POST(request: NextRequest): Promise<NextResponse>

// PUT - Full resource replacement
export async function PUT(request: NextRequest): Promise<NextResponse>

// DELETE - Resource deletion
export async function DELETE(request: NextRequest): Promise<NextResponse>

// PATCH - Partial resource update
export async function PATCH(request: NextRequest): Promise<NextResponse>

// HEAD - Same as GET but no body
export async function HEAD(request: NextRequest): Promise<NextResponse>
```

### Dynamic Route Parameters

Dynamic parameters are accessed through the `params` prop:

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params; // Must await params in Next.js 15
  // Use userId
}
```

Note: In Next.js 15+, `params` is a Promise and must be awaited.

---

## Common Response Patterns

### Success Response Format

Standard JSON response for successful requests:

```typescript
// Simple data return
return NextResponse.json({
  success: true,
  data: result
});

// With metadata
return NextResponse.json({
  success: true,
  data: result,
  timestamp: new Date().toISOString(),
  count: items.length
});

// Pagination pattern
return NextResponse.json({
  success: true,
  data: items,
  pagination: {
    page: currentPage,
    limit: pageSize,
    total: totalCount,
    pages: Math.ceil(totalCount / pageSize)
  }
});
```

### Status Code Conventions

| Code | Meaning | Use Case |
|------|---------|----------|
| 200 | OK | Successful GET/PUT/PATCH |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE (no response body) |
| 400 | Bad Request | Missing/invalid parameters |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |
| 503 | Service Unavailable | External service down |

### Example: League of Legends Summoner Endpoint

```typescript
// Request
GET /api/lol/summoner?riotId=PlayerName%23TAG&region=euw1

// Success Response (200)
{
  "id": "summoner-uuid",
  "gameName": "PlayerName",
  "tagLine": "TAG",
  "summonerLevel": 153,
  "profileIconId": 12345
}

// Not Found Response (404)
{
  "error": "Summoner not found"
}

// Rate Limited Response (429)
{
  "error": "Rate limit exceeded. Please try again later."
}
```

### Example: Analytics User Stats Endpoint

```typescript
// Request
GET /api/analytics/user/user123?timeRange=30d

// Success Response (200)
{
  "success": true,
  "userId": "user123",
  "timeRange": "30d",
  "dateRange": {
    "startDate": "2025-10-31",
    "endDate": "2025-11-30"
  },
  "data": {
    "gameSessions": [
      {
        "game_name": "League of Legends",
        "session_count": 15,
        "total_minutes": 450,
        "avg_minutes": 30
      }
    ],
    "voiceActivity": [...],
    "spotifyActivity": [...],
    "totals": {
      "totalOnlineTime": 720,
      "totalGameTime": 450,
      "totalVoiceTime": 180
    }
  }
}
```

---

## Error Handling Standards

### Try-Catch Block Pattern

All handlers wrap logic in try-catch blocks:

```typescript
export async function GET(request: NextRequest) {
  try {
    // Handler logic
  } catch (error) {
    console.error('Endpoint Name Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
```

### Error Type Detection

Handlers detect specific error types and respond accordingly:

```typescript
catch (error) {
  console.error('Operation Error:', error);

  if (error instanceof Error) {
    // Check for specific error messages (HTTP status codes embedded)
    if (error.message.includes('404')) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    if (error.message.includes('403')) {
      return NextResponse.json(
        { error: 'API key invalid or expired' },
        { status: 403 }
      );
    }

    if (error.message.includes('429')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    if (error.message.includes('500') ||
        error.message.includes('502') ||
        error.message.includes('503')) {
      return NextResponse.json(
        { error: 'Service unavailable. Please try again later.' },
        { status: 503 }
      );
    }
  }

  // Generic error response
  return NextResponse.json(
    { error: 'An unexpected error occurred' },
    { status: 500 }
  );
}
```

### Logging Standards

- **Console errors**: Use `console.error()` for exceptions
- **Console logs**: Use `console.log()` for important operations
- **Log context**: Include endpoint name and operation details
- **Sensitive data**: Never log API keys, tokens, or passwords

```typescript
console.error('Summoner API Error:', error);
console.log(`Fetched ${matches.length} matches for PUUID ${puuid}`);
console.warn(`Rate limit approaching for region: ${region}`);
```

### Common Error Scenarios

**Missing Required Parameter**
```typescript
if (!puuid) {
  return NextResponse.json(
    { error: 'puuid parameter is required' },
    { status: 400 }
  );
}
```

**Invalid Parameter Value**
```typescript
const count = parseInt(searchParams.get('count') || '10');
if (count < 1 || count > 100) {
  return NextResponse.json(
    { error: 'count must be between 1 and 100' },
    { status: 400 }
  );
}
```

**Invalid Region**
```typescript
const riotService = new RiotAPIService();
if (!riotService.isValidRegion(region)) {
  return NextResponse.json(
    { error: 'Invalid region. Valid regions: euw1, eun1, na1, kr, jp1, br1, la1, la2, oc1, tr1, ru' },
    { status: 400 }
  );
}
```

**Graceful Degradation**
```typescript
// Return empty result instead of error for invalid data
if (error.message.includes('decrypting')) {
  console.log('PUUID decryption failed - returning empty match history');
  return NextResponse.json(
    { matches: [] },
    { status: 200 }
  );
}
```

---

## Caching Strategies

Komplexaci uses HTTP `Cache-Control` headers to manage caching behavior for both browser and CDN.

### Cache-Control Header Values

| Strategy | Header | Use Case |
|----------|--------|----------|
| No Cache | `no-cache, no-store, must-revalidate` | Health checks, real-time data |
| Short Cache | `public, s-maxage=30, stale-while-revalidate=60` | Live game data (30s + 60s SWR) |
| Medium Cache | `public, s-maxage=300, stale-while-revalidate=600` | Summoner data (5m + 10m SWR) |
| Long Cache | `public, s-maxage=3600, stale-while-revalidate=86400` | Champion data (1h + 24h SWR) |
| Extended Cache | `public, s-maxage=86400, stale-while-revalidate=172800` | Region list (24h + 48h SWR) |

### Cache Parameters Explained

- **s-maxage**: CDN/shared cache duration in seconds (overrides max-age for shared caches)
- **stale-while-revalidate**: How long to serve stale data while refreshing in background
- **public**: Allow any cache (browser + CDN) to cache
- **no-cache**: Must revalidate before using cached version
- **no-store**: Don't cache at all

### Cache Implementation Examples

**Live Game Data (30 seconds)**
```typescript
return NextResponse.json(
  { inGame: true, gameInfo: currentGame },
  {
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
    }
  }
);
```

**Summoner Profile (5 minutes)**
```typescript
const cacheControl = refresh
  ? 'no-cache, no-store, must-revalidate'
  : 'public, s-maxage=300, stale-while-revalidate=600';

return NextResponse.json(profile, {
  headers: { 'Cache-Control': cacheControl }
});
```

**Champion Data (1 hour)**
```typescript
return NextResponse.json(champions, {
  headers: {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
  }
});
```

**Health Check (no cache)**
```typescript
return NextResponse.json(healthData, {
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
});
```

### Cache Busting

Query parameters can force cache refresh:

```typescript
// Client-side cache busting with _cb parameter
const cacheBuster = searchParams.get('_cb');
const cacheControl = cacheBuster
  ? 'no-cache, no-store, must-revalidate'
  : 'public, s-maxage=30, stale-while-revalidate=60';
```

### Fetch Cache Integration

Next.js provides built-in fetch caching for external API calls:

```typescript
// Cache for 1 hour (DataDragon API)
const response = await fetch(url, {
  next: { revalidate: 3600 }
});
```

---

## Parameter Validation

### Query String Parameters

Extract from `searchParams`:

```typescript
const { searchParams } = new URL(request.url);
const riotId = searchParams.get('riotId');
const region = searchParams.get('region') || 'euw1'; // Default value
const refresh = searchParams.get('refresh') === 'true'; // Boolean parsing
const count = parseInt(searchParams.get('count') || '10'); // Number parsing
```

### Request Body Validation

Parse and validate JSON bodies:

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.artist || !body.file) {
      return NextResponse.json(
        { error: 'Title, artist, and file are required' },
        { status: 400 }
      );
    }

    // Validate field types
    if (typeof body.title !== 'string') {
      return NextResponse.json(
        { error: 'title must be a string' },
        { status: 400 }
      );
    }

    // Validate field ranges
    if (body.duration && (body.duration < 1 || body.duration > 3600)) {
      return NextResponse.json(
        { error: 'duration must be between 1 and 3600 seconds' },
        { status: 400 }
      );
    }

    // Process validated body
    const track = await playlist.addTrack(body);
    return NextResponse.json(track, { status: 201 });
  } catch (error) {
    // Handle JSON parse errors
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    );
  }
}
```

### Dynamic Route Parameters

Validate parameter values:

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  // Validate format
  if (!userId || userId.trim() === '') {
    return NextResponse.json(
      { error: 'userId cannot be empty' },
      { status: 400 }
    );
  }

  // Use validated userId
  const stats = await getAnalyticsDatabase().getUserStats(userId);
  return NextResponse.json(stats);
}
```

### Validation Best Practices

1. **Validate early**: Check parameters before processing
2. **Provide clear messages**: Explain what's wrong and how to fix it
3. **Use type safety**: Parse and validate types (string to number, etc.)
4. **Set defaults**: Use sensible defaults for optional parameters
5. **Constrain ranges**: Enforce min/max for numeric values

---

## Service Layer Integration

Komplexaci separates API routes from business logic using service classes. Routes call services to perform operations.

### Service Location Pattern

```
src/
├── app/api/                    # Route handlers
│   ├── lol/
│   │   ├── summoner/route.ts   # Calls RiotAPIService
│   │   ├── matches/route.ts
│   │   └── champions/route.ts
│   └── discord/
│       └── server-stats/route.ts # Calls DiscordGatewayService
├── lib/
│   ├── services/
│   │   ├── RiotAPIService.ts   # Business logic for LoL API
│   │   ├── DiscordGatewayService.ts
│   │   └── AnalyticsService.ts
│   └── analytics/
│       └── database.ts         # Database access layer
```

### RiotAPIService Integration

**Service Usage**
```typescript
import { RiotAPIService } from '../services/RiotAPIService';

export async function GET(request: NextRequest) {
  const riotService = new RiotAPIService();

  // Validate region using service method
  if (!riotService.isValidRegion(region)) {
    return NextResponse.json(
      { error: 'Invalid region' },
      { status: 400 }
    );
  }

  // Fetch data using service
  const profile = await riotService.getSummonerProfile(
    gameName,
    tagLine,
    region
  );

  return NextResponse.json(profile);
}
```

**Available Methods**
- `parseRiotId(riotId: string)`: Parse "gameName#tagLine" format
- `isValidRegion(region: string)`: Validate region code
- `getSummonerProfile(gameName, tagLine, region)`: Get summoner info
- `getCurrentGame(puuid, region)`: Get active game
- `getMatchHistory(puuid, region, count)`: Get recent matches
- `getChampionMastery(puuid, region)`: Get champion mastery

### DiscordGatewayService Integration

**Service Usage**
```typescript
import { getDiscordGateway } from '@/lib/discord-gateway';
import { initializeDiscordGateway } from '@/lib/discord-startup';

export async function GET() {
  // Initialize if needed
  await initializeDiscordGateway();

  const gateway = getDiscordGateway();

  // Check readiness with timeout
  const maxWaitTime = 3000;
  const startTime = Date.now();
  while (!gateway.isReady() && (Date.now() - startTime) < maxWaitTime) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  if (gateway.isReady()) {
    const stats = gateway.getServerStats();
    const members = gateway.getAllMembers();
    return NextResponse.json({ stats, members });
  }

  // Fallback if not ready
  return NextResponse.json({ error: 'Gateway not ready' }, { status: 503 });
}
```

**Available Methods**
- `isReady()`: Check if gateway is connected
- `getServerStats()`: Get guild statistics
- `getAllMembers()`: Get all members
- `getMemberCount()`: Get member count
- `getVoiceStates()`: Get voice channel states

### AnalyticsDatabase Integration

**Service Usage**
```typescript
import { getAnalyticsDatabase } from '@/lib/analytics/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const db = getAnalyticsDatabase();

  // Raw queries
  const userStats = db.getDatabase().prepare(`
    SELECT * FROM user_stats WHERE user_id = ?
  `).get(userId);

  // Helper methods
  const gameSessions = db.getGameSessions(userId);
  const voiceActivity = db.getVoiceActivity(userId);
  const dailySnapshots = db.getDailySnapshots(userId, startDate, endDate);

  return NextResponse.json({
    userStats,
    gameSessions,
    voiceActivity,
    dailySnapshots
  });
}
```

**Available Methods**
- `getDatabase()`: Get SQLite database instance for raw queries
- `getUserStats(userId)`: Get user statistics
- `getGameSessions(userId)`: Get game activity
- `getVoiceActivity(userId)`: Get voice channel activity
- `getDailySnapshots(userId, start, end)`: Get daily stats
- `getActiveGameSessions()`: Get currently active games
- `getActiveVoiceSessions()`: Get currently active voice sessions
- `healthCheck()`: Get database health status

---

## Adding New Endpoints

Step-by-step guide to add a new API endpoint.

### 1. Create Directory Structure

Create directories following the domain structure:

```bash
# For /api/gaming/scores endpoint
mkdir -p src/app/api/gaming/scores
```

### 2. Create route.ts File

Create the route handler with proper typing and error handling:

```typescript
// src/app/api/gaming/scores/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const game = searchParams.get('game');

    // Validate parameters
    if (!game) {
      return NextResponse.json(
        { error: 'game parameter is required' },
        { status: 400 }
      );
    }

    // Fetch data (use services, not direct logic)
    const scores = await getGameScores(game);

    // Return with appropriate caching
    return NextResponse.json(scores, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    console.error('Gaming Scores API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game scores' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.game || !body.score) {
      return NextResponse.json(
        { error: 'game and score are required' },
        { status: 400 }
      );
    }

    const result = await saveGameScore(body.game, body.score);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST Gaming Scores Error:', error);
    return NextResponse.json(
      { error: 'Failed to save game score' },
      { status: 500 }
    );
  }
}
```

### 3. Extract to Service Layer (if logic is complex)

Create service files in `src/lib/services/`:

```typescript
// src/lib/services/GamingService.ts
export class GamingService {
  async getGameScores(game: string) {
    // Business logic here
  }

  async saveGameScore(game: string, score: number) {
    // Save logic here
  }
}
```

### 4. Import and Use Service

Update route.ts to use the service:

```typescript
import { GamingService } from '@/lib/services/GamingService';

const gamingService = new GamingService();

export async function GET(request: NextRequest) {
  // ... validation ...
  const scores = await gamingService.getGameScores(game);
  // ... return ...
}
```

### 5. Test the Endpoint

```bash
# GET request
curl "http://localhost:3000/api/gaming/scores?game=lol"

# POST request
curl -X POST "http://localhost:3000/api/gaming/scores" \
  -H "Content-Type: application/json" \
  -d '{"game":"lol","score":1250}'
```

### Endpoint Checklist

- [ ] Directory structure matches domain
- [ ] route.ts implements required HTTP methods
- [ ] Parameter validation included (required fields, types, ranges)
- [ ] Error handling with try-catch and specific error checks
- [ ] Cache headers appropriate for data type
- [ ] Console logging for debugging
- [ ] Service layer used for business logic
- [ ] No sensitive data in logs/responses
- [ ] Tested with curl/Postman
- [ ] Documentation added to README

---

## API Modules Reference

### Authentication (`/api/auth`)

**NextAuth.js Integration** (`/api/auth/[...nextauth]`)
- Handles authentication and authorization
- Routes all auth requests to NextAuth configuration
- Supports session management and credential verification

### League of Legends (`/api/lol`)

**Summoner Data** (`/api/lol/summoner`)
- **Method**: GET
- **Parameters**: `riotId` (required), `region` (optional, default: euw1), `refresh` (optional)
- **Response**: Summoner profile data
- **Cache**: 5m + 10m SWR
- **Error**: 400 (invalid params), 404 (not found), 429 (rate limit), 503 (service unavailable)

**Live Game** (`/api/lol/live-game`)
- **Method**: GET
- **Parameters**: `puuid` (required), `region` (optional)
- **Response**: Current game info or "not in game" message
- **Cache**: 30s + 60s SWR
- **Error**: 400, 429, 503

**Match History** (`/api/lol/matches`)
- **Method**: GET
- **Parameters**: `puuid` (required), `region`, `count` (1-100, default 10)
- **Response**: Array of match IDs
- **Cache**: 3m + 6m SWR
- **Error**: 400, 404, 429, 503

**Champions Data** (`/api/lol/champions`)
- **Method**: GET
- **Parameters**: `locale`, `version` (optional)
- **Response**: Full champion catalog with stats
- **Cache**: 1h + 24h SWR
- **Error**: 500

**Regions** (`/api/lol/regions`)
- **Method**: GET
- **Parameters**: None
- **Response**: Available LoL regions with metadata
- **Cache**: 24h + 48h SWR

**Champion Mastery** (`/api/lol/mastery`)
- **Method**: GET
- **Parameters**: `puuid` (required), `region`
- **Response**: Mastery data for champions

**Summoner by PUUID** (`/api/lol/summoner-by-puuid`)
- **Method**: GET
- **Parameters**: `puuid` (required), `region`
- **Response**: Summoner profile from PUUID

### Discord Integration (`/api/discord`)

**Server Statistics** (`/api/discord/server-stats`)
- **Method**: GET
- **Response**: Guild info, member list, streaming status
- **Cache**: No cache (real-time)
- **Primary Source**: Discord Gateway if ready, REST API fallback
- **Includes**: Online members, voice/streaming info, most active members

**Streaming Status** (`/api/discord/streaming-status`)
- **Method**: GET
- **Response**: Currently streaming members
- **Cache**: No cache
- **Source**: Discord Gateway real-time data

### Analytics (`/api/analytics`)

**User Statistics** (`/api/analytics/user/[userId]`)
- **Method**: GET
- **Parameters**: `timeRange` (1d, 7d, 30d, 90d, monthly, all)
- **Response**: Comprehensive activity data (games, voice, Spotify, etc.)
- **Cache**: No cache
- **Data Types**: Game sessions, voice activity, music plays, snapshots

**Status** (`/api/analytics/status`)
- **Method**: GET
- **Response**: Analytics database health

**Export** (`/api/analytics/export`)
- **Method**: GET
- **Response**: Full analytics dump in JSON/CSV

**Admin Endpoints** (debug/maintenance)
- `/api/analytics/reset`: Reset all analytics
- `/api/analytics/cleanup`: Clean stale sessions
- `/api/analytics/admin/reset-database`: Wipe entire database
- `/api/analytics/debug-user-stats/[userId]`: User stats debugging

### Music (`/api/music`)

**Playlist** (`/api/music/playlist`)
- **GET**: Fetch current playlist
- **POST**: Add track to playlist
- **Response**: Track list with metadata

**Track Management** (`/api/music/track/[id]`)
- **GET**: Get track details
- **DELETE**: Remove track
- **PATCH**: Update track metadata

**Upload** (`/api/music/upload`)
- **POST**: Upload new music file
- **Parameters**: File multipart form data

### CS2 Data (`/api/cs2`)

**Game Information** (`/api/cs2/game-info`)
- **Method**: GET
- **Response**: CS2 game metadata

**Maps** (`/api/cs2/maps`)
- **Method**: GET
- **Response**: Available CS2 maps with details

**Weapons** (`/api/cs2/weapons`)
- **Method**: GET
- **Response**: Weapon data and statistics

### Daily Awards (`/api/daily-awards`)

**Awards** (`/api/daily-awards`)
- **Method**: GET
- **Response**: Today's daily awards

**Standings** (`/api/daily-awards/standings`)
- **Method**: GET
- **Response**: Leaderboard for awards

### Health Checks

**Application Health** (`/api/health`)
- **Method**: GET, HEAD
- **Response**: Full system health (Discord, Analytics, Memory, etc.)
- **Cache**: No cache
- **Status Codes**: 200 (healthy), 503 (degraded)

**External Service Probe** (`/api/health-check`)
- **Method**: GET
- **Parameters**: `url` (required)
- **Response**: Service availability and response time
- **Timeout**: 10 seconds

**Basic Probe** (`/api/probe`)
- **Method**: GET, HEAD
- **Response**: Simple "ok" status
- **Cache**: No cache
- **Use**: Rapid availability checks

### Debug Utilities (`/api/debug`)

**Activities** (`/api/debug/activities`)
- **Method**: GET
- **Response**: Current Discord member activities

**Voice** (`/api/debug/voice`)
- **Method**: GET
- **Response**: Voice channel information

**Voice States** (`/api/debug/voice-states`)
- **Method**: GET
- **Response**: Member voice session details

### Example Endpoints

**Hello** (`/api/hello`)
- **Methods**: GET, POST
- **Use**: Getting started example
- **Response**: Simple greeting with timestamp

---

## Summary

This API module provides comprehensive documentation for:

1. **Organizing routes** by feature domain with clear hierarchy
2. **Implementing handlers** with standard signatures and error handling
3. **Formatting responses** consistently across all endpoints
4. **Caching data** appropriately using Cache-Control headers
5. **Validating inputs** before processing
6. **Integrating services** for clean separation of concerns
7. **Adding new endpoints** following established patterns

For questions about specific endpoints, refer to the implementation in their respective `route.ts` files.
