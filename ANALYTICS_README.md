# Analytics System Documentation

## Overview

The Komplexaci Discord Analytics System provides real-time tracking of user activities including voice time, game sessions, Spotify listening, and online presence. The system features both daily and monthly reset mechanisms with real-time counter updates.

## Architecture

### Core Components

1. **Discord Gateway Service** (`src/lib/discord-gateway.ts`)
   - Real-time Discord event monitoring
   - Session tracking and progress updates
   - Automatic daily/monthly counter calculations
   - Updates every 60 seconds

2. **Analytics Service** (`src/lib/analytics/service.ts`)
   - Session management (voice, game, Spotify)
   - Session recovery after server restarts
   - Presence validation and cleanup

3. **Analytics Database** (`src/lib/analytics/database.ts`)
   - SQLite database operations
   - User stats management
   - Session data storage

4. **User Analytics API** (`src/app/api/analytics/user/[userId]/route.ts`)
   - Provides user statistics for UI
   - Supports multiple time ranges (daily, monthly, 30d)

## Database Schema

### Main Tables

#### `user_stats`
Primary table for real-time user statistics:
```sql
- user_id: Discord user ID
- daily_online_minutes: Online time today
- daily_voice_minutes: Voice time today  
- daily_games_played: Games played today
- daily_games_minutes: Game time today
- daily_spotify_minutes: Spotify time today
- daily_spotify_songs: Songs played today
- monthly_online_minutes: Online time this month
- monthly_voice_minutes: Voice time this month
- monthly_games_played: Games played this month
- monthly_games_minutes: Game time this month
- monthly_spotify_minutes: Spotify time this month
- monthly_spotify_songs: Songs played this month
- last_daily_reset: Timestamp of last daily reset
- last_monthly_reset: Timestamp of last monthly reset
```

#### Session Tables
- `voice_sessions`: Voice channel activity
- `game_sessions`: Game activity tracking
- `spotify_sessions`: Music listening activity

#### Historical Data
- `daily_snapshots`: Historical daily statistics
- `monthly_snapshots`: Historical monthly statistics

## Reset System

### Daily Reset

**Trigger**: Every day at midnight (Czech time) or manual API call
**Endpoint**: `POST /api/analytics/reset-daily`

**What happens:**
1. **Session Handling**: Active sessions are properly ended (not marked as 'stale')
2. **Counter Reset**: All daily counters in `user_stats` reset to 0
3. **Historical Backup**: Current daily stats saved to `daily_snapshots`
4. **Session Recovery**: Discord Gateway recreates sessions for currently active users
5. **Timestamp Update**: `last_daily_reset` updated for all users

**Key Features:**
- Preserves active sessions by ending them properly
- Automatic session recreation based on current Discord state
- No data loss - historical data preserved in snapshots

### Monthly Reset

**Trigger**: 1st of each month or manual API call
**Endpoint**: `POST /api/analytics/reset-monthly`

**What happens:**
1. **Counter Reset**: All monthly counters in `user_stats` reset to 0
2. **Historical Backup**: Current monthly stats saved to `monthly_snapshots`
3. **Timestamp Update**: `last_monthly_reset` updated for all users
4. **Active Sessions**: Monthly reset does NOT affect active sessions

**Key Features:**
- Calendar month-based (not rolling 30 days)
- Independent from daily reset
- Active sessions continue uninterrupted

## Real-Time Counter System

### Update Frequency
- **Discord Gateway**: Updates every 60 seconds
- **Session Progress**: Updated every minute for active sessions
- **Counter Calculation**: Real-time calculation from session data

### Monthly Counter Logic
Monthly counters are calculated **independently** from daily counters:

```sql
-- Monthly voice time calculation
SELECT SUM(duration_minutes) as total_minutes
FROM voice_sessions
WHERE user_id = ? AND start_time >= last_monthly_reset AND status IN ('active', 'ended')
```

### Update Conditions
The system updates `user_stats` when ANY of these change:
- Daily values (voice, games, spotify)
- Monthly values (voice, games, spotify)
- This ensures monthly counters update even when daily values are stable

## Time Range Support

### Available Time Ranges

1. **`daily`**: Current day only
   - Uses: `daily_*` fields from `user_stats`
   - Resets: Every midnight

2. **`monthly`**: Current calendar month
   - Uses: `monthly_*` fields from `user_stats`
   - Resets: 1st of each month

3. **`30d`**: Rolling 30-day period
   - Uses: Session-based calculations
   - Dynamic: Always last 30 days from current date

### UI Integration
- User modals show monthly stats by default
- Monthly overview uses calendar month logic
- Awards use real-time counters from `user_stats`

## Session Recovery System

### Startup Recovery
When the server starts, the system:

1. **Detects Current State**: Checks Discord for currently active users
2. **Creates Sessions**: Creates new sessions for active users
3. **Backdate Estimation**: Adds 5-minute conservative estimate for pre-restart activity
4. **Prevents Data Loss**: Ensures no activity time is completely lost

### Session Validation
Every minute, the system:
- Validates active sessions against Discord presence
- Ends sessions for users who went offline
- Updates session progress for active users

## API Endpoints

### Reset Endpoints
- `POST /api/analytics/reset-daily` - Trigger daily reset
- `POST /api/analytics/reset-monthly` - Trigger monthly reset

### User Data
- `GET /api/analytics/user/[userId]?timeRange=monthly` - Get user statistics

### Awards
- `GET /api/analytics/awards/daily` - Daily award winners
- `GET /api/analytics/awards/monthly` - Monthly award winners

### Debug/Admin
- `GET /api/analytics/debug` - System debug information
- `GET /api/analytics/status` - System health status
- `POST /api/analytics/recover-sessions` - Manual session recovery

## Cron Job Setup

### Daily Reset (Recommended)
```bash
# Run daily at midnight Czech time
0 0 * * * curl -X POST http://localhost:3000/api/analytics/reset-daily
```

### Monthly Reset (Recommended)
```bash
# Run on 1st of each month at 00:01 Czech time
1 0 1 * * curl -X POST http://localhost:3000/api/analytics/reset-monthly
```

## Troubleshooting

### Common Issues

1. **Voice Time Shows 0**
   - Check if Discord Gateway is running
   - Verify sessions are being created in database
   - Check `monthly_voice_minutes` in `user_stats` table

2. **Sessions Not Recovering After Restart**
   - Check Discord Gateway connection
   - Verify `recoverExistingSessions()` is called
   - Check server logs for session recovery messages

3. **Reset Not Working**
   - Verify API endpoints are accessible
   - Check database permissions
   - Review server logs for error messages

### Debug Commands

```bash
# Check current user stats
curl "http://localhost:3000/api/analytics/user/USER_ID?timeRange=monthly"

# Check system status
curl "http://localhost:3000/api/analytics/status"

# Trigger session recovery
curl -X POST "http://localhost:3000/api/analytics/recover-sessions"
```

## Recent Fixes

### Voice Time Calculation Fix (2025-06-29)
**Problem**: Monthly voice minutes stayed at 0 despite active voice sessions
**Cause**: Monthly calculations only triggered when daily values changed
**Solution**: Made monthly calculations independent with separate update conditions

**Changes Made**:
- Enhanced `updateCalculatedStats()` in Discord Gateway
- Monthly calculations now happen every minute regardless of daily changes
- Update condition checks both daily AND monthly value changes

## Development Notes

### Key Design Principles
1. **Real-time Updates**: Counters update every minute
2. **Data Preservation**: Resets preserve historical data
3. **Session Continuity**: Active sessions survive resets
4. **Independent Calculations**: Monthly stats independent from daily
5. **Fault Tolerance**: System recovers from restarts gracefully

### Performance Considerations
- Database queries optimized with proper indexes
- Session validation runs efficiently every minute
- Historical data cleanup prevents database bloat
- Real-time calculations cached in `user_stats` table

### Future Enhancements
- Automatic database cleanup for old sessions
- Enhanced analytics dashboards
- Real-time WebSocket updates for UI
- Advanced achievement system