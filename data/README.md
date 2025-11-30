# Komplexáci Data Directory - Technical Reference

Complete reference documentation for the analytics data directory and SQLite database persistence layer.

**Version:** 1.0.0
**Last Updated:** 2025-11-30
**Status:** Production

---

## Table of Contents

1. [Overview](#overview)
2. [Database Files](#database-files)
3. [Database Configuration](#database-configuration)
4. [Schema Reference](#schema-reference)
5. [Backup and Recovery](#backup-and-recovery)
6. [Data Retention](#data-retention)
7. [Docker Volume Mounting](#docker-volume-mounting)
8. [Troubleshooting](#troubleshooting)
9. [Manual Query Examples](#manual-query-examples)
10. [Performance Characteristics](#performance-characteristics)
11. [Maintenance Procedures](#maintenance-procedures)

---

## Overview

The data directory contains the SQLite database that powers the Komplexáci analytics system. This database tracks real-time community member activities across Discord, including gaming sessions, voice participation, and Spotify listening.

**Database Location:**
- Default (local): `./data/analytics.db`
- Docker: `/app/data/analytics.db`
- Environment variable: `ANALYTICS_DATA_DIR`

**Database Engine:**
- SQLite 3.x (managed via better-sqlite3 Node.js driver)
- WAL mode enabled for concurrent read/write access
- Transaction support for data consistency
- Auto-initialization on first run

**Data Tables (5):**
| Table | Purpose | Records Estimate |
|-------|---------|-----------------|
| `user_stats` | Cumulative daily/monthly metrics per user | 100-1,000 |
| `game_sessions` | Individual game playing sessions | 10,000-100,000 |
| `voice_sessions` | Discord voice channel participation | 10,000-100,000 |
| `spotify_sessions` | Spotify listening sessions | 50,000-500,000 |
| `daily_snapshots` | Historical daily aggregates | 10,000-100,000 |

**Estimated Database Size:**
- Minimal (1 month, 10 active users): 2-5 MB
- Moderate (6 months, 50 active users): 20-50 MB
- Large (1 year, 100+ active users): 100-200 MB

---

## Database Files

### analytics.db

**Type:** SQLite database file (main data store)

**Size Characteristics:**
- Empty database: 40 KB
- Per active user monthly: 500 KB - 2 MB
- Per 1,000 sessions: 50-100 KB

**Contents:**
- All five table data
- Indexes for query optimization
- Schema definitions

**Permissions:** Read/Write (group/user as applicable)

**Retention:** Depends on retention policy (default 365 days)

**Backup Necessity:** Critical - essential for community statistics

**Corruption Indicators:**
```bash
# Check database integrity
sqlite3 data/analytics.db "PRAGMA integrity_check;"
```

Expected output: `ok`

### analytics.db-shm

**Type:** SQLite WAL mode shared memory file

**Purpose:** Implements Write-Ahead Logging (WAL) shared memory for faster I/O

**Size:** Typically 1-32 MB (varies with activity)

**When Present:** Only exists when database is open or has pending writes

**Lifetime:** Temporary - safely deleted when database is closed

**Auto-Creation:** Automatically created when database opens with WAL mode enabled

**Typical Lifecycle:**
- Created: On first database connection
- Grows: As writes accumulate
- Persists: While database is open
- Cleaned: On database close or checkpoint

**Corruption Risk:** Low - safely deleted if corrupted; will be recreated

### analytics.db-wal

**Type:** SQLite WAL mode write-ahead log file

**Purpose:** Stores uncommitted transactions before application to main database

**Size:** Typically 1-100 MB depending on activity volume

**When Present:** Only exists when database is open with pending changes

**Typical Content:**
- Recent write operations not yet committed to main database
- Transaction logs from active sessions
- Uncommitted user statistics updates

**Lifetime:** Temporary - purged during checkpoint operations

**Checkpoint Frequency:** Approximately every 1,000 pages (automatic)

**Corruption Risk:** Very low - regenerated on next transaction if needed

**Safe Removal:** Only when database is completely closed (inactive)

### File System Layout

```
data/
├── .gitkeep                    # Empty marker for git repository
├── README.md                   # This file
├── analytics.db                # Main database (primary)
├── analytics.db-shm           # WAL shared memory (temporary)
└── analytics.db-wal           # WAL write-ahead log (temporary)
```

**Note:** WAL files are excluded from version control via .gitignore

---

## Database Configuration

### Performance Optimizations

The database is configured for optimal performance and concurrency:

```typescript
// From src/lib/analytics/database.ts

// WAL mode: Better concurrency and faster writes
PRAGMA journal_mode = WAL;

// Balance between performance and safety
PRAGMA synchronous = NORMAL;

// Larger memory cache for faster access
PRAGMA cache_size = 10000;  // ~10 MB cache

// Use memory for temporary tables
PRAGMA temp_store = MEMORY;
```

### Connection Parameters

**better-sqlite3 Configuration:**
```typescript
const db = new Database(dbPath);
// Default settings:
// - readonly: false
// - fileMustExist: false
// - timeout: 5000 ms
// - verbose: undefined
```

**Multi-Connection Support:**
- Simultaneous readers: Unlimited
- Concurrent writers: 1 (serialized via SQLite)
- Typical response to write contention: Automatic retry with exponential backoff

**Connection Lifecycle:**
1. Database file checked/created on initialization
2. Schema initialized if first run
3. Performance pragmas applied
4. Database ready for operations
5. Graceful close on shutdown

### Initialization Sequence

```
Application Start
    ↓
getAnalyticsDatabase() called
    ├─ Check ANALYTICS_DATA_DIR env var
    ├─ Create directory if missing
    ├─ Open analytics.db (or create new)
    ├─ Apply performance pragmas
    ├─ Initialize schema (create tables if needed)
    └─ Return singleton instance
    ↓
getAnalyticsService() called
    └─ Uses database singleton
    ↓
Analytics System Ready
```

**Initialization Safety:**
- Automatic schema creation on first run
- No manual setup required
- Idempotent operations (safe to run multiple times)
- Transaction support prevents partial initialization

---

## Schema Reference

Complete database schema overview. Detailed field documentation available in `src/lib/analytics/README.md`.

### Table: user_stats

**Primary Key:** `user_id` (TEXT)

**Row Count:** Typically 10-1,000 (one per active community member)

**Average Row Size:** 200-300 bytes

**Purpose:** Cumulative daily and monthly statistics per user

```sql
CREATE TABLE user_stats (
  -- Primary Key
  user_id TEXT PRIMARY KEY,

  -- Daily Counters (reset 00:00 UTC)
  daily_online_minutes INTEGER DEFAULT 0,
  daily_voice_minutes INTEGER DEFAULT 0,
  daily_games_played INTEGER DEFAULT 0,
  daily_games_minutes INTEGER DEFAULT 0,
  daily_spotify_minutes INTEGER DEFAULT 0,
  daily_spotify_songs INTEGER DEFAULT 0,
  daily_streaming_minutes INTEGER DEFAULT 0,

  -- Monthly Counters (reset 1st of month 00:00 UTC)
  monthly_online_minutes INTEGER DEFAULT 0,
  monthly_voice_minutes INTEGER DEFAULT 0,
  monthly_games_played INTEGER DEFAULT 0,
  monthly_games_minutes INTEGER DEFAULT 0,
  monthly_spotify_minutes INTEGER DEFAULT 0,
  monthly_spotify_songs INTEGER DEFAULT 0,
  monthly_streaming_minutes INTEGER DEFAULT 0,

  -- Reset Tracking
  last_daily_reset TEXT DEFAULT CURRENT_TIMESTAMP,
  last_monthly_reset TEXT DEFAULT CURRENT_TIMESTAMP,

  -- Metadata
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for reset tracking
CREATE INDEX idx_user_stats_daily_reset ON user_stats(last_daily_reset);
CREATE INDEX idx_user_stats_monthly_reset ON user_stats(last_monthly_reset);
```

**Query Examples:**
- Get daily online leaderboard: 10-50 ms
- Get monthly statistics: 10-50 ms
- Check user reset status: 5-20 ms

**Update Frequency:**
- Multiple times per minute during active sessions
- Hourly during inactive periods
- Daily at 00:00 UTC (reset)
- Monthly on 1st at 00:00 UTC (reset)

### Table: game_sessions

**Primary Key:** `id` (INTEGER, auto-increment)

**Foreign Key:** `user_id` (TEXT)

**Row Count:** 10,000-100,000 per month (depends on activity)

**Average Row Size:** 150-200 bytes

**Purpose:** Individual game playing sessions with status tracking

```sql
CREATE TABLE game_sessions (
  -- Primary Key
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Foreign Key
  user_id TEXT NOT NULL,

  -- Session Data
  game_name TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  duration_minutes INTEGER DEFAULT 0,

  -- Management
  last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Query Indexes
CREATE INDEX idx_game_sessions_user ON game_sessions(user_id);
CREATE INDEX idx_game_sessions_start_time ON game_sessions(start_time);
CREATE INDEX idx_game_sessions_game_name ON game_sessions(game_name);
CREATE INDEX idx_game_sessions_status ON game_sessions(status);
CREATE INDEX idx_game_sessions_last_updated ON game_sessions(last_updated);
```

**Session Statuses:**
- `active`: Currently playing (end_time is NULL)
- `ended`: Game completed (end_time set)
- `stale`: Inactive for 5+ minutes (marked as ended)

**Typical Query Times:**
- Get active sessions: 10-30 ms
- Get user history (month): 50-100 ms
- Get game statistics: 100-500 ms (depends on result size)

**Data Growth:**
- Per average user per month: 30-100 sessions
- Total size growth: 5-10 KB per session

### Table: voice_sessions

**Primary Key:** `id` (INTEGER, auto-increment)

**Foreign Keys:** `user_id` (TEXT), `channel_id` (TEXT)

**Row Count:** 5,000-50,000 per month

**Average Row Size:** 180-220 bytes

**Purpose:** Discord voice channel participation with streaming tracking

```sql
CREATE TABLE voice_sessions (
  -- Primary Key
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Foreign Keys
  user_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,

  -- Session Data
  start_time TEXT NOT NULL,
  end_time TEXT,
  duration_minutes INTEGER DEFAULT 0,
  screen_share_minutes INTEGER DEFAULT 0,

  -- Management
  last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Query Indexes
CREATE INDEX idx_voice_sessions_user ON voice_sessions(user_id);
CREATE INDEX idx_voice_sessions_start_time ON voice_sessions(start_time);
CREATE INDEX idx_voice_sessions_status ON voice_sessions(status);
CREATE INDEX idx_voice_sessions_last_updated ON voice_sessions(last_updated);
```

**Special Fields:**
- `screen_share_minutes`: Cumulative streaming/screen share time within session
- `channel_name`: Readable name (e.g., "gaming", "study") for reporting

**Typical Query Times:**
- Get active voice sessions: 10-30 ms
- Calculate channel usage (month): 100-200 ms
- Get streaming statistics: 50-150 ms

### Table: spotify_sessions

**Primary Key:** `id` (INTEGER, auto-increment)

**Foreign Key:** `user_id` (TEXT)

**Row Count:** 50,000-500,000+ per month (very high volume)

**Average Row Size:** 160-200 bytes

**Purpose:** Spotify music listening sessions with track-level granularity

```sql
CREATE TABLE spotify_sessions (
  -- Primary Key
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Foreign Key
  user_id TEXT NOT NULL,

  -- Track Data
  track_name TEXT NOT NULL,
  artist TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  duration_minutes INTEGER DEFAULT 0,

  -- Management
  last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Query Indexes
CREATE INDEX idx_spotify_sessions_user ON spotify_sessions(user_id);
CREATE INDEX idx_spotify_sessions_artist ON spotify_sessions(artist);
CREATE INDEX idx_spotify_sessions_status ON spotify_sessions(status);
CREATE INDEX idx_spotify_sessions_last_updated ON spotify_sessions(last_updated);
```

**High Volume Characteristics:**
- Highest insertion rate among all tables
- Typical user listens to 10-50 songs per day
- Largest contributor to database growth
- Consider aggressive archival of old Spotify data

**Typical Query Times:**
- Get top artists (month): 200-500 ms
- Get user listening history (week): 100-300 ms
- Count songs per user (day): 20-50 ms

**Optimization Note:** Consider monthly archival of Spotify data to separate tables if size becomes excessive.

### Table: daily_snapshots

**Primary Key:** Composite `(user_id, date)` (TEXT, TEXT)

**Row Count:** Typically users * days (e.g., 100 users * 365 = 36,500)

**Average Row Size:** 120-160 bytes

**Purpose:** Historical daily aggregates for trend analysis

```sql
CREATE TABLE daily_snapshots (
  -- Composite Primary Key
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,

  -- Aggregated Metrics
  online_minutes INTEGER DEFAULT 0,
  voice_minutes INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  spotify_minutes INTEGER DEFAULT 0,

  -- Metadata
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (user_id, date)
);

-- Query Indexes
CREATE INDEX idx_daily_snapshots_date ON daily_snapshots(date);
CREATE INDEX idx_daily_snapshots_user_date ON daily_snapshots(user_id, date);
```

**Data Characteristics:**
- One snapshot per user per day
- Created at end of day or during maintenance
- Compressed view of daily activity
- Primary source for historical reporting

**Typical Query Times:**
- Get user's daily history (30 days): 30-80 ms
- Get all users for date: 50-150 ms
- Calculate weekly averages: 100-300 ms

**Data Growth:**
- Per active user per year: 365 rows (compact)
- 100 users per year: 36,500 rows (minimal storage)
- Oldest records eligible for retention cleanup

---

## Backup and Recovery

### Backup Procedures

#### Full Database Backup (Recommended)

**Local File System Backup:**
```bash
# Simple file copy (database must not be modified during backup)
cp data/analytics.db analytics-backup-$(date +%Y%m%d-%H%M%S).db

# With compression
tar czf analytics-backup-$(date +%Y%m%d).tar.gz data/analytics.db

# Verify backup integrity
sqlite3 analytics-backup-YYYYMMDD.db "PRAGMA integrity_check;"
```

**Expected output:** `ok` (indicates valid backup)

**Docker Backup:**
```bash
# Backup from running container
docker exec komplexaci-web cp /app/data/analytics.db /app/data/backup/analytics-backup-$(date +%Y%m%d).db

# Backup from volume
docker run --rm \
  -v analytics-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/analytics-backup-$(date +%Y%m%d).tar.gz -C /data .
```

**Scheduled Backup (Cron - Linux/macOS):**
```bash
# Daily backup at 2 AM UTC
0 2 * * * tar czf /backup/analytics/backup-$(date +\%Y\%m\%d).tar.gz -C /path/to/data .

# Weekly verification
0 3 * * 0 sqlite3 /path/to/data/analytics.db "PRAGMA integrity_check;" > /backup/verify-$(date +\%Y\%m\%d).log
```

**Backup Frequency Recommendations:**
- Daily: Production environments with high activity
- Weekly: Staging/development environments
- Monthly: Archives for long-term retention

#### Backup Verification

**Check Backup Integrity:**
```bash
# Verify SQLite database integrity
sqlite3 analytics-backup.db "PRAGMA integrity_check;"

# Quick integrity check (faster)
sqlite3 analytics-backup.db ".schema" > /dev/null

# Check file size consistency
ls -lh analytics-backup.db
# Should be consistent across backups for same date
```

**Test Restore (Recommended):**
```bash
# Create test database from backup
cp analytics-backup.db analytics-test.db

# Run integrity check
sqlite3 analytics-test.db "PRAGMA integrity_check;"

# Query test data
sqlite3 analytics-test.db "SELECT COUNT(*) as users FROM user_stats;"

# Clean up test database
rm analytics-test.db
```

### Recovery Procedures

#### Restore from Backup

**Local Restoration:**
```bash
# Stop application first
docker stop komplexaci-web

# Restore backup
cp analytics-backup-YYYYMMDD.db data/analytics.db

# Verify integrity
sqlite3 data/analytics.db "PRAGMA integrity_check;"

# Restart application
docker start komplexaci-web
```

**Docker Volume Restoration:**
```bash
# Stop container
docker-compose down

# Restore from backup
docker run --rm \
  -v analytics-data:/data \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/analytics-backup.tar.gz -C /data"

# Start container
docker-compose up -d
```

**Verification After Restore:**
```bash
# Connect to database
sqlite3 data/analytics.db

# Check row counts
SELECT 'user_stats' as table_name, COUNT(*) as row_count FROM user_stats
UNION ALL
SELECT 'game_sessions', COUNT(*) FROM game_sessions
UNION ALL
SELECT 'voice_sessions', COUNT(*) FROM voice_sessions
UNION ALL
SELECT 'spotify_sessions', COUNT(*) FROM spotify_sessions
UNION ALL
SELECT 'daily_snapshots', COUNT(*) FROM daily_snapshots;

# Check most recent data
SELECT MAX(created_at) as last_update FROM (
  SELECT MAX(created_at) as created_at FROM game_sessions
  UNION ALL
  SELECT MAX(created_at) FROM voice_sessions
  UNION ALL
  SELECT MAX(created_at) FROM spotify_sessions
);

# Exit
.quit
```

#### Disaster Recovery

**In Case of Corrupted Database:**

1. **Stop Application**
   ```bash
   docker-compose down
   ```

2. **Identify Latest Valid Backup**
   ```bash
   ls -lt backups/analytics-backup*.tar.gz | head -3
   ```

3. **Restore Latest Backup**
   ```bash
   docker run --rm \
     -v analytics-data:/data \
     alpine tar xzf /backup/latest-backup.tar.gz -C /data
   ```

4. **Verify Integrity**
   ```bash
   docker run --rm \
     -v analytics-data:/data \
     alpine sqlite3 /data/analytics.db "PRAGMA integrity_check;"
   ```

5. **Restart Application**
   ```bash
   docker-compose up -d
   ```

6. **Monitor Logs**
   ```bash
   docker logs -f komplexaci-web
   ```

**Recovery Time Objectives:**
- Detection: Immediate (automated health checks)
- Recovery: 5-10 minutes (restore + verification)
- Data Loss: Maximum 1 day (if daily backups)

---

## Data Retention

### Retention Policy

**Default Retention Period:** 365 days

**Applies To:** All session tables and snapshots
- game_sessions
- voice_sessions
- spotify_sessions
- daily_snapshots

**Not Retained:** user_stats (cumulative, never deleted)

### Manual Cleanup

**Check Data Age:**
```bash
sqlite3 data/analytics.db

-- Find how much old data exists
SELECT 'game_sessions' as table_name,
       COUNT(*) as total,
       COUNT(CASE WHEN DATE(start_time) < DATE('now', '-365 days') THEN 1 END) as older_than_365
FROM game_sessions
UNION ALL
SELECT 'voice_sessions',
       COUNT(*),
       COUNT(CASE WHEN DATE(start_time) < DATE('now', '-365 days') THEN 1 END)
FROM voice_sessions
UNION ALL
SELECT 'spotify_sessions',
       COUNT(*),
       COUNT(CASE WHEN DATE(start_time) < DATE('now', '-365 days') THEN 1 END)
FROM spotify_sessions
UNION ALL
SELECT 'daily_snapshots',
       COUNT(*),
       COUNT(CASE WHEN DATE(date) < DATE('now', '-365 days') THEN 1 END)
FROM daily_snapshots;
```

**Delete Old Data (365 day retention):**
```typescript
// Via Node.js API
const { database } = initializeAnalytics();
const result = database.cleanupOldData(365);

console.log(`Deleted ${result.deletedRecords.gameSessions} game sessions`);
console.log(`Deleted ${result.deletedRecords.voiceSessions} voice sessions`);
console.log(`Deleted ${result.deletedRecords.spotifySessions} spotify sessions`);
console.log(`Deleted ${result.deletedRecords.dailySnapshots} daily snapshots`);
```

**Direct SQL Cleanup (caution: cannot be undone):**
```sql
-- Backup before running!
-- cp data/analytics.db data/analytics.db.backup

-- Delete old game sessions
DELETE FROM game_sessions
WHERE DATE(start_time) < DATE('now', '-365 days');

-- Delete old voice sessions
DELETE FROM voice_sessions
WHERE DATE(start_time) < DATE('now', '-365 days');

-- Delete old spotify sessions
DELETE FROM spotify_sessions
WHERE DATE(start_time) < DATE('now', '-365 days');

-- Delete old daily snapshots
DELETE FROM daily_snapshots
WHERE DATE(date) < DATE('now', '-365 days');

-- Reclaim disk space
VACUUM;
```

**Expected Cleanup Results:**
- Monthly deletion: 5-50 MB per month of old data
- Quarterly deletion: 20-200 MB recovered
- Annual: 100+ MB recovered (depending on activity)

### Storage Growth Projection

**Based on 365-day retention with monthly cleanup:**

| Users | Activity Level | Monthly Growth | Annual Max |
|-------|---|---|---|
| 10 | Low | 2-3 MB | 24-36 MB |
| 50 | Medium | 10-15 MB | 120-180 MB |
| 100 | High | 25-40 MB | 300-480 MB |
| 200+ | Very High | 50+ MB | 600+ MB |

**Recommendations:**
- Monitor quarterly with `getDataRetentionInfo()`
- Schedule monthly cleanup during low-activity periods
- Archive old Spotify data to separate database if exceeding 500 MB
- Consider 180-day retention for high-volume communities

### Archive Strategy

**For Communities Exceeding 500 MB:**

```bash
# Monthly archive of old Spotify data (keep 90 days only)
sqlite3 data/analytics.db

-- Create archive table (first time only)
CREATE TABLE spotify_sessions_archive AS SELECT * FROM spotify_sessions WHERE 1=0;
CREATE INDEX idx_archive_artist ON spotify_sessions_archive(artist);

-- Archive sessions older than 90 days
INSERT INTO spotify_sessions_archive
SELECT * FROM spotify_sessions
WHERE DATE(start_time) < DATE('now', '-90 days');

-- Delete from main table
DELETE FROM spotify_sessions
WHERE DATE(start_time) < DATE('now', '-90 days');

-- Optimize database
VACUUM;
```

---

## Docker Volume Mounting

### Configuration

**Docker Compose Volume Setup:**
```yaml
services:
  komplexaci-app:
    # ... other configuration ...
    environment:
      - ANALYTICS_DATA_DIR=/app/data
    volumes:
      - analytics-data:/app/data  # Named volume for persistence

volumes:
  analytics-data:
    driver: local
```

**Volume Purpose:** Persists analytics database across container restarts

**Volume Location:** Managed by Docker (varies by system)

### Volume Management

**Create Volume:**
```bash
docker volume create analytics-data
```

**Inspect Volume:**
```bash
docker volume inspect analytics-data
# Shows: mount point, driver, labels, etc.
```

**List Volumes:**
```bash
docker volume ls | grep analytics
```

**Backup Volume:**
```bash
# Create backup from volume
docker run --rm \
  -v analytics-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/analytics-backup-$(date +%Y%m%d).tar.gz -C /data .
```

**Restore Volume:**
```bash
# Restore from backup
docker run --rm \
  -v analytics-data:/data \
  -v $(pwd):/backup \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/analytics-backup-YYYYMMDD.tar.gz -C /data"
```

**Remove Volume (WARNING: Deletes all data):**
```bash
# Stop container first
docker-compose down

# Remove volume
docker volume rm analytics-data

# Restart (creates new empty database)
docker-compose up -d
```

### Mounting from Host Directory

**Alternative: Mount Host Directory (development):**
```yaml
volumes:
  - ./data:/app/data  # Mount local ./data directory
```

**Advantages:**
- Easy local inspection
- Direct database access without docker exec
- Simpler backup procedures

**Disadvantages:**
- Requires local ./data directory
- File permission issues possible
- Less portable across systems

### Permissions and Ownership

**Docker Volume Permissions:**
- Automatically managed by Docker
- User/group ownership handled by container runtime
- No manual permission changes needed

**Host Directory Permissions (if using bind mount):**
```bash
# Ensure proper permissions
chmod -R 755 data/
chown -R app:app data/  # If running as specific user

# Verify
ls -la data/
# Should show: drwxr-xr-x ... data/
```

---

## Troubleshooting

### Common Issues

#### Issue: Database File Growing Excessively

**Symptoms:**
- data/analytics.db exceeds 1 GB
- Slow query performance
- High disk I/O

**Diagnosis:**
```bash
# Check file sizes
ls -lh data/analytics.db*

# Check row counts by table
sqlite3 data/analytics.db <<EOF
SELECT 'game_sessions', COUNT(*) FROM game_sessions
UNION ALL
SELECT 'voice_sessions', COUNT(*) FROM voice_sessions
UNION ALL
SELECT 'spotify_sessions', COUNT(*) FROM spotify_sessions
UNION ALL
SELECT 'daily_snapshots', COUNT(*) FROM daily_snapshots;
EOF
```

**Solutions:**

1. **Run data cleanup (365-day retention):**
   ```typescript
   const { database } = initializeAnalytics();
   database.cleanupOldData(365);
   ```

2. **Reduce retention period (if over 1 GB):**
   ```typescript
   database.cleanupOldData(180);  // Keep only 180 days
   ```

3. **Archive Spotify data:**
   ```bash
   sqlite3 data/analytics.db <<EOF
   CREATE TABLE IF NOT EXISTS spotify_archive AS
   SELECT * FROM spotify_sessions WHERE 1=0;

   INSERT INTO spotify_archive
   SELECT * FROM spotify_sessions
   WHERE DATE(start_time) < DATE('now', '-90 days');

   DELETE FROM spotify_sessions
   WHERE DATE(start_time) < DATE('now', '-90 days');

   VACUUM;
   EOF
   ```

#### Issue: "Database is Locked" Errors

**Symptoms:**
- "Error: database is locked" in logs
- Failed inserts/updates
- Slow response times

**Likely Causes:**
- Long-running query
- Multiple concurrent writers
- WAL mode not properly configured
- Previous crash leaving locks

**Diagnosis:**
```bash
# Check WAL mode status
sqlite3 data/analytics.db "PRAGMA journal_mode;"
# Should output: wal

# Check database integrity
sqlite3 data/analytics.db "PRAGMA integrity_check;"
# Should output: ok
```

**Solutions:**

1. **Verify WAL mode is enabled:**
   ```bash
   sqlite3 data/analytics.db <<EOF
   PRAGMA journal_mode = WAL;
   PRAGMA synchronous = NORMAL;
   PRAGMA cache_size = 20000;
   .quit
   EOF
   ```

2. **Increase timeout:**
   ```typescript
   // In database.ts, increase connection timeout
   const db = new Database(dbPath, { timeout: 10000 });  // 10 seconds
   ```

3. **Restart database connection:**
   ```bash
   docker restart komplexaci-web
   ```

4. **Force delete lock files (last resort):**
   ```bash
   # Stop application first!
   docker-compose down

   # Remove WAL files (will be recreated)
   rm -f data/analytics.db-shm data/analytics.db-wal

   # Restart
   docker-compose up -d
   ```

#### Issue: Database Corruption

**Symptoms:**
- "Error: database disk image is malformed"
- "Error: file is not a database"
- Integrity check fails

**Diagnosis:**
```bash
# Check integrity
sqlite3 data/analytics.db "PRAGMA integrity_check;" > /tmp/integrity.log
cat /tmp/integrity.log

# If not "ok", database is corrupted
```

**Solutions:**

1. **Restore from Latest Backup:**
   ```bash
   docker-compose down

   cp analytics-backup-latest.db data/analytics.db

   sqlite3 data/analytics.db "PRAGMA integrity_check;"

   docker-compose up -d
   ```

2. **Attempt Recovery (SQLite emergency mode):**
   ```bash
   # Create recovery database
   sqlite3 data/analytics.db ".recover" | sqlite3 data/analytics-recovered.db

   # Check recovered database
   sqlite3 data/analytics-recovered.db "PRAGMA integrity_check;"

   # If ok, replace original
   mv data/analytics.db data/analytics.db.corrupted
   mv data/analytics-recovered.db data/analytics.db
   ```

3. **Reinitialize if Unrecoverable:**
   ```bash
   # WARNING: Deletes all data!
   docker-compose down

   rm -f data/analytics.db*

   docker-compose up -d
   # Application will auto-initialize empty database
   ```

#### Issue: Docker Volume Not Persisting Data

**Symptoms:**
- Data lost after container restart
- New empty database after each restart
- Volume appears unmounted

**Diagnosis:**
```bash
# Check volume mounting
docker inspect komplexaci-web | grep -A 5 Mounts

# Check volume contents
docker run --rm -v analytics-data:/data alpine ls -la /data

# Check volume driver
docker volume inspect analytics-data | grep Driver
```

**Solutions:**

1. **Verify docker-compose.yml configuration:**
   ```yaml
   services:
     komplexaci-app:
       volumes:
         - analytics-data:/app/data

   volumes:
     analytics-data:
       driver: local
   ```

2. **Check if data exists in volume:**
   ```bash
   docker run --rm -v analytics-data:/data alpine ls -lah /data
   ```

3. **Recreate volume:**
   ```bash
   docker-compose down
   docker volume rm analytics-data
   docker volume create analytics-data
   docker-compose up -d
   ```

4. **Mount from host directory instead:**
   ```yaml
   volumes:
     - ./data:/app/data  # Use host directory mount
   ```

#### Issue: Slow Query Performance

**Symptoms:**
- Queries taking 500+ ms
- API endpoints timing out
- High CPU usage during queries

**Diagnosis:**
```bash
# Enable timing and explain
sqlite3 data/analytics.db

.timer ON

EXPLAIN QUERY PLAN
SELECT * FROM game_sessions
WHERE user_id = 'user123'
AND DATE(start_time) = '2025-11-30';

-- Look for: SCAN TABLE (slow) vs. SEARCH TABLE idx_* (fast)
```

**Solutions:**

1. **Verify Indexes Exist:**
   ```bash
   sqlite3 data/analytics.db <<EOF
   PRAGMA index_list(game_sessions);
   PRAGMA index_list(voice_sessions);
   PRAGMA index_list(spotify_sessions);
   EOF
   ```

2. **Recreate Missing Indexes:**
   ```sql
   -- Game sessions
   CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON game_sessions(user_id);
   CREATE INDEX IF NOT EXISTS idx_game_sessions_start_time ON game_sessions(start_time);
   CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);
   CREATE INDEX IF NOT EXISTS idx_game_sessions_last_updated ON game_sessions(last_updated);

   -- Voice sessions
   CREATE INDEX IF NOT EXISTS idx_voice_sessions_user ON voice_sessions(user_id);
   CREATE INDEX IF NOT EXISTS idx_voice_sessions_status ON voice_sessions(status);
   CREATE INDEX IF NOT EXISTS idx_voice_sessions_last_updated ON voice_sessions(last_updated);

   -- Spotify sessions
   CREATE INDEX IF NOT EXISTS idx_spotify_sessions_user ON spotify_sessions(user_id);
   CREATE INDEX IF NOT EXISTS idx_spotify_sessions_status ON spotify_sessions(status);
   CREATE INDEX IF NOT EXISTS idx_spotify_sessions_last_updated ON spotify_sessions(last_updated);
   ```

3. **Increase Cache Size:**
   ```bash
   sqlite3 data/analytics.db "PRAGMA cache_size = 50000;"
   ```

4. **Analyze and Optimize:**
   ```bash
   sqlite3 data/analytics.db "ANALYZE;"
   sqlite3 data/analytics.db "VACUUM;"
   ```

#### Issue: Out of Disk Space

**Symptoms:**
- "Error: disk I/O error" in logs
- Application unable to write new data
- Docker container OOMKilled

**Diagnosis:**
```bash
# Check disk usage
df -h /path/to/data

# Check database size
du -sh data/analytics.db

# List large files
du -sh data/* | sort -h
```

**Solutions:**

1. **Immediate: Cleanup Old Data**
   ```typescript
   const { database } = initializeAnalytics();
   database.cleanupOldData(90);  // Keep only 90 days
   ```

2. **Optimize Database:**
   ```bash
   sqlite3 data/analytics.db "VACUUM;"
   ```

3. **Archive Spotify Data:**
   ```bash
   sqlite3 data/analytics.db <<EOF
   CREATE TABLE spotify_archive AS
   SELECT * FROM spotify_sessions WHERE 1=0;

   INSERT INTO spotify_archive
   SELECT * FROM spotify_sessions
   WHERE created_at < datetime('now', '-180 days');

   DELETE FROM spotify_sessions
   WHERE created_at < datetime('now', '-180 days');

   VACUUM;
   EOF
   ```

4. **Long-term: Increase Disk Space**
   - Expand Docker volume
   - Resize host partition
   - Move to larger storage device

---

## Manual Query Examples

All examples use standard SQLite 3 syntax. Execute via:
```bash
sqlite3 data/analytics.db
```

### User Statistics

**Get Active Users Ranked by Daily Online Time:**
```sql
SELECT user_id,
       daily_online_minutes,
       daily_games_played,
       daily_voice_minutes
FROM user_stats
WHERE daily_online_minutes > 0
ORDER BY daily_online_minutes DESC
LIMIT 10;
```

**Expected Runtime:** 10-30 ms

**Check if User Needs Daily Reset:**
```sql
SELECT user_id,
       last_daily_reset,
       CAST((julianday('now') - julianday(last_daily_reset)) * 24 AS INTEGER) as hours_since_reset,
       CASE
         WHEN (julianday('now') - julianday(last_daily_reset)) * 24 > 24 THEN 'YES - RESET NEEDED'
         ELSE 'No - reset ok'
       END as status
FROM user_stats
WHERE user_id = 'user123';
```

**Expected Runtime:** 5-15 ms

### Session Analysis

**Get User's Game History for Date:**
```sql
SELECT game_name,
       COUNT(*) as session_count,
       SUM(duration_minutes) as total_minutes,
       AVG(duration_minutes) as avg_minutes,
       MIN(duration_minutes) as min_minutes,
       MAX(duration_minutes) as max_minutes
FROM game_sessions
WHERE user_id = 'user123'
  AND DATE(start_time) = '2025-11-30'
GROUP BY game_name
ORDER BY total_minutes DESC;
```

**Expected Runtime:** 50-150 ms

**Find Most Played Games Overall (Last 30 Days):**
```sql
SELECT game_name,
       COUNT(*) as sessions,
       SUM(duration_minutes) as total_minutes,
       AVG(duration_minutes) as avg_duration
FROM game_sessions
WHERE status IN ('ended', 'stale')
  AND DATE(start_time) >= DATE('now', '-30 days')
GROUP BY game_name
ORDER BY total_minutes DESC
LIMIT 20;
```

**Expected Runtime:** 200-500 ms

**Analyze Voice Channel Usage (Today):**
```sql
SELECT channel_name,
       COUNT(*) as users_joined,
       SUM(duration_minutes) as total_voice_minutes,
       SUM(screen_share_minutes) as total_streaming_minutes,
       AVG(duration_minutes) as avg_session_length
FROM voice_sessions
WHERE DATE(start_time) = DATE('now')
GROUP BY channel_name
ORDER BY total_voice_minutes DESC;
```

**Expected Runtime:** 50-150 ms

### Spotify Analysis

**Top Artists by Total Listening Time (Last 30 Days):**
```sql
SELECT artist,
       COUNT(*) as songs_played,
       SUM(duration_minutes) as total_minutes,
       AVG(duration_minutes) as avg_song_duration
FROM spotify_sessions
WHERE user_id = 'user123'
  AND DATE(start_time) >= DATE('now', '-30 days')
  AND status IN ('ended', 'stale')
GROUP BY artist
ORDER BY total_minutes DESC
LIMIT 20;
```

**Expected Runtime:** 100-300 ms

**Most Popular Songs Community-Wide:**
```sql
SELECT track_name,
       artist,
       COUNT(*) as listeners,
       COUNT(DISTINCT user_id) as unique_listeners,
       SUM(duration_minutes) as total_listening_time
FROM spotify_sessions
WHERE DATE(start_time) >= DATE('now', '-90 days')
GROUP BY track_name, artist
ORDER BY unique_listeners DESC
LIMIT 30;
```

**Expected Runtime:** 500-1500 ms (large result set)

### Snapshot and Trends

**Compare User Activity Across Months:**
```sql
SELECT DATE(date) as month,
       online_minutes,
       voice_minutes,
       games_played,
       spotify_minutes
FROM daily_snapshots
WHERE user_id = 'user123'
  AND DATE(date) >= DATE('now', '-90 days')
ORDER BY date DESC;
```

**Expected Runtime:** 20-50 ms

**Weekly Trends (All Users):**
```sql
SELECT strftime('%Y-W%W', date) as week,
       COUNT(DISTINCT user_id) as active_users,
       AVG(online_minutes) as avg_online,
       AVG(voice_minutes) as avg_voice,
       AVG(games_played) as avg_games
FROM daily_snapshots
WHERE DATE(date) >= DATE('now', '-60 days')
GROUP BY week
ORDER BY week DESC;
```

**Expected Runtime:** 50-150 ms

### Data Integrity

**Find Active Sessions Without Proper End Times:**
```sql
SELECT id, user_id, status, last_updated,
       CAST((julianday('now') - julianday(last_updated)) * 24 * 60 AS INTEGER) as minutes_since_update
FROM game_sessions
WHERE status = 'active'
  AND last_updated < datetime('now', '-5 minutes')
ORDER BY last_updated ASC;
```

**Expected Runtime:** 10-30 ms

**Sessions Across All Types with Duration:**
```sql
SELECT 'game' as type, COUNT(*) as count, AVG(duration_minutes) as avg_duration
FROM game_sessions
WHERE status IN ('ended', 'stale')
UNION ALL
SELECT 'voice', COUNT(*), AVG(duration_minutes)
FROM voice_sessions
WHERE status IN ('ended', 'stale')
UNION ALL
SELECT 'spotify', COUNT(*), AVG(duration_minutes)
FROM spotify_sessions
WHERE status IN ('ended', 'stale');
```

**Expected Runtime:** 100-300 ms

### Retention Analysis

**Data Age Distribution:**
```sql
SELECT
  'game_sessions' as table_name,
  COUNT(*) as total,
  COUNT(CASE WHEN DATE(start_time) >= DATE('now', '-30 days') THEN 1 END) as last_30_days,
  COUNT(CASE WHEN DATE(start_time) BETWEEN DATE('now', '-60 days') AND DATE('now', '-30 days') THEN 1 END) as days_31_60,
  COUNT(CASE WHEN DATE(start_time) BETWEEN DATE('now', '-365 days') AND DATE('now', '-60 days') THEN 1 END) as days_61_365,
  COUNT(CASE WHEN DATE(start_time) < DATE('now', '-365 days') THEN 1 END) as older_365
FROM game_sessions
UNION ALL
SELECT 'voice_sessions',
  COUNT(*),
  COUNT(CASE WHEN DATE(start_time) >= DATE('now', '-30 days') THEN 1 END),
  COUNT(CASE WHEN DATE(start_time) BETWEEN DATE('now', '-60 days') AND DATE('now', '-30 days') THEN 1 END),
  COUNT(CASE WHEN DATE(start_time) BETWEEN DATE('now', '-365 days') AND DATE('now', '-60 days') THEN 1 END),
  COUNT(CASE WHEN DATE(start_time) < DATE('now', '-365 days') THEN 1 END)
FROM voice_sessions
UNION ALL
SELECT 'spotify_sessions',
  COUNT(*),
  COUNT(CASE WHEN DATE(start_time) >= DATE('now', '-30 days') THEN 1 END),
  COUNT(CASE WHEN DATE(start_time) BETWEEN DATE('now', '-60 days') AND DATE('now', '-30 days') THEN 1 END),
  COUNT(CASE WHEN DATE(start_time) BETWEEN DATE('now', '-365 days') AND DATE('now', '-60 days') THEN 1 END),
  COUNT(CASE WHEN DATE(start_time) < DATE('now', '-365 days') THEN 1 END)
FROM spotify_sessions;
```

**Expected Runtime:** 300-800 ms (large tables)

---

## Performance Characteristics

### Query Performance Baseline

Typical query response times on well-maintained database (100-1000 active users, 365-day retention):

| Operation | Best Case | Average | Worst Case |
|-----------|-----------|---------|-----------|
| Point lookup (user_stats) | 2 ms | 5 ms | 20 ms |
| Active game sessions | 10 ms | 20 ms | 50 ms |
| User history (month) | 30 ms | 60 ms | 150 ms |
| Leaderboard top 10 | 10 ms | 20 ms | 50 ms |
| Spotify top artists | 100 ms | 200 ms | 500 ms |
| Daily snapshots (month) | 20 ms | 40 ms | 100 ms |
| Data cleanup (annual) | 500 ms | 2 sec | 10 sec |
| Full integrity check | 1 sec | 5 sec | 30 sec |

### Database Size Growth

Estimated monthly growth without retention cleanup:

| Activity Level | Users | Est. Monthly | Annual |
|---|---|---|---|
| Very Low | 5-10 | 1-2 MB | 12-24 MB |
| Low | 10-25 | 5-10 MB | 60-120 MB |
| Medium | 25-75 | 15-25 MB | 180-300 MB |
| High | 75-150 | 40-80 MB | 480-960 MB |
| Very High | 150+ | 100+ MB | 1200+ MB |

### Write Performance

**Sessions Created Per Minute:**
- Average community: 5-20 (writes per minute)
- Peak periods: 50-100+ (writes per minute)
- Max capacity: 1000+ writes/min (before locking)

**Update Frequency:**
- Active session updates: Every 1 minute
- Statistics updates: 1-5 times per minute
- Daily snapshots: Once per day
- Resets: Once daily + once monthly

### Index Impact

Database with proper indexes:
- Without indexes: 200-1000 ms for range queries
- With indexes: 20-100 ms for range queries
- Index overhead: ~10-15% of database size

---

## Maintenance Procedures

### Daily Maintenance

**Nothing Required** - All maintenance is automatic

However, recommended periodic checks:

```bash
# Weekly health check (via Docker)
docker exec komplexaci-web node -e "
const { database } = require('./lib/analytics');
const health = database.healthCheck();
console.log(JSON.stringify(health, null, 2));
"
```

### Monthly Maintenance

**Run Data Cleanup:**
```bash
docker exec komplexaci-web node -e "
const { database } = require('./lib/analytics');
const result = database.cleanupOldData(365);
console.log('Cleanup complete:', result);
"
```

**Verify Database Integrity:**
```bash
docker exec komplexaci-web sqlite3 /app/data/analytics.db "PRAGMA integrity_check;"
```

**Optimize Database:**
```bash
docker exec komplexaci-web sqlite3 /app/data/analytics.db "VACUUM;"
```

### Quarterly Procedures

**Review Retention Settings:**
```bash
docker exec komplexaci-web node -e "
const { database } = require('./lib/analytics');
const info = database.getDataRetentionInfo(365);
console.log('Data retention info:', info);
"
```

**Test Backup Restore:**
```bash
# Backup current state
docker exec komplexaci-web cp /app/data/analytics.db /app/data/test-backup.db

# Verify backup integrity
docker exec komplexaci-web sqlite3 /app/data/test-backup.db "PRAGMA integrity_check;"

# Clean up test
docker exec komplexaci-web rm /app/data/test-backup.db
```

**Check Index Efficiency:**
```bash
docker exec komplexaci-web sqlite3 /app/data/analytics.db <<EOF
-- Count index usage
SELECT name, tbl, ? as index_rows
FROM sqlite_master
WHERE type='index' AND tbl IN ('game_sessions', 'voice_sessions', 'spotify_sessions');
EOF
```

### Annual Procedures

**Full Database Audit:**
```bash
docker exec komplexaci-web sqlite3 /app/data/analytics.db <<EOF
-- Row count by table
SELECT 'Total Rows' as metric,
       (SELECT COUNT(*) FROM user_stats) +
       (SELECT COUNT(*) FROM game_sessions) +
       (SELECT COUNT(*) FROM voice_sessions) +
       (SELECT COUNT(*) FROM spotify_sessions) +
       (SELECT COUNT(*) FROM daily_snapshots) as count;

-- Data date range
SELECT 'Oldest Data' as metric, MIN(start_time) as date FROM (
  SELECT start_time FROM game_sessions
  UNION ALL
  SELECT start_time FROM voice_sessions
  UNION ALL
  SELECT start_time FROM spotify_sessions
);

SELECT 'Newest Data' as metric, MAX(start_time) as date FROM (
  SELECT start_time FROM game_sessions
  UNION ALL
  SELECT start_time FROM voice_sessions
  UNION ALL
  SELECT start_time FROM spotify_sessions
);
EOF
```

**Review Retention Policy:**
- Check if 365-day default is appropriate
- Adjust if storage is constrained
- Plan for next year's capacity

**Archive Historical Data (if desired):**
```bash
# Export snapshots older than 1 year
docker exec komplexaci-web sqlite3 /app/data/analytics.db <<EOF
.mode csv
.output daily_snapshots_archive.csv
SELECT * FROM daily_snapshots WHERE DATE(date) < DATE('now', '-365 days');
.quit
EOF

# Copy archive to host
docker cp komplexaci-web:/app/daily_snapshots_archive.csv ./archive/
```

---

## File Size Reference

**Typical file sizes after initialization:**

| File | Size | Notes |
|------|------|-------|
| Empty analytics.db | 40 KB | Fresh database |
| After 1 month, 10 users | 2-5 MB | Active community |
| After 6 months, 50 users | 20-50 MB | Established server |
| After 1 year, 100 users | 100-200 MB | Large community |
| analytics.db-shm (WAL) | 1-32 MB | Variable, temporary |
| analytics.db-wal (WAL) | 1-100 MB | Variable, temporary |

**Note:** WAL files sizes depend on active transactions. Safe to delete when database is closed.

---

## Related Documentation

- **Analytics Schema:** `src/lib/analytics/README.md` - Detailed table schema and API reference
- **Database Implementation:** `src/lib/analytics/database.ts` - SQLite setup and operations
- **Service Layer:** `src/lib/analytics/service.ts` - Session management and business logic
- **Docker Configuration:** `docker/docker-compose.yml` - Volume mounting and container setup

---

## Document Metadata

- **Repository:** Komplexáci Discord Community Bot
- **Technology:** SQLite 3.x, better-sqlite3, Node.js
- **Database Location:** data/analytics.db
- **Audience:** DevOps, Backend developers, system administrators
- **Maintenance:** Update when database schema or policies change
- **Last Reviewed:** 2025-11-30
