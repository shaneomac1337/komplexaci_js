# Implementation Plan: Daily / Monthly Stats Toggle

**Companion to:** `docs/monthly-stats-toggle-spec.md`
**Status:** Implement-ready
**Date:** 2026-06-28
**Owner:** Martin Penkava

This plan is written to be executed phase-by-phase. Each phase is **atomic**
(safe to commit on its own), lists exact files, concrete edits, and explicit
success criteria. Phases 1–7 ship the feature; Phase 8 is an isolated cleanup.

> **Golden rule for this codebase:** `next.config.ts` sets
> `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds`, and there is
> **no automated test suite** (only ad-hoc scripts in `tests/`). A clean
> `npm run build` does NOT prove correctness — every phase must be verified by
> hand against a running dev server and the live `data/analytics.db`.

---

## 0. Pre-flight (do once before Phase 1)

1. **Back up the database** — the whole feature reads/writes `data/analytics.db`:
   ```bash
   cp data/analytics.db data/analytics.db.bak-$(date +%Y%m%d)
   ```
2. **Snapshot current behavior** for later comparison:
   - Open the homepage → note the 3 Daily Awards winners + values.
   - Open a member's stats modal → note daily totals per tab.
   - `GET /api/daily-awards` and `GET /api/analytics/user/<id>?timeRange=1d` →
     save the JSON.
3. **Confirm the nightly cron** that POSTs `/api/analytics/reset-daily` exists and
   note its schedule/timezone (needed to reason about month-boundary timing).
4. Create a feature branch:
   ```bash
   git checkout -b feat/monthly-stats-toggle
   ```

---

## Phase 1 — Add `games_minutes` to `daily_snapshots`

**Why:** `daily_snapshots` is the only durable per-day store, but it lacks total
gaming **minutes** (only `games_played` distinct-count is stored). Monthly gamer
minutes need this column going forward.

### Files
- `src/lib/analytics/database.ts`
- `src/app/api/analytics/reset-daily/route.ts`
- `src/lib/analytics/service.ts`

### Edits

**1.1 — Type (`database.ts`, `DailySnapshot` interface ~line 154 area / interface near top):**
Add field:
```ts
export interface DailySnapshot {
  user_id: string;
  date: string;
  online_minutes: number;
  voice_minutes: number;
  games_played: number;
  games_minutes: number;   // NEW
  spotify_minutes: number; // NOTE: actually stores play COUNT (plays_count)
  created_at?: string;
}
```

**1.2 — Table create (`database.ts`, `CREATE TABLE IF NOT EXISTS daily_snapshots`):**
Add `games_minutes INTEGER DEFAULT 0,` to the create statement (for fresh DBs).

**1.3 — Migration (`database.ts`, in the existing migration block that does
`ALTER TABLE ... ADD COLUMN`, near lines 125–325):**
Follow the existing guarded-migration pattern:
```ts
const dailySnapshotsInfo = this.db.prepare(`PRAGMA table_info(daily_snapshots)`).all();
const hasGamesMinutes = dailySnapshotsInfo.some((c: any) => c.name === 'games_minutes');
if (!hasGamesMinutes) {
  this.db.exec(`ALTER TABLE daily_snapshots ADD COLUMN games_minutes INTEGER DEFAULT 0;`);
  console.log('✅ Added games_minutes column to daily_snapshots');
}
```
Place this **before** `createIndexes()` (same ordering as existing migrations).

**1.4 — `upsertDailySnapshot` (`database.ts` ~line 455):**
Add `games_minutes` to the column list, the `VALUES`, and the `ON CONFLICT ... DO UPDATE SET`:
```ts
INSERT INTO daily_snapshots
  (user_id, date, online_minutes, voice_minutes, games_played, games_minutes, spotify_minutes)
VALUES (?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(user_id, date) DO UPDATE SET
  online_minutes = excluded.online_minutes,
  voice_minutes  = excluded.voice_minutes,
  games_played   = excluded.games_played,
  games_minutes  = excluded.games_minutes,
  spotify_minutes = excluded.spotify_minutes
```
Update the bound params accordingly.

**1.5 — `/reset-daily` route (writes yesterday's snapshot, ~line 90–105):**
It already computes `gameStats.total_minutes`. Persist it:
```ts
const gamesMinutes = Math.round(gameStats?.total_minutes || 0);
// ...
db.upsertDailySnapshot({
  user_id: userId,
  date: yesterday,
  online_minutes: onlineMinutes,
  voice_minutes: voiceMinutes,
  games_played: gamesPlayed,
  games_minutes: gamesMinutes,   // NEW
  spotify_minutes: spotifyMinutes
});
```

**1.6 — Preserve on live upserts (`service.ts`):**
- `saveDailyOnlineTime` (~line 900): when upserting, carry forward
  `games_minutes: existingSnapshot?.games_minutes || 0` so the every-minute online
  save does not clobber it to 0.
- `generateDailySnapshot`-style writer (~line 1045): set
  `games_minutes: gameTime?.total || 0` (it already queries game minutes for the
  online estimate).

### Success criteria
- `PRAGMA table_info(daily_snapshots)` shows `games_minutes`.
- App boots with no migration errors; existing rows show `games_minutes = 0`.
- After a manual `POST /api/analytics/reset-daily` (in dev, with seeded sessions),
  yesterday's snapshot row has a non-zero `games_minutes` matching
  `SUM(duration_minutes)` of that user's game sessions.
- Existing daily behavior unchanged.

### Verification
```bash
sqlite3 data/analytics.db "PRAGMA table_info(daily_snapshots);"
sqlite3 data/analytics.db "SELECT user_id,date,games_played,games_minutes FROM daily_snapshots ORDER BY date DESC LIMIT 10;"
```

---

## Phase 2 — Prague calendar-month helpers

**Why:** Monthly = calendar month in Europe/Prague. Need boundary helpers that
match the existing daily helpers' timezone correctness (incl. DST).

### File
- `src/lib/czech-time.ts`

### Edits
Add and export:
```ts
// First day of the Prague month containing `date`, as 'YYYY-MM-01'.
export function getPragueMonthStartDateString(date: Date = new Date()): string {
  const { year, month } = getPragueDateParts(date);
  return formatDateParts(year, month, 1);
}

// True if `prev` and `now` fall in different Prague calendar months.
export function hasPragueMonthChanged(prev: Date, now: Date): boolean {
  const a = getPragueDateParts(prev);
  const b = getPragueDateParts(now);
  return a.year !== b.year || a.month !== b.month;
}
```
`getPragueDateString` (today) already exists and is reused for the "today" boundary.

### Success criteria
- Unit-sanity (manual REPL or a throwaway script in `tests/`):
  - `getPragueMonthStartDateString(new Date('2026-06-15T...'))` → `'2026-06-01'`.
  - `hasPragueMonthChanged(2026-06-30, 2026-07-01)` → `true`; same-month → `false`.
- DST months (late March / late October) produce correct `YYYY-MM-01`.

---

## Phase 3 — Monthly aggregation method (durable source)

**Why:** Single source of truth both surfaces call, summing `daily_snapshots` over
the current Prague month **plus** today's live counters (decision #6).

### File
- `src/lib/analytics/database.ts` (add methods; keep SQL co-located with schema)

### Edits

**3.1 — Per-user monthly totals (for the modal):**
```ts
public getMonthlyTotals(userId: string) {
  const monthStart = getPragueMonthStartDateString();   // 'YYYY-MM-01'
  const today      = getPragueDateString(new Date());   // 'YYYY-MM-DD'

  // Past days this month: snapshots strictly before today (avoid double-counting today).
  const past = this.db.prepare(`
    SELECT
      COALESCE(SUM(online_minutes),0)  AS online,
      COALESCE(SUM(voice_minutes),0)   AS voice,
      COALESCE(SUM(games_minutes),0)   AS games,
      COALESCE(SUM(spotify_minutes),0) AS spotifySongs  -- plays_count semantics
    FROM daily_snapshots
    WHERE user_id = ? AND date >= ? AND date < ?
  `).get(userId, monthStart, today) as any;

  // Today's live numbers from user_stats daily_* counters.
  const live = this.db.prepare(`
    SELECT daily_online_minutes AS online, daily_voice_minutes AS voice,
           daily_games_minutes AS games, daily_spotify_songs AS spotifySongs,
           daily_streaming_minutes AS streaming
    FROM user_stats WHERE user_id = ?
  `).get(userId) as any;

  return {
    online_minutes:  (past.online || 0) + (live?.online || 0),
    voice_minutes:   (past.voice  || 0) + (live?.voice  || 0),
    games_minutes:   (past.games  || 0) + (live?.games  || 0),
    spotify_songs:   (past.spotifySongs || 0) + (live?.spotifySongs || 0),
    streaming_minutes: (live?.streaming || 0), // history only if/when persisted
  };
}
```
> Streaming has no `daily_snapshots` column; monthly streaming is best-effort
> (today live only) unless a future phase adds it. Voice tab does not need it for awards.

**3.2 — Per-category ranking across all users (for the awards):**
```ts
// metricCol: 'online_minutes' | 'games_minutes' | 'spotify_minutes'
// liveCol:   'daily_online_minutes' | 'daily_games_minutes' | 'daily_spotify_songs'
public getMonthlyLeaderboard(metricCol: string, liveCol: string, limit = 50) {
  const monthStart = getPragueMonthStartDateString();
  const today      = getPragueDateString(new Date());

  // Sum past snapshots per user + add today's live counter, then rank.
  return this.db.prepare(`
    WITH past AS (
      SELECT user_id, COALESCE(SUM(${metricCol}),0) AS past_val
      FROM daily_snapshots
      WHERE date >= ? AND date < ?
      GROUP BY user_id
    ),
    live AS (
      SELECT user_id, COALESCE(${liveCol},0) AS live_val
      FROM user_stats
    )
    SELECT u.user_id AS user_id,
           (COALESCE(p.past_val,0) + COALESCE(l.live_val,0)) AS value
    FROM live l
    LEFT JOIN past p ON p.user_id = l.user_id
    JOIN user_stats u ON u.user_id = l.user_id
    WHERE (COALESCE(p.past_val,0) + COALESCE(l.live_val,0)) > 0
    ORDER BY value DESC
    LIMIT ?
  `).all(monthStart, today, limit) as Array<{ user_id: string; value: number }>;
}
```
> Validate the exact `metricCol`→`liveCol` pairs against §Phase 4. Whitelist the
> column names in the caller (do **not** interpolate user input) to avoid SQL
> injection — these are server-chosen constants only.

Import `getPragueMonthStartDateString` and `getPragueDateString` at the top of
`database.ts` (currently `czech-time` may not be imported there — add it).

### Success criteria
- For a chosen user, `getMonthlyTotals` equals a hand-run SQL sum of their
  `daily_snapshots` (date >= month-1st, < today) **plus** their `user_stats`
  `daily_*` values.
- `getMonthlyLeaderboard('online_minutes','daily_online_minutes')` ordering matches
  a manual query.
- No double-count of today (today's snapshot row, if present, is excluded by `date < today`).

---

## Phase 4 — Awards API: `period` param

**Why:** Make `/api/daily-awards` and `/standings` serve daily (unchanged) or
monthly (Phase 3), with monthly titles.

### Files
- `src/app/api/daily-awards/route.ts`
- `src/app/api/daily-awards/standings/route.ts`

### Edits

**4.1 — `/api/daily-awards/route.ts`:**
- Read `const period = searchParams.get('period') === 'monthly' ? 'monthly' : 'daily';`
- Define category config so daily vs monthly differ only in data source + title:

| id | daily title | monthly title | daily column | monthly metric / live col | unit |
|----|-------------|---------------|--------------|---------------------------|------|
| gamer | Pařmen dne | Pařmen měsíce | `daily_games_minutes` | `games_minutes` / `daily_games_minutes` | minut |
| nerd | Nerd dne | Nerd měsíce | `daily_online_minutes` | `online_minutes` / `daily_online_minutes` | minut |
| listener | Posluchač dne | Posluchač měsíce | `daily_spotify_songs` | `spotify_minutes` / `daily_spotify_songs` | písniček |

- **Daily branch:** keep the existing `getWinner` counter queries verbatim.
- **Monthly branch:** call `db.getMonthlyLeaderboard(metric, liveCol, 1)` for the
  winner and `... , large)` or a COUNT for participants; map `user_id`→member via
  the existing `memberMap` (gateway cache) + avatar validation logic (reuse as-is).
- Title/description switch on `period`. Keep `value`/`unit` shape identical so the
  frontend renders unchanged.
- Include `period` in the JSON response for the client to echo.

**4.2 — `/api/daily-awards/standings/route.ts`:**
- Same `period` read + same category→metric mapping.
- Daily branch unchanged (existing `daily_*` queries).
- Monthly branch: `db.getMonthlyLeaderboard(metric, liveCol, 50)` → map to the same
  `StandingsEntry[]` shape (userId, displayName, avatar, value, unit, rank).
- Recompute `statistics` (totalParticipants, totalValue, averageValue) from the
  monthly result set instead of `user_stats WHERE daily_* > 0`.

### Success criteria
- `GET /api/daily-awards` (no param) ≡ pre-change output (regression-safe default).
- `GET /api/daily-awards?period=monthly` returns 3 cards with `...měsíce` titles and
  values equal to Phase-3 leaderboards.
- `GET /api/daily-awards/standings?category=gamer&period=monthly` returns ranked
  monthly minutes; `category=...&period=daily` unchanged.
- Empty-month edge: when no snapshots+live exist, `winner: null` and empty standings
  (no 500s).

---

## Phase 5 — User route: fix the monthly path

**Why:** `timeRange=monthly` currently reads daily-purged session tables (broken,
~2 days). Repoint it at Phase 3.

### File
- `src/app/api/analytics/user/[userId]/route.ts`

### Edits
- For `timeRange === 'monthly'`:
  - **Totals**: replace the `monthly_*` counter reads (`totalGameTime` etc.) with
    `db.getMonthlyTotals(userId)` → map to `totalGameTime`, `totalVoiceTime`,
    `totalSongsPlayed`, `totalScreenShareTime`.
  - **Per-tab lists** (gameSessions / voiceActivity / spotifyActivity / topTracks):
    these are session-derived and **cannot** be recomputed for a full month (rows
    purged). Choose one, consistent with the UI in Phase 7:
    - Preferred: return aggregate **totals** for monthly (the modal's monthly view
      shows summed numbers, not per-session breakdown), and have the frontend hide
      per-session lists in monthly mode; **or**
    - Return the per-day breakdown from `daily_snapshots` (date series) for charts.
  - **Percentiles / serverAverages**: leave `null` for monthly (already are) — the
    UI hides them (Phase 7).
- Keep `1d` and other ranges untouched.
- Echo `timeRange` in the response (already present).

### Success criteria
- `GET /api/analytics/user/<id>?timeRange=monthly` totals equal `getMonthlyTotals`.
- `timeRange=1d` output unchanged vs. pre-change snapshot.
- No reference to `monthly_*` columns remains in this route.

---

## Phase 6 — UI: DailyAwards toggle

**Why:** User-facing switch on the homepage awards section.

### File
- `src/app/components/DailyAwards.tsx` (+ its CSS `daily-awards-redesign.css` if needed)

### Edits
- Add state: `const [period, setPeriod] = useState<'daily'|'monthly'>('daily');`
- Render a segmented control in the section header: `Denní` | `Měsíční`
  (accessible: `role="group"`, `aria-pressed` on buttons, keyboard-operable).
- `fetchAwards`: append `?period=${period}`; refetch on toggle change
  (add `period` to the `useEffect` deps / call site).
- `fetchStandings`: append `&period=${period}` so the standings modal matches the
  selected period.
- Titles come from the API response (Phase 4) — no client-side title logic needed.
- Preserve the existing "only update state if data changed" diffing (reset
  `prevDataRef` when `period` changes so the new period always paints).

### Success criteria
- Default load shows daily awards identical to today.
- Toggling to `Měsíční` re-fetches, shows `...měsíce` titles + monthly values,
  and clicking a card shows monthly standings.
- Toggling back to `Denní` restores daily exactly.
- No layout shift / hydration warnings; control is keyboard + screen-reader usable.

---

## Phase 7 — UI: UserStatsModal toggle

**Why:** Same switch inside the live member modal; hide day-scoped pieces in monthly.

### File
- `src/app/components/UserStatsModal.tsx` (+ `user-stats-modal.css`)
- Possibly `src/app/components/userStats/*Tab.tsx` for conditional rendering

### Edits
- Add state: `const [period, setPeriod] = useState<'daily'|'monthly'>('daily');`
- Add a `Denní`/`Měsíční` segmented control in the modal header near the tab row.
- Data fetch: switch URL between `?timeRange=1d` (daily) and `?timeRange=monthly`
  (monthly). Refetch when `period` changes; reset `prevDataRef`.
- **Monthly mode hides day-scoped UI (decision #8):**
  - Remove/disable the **Achievements** (`Úspěchy`) tab from the `TABS` list when
    `period === 'monthly'` (and if the active tab was Achievements, fall back to
    `overview`).
  - In `OverviewTab`, hide the percentile/server-averages block when monthly
    (data is `null` anyway) — optionally show a subtle note
    `Dostupné v denním zobrazení`.
- Keep focus-trap / Escape / restore-focus behavior intact when the tab list changes.

### Success criteria
- Default modal = daily, identical to today (5 tabs, percentiles shown).
- Monthly mode: quantitative tabs (Přehled/Spotify/Hry/Voice) show monthly totals
  from Phase 5; Achievements tab hidden; percentiles hidden/noted.
- Switching periods refetches and never leaves a stale/empty tab selected.
- Accessibility: toggle and reduced tab set remain keyboard-navigable; no console errors.

---

## Phase 8 — Cleanup (code-only; DB columns stay dormant) — DO LAST, ISOLATED

**Why:** Remove the now-unused, buggy monthly machinery. Highest-risk phase: it
touches the real-time accumulation hot path that has no automated tests. Ship and
verify Phases 1–7 in production first; do this as a separate PR.

### Files
- `src/lib/discord-gateway.ts`
- `src/lib/analytics/service.ts`
- `src/app/api/analytics/reset-monthly/route.ts` (delete)
- `src/app/components/UserAnalyticsModal.tsx` (delete — confirmed dead)
- Possibly `database.ts` `resetMonthlyStats` (leave method or remove callers)

### Edits
- **Gateway (`discord-gateway.ts`)**: remove the rolling-30-day monthly block
  (~lines 632–678 and 739–776 region): the `daysSinceMonthlyReset >= 30` reset and
  the `monthly_* +=`/`Math.max` accumulation. Stop writing `monthly_*` in
  `updateUserStatsInDatabase` (leave columns untouched in SQL → they stay dormant,
  or write nothing to them).
- **Service (`service.ts`)**: remove `Math.max(monthly, daily)` monthly updates in
  the spotify/game/voice update methods (~lines 670–870). Keep daily logic intact.
- **Delete** `/api/analytics/reset-monthly/route.ts` and `UserAnalyticsModal.tsx`.
- Grep to ensure **no remaining reads** of `monthly_*` columns:
  ```bash
  grep -rn "monthly_" src --include="*.ts" --include="*.tsx"
  ```
  (Only dormant column definitions in `database.ts` schema/migration may remain.)
- **Do NOT** `DROP` columns or the `monthly_snapshots` table (SQLite drops risky).

### Success criteria
- `npm run build` clean.
- Daily tracking still works (open app, watch a user's daily counters increment via
  gateway logs).
- New monthly feature (Phases 4–7) still works (reads snapshots, not counters).
- `grep monthly_` shows only dormant schema/migration lines — no runtime reads.
- Manual smoke of `tests/` scripts that touch monthly are updated or removed so they
  don't assert on the deleted machinery.

---

## Cross-cutting verification (after Phases 1–7, before Phase 8)

1. **Consistency check** — pick one active user; confirm awards monthly value and
   the modal's monthly total for the same metric **match** (both now use Phase 3).
2. **Boundary check** — temporarily set the system clock or seed a snapshot dated
   last month; confirm it is **excluded** from "this month."
3. **Empty/new-user** — a user with no activity shows no award and zeroed monthly
   modal totals (no 500s, no NaN).
4. **Default-unchanged** — diff the saved pre-flight JSON for `period=daily` /
   `timeRange=1d` against current output: must be identical.
5. **Month-rollover dry run** — reason through 1st-of-month at the cron time: past
   days fall out of `date >= monthStart`; live counters reset daily; no stale carry.

---

## Commit strategy

- One commit per phase, e.g.:
  - `feat(analytics): add games_minutes to daily_snapshots (Phase 1)`
  - `feat(time): prague calendar-month helpers (Phase 2)`
  - `feat(analytics): monthly aggregation from daily_snapshots (Phase 3)`
  - `feat(awards): period param for daily/monthly awards + standings (Phase 4)`
  - `fix(user-api): recompute monthly from snapshots (Phase 5)`
  - `feat(ui): daily/monthly toggle on DailyAwards (Phase 6)`
  - `feat(ui): daily/monthly toggle on UserStatsModal (Phase 7)`
  - `refactor(analytics): remove dead monthly counter machinery (Phase 8)`
- Phases 1–7 can land together or sequentially; **Phase 8 in its own PR.**

---

## Dependency graph

```
P1 (games_minutes) ─┐
P2 (prague month) ──┼──► P3 (aggregation) ──► P4 (awards API) ──► P6 (awards UI)
                    │                       └► P5 (user API)   ──► P7 (modal UI)
P8 (cleanup) depends on P4–P7 being shipped & verified in prod.
```
