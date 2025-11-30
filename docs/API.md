# Komplexaci API Documentation

## Overview

Complete API reference for the Komplexaci gaming community platform. This Next.js 15 application exposes 50+ endpoints across multiple categories including Discord integration, League of Legends statistics, Counter-Strike 2 information, WWE games database, music management, analytics, and health monitoring.

**Base URL:** `http://localhost:3000` (development) or production domain

---

## Table of Contents

1. [Health & Status Endpoints](#health--status-endpoints)
2. [Discord Integration](#discord-integration)
3. [League of Legends API](#league-of-legends-api)
4. [Counter-Strike 2](#counter-strike-2)
5. [WWE Games](#wwe-games)
6. [Music Management](#music-management)
7. [Analytics](#analytics)
8. [Daily Awards](#daily-awards)
9. [Debug Endpoints](#debug-endpoints)
10. [Authentication](#authentication)

---

## Health & Status Endpoints

### GET /api/hello

Basic Hello World endpoint for testing API connectivity.

**Method:** GET, POST

**Query Parameters:** None

**Response (200):**
```json
{
  "message": "Hello from your Next.js backend!",
  "timestamp": "2025-11-30T10:30:45.123Z",
  "tip": "This is running on the server, not in the browser!"
}
```

**POST Request Body:**
```json
{
  "any": "data"
}
```

**POST Response (200):**
```json
{
  "message": "You sent data to the backend!",
  "receivedData": { "any": "data" },
  "timestamp": "2025-11-30T10:30:45.123Z"
}
```

---

### GET /api/health

Comprehensive health check endpoint returning system status, Discord gateway status, and analytics database health.

**Method:** GET, HEAD

**Query Parameters:** None

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-30T10:30:45.123Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0",
  "services": {
    "discord_gateway": "ready",
    "discord_stats": "available",
    "analytics_db": "healthy",
    "analytics_sessions": 15,
    "analytics_validation": "real-time",
    "analytics_active_users": 8,
    "member_count": 42,
    "session_recovery": "available"
  },
  "system": {
    "memory": {
      "used": 256,
      "total": 512,
      "unit": "MB"
    },
    "node_version": "v18.17.0",
    "platform": "linux"
  }
}
```

**Response (503 - Degraded):**
```json
{
  "status": "degraded",
  "timestamp": "2025-11-30T10:30:45.123Z",
  "services": {
    "discord_gateway": "error",
    "discord_stats": "error"
  }
}
```

**Error Response (503):**
```json
{
  "status": "unhealthy",
  "timestamp": "2025-11-30T10:30:45.123Z",
  "error": "Error message",
  "services": {
    "discord_gateway": "error",
    "discord_stats": "error",
    "analytics_db": "error",
    "member_count": 0
  }
}
```

---

### GET /api/health-check

Health check with URL probing capabilities.

**Method:** GET

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| url | string | Yes | URL to probe with HEAD request |

**Example:**
```
GET /api/health-check?url=https://example.com
```

**Response (200):**
```json
{
  "url": "https://example.com",
  "status": "online",
  "statusCode": 200,
  "responseTime": 145,
  "lastChecked": "2025-11-30T10:30:45.123Z"
}
```

**Response (200 - Offline):**
```json
{
  "url": "https://offline.example.com",
  "status": "offline",
  "error": "Connect timeout",
  "responseTime": 10000,
  "lastChecked": "2025-11-30T10:30:45.123Z"
}
```

**Error Response (400):**
```json
{ "error": "URL parameter is required" }
```

---

### GET /api/probe

Simple probe endpoint for minimal health checks.

**Method:** GET, HEAD

**Query Parameters:** None

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2025-11-30T10:30:45.123Z"
}
```

---

## Discord Integration

### GET /api/discord/server-stats

Retrieve comprehensive Discord server statistics including member information and activity.

**Method:** GET

**Query Parameters:** None

**Response (200):**
```json
{
  "name": "Komplexáci",
  "memberCount": 42,
  "onlineCount": 15,
  "icon": "https://cdn.discordapp.com/icons/SERVER_ID/ICON_HASH.png",
  "description": "Herní komunita v důchodu",
  "features": ["VERIFIED", "BOOST_1"],
  "boostLevel": 1,
  "boostCount": 2,
  "verificationLevel": 1,
  "onlineMembers": [
    {
      "id": "123456789",
      "username": "shaneomac",
      "displayName": "shaneomac",
      "avatar": "https://cdn.discordapp.com/avatars/123456789/HASH.png",
      "status": "online",
      "activity": {
        "name": "Coding the website",
        "type": 0,
        "details": null,
        "state": null
      },
      "customStatus": {
        "name": "Custom Status",
        "emoji": {
          "name": "emoji_name",
          "id": "123456789",
          "animated": false
        },
        "state": "Playing games"
      },
      "streaming": {
        "isStreaming": false,
        "channelName": "voice-channel",
        "inVoice": true
      },
      "roles": ["ROLE_ID"],
      "isRealOnline": true,
      "joinedAt": "2023-01-15T12:00:00Z"
    }
  ],
  "streamingStats": {
    "totalStreaming": 2,
    "totalInVoice": 5,
    "streamingUsers": [
      {
        "id": "123456789",
        "displayName": "streamer",
        "channelName": "voice-channel",
        "streamType": "Screen Share"
      }
    ]
  },
  "mostActiveMembers": [
    {
      "id": "123456789",
      "username": "active_user",
      "displayName": "active_user",
      "avatar": "https://cdn.discordapp.com/avatars/123456789/HASH.png",
      "status": "online",
      "dailyOnlineTime": 240,
      "isOnline": true
    }
  ],
  "hasRealPresenceData": true,
  "lastUpdated": "2025-11-30T10:30:45.123Z",
  "dataSource": "GATEWAY"
}
```

**Error Response (500):**
```json
{
  "name": "Komplexáci",
  "memberCount": 15,
  "onlineCount": 3,
  "error": "Unable to fetch live data - showing fallback stats",
  "dataSource": "FALLBACK"
}
```

---

### GET /api/discord/streaming-status

Get real-time streaming and voice channel activity.

**Method:** GET

**Query Parameters:** None

**Response (200):**
```json
{
  "timestamp": "2025-11-30T10:30:45.123Z",
  "totalMembers": 42,
  "onlineMembers": 15,
  "streamingUsers": [
    {
      "id": "123456789",
      "displayName": "streamer",
      "username": "streamer_name",
      "channelId": "CHANNEL_ID",
      "channelName": "streaming-channel",
      "isStreaming": true,
      "status": "online",
      "activities": [
        {
          "type": 0,
          "name": "Game Name",
          "details": "In Lobby",
          "state": "Playing"
        }
      ],
      "streamType": "Screen Share",
      "streamingTo": "streaming-channel"
    }
  ],
  "voiceUsers": [
    {
      "id": "123456789",
      "displayName": "voice_user",
      "username": "user_name",
      "channelId": "CHANNEL_ID",
      "channelName": "voice-channel",
      "isStreaming": false,
      "status": "online",
      "activities": []
    }
  ],
  "summary": {
    "totalStreaming": 2,
    "totalInVoice": 5,
    "channels": {
      "voice-channel": {
        "users": 5,
        "streaming": 1
      }
    }
  }
}
```

**Error Response (503):**
```json
{
  "error": "Discord Gateway not ready",
  "timestamp": "2025-11-30T10:30:45.123Z"
}
```

---

### GET /api/debug-avatars

Debug endpoint for member avatars (first 10 members).

**Method:** GET

**Query Parameters:** None

**Response (200):**
```json
{
  "success": true,
  "members": [
    {
      "id": "123456789",
      "displayName": "username",
      "username": "user_name",
      "avatar": "https://cdn.discordapp.com/avatars/123456789/HASH.png",
      "avatarHash": "HASH",
      "hasCustomAvatar": true
    }
  ],
  "totalMembers": 42
}
```

---

## League of Legends API

All League of Legends endpoints require Riot API key configured in environment variables.

### GET /api/lol/regions

Get list of supported League of Legends regions.

**Method:** GET

**Query Parameters:** None

**Response (200):**
```json
{
  "regions": [
    {
      "code": "euw1",
      "name": "Europe West",
      "cluster": "europe",
      "countries": ["United Kingdom", "France", "Germany", "Spain", "Italy"]
    },
    {
      "code": "na1",
      "name": "North America",
      "cluster": "americas",
      "countries": ["United States", "Canada"]
    }
  ]
}
```

---

### GET /api/lol/champions

Retrieve list of all League of Legends champions with detailed information.

**Method:** GET

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| locale | string | No | Champion data locale (default: cs_CZ) |
| version | string | No | DataDragon version (default: latest) |

**Example:**
```
GET /api/lol/champions?locale=en_US&version=15.10.1
```

**Response (200):**
```json
[
  {
    "id": "Aatrox",
    "key": "266",
    "name": "Aatrox",
    "title": "The Darkin Blade",
    "description": "Aatrox description...",
    "splash": "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Aatrox_0.jpg",
    "square": "https://ddragon.leagueoflegends.com/cdn/15.10.1/img/champion/Aatrox.png",
    "difficulty": "Střední",
    "damage": "Physical",
    "survivability": "Vysoká",
    "roles": ["TOP"],
    "rangeType": "Melee",
    "championClass": "Fighter",
    "region": "Runeterra"
  }
]
```

**Error Response (500):**
```json
{ "error": "Failed to fetch champions" }
```

---

### GET /api/lol/summoner

Get summoner profile information using Riot ID.

**Method:** GET

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| riotId | string | Yes | Riot ID in format: gameName#tagLine |
| region | string | No | Region code (default: euw1) |
| refresh | string | No | Force refresh cache (true/false) |

**Example:**
```
GET /api/lol/summoner?riotId=PlayerName%23TAG&region=euw1
```

**Response (200):**
```json
{
  "puuid": "PUUID_HASH",
  "summonerId": "SUMMONER_ID",
  "accountId": "ACCOUNT_ID",
  "name": "PlayerName",
  "level": 42,
  "profileIconId": 1234,
  "revisionDate": 1700000000000,
  "region": "euw1"
}
```

**Error Response (400):**
```json
{ "error": "riotId parameter is required (format: gameName#tagLine)" }
```

**Error Response (404):**
```json
{ "error": "Summoner not found" }
```

**Error Response (429):**
```json
{ "error": "Rate limit exceeded. Please try again later." }
```

---

### GET /api/lol/puuid-only

Fast PUUID lookup with in-memory caching (24-hour TTL).

**Method:** GET

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| riotId | string | Yes | Riot ID in format: gameName#tagLine |
| region | string | No | Region code (default: euw1) |

**Example:**
```
GET /api/lol/puuid-only?riotId=PlayerName%23TAG&region=euw1
```

**Response (200 - Cache Hit):**
```json
{
  "puuid": "PUUID_HASH",
  "riotId": "PlayerName#TAG",
  "region": "euw1",
  "cached": true
}
```

**Response Headers:**
```
Cache-Control: public, max-age=86400, stale-while-revalidate=172800
X-Cache: HIT
```

---

### GET /api/lol/summoner-by-puuid

Get summoner information from PUUID.

**Method:** GET

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| puuid | string | Yes | Player PUUID |
| region | string | No | Region code (default: euw1) |

**Example:**
```
GET /api/lol/summoner-by-puuid?puuid=PUUID_HASH&region=euw1
```

**Response (200):**
```json
{
  "puuid": "PUUID_HASH",
  "gameName": "PlayerName",
  "tagLine": "TAG",
  "accountId": "ACCOUNT_ID"
}
```

---

### GET /api/lol/live-game

Get current live game information for a summoner.

**Method:** GET

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| puuid | string | Yes | Player PUUID |
| region | string | No | Region code (default: euw1) |
| _cb | string | No | Cache buster (bypasses cache) |

**Example:**
```
GET /api/lol/live-game?puuid=PUUID_HASH&region=euw1
```

**Response (200 - In Game):**
```json
{
  "inGame": true,
  "gameInfo": {
    "gameId": "GAME_ID",
    "gameType": "MATCHED_GAME",
    "gameMode": "CLASSIC",
    "gameQueueConfigId": 420
  }
}
```

**Response (200 - Not In Game):**
```json
{
  "inGame": false,
  "message": "Summoner is not currently in a game"
}
```

---

### GET /api/lol/mastery

Get champion mastery information for a summoner.

**Method:** GET

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| puuid | string | Yes | Player PUUID |
| region | string | No | Region code (default: euw1) |
| count | number | No | Number of champions (1-50, default: 10) |

**Example:**
```
GET /api/lol/mastery?puuid=PUUID_HASH&region=euw1&count=5
```

**Response (200):**
```json
{
  "championMastery": [
    {
      "championId": 266,
      "championLevel": 7,
      "championPoints": 250000,
      "lastPlayTime": 1700000000000
    }
  ]
}
```

---

### GET /api/lol/matches

Get match history for a summoner.

**Method:** GET

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| puuid | string | Yes | Player PUUID |
| region | string | No | Region code (default: euw1) |
| count | number | No | Number of matches (1-100, default: 10) |

**Example:**
```
GET /api/lol/matches?puuid=PUUID_HASH&region=euw1&count=20
```

**Response (200):**
```json
{
  "matches": [
    "MATCH_ID_1",
    "MATCH_ID_2",
    "MATCH_ID_3"
  ]
}
```

---

## Counter-Strike 2

### GET /api/cs2/game-info

Get Counter-Strike 2 game information and details.

**Method:** GET

**Response (200):**
```json
{
  "title": "Counter-Strike 2",
  "description": "Counter-Strike 2 is a tactical first-person shooter...",
  "basicInfo": {
    "developer": "Valve Corporation",
    "releaseDate": "27. září 2023",
    "genre": "FPS",
    "platform": "PC (Steam)",
    "model": "Free-to-play",
    "engine": "Source 2",
    "esport": "One of the largest esports games"
  },
  "mechanics": {
    "title": "Game Mechanics",
    "features": [
      "Economic system for weapon buying",
      "Precise shooting and recoil control",
      "Tactical grenade usage",
      "Team communication and strategy"
    ]
  }
}
```

---

### GET /api/cs2/maps

Get Counter-Strike 2 maps with filtering options.

**Method:** GET

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| active | string | No | Filter active maps only (true/false) |
| type | string | No | Map type: defusal, hostage, wingman |

**Response (200):**
```json
[
  {
    "id": "dust2",
    "name": "Dust II",
    "description": "The most iconic map in Counter-Strike history",
    "image": "/cs2/maps/dust2.jpg",
    "type": "defusal",
    "active": true,
    "releaseDate": "2001-03-13",
    "features": ["Iconic design", "Long sightlines", "Balanced gameplay"]
  }
]
```

---

### GET /api/cs2/weapons

Get Counter-Strike 2 weapons by category.

**Method:** GET

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| category | string | No | pistole, smg, pusky, odstrelova, tezke, granaty |

**Response (200 - Single Category):**
```json
{
  "id": "pusky",
  "title": "Rifles",
  "weapons": [
    {
      "id": "ak-47",
      "name": "AK-47",
      "price": "$2700",
      "damage": "109 (head with helmet)",
      "accuracy": "Medium precision, high recoil",
      "team": "T"
    }
  ]
}
```

---

## WWE Games

### GET /api/wwe/game-info

Get WWE games general information.

**Method:** GET

**Response (200):**
```json
{
  "title": "WWE Games",
  "description": "Complete collection of WWE/WWF games...",
  "basicInfo": {
    "developer": "THQ, 2K Sports, Acclaim Entertainment",
    "firstGame": "MicroLeague Wrestling (1987)",
    "latestGame": "WWE 2K25 (2025)",
    "genre": "Sports/Wrestling",
    "platforms": "PlayStation, Xbox, Nintendo, PC",
    "totalGames": "50+"
  }
}
```

---

### GET /api/wwe/games

Get WWE games collection with filtering by era and series.

**Method:** GET

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| era | string | No | golden, attitude, ruthless, pg, reality, new-era, renaissance |
| series | string | No | n64, smackdown, svr, 2k, arcade, standalone |

**Response (200):**
```json
[
  {
    "id": "attitude",
    "title": "Attitude Era",
    "subtitle": "1997 - 2002",
    "games": [
      {
        "id": "wwf-war-zone-1998",
        "title": "WWF War Zone",
        "year": 1998,
        "platform": "Nintendo 64, PlayStation",
        "features": ["Stone Cold Steve Austin", "Realistic wrestling"]
      }
    ]
  }
]
```

---

## Music Management

### GET /api/music/playlist

Retrieve current music playlist.

**Method:** GET

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tracks": [
      {
        "id": "track_1700000000000_abc123xyz",
        "title": "Song Title",
        "artist": "Artist Name",
        "file": "/komplexaci/audio/track_1700000000000.mp3",
        "uploadedAt": "2025-11-30T10:30:45.123Z",
        "tags": ["tag1", "tag2"]
      }
    ],
    "lastUpdated": "2025-11-30T10:30:45.123Z"
  }
}
```

---

### POST /api/music/playlist

Add a new track to the playlist.

**Method:** POST

**Request Body:**
```json
{
  "title": "Song Title",
  "artist": "Artist Name",
  "file": "/path/to/file.mp3",
  "tags": ["tag1", "tag2"]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Track added successfully",
  "data": {
    "id": "track_1700000000000_abc123xyz",
    "title": "Song Title",
    "artist": "Artist Name"
  }
}
```

---

### POST /api/music/upload

Upload audio file and add to playlist (requires Discord authentication).

**Method:** POST

**Authentication:** Requires NextAuth session (Discord login)

**Request Body:** multipart/form-data
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | File | Yes | Audio file (MP3, WAV, OGG) |
| title | string | Yes | Track title |
| artist | string | Yes | Artist name |
| tags | string | No | Comma-separated tags |

**Response (200):**
```json
{
  "success": true,
  "message": "File uploaded and track added successfully",
  "data": {
    "filename": "track_1700000000000.mp3",
    "path": "/komplexaci/audio/track_1700000000000.mp3"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Authentication required. Please log in with Discord."
}
```

---

## Analytics

Analytics endpoints track user activity including gaming, voice channel usage, and Spotify listening.

### GET /api/analytics/status

Get comprehensive analytics system status.

**Method:** GET

**Response (200):**
```json
{
  "success": true,
  "message": "Analytics system status - New reset architecture implemented",
  "system": {
    "version": "2.0.0",
    "resetArchitecture": "Non-destructive daily resets + data retention",
    "lastUpdated": "2025-11-30T10:30:45.123Z"
  },
  "status": {
    "discordGateway": {
      "connected": true,
      "memberCount": 42,
      "onlineCount": 15
    },
    "database": {
      "healthy": true,
      "totalRecords": 15000
    }
  }
}
```

---

### GET /api/analytics/user/[userId]

Get detailed user analytics with time range filtering.

**Method:** GET

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| userId | string | Discord user ID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| timeRange | string | No | 1d, 7d, 30d, monthly, 90d, all (default: 30d) |

**Response (200):**
```json
{
  "success": true,
  "userId": "123456789",
  "timeRange": "30d",
  "data": {
    "gameSessions": [
      {
        "game_name": "Counter-Strike 2",
        "session_count": 5,
        "total_minutes": 600
      }
    ],
    "totals": {
      "totalOnlineTime": 240,
      "totalGameTime": 600,
      "totalVoiceTime": 400,
      "totalSongsPlayed": 150
    }
  }
}
```

---

### Additional Analytics Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| GET /api/analytics/status | GET | System status overview |
| GET /api/analytics/data-info | GET | Database statistics |
| POST /api/analytics/export | POST | Export analytics data |
| POST /api/analytics/populate-today | POST | Save daily statistics |
| POST /api/analytics/cleanup | POST | Remove old data |
| GET /api/analytics/debug | GET | Debug analytics data |
| POST /api/analytics/reset-daily | POST | Reset daily counters |
| POST /api/analytics/reset-monthly | POST | Reset monthly counters |

---

## Daily Awards

### GET /api/daily-awards

Get today's daily awards with winners.

**Method:** GET

**Response (200):**
```json
{
  "success": true,
  "awards": [
    {
      "id": "gamer",
      "title": "Gamer of the Day",
      "icon": "🎮",
      "description": "Most gaming time",
      "winner": {
        "userId": "123456789",
        "displayName": "GamerName",
        "avatar": "https://cdn.discordapp.com/avatars/123456789/HASH.png",
        "value": 480,
        "unit": "minutes"
      },
      "participantCount": 12
    },
    {
      "id": "nerd",
      "title": "Nerd of the Day",
      "icon": "🤓",
      "description": "Most online time",
      "winner": {
        "userId": "987654321",
        "displayName": "OnlineNerd",
        "value": 720,
        "unit": "minutes"
      },
      "participantCount": 15
    },
    {
      "id": "listener",
      "title": "Listener of the Day",
      "icon": "🎵",
      "description": "Most Spotify songs",
      "winner": {
        "userId": "555555555",
        "displayName": "MusicLover",
        "value": 150,
        "unit": "songs"
      },
      "participantCount": 8
    }
  ],
  "lastUpdated": "2025-11-30T10:30:45.123Z"
}
```

---

### GET /api/daily-awards/standings

Get standings for specific award category.

**Method:** GET

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| category | string | Yes | gamer, nerd, or listener |

**Response (200):**
```json
{
  "success": true,
  "standings": [
    {
      "userId": "123456789",
      "displayName": "TopGamer",
      "avatar": "https://cdn.discordapp.com/avatars/123456789/HASH.png",
      "value": 480,
      "unit": "minutes",
      "rank": 1
    }
  ],
  "category": "gamer",
  "totalEntries": 12,
  "statistics": {
    "totalParticipants": 12,
    "totalValue": 4200,
    "averageValue": 350,
    "unit": "minutes"
  },
  "lastUpdated": "2025-11-30T10:30:45.123Z"
}
```

---

## Debug Endpoints

### GET /api/debug/activities

Get members with active activities (games, music, streams).

**Method:** GET

**Response (200):**
```json
{
  "success": true,
  "totalMembers": 42,
  "membersWithActivities": 8,
  "activities": [
    {
      "id": "123456789",
      "displayName": "GamerName",
      "status": "online",
      "activities": [
        {
          "name": "Counter-Strike 2",
          "type": 0,
          "details": "In Lobby",
          "state": "Playing"
        }
      ]
    }
  ]
}
```

---

### GET /api/debug/voice

Get real-time voice channel activity.

**Method:** GET

**Response (200):**
```json
{
  "success": true,
  "voiceChannels": [
    {
      "id": "CHANNEL_ID",
      "name": "general",
      "members": [
        {
          "id": "123456789",
          "displayName": "Member",
          "streaming": false
        }
      ]
    }
  ]
}
```

---

### GET /api/debug/voice-states

Get detailed voice state information for all members.

**Method:** GET

**Response (200):**
```json
{
  "success": true,
  "voiceStates": [
    {
      "userId": "123456789",
      "channelId": "CHANNEL_ID",
      "channelName": "voice-channel",
      "streaming": false,
      "muted": false,
      "deafened": false
    }
  ]
}
```

---

## Authentication

### GET /api/auth/[...nextauth]

NextAuth authentication endpoint supporting Discord OAuth.

**Supported Methods:** GET, POST, OPTIONS

**Endpoints:**
- `/api/auth/signin` - Sign in page
- `/api/auth/callback/discord` - Discord OAuth callback
- `/api/auth/session` - Get current session
- `/api/auth/signout` - Sign out

**Session Response (200):**
```json
{
  "user": {
    "name": "Username",
    "email": "user@example.com",
    "image": "https://example.com/avatar.png"
  },
  "expires": "2025-12-01T10:30:45.123Z"
}
```

---

## Error Handling

All endpoints follow standard HTTP status codes:

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Missing required parameters |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 429 | Rate Limited | Too many requests |
| 500 | Server Error | Internal server error |
| 503 | Service Unavailable | Service temporarily down |

**Standard Error Response:**
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

---

## Rate Limiting

- Riot API endpoints: Subject to Riot's rate limits (usually 20 requests/second)
- Most endpoints: 60 requests/minute per IP
- Caching: Utilizes ETags and Cache-Control headers

---

## Caching Strategy

| Endpoint | Cache Duration | Revalidation |
|----------|---|---|
| Champions | 1 hour | 24 hours stale |
| Regions | 24 hours | 48 hours stale |
| Summoner | 5 minutes | 10 minutes stale |
| Live Game | 30 seconds | 1 minute stale |
| PUUID | 24 hours | 48 hours stale |
| Mastery | 10 minutes | 20 minutes stale |
| Matches | 3 minutes | 6 minutes stale |

---

## Response Headers

Common response headers:
```
Content-Type: application/json
Cache-Control: public, s-maxage=300, stale-while-revalidate=600
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

---

## Versioning

API version: 1.0.0
Latest update: 2025-11-30

---

## Support

For issues or feature requests, please contact the development team or open an issue in the project repository.