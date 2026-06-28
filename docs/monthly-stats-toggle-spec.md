# Feature Spec: Daily / Monthly Stats Toggle

**Status:** Verified & ready for implementation handoff
**Author:** Grilling session with Martin Penkava
**Date:** 2026-06-28

---

## 1. Goal

Add a **daily/monthly switch** to the two analytics surfaces so users can flip
between "today" and "this month" figures:

1. **Daily Awards homepage section** (`DailyAwards.tsx` + `/api/daily-awards` + `/api/daily-awards/standings`)
2. **User stats modal** (`UserStatsModal.tsx`, the live tabbed modal opened from `MostActiveMembers`)

> Monthly counters/columns already exist in the DB but are **abandoned** by this
> design (see §4). This feature does **not** build on them.

---

## 2. Verified decisions (from grilling)

| # | Decision | Choice |
|---|----------|--------|
| 1 | What "implement monthly" means | A daily/monthly toggle on existing surfaces |
| 2 | Toggle target | **Both** the awards section AND the user modal |
| 3 | Meaning of "monthly" | **Calendar month**, resets on the 1st, Prague time |
| 4 | Source of truth | **Recompute from `daily_snapshots`** (sum over the calendar month) |
| 5 | Durable source fix | **Add `games_minutes` column** to `daily_snapshots`; sum snapshots |
| 6 | Current (in-progress) month | **Include today live** (snapshots for past days + today's live `daily_*`) |
| 7 | Old monthly machinery | **Clean up in code**, but leave DB columns/tables dormant (no drops) |
| 8 | Modal day-scoped pieces (Achievements, percentiles/averages) | **Hide them in monthly mode** |
| 9 | Czech wording | Toggle `Denní` / `Měsíční`; titles `Pařmen/Nerd/Posluchač měsíce`; default = `Denní` |
| 10 | Nightly reset cron | **Confirmed** — external cron POSTs `/api/analytics/reset-daily` nightly |

---

## 3. Verified codebase facts (the "why")

- **Award categories** (`/api/daily-awards`): 3 cards — `gamer` (`daily_games_minutes`,
  "Pařmen dne"), `nerd` (`daily_online_minutes`, "Nerd dne"), `listener`
  (`daily_spotify_songs`, "Posluchač dne"). Each computes a winner + participant
  count; standings route returns top-50 per category. All hardcode `daily_*`.
- **Live modal** is `UserStatsModal.tsx` (tabs: Přehled/Spotify/Hry/Voice/Úspěchy),
  fetches `/api/analytics/user/{id}?timeRange=1d`. `UserAnalyticsModal.tsx` is
  **dead code** (not imported anywhere).
- **Session tables are purged daily** by `/reset-daily`
  (`DELETE FROM {game,voice,spotify}_sessions WHERE date(start_time) < yesterday`).
  → Only ~2 days retained; cannot aggregate a month from them.
- **`daily_snapshots` is the only durable per-day store** (never deleted, only
  zeroed for the current day). Columns today: `online_minutes`, `voice_minutes`,
  `games_played`, `spotify_minutes`.
  - ⚠️ `spotify_minutes` actually stores **play count** (`plays_count`), not minutes.
  - ⚠️ `games_minutes` is **NOT stored** — only `games_played` (distinct game count).
- **Existing monthly counters are buggy:** `service.ts` accumulates monthly
  voice/games/spotify via `Math.max(monthly, daily)` → captures the single biggest
  day, not the month's sum. Online uses diff-based summing (~ok). Gateway/service
  auto-reset monthly on a **rolling 30-day per-user** basis, while `/reset-monthly`
  resets on **calendar-month** — two conflicting models.
- **Modal `timeRange=monthly` is already broken:** it queries the daily-purged
  session tables, so "monthly" only ever shows ~2 days.
- **Daily reset is cron-driven** (confirmed). The full snapshot (voice/games/
  spotify) is written by the `/reset-daily` route, so historical `daily_snapshots`
  has online/voice/spotify-plays history. Gamer **minutes** has no history (column
  doesn't exist yet) → accurate only from ship date forward.

---

## 4. Implementation plan (phased)

### Phase 1 — Durable source: `games_minutes` in `daily_snapshots`
- **Migration** (`database.ts`): `ALTER TABLE daily_snapshots ADD COLUMN games_minutes INTEGER DEFAULT 0;`
  (guarded like existing migrations). Update `DailySnapshot` type and
  `upsertDailySnapshot` to read/write `games_minutes`.
- **`/reset-daily` route**: it already computes `gameStats.total_minutes` — persist
  it into the new `games_minutes` field when upserting yesterday's snapshot.
- **`service.saveDailyOnlineTime` / any live snapshot writers**: preserve existing
  `games_minutes` on upsert (don't clobber to 0).
- ✅ Success: new snapshots carry true gaming minutes; existing rows default 0.

### Phase 2 — Prague calendar-month helpers (`czech-time.ts`)
- Add `getPragueMonthStartDateString(date)` → `YYYY-MM-01` (Prague).
- Add `getPragueDateString` is already present; ensure a "today" boundary helper.
- (Optional, for cleanup phase) `hasPragueMonthChanged(prev, now)`.
- ✅ Success: helpers return correct Prague month boundaries incl. DST.

### Phase 3 — Monthly aggregation (new DB/service method)
- New method e.g. `getMonthlyTotals(userId, monthStartDate, today)`:
  `SUM(daily_snapshots)` for `date >= monthStart AND date < today`,
  **plus** today's live `daily_*` counters from `user_stats`
  (avoid double-counting today's online, which is also written live to today's snapshot).
- Provide a per-category all-users variant for awards ranking
  (GROUP BY user_id, SUM, ORDER BY metric DESC).
- Metric mapping:
  - online → `SUM(online_minutes)` + today `daily_online_minutes`
  - games minutes → `SUM(games_minutes)` + today `daily_games_minutes`
  - spotify songs → `SUM(spotify_minutes)` (play count) + today `daily_spotify_songs`
  - voice → `SUM(voice_minutes)` + today `daily_voice_minutes`
- ✅ Success: monthly totals equal hand-summed snapshot data + today.

### Phase 4 — Awards API: `period` param
- `/api/daily-awards` and `/api/daily-awards/standings` accept `?period=daily|monthly`
  (default `daily`).
- `daily` → unchanged (reads `daily_*` counters).
- `monthly` → uses Phase 3 ranking; titles → `Pařmen/Nerd/Posluchač měsíce`.
- ✅ Success: both endpoints return correct, mutually-consistent monthly standings.

### Phase 5 — User route: fix monthly path
- Rewrite `/api/analytics/user/[userId]` `timeRange=monthly` to use Phase 3
  snapshot aggregation instead of purged session tables (for totals + per-tab data).
- ✅ Success: modal monthly numbers reflect the real calendar month.

### Phase 6 — UI: DailyAwards toggle
- Add `Denní`/`Měsíční` segmented control (default `Denní`) in the section header.
- Thread `period` into both fetches; swap card titles for monthly.
- ✅ Success: toggling re-fetches and re-labels; daily view unchanged.

### Phase 7 — UI: UserStatsModal toggle
- Add `Denní`/`Měsíční` control in the modal header near the tabs (default `Denní`).
- Switch fetch between `timeRange=1d` and `timeRange=monthly`.
- In monthly mode: **hide the Achievements tab** and the percentile/server-averages
  block (or show a small "dostupné v denním zobrazení" note).
- ✅ Success: quantitative tabs reflect period; day-scoped pieces hidden in monthly.

### Phase 8 — Cleanup (code-only; LEAVE DB columns dormant) — do LAST, isolated
- Remove `Math.max` monthly accumulation + rolling-30-day monthly reset logic in
  `discord-gateway.ts` and `service.ts`.
- Delete `/api/analytics/reset-monthly` route and dead `UserAnalyticsModal.tsx`.
- Stop reading `monthly_*` columns anywhere.
- **Do NOT** drop columns or `monthly_snapshots` table (SQLite drops are risky).
- ⚠️ Touches the real-time hot path; there are **no automated tests** — verify by
  hand and keep this phase separate/reversible.
- ✅ Success: build clean, daily + new monthly both work, no `monthly_*` reads remain.

---

## 5. Risks / caveats

- **No backfill for gamer minutes** — monthly "Pařmen měsíce" is accurate only from
  the day Phase 1 ships forward (old sessions already deleted). All other monthly
  metrics have history.
- **Hot-path edits (Phase 8)** are the riskiest change in the app and untested by
  automation. Ship Phases 1–7 first; do Phase 8 as an isolated follow-up.
- **`spotify_minutes` misnomer** — it holds play count. Keep the existing semantics;
  don't "fix" the name without auditing all readers.
- **Today double-count** — today's online is written live to today's snapshot AND
  lives in `daily_online_minutes`; the aggregation must exclude today's snapshot row
  and add the live counter (or vice-versa) — pick one consistently.

---

## 6. Out of scope

- New award categories (voice/streaming awards).
- Historical month browsing (month picker) — current month only.
- Dropping DB columns / destructive migrations.
