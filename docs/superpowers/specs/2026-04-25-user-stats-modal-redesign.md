# User Stats Modal — Redesign Spec

**Date:** 2026-04-25
**Status:** Approved (brainstorm complete, awaiting implementation plan)
**Scope:** Restructure + restyle `UserStatsModal` to match the lounge aesthetic established by `community-redesign.css` and the prior hero / KompG Trax redesigns. Visual overhaul plus targeted structural refactor; data layer untouched.

## 1. Goals & non-goals

### Goals

- Replace the dated Tailwind-and-emoji styling with a lounge-native dark UI that's coherent with the rest of the homepage.
- Improve information hierarchy: a numbers-led overview hero that anchors the modal in one glance.
- Modernize the Achievements view as a "trophy case" with clear locked / unlocked states.
- Make the file maintainable. The current single 852-line file is the largest barrier to iteration.

### Non-goals

- No changes to `/api/analytics/user/[userId]` or any data layer code.
- No new analytics fields, no new achievements, no chart libraries.
- No changes to `MostActiveMembers` or other components that open this modal.
- No new keyboard-shortcut overlays beyond standard `Escape` / arrow tab navigation.

## 2. Architecture

```
src/app/components/
  UserStatsModal.tsx            (orchestrator: state, fetch, frame, tab switcher — focused, no inlined tab content)
  user-stats-modal.css          (scoped lounge styles, root class .user-stats-lounge)
  userStats/
    achievements.ts             (ACHIEVEMENTS array + calculateAchievementProgress, pure)
    OverviewTab.tsx
    SpotifyTab.tsx
    GamingTab.tsx
    VoiceTab.tsx
    AchievementsTab.tsx
    formatters.ts               (formatOnlineTime, formatDate, getSessionTypeIcon, getPercentileBadgeClass)
    types.ts                    (UserStats, Achievement, UserStatsModalProps)
```

**Why this split, not smaller:** the achievement logic is genuinely independent (pure functions), and each tab is a self-contained content block sharing only the `stats` prop. Splitting them lets us redesign and test each tab without one giant diff. The modal-level concerns (open/close, fetch loop, header, tab nav) stay in `UserStatsModal.tsx`.

**Styling approach:** plain CSS file scoped under `.user-stats-lounge`, mirroring the `community-redesign.css` pattern. No CSS modules. Tailwind classes are removed from the modal chrome and tab content; they remain only inside live components that may be embedded later (none today).

## 3. Modal frame

### Container

- `position: fixed; inset: 0`, scrim `rgba(0, 0, 0, 0.55)` with `backdrop-filter: blur(6px)`.
- Desktop: centered, `max-width: 720px`, `max-height: 85vh`.
- Mobile (≤640px): bottom sheet, drag handle preserved, `max-height: 90vh`, slides up from bottom on open.
- 3px gradient strip on top edge: `linear-gradient(90deg, #5865f2, #00ffff, #ff6ec7, #ff8c00)` — matches `.community-redesign .lounge-feature::before` for visual continuity.

### Header (compact, ~64px)

`avatar` → `display name + meta` → flex spacer → `live pill` → `close button`

- **Avatar**: 40×40, 1px white outline, `SafeImage` fallback preserved.
- **Display name**: `Exo 2`, 800, 16px.
- **Meta line**: mono, 9px, faint, uppercase: `Dnešní aktivita · 25.04.`. Date is the local date the modal opened.
- **Live pill**: `aria-live="polite"`, displays one of three states:
  - Loading (initial): pulsing dot in muted gray + "Načítání" mono label.
  - OK: green dot (`#34d399`) with glow + "Live" mono label.
  - Error: red dot + "Offline" mono label.
- **Close button**: 44×44 hit target, `rgba(255,255,255,.06)` background, X icon, `aria-label="Zavřít"`.

### Tab strip

- 5 tabs in fixed order: Přehled · Spotify · Hry · Voice · Úspěchy.
- Each tab is a pill: `padding: 10px 14px`, `border-radius: 8px`. Active state has subtle white-alpha background and a 2px gradient underline `linear-gradient(90deg, #00ffff, #ff6ec7)` flush with the strip's bottom border.
- Tabs scroll horizontally on mobile (no wrap). Labels hide under sm breakpoint; icons only.
- ARIA: `role="tablist"` on the strip, `role="tab" aria-selected` on each, arrow-key navigation between tabs.

### Footer

- Single-line note: `Data se resetují každý den o půlnoci (CET)`, mono, 9px, faint, centered.

## 4. Overview tab (direction A — numbers-led hero)

In display order:

1. **Hero block**
   - Gradient headline: `formatOnlineTime(stats.data.totals.totalOnlineTime)`, `Exo 2`, font-weight 900, `clamp(36px, 12vw, 52px)`, gradient text `linear-gradient(135deg, #00ffff 0%, #ff6ec7 60%, #ff8c00 100%)`.
   - Subtitle: `online dnes`.
   - Mono caption (only when `serverAverages` present): `srovnání s {totalActiveUsers} aktivními · live tracking`.

2. **4 mini-tiles row** — `display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px` (collapses to 2×2 on ≤640px).

   Order: **Hry · Voice · Spotify · Stream**. Each tile shows label (mono uppercase), big number (`Exo 2` 22px in the tile's accent color), and one comparison row:
   - `↑ +Xm vs průměr` pill (sage `#10b981` text on tinted bg) when `value - avg > 0`.
   - `↓ Xm vs průměr` pill (red text) when `< 0`.
   - `Top X%` pill when percentile is provided. Tier coloring preserved from current `getPercentileBadgeClass` mapping (`≥90` orange, `≥75` purple, `≥50` blue, else faint).
   - Stream tile has no comparison data; renders the number alone with a faint `bez srovnání` mono caption.

3. **Další statistiky strip** — single faint-bordered row with 4 micro-stats: Různých her · Voice kanálů · Různých interpretů · Screen share. Smaller text than hero tiles, no progress bars or pills.

4. **Timeline list** (`Dnešní aktivita`) — up to 8 most-recent sessions from `stats.data.recentSessions`. Each row:
   - `HH:MM` mono time (54px column).
   - Category-color dot (8px, glowing): game `#5865f2`, voice `#ff8c00`, spotify `#ff6ec7`, default `#00ffff`.
   - Name + optional `details` line.
   - Duration `formatOnlineTime(...)` right-aligned.
   - Rows separated by 1px dashed `rgba(255,255,255,.08)`.

## 5. Spotify, Hry, Voice tabs

All three share a common skeleton — only data and accent color vary.

**Skeleton**:

- **Tab hero block**: title left (`Exo 2` 18px) + "celkem" mono label; right side: 2 large stats inline. 1px gradient divider in the tab's accent color separates the hero from the lists below.
- **Ranked list panel(s)**: rows with `#01–#99` mono rank pill, name + optional subtitle, primary metric on the right + tiny session count below.
- **Footer caption**: tiny `.lounge-footnote` mono row (`Časy jsou kumulované …`), no separator.
- **Empty state**: single faint card with category emoji + one mono line.

### Spotify (accent `#ff6ec7`)

- Hero stats: `Celkem písní` (`stats.data.totals.totalSongsPlayed`) + `Různých interpretů` (`artistsListened` or fallback to `spotifyActivity.length`).
- "Top Interpreti" list from `spotifyActivity`: `#01 · {artist}` → `{plays_count} písní`. Pluralization preserved.
- "Top písně" list from `topTracks`: `#01 · {track_name}` (subtitle `{artist}`) → `{play_count}×`.

### Hry (accent `#5865f2`)

- Hero stats: `Celkový čas` (`formatOnlineTime(totalGameTime)`) + `Různých her` (`gamesPlayed` or `gameSessions.length`).
- "Hry" list from `gameSessions`: `#01 · {game_name}` → `{formatOnlineTime(total_minutes)}` + `{session_count} sessions`.

### Voice (accent `#ff8c00`)

- Hero stats: `Celkový čas` (`formatOnlineTime(totalVoiceTime)`) + `Screen share` (`formatOnlineTime(totalScreenShareTime)`).
- "Kanály" list from `voiceActivity`: `#01 · {channel_name}` → `{formatOnlineTime(total_minutes)}` + `{session_count} sessions · {formatOnlineTime(screen_share_minutes)} share` (share clause only when `>0`).

### Conventions across the three

- Rank pill: 28×20px, mono, `rgba(255,255,255,.06)` neutral. First-place rank pill gets the tab's accent color tint.
- List length: render every row the API returns (matches current behavior); the modal body's vertical scroll handles overflow.
- No vs-průměr / percentile in tab heroes — those live only in the Overview tile row.

## 6. Achievements tab (direction A — trophy badge grid)

- **Section header**: `🏆 Úspěchy` left, `{unlockedCount} / 8 odemčeno` mono right.
- **Grid**: `display: grid; grid-template-columns: 1fr 1fr; gap: 10px`. Collapses to 1 col under 540px.
- **Sort order** (single grid, no separator headers): unlocked first grouped by category (gaming → voice → spotify → special), then locked sorted by progress descending.
- **Badge — common**: 12px radius, 1px white-alpha border, padded card. Top edge has a 2px solid stripe in the achievement's category color. Centered layout: emoji icon (36px) → title (`Exo 2` 13px) → description (11px, faint) → status block at bottom.
- **Unlocked**: full-color emoji; cyan halo `box-shadow: 0 0 0 1px rgba(0,255,255,.12), 0 8px 24px rgba(0,255,255,.08)`; status block is a centered "✦ Dokončeno" pill (cyan tint).
- **Locked**: emoji `filter: grayscale(1) brightness(.6); opacity: .55`; status block is a 4px progress bar with `current / threshold` mono caption and `%` on the right.
- **Special category** (`night-owl`, `early-bird`, etc. — no countable threshold): renders `Splněno!` or `Zkus to dnes večer.` instead of a fraction.
- No empty state — all 8 badges always render.

## 7. Color system

Matches `community-redesign.css` tokens; the modal CSS re-declares them under its scope so palette stays in lock-step.

| Surface / activity         | Color      | Source token         |
|----------------------------|------------|----------------------|
| Hry                        | `#5865f2`  | `--lounge-discord`   |
| Voice                      | `#ff8c00`  | `--lounge-orange`    |
| Spotify                    | `#ff6ec7`  | `--lounge-pink`      |
| Stream / special / accent  | `#00ffff`  | `--lounge-cyan`      |
| OK / live / done           | `#10b981`  | `--lounge-sage`      |
| Background                 | `#07070d`  | `--lounge-bg`        |
| Panel surface              | `rgba(11, 12, 20, 0.86)` | `--lounge-panel` |
| Panel surface (soft)       | `rgba(18, 19, 31, 0.76)` | `--lounge-panel-soft` |
| Body text                  | `#ffffff`  | `--lounge-text`      |
| Muted body text            | `#d8d8e8`  | `--lounge-muted`     |
| Faint text / mono labels   | `#6b6b80`  | `--lounge-faint`     |

Every color cue must have a textual or iconographic companion. Pills carry text ("Top 12%", "Dokončeno"); dots accompany category labels.

## 8. Motion

- **Open** — scrim fades in 160ms; desktop modal scales `0.96 → 1` + fade 200ms ease-out; mobile slides up from bottom 280ms ease-out. Drag handle is a static visual cue (no swipe-to-dismiss).
- **Tab switch** — 120ms opacity crossfade on the tab body. No content slide.
- **Refresh** — silent. The existing `prevDataRef` JSON-diff prevents flicker when the 30s interval fires; the only visible signal is the live pill's pulsing dot.
- **Reduced motion** — wrapped in `@media (prefers-reduced-motion: reduce)`: animations disabled, transitions reduced to ≤80ms fades only.

## 9. Mobile (≤640px)

- Bottom sheet preserved with drag handle.
- Tab strip: horizontal scroll, no wrap, icons-only labels.
- Hero tiles: 2 cols (2×2 layout).
- Achievement grid: 1 col under 540px.
- Headline number: `clamp(36px, 12vw, 48px)`.
- Modal padding tightens to 14–16px.

## 10. Accessibility

- Panel: `role="dialog"`, `aria-modal="true"`, `aria-labelledby={headingId}`.
- Focus is trapped inside the modal while open; it returns to the triggering element on close.
- `Escape` closes the modal.
- Tab nav: `role="tablist"` / `role="tab"` / `role="tabpanel"`. Arrow keys move between tabs; `Tab` moves into the active panel.
- Live pill wrapped in `aria-live="polite"`; state-change text is announced.
- All color-coded states (percentile pills, comparison arrows, locked/unlocked badges) carry text or icon companions; color is never the only signifier.

## 11. Loading & error states

- **Initial load**: the modal always opens on the Overview tab, so the only tab that needs a skeleton is Overview. Skeleton: shimmering placeholders for the gradient headline, the 4 hero tiles, the "Další statistiky" strip, and 4 timeline rows. The other tabs render normally once data lands (the modal can't be opened on a non-Overview tab).
- **Refresh**: silent; no shimmer on the 30s interval (current `prevDataRef` behavior preserved).
- **Error**: lounge-styled card with `❌ {message}` and a retry button styled as `.lounge-button` ghost variant. Same `fetchUserStats(true)` retry semantics.

## 12. Out of scope (recap)

- API endpoints / data layer.
- New analytics fields, achievements, or charts.
- `MostActiveMembers` or any callsite that opens the modal.
- Adding a "weekly" or "monthly" time range — current modal only shows daily and that stays.

## 13. References

- Brainstorming session: `.superpowers/brainstorm/320-1777120491/` (mockups: `overview-direction.html`, `frame-direction.html`, `achievements-direction.html`).
- Aesthetic source of truth: `src/app/community-redesign.css`.
- Existing modal under redesign: `src/app/components/UserStatsModal.tsx`.
