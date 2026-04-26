# Discord Analytics System Snapshot

Inspected: 2026-04-26

This note captures the current Discord analytics implementation and the local database contents so the next pass can build on it without rediscovering the system.

## What It Tracks

- Online time per user in `user_stats.daily_online_minutes` and `monthly_online_minutes`.
- Games from Discord presence activities in `game_sessions`.
- Spotify tracks/artists from Discord presence activities in `spotify_sessions`.
- Voice channel membership and screen sharing in `voice_sessions`.
- Historical daily aggregates in `daily_snapshots`.

## Core Code Map

- `src/lib/analytics/database.ts`
  - Defines the SQLite schema and persistence methods.
  - Main tables: `user_stats`, `game_sessions`, `voice_sessions`, `spotify_sessions`, `daily_snapshots`.
  - Session methods start around `insertGameSession`, `insertVoiceSession`, and `insertSpotifySession`.
- `src/lib/analytics/service.ts`
  - Owns session lifecycle and in-memory active user tracking.
  - Presence entrypoint: `updateUserPresence`.
  - Voice entrypoint: `updateUserVoiceState`.
  - Periodic duration updater: `updateActiveSessionsProgress`.
  - Stale/orphan cleanup: `fixInconsistentTimestamps`, `cleanupStaleSessions`, `validateActiveSessionsWithPresence`.
- `src/lib/discord-gateway.ts`
  - Connects Discord events to analytics.
  - `presenceUpdate` feeds game and Spotify tracking.
  - `voiceStateUpdate` feeds voice tracking.
  - One-minute interval updates online time, calculated stats, active session progress, and validation.
- `src/app/api/analytics/user/[userId]/route.ts`
  - User stats API used by the frontend modal.
  - Supports `timeRange` values like `1d`, `7d`, `30d`, `monthly`, `90d`, and `all`.
- `src/app/api/analytics/export/route.ts`
  - Read/export endpoint for `user_stats`, `game_sessions`, `voice_sessions`, `spotify_sessions`, and `daily_snapshots`.
- `src/app/api/analytics/status/route.ts`
  - High-level status and record counts.
- `src/app/api/analytics/session-health/route.ts`
  - Active/stale session health and manual cleanup trigger.

## Local Database Snapshot

Database path: `data/analytics.db`

Record counts at inspection:

| Table | Records |
| --- | ---: |
| `user_stats` | 25 |
| `game_sessions` | 502 |
| `voice_sessions` | 4 |
| `spotify_sessions` | 297 |
| `daily_snapshots` | 25 |
| `monthly_snapshots` | missing |

Session status counts:

| Type | Active | Ended | Stale |
| --- | ---: | ---: | ---: |
| Games | 2 | 427 | 73 |
| Voice | 0 | 3 | 1 |
| Spotify | 0 | 282 | 15 |

Data ranges:

| Type | First | Last |
| --- | --- | --- |
| Games | 2026-04-25T12:17:32.031Z | 2026-04-25T21:55:59.764Z |
| Voice | 2026-04-25T19:44:39.476Z | 2026-04-25T20:58:38.085Z |
| Spotify | 2026-04-25T12:17:32.032Z | 2026-04-25T22:43:44.130Z |
| Daily snapshots | 2026-04-25 | 2026-04-25 |

## Current Top Content

Top games by recorded minutes:

| Game | Sessions | Minutes | Users |
| --- | ---: | ---: | ---: |
| Counter-Strike 2 | 80 | 483 | 2 |
| Outplayed | 110 | 477 | 1 |
| Arma Reforger | 81 | 405 | 1 |
| League of Legends | 61 | 369 | 3 |
| 4Vision - 4Story | 52 | 161 | 1 |
| ARK: Survival Evolved | 21 | 154 | 1 |
| Valorant | 15 | 91 | 1 |
| World of Tanks | 6 | 79 | 1 |
| Rust | 42 | 76 | 1 |
| R.E.P.O. | 8 | 51 | 1 |

Top voice channels by recorded minutes:

| Channel | Sessions | Minutes | Screen Share Minutes | Users |
| --- | ---: | ---: | ---: | ---: |
| Shane's Room | 1 | 0 | 0 | 1 |
| General | 3 | 0 | 0 | 1 |

Top Spotify tracks by plays:

| Track | Artist | Plays | Minutes | Users |
| --- | --- | ---: | ---: | ---: |
| KENPACHI&YACHIRU | P T K | 19 | 62 | 1 |
| Bang Bang Bang | BBpanzu | 13 | 37 | 1 |
| The One Who's Running the Show | Gooseworx | 7 | 14 | 1 |
| Doomer | Tokyo Manaka | 7 | 14 | 1 |
| Doomer - Instrumental | Tokyo Manaka | 7 | 12 | 1 |
| High While the World Ends | KROWNS | 6 | 32 | 1 |
| Dig | Arrested Youth | 6 | 17 | 1 |
| i tried again | mgk | 4 | 64 | 1 |
| Ego Renegade Boy | FLAVOR FOLEY | 4 | 64 | 1 |
| I Can't Fix You (feat. Crusher-P) | The Living Tombstone; Crusher-P | 4 | 26 | 1 |

Top Spotify artists by plays:

| Artist | Plays | Minutes | Users |
| --- | ---: | ---: | ---: |
| Arrested Youth | 20 | 47 | 1 |
| P T K | 19 | 62 | 1 |
| FLAVOR FOLEY | 16 | 79 | 1 |
| Tokyo Manaka | 14 | 26 | 1 |
| BBpanzu | 13 | 37 | 1 |

## Data Quality Notes

- Voice tracking is currently present but weak: all 4 voice sessions have `duration_minutes = 0`, and the only user with voice sessions also has `daily_voice_minutes = 0` and `monthly_voice_minutes = 0`.
- Two game sessions are still marked `active` even though their `last_updated` timestamp is from 2026-04-25T22:52:49Z, so they are stale relative to the inspection time.
- There are many zero-duration sessions: 255 games, 4 voice sessions, and 83 Spotify sessions.
- Duplicate-looking sessions exist in short time buckets, especially around recovery/reinitialization times. Example: several users have 4-6 sessions for the same game in the same minute.
- `monthly_snapshots` is referenced by monthly reset code, but the table is not currently present in the local database.

## Useful API Entrypoints

- `GET /api/analytics/status`
  - Overview of database counts, gateway status, current day activity, and available endpoints.
- `GET /api/analytics/session-health?details=true`
  - Active/stale session details.
- `POST /api/analytics/session-health`
  - Runs progress update, stale cleanup, and validation.
- `GET /api/analytics/export?tables=user_stats,game_sessions,voice_sessions,spotify_sessions,daily_snapshots`
  - Exports analytics data as JSON.
- `GET /api/analytics/export?format=csv&tables=game_sessions,spotify_sessions`
  - Returns CSV content in a JSON wrapper.
- `GET /api/analytics/user/:userId?timeRange=1d`
  - User modal data for the current daily reset window.
- `GET /api/analytics/user/:userId?timeRange=monthly`
  - User modal data since monthly reset.

## Good Next Work Items

1. Fix voice duration reliability.
   - Create an active user record inside `updateUserVoiceState` when a voice event arrives for a user missing from `activeUsers`, instead of returning early.
   - Avoid `fixInconsistentTimestamps` marking old voice sessions stale with `0` minutes.
2. Add duplicate-session protection during recovery/reinitialization.
   - Check for same user/activity active session before inserting a new session.
   - Consider a uniqueness guard for active sessions by `(user_id, game_name/status)` and `(user_id, track/artist/status)`.
3. Normalize stale cleanup behavior.
   - The session-health endpoint can detect the two old active game sessions, but they remained active in the database at inspection time.
4. Decide whether `monthly_snapshots` is required.
   - Either create the table in schema initialization or remove/adjust the monthly reset references.
5. Decide how to handle very short Spotify/game sessions.
   - Current data includes many zero-minute rows; the UI may need to filter them, or ingestion should debounce rapid activity changes.
