# Server-Side Library Documentation

## Overview

The `src/lib/` directory contains server-side utilities and services for the Komplexaci Next.js 15 gaming community website. This library layer provides core infrastructure for Discord integration, analytics tracking, database access, and utility functions.

**Key Technologies:**
- Next.js 15.3.3 with App Router (server-side only)
- Discord.js for real-time Discord Gateway integration
- better-sqlite3 for local analytics database
- Supabase for primary data storage
- TypeScript for type safety

## Architecture

### Module Organization

```
src/lib/
├── analytics/              # Analytics subsystem
│   ├── index.ts           # Entry point and initialization
│   ├── database.ts        # SQLite database layer
│   └── service.ts         # Analytics tracking service
├── discord-gateway.ts     # Discord WebSocket service (singleton)
├── discord-startup.ts     # Gateway initialization
├── discord-avatar-utils.ts # Avatar URL utilities
└── supabase.ts            # Supabase client configuration
```

### Design Patterns

**Singleton Pattern**: Used extensively for stateful services to ensure single instances across the application:
- `DiscordGatewayService` - Maintains WebSocket connection and member cache
- `AnalyticsService` - Tracks user activity and session state
- `AnalyticsDatabase` - Manages SQLite database connection

**Lazy Initialization**: All singletons use getter functions that create instances on first access.

---

## Core Modules

### 1. Discord Gateway Service

**File**: `discord-gateway.ts`

The Discord Gateway Service maintains a persistent WebSocket connection to Discord, providing real-time presence, activity, and voice state tracking.

#### Key Classes

**`DiscordGatewayService`** - Main service class (singleton)

**Public API:**

```typescript
// Access singleton instance
const gateway = getDiscordGateway();

// Connection management
gateway.connect(): Promise<void>
gateway.isReady(): boolean

// Server information
gateway.getServerStats(): ServerStats | null
gateway.getGuild(): Guild | undefined

// Member data
gateway.getOnlineMembers(): CachedMember[]
gateway.getAllMembers(): CachedMember[]
gateway.getMostActiveMembers(limit?: number): CachedMember[]
gateway.getMemberCount(): number
gateway.getOnlineCount(): number

// Daily reset operations
gateway.triggerDailyReset(): Promise<void>
gateway.resetInMemoryCache(): void
gateway.resetDailyOnlineTimeOnly(): number
gateway.forceSaveDailyStats(): number
```

#### Data Structures

**`CachedMember`** - Enriched member data with analytics:

```typescript
interface CachedMember {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  status: string; // 'online' | 'idle' | 'dnd' | 'offline'
  activities: Activity[];
  voice: {
    channel: { id: string; name: string } | null;
    streaming: boolean;
    selfMute: boolean;
    selfDeaf: boolean;
  } | null;
  roles: string[];
  joinedAt: string | null;
  lastSeen: Date;
  dailyOnlineTime: number; // Minutes online today
  lastDailyReset: Date;
  sessionStartTime: Date | null;
}
```

**`ServerStats`** - Discord server metadata:

```typescript
interface ServerStats {
  name: string;
  memberCount: number;
  onlineCount: number;
  icon: string | null;
  description: string;
  features: string[];
  boostLevel: number;
  boostCount: number;
  verificationLevel: number;
  onlineMembers: CachedMember[];
  lastUpdated: Date;
}
```

#### Features

1. **Real-time Presence Tracking**: Monitors user online/offline status with minute-level precision
2. **Daily Online Time**: Tracks accumulated online minutes per user, resets at midnight Czech time
3. **Voice State Monitoring**: Detects voice channel joins/leaves and screen sharing
4. **Activity Detection**: Captures gaming, Spotify, and custom status activities
5. **Session Management**: Integrates with analytics service for comprehensive session tracking
6. **Automatic Recovery**: Recovers existing sessions on startup by querying Discord's real-time state

#### Usage Example

From `src/app/api/discord/server-stats/route.ts`:

```typescript
import { getDiscordGateway } from '@/lib/discord-gateway';
import { initializeDiscordGateway } from '@/lib/discord-startup';

export async function GET() {
  // Initialize if needed
  await initializeDiscordGateway();

  const gateway = getDiscordGateway();

  // Wait for gateway to be ready
  const maxWaitTime = 3000;
  const startTime = Date.now();
  while (!gateway.isReady() && (Date.now() - startTime) < maxWaitTime) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  if (gateway.isReady()) {
    const stats = gateway.getServerStats();
    const onlineMembers = gateway.getOnlineMembers();

    return Response.json({
      ...stats,
      onlineMembers: onlineMembers.map(member => ({
        id: member.id,
        displayName: member.displayName,
        status: member.status,
        activity: member.activities[0],
        dailyOnlineTime: member.dailyOnlineTime
      }))
    });
  }

  // Fallback to REST API if gateway unavailable
  // ...
}
```

---

### 2. Discord Startup Module

**File**: `discord-startup.ts`

Handles initialization and auto-connection of the Discord Gateway Service.

#### API

```typescript
// Initialize Discord Gateway (server-side only)
await initializeDiscordGateway();
```

#### Behavior

- Only initializes on server-side (checks for `window` object)
- Auto-initializes when module is imported in production or when `ENABLE_DISCORD_GATEWAY=true`
- Prevents duplicate initialization with internal flag
- Falls back gracefully if initialization fails

---

### 3. Discord Avatar Utilities

**File**: `discord-avatar-utils.ts`

Utility functions for generating Discord avatar URLs with proper format detection.

#### API

```typescript
// Check if avatar is animated (GIF)
isAnimatedAvatar(avatarHash: string | null): boolean

// Get custom avatar URL
getDiscordAvatarUrl(
  userId: string,
  avatarHash: string | null,
  size?: number
): string | null

// Get default avatar URL
getDefaultDiscordAvatarUrl(
  userId: string,
  discriminator?: string
): string

// Get best available avatar (custom or default)
getBestDiscordAvatarUrl(
  userId: string,
  avatarHash: string | null,
  discriminator?: string,
  size?: number
): string
```

#### Features

- Automatic animated avatar detection (GIF vs PNG)
- Size validation (16-4096 pixels)
- Discriminator-aware default avatars (legacy vs new username system)
- CDN URL construction for optimal performance

#### Usage Example

```typescript
import { getBestDiscordAvatarUrl } from '@/lib/discord-avatar-utils';

const member = guild.members.cache.get(userId);
const avatarUrl = getBestDiscordAvatarUrl(
  member.id,
  member.user.avatar,
  member.user.discriminator,
  128 // 128x128 pixels
);
```

---

### 4. Supabase Client

**File**: `supabase.ts`

Provides Supabase client instances for database operations and type definitions for database schema.

#### API

```typescript
// Regular client (respects RLS policies)
import { supabase } from '@/lib/supabase';

// Admin client (bypasses RLS)
import { supabaseAdmin } from '@/lib/supabase';
```

#### Database Types

**`Profile`** - User profile data:

```typescript
interface Profile {
  id: string;
  discord_id: string;
  username: string;
  discriminator?: string;
  global_name?: string;
  avatar_url?: string;
  email?: string;
  role: 'admin' | 'moderator' | 'member' | 'guest';
  permissions: string[];
  joined_at: string;
  last_login_at: string;
  is_active: boolean;
}
```

**`Track`** - Music track metadata:

```typescript
interface Track {
  id: string;
  title: string;
  artist: string;
  file_url: string;
  file_path?: string;
  uploaded_by: string;
  uploader?: Profile;
  tags: string[];
  duration?: number;
  is_approved: boolean;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}
```

**`Playlist`** - Music playlists:

```typescript
interface Playlist {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  creator?: Profile;
  tracks: string[]; // Array of track IDs
  is_public: boolean;
  created_at: string;
  updated_at: string;
}
```

#### Permission System

```typescript
// Role-based permissions
const ROLES = {
  guest: ['site:view', 'music:view'],
  member: ['site:view', 'music:view', 'music:upload', 'music:favorite',
           'comments:create', 'comments:edit'],
  moderator: [...member, 'music:edit', 'music:approve', 'comments:moderate',
              'users:view'],
  admin: ['admin:full'] // All permissions
};

// Check permission
import { hasPermission } from '@/lib/supabase';

if (hasPermission(user.role, user.permissions, 'music:upload')) {
  // Allow upload
}
```

---

## Analytics System

The analytics subsystem tracks user activity across Discord, providing insights into online time, gaming sessions, voice usage, and Spotify listening habits.

### 5. Analytics Index

**File**: `analytics/index.ts`

Entry point for the analytics system with initialization and shutdown utilities.

#### API

```typescript
// Initialize analytics system
const { database, analytics } = initializeAnalytics();

// Graceful shutdown
shutdownAnalytics();

// Access services
import { getAnalyticsDatabase, getAnalyticsService } from '@/lib/analytics';
```

#### Exported Types

```typescript
export type {
  DailySnapshot,
  GameSession,
  VoiceSession,
  SpotifySession,
  UserActivity
};
```

---

### 6. Analytics Database

**File**: `analytics/database.ts`

SQLite database layer for analytics data persistence using better-sqlite3.

#### Features

- **WAL mode** for better concurrent performance
- **Automatic migrations** for schema updates
- **Comprehensive indexing** for query optimization
- **Data retention management** with configurable periods
- **Transaction support** for atomic operations

#### Database Schema

**`daily_snapshots`** - Historical daily activity:
```sql
CREATE TABLE daily_snapshots (
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,              -- YYYY-MM-DD
  online_minutes INTEGER DEFAULT 0,
  voice_minutes INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  spotify_minutes INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, date)
);
```

**`user_stats`** - Real-time and monthly aggregates:
```sql
CREATE TABLE user_stats (
  user_id TEXT PRIMARY KEY,
  daily_online_minutes INTEGER DEFAULT 0,
  daily_voice_minutes INTEGER DEFAULT 0,
  daily_games_played INTEGER DEFAULT 0,
  daily_games_minutes INTEGER DEFAULT 0,
  daily_spotify_minutes INTEGER DEFAULT 0,
  daily_spotify_songs INTEGER DEFAULT 0,
  daily_streaming_minutes INTEGER DEFAULT 0,
  monthly_online_minutes INTEGER DEFAULT 0,
  monthly_voice_minutes INTEGER DEFAULT 0,
  monthly_games_played INTEGER DEFAULT 0,
  monthly_games_minutes INTEGER DEFAULT 0,
  monthly_spotify_minutes INTEGER DEFAULT 0,
  monthly_spotify_songs INTEGER DEFAULT 0,
  monthly_streaming_minutes INTEGER DEFAULT 0,
  last_daily_reset TEXT DEFAULT CURRENT_TIMESTAMP,
  last_monthly_reset TEXT DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**`game_sessions`** - Gaming activity tracking:
```sql
CREATE TABLE game_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  game_name TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  duration_minutes INTEGER DEFAULT 0,
  last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active',    -- 'active' | 'ended' | 'stale'
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**`voice_sessions`** - Voice channel usage:
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
```

**`spotify_sessions`** - Music listening history:
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
```

#### Public API

**Database Access:**

```typescript
const db = getAnalyticsDatabase();

// Direct database access (use carefully)
db.getDatabase(): Database.Database

// Health check
db.healthCheck(): { status: 'healthy' | 'error', details: any }

// Close connection
db.close(): void
```

**Daily Snapshots:**

```typescript
// Create or update snapshot
db.upsertDailySnapshot(snapshot: Omit<DailySnapshot, 'created_at'>)

// Retrieve snapshots
db.getDailySnapshot(userId: string, date: string): DailySnapshot | null
db.getDailySnapshots(userId?: string, startDate?: string, endDate?: string): DailySnapshot[]
```

**Game Sessions:**

```typescript
db.insertGameSession(session: Omit<GameSession, 'id' | 'created_at'>)
db.getGameSession(id: number): GameSession | null
db.updateGameSession(id: number, endTime: string, durationMinutes: number)
db.updateGameSessionProgress(id: number, durationMinutes: number)
db.getActiveGameSessions(userId?: string): GameSession[]
db.getStaleGameSessions(staleMinutes?: number): GameSession[]
db.markGameSessionAsStale(id: number, endTime: string, durationMinutes: number)
```

**Voice Sessions:**

```typescript
db.insertVoiceSession(session: Omit<VoiceSession, 'id' | 'created_at'>)
db.updateVoiceSession(id: number, endTime: string, durationMinutes: number, screenShareMinutes: number)
db.updateVoiceSessionProgress(id: number, durationMinutes: number, screenShareMinutes: number)
db.getActiveVoiceSessions(userId?: string): VoiceSession[]
db.getStaleVoiceSessions(staleMinutes?: number): VoiceSession[]
db.markVoiceSessionAsStale(id: number, endTime: string, durationMinutes: number, screenShareMinutes: number)
```

**Spotify Sessions:**

```typescript
db.insertSpotifySession(session: Omit<SpotifySession, 'id' | 'created_at'>)
db.updateSpotifySession(id: number, endTime: string, durationMinutes: number)
db.updateSpotifySessionProgress(id: number, durationMinutes: number)
db.getActiveSpotifySessions(userId?: string): SpotifySession[]
db.getStaleSpotifySessions(staleMinutes?: number): SpotifySession[]
db.markSpotifySessionAsStale(id: number, endTime: string, durationMinutes: number)
```

**User Stats:**

```typescript
db.upsertUserStats(stats: Omit<UserStats, 'created_at' | 'updated_at'>)
db.getUserStats(userId: string): UserStats | null
db.getAllUserStats(): UserStats[]
db.resetDailyStats(userId?: string)
db.resetMonthlyStats(userId?: string)
```

**Data Retention:**

```typescript
// Get retention information
db.getDataRetentionInfo(retentionDays: number = 365)

// Clean up old data
db.cleanupOldData(retentionDays: number)

// Get current day data
db.getCurrentDayData(date?: string)
```

#### Usage Example

From `src/app/api/analytics/status/route.ts`:

```typescript
import { getAnalyticsDatabase } from '@/lib/analytics/database';

export async function GET() {
  const db = getAnalyticsDatabase();
  const database = db.getDatabase();

  // Get current data counts
  const counts = {
    dailySnapshots: database.prepare(
      'SELECT COUNT(*) as count FROM daily_snapshots'
    ).get(),
    gameSessions: database.prepare(
      'SELECT COUNT(*) as count FROM game_sessions'
    ).get()
  };

  // Get today's data
  const today = new Date().toISOString().split('T')[0];
  const todaysData = db.getCurrentDayData(today);

  return Response.json({
    totalRecords: counts,
    today: todaysData
  });
}
```

---

### 7. Analytics Service

**File**: `analytics/service.ts`

High-level service for tracking user activity and managing analytics sessions.

#### Core Responsibilities

1. **Session Management**: Creates, updates, and ends sessions for games, voice, and Spotify
2. **Real-time Updates**: Updates active sessions every minute with current progress
3. **Presence Tracking**: Monitors user online/offline status changes
4. **Session Recovery**: Recreates sessions on startup based on Discord's current state
5. **Data Consistency**: Validates sessions against real-time Discord presence

#### Data Structures

**`UserActivity`** - In-memory user state:

```typescript
interface UserActivity {
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

#### Public API

**Activity Tracking:**

```typescript
const service = getAnalyticsService();

// Update user presence
service.updateUserPresence(
  userId: string,
  displayName: string,
  status: 'online' | 'idle' | 'dnd' | 'offline',
  activities: any[],
  timestamp?: Date
): void

// Update voice state
service.updateUserVoiceState(
  userId: string,
  channelId: string | null,
  channelName: string | null,
  isStreaming: boolean = false
): void

// Update streaming status
service.updateStreamingStatus(userId: string, isStreaming: boolean): void
```

**Session Management:**

```typescript
// Session recovery on startup
service.recoverExistingSessions(discordGuild: any): void

// Periodic session updates (called every minute)
service.updateActiveSessionsProgress(): void

// Validate sessions against Discord presence
service.validateActiveSessionsWithPresence(): void

// Force end all sessions for a user
service.forceEndAllActiveSessions(userId: string): void
```

**Data Access:**

```typescript
// Get active users
service.getActiveUsers(): UserActivity[]

// Get specific user activity
service.getUserActivity(userId: string): UserActivity | undefined

// Get active sessions count
service.getActiveSessionsCount(): {
  users: number,
  gameSessions: number,
  voiceSessions: number,
  spotifySessions: number
}
```

**Daily Snapshots:**

```typescript
// Save daily online time from Discord Gateway
service.saveDailyOnlineTime(
  userId: string,
  displayName: string,
  date: string,
  onlineMinutes: number
): void

// Get daily snapshot
service.getDailySnapshot(userId: string, date: string): DailySnapshot | null

// Generate daily snapshots
service.generateDailySnapshot(userId: string, date: string): Promise<boolean>
service.generateAllDailySnapshots(date: string): Promise<number>
```

**System Management:**

```typescript
// Fix inconsistent timestamps (one-time migration)
service.fixInconsistentTimestamps(): void

// Reset in-memory tracking
service.resetInMemoryTracking(): void

// Health check
service.healthCheck(): { activeUsers: number, database: any }
```

#### Game Name Normalization

The service normalizes game names for better analytics:

```typescript
// Example mappings:
'League of Legends (TM) Client' → 'League of Legends'
'CS2' → 'Counter-Strike 2'
'Grand Theft Auto V' → 'GTA V'
```

#### Session Lifecycle

**Game Session:**
1. User starts playing → `startGameSession()`
2. Every minute → `updateGameSessionProgress()`
3. User stops playing → `endGameSession()`
4. Immediate update to `user_stats` table

**Voice Session:**
1. User joins voice channel → `startVoiceSession()`
2. Every minute → `updateVoiceSessionProgress()`
3. User starts/stops streaming → tracked in `totalStreamingMinutes`
4. User leaves voice → `endVoiceSession()`
5. Immediate update to `user_stats` table

**Spotify Session:**
1. User starts listening → `startSpotifySession()`
2. Song count immediately updated in `user_stats`
3. Every minute → `updateSpotifySessionProgress()`
4. Track changes → end old session, start new session
5. User stops listening → `endSpotifySession()`

#### Usage Example

From `src/app/api/analytics/reset-daily/route.ts`:

```typescript
import { getAnalyticsService } from '@/lib/analytics/service';
import { getDiscordGateway } from '@/lib/discord-gateway';

export async function POST() {
  const analyticsService = getAnalyticsService();
  const gateway = getDiscordGateway();

  // Reset in-memory tracking
  analyticsService.resetInMemoryTracking();

  // Recover sessions based on current Discord state
  if (gateway.isReady()) {
    const guild = gateway.getGuild();
    if (guild) {
      analyticsService.recoverExistingSessions(guild);
    }
  }

  return Response.json({
    success: true,
    message: 'Daily reset completed'
  });
}
```

---

## Module Interactions

### Initialization Flow

```
Application Startup
    ↓
discord-startup.ts (auto-import in production)
    ↓
getDiscordGateway() → Creates DiscordGatewayService
    ↓
DiscordGatewayService constructor
    ↓
initializeAnalytics() → Creates AnalyticsDatabase + AnalyticsService
    ↓
setupEventHandlers() → Registers Discord event listeners
    ↓
client.login() → Establishes WebSocket connection
    ↓
'ready' event → initializeCache() + recoverExistingSessions()
    ↓
Periodic updates every 60 seconds:
    - updateDailyOnlineTime()
    - updateActiveSessionsProgress()
    - validateSessionsWithPresence()
```

### Data Flow

**Real-time Activity Tracking:**

```
Discord Event (presence/voice change)
    ↓
DiscordGatewayService event handler
    ↓
updatePresenceCache() / handleVoiceStateUpdate()
    ↓
AnalyticsService.updateUserPresence() / updateUserVoiceState()
    ↓
Start/End/Update sessions in AnalyticsDatabase
    ↓
Immediate update to user_stats table
    ↓
Frontend polls /api/discord/server-stats
```

**Daily Reset Cycle:**

```
Midnight Czech Time (or manual API call)
    ↓
/api/analytics/reset-daily
    ↓
Create historical snapshots in daily_snapshots
    ↓
Reset daily counters in user_stats
    ↓
End all active sessions
    ↓
Clear today's session history
    ↓
DiscordGatewayService.resetDailyOnlineTimeOnly()
    ↓
AnalyticsService.recoverExistingSessions()
    ↓
Fresh start with current Discord state
```

---

## Environment Variables

Required environment variables for library modules:

```bash
# Discord Integration
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_SERVER_ID=your_server_id_here
ENABLE_DISCORD_GATEWAY=true  # Optional: enable in development

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Analytics
ANALYTICS_DATA_DIR=./data  # Optional: default is ./data
```

---

## Best Practices

### Using Singletons

Always use the provided getter functions to access singletons:

```typescript
// CORRECT
const gateway = getDiscordGateway();
const analytics = getAnalyticsService();
const db = getAnalyticsDatabase();

// INCORRECT - Don't instantiate directly
const gateway = new DiscordGatewayService(); // Don't do this!
```

### Server-Side Only

These modules are server-side only. Always check for server environment:

```typescript
// In React Server Components (default in App Router)
import { getDiscordGateway } from '@/lib/discord-gateway';
// Safe to use directly

// In Client Components or shared code
if (typeof window === 'undefined') {
  const { getDiscordGateway } = await import('@/lib/discord-gateway');
  // Use here
}
```

### Error Handling

Services fail gracefully and log errors:

```typescript
const gateway = getDiscordGateway();

// Always check if gateway is ready before using data
if (gateway.isReady()) {
  const stats = gateway.getServerStats();
  // Use stats
} else {
  // Fallback to REST API or cached data
}
```

### Database Transactions

Use transactions for atomic operations:

```typescript
const db = getAnalyticsDatabase();

const transaction = db.getDatabase().transaction(() => {
  db.resetDailyStats();
  db.resetMonthlyStats();
  // Multiple operations execute atomically
});

transaction(); // Execute transaction
```

---

## Performance Considerations

### Discord Gateway

- **Caching**: All member data cached in memory for fast access
- **Debouncing**: Presence updates use built-in Discord.js caching
- **Batch Operations**: Daily stats saved in bulk every minute

### Analytics Database

- **WAL Mode**: Enables concurrent reads during writes
- **Indexing**: Comprehensive indexes on user_id, start_time, status
- **Prepared Statements**: All queries use prepared statements for performance
- **Periodic Cleanup**: Stale sessions cleaned every minute

### Memory Usage

- **Member Cache**: ~1-2 KB per member (100 members = ~200 KB)
- **Active Users Map**: ~500 bytes per active user
- **Database Connection**: Single connection, reused across requests

---

## Troubleshooting

### Gateway Not Connecting

**Symptoms**: `gateway.isReady()` returns `false`

**Solutions**:
1. Check `DISCORD_BOT_TOKEN` is valid
2. Verify bot has necessary intents enabled (Guilds, GuildMembers, GuildPresences, GuildVoiceStates)
3. Check server logs for connection errors
4. Ensure bot is member of specified `DISCORD_SERVER_ID`

### Database Locked Errors

**Symptoms**: "database is locked" errors

**Solutions**:
1. Ensure WAL mode is enabled (should be automatic)
2. Check no other processes are accessing the database file
3. Restart application to close stale connections

### Session Recovery Issues

**Symptoms**: Sessions not recreated after restart

**Solutions**:
1. Wait 8-10 seconds after startup for Discord cache to populate
2. Check console logs for "Session recovery" messages
3. Verify users are actually online in Discord
4. Check retry logic (attempts recovery 3 times)

### Missing Analytics Data

**Symptoms**: User stats showing zeros

**Solutions**:
1. Verify Discord Gateway is connected
2. Check analytics service is receiving presence updates
3. Ensure periodic update interval is running (every 60 seconds)
4. Call `forceSaveDailyStats()` to manually persist data

---

## API Endpoint Reference

Key API routes using these libraries:

**Discord:**
- `GET /api/discord/server-stats` - Real-time server statistics

**Analytics:**
- `GET /api/analytics/status` - System status overview
- `POST /api/analytics/reset-daily` - Trigger daily reset
- `POST /api/analytics/reset-monthly` - Trigger monthly reset
- `GET /api/analytics/export` - Export analytics data
- `POST /api/analytics/cleanup` - Remove old data

**Debug:**
- `GET /api/analytics/debug` - Debug information
- `GET /api/analytics/debug-sessions` - Active sessions
- `GET /api/health` - System health check

---

## Version History

**v2.0.0** - Current (2025)
- Non-destructive daily resets
- Real-time user_stats updates
- Session recovery on startup
- Screen sharing tracking
- Monthly statistics

**v1.0.0** - Initial (2024)
- Basic Discord Gateway integration
- Daily snapshots
- Session tracking

---

## Further Reading

- [Discord.js Documentation](https://discord.js.org/)
- [better-sqlite3 Documentation](https://github.com/WiseLibs/better-sqlite3)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
