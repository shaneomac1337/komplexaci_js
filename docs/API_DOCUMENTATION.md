# Komplexaci API Documentation

Complete API documentation for the Komplexaci gaming community platform.

## Documentation Files

This documentation package contains three comprehensive guides:

### 1. **API.md** (Main Reference - 1,317 lines)
Comprehensive API reference with detailed endpoint documentation.

**Contents:**
- Complete endpoint specifications with all methods, parameters, and responses
- Request/response examples for all major endpoints
- Error handling and error codes
- Rate limiting and caching strategies
- Authentication requirements
- Organized by functional category

**When to use:** For detailed information about specific endpoints, request/response formats, and implementation examples.

**File size:** 27 KB

---

### 2. **API_ENDPOINTS_SUMMARY.txt** (Quick Reference - 140 lines)
Quick reference guide listing all 50+ endpoints organized by category.

**Contents:**
- List of all endpoints by category
- Brief description of each endpoint
- Authentication requirements overview
- Rate limiting summary
- Key features and caching strategy
- Error codes reference

**When to use:** For a quick overview of available endpoints or to find an endpoint by category.

**File size:** 5.5 KB

---

### 3. **ENDPOINTS.md** (Developer Guide - 249 lines)
Structured endpoint reference for developers.

**Contents:**
- Complete endpoint tree showing API hierarchy
- Response format conventions
- Common query parameters and URL parameters
- HTTP methods overview
- Request/response headers
- Caching headers by endpoint
- Authentication requirements matrix
- Rate limiting per service
- Error handling codes
- Special response fields
- Service-specific notes
- Development tips

**When to use:** As a quick reference while developing or integrating with the API.

**File size:** 7.2 KB

---

## Endpoint Categories

### Health & Status (5 endpoints)
- Basic connectivity testing
- System health monitoring
- URL probing service

**Key endpoints:**
- GET /api/health
- GET /api/probe
- GET /api/hello

---

### Discord Integration (3 endpoints)
- Real-time server statistics
- Member presence and activities
- Streaming detection

**Key endpoints:**
- GET /api/discord/server-stats
- GET /api/discord/streaming-status

---

### League of Legends (10 endpoints)
- Champion database
- Summoner lookup and profiles
- Live game information
- Match history
- Champion mastery

**Key endpoints:**
- GET /api/lol/summoner
- GET /api/lol/live-game
- GET /api/lol/champions
- GET /api/lol/mastery
- GET /api/lol/matches

---

### Counter-Strike 2 (3 endpoints)
- Game information
- Map database with filtering
- Weapon database by category

**Key endpoints:**
- GET /api/cs2/game-info
- GET /api/cs2/maps
- GET /api/cs2/weapons

---

### WWE Games (2 endpoints)
- Game collection (50+ games)
- Filtering by era and series

**Key endpoints:**
- GET /api/wwe/games
- GET /api/wwe/game-info

---

### Music Management (4 endpoints)
- Playlist retrieval
- Track management
- Audio file uploads

**Key endpoints:**
- GET /api/music/playlist
- POST /api/music/upload
- POST /api/music/playlist

---

### Analytics (18 endpoints)
- User activity tracking
- Gaming sessions
- Voice channel data
- Spotify integration
- Data management and cleanup

**Key endpoints:**
- GET /api/analytics/status
- GET /api/analytics/user/[userId]
- POST /api/analytics/export

---

### Daily Awards (2 endpoints)
- Daily leaderboards
- Category-specific standings

**Key endpoints:**
- GET /api/daily-awards
- GET /api/daily-awards/standings

---

### Debug Endpoints (3 endpoints)
- Member activities
- Voice channel monitoring
- System debugging

**Key endpoints:**
- GET /api/debug/activities
- GET /api/debug/voice

---

### Authentication (1 endpoint group)
- NextAuth with Discord OAuth
- Session management

**Key endpoints:**
- GET /api/auth/signin
- GET /api/auth/session
- GET /api/auth/signout

---

## Total Coverage

- **Total Endpoints:** 50+
- **Documentation Lines:** 1,706
- **Documentation Size:** 44.2 KB
- **Categories:** 10
- **Response Examples:** 100+
- **Parameter Tables:** 30+

---

## Quick Start

### 1. Finding an Endpoint

**Option A: Use ENDPOINTS.md**
- Visual endpoint tree
- Quick navigation
- Parameter reference

**Option B: Use API_ENDPOINTS_SUMMARY.txt**
- Category-based list
- Brief descriptions
- Feature overview

**Option C: Use API.md**
- Detailed specifications
- Full examples
- Error scenarios

### 2. Making a Request

1. Check **ENDPOINTS.md** for:
   - HTTP method
   - Required parameters
   - Response format

2. Check **API.md** for:
   - Complete request/response examples
   - Error handling
   - Authentication

3. Review **Headers section** in ENDPOINTS.md:
   - Cache-Control strategy
   - Rate limiting
   - Authentication headers

### 3. Handling Responses

All responses include:
- `success` field (boolean)
- `data` field (for successful responses)
- `error` and `message` fields (for errors)
- `timestamp` field (ISO-8601 format)

---

## Key Features

### Caching

| Endpoint Type | Cache Duration | Stale Duration |
|---|---|---|
| Champions | 1 hour | 24 hours |
| Regions | 24 hours | 48 hours |
| Summoner | 5 minutes | 10 minutes |
| Live Game | 30 seconds | 1 minute |
| PUUID | 24 hours | 48 hours |

### Authentication

- **Public endpoints:** No authentication required
- **Upload endpoints:** Discord OAuth (NextAuth)
- **Admin endpoints:** Admin role required
- **Session-based:** Cookies for web clients

### Rate Limiting

- **Riot API:** 20 requests/second (Riot's limits)
- **General:** 60 requests/minute per IP
- **Cached responses:** Don't count against limits

---

## Common Patterns

### Error Handling

```json
{
  "success": false,
  "error": "Error Type",
  "message": "Detailed description"
}
```

### List Responses

All list endpoints support:
- Pagination (where applicable)
- Filtering (via query parameters)
- Sorting (standard or custom)

### Time Ranges

Analytics endpoints support:
- `1d` - Last 24 hours
- `7d` - Last 7 days
- `30d` - Last 30 days
- `monthly` - Current month
- `90d` - Last 90 days
- `all` - All available data

---

## Region Codes (League of Legends)

| Code | Region | Cluster |
|------|--------|---------|
| euw1 | Europe West | Europe |
| eun1 | Europe Nordic & East | Europe |
| na1 | North America | Americas |
| kr | Korea | Asia |
| jp1 | Japan | Asia |
| br1 | Brazil | Americas |
| la1 | Latin America South | Americas |
| la2 | Latin America North | Americas |
| oc1 | Oceania | Oceania |
| tr1 | Turkey | Europe |
| ru | Russia | Europe |

---

## Development Tips

1. **Cache Responses:** Use Cache-Control headers for local caching
2. **Handle 503:** External services (Discord, Riot) may be unavailable
3. **Use PUUID:** Preferred over Summoner ID for LoL endpoints
4. **Backoff Strategy:** Implement exponential backoff for rate limits
5. **Check Success Field:** Always verify `success` before accessing `data`
6. **Monitor Headers:** Pay attention to `X-Cache` for cache hits

---

## Support & Maintenance

### File Usage Guidelines

**API.md:**
- Complete specification document
- Archive and version control
- Reference for frontend/SDK developers

**API_ENDPOINTS_SUMMARY.txt:**
- Print-friendly quick reference
- Team documentation
- Onboarding reference

**ENDPOINTS.md:**
- Live reference during development
- IDE documentation lookup
- Integration troubleshooting

---

## Document Versions

- **Version:** 1.0
- **Created:** 2025-11-30
- **Platform:** Next.js 15.3.3
- **API Version:** 1.0.0
- **Last Updated:** 2025-11-30

---

## Related Files in Project

- `src/app/api/` - API route implementations
- `.env.example` - Environment variable template
- `package.json` - Dependencies and scripts

---

For detailed documentation on specific endpoints, refer to **API.md**.
For quick endpoint lookup, use **ENDPOINTS.md** or **API_ENDPOINTS_SUMMARY.txt**.
