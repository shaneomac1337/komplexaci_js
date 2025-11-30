# Komplexáci Analytics System - Technical Reference

Complete reference documentation for the analytics subsystem that tracks Discord activity including gaming sessions, voice participation, and Spotify listening.

**Version:** 1.0.0
**Last Updated:** 2025-11-30
**Status:** Production

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Session Management](#session-management)
5. [Daily/Monthly Reset Logic](#dailymonthly-reset-logic)
6. [Stale Session Detection](#stale-session-detection)
7. [Discord Gateway Integration](#discord-gateway-integration)
8. [Public API Reference](#public-api-reference)
9. [SQL Query Examples](#sql-query-examples)
10. [Troubleshooting](#troubleshooting)
11. [Performance Optimization](#performance-optimization)

---

## System Overview

The Komplexáci analytics system provides real-time tracking of community member activities across multiple platforms:

- **Gaming Sessions**: Tracks games played and duration per user
- **Voice Channel Activity**: Records voice channel participation and screen sharing
- **Spotify Integration**: Monitors music listening with song-level granularity
- **Daily Snapshots**: Historical daily aggregates for trend analysis
- **User Statistics**: Separate daily and monthly cumulative metrics

### Core Components

| Component | Purpose | Technology |
|-----------|---------|------------|
| `database.ts` | Data persistence layer | SQLite (better-sqlite3) |
| `service.ts` | Business logic and session management | Node.js TypeScript |
| `index.ts` | System initialization and exports | Module entry point |

### Key Design Principles

- **Real-time Tracking**: Updates statistics immediately as activities change
- **Session-based Architecture**: Tracks discrete sessions with start/end times
- **Stale Detection**: Automatically detects and closes inactive sessions after 5 minutes
- **In-Memory State**: Active user sessions cached in service for quick access
- **Transaction Safety**: Uses SQLite transactions for critical operations
- **UTC Normalization**: All timestamps stored as ISO 8601 UTC strings

---

## Architecture

### System Flow Diagram

```
Discord Gateway Events
    |
    ├─> User Presence Changes
    |       |
    |       └─> updateUserPresence() -> Service
    |               |
    |               ├─> Start Game Session
    |               ├─> End Game Session
    |               ├─> Start Spotify Session
    |               └─> End Spotify Session
    |
    ├─> Voice State Changes
    |       |
    |       └─> updateUserVoiceState() -> Service
    |               |
    |               ├─> Join Voice Channel
    |               ├─> Leave Voice Channel
    |               └─> Update Streaming Status
    |
    └─> Presence Activities
            |
            └─> recoverExistingSessions() -> Service
                    |
                    └─> Restore active sessions from Discord state

Database Updates
    |
    ├─> Session Tables
    |       ├─> game_sessions
    |       ├─> voice_sessions
    |       └─> spotify_sessions
    |
    ├─> Statistics
    |       └─> user_stats (immediate updates)
    |
    └─> History
            ├─> daily_snapshots
            └─> data retention cleanup
```

### Service Architecture

```
AnalyticsService (Singleton)
├─ activeUsers: Map<userId, UserActivity>
├─ db: AnalyticsDatabase
│
├─ Session Management
│   ├─ startGameSession()
│   ├─ endGameSession()
│   ├─ startVoiceSession()
│   ├─ endVoiceSession()
│   ├─ startSpotifySession()
│   └─ endSpotifySession()
│
├─ Real-time Updates
│   ├─ updateUserPresence()
│   ├─ updateUserVoiceState()
│   ├─ updateStreamingStatus()
│   └─ updateActiveSessionsProgress()
│
├─ Recovery & Validation
│   ├─ recoverExistingSessions()
│   ├─ validateActiveSessionsWithPresence()
│   └─ fixInconsistentTimestamps()
│
└─ Statistics & Snapshots
    ├─ generateDailySnapshot()
    ├─ generateAllDailySnapshots()
    └─ saveDailyOnlineTime()
```

---

## Database Schema

### Table: `user_stats`

Cumulative daily and monthly statistics per user. Updated in real-time as sessions change.

```sql
CREATE TABLE user_stats (
  user_id TEXT PRIMARY KEY,

  -- Daily metrics (reset at 00:00 UTC)
  daily_online_minutes INTEGER DEFAULT 0,
  daily_voice_minutes INTEGER DEFAULT 0,
  daily_games_played INTEGER DEFAULT 0,
  daily_games_minutes INTEGER DEFAULT 0,
  daily_spotify_minutes INTEGER DEFAULT 0,
  daily_spotify_songs INTEGER DEFAULT 0,
  daily_streaming_minutes INTEGER DEFAULT 0,

  -- Monthly metrics (reset on 1st of month at 00:00 UTC)
  monthly_online_minutes INTEGER DEFAULT 0,
  monthly_voice_minutes INTEGER DEFAULT 0,
  monthly_games_played INTEGER DEFAULT 0,
  monthly_games_minutes INTEGER DEFAULT 0,
  monthly_spotify_minutes INTEGER DEFAULT 0,
  monthly_spotify_songs INTEGER DEFAULT 0,
  monthly_streaming_minutes INTEGER DEFAULT 0,

  -- Reset tracking
  last_daily_reset TEXT DEFAULT CURRENT_TIMESTAMP,
  last_monthly_reset TEXT DEFAULT CURRENT_TIMESTAMP,

  -- Metadata
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast reset tracking
CREATE INDEX idx_user_stats_daily_reset ON user_stats(last_daily_reset);
CREATE INDEX idx_user_stats_monthly_reset ON user_stats(last_monthly_reset);
```

#### Field Descriptions

| Field | Type | Description | Reset Frequency |
|-------|------|-------------|-----------------|
| `user_id` | TEXT | Discord user ID (primary key) | Never |
| `daily_online_minutes` | INTEGER | Total online time today | 00:00 UTC daily |
| `daily_voice_minutes` | INTEGER | Total voice channel time today | 00:00 UTC daily |
| `daily_games_played` | INTEGER | Unique games played today | 00:00 UTC daily |
| `daily_games_minutes` | INTEGER | Total gaming time today | 00:00 UTC daily |
| `daily_spotify_minutes` | INTEGER | Total Spotify listening today | 00:00 UTC daily |
| `daily_spotify_songs` | INTEGER | Unique songs started today | 00:00 UTC daily |
| `daily_streaming_minutes` | INTEGER | Screen sharing duration today | 00:00 UTC daily |
| `monthly_online_minutes` | INTEGER | Total online time this month | 1st of month 00:00 UTC |
| `monthly_voice_minutes` | INTEGER | Total voice time this month | 1st of month 00:00 UTC |
| `monthly_games_played` | INTEGER | Unique games this month | 1st of month 00:00 UTC |
| `monthly_games_minutes` | INTEGER | Total game time this month | 1st of month 00:00 UTC |
| `monthly_spotify_minutes` | INTEGER | Total Spotify time this month | 1st of month 00:00 UTC |
| `monthly_spotify_songs` | INTEGER | Unique songs this month | 1st of month 00:00 UTC |
| `monthly_streaming_minutes` | INTEGER | Screen sharing this month | 1st of month 00:00 UTC |
| `last_daily_reset` | TEXT | ISO 8601 timestamp of last daily reset | Automatic |
| `last_monthly_reset` | TEXT | ISO 8601 timestamp of last monthly reset | Automatic |
| `created_at` | TEXT | Account creation timestamp | Never |
| `updated_at` | TEXT | Last update timestamp | On every change |

### Table: `game_sessions`

Individual game play sessions with status tracking.

```sql
CREATE TABLE game_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  game_name TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  duration_minutes INTEGER DEFAULT 0,
  last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for querying
CREATE INDEX idx_game_sessions_user ON game_sessions(user_id);
CREATE INDEX idx_game_sessions_start_time ON game_sessions(start_time);
CREATE INDEX idx_game_sessions_game_name ON game_sessions(game_name);
CREATE INDEX idx_game_sessions_status ON game_sessions(status);
CREATE INDEX idx_game_sessions_last_updated ON game_sessions(last_updated);
```

#### Field Descriptions

| Field | Type | Notes |
|-------|------|-------|
| `id` | INTEGER | Auto-incrementing session ID |
| `user_id` | TEXT | Discord user ID |
| `game_name` | TEXT | Normalized game name (e.g., "League of Legends") |
| `start_time` | TEXT | ISO 8601 UTC timestamp when game started |
| `end_time` | TEXT | ISO 8601 UTC timestamp when game ended (NULL if active) |
| `duration_minutes` | INTEGER | Calculated duration in minutes (0 if active) |
| `last_updated` | TEXT | ISO 8601 UTC timestamp of last progress update |
| `status` | TEXT | One of: `active`, `ended`, `stale` |
| `created_at` | TEXT | ISO 8601 UTC timestamp when record created |

### Table: `voice_sessions`

Voice channel participation with screen sharing tracking.

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
  last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for querying
CREATE INDEX idx_voice_sessions_user ON voice_sessions(user_id);
CREATE INDEX idx_voice_sessions_start_time ON voice_sessions(start_time);
CREATE INDEX idx_voice_sessions_status ON voice_sessions(status);
CREATE INDEX idx_voice_sessions_last_updated ON voice_sessions(last_updated);
```

#### Field Descriptions

| Field | Type | Notes |
|-------|------|-------|
| `id` | INTEGER | Auto-incrementing session ID |
| `user_id` | TEXT | Discord user ID |
| `channel_id` | TEXT | Discord voice channel ID |
| `channel_name` | TEXT | Readable channel name |
| `start_time` | TEXT | ISO 8601 UTC timestamp when user joined |
| `end_time` | TEXT | ISO 8601 UTC timestamp when user left (NULL if active) |
| `duration_minutes` | INTEGER | Total voice channel time in minutes |
| `screen_share_minutes` | INTEGER | Total screen sharing duration within session |
| `last_updated` | TEXT | ISO 8601 UTC timestamp of last progress update |
| `status` | TEXT | One of: `active`, `ended`, `stale` |
| `created_at` | TEXT | ISO 8601 UTC timestamp when record created |

### Table: `spotify_sessions`

Music listening sessions with track-level detail.

```sql
CREATE TABLE spotify_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  track_name TEXT NOT NULL,
  artist TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  duration_minutes INTEGER DEFAULT 0,
  last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for querying
CREATE INDEX idx_spotify_sessions_user ON spotify_sessions(user_id);
CREATE INDEX idx_spotify_sessions_artist ON spotify_sessions(artist);
CREATE INDEX idx_spotify_sessions_status ON spotify_sessions(status);
CREATE INDEX idx_spotify_sessions_last_updated ON spotify_sessions(last_updated);
```

#### Field Descriptions

| Field | Type | Notes |
|-------|------|-------|
| `id` | INTEGER | Auto-incrementing session ID |
| `user_id` | TEXT | Discord user ID |
| `track_name` | TEXT | Song title (normalized, max 200 chars) |
| `artist` | TEXT | Artist name (normalized, max 100 chars) |
| `start_time` | TEXT | ISO 8601 UTC timestamp when track started |
| `end_time` | TEXT | ISO 8601 UTC timestamp when track changed/ended (NULL if active) |
| `duration_minutes` | INTEGER | Listening duration in minutes |
| `last_updated` | TEXT | ISO 8601 UTC timestamp of last progress update |
| `status` | TEXT | One of: `active`, `ended`, `stale` |
| `created_at` | TEXT | ISO 8601 UTC timestamp when record created |

### Table: `daily_snapshots`

Historical daily aggregates for trend analysis and reporting.

```sql
CREATE TABLE daily_snapshots (
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  online_minutes INTEGER DEFAULT 0,
  voice_minutes INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  spotify_minutes INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, date)
);

-- Indexes for time-based queries
CREATE INDEX idx_daily_snapshots_date ON daily_snapshots(date);
CREATE INDEX idx_daily_snapshots_user_date ON daily_snapshots(user_id, date);
```

#### Field Descriptions

| Field | Type | Notes |
|-------|------|-------|
| `user_id` | TEXT | Discord user ID |
| `date` | TEXT | Date in YYYY-MM-DD format (UTC) |
| `online_minutes` | INTEGER | Estimated online time for the day |
| `voice_minutes` | INTEGER | Total voice channel time |
| `games_played` | INTEGER | Count of unique games played |
| `spotify_minutes` | INTEGER | Total Spotify listening time |
| `created_at` | TEXT | ISO 8601 UTC timestamp when snapshot created |

---

## Session Management

### Session Lifecycle

Sessions progress through three distinct states:

```
Active
  ↓
  ├─> [Discord event received] ──→ Ended
  |
  └─> [5+ minutes without update] ──→ Stale
```

#### Active State

A session is **active** when:
- Recently created from a Discord event
- Last updated within the past 5 minutes
- No end_time recorded in database

**Characteristics:**
- `status = 'active'`
- `end_time IS NULL`
- `last_updated` is recent (within 5 minutes)

**Operations:**
- Progress updates every minute via `updateActiveSessionsProgress()`
- Duration recalculated from start_time to current time
- User statistics updated immediately

#### Ended State

A session is **ended** when:
- User explicitly stops the activity (receives Discord event)
- Session properly closed with end_time recorded

**Characteristics:**
- `status = 'ended'`
- `end_time` has a value
- `duration_minutes` is final and calculated

**Operations:**
- No further updates
- Included in historical queries and snapshots
- Duration remains fixed

#### Stale State

A session is **stale** when:
- Active session not updated for more than 5 minutes
- Indicates potential disconnection or data loss
- Automatically detected and transitioned to stale

**Characteristics:**
- `status = 'stale'`
- `end_time` has a value (calculated from last_updated)
- `duration_minutes` calculated at mark-as-stale time

**Operations:**
- Marked by `getStaleXxxSessions()` queries
- Can be transitioned to stale by `markXxxSessionAsStale()`
- Treated as historical data

### Session State Transitions

```typescript
// Active → Ended (Explicit Close)
// Called when Discord event confirms activity ended
updateGameSession(sessionId, endTime, durationMinutes)
updateVoiceSession(sessionId, endTime, durationMinutes, screenShareMinutes)
updateSpotifySession(sessionId, endTime, durationMinutes)

// Active → Stale (Timeout)
// Called when session inactive for > 5 minutes
markGameSessionAsStale(sessionId, endTime, durationMinutes)
markVoiceSessionAsStale(sessionId, endTime, durationMinutes, screenShareMinutes)
markSpotifySessionAsStale(sessionId, endTime, durationMinutes)

// Active → Active (Progress Update)
// Called every minute to update duration
updateGameSessionProgress(sessionId, durationMinutes)
updateVoiceSessionProgress(sessionId, durationMinutes, screenShareMinutes)
updateSpotifySessionProgress(sessionId, durationMinutes)
```

### Immediate Statistics Updates

Three categories of sessions trigger immediate user_stats updates:

**1. Game Time Updates** - Triggered when:
- Game session ends
- Progress update on active session (every minute)

**Method:** `updateGameTimeImmediately(userId)`

```typescript
// Counts:
SELECT SUM(duration_minutes) as total_minutes,
       COUNT(DISTINCT game_name) as games_played
FROM game_sessions
WHERE user_id = ? AND (
  (start_time >= last_daily_reset AND status IN ('active', 'ended')) OR
  (status = 'active')
)
```

**2. Voice Time Updates** - Triggered when:
- Voice session ends
- Progress update on active session (every minute)

**Method:** `updateVoiceTimeImmediately(userId)`

```typescript
// Counts:
SELECT SUM(duration_minutes) as total_minutes,
       SUM(screen_share_minutes) as total_streaming_minutes
FROM voice_sessions
WHERE user_id = ? AND (
  (start_time >= last_daily_reset AND status IN ('active', 'ended')) OR
  (status = 'active')
)
```

**3. Spotify Song Count Updates** - Triggered when:
- New Spotify song starts playing

**Method:** `updateSpotifySongCountImmediately(userId)`

```typescript
// Counts:
SELECT COUNT(*) as songs_played
FROM spotify_sessions
WHERE user_id = ? AND start_time > last_daily_reset AND status IN ('active', 'ended')
```

---

## Daily/Monthly Reset Logic

### Daily Reset

**Trigger:** Automatic at 00:00 UTC each day

**Scope:** All daily_* columns in user_stats

**Methods:**
```typescript
resetDailyStats(userId?: string)        // Specific user or all users
resetDailyStats('user123')              // Reset single user
resetDailyStats()                        // Reset all users
```

**Reset Time:** Set to 2 minutes before actual reset to ensure recovered sessions are counted

```sql
UPDATE user_stats SET
  daily_online_minutes = 0,
  daily_voice_minutes = 0,
  daily_games_played = 0,
  daily_games_minutes = 0,
  daily_spotify_minutes = 0,
  daily_spotify_songs = 0,
  daily_streaming_minutes = 0,
  last_daily_reset = ? (current time - 2 minutes),
  updated_at = CURRENT_TIMESTAMP
WHERE user_id = ?
```

**After Reset:**
- All daily counters zeroed
- Monthly counters preserved
- new `last_daily_reset` timestamp recorded

### Monthly Reset

**Trigger:** Automatic at 00:00 UTC on the 1st of each month

**Scope:** All monthly_* columns in user_stats

**Methods:**
```typescript
resetMonthlyStats(userId?: string)      // Specific user or all users
resetMonthlyStats('user123')            // Reset single user
resetMonthlyStats()                      // Reset all users
```

**Reset Time:** 2 minutes before actual month boundary

```sql
UPDATE user_stats SET
  monthly_online_minutes = 0,
  monthly_voice_minutes = 0,
  monthly_games_played = 0,
  monthly_games_minutes = 0,
  monthly_spotify_minutes = 0,
  monthly_spotify_songs = 0,
  monthly_streaming_minutes = 0,
  last_monthly_reset = ?,
  updated_at = CURRENT_TIMESTAMP
WHERE user_id = ?
```

**After Reset:**
- All monthly counters zeroed
- Daily counters independent (not affected by monthly reset)
- New `last_monthly_reset` timestamp recorded

### Reset Tracking

Reset times are stored to accurately count activities:

```typescript
// Count only sessions since last reset
SELECT SUM(duration_minutes)
FROM game_sessions
WHERE user_id = ?
  AND start_time > (
    SELECT last_daily_reset FROM user_stats WHERE user_id = ?
  )
```

### Reset Behavior on Monthly Boundary

When both daily and monthly resets occur simultaneously:

1. Daily reset executes first
2. Monthly reset executes immediately after
3. Both `last_daily_reset` and `last_monthly_reset` updated
4. Counters go to 0 for both daily and monthly

---

## Stale Session Detection

### Detection Mechanism

**Threshold:** 5 minutes of inactivity

**Check Interval:** Every minute via cron/scheduler

**Detection Query:**
```sql
SELECT * FROM game_sessions
WHERE status = 'active'
  AND last_updated < (CURRENT_TIMESTAMP - 5 minutes)
```

### Detection Process

1. **Query Stale Sessions**
   ```typescript
   getStaleGameSessions(staleMinutes = 5)      // Default 5 minutes
   getStaleVoiceSessions(staleMinutes = 5)
   getStaleSpotifySessions(staleMinutes = 5)
   ```

2. **Calculate Duration**
   ```typescript
   // From start_time to last_updated (or current time)
   const durationMinutes = Math.round(
     (lastUpdated.getTime() - startTime.getTime()) / (1000 * 60)
   )
   ```

3. **Mark as Stale**
   ```typescript
   markGameSessionAsStale(id, endTime, durationMinutes)
   // Updates: status = 'stale', end_time = endTime, last_updated = CURRENT_TIMESTAMP
   ```

### Stale Session Recovery

**Purpose:** Detect stale sessions during server startup or after extended downtime

**Method:** `recoverExistingSessions(discordGuild)`

**Process:**
1. Ends all currently active sessions (prevents duplicates)
2. Scans Discord guild members for active activities
3. Recovers sessions with recovery time as start_time (no backdating)

```typescript
// Example: User was gaming at server startup
// Recovery creates fresh session from recovery time
// No attempt to backdate activity
const estimatedStartTime = new Date()  // Recovery moment
this.startGameSession(user, gameName, estimatedStartTime)
```

### Reasons for Stale Sessions

| Reason | Detection | Action |
|--------|-----------|--------|
| Network disconnect | No update for 5+ minutes | Mark stale, close session |
| Bot restart/crash | Sessions from before restart | End and mark stale on recovery |
| Presence lag | Discord delayed activity update | Mark stale after threshold |
| User alt-tab out | User still gaming but Discord delay | Progress update resumes |

### Handling Edge Cases

**Case 1: User goes AFK (Away From Keyboard)**
- Session continues to update as "active"
- Discord status may change but activity persists
- User should manually end game or Discord gateway event sent

**Case 2: Bot Crash During Session**
- Session remains active in database with old timestamp
- Recovery process identifies it as stale
- Closes session without backdate
- New session created from recovery time

**Case 3: Rapid Activity Changes**
- User switches games quickly
- Previous game marked ended
- New game session starts immediately
- No stale state reached

---

## Discord Gateway Integration

### Integration Points

The analytics system integrates with Discord.js bot events:

#### 1. Presence Update Event

**Event:** `presenceUpdate`

**Triggered By:**
- User comes online/offline
- User changes status (online → idle → dnd → offline)
- User starts/stops playing game
- User starts/stops Spotify

**Handler Code:**
```typescript
client.on('presenceUpdate', (oldPresence, newPresence) => {
  const userId = newPresence.userId;
  const displayName = newPresence.user?.username || 'Unknown';

  // Extract activities
  const activities = newPresence.activities || [];

  // Update analytics service
  analyticsService.updateUserPresence(
    userId,
    displayName,
    newPresence.status,
    activities
  );
});
```

**Actions Taken:**
- Updates user status (online/idle/dnd/offline)
- Detects game changes
- Detects Spotify changes
- Ends sessions on offline status

#### 2. Voice State Update Event

**Event:** `voiceStateUpdate`

**Triggered By:**
- User joins voice channel
- User leaves voice channel
- User switches channels
- User starts screen sharing
- User stops screen sharing

**Handler Code:**
```typescript
client.on('voiceStateUpdate', (oldState, newState) => {
  const userId = newState.id;

  // Voice channel change
  const channelId = newState.channel?.id || null;
  const channelName = newState.channel?.name || null;

  // Screen sharing detection
  const isStreaming = newState.streaming || false;

  // Update analytics service
  analyticsService.updateUserVoiceState(
    userId,
    channelId,
    channelName,
    isStreaming
  );
});
```

**Actions Taken:**
- Creates voice session when joining
- Ends voice session when leaving
- Tracks streaming start/stop
- Accumulates screen share time

#### 3. Server Startup Recovery

**Event:** Ready (on bot startup)

**Triggered By:** Bot successfully connects to Discord

**Handler Code:**
```typescript
client.on('ready', () => {
  console.log(`Logged in as ${client.user?.tag}`);

  // Recover existing sessions from Discord state
  const guild = client.guilds.cache.first();
  if (guild) {
    analyticsService.recoverExistingSessions(guild);
  }
});
```

**Actions Taken:**
- Scans all guild members for active activities
- Creates sessions from current Discord state
- No backdating of activities

### Activity Type Mapping

Discord presence activities mapped to analytics types:

| Activity Type | Discord Code | Analytics Handler | Example |
|---------------|-------------|-------------------|---------|
| Playing Game | 0 | Game session | "Playing League of Legends" |
| Streaming | 1 | Voice screen sharing | "Streaming Valorant" |
| Listening | 2 | Spotify or audio | "Listening to Spotify" |
| Watching | 3 | Ignored (not tracked) | "Watching YouTube" |
| Custom | 4 | Ignored | User custom status |

### Spotify Activity Parsing

Spotify activities have special structure in Discord presence:

```typescript
// Discord Spotify activity structure
{
  type: 2,  // Listening
  name: 'Spotify',
  details: 'Track Name',    // Song title
  state: 'Artist Name',      // Artist name
  assets: {
    largeImage: 'spotify:123',  // Album art
    largeText: 'Album Name'
  },
  timestamps: {
    start: 1234567890000,
    end: 1234567920000
  }
}
```

**Extraction:**
```typescript
track = activity.details  // "Track Name"
artist = activity.state    // "Artist Name"
```

### Presence Recovery Logic

When bot restarts, recovery scans Discord for:

1. **Active Games** (type === 0)
   - Extracts game name
   - Creates fresh game session
   - Sets start_time to recovery moment

2. **Active Voice**
   - Checks member.voice.channel
   - Detects streaming status
   - Creates fresh voice session

3. **Spotify** (type === 2 with name === 'Spotify')
   - Extracts track and artist
   - Creates fresh Spotify session
   - Sets start_time to recovery moment

```typescript
// Recovery creates fresh sessions
const estimatedStartTime = new Date();  // Recovery time, no backdate
this.startGameSession(user, 'League of Legends', estimatedStartTime);
this.startVoiceSession(user, channelId, channelName, estimatedStartTime);
this.startSpotifySession(user, trackName, artistName, estimatedStartTime);
```

---

## Public API Reference

### Initialization

#### `initializeAnalytics()`

Initialize the entire analytics system (database and service).

**Returns:** `{ database, analytics }`

**Example:**
```typescript
import { initializeAnalytics } from 'src/lib/analytics';

const { database, analytics } = initializeAnalytics();
// Database ready
// Analytics service ready
```

### Database Access

#### `getAnalyticsDatabase()`

Get the singleton database instance.

**Returns:** `AnalyticsDatabase`

**Methods:**

##### User Stats Management

**`upsertUserStats(stats)`**
- **Type:** `(stats: Omit<UserStats, 'created_at' | 'updated_at'>) => RunResult`
- **Purpose:** Insert or update user statistics
- **Parameters:**
  - `stats.user_id`: Discord user ID
  - `stats.daily_online_minutes`: Daily online time
  - `stats.daily_voice_minutes`: Daily voice time
  - `stats.daily_games_played`: Unique games today
  - `stats.daily_games_minutes`: Game time today
  - `stats.daily_spotify_minutes`: Spotify listening today
  - `stats.daily_spotify_songs`: Songs started today
  - `stats.daily_streaming_minutes`: Screen share time today
  - `stats.monthly_*`: Same but monthly totals
  - `stats.last_daily_reset`: ISO timestamp of last daily reset
  - `stats.last_monthly_reset`: ISO timestamp of last monthly reset

**`getUserStats(userId)`**
- **Type:** `(userId: string) => UserStats | null`
- **Purpose:** Get current stats for a user
- **Returns:** User stats object or null if not found

**`getAllUserStats()`**
- **Type:** `() => UserStats[]`
- **Purpose:** Get all user stats, sorted by online time descending

**`resetDailyStats(userId?)`**
- **Type:** `(userId?: string) => RunResult`
- **Purpose:** Reset daily counters
- **Parameters:** Optional userId (all users if omitted)

**`resetMonthlyStats(userId?)`**
- **Type:** `(userId?: string) => RunResult`
- **Purpose:** Reset monthly counters
- **Parameters:** Optional userId (all users if omitted)

##### Game Session Operations

**`insertGameSession(session)`**
- **Type:** `(session: Omit<GameSession, 'id' | 'created_at'>) => RunResult`
- **Purpose:** Create new game session
- **Returns:** Result with lastInsertRowid

**`getGameSession(id)`**
- **Type:** `(id: number) => GameSession | null`
- **Purpose:** Get single game session by ID

**`updateGameSession(id, endTime, durationMinutes)`**
- **Type:** `(id: number, endTime: string, durationMinutes: number) => RunResult`
- **Purpose:** End a game session (set status to 'ended')

**`updateGameSessionProgress(id, durationMinutes)`**
- **Type:** `(id: number, durationMinutes: number) => RunResult`
- **Purpose:** Update duration for active session

**`getActiveGameSessions(userId?)`**
- **Type:** `(userId?: string) => GameSession[]`
- **Purpose:** Get active game sessions (status = 'active')
- **Parameters:** Optional userId filter

**`getStaleGameSessions(staleMinutes?)`**
- **Type:** `(staleMinutes?: number) => GameSession[]`
- **Purpose:** Get inactive sessions (not updated for N minutes)
- **Default staleMinutes:** 5

**`markGameSessionAsStale(id, endTime, durationMinutes)`**
- **Type:** `(id: number, endTime: string, durationMinutes: number) => RunResult`
- **Purpose:** Transition active session to stale (mark as ended)

##### Voice Session Operations

**`insertVoiceSession(session)`**
- **Type:** `(session: Omit<VoiceSession, 'id' | 'created_at'>) => RunResult`
- **Purpose:** Create new voice session
- **Returns:** Result with lastInsertRowid

**`updateVoiceSession(id, endTime, durationMinutes, screenShareMinutes)`**
- **Type:** `(...) => RunResult`
- **Purpose:** End voice session (set status to 'ended')

**`updateVoiceSessionProgress(id, durationMinutes, screenShareMinutes)`**
- **Type:** `(...) => RunResult`
- **Purpose:** Update duration and streaming time for active session

**`getActiveVoiceSessions(userId?)`**
- **Type:** `(userId?: string) => VoiceSession[]`
- **Purpose:** Get active voice sessions

**`getStaleVoiceSessions(staleMinutes?)`**
- **Type:** `(staleMinutes?: number) => VoiceSession[]`
- **Purpose:** Get inactive voice sessions

**`markVoiceSessionAsStale(id, endTime, durationMinutes, screenShareMinutes)`**
- **Type:** `(...) => RunResult`
- **Purpose:** Mark voice session as stale

##### Spotify Session Operations

**`insertSpotifySession(session)`**
- **Type:** `(session: Omit<SpotifySession, 'id' | 'created_at'>) => RunResult`
- **Purpose:** Create new Spotify session

**`updateSpotifySession(id, endTime, durationMinutes)`**
- **Type:** `(...) => RunResult`
- **Purpose:** End Spotify session

**`updateSpotifySessionProgress(id, durationMinutes)`**
- **Type:** `(...) => RunResult`
- **Purpose:** Update duration for active session

**`getActiveSpotifySessions(userId?)`**
- **Type:** `(userId?: string) => SpotifySession[]`
- **Purpose:** Get active Spotify sessions

**`getStaleSpotifySessions(staleMinutes?)`**
- **Type:** `(staleMinutes?: number) => SpotifySession[]`
- **Purpose:** Get inactive Spotify sessions

**`markSpotifySessionAsStale(id, endTime, durationMinutes)`**
- **Type:** `(...) => RunResult`
- **Purpose:** Mark Spotify session as stale

##### Daily Snapshot Operations

**`upsertDailySnapshot(snapshot)`**
- **Type:** `(snapshot: Omit<DailySnapshot, 'created_at'>) => RunResult`
- **Purpose:** Insert or update daily snapshot

**`getDailySnapshot(userId, date)`**
- **Type:** `(userId: string, date: string) => DailySnapshot | null`
- **Purpose:** Get snapshot for specific date

**`getDailySnapshots(userId?, startDate?, endDate?)`**
- **Type:** `(...) => DailySnapshot[]`
- **Purpose:** Query snapshots with optional filters
- **Parameters:** All optional, ordered by date DESC

##### Data Retention

**`getDataRetentionInfo(retentionDays?)`**
- **Type:** `(retentionDays?: number) => RetentionInfo`
- **Purpose:** Get counts of old vs recent data
- **Default retentionDays:** 365
- **Returns:** Counts of records older/newer than cutoff

**`cleanupOldData(retentionDays)`**
- **Type:** `(retentionDays: number) => CleanupResult`
- **Purpose:** Delete records older than N days
- **Actions:** Deletes from all tables, runs VACUUM
- **Returns:** Count of deleted records per table

##### Utility Methods

**`getCurrentDayData(date?)`**
- **Type:** `(date?: string) => DayData`
- **Purpose:** Get all data for a specific date
- **Returns:** Snapshots, user stats, sessions

**`healthCheck()`**
- **Type:** `() => HealthCheckResult`
- **Purpose:** Verify database connectivity
- **Returns:** Status and connection details

**`getDatabase()`**
- **Type:** `() => Database.Database`
- **Purpose:** Get raw better-sqlite3 database for custom queries
- **Warning:** Use carefully, may bypass safety checks

**`close()`**
- **Type:** `() => void`
- **Purpose:** Close database connection

### Analytics Service

#### `getAnalyticsService()`

Get the singleton analytics service instance.

**Returns:** `AnalyticsService`

**Methods:**

##### Session Management

**`updateUserPresence(userId, displayName, status, activities, timestamp?)`**
- **Type:** `(userId, displayName, status, activities, timestamp?) => void`
- **Purpose:** Process Discord presence update
- **Parameters:**
  - `userId`: Discord user ID
  - `displayName`: User's display name
  - `status`: 'online' | 'idle' | 'dnd' | 'offline'
  - `activities`: Array of Discord activities
  - `timestamp`: Optional custom timestamp (defaults to now)
- **Actions:** Detects game/Spotify changes, handles status changes

**`updateUserVoiceState(userId, channelId, channelName, isStreaming?)`**
- **Type:** `(userId, channelId, channelName, isStreaming?) => void`
- **Purpose:** Process Discord voice state change
- **Parameters:**
  - `userId`: Discord user ID
  - `channelId`: Voice channel ID or null
  - `channelName`: Readable channel name
  - `isStreaming`: Boolean (default false)
- **Actions:** Join/leave voice, update streaming status

**`updateStreamingStatus(userId, isStreaming)`**
- **Type:** `(userId, isStreaming) => void`
- **Purpose:** Update screen sharing status for active voice session
- **Parameters:**
  - `userId`: Discord user ID
  - `isStreaming`: Boolean
- **Actions:** Tracks streaming start/stop time

**`recoverExistingSessions(discordGuild)`**
- **Type:** `(discordGuild: Guild) => void`
- **Purpose:** Restore sessions from Discord state on startup
- **Parameters:** Discord.js Guild object
- **Actions:**
  - Ends all current active sessions
  - Scans guild members for activities
  - Creates fresh sessions for active users
  - No backdating of activities

##### Statistics & Snapshots

**`saveDailyOnlineTime(userId, displayName, date, onlineMinutes)`**
- **Type:** `(userId, displayName, date, onlineMinutes) => void`
- **Purpose:** Save online time for a specific date
- **Parameters:**
  - `userId`: Discord user ID
  - `displayName`: User's display name
  - `date`: YYYY-MM-DD format
  - `onlineMinutes`: Online minutes for that day

**`getDailySnapshot(userId, date)`**
- **Type:** `(userId, date) => DailySnapshot | null`
- **Purpose:** Get daily snapshot for user and date

**`generateDailySnapshot(userId, date)`**
- **Type:** `async (userId, date) => Promise<boolean>`
- **Purpose:** Calculate and save daily snapshot
- **Actions:** Queries all sessions for date, calculates totals

**`generateAllDailySnapshots(date)`**
- **Type:** `async (date) => Promise<number>`
- **Purpose:** Generate snapshots for all active users on date
- **Returns:** Count of successfully generated snapshots

##### Session Status

**`getActiveSessionsCount()`**
- **Type:** `() => { users, gameSessions, voiceSessions, spotifySessions }`
- **Purpose:** Get count of active sessions
- **Returns:** Breakdown of active sessions by type

**`getActiveUsers()`**
- **Type:** `() => UserActivity[]`
- **Purpose:** Get all active user activity objects

**`getUserActivity(userId)`**
- **Type:** `(userId) => UserActivity | undefined`
- **Purpose:** Get activity for specific user

**`forceEndAllActiveSessions(userId)`**
- **Type:** `(userId) => void`
- **Purpose:** Force end all sessions for a user (cleanup)

##### Maintenance

**`updateActiveSessionsProgress()`**
- **Type:** `() => void`
- **Purpose:** Update duration on all active sessions
- **Frequency:** Called every minute
- **Actions:** Recalculates duration, updates user stats immediately

**`validateActiveSessionsWithPresence()`**
- **Type:** `() => void`
- **Purpose:** Verify active sessions match Discord state
- **Actions:** Ends orphaned sessions

**`fixInconsistentTimestamps()`**
- **Type:** `() => void`
- **Purpose:** Mark old active sessions as stale
- **Threshold:** Sessions older than 1 hour

**`resetInMemoryTracking()`**
- **Type:** `() => void`
- **Purpose:** Clear active user cache (for daily reset)

**`cleanupStaleSessions(staleMinutes?)`**
- **Type:** `(staleMinutes?) => void`
- **Purpose:** Legacy method (no-op, uses real-time validation)

##### Health & Debug

**`healthCheck()`**
- **Type:** `() => HealthCheckResult`
- **Purpose:** Check service and database health
- **Returns:** Status information

---

## SQL Query Examples

### Common Query Patterns

#### 1. User Statistics

**Get total game time for user today**
```sql
SELECT user_id, daily_games_minutes, daily_games_played
FROM user_stats
WHERE user_id = 'user123';
```

**Get all users sorted by activity**
```sql
SELECT user_id, daily_online_minutes, monthly_online_minutes
FROM user_stats
ORDER BY daily_online_minutes DESC
LIMIT 10;
```

**Check if user needs daily reset**
```sql
SELECT user_id, last_daily_reset,
       (strftime('%s', 'now') - strftime('%s', last_daily_reset)) / 3600 AS hours_since_reset
FROM user_stats
WHERE hours_since_reset > 24;
```

#### 2. Session Queries

**Get user's game history for a date**
```sql
SELECT game_name, COUNT(*) as sessions, SUM(duration_minutes) as total_minutes
FROM game_sessions
WHERE user_id = 'user123'
  AND DATE(start_time) = '2025-11-30'
GROUP BY game_name
ORDER BY total_minutes DESC;
```

**Most played games across all users**
```sql
SELECT game_name, COUNT(*) as sessions, SUM(duration_minutes) as total_minutes
FROM game_sessions
WHERE status IN ('ended', 'stale')
GROUP BY game_name
ORDER BY total_minutes DESC
LIMIT 20;
```

**Voice channel usage statistics**
```sql
SELECT channel_name, COUNT(*) as sessions,
       SUM(duration_minutes) as total_minutes,
       SUM(screen_share_minutes) as streaming_minutes
FROM voice_sessions
WHERE DATE(start_time) = '2025-11-30'
GROUP BY channel_name
ORDER BY total_minutes DESC;
```

**Spotify listening statistics**
```sql
SELECT artist, COUNT(*) as songs_played,
       SUM(duration_minutes) as total_minutes
FROM spotify_sessions
WHERE user_id = 'user123'
  AND DATE(start_time) >= DATE('now', '-30 days')
GROUP BY artist
ORDER BY total_minutes DESC
LIMIT 20;
```

#### 3. Stale Session Detection

**Find sessions inactive for more than 5 minutes**
```sql
SELECT id, user_id, status,
       CASE
         WHEN status = 'active' THEN 'STALE'
         ELSE status
       END as current_status
FROM game_sessions
WHERE status = 'active'
  AND last_updated < datetime('now', '-5 minutes')
ORDER BY last_updated ASC;
```

**Count stale sessions by type**
```sql
SELECT 'game' as type, COUNT(*) as count
FROM game_sessions
WHERE status = 'active'
  AND last_updated < datetime('now', '-5 minutes')
UNION ALL
SELECT 'voice' as type, COUNT(*) as count
FROM voice_sessions
WHERE status = 'active'
  AND last_updated < datetime('now', '-5 minutes')
UNION ALL
SELECT 'spotify' as type, COUNT(*) as count
FROM spotify_sessions
WHERE status = 'active'
  AND last_updated < datetime('now', '-5 minutes');
```

#### 4. Daily Snapshot Analysis

**Compare daily snapshots over time**
```sql
SELECT date, user_id, online_minutes, voice_minutes,
       games_played, spotify_minutes
FROM daily_snapshots
WHERE user_id = 'user123'
  AND date BETWEEN '2025-11-01' AND '2025-11-30'
ORDER BY date DESC;
```

**Calculate weekly averages**
```sql
SELECT strftime('%Y-W%W', date) as week,
       AVG(online_minutes) as avg_online,
       AVG(voice_minutes) as avg_voice,
       SUM(games_played) as total_games
FROM daily_snapshots
WHERE DATE(date) >= DATE('now', '-90 days')
GROUP BY week
ORDER BY week DESC;
```

**Find most active users by month**
```sql
SELECT user_id,
       SUM(online_minutes) as total_online,
       COUNT(DISTINCT date) as active_days
FROM daily_snapshots
WHERE strftime('%Y-%m', date) = '2025-11'
GROUP BY user_id
ORDER BY total_online DESC;
```

#### 5. Data Retention

**Find old data to clean up**
```sql
SELECT 'game_sessions' as table_name, COUNT(*) as count
FROM game_sessions
WHERE DATE(start_time) < DATE('now', '-365 days')
UNION ALL
SELECT 'voice_sessions', COUNT(*)
FROM voice_sessions
WHERE DATE(start_time) < DATE('now', '-365 days')
UNION ALL
SELECT 'spotify_sessions', COUNT(*)
FROM spotify_sessions
WHERE DATE(start_time) < DATE('now', '-365 days')
UNION ALL
SELECT 'daily_snapshots', COUNT(*)
FROM daily_snapshots
WHERE date < DATE('now', '-365 days');
```

**Archive old snapshots before deletion**
```sql
INSERT INTO daily_snapshots_archive
SELECT * FROM daily_snapshots
WHERE date < DATE('now', '-365 days');

DELETE FROM daily_snapshots
WHERE date < DATE('now', '-365 days');
```

#### 6. Performance Analysis

**Sessions created per hour**
```sql
SELECT strftime('%Y-%m-%d %H:00', created_at) as hour,
       'game' as type, COUNT(*) as count
FROM game_sessions
GROUP BY hour
ORDER BY hour DESC;
```

**Average session duration by game**
```sql
SELECT game_name,
       COUNT(*) as sessions,
       AVG(duration_minutes) as avg_duration,
       MIN(duration_minutes) as min_duration,
       MAX(duration_minutes) as max_duration
FROM game_sessions
WHERE status IN ('ended', 'stale')
GROUP BY game_name
HAVING sessions > 10
ORDER BY avg_duration DESC;
```

**Concurrent users at any time**
```sql
SELECT MAX(concurrent) as max_concurrent,
       AVG(concurrent) as avg_concurrent
FROM (
  SELECT strftime('%Y-%m-%d %H:%M', created_at) as minute,
         COUNT(DISTINCT user_id) as concurrent
  FROM (
    SELECT user_id, start_time as created_at FROM game_sessions
    UNION ALL
    SELECT user_id, start_time FROM voice_sessions
    UNION ALL
    SELECT user_id, start_time FROM spotify_sessions
  )
  WHERE created_at >= datetime('now', '-24 hours')
  GROUP BY minute
);
```

---

## Troubleshooting

### Common Issues

#### Issue: Sessions not closing properly

**Symptoms:**
- `status = 'active'` for sessions that should be ended
- User stats not updating
- `duration_minutes = 0` for old sessions

**Diagnosis:**
```sql
-- Check for old active sessions
SELECT id, user_id, status, last_updated,
       datetime('now') as current_time,
       (julianday('now') - julianday(last_updated)) * 24 * 60 as minutes_since_update
FROM game_sessions
WHERE status = 'active'
  AND last_updated < datetime('now', '-5 minutes')
ORDER BY last_updated ASC;
```

**Solutions:**

1. **Run session validator**
   ```typescript
   analyticsService.validateActiveSessionsWithPresence();
   ```

2. **Fix inconsistent timestamps**
   ```typescript
   analyticsService.fixInconsistentTimestamps();
   ```

3. **Manual cleanup (if necessary)**
   ```sql
   UPDATE game_sessions
   SET status = 'stale', end_time = last_updated
   WHERE status = 'active'
     AND last_updated < datetime('now', '-1 hour');
   ```

#### Issue: Statistics not updating

**Symptoms:**
- `user_stats` showing 0 or stale values
- User stats not reflecting current sessions

**Diagnosis:**
```sql
-- Check user stats
SELECT user_id, daily_online_minutes, daily_games_minutes,
       last_daily_reset, updated_at
FROM user_stats
WHERE user_id = 'user123';

-- Check active sessions
SELECT COUNT(*) FROM game_sessions
WHERE user_id = 'user123' AND status = 'active';
```

**Solutions:**

1. **Force update user stats**
   ```typescript
   // If game session just ended
   analyticsService['updateGameTimeImmediately']('user123');

   // If voice session just ended
   analyticsService['updateVoiceTimeImmediately']('user123');
   ```

2. **Verify reset tracking**
   ```sql
   -- Check reset time
   SELECT last_daily_reset FROM user_stats WHERE user_id = 'user123';

   -- Count sessions since reset
   SELECT COUNT(*) FROM game_sessions
   WHERE user_id = 'user123'
     AND start_time > (
       SELECT last_daily_reset FROM user_stats WHERE user_id = 'user123'
     )
     AND status IN ('active', 'ended');
   ```

#### Issue: Duplicate sessions after bot restart

**Symptoms:**
- Multiple sessions for same activity
- Same game/voice channel appearing multiple times

**Diagnosis:**
```sql
-- Find duplicate recent sessions
SELECT user_id, game_name, COUNT(*) as count
FROM game_sessions
WHERE status = 'active'
  AND created_at > datetime('now', '-5 minutes')
GROUP BY user_id, game_name
HAVING count > 1;
```

**Solutions:**

1. **Recovery clears duplicates**
   - `recoverExistingSessions()` ends all active sessions first
   - Prevents duplicates on subsequent recovery

2. **Manual cleanup if needed**
   ```sql
   -- Keep only most recent session per user
   DELETE FROM game_sessions
   WHERE id NOT IN (
     SELECT MAX(id)
     FROM game_sessions
     WHERE status = 'active'
     GROUP BY user_id
   ) AND status = 'active';
   ```

#### Issue: Timestamp format inconsistencies

**Symptoms:**
- Parsing errors in logs
- Duration calculations wrong
- Stale detection failing

**Diagnosis:**
```sql
-- Check timestamp formats
SELECT DISTINCT
  CASE
    WHEN start_time LIKE '%Z' THEN 'ISO with Z'
    WHEN start_time LIKE '%+%' THEN 'ISO with +offset'
    WHEN start_time LIKE '____-__-__ __:__:__' THEN 'SQLite format'
    ELSE 'Unknown'
  END as format
FROM game_sessions
LIMIT 1;
```

**Solutions:**

1. **Run timestamp fixer**
   ```typescript
   analyticsService.fixInconsistentTimestamps();
   ```

2. **Convert all timestamps to ISO format**
   ```sql
   -- One-time fix for old data
   UPDATE game_sessions
   SET start_time = datetime(start_time),
       end_time = datetime(end_time)
   WHERE start_time NOT LIKE '%Z';
   ```

#### Issue: Database locked errors

**Symptoms:**
- "database is locked" errors in logs
- Slow query performance
- Failed inserts/updates

**Diagnosis:**
```sql
-- Check for long-running transactions
PRAGMA integrity_check;

-- Check WAL mode status
PRAGMA journal_mode;
```

**Solutions:**

1. **Enable WAL mode (if not already)**
   ```sql
   PRAGMA journal_mode = WAL;
   PRAGMA synchronous = NORMAL;
   ```

2. **Increase cache size**
   ```sql
   PRAGMA cache_size = 20000;
   ```

3. **Restart database connection**
   ```typescript
   // Graceful shutdown
   shutdownAnalytics();

   // Reinitialize
   initializeAnalytics();
   ```

#### Issue: Memory usage growing continuously

**Symptoms:**
- Process memory increases over time
- No plateau in memory usage
- Server becomes slower

**Likely Cause:** Active user cache growing unbounded

**Diagnosis:**
```typescript
// Check active users count
const session = analyticsService.getActiveSessionsCount();
console.log(`Active users: ${session.users}`);
```

**Solutions:**

1. **Clear inactive users**
   ```typescript
   // Daily maintenance
   analyticsService.resetInMemoryTracking();
   ```

2. **Validate and cleanup**
   ```typescript
   analyticsService.validateActiveSessionsWithPresence();
   ```

3. **Check for memory leaks**
   - Verify Discord bot properly closes connections
   - Check for circular references in UserActivity objects

### Performance Tuning

#### Slow Query Performance

**Check query execution times:**
```typescript
// Enable EXPLAIN output
const db = getAnalyticsDatabase().getDatabase();
db.prepare('EXPLAIN QUERY PLAN SELECT ...').all();
```

**Index optimization:**
```sql
-- Verify all indexes exist
PRAGMA index_list(game_sessions);

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_game_sessions_status_user
ON game_sessions(status, user_id);
```

#### High Database Write Volume

**If seeing many writes:**

1. **Check update frequency** - Progress updates every minute
   ```typescript
   // Could batch updates
   updateActiveSessionsProgress();  // Once per minute
   ```

2. **Use transaction batching**
   ```typescript
   const transaction = db.transaction(() => {
     // Multiple updates inside transaction
     updateGameSessionProgress(id1, duration1);
     updateGameSessionProgress(id2, duration2);
   });
   transaction();  // Executes all at once
   ```

3. **Monitor active sessions**
   ```sql
   SELECT COUNT(*) as active_count FROM game_sessions WHERE status = 'active';
   ```

### Debug Commands

**Enable verbose logging:**
```typescript
// Add to service code
console.log(`DEBUG: Updating session ${sessionId} with duration ${durationMinutes}`);
```

**Export analytics data:**
```typescript
const db = getAnalyticsDatabase();
const stats = db.getAllUserStats();
console.log(JSON.stringify(stats, null, 2));
```

**Check database integrity:**
```typescript
const health = db.healthCheck();
console.log(health);
```

---

## Performance Optimization

### WAL Mode Configuration

SQLite Write-Ahead Logging (WAL) mode enabled by default:

```typescript
// In database.ts setupPerformanceOptimizations()
this.db.pragma('journal_mode = WAL');      // Better concurrency
this.db.pragma('synchronous = NORMAL');    // Fast but safe
this.db.pragma('cache_size = 10000');      // Larger cache
this.db.pragma('temp_store = MEMORY');     // Faster temp storage
```

### Index Strategy

Indexes created for common query patterns:

```sql
-- Reset tracking (daily maintenance queries)
CREATE INDEX idx_user_stats_daily_reset ON user_stats(last_daily_reset);
CREATE INDEX idx_user_stats_monthly_reset ON user_stats(last_monthly_reset);

-- Status-based queries (stale detection, cleanup)
CREATE INDEX idx_game_sessions_status ON game_sessions(status);
CREATE INDEX idx_voice_sessions_status ON voice_sessions(status);
CREATE INDEX idx_spotify_sessions_status ON spotify_sessions(status);

-- Time-based queries (progress updates, stale detection)
CREATE INDEX idx_game_sessions_last_updated ON game_sessions(last_updated);
CREATE INDEX idx_voice_sessions_last_updated ON voice_sessions(last_updated);
CREATE INDEX idx_spotify_sessions_last_updated ON spotify_sessions(last_updated);

-- User-specific queries (history, stats)
CREATE INDEX idx_game_sessions_user ON game_sessions(user_id);
CREATE INDEX idx_voice_sessions_user ON voice_sessions(user_id);
CREATE INDEX idx_spotify_sessions_user ON spotify_sessions(user_id);

-- Reporting queries
CREATE INDEX idx_daily_snapshots_date ON daily_snapshots(date);
CREATE INDEX idx_daily_snapshots_user_date ON daily_snapshots(user_id, date);
```

### Data Cleanup Strategy

**Retention policy:** 365 days by default

```typescript
// Periodic cleanup (recommend monthly)
const retention = db.getDataRetentionInfo(365);
console.log(`Records older than 365 days: ${retention.oldData.gameSessions}`);

// Delete old data
const result = db.cleanupOldData(365);
console.log(`Deleted ${result.deletedRecords.gameSessions} game sessions`);
```

### Singleton Pattern Benefits

```typescript
// Single database instance across application
const db1 = getAnalyticsDatabase();
const db2 = getAnalyticsDatabase();
console.log(db1 === db2);  // true - same instance
```

Benefits:
- Single database connection
- Shared connection pool
- Consistent state
- Memory efficient

---

## Appendix: Type Definitions

### DailySnapshot Interface

```typescript
export interface DailySnapshot {
  user_id: string;
  date: string;                    // YYYY-MM-DD format
  online_minutes: number;
  voice_minutes: number;
  games_played: number;
  spotify_minutes: number;
  created_at: string;              // ISO 8601 UTC
}
```

### UserStats Interface

```typescript
export interface UserStats {
  user_id: string;
  daily_online_minutes: number;
  daily_voice_minutes: number;
  daily_games_played: number;
  daily_games_minutes: number;
  daily_spotify_minutes: number;
  daily_spotify_songs: number;
  daily_streaming_minutes: number;
  monthly_online_minutes: number;
  monthly_voice_minutes: number;
  monthly_games_played: number;
  monthly_games_minutes: number;
  monthly_spotify_minutes: number;
  monthly_spotify_songs: number;
  monthly_streaming_minutes: number;
  last_daily_reset: string;
  last_monthly_reset: string;
  created_at: string;
  updated_at: string;
}
```

### GameSession Interface

```typescript
export interface GameSession {
  id?: number;
  user_id: string;
  game_name: string;
  start_time: string;              // ISO 8601 UTC
  end_time: string | null;
  duration_minutes: number;
  last_updated: string;            // ISO 8601 UTC
  status: 'active' | 'ended' | 'stale';
  created_at: string;
}
```

### VoiceSession Interface

```typescript
export interface VoiceSession {
  id?: number;
  user_id: string;
  channel_id: string;
  channel_name: string;
  start_time: string;              // ISO 8601 UTC
  end_time: string | null;
  duration_minutes: number;
  screen_share_minutes: number;
  last_updated: string;            // ISO 8601 UTC
  status: 'active' | 'ended' | 'stale';
  created_at: string;
}
```

### SpotifySession Interface

```typescript
export interface SpotifySession {
  id?: number;
  user_id: string;
  track_name: string;
  artist: string;
  start_time: string;              // ISO 8601 UTC
  end_time: string | null;
  duration_minutes: number;
  last_updated: string;            // ISO 8601 UTC
  status: 'active' | 'ended' | 'stale';
  created_at: string;
}
```

### UserActivity Interface

```typescript
export interface UserActivity {
  userId: string;
  displayName: string;
  currentStatus: 'online' | 'idle' | 'dnd' | 'offline';
  currentGame?: string;
  currentSpotify?: { track: string; artist: string };
  isInVoice: boolean;
  isStreaming: boolean;
  voiceChannelId?: string;
  voiceChannelName?: string;
  sessionStartTime?: Date;
  gameSessionId?: number;
  voiceSessionId?: number;
  spotifySessionId?: number;
  streamingStartTime?: Date;
  totalStreamingMinutes?: number;
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-30 | Initial comprehensive documentation |

---

## Related Files

- `database.ts` - SQLite database implementation (892 lines)
- `service.ts` - Analytics service with session management (1254 lines)
- `index.ts` - System initialization and exports (74 lines)

## Document Metadata

- **Repository:** Komplexáci Discord Community Bot
- **Technology Stack:** Node.js, TypeScript, SQLite, better-sqlite3, discord.js
- **Audience:** Backend developers, DevOps, data analysts
- **Maintenance:** This document should be updated with each feature change
