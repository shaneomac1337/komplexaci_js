# Analytics Data Directory

This directory contains the SQLite database files for the Komplexáci analytics system.

## Files (Auto-generated)

- `analytics.db` - Main SQLite database file
- `analytics.db-shm` - Shared memory file (SQLite WAL mode)
- `analytics.db-wal` - Write-ahead log file (SQLite WAL mode)

## Database Tables

- `daily_snapshots` - Daily activity summaries per user
- `game_sessions` - Individual game playing sessions
- `voice_sessions` - Discord voice channel sessions
- `spotify_sessions` - Spotify listening sessions

## Important Notes

⚠️ **Database files are NOT committed to git** (see `.gitignore`)

✅ **Database schema is defined in** `src/lib/analytics/database.ts`

🐳 **In Docker, this directory is mounted as a volume** for persistence

## Backup

To backup your analytics data:

```bash
# Create backup
cp data/analytics.db analytics-backup-$(date +%Y%m%d).db

# Or with Docker
docker run --rm -v analytics-data:/data -v $(pwd):/backup alpine tar czf /backup/analytics-backup.tar.gz -C /data .
```

## Reset

To reset all analytics data:

```bash
# Via API
curl -X POST http://localhost:3000/api/analytics/reset

# Or manually
rm data/analytics.db*
```
