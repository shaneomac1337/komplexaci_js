# Complete Endpoint Reference

## Quick Navigation

- Health & Status: `/api/health`, `/api/probe`, `/api/health-check`, `/api/hello`
- Discord: `/api/discord/*`
- League of Legends: `/api/lol/*`
- Counter-Strike 2: `/api/cs2/*`
- WWE Games: `/api/wwe/*`
- Music: `/api/music/*`
- Analytics: `/api/analytics/*`
- Awards: `/api/daily-awards/*`
- Debug: `/api/debug/*`, `/api/debug-avatars`
- Auth: `/api/auth/*`

## Endpoint Tree

```
/api
├── health
├── health-check
├── hello
├── probe
├── debug-avatars
│
├── discord/
│   ├── server-stats
│   └── streaming-status
│
├── debug/
│   ├── activities
│   ├── voice
│   └── voice-states
│
├── lol/
│   ├── regions
│   ├── champions
│   ├── summoner
│   ├── puuid-only
│   ├── summoner-by-puuid
│   ├── live-game
│   ├── live-game-immediate
│   ├── live-game-optimized
│   ├── mastery
│   └── matches
│
├── cs2/
│   ├── game-info
│   ├── maps
│   └── weapons
│
├── wwe/
│   ├── game-info
│   └── games
│
├── music/
│   ├── playlist (GET/POST)
│   ├── upload
│   └── track/[id]
│
├── daily-awards/
│   ├── route (awards list)
│   └── standings
│
├── analytics/
│   ├── status
│   ├── user/[userId]
│   ├── data-info
│   ├── export
│   ├── populate-today
│   ├── cleanup
│   ├── cleanup-sessions
│   ├── debug
│   ├── debug-sessions
│   ├── debug-user-stats/[userId]
│   ├── fix-duplicates
│   ├── recover-sessions
│   ├── reset (deprecated)
│   ├── reset-daily
│   ├── reset-monthly
│   ├── session-health
│   ├── test-daily-reset
│   └── admin/
│       └── reset-database
│
└── auth/
    └── [...nextauth] (signin, callback, session, signout)
```

## Response Format Convention

All responses follow this general pattern:

### Success Response (200)
```json
{
  "success": true,
  "data": { /* endpoint-specific data */ },
  "timestamp": "ISO-8601 timestamp"
}
```

### Error Response (4xx/5xx)
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Common Query Parameters

| Param | Used By | Values | Default |
|-------|---------|--------|---------|
| region | LoL | euw1, eun1, na1, kr, etc | euw1 |
| timeRange | Analytics | 1d, 7d, 30d, monthly, 90d, all | 30d |
| category | Awards | gamer, nerd, listener | - |
| count | LoL | 1-100 | 10 |
| era | WWE | golden, attitude, ruthless, etc | all |
| series | WWE | n64, smackdown, svr, 2k, arcade | all |
| active | CS2 | true, false | - |
| type | CS2 | defusal, hostage, wingman | - |

## Common URL Parameters

| Pattern | Used By | Example |
|---------|---------|---------|
| [userId] | Analytics, Awards | /api/analytics/user/123456789 |
| [id] | Music | /api/music/track/track_1700000000000_abc123 |

## HTTP Methods by Endpoint

| Method | Common Uses | Examples |
|--------|------------|----------|
| GET | Fetch data | /api/lol/summoner, /api/analytics/status |
| POST | Create/Submit data | /api/music/upload, /api/analytics/export |
| HEAD | Health checks | /api/health, /api/probe |

## Request/Response Headers

### Standard Request Headers
```
Content-Type: application/json
Accept: application/json
Authorization: Bearer [token] (for protected endpoints)
```

### Standard Response Headers
```
Content-Type: application/json
Cache-Control: [strategy specific]
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

## Caching Headers by Endpoint

| Endpoint | Cache-Control | Purpose |
|----------|----------------|---------|
| /api/lol/champions | max-age=3600, s-maxage=86400 | Rarely changes |
| /api/lol/regions | max-age=86400 | Static data |
| /api/lol/summoner | max-age=300, s-maxage=600 | Profile info |
| /api/lol/live-game | max-age=30 | Real-time data |
| /api/lol/puuid-only | max-age=86400 | Persistent identifier |

## Authentication Requirements

| Endpoint | Auth Type | Required | Notes |
|----------|-----------|----------|-------|
| /api/music/upload | NextAuth (Discord) | Yes | Can upload files |
| /api/analytics/admin/* | NextAuth (Admin) | Yes | Admin operations |
| /api/auth/* | NextAuth (Discord) | For signin | OAuth flow |
| All read endpoints | None | No | Public access |

## Rate Limiting Info

### Per-Service Limits
- **Riot API endpoints**: Riot's limits (typically 20/sec)
- **General endpoints**: 60/min per IP
- **Discord endpoints**: Discord's limits
- **Internal endpoints**: No limit

### Cache-Aware Limiting
- Cached responses don't count against limits
- Cache hit: X-Cache: HIT header
- Cache miss: X-Cache: MISS header

## Error Handling Codes

### Client Errors (4xx)
- **400 Bad Request**: Missing required parameters or invalid format
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions for operation
- **404 Not Found**: Resource doesn't exist
- **429 Too Many Requests**: Rate limit exceeded

### Server Errors (5xx)
- **500 Internal Server Error**: Unexpected server error
- **503 Service Unavailable**: Service temporarily down (Discord, Riot API, etc)

## Special Response Fields

| Field | Purpose | Type | Example |
|-------|---------|------|---------|
| cached | Cache status (LoL) | boolean | true |
| dataSource | Data source indicator (Discord) | string | "GATEWAY" |
| lastUpdated | Last refresh time | ISO-8601 | "2025-11-30T10:30:45.123Z" |
| timestamp | Response time | ISO-8601 | "2025-11-30T10:30:45.123Z" |

## Analytics Endpoints Special Notes

- **Destructive operations**: /api/analytics/reset*, /api/analytics/cleanup*
- **Backup before operations**: All destructive ops create automatic backups
- **Daily reset**: Automatic at midnight Czech time (Europe/Prague)
- **Manual triggers**: /api/analytics/populate-today, /api/analytics/test-daily-reset

## League of Legends Endpoints Special Notes

- **PUUID vs Summoner ID**: PUUID is preferred (persistent across renames)
- **Region codes**: euw1 (EU West), eun1 (EU NE), na1 (NA), kr (Korea), etc
- **Cache strategy**: PUUID has longest cache (24h)
- **Rate limiting**: Implement backoff on 429 responses

## Music Upload Constraints

- **File types**: MP3, WAV, OGG only
- **Max file size**: Depends on server config
- **Location**: Files stored at /komplexaci/audio/
- **Authentication**: Requires valid Discord login

## Development Tips

1. Always check response `success` field before accessing `data`
2. Handle 503 errors gracefully (external service down)
3. Implement exponential backoff for rate-limited endpoints
4. Use PUUID instead of Summoner ID for LoL endpoints
5. Cache responses locally when possible (use Cache-Control headers)
6. Subscribe to analytics events rather than polling frequently
7. Use HEAD method for simple health checks

## Testing Endpoints

Minimal test endpoints for verifying API connectivity:
- `GET /api/hello` - Simplest test
- `GET /api/probe` - Minimal response
- `GET /api/health` - Full system status

For comprehensive documentation, see: **API.md**
