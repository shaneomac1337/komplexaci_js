# User Stats Modal Lounge Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle and restructure `src/app/components/UserStatsModal.tsx` to match the lounge aesthetic established by `community-redesign.css`, splitting the 852-line file into focused modules per the spec at `docs/superpowers/specs/2026-04-25-user-stats-modal-redesign.md`.

**Architecture:** A pure-extraction refactor first (types, formatters, achievements logic moved out of the monolith with no behavior change), then a scoped CSS file is added, then the modal chrome is restyled, then each tab's content is replaced one task at a time. Skeleton/error/a11y/motion are addressed in dedicated tasks at the end. Every task ends in a committable state where the modal still works.

**Tech Stack:** Next.js 15 (Turbopack dev), React 19, TypeScript 5, plain scoped CSS (no CSS modules, Tailwind kept only outside the modal). No test framework in repo — verification is `npx tsc --noEmit`, `npm run lint`, `npm run build`, plus manual checks in the dev server. Real data lives behind `/api/analytics/user/[userId]?timeRange=1d`; the modal is opened by clicking a row in `MostActiveMembers`.

**File structure (target):**

```
src/app/components/
  UserStatsModal.tsx               (orchestrator — fetch loop, frame, tab switch)
  user-stats-modal.css             (scoped lounge styles, root .user-stats-lounge)
  userStats/
    achievements.ts                (ACHIEVEMENTS + calculateAchievementProgress, pure)
    formatters.ts                  (formatOnlineTime, formatDate, getSessionTypeIcon, getPercentileBadgeClass)
    types.ts                       (UserStats, Achievement, UserStatsModalProps)
    OverviewTab.tsx
    SpotifyTab.tsx
    GamingTab.tsx
    VoiceTab.tsx
    AchievementsTab.tsx
```

---

## Task 0: Extract types and formatters to userStats/

**Goal:** Move pure data shapes and formatting helpers out of the modal file with zero behavior change. Sets up the directory + import surface that later tasks will populate.

**Files:**
- Create: `src/app/components/userStats/types.ts`
- Create: `src/app/components/userStats/formatters.ts`
- Modify: `src/app/components/UserStatsModal.tsx` (replace inline interfaces with imports, replace inline helpers with imports)

**Acceptance Criteria:**
- [ ] `userStats/types.ts` exports `UserStatsModalProps`, `UserStats`, `Achievement` (plus the small inner types `UserStatsTotals`, etc., if useful — keep flat is fine).
- [ ] `userStats/formatters.ts` exports `formatOnlineTime`, `formatDate`, `getSessionTypeIcon`, `getPercentileBadgeClass`.
- [ ] `UserStatsModal.tsx` no longer declares any of the extracted interfaces or helpers; it imports them.
- [ ] Modal still opens, fetches, and renders identically (no visual change in this task).

**Verify:**
```
npx tsc --noEmit
npm run lint
```
Then `npm run dev`, click a member in MostActiveMembers, confirm the modal still opens with all 5 tabs working.

**Steps:**

- [ ] **Step 1: Create `src/app/components/userStats/types.ts`**

```ts
export interface UserStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  displayName: string;
  avatar: string | null;
}

export interface UserStats {
  userId: string;
  timeRange: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  data: {
    totals: {
      totalSongsPlayed: number;
      totalOnlineTime: number;
      totalGameTime: number;
      totalVoiceTime: number;
      totalScreenShareTime: number;
      gamesPlayed: number;
      voiceChannelsUsed: number;
      artistsListened: number;
    };
    spotifyActivity: Array<{
      artist: string;
      plays_count: number;
      unique_tracks: number;
    }>;
    topTracks: Array<{
      track_name: string;
      artist: string;
      play_count: number;
    }>;
    gameSessions: Array<{
      game_name: string;
      total_minutes: number;
      session_count: number;
    }>;
    voiceActivity: Array<{
      channel_name: string;
      total_minutes: number;
      screen_share_minutes: number;
      session_count: number;
    }>;
    recentSessions: Array<{
      type: 'game' | 'voice' | 'spotify';
      name: string;
      start_time: string;
      duration_minutes: number;
      details?: string;
    }>;
    serverAverages?: {
      avgGameTime: number;
      avgVoiceTime: number;
      avgSongsPlayed: number;
      totalActiveUsers: number;
    };
    percentiles?: {
      gameTimePercentile: number;
      voiceTimePercentile: number;
      songsPlayedPercentile: number;
    };
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  threshold: number;
  category: 'gaming' | 'voice' | 'spotify' | 'special';
}
```

- [ ] **Step 2: Create `src/app/components/userStats/formatters.ts`**

```ts
export const formatOnlineTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getSessionTypeIcon = (type: string): string => {
  switch (type) {
    case 'game':
      return '🎮';
    case 'voice':
      return '🎤';
    case 'spotify':
      return '🎵';
    default:
      return '📊';
  }
};

export const getPercentileBadgeClass = (percentile: number): string => {
  if (percentile >= 90) return 'bg-yellow-500/20 text-yellow-400';
  if (percentile >= 75) return 'bg-purple-500/20 text-purple-400';
  if (percentile >= 50) return 'bg-blue-500/20 text-blue-400';
  return 'bg-gray-500/20 text-gray-400';
};
```

- [ ] **Step 3: Replace inline declarations in `UserStatsModal.tsx`**

At the top of the file, replace the existing interface declarations and the four helper functions:

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import SafeImage from './SafeImage';
import type {
  UserStatsModalProps,
  UserStats,
  Achievement,
} from './userStats/types';
import {
  formatOnlineTime,
  formatDate,
  getSessionTypeIcon,
  getPercentileBadgeClass,
} from './userStats/formatters';
```

Then **delete** the original `interface UserStatsModalProps`, `interface UserStats`, `interface Achievement`, and the four helper-function `const` declarations from `UserStatsModal.tsx`. Everything else in the file stays untouched.

- [ ] **Step 4: Run verification**

```
npx tsc --noEmit
npm run lint
```
Both should pass with zero new diagnostics. Then start `npm run dev`, click a member in the MostActiveMembers list to open the modal, and confirm every tab still works (Přehled, Spotify, Hry, Voice, Úspěchy).

- [ ] **Step 5: Commit**

```
git add src/app/components/userStats/types.ts src/app/components/userStats/formatters.ts src/app/components/UserStatsModal.tsx
git commit -m "Extract UserStatsModal types and formatters to userStats/ folder"
```

---

## Task 1: Extract achievements logic to userStats/achievements.ts

**Goal:** Move the achievements array and progress-calculation logic out of the modal. The modal becomes the consumer; the rules become a pure module.

**Files:**
- Create: `src/app/components/userStats/achievements.ts`
- Modify: `src/app/components/UserStatsModal.tsx`

**Acceptance Criteria:**
- [ ] `achievements.ts` exports `ACHIEVEMENTS` and three pure functions: `calculateAchievementProgress(achievement, stats)`, `getUnlockedAchievements(stats)`, `getInProgressAchievements(stats)` (latter two take stats explicitly — no closures over modal state).
- [ ] `UserStatsModal.tsx` imports from this file; the inline `ACHIEVEMENTS` array and the three functions are removed from the modal.
- [ ] Achievements tab still renders the same unlocked / in-progress lists with the same progress percentages as before this task.

**Verify:**
```
npx tsc --noEmit
npm run lint
npm run build
```
Then `npm run dev`, open the modal, switch to Úspěchy tab, confirm the unlocked count and in-progress percentages match what was visible before this task.

**Steps:**

- [ ] **Step 1: Create `src/app/components/userStats/achievements.ts`**

```ts
import type { Achievement, UserStats } from './types';

export const ACHIEVEMENTS: Achievement[] = [
  // Gaming
  { id: 'marathon-gamer', title: 'Maratonec', description: 'Hraj 6+ hodin v jednom dni', icon: '🎮', threshold: 360, category: 'gaming' },
  { id: 'game-variety', title: 'Všeuměl', description: 'Zahraj 5 různých her za den', icon: '🎲', threshold: 5, category: 'gaming' },

  // Voice
  { id: 'social-butterfly', title: 'Společenský', description: '10+ hodin ve voice za den', icon: '🎤', threshold: 600, category: 'voice' },
  { id: 'streamer', title: 'Streamer', description: '2+ hodiny streamování za den', icon: '📺', threshold: 120, category: 'voice' },

  // Spotify
  { id: 'music-lover', title: 'Meloman', description: '100+ skladeb za den', icon: '🎵', threshold: 100, category: 'spotify' },
  { id: 'dj', title: 'DJ', description: '20+ různých interpretů za den', icon: '🎧', threshold: 20, category: 'spotify' },

  // Special
  { id: 'night-owl', title: 'Noční sova', description: 'Aktivní po půlnoci', icon: '🦉', threshold: 1, category: 'special' },
  { id: 'early-bird', title: 'Ranní ptáče', description: 'Aktivní před 6:00', icon: '🐦', threshold: 1, category: 'special' },
];

export interface AchievementProgress {
  current: number;
  unlocked: boolean;
  progress: number;
}

export const calculateAchievementProgress = (
  achievement: Achievement,
  stats: UserStats | null
): AchievementProgress => {
  if (!stats) return { current: 0, unlocked: false, progress: 0 };

  let current = 0;

  switch (achievement.id) {
    case 'marathon-gamer':
      current = stats.data.totals.totalGameTime;
      break;
    case 'game-variety':
      current = stats.data.totals.gamesPlayed || stats.data.gameSessions?.length || 0;
      break;
    case 'social-butterfly':
      current = stats.data.totals.totalVoiceTime;
      break;
    case 'streamer':
      current = stats.data.totals.totalScreenShareTime || 0;
      break;
    case 'music-lover':
      current = stats.data.totals.totalSongsPlayed;
      break;
    case 'dj':
      current = stats.data.totals.artistsListened || stats.data.spotifyActivity?.length || 0;
      break;
    case 'night-owl':
      current = stats.data.recentSessions?.some((session) => {
        const hour = new Date(session.start_time).getHours();
        return hour >= 0 && hour < 6;
      }) ? 1 : 0;
      break;
    case 'early-bird':
      current = stats.data.recentSessions?.some((session) => {
        const hour = new Date(session.start_time).getHours();
        return hour >= 4 && hour < 6;
      }) ? 1 : 0;
      break;
    default:
      current = 0;
  }

  const unlocked = current >= achievement.threshold;
  const progress = Math.min((current / achievement.threshold) * 100, 100);

  return { current, unlocked, progress };
};

export const getUnlockedAchievements = (stats: UserStats | null): Achievement[] =>
  ACHIEVEMENTS.filter((achievement) => calculateAchievementProgress(achievement, stats).unlocked);

export const getInProgressAchievements = (stats: UserStats | null): Achievement[] =>
  ACHIEVEMENTS
    .filter((achievement) => !calculateAchievementProgress(achievement, stats).unlocked)
    .sort((a, b) => calculateAchievementProgress(b, stats).progress - calculateAchievementProgress(a, stats).progress);
```

- [ ] **Step 2: Update imports in `UserStatsModal.tsx`**

Add to the top:

```tsx
import {
  ACHIEVEMENTS,
  calculateAchievementProgress,
  getUnlockedAchievements,
  getInProgressAchievements,
} from './userStats/achievements';
```

- [ ] **Step 3: Delete the inline declarations**

In `UserStatsModal.tsx`, remove:
1. The `const ACHIEVEMENTS: Achievement[] = [...]` block.
2. The `calculateAchievementProgress` function (currently a closure over `stats`).
3. The `getUnlockedAchievements` and `getInProgressAchievements` functions.

- [ ] **Step 4: Update call sites**

The old `calculateAchievementProgress(achievement)` calls inside the achievements tab need a second `stats` argument. Replace every such call:

Before:
```tsx
const { current } = calculateAchievementProgress(achievement);
```

After:
```tsx
const { current } = calculateAchievementProgress(achievement, stats);
```

Same change for `progress` destructuring elsewhere in the achievements tab. Also update the two `getUnlockedAchievements()` and `getInProgressAchievements()` calls to pass `stats`:

```tsx
{getUnlockedAchievements(stats).length > 0 && (
  // ...
  {getUnlockedAchievements(stats).map((achievement) => {
```

```tsx
{getInProgressAchievements(stats).length > 0 && (
  // ...
  {getInProgressAchievements(stats).map((achievement) => {
```

- [ ] **Step 5: Run verification**

```
npx tsc --noEmit
npm run lint
npm run build
```

Then `npm run dev`, open modal, Úspěchy tab — confirm unlocked count and in-progress percentages are unchanged.

- [ ] **Step 6: Commit**

```
git add src/app/components/userStats/achievements.ts src/app/components/UserStatsModal.tsx
git commit -m "Extract UserStatsModal achievements logic to pure module"
```

---

## Task 2: Create scoped lounge CSS shell

**Goal:** Add `user-stats-modal.css` with the lounge tokens, scrim, panel, and basic frame structure. Imported but no JSX changes yet — sets up the styling surface that Task 3 will switch to.

**Files:**
- Create: `src/app/components/user-stats-modal.css`
- Modify: `src/app/components/UserStatsModal.tsx` (add import)

**Acceptance Criteria:**
- [ ] CSS file declares the lounge custom properties and scrim/panel base classes scoped to `.user-stats-lounge`.
- [ ] Modal still works exactly as before (no JSX uses the new classes yet).
- [ ] `npm run build` passes (rules out CSS parse errors).

**Verify:**
```
npm run build
```
Then `npm run dev`, open modal, confirm visual output is unchanged from the previous task.

**Steps:**

- [ ] **Step 1: Create `src/app/components/user-stats-modal.css`**

```css
/* ================================================================
   User Stats Modal — lounge redesign
   Scoped under .user-stats-lounge so legacy modal markup is unaffected.
   ================================================================ */

.user-stats-lounge {
  --lounge-bg: #07070d;
  --lounge-bg-2: #0a0a14;
  --lounge-panel: rgba(11, 12, 20, 0.92);
  --lounge-panel-soft: rgba(18, 19, 31, 0.76);
  --lounge-line: rgba(255, 255, 255, 0.1);
  --lounge-line-strong: rgba(255, 255, 255, 0.17);
  --lounge-text: #ffffff;
  --lounge-muted: #d8d8e8;
  --lounge-faint: #6b6b80;
  --lounge-discord: #5865f2;
  --lounge-cyan: #00ffff;
  --lounge-pink: #ff6ec7;
  --lounge-orange: #ff8c00;
  --lounge-sage: #10b981;
  --lounge-error: #f87171;
  --lounge-font-display: 'Exo 2', system-ui, sans-serif;
  --lounge-font-body: 'Roboto', system-ui, sans-serif;
  --lounge-font-mono: 'JetBrains Mono', ui-monospace, monospace;
}

/* Scrim covers the viewport. */
.user-stats-lounge.scrim {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  font-family: var(--lounge-font-body);
  color: var(--lounge-text);
}

@media (min-width: 641px) {
  .user-stats-lounge.scrim {
    align-items: center;
    padding: 16px;
  }
}

/* The actual panel. */
.user-stats-lounge .panel {
  position: relative;
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  background: var(--lounge-bg);
  border: 1px solid var(--lounge-line-strong);
  border-bottom: 0;
  border-radius: 16px 16px 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
}

@media (min-width: 641px) {
  .user-stats-lounge .panel {
    max-height: 85vh;
    border-bottom: 1px solid var(--lounge-line-strong);
    border-radius: 16px;
  }
}

/* Top gradient strip — same palette as community-redesign. */
.user-stats-lounge .panel::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: linear-gradient(90deg, var(--lounge-discord), var(--lounge-cyan), var(--lounge-pink), var(--lounge-orange));
  z-index: 2;
}

/* Drag handle on mobile only. */
.user-stats-lounge .drag-handle {
  display: flex;
  justify-content: center;
  padding: 8px 0 4px;
}

.user-stats-lounge .drag-handle > i {
  width: 40px;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  display: block;
}

@media (min-width: 641px) {
  .user-stats-lounge .drag-handle {
    display: none;
  }
}

/* Body wrapper that scrolls. */
.user-stats-lounge .body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 16px 16px 20px;
}

@media (min-width: 641px) {
  .user-stats-lounge .body {
    padding: 18px 20px 22px;
  }
}

/* Footer. */
.user-stats-lounge .footer {
  flex: 0 0 auto;
  padding: 10px 16px 12px;
  border-top: 1px solid var(--lounge-line);
  text-align: center;
  font-family: var(--lounge-font-mono);
  font-size: 9px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--lounge-faint);
}

/* Reduced motion fallback. */
@media (prefers-reduced-motion: reduce) {
  .user-stats-lounge,
  .user-stats-lounge *,
  .user-stats-lounge *::before,
  .user-stats-lounge *::after {
    animation-duration: 0.001s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001s !important;
  }
}
```

- [ ] **Step 2: Import the CSS in `UserStatsModal.tsx`**

Below the existing imports, add:

```tsx
import './user-stats-modal.css';
```

- [ ] **Step 3: Run verification**

```
npm run build
```

`npm run dev`, open modal — visuals should be unchanged from before this task (no JSX touches the new classes yet).

- [ ] **Step 4: Commit**

```
git add src/app/components/user-stats-modal.css src/app/components/UserStatsModal.tsx
git commit -m "Add scoped lounge CSS shell for UserStatsModal"
```

---

## Task 3: Replace modal frame chrome with lounge frame

**Goal:** Swap the outer container, header (avatar + name + meta + live pill + close), tab strip (with gradient underline active state), and footer to lounge styling. Tab content panels still render their existing Tailwind content — they're replaced one-by-one in later tasks.

**Files:**
- Modify: `src/app/components/UserStatsModal.tsx`
- Modify: `src/app/components/user-stats-modal.css` (add header/tabs/live-pill rules)

**Acceptance Criteria:**
- [ ] Modal opens with new chrome: 720px max-width on desktop, bottom sheet on mobile, top gradient strip visible.
- [ ] Header shows avatar (40px outlined), display name in `Exo 2`, mono date subtitle (`Dnešní aktivita · DD.MM.`), Live pill on the right (green dot + LIVE), close button.
- [ ] Tab strip: 5 tabs in a horizontal row with the lounge pill style and gradient underline on the active tab. Mobile collapses to icons only and scrolls horizontally.
- [ ] Footer line: `Data se resetují každý den o půlnoci (CET)` styled as faint mono.
- [ ] All 5 tabs still render their (old Tailwind) content correctly.

**Verify:**
```
npm run build
```
Then `npm run dev`, open modal, click through all 5 tabs to confirm content still appears, then test at mobile width (Chrome devtools → 375px) to confirm bottom sheet + drag handle + horizontal-scrolling icon-only tab strip.

**Steps:**

- [ ] **Step 1: Add header / tab / live-pill rules to `user-stats-modal.css`**

Append to the bottom of the file (before the `prefers-reduced-motion` block):

```css
/* ============ Header ============ */
.user-stats-lounge .header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--lounge-line);
}

.user-stats-lounge .header .avatar-wrap {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  overflow: hidden;
  flex: 0 0 auto;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.06);
}

.user-stats-lounge .header .avatar-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.user-stats-lounge .header .meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1 1 auto;
}

.user-stats-lounge .header .meta .name {
  font-family: var(--lounge-font-display);
  font-weight: 800;
  font-size: 16px;
  line-height: 1.05;
  color: var(--lounge-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-stats-lounge .header .meta .sub {
  font-family: var(--lounge-font-mono);
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--lounge-faint);
}

/* ============ Live pill ============ */
.user-stats-lounge .live-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 9px;
  border-radius: 999px;
  font-family: var(--lounge-font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  white-space: nowrap;
}

.user-stats-lounge .live-pill > i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}

.user-stats-lounge .live-pill.is-loading {
  background: rgba(255, 255, 255, 0.06);
  color: var(--lounge-muted);
}
.user-stats-lounge .live-pill.is-loading > i {
  background: var(--lounge-muted);
  animation: lounge-loading-pulse 1.2s ease-in-out infinite;
}
.user-stats-lounge .live-pill.is-live {
  background: rgba(16, 185, 129, 0.13);
  color: var(--lounge-sage);
}
.user-stats-lounge .live-pill.is-live > i {
  background: var(--lounge-sage);
  box-shadow: 0 0 8px var(--lounge-sage);
  animation: lounge-live-pulse 2s ease-in-out infinite;
}
.user-stats-lounge .live-pill.is-error {
  background: rgba(248, 113, 113, 0.13);
  color: var(--lounge-error);
}
.user-stats-lounge .live-pill.is-error > i {
  background: var(--lounge-error);
}

@keyframes lounge-live-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.78); }
}
@keyframes lounge-loading-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

/* ============ Close button ============ */
.user-stats-lounge .close-btn {
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid transparent;
  color: var(--lounge-muted);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.user-stats-lounge .close-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: var(--lounge-text);
}
.user-stats-lounge .close-btn:focus-visible {
  outline: 2px solid var(--lounge-cyan);
  outline-offset: 2px;
}
.user-stats-lounge .close-btn svg {
  width: 18px;
  height: 18px;
}

/* ============ Tab strip ============ */
.user-stats-lounge .tabs {
  flex: 0 0 auto;
  display: flex;
  gap: 4px;
  padding: 6px 12px 0;
  border-bottom: 1px solid var(--lounge-line);
  background: rgba(0, 0, 0, 0.25);
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}
.user-stats-lounge .tabs::-webkit-scrollbar { display: none; }

.user-stats-lounge .tab {
  flex: 0 0 auto;
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 14px;
  border: 0;
  border-radius: 8px 8px 0 0;
  background: transparent;
  font-family: var(--lounge-font-body);
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.01em;
  color: #8a8a9e;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
  white-space: nowrap;
}
.user-stats-lounge .tab:hover { color: var(--lounge-muted); }
.user-stats-lounge .tab:focus-visible {
  outline: 2px solid var(--lounge-cyan);
  outline-offset: -3px;
}
.user-stats-lounge .tab.is-active {
  color: var(--lounge-text);
  background: rgba(255, 255, 255, 0.06);
}
.user-stats-lounge .tab.is-active::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: -1px;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--lounge-cyan), var(--lounge-pink));
}
.user-stats-lounge .tab .tab-label { display: none; }

@media (min-width: 641px) {
  .user-stats-lounge .tab .tab-label { display: inline; }
}

.user-stats-lounge .tab .tab-icon {
  font-size: 16px;
  line-height: 1;
}
```

- [ ] **Step 2: Replace the JSX of the outer scrim, panel, header, tabs, footer in `UserStatsModal.tsx`**

Locate the existing return block (currently starts with `<div className="fixed inset-0 bg-black/50 ...`). Replace **only** the outer scrim div, the panel container, the drag handle, the header, the tab navigation row, and the footer. **Keep the body content and the per-tab rendering blocks untouched** — they continue to use their existing Tailwind classes for now. They will be replaced one tab at a time in Tasks 4–6.

The new return value:

```tsx
if (!isOpen) return null;

const todayLabel = new Date().toLocaleDateString('cs-CZ', {
  day: '2-digit',
  month: '2-digit',
});

const liveState: 'is-loading' | 'is-live' | 'is-error' =
  initialLoading ? 'is-loading' : error ? 'is-error' : 'is-live';
const liveLabel =
  liveState === 'is-loading' ? 'Načítání' : liveState === 'is-error' ? 'Offline' : 'Live';

const TABS: Array<{ id: 'overview' | 'spotify' | 'gaming' | 'voice' | 'achievements'; label: string; icon: string }> = [
  { id: 'overview', label: 'Přehled', icon: '📊' },
  { id: 'spotify', label: 'Spotify', icon: '🎵' },
  { id: 'gaming', label: 'Hry', icon: '🎮' },
  { id: 'voice', label: 'Voice', icon: '🎤' },
  { id: 'achievements', label: 'Úspěchy', icon: '🏆' },
];

return (
  <div className="user-stats-lounge scrim" onClick={onClose}>
    <div className="panel" onClick={(e) => e.stopPropagation()}>
      <div className="drag-handle" aria-hidden="true"><i /></div>

      <div className="header">
        <div className="avatar-wrap">
          <SafeImage
            src={avatar}
            alt={displayName}
            width={40}
            height={40}
            fallback={
              <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.06)' }}>
                <span style={{ fontWeight: 800, fontSize: 14 }}>{displayName.charAt(0).toUpperCase()}</span>
              </div>
            }
          />
        </div>
        <div className="meta">
          <span className="name">{displayName}</span>
          <span className="sub">Dnešní aktivita · {todayLabel}</span>
        </div>
        <span
          className={`live-pill ${liveState}`}
          aria-live="polite"
        >
          <i />
          {liveLabel}
        </span>
        <button type="button" className="close-btn" onClick={onClose} aria-label="Zavřít">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`tab ${activeTab === tab.id ? 'is-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon" aria-hidden="true">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="body">
        {/* Existing tab content stays untouched in this task. */}
        {initialLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
            <p className="text-gray-400 mt-2">Načítání statistik...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-400">❌ {error}</p>
            <button
              onClick={() => fetchUserStats(true)}
              className="mt-2 px-4 py-2 min-h-[44px] bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm transition-colors"
            >
              Zkusit znovu
            </button>
          </div>
        )}

        {stats && !initialLoading && (
          <div className="space-y-4">
            {/* All five existing activeTab === '...' blocks stay here, untouched. */}
            {/* ... overview, spotify, gaming, voice, achievements ... */}
          </div>
        )}
      </div>

      <div className="footer">Data se resetují každý den o půlnoci (CET)</div>
    </div>
  </div>
);
```

When you do this edit, **leave the existing five `{activeTab === '...' && (...)}` blocks intact inside the `<div className="body">` → `{stats && !initialLoading && (...)}` block** — they're long, they stay as-is. Only the chrome around them changes.

- [ ] **Step 3: Run verification**

```
npm run build
```

Then `npm run dev`, open the modal, click through all 5 tabs (the inner content still looks like the old Tailwind cards — that's expected). Test at 375px width: bottom sheet, drag handle, icons-only tabs that scroll horizontally.

- [ ] **Step 4: Commit**

```
git add src/app/components/UserStatsModal.tsx src/app/components/user-stats-modal.css
git commit -m "Replace UserStatsModal frame with lounge chrome"
```

---

## Task 4: Build OverviewTab (numbers-led hero direction A)

**Goal:** Replace the overview tab's Tailwind content with the new lounge layout: gradient hero number, 4 mini-tiles row (Hry · Voice · Spotify · Stream) with vs-průměr / Top X% pills, faint "Další statistiky" strip, and an 8-row timeline list.

**Files:**
- Create: `src/app/components/userStats/OverviewTab.tsx`
- Modify: `src/app/components/user-stats-modal.css` (add overview-specific rules)
- Modify: `src/app/components/UserStatsModal.tsx` (replace `activeTab === 'overview'` block with `<OverviewTab stats={stats} />`)

**Acceptance Criteria:**
- [ ] Gradient `formatOnlineTime(totalOnlineTime)` headline renders as the first thing in the tab body, ~44–52px responsive.
- [ ] 4 tiles in a row at desktop (Hry, Voice, Spotify, Stream), 2×2 at mobile, each in its accent color with the right comparison pill (`↑/↓ vs průměr` or `Top X%`).
- [ ] "Další statistiky" strip shows 4 micro-stats (Různých her, Voice kanálů, Různých interpretů, Screen share) below the tiles.
- [ ] Timeline shows up to 8 most-recent sessions with mono time, category dot, name + optional details, and right-aligned duration.
- [ ] Server averages caption only renders when `serverAverages` is present.

**Verify:**
```
npx tsc --noEmit
npm run build
```
Then `npm run dev`, open modal, Přehled tab — verify the gradient headline is the live online-time value, all four tiles render with their colors, and the timeline list shows real recent sessions. Test at 375px and 720px widths.

**Steps:**

- [ ] **Step 1: Append CSS for the overview tab** to `src/app/components/user-stats-modal.css`:

```css
/* ============ Overview tab ============ */
.user-stats-lounge .overview-hero {
  margin-bottom: 18px;
}
.user-stats-lounge .overview-hero .eyebrow {
  font-family: var(--lounge-font-mono);
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #8f98ff;
  margin-bottom: 6px;
}
.user-stats-lounge .overview-hero .headline {
  margin: 0;
  font-family: var(--lounge-font-display);
  font-weight: 900;
  font-size: clamp(36px, 12vw, 52px);
  line-height: 0.95;
  letter-spacing: -0.025em;
  background: linear-gradient(135deg, var(--lounge-cyan) 0%, var(--lounge-pink) 60%, var(--lounge-orange) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.user-stats-lounge .overview-hero .sub {
  margin: 6px 0 0;
  color: var(--lounge-muted);
  font-size: 13px;
}
.user-stats-lounge .overview-hero .compare-line {
  margin-top: 10px;
  font-family: var(--lounge-font-mono);
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--lounge-faint);
}

/* Hero tile row */
.user-stats-lounge .hero-tiles {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 14px;
}
@media (min-width: 641px) {
  .user-stats-lounge .hero-tiles {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.user-stats-lounge .hero-tile {
  border: 1px solid var(--lounge-line);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.045);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 92px;
}
.user-stats-lounge .hero-tile .label {
  font-family: var(--lounge-font-mono);
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--lounge-faint);
}
.user-stats-lounge .hero-tile .value {
  font-family: var(--lounge-font-display);
  font-weight: 900;
  font-size: 22px;
  line-height: 1;
  letter-spacing: -0.01em;
}
.user-stats-lounge .hero-tile.tone-game .value { color: var(--lounge-discord); }
.user-stats-lounge .hero-tile.tone-voice .value { color: var(--lounge-orange); }
.user-stats-lounge .hero-tile.tone-spotify .value { color: var(--lounge-pink); }
.user-stats-lounge .hero-tile.tone-stream .value { color: var(--lounge-cyan); }

.user-stats-lounge .hero-tile .pill {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 999px;
  font-family: var(--lounge-font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.user-stats-lounge .hero-tile .pill.up { background: rgba(16, 185, 129, 0.15); color: #34d399; }
.user-stats-lounge .hero-tile .pill.down { background: rgba(248, 113, 113, 0.15); color: var(--lounge-error); }
.user-stats-lounge .hero-tile .pill.eq { background: rgba(255, 255, 255, 0.06); color: var(--lounge-muted); }
.user-stats-lounge .hero-tile .pill.top-90 { background: rgba(255, 140, 0, 0.18); color: #ffa64d; }
.user-stats-lounge .hero-tile .pill.top-75 { background: rgba(255, 110, 199, 0.18); color: #ff8edb; }
.user-stats-lounge .hero-tile .pill.top-50 { background: rgba(88, 101, 242, 0.18); color: #a3acff; }
.user-stats-lounge .hero-tile .pill.top-low { background: rgba(255, 255, 255, 0.06); color: var(--lounge-muted); }
.user-stats-lounge .hero-tile .pill.faint { background: transparent; padding-left: 0; color: var(--lounge-faint); }

/* Další statistiky strip */
.user-stats-lounge .micro-strip {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  border: 1px solid var(--lounge-line);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.025);
  padding: 12px;
  margin-bottom: 18px;
}
@media (min-width: 641px) {
  .user-stats-lounge .micro-strip {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
.user-stats-lounge .micro-strip .item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.user-stats-lounge .micro-strip .item .micro-label {
  font-family: var(--lounge-font-mono);
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--lounge-faint);
}
.user-stats-lounge .micro-strip .item .micro-value {
  font-family: var(--lounge-font-display);
  font-weight: 800;
  font-size: 16px;
  color: var(--lounge-text);
}

/* Timeline list */
.user-stats-lounge .timeline-heading {
  font-family: var(--lounge-font-mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--lounge-faint);
  margin: 0 0 8px;
}
.user-stats-lounge .timeline-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.user-stats-lounge .timeline-row {
  display: grid;
  grid-template-columns: 54px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
}
.user-stats-lounge .timeline-row:last-child { border-bottom: 0; }
.user-stats-lounge .timeline-row .time {
  font-family: var(--lounge-font-mono);
  font-size: 11px;
  color: #8f98ff;
}
.user-stats-lounge .timeline-row .body {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.user-stats-lounge .timeline-row .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.user-stats-lounge .timeline-row.tone-game   .dot { background: var(--lounge-discord); box-shadow: 0 0 8px var(--lounge-discord); }
.user-stats-lounge .timeline-row.tone-voice  .dot { background: var(--lounge-orange);  box-shadow: 0 0 8px var(--lounge-orange);  }
.user-stats-lounge .timeline-row.tone-spotify .dot { background: var(--lounge-pink);    box-shadow: 0 0 8px var(--lounge-pink);    }
.user-stats-lounge .timeline-row.tone-default .dot { background: var(--lounge-cyan);    box-shadow: 0 0 8px var(--lounge-cyan);    }
.user-stats-lounge .timeline-row .name {
  font-family: var(--lounge-font-display);
  font-weight: 800;
  font-size: 13px;
  color: var(--lounge-text);
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.user-stats-lounge .timeline-row .details {
  font-size: 11px;
  color: var(--lounge-faint);
  margin-top: 2px;
}
.user-stats-lounge .timeline-row .duration {
  font-family: var(--lounge-font-mono);
  font-size: 11px;
  color: var(--lounge-muted);
  text-align: right;
}
```

- [ ] **Step 2: Create `src/app/components/userStats/OverviewTab.tsx`**

```tsx
import type { UserStats } from './types';
import { formatDate, formatOnlineTime } from './formatters';

interface OverviewTabProps {
  stats: UserStats;
}

const tonePillForPercentile = (p: number): string => {
  if (p >= 90) return 'top-90';
  if (p >= 75) return 'top-75';
  if (p >= 50) return 'top-50';
  return 'top-low';
};

const sessionTone = (type: string): 'tone-game' | 'tone-voice' | 'tone-spotify' | 'tone-default' => {
  if (type === 'game') return 'tone-game';
  if (type === 'voice') return 'tone-voice';
  if (type === 'spotify') return 'tone-spotify';
  return 'tone-default';
};

interface ComparisonPillProps {
  vsAverage?: number;
  percentile?: number;
  isTimeValue?: boolean;
  fallback?: string;
}

function ComparisonPill({ vsAverage, percentile, isTimeValue = true, fallback }: ComparisonPillProps) {
  if (vsAverage === undefined && percentile === undefined) {
    return fallback ? <span className="pill faint">{fallback}</span> : null;
  }
  if (percentile !== undefined) {
    return <span className={`pill ${tonePillForPercentile(percentile)}`}>Top {Math.max(1, 100 - percentile)}%</span>;
  }
  if (vsAverage! > 0) {
    return (
      <span className="pill up">
        ↑ +{isTimeValue ? formatOnlineTime(vsAverage!) : Math.round(vsAverage!)} vs průměr
      </span>
    );
  }
  if (vsAverage! < 0) {
    return (
      <span className="pill down">
        ↓ {isTimeValue ? formatOnlineTime(Math.abs(vsAverage!)) : Math.round(Math.abs(vsAverage!))} vs průměr
      </span>
    );
  }
  return <span className="pill eq">= průměr</span>;
}

export default function OverviewTab({ stats }: OverviewTabProps) {
  const t = stats.data.totals;
  const sa = stats.data.serverAverages;
  const p = stats.data.percentiles;

  const recent = (stats.data.recentSessions ?? []).slice(0, 8);

  return (
    <>
      <div className="overview-hero">
        <div className="eyebrow">Dnes online</div>
        <p className="headline">{formatOnlineTime(t.totalOnlineTime)}</p>
        <p className="sub">online dnes</p>
        {sa && (
          <div className="compare-line">srovnání s {sa.totalActiveUsers} aktivními · live tracking</div>
        )}
      </div>

      <div className="hero-tiles">
        <div className="hero-tile tone-game">
          <span className="label">Hry</span>
          <span className="value">{formatOnlineTime(t.totalGameTime)}</span>
          <ComparisonPill
            vsAverage={sa ? t.totalGameTime - sa.avgGameTime : undefined}
            percentile={p?.gameTimePercentile}
          />
        </div>
        <div className="hero-tile tone-voice">
          <span className="label">Voice</span>
          <span className="value">{formatOnlineTime(t.totalVoiceTime)}</span>
          <ComparisonPill
            vsAverage={sa ? t.totalVoiceTime - sa.avgVoiceTime : undefined}
            percentile={p?.voiceTimePercentile}
          />
        </div>
        <div className="hero-tile tone-spotify">
          <span className="label">Spotify</span>
          <span className="value">{t.totalSongsPlayed}</span>
          <ComparisonPill
            vsAverage={sa ? t.totalSongsPlayed - sa.avgSongsPlayed : undefined}
            percentile={p?.songsPlayedPercentile}
            isTimeValue={false}
          />
        </div>
        <div className="hero-tile tone-stream">
          <span className="label">Stream</span>
          <span className="value">{formatOnlineTime(t.totalScreenShareTime || 0)}</span>
          <ComparisonPill fallback="bez srovnání" />
        </div>
      </div>

      <div className="micro-strip">
        <div className="item">
          <span className="micro-label">Různých her</span>
          <span className="micro-value">{t.gamesPlayed || 0}</span>
        </div>
        <div className="item">
          <span className="micro-label">Voice kanálů</span>
          <span className="micro-value">{t.voiceChannelsUsed || 0}</span>
        </div>
        <div className="item">
          <span className="micro-label">Různých interpretů</span>
          <span className="micro-value">{t.artistsListened || 0}</span>
        </div>
        <div className="item">
          <span className="micro-label">Screen share</span>
          <span className="micro-value">{formatOnlineTime(t.totalScreenShareTime || 0)}</span>
        </div>
      </div>

      {recent.length > 0 && (
        <>
          <p className="timeline-heading">Dnešní aktivita</p>
          <ul className="timeline-list">
            {recent.map((session, i) => (
              <li key={`${session.start_time}-${i}`} className={`timeline-row ${sessionTone(session.type)}`}>
                <span className="time">{formatDate(session.start_time)}</span>
                <div className="body">
                  <span className="dot" />
                  <div style={{ minWidth: 0 }}>
                    <div className="name">{session.name}</div>
                    {session.details && <div className="details">{session.details}</div>}
                  </div>
                </div>
                <span className="duration">{formatOnlineTime(session.duration_minutes)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
```

- [ ] **Step 3: Wire `OverviewTab` into `UserStatsModal.tsx`**

Add the import:

```tsx
import OverviewTab from './userStats/OverviewTab';
```

Inside the body (`{stats && !initialLoading && ...}`), find the existing `{activeTab === 'overview' && (...)}` block and replace its entire content with:

```tsx
{activeTab === 'overview' && <OverviewTab stats={stats} />}
```

Leave the other four tab branches alone — they're handled in Tasks 5 and 6.

- [ ] **Step 4: Run verification**

```
npx tsc --noEmit
npm run build
```

Then `npm run dev`, open modal, Přehled tab. Verify:
1. Gradient `5h Xm` headline (or whatever the user's actual `totalOnlineTime` is) at the top.
2. Four colored tiles below.
3. Faint micro-strip with 4 stats.
4. Timeline rows with time, colored dot, name, duration.

Resize to 375px → tiles collapse to 2×2 and the headline scales down.

- [ ] **Step 5: Commit**

```
git add src/app/components/userStats/OverviewTab.tsx src/app/components/user-stats-modal.css src/app/components/UserStatsModal.tsx
git commit -m "Replace UserStatsModal Overview tab with numbers-led lounge layout"
```

---

## Task 5: Build SpotifyTab, GamingTab, VoiceTab (shared list pattern)

**Goal:** Replace the three list-based tabs with a shared lounge skeleton: tab hero (2 stats inline) + ranked list panel(s) + faint footnote.

**Files:**
- Create: `src/app/components/userStats/SpotifyTab.tsx`
- Create: `src/app/components/userStats/GamingTab.tsx`
- Create: `src/app/components/userStats/VoiceTab.tsx`
- Modify: `src/app/components/user-stats-modal.css` (add shared list patterns)
- Modify: `src/app/components/UserStatsModal.tsx`

**Acceptance Criteria:**
- [ ] Each tab opens with a "tab hero" panel containing the tab title (`Exo 2` 18px) and 2 large inline stats. The hero's bottom 1px divider is the tab's accent color.
- [ ] Ranked list panel(s) follow with `#01–#NN` mono rank pills (first place tinted in tab accent), name + optional subtitle, primary metric on the right with optional small caption below.
- [ ] Faint mono footnote under each list (matches the wording of the current `kumulované` captions).
- [ ] Empty states render when arrays are empty: a single faint card with category emoji + one mono line.

**Verify:**
```
npm run build
```
Then `npm run dev`, open modal, click through Spotify · Hry · Voice. With real data: top artists / top tracks / game sessions / voice channels appear correctly with their accent colors.

**Steps:**

- [ ] **Step 1: Append shared list pattern CSS** to `user-stats-modal.css`:

```css
/* ============ Shared tab patterns ============ */
.user-stats-lounge .lounge-section {
  margin-bottom: 18px;
}
.user-stats-lounge .lounge-section:last-child { margin-bottom: 0; }

.user-stats-lounge .tab-hero {
  position: relative;
  border: 1px solid var(--lounge-line);
  border-radius: 12px;
  background: var(--lounge-panel-soft);
  padding: 14px 16px 16px;
}
.user-stats-lounge .tab-hero::after {
  content: '';
  position: absolute;
  left: 16px; right: 16px; bottom: 0;
  height: 1px;
}
.user-stats-lounge .tab-hero.accent-spotify::after { background: linear-gradient(90deg, transparent, var(--lounge-pink), transparent); }
.user-stats-lounge .tab-hero.accent-game::after    { background: linear-gradient(90deg, transparent, var(--lounge-discord), transparent); }
.user-stats-lounge .tab-hero.accent-voice::after   { background: linear-gradient(90deg, transparent, var(--lounge-orange), transparent); }

.user-stats-lounge .tab-hero .tab-hero-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.user-stats-lounge .tab-hero .tab-hero-title {
  margin: 0;
  font-family: var(--lounge-font-display);
  font-weight: 800;
  font-size: 18px;
  color: var(--lounge-text);
  letter-spacing: -0.01em;
}
.user-stats-lounge .tab-hero .tab-hero-eyebrow {
  display: block;
  font-family: var(--lounge-font-mono);
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--lounge-faint);
  margin-bottom: 4px;
}
.user-stats-lounge .tab-hero .tab-hero-stats {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
}
.user-stats-lounge .tab-hero .stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.user-stats-lounge .tab-hero .stat .stat-label {
  font-family: var(--lounge-font-mono);
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--lounge-faint);
}
.user-stats-lounge .tab-hero .stat .stat-value {
  font-family: var(--lounge-font-display);
  font-weight: 900;
  font-size: 22px;
  line-height: 1;
}
.user-stats-lounge .tab-hero.accent-spotify .stat .stat-value { color: var(--lounge-pink); }
.user-stats-lounge .tab-hero.accent-game    .stat .stat-value { color: var(--lounge-discord); }
.user-stats-lounge .tab-hero.accent-voice   .stat .stat-value { color: var(--lounge-orange); }

.user-stats-lounge .lounge-panel-card {
  border: 1px solid var(--lounge-line);
  border-radius: 12px;
  background: var(--lounge-panel-soft);
  padding: 14px 16px;
  margin-top: 12px;
}
.user-stats-lounge .lounge-panel-card .panel-title {
  font-family: var(--lounge-font-display);
  font-weight: 800;
  font-size: 14px;
  color: var(--lounge-text);
  margin: 0 0 10px;
}
.user-stats-lounge .lounge-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.user-stats-lounge .lounge-list-row {
  display: grid;
  grid-template-columns: 36px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 8px 4px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.06);
}
.user-stats-lounge .lounge-list-row:last-child { border-bottom: 0; }
.user-stats-lounge .rank-pill {
  display: inline-grid;
  place-items: center;
  width: 32px;
  height: 22px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  font-family: var(--lounge-font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--lounge-muted);
}
.user-stats-lounge .lounge-list-row.first .rank-pill.accent-spotify { background: rgba(255, 110, 199, 0.18); color: #ff8edb; }
.user-stats-lounge .lounge-list-row.first .rank-pill.accent-game    { background: rgba(88, 101, 242, 0.18); color: #a3acff; }
.user-stats-lounge .lounge-list-row.first .rank-pill.accent-voice   { background: rgba(255, 140, 0, 0.18); color: #ffa64d; }
.user-stats-lounge .lounge-list-row .row-body { min-width: 0; }
.user-stats-lounge .lounge-list-row .row-name {
  font-family: var(--lounge-font-display);
  font-weight: 800;
  font-size: 13px;
  color: var(--lounge-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.user-stats-lounge .lounge-list-row .row-sub {
  font-size: 11px;
  color: var(--lounge-faint);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.user-stats-lounge .lounge-list-row .row-metric {
  text-align: right;
}
.user-stats-lounge .lounge-list-row .row-metric .metric-primary {
  font-family: var(--lounge-font-display);
  font-weight: 800;
  font-size: 13px;
  color: var(--lounge-text);
}
.user-stats-lounge .lounge-list-row.accent-spotify .row-metric .metric-primary { color: var(--lounge-pink); }
.user-stats-lounge .lounge-list-row.accent-game    .row-metric .metric-primary { color: var(--lounge-discord); }
.user-stats-lounge .lounge-list-row.accent-voice   .row-metric .metric-primary { color: var(--lounge-orange); }
.user-stats-lounge .lounge-list-row .row-metric .metric-sub {
  font-family: var(--lounge-font-mono);
  font-size: 9px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--lounge-faint);
  margin-top: 2px;
}

.user-stats-lounge .lounge-footnote {
  margin: 8px 0 0;
  font-family: var(--lounge-font-mono);
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--lounge-faint);
}

.user-stats-lounge .empty-card {
  border: 1px dashed var(--lounge-line);
  border-radius: 12px;
  padding: 18px;
  text-align: center;
  background: rgba(255, 255, 255, 0.02);
}
.user-stats-lounge .empty-card .empty-icon { font-size: 24px; }
.user-stats-lounge .empty-card .empty-text {
  margin-top: 6px;
  font-family: var(--lounge-font-mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--lounge-faint);
}
```

- [ ] **Step 2: Create `src/app/components/userStats/SpotifyTab.tsx`**

```tsx
import type { UserStats } from './types';

interface SpotifyTabProps {
  stats: UserStats;
}

const formatRank = (n: number) => `#${String(n).padStart(2, '0')}`;

export default function SpotifyTab({ stats }: SpotifyTabProps) {
  const t = stats.data.totals;
  const artists = stats.data.spotifyActivity ?? [];
  const tracks = stats.data.topTracks ?? [];
  const totalArtists = t.artistsListened || artists.length;

  const noActivity = artists.length === 0 && tracks.length === 0;

  return (
    <>
      <section className="lounge-section">
        <div className="tab-hero accent-spotify">
          <h3 className="tab-hero-title">🎵 Spotify <span className="tab-hero-eyebrow">celkem dnes</span></h3>
          <div className="tab-hero-stats">
            <div className="stat">
              <span className="stat-label">Celkem písní</span>
              <span className="stat-value">{t.totalSongsPlayed}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Různých interpretů</span>
              <span className="stat-value">{totalArtists}</span>
            </div>
          </div>
        </div>
      </section>

      {noActivity && (
        <div className="empty-card">
          <div className="empty-icon">🎵</div>
          <div className="empty-text">Dnes ještě žádná hudba</div>
        </div>
      )}

      {artists.length > 0 && (
        <section className="lounge-section">
          <div className="lounge-panel-card">
            <h4 className="panel-title">Top interpreti</h4>
            <ul className="lounge-list">
              {artists.map((artist, i) => (
                <li key={artist.artist} className={`lounge-list-row accent-spotify ${i === 0 ? 'first' : ''}`}>
                  <span className="rank-pill accent-spotify">{formatRank(i + 1)}</span>
                  <div className="row-body">
                    <div className="row-name">{artist.artist}</div>
                  </div>
                  <div className="row-metric">
                    <div className="metric-primary">{artist.plays_count}</div>
                    <div className="metric-sub">{artist.plays_count === 1 ? 'píseň' : 'písní'}</div>
                  </div>
                </li>
              ))}
            </ul>
            <p className="lounge-footnote">Počty kumulované za celý den</p>
          </div>
        </section>
      )}

      {tracks.length > 0 && (
        <section className="lounge-section">
          <div className="lounge-panel-card">
            <h4 className="panel-title">Top písně</h4>
            <ul className="lounge-list">
              {tracks.map((track, i) => (
                <li key={`${track.track_name}-${track.artist}`} className={`lounge-list-row accent-spotify ${i === 0 ? 'first' : ''}`}>
                  <span className="rank-pill accent-spotify">{formatRank(i + 1)}</span>
                  <div className="row-body">
                    <div className="row-name">{track.track_name}</div>
                    <div className="row-sub">{track.artist}</div>
                  </div>
                  <div className="row-metric">
                    <div className="metric-primary">{track.play_count}×</div>
                  </div>
                </li>
              ))}
            </ul>
            <p className="lounge-footnote">Přehrání kumulovaná za celý den</p>
          </div>
        </section>
      )}
    </>
  );
}
```

- [ ] **Step 3: Create `src/app/components/userStats/GamingTab.tsx`**

```tsx
import type { UserStats } from './types';
import { formatOnlineTime } from './formatters';

interface GamingTabProps {
  stats: UserStats;
}

const formatRank = (n: number) => `#${String(n).padStart(2, '0')}`;

export default function GamingTab({ stats }: GamingTabProps) {
  const t = stats.data.totals;
  const games = stats.data.gameSessions ?? [];
  const totalGames = t.gamesPlayed || games.length;

  return (
    <>
      <section className="lounge-section">
        <div className="tab-hero accent-game">
          <h3 className="tab-hero-title">🎮 Hry <span className="tab-hero-eyebrow">celkem dnes</span></h3>
          <div className="tab-hero-stats">
            <div className="stat">
              <span className="stat-label">Celkový čas</span>
              <span className="stat-value">{formatOnlineTime(t.totalGameTime)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Různých her</span>
              <span className="stat-value">{totalGames}</span>
            </div>
          </div>
        </div>
      </section>

      {games.length === 0 && (
        <div className="empty-card">
          <div className="empty-icon">🎮</div>
          <div className="empty-text">Dnes nehrál žádné hry</div>
        </div>
      )}

      {games.length > 0 && (
        <section className="lounge-section">
          <div className="lounge-panel-card">
            <h4 className="panel-title">Jednotlivé hry</h4>
            <ul className="lounge-list">
              {games.map((game, i) => (
                <li key={game.game_name} className={`lounge-list-row accent-game ${i === 0 ? 'first' : ''}`}>
                  <span className="rank-pill accent-game">{formatRank(i + 1)}</span>
                  <div className="row-body">
                    <div className="row-name">{game.game_name}</div>
                  </div>
                  <div className="row-metric">
                    <div className="metric-primary">{formatOnlineTime(game.total_minutes)}</div>
                    <div className="metric-sub">
                      {game.session_count} {game.session_count === 1 ? 'session' : 'sessions'}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <p className="lounge-footnote">Časy kumulované ze všech dokončených session</p>
          </div>
        </section>
      )}
    </>
  );
}
```

- [ ] **Step 4: Create `src/app/components/userStats/VoiceTab.tsx`**

```tsx
import type { UserStats } from './types';
import { formatOnlineTime } from './formatters';

interface VoiceTabProps {
  stats: UserStats;
}

const formatRank = (n: number) => `#${String(n).padStart(2, '0')}`;

export default function VoiceTab({ stats }: VoiceTabProps) {
  const t = stats.data.totals;
  const channels = stats.data.voiceActivity ?? [];

  return (
    <>
      <section className="lounge-section">
        <div className="tab-hero accent-voice">
          <h3 className="tab-hero-title">🎤 Voice <span className="tab-hero-eyebrow">celkem dnes</span></h3>
          <div className="tab-hero-stats">
            <div className="stat">
              <span className="stat-label">Celkový čas</span>
              <span className="stat-value">{formatOnlineTime(t.totalVoiceTime)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Screen share</span>
              <span className="stat-value">{formatOnlineTime(t.totalScreenShareTime || 0)}</span>
            </div>
          </div>
        </div>
      </section>

      {channels.length === 0 && (
        <div className="empty-card">
          <div className="empty-icon">🎤</div>
          <div className="empty-text">Dnes nebyl v žádném kanálu</div>
        </div>
      )}

      {channels.length > 0 && (
        <section className="lounge-section">
          <div className="lounge-panel-card">
            <h4 className="panel-title">Kanály</h4>
            <ul className="lounge-list">
              {channels.map((ch, i) => (
                <li key={ch.channel_name} className={`lounge-list-row accent-voice ${i === 0 ? 'first' : ''}`}>
                  <span className="rank-pill accent-voice">{formatRank(i + 1)}</span>
                  <div className="row-body">
                    <div className="row-name">{ch.channel_name}</div>
                  </div>
                  <div className="row-metric">
                    <div className="metric-primary">{formatOnlineTime(ch.total_minutes)}</div>
                    <div className="metric-sub">
                      {ch.session_count} {ch.session_count === 1 ? 'session' : 'sessions'}
                      {ch.screen_share_minutes > 0 && ` · ${formatOnlineTime(ch.screen_share_minutes)} share`}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <p className="lounge-footnote">Časy kumulované ze všech dokončených session</p>
          </div>
        </section>
      )}
    </>
  );
}
```

- [ ] **Step 5: Wire the three tabs into `UserStatsModal.tsx`**

Add imports:

```tsx
import SpotifyTab from './userStats/SpotifyTab';
import GamingTab from './userStats/GamingTab';
import VoiceTab from './userStats/VoiceTab';
```

Replace the three existing `{activeTab === 'spotify' && (...)}`, `{activeTab === 'gaming' && (...)}`, `{activeTab === 'voice' && (...)}` blocks (with their entire Tailwind-laden content) with one-liners:

```tsx
{activeTab === 'spotify' && <SpotifyTab stats={stats} />}
{activeTab === 'gaming' && <GamingTab stats={stats} />}
{activeTab === 'voice' && <VoiceTab stats={stats} />}
```

Keep `{activeTab === 'achievements' && (...)}` for now — Task 6 handles it.

- [ ] **Step 6: Run verification**

```
npm run build
```

Then `npm run dev`, click through each of the three tabs and verify ranked lists, accent colors, footnotes, and empty states render. Test at 375px width.

- [ ] **Step 7: Commit**

```
git add src/app/components/userStats/SpotifyTab.tsx src/app/components/userStats/GamingTab.tsx src/app/components/userStats/VoiceTab.tsx src/app/components/user-stats-modal.css src/app/components/UserStatsModal.tsx
git commit -m "Replace UserStatsModal Spotify/Gaming/Voice tabs with shared lounge list pattern"
```

---

## Task 6: Build AchievementsTab (trophy badge grid)

**Goal:** Replace the achievements tab with a single 2-column badge grid (no Unlocked/In-Progress section split). Unlocked badges have a cyan halo and a "Dokončeno" pill; locked badges show grayscale icon + progress bar with current/threshold caption.

**Files:**
- Create: `src/app/components/userStats/AchievementsTab.tsx`
- Modify: `src/app/components/user-stats-modal.css`
- Modify: `src/app/components/UserStatsModal.tsx`

**Acceptance Criteria:**
- [ ] All 8 badges render in a 2-column grid (1 column under 540px), sorted unlocked-first (grouped by category gaming → voice → spotify → special), then locked sorted by progress descending.
- [ ] Each badge shows top edge category color stripe, emoji icon (grayscale when locked), title, description, and a status block.
- [ ] Special category badges (`night-owl`, `early-bird`) show a Czech text status instead of a numeric progress fraction.
- [ ] Section header reads `🏆 Úspěchy` with a mono `{unlocked} / 8 odemčeno` counter on the right.

**Verify:**
```
npm run build
```
Then `npm run dev`, open Úspěchy tab, confirm:
1. Grid layout (2 cols desktop, 1 col mobile).
2. Unlocked badges glow with cyan halo.
3. Locked badges show progress bars with correct current/threshold.
4. Special-category badges (night-owl/early-bird) show text status.

**Steps:**

- [ ] **Step 1: Append achievements CSS** to `user-stats-modal.css`:

```css
/* ============ Achievements ============ */
.user-stats-lounge .achievements-section {
  padding-top: 4px;
}
.user-stats-lounge .achievements-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.user-stats-lounge .achievements-header h3 {
  margin: 0;
  font-family: var(--lounge-font-display);
  font-weight: 800;
  font-size: 16px;
  color: var(--lounge-text);
}
.user-stats-lounge .achievements-header .counter {
  font-family: var(--lounge-font-mono);
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--lounge-faint);
}

.user-stats-lounge .badge-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}
@media (min-width: 541px) {
  .user-stats-lounge .badge-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.user-stats-lounge .badge {
  position: relative;
  border: 1px solid var(--lounge-line);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
  overflow: hidden;
  min-height: 168px;
}
.user-stats-lounge .badge::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 2px;
}
.user-stats-lounge .badge.cat-gaming::before  { background: var(--lounge-discord); }
.user-stats-lounge .badge.cat-voice::before   { background: var(--lounge-orange); }
.user-stats-lounge .badge.cat-spotify::before { background: var(--lounge-pink); }
.user-stats-lounge .badge.cat-special::before { background: var(--lounge-cyan); }

.user-stats-lounge .badge .icon {
  font-size: 36px;
  line-height: 1;
}
.user-stats-lounge .badge.locked .icon {
  filter: grayscale(1) brightness(0.6);
  opacity: 0.55;
}

.user-stats-lounge .badge .title {
  font-family: var(--lounge-font-display);
  font-weight: 800;
  font-size: 13px;
  line-height: 1.1;
  color: var(--lounge-text);
}
.user-stats-lounge .badge .desc {
  font-size: 11px;
  color: var(--lounge-muted);
  line-height: 1.35;
}

.user-stats-lounge .badge .status {
  margin-top: auto;
  width: 100%;
}
.user-stats-lounge .badge.unlocked {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.18);
  box-shadow: 0 0 0 1px rgba(0, 255, 255, 0.12), 0 8px 24px rgba(0, 255, 255, 0.08);
}
.user-stats-lounge .badge.unlocked .status {
  display: flex;
  justify-content: center;
}
.user-stats-lounge .badge .done-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  border-radius: 999px;
  background: rgba(0, 255, 255, 0.13);
  color: #5af3ff;
  font-family: var(--lounge-font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.user-stats-lounge .badge .done-pill > i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #5af3ff;
  box-shadow: 0 0 6px #5af3ff;
  display: inline-block;
}

.user-stats-lounge .badge .progressbar {
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}
.user-stats-lounge .badge .progressbar > i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--lounge-cyan), var(--lounge-pink));
}
.user-stats-lounge .badge .progressmeta {
  display: flex;
  justify-content: space-between;
  font-family: var(--lounge-font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-top: 4px;
  color: var(--lounge-faint);
}
.user-stats-lounge .badge .special-status {
  font-family: var(--lounge-font-mono);
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--lounge-faint);
  text-align: center;
  padding: 6px 0;
}
```

- [ ] **Step 2: Create `src/app/components/userStats/AchievementsTab.tsx`**

```tsx
import type { Achievement, UserStats } from './types';
import { formatOnlineTime } from './formatters';
import {
  ACHIEVEMENTS,
  calculateAchievementProgress,
} from './achievements';

interface AchievementsTabProps {
  stats: UserStats;
}

const CATEGORY_ORDER: Record<Achievement['category'], number> = {
  gaming: 0,
  voice: 1,
  spotify: 2,
  special: 3,
};

const isTimeBasedThreshold = (id: string): boolean =>
  id === 'marathon-gamer' || id === 'social-butterfly' || id === 'streamer';

const isSpecialNoCount = (id: string): boolean => id === 'night-owl' || id === 'early-bird';

const SPECIAL_PENDING_TEXT: Record<string, string> = {
  'night-owl': 'Zkus to dnes po půlnoci',
  'early-bird': 'Zkus být aktivní brzy ráno',
};

export default function AchievementsTab({ stats }: AchievementsTabProps) {
  const sorted = [...ACHIEVEMENTS].sort((a, b) => {
    const pa = calculateAchievementProgress(a, stats);
    const pb = calculateAchievementProgress(b, stats);
    if (pa.unlocked !== pb.unlocked) return pa.unlocked ? -1 : 1;
    if (pa.unlocked && pb.unlocked) {
      return CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category];
    }
    return pb.progress - pa.progress;
  });

  const unlockedCount = sorted.filter((a) => calculateAchievementProgress(a, stats).unlocked).length;

  return (
    <section className="achievements-section">
      <div className="achievements-header">
        <h3>🏆 Úspěchy</h3>
        <span className="counter">{unlockedCount} / {ACHIEVEMENTS.length} odemčeno</span>
      </div>

      <div className="badge-grid">
        {sorted.map((achievement) => {
          const { current, unlocked, progress } = calculateAchievementProgress(achievement, stats);
          const cat = `cat-${achievement.category}`;
          return (
            <div
              key={achievement.id}
              className={`badge ${cat} ${unlocked ? 'unlocked' : 'locked'}`}
            >
              <div className="icon" aria-hidden="true">{achievement.icon}</div>
              <div className="title">{achievement.title}</div>
              <div className="desc">{achievement.description}</div>
              <div className="status">
                {unlocked ? (
                  <span className="done-pill"><i />Dokončeno</span>
                ) : isSpecialNoCount(achievement.id) ? (
                  <div className="special-status">{SPECIAL_PENDING_TEXT[achievement.id] ?? 'Zatím ne'}</div>
                ) : (
                  <>
                    <div className="progressbar"><i style={{ width: `${progress}%` }} /></div>
                    <div className="progressmeta">
                      <span>
                        {isTimeBasedThreshold(achievement.id)
                          ? `${formatOnlineTime(current)} / ${formatOnlineTime(achievement.threshold)}`
                          : `${current} / ${achievement.threshold}`}
                      </span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Wire `AchievementsTab` into `UserStatsModal.tsx`**

Add the import:

```tsx
import AchievementsTab from './userStats/AchievementsTab';
```

Replace the entire `{activeTab === 'achievements' && (...)}` block (with the Unlocked/In-Progress sections and the empty state) with:

```tsx
{activeTab === 'achievements' && <AchievementsTab stats={stats} />}
```

You can now also remove the no-longer-used imports `ACHIEVEMENTS`, `getUnlockedAchievements`, `getInProgressAchievements`, `calculateAchievementProgress` from `UserStatsModal.tsx` if they're not referenced elsewhere — they live in the tab components now.

- [ ] **Step 4: Run verification**

```
npm run build
```

Then `npm run dev`, Úspěchy tab. Verify the grid layout, unlocked halo, locked progress bars, and the special-category text states. Resize to 375px → grid becomes single column.

- [ ] **Step 5: Commit**

```
git add src/app/components/userStats/AchievementsTab.tsx src/app/components/user-stats-modal.css src/app/components/UserStatsModal.tsx
git commit -m "Replace UserStatsModal Achievements tab with trophy badge grid"
```

---

## Task 7: Loading skeleton + lounge-styled error state

**Goal:** Replace the centered spinner with shimmering skeleton placeholders for the Overview tab on initial load. Restyle the error card to lounge tokens.

**Files:**
- Modify: `src/app/components/user-stats-modal.css`
- Modify: `src/app/components/UserStatsModal.tsx`

**Acceptance Criteria:**
- [ ] On initial load, the body shows: skeleton headline (≈48px tall), 4 hero tile skeletons, micro-strip skeleton, and 4 timeline-row skeletons. Replaces the old `Načítání statistik...` spinner.
- [ ] The shimmer respects `prefers-reduced-motion: reduce` (no animation).
- [ ] Error state renders as a lounge card with `❌ {message}` and a `Zkusit znovu` button styled as a ghost lounge button. `fetchUserStats(true)` is still wired up.
- [ ] When `stats` is present and a 30s refresh fires, no shimmer appears (preserves the silent-refresh behavior — `prevDataRef` already prevents re-render flicker).

**Verify:**
```
npm run build
```
Then `npm run dev`. To force an initial load, close & reopen the modal (or hard-refresh the page). To force an error, in devtools Network tab block `**/api/analytics/user/**` and reopen.

**Steps:**

- [ ] **Step 1: Append skeleton + error CSS** to `user-stats-modal.css`:

```css
/* ============ Skeleton ============ */
.user-stats-lounge .skeleton {
  background: linear-gradient(
    100deg,
    rgba(255, 255, 255, 0.04) 0%,
    rgba(255, 255, 255, 0.1) 45%,
    rgba(255, 255, 255, 0.04) 90%
  );
  background-size: 200% 100%;
  border-radius: 8px;
  animation: lounge-shimmer 1.4s ease-in-out infinite;
}
@keyframes lounge-shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

.user-stats-lounge .skeleton-headline {
  height: 48px;
  width: 60%;
  max-width: 320px;
  margin-bottom: 18px;
}
.user-stats-lounge .skeleton-tiles {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 14px;
}
@media (min-width: 641px) {
  .user-stats-lounge .skeleton-tiles { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
.user-stats-lounge .skeleton-tile {
  height: 92px;
  border-radius: 10px;
}
.user-stats-lounge .skeleton-strip {
  height: 60px;
  border-radius: 10px;
  margin-bottom: 18px;
}
.user-stats-lounge .skeleton-row {
  height: 36px;
  border-radius: 6px;
  margin-bottom: 8px;
}
.user-stats-lounge .skeleton-row:last-child { margin-bottom: 0; }

/* ============ Error card ============ */
.user-stats-lounge .error-card {
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: 12px;
  background: rgba(248, 113, 113, 0.06);
  padding: 18px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.user-stats-lounge .error-card .error-msg {
  margin: 0;
  color: var(--lounge-error);
  font-size: 14px;
}
.user-stats-lounge .error-card .lounge-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid var(--lounge-line-strong);
  background: rgba(255, 255, 255, 0.06);
  color: var(--lounge-text);
  font-family: var(--lounge-font-body);
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}
.user-stats-lounge .error-card .lounge-button:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-1px);
}
```

- [ ] **Step 2: Replace the loading & error blocks in `UserStatsModal.tsx`**

Inside the `<div className="body">`, replace **both** the existing `{initialLoading && (...)}` and `{error && (...)}` blocks with:

```tsx
{initialLoading && (
  <div aria-busy="true" aria-label="Načítání statistik">
    <div className="skeleton skeleton-headline" />
    <div className="skeleton-tiles">
      <div className="skeleton skeleton-tile" />
      <div className="skeleton skeleton-tile" />
      <div className="skeleton skeleton-tile" />
      <div className="skeleton skeleton-tile" />
    </div>
    <div className="skeleton skeleton-strip" />
    <div className="skeleton skeleton-row" />
    <div className="skeleton skeleton-row" />
    <div className="skeleton skeleton-row" />
    <div className="skeleton skeleton-row" />
  </div>
)}

{error && !initialLoading && (
  <div className="error-card">
    <p className="error-msg">❌ {error}</p>
    <button type="button" className="lounge-button" onClick={() => fetchUserStats(true)}>
      Zkusit znovu
    </button>
  </div>
)}
```

The `{stats && !initialLoading && (...)}` block stays untouched.

- [ ] **Step 3: Run verification**

```
npm run build
```

Then `npm run dev`. Open and close the modal — on first open, skeleton briefly appears before data lands. Use devtools network throttling (Slow 3G) to make the skeleton visible for several seconds. Block the API endpoint to verify the error card renders and the retry button works.

- [ ] **Step 4: Commit**

```
git add src/app/components/user-stats-modal.css src/app/components/UserStatsModal.tsx
git commit -m "Add skeleton loader and lounge-styled error state to UserStatsModal"
```

---

## Task 8: Accessibility, motion, and focus management

**Goal:** Add ARIA roles for the dialog and tablist, focus trap, escape-to-close, arrow-key tab navigation, and entry/exit animations with a `prefers-reduced-motion` fallback.

**Files:**
- Modify: `src/app/components/UserStatsModal.tsx`
- Modify: `src/app/components/user-stats-modal.css`

**Acceptance Criteria:**
- [ ] Modal panel has `role="dialog"`, `aria-modal="true"`, `aria-labelledby={headingId}`.
- [ ] Pressing `Escape` closes the modal.
- [ ] Focus moves to the close button (or first focusable element) when the modal opens; focus returns to the previously-focused element on close.
- [ ] Tab strip uses `role="tablist"` / `role="tab"` with `aria-selected` and supports `←` / `→` arrow keys to switch between tabs (rolling, so right arrow on the last tab wraps to first).
- [ ] Tab panels have `role="tabpanel"` with `aria-labelledby` pointing to their tab.
- [ ] Open animation: scrim fades 160ms; on desktop the panel scales `0.96 → 1` + fades 200ms; on mobile slides up from below 280ms. All wrapped in `@media (prefers-reduced-motion: reduce)` overrides.
- [ ] Tab switch fades content 120ms (no layout shift).

**Verify:**
```
npm run build
```
Then `npm run dev`:
1. Open modal → focus visibly lands on close button.
2. Press `Escape` → modal closes.
3. After close, the originally-focused element regains focus.
4. With keyboard only: `Tab` / `Shift-Tab` cycles within the modal, never escapes.
5. Focus a tab, press `→` — moves to next tab and switches the panel.
6. In OS settings, enable Reduce Motion — re-open modal, animations should be near-instant.

**Steps:**

- [ ] **Step 1: Append motion CSS** to `user-stats-modal.css`:

```css
/* ============ Motion ============ */
.user-stats-lounge.scrim { animation: lounge-scrim-in 160ms ease-out; }
@keyframes lounge-scrim-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.user-stats-lounge .panel { animation: lounge-panel-in-mobile 280ms ease-out; }
@keyframes lounge-panel-in-mobile {
  from { transform: translateY(20%); opacity: 0; }
  to   { transform: translateY(0);   opacity: 1; }
}
@media (min-width: 641px) {
  .user-stats-lounge .panel { animation: lounge-panel-in-desktop 200ms ease-out; }
  @keyframes lounge-panel-in-desktop {
    from { transform: scale(0.96); opacity: 0; }
    to   { transform: scale(1);    opacity: 1; }
  }
}

.user-stats-lounge .body > * { animation: lounge-tab-fade 120ms ease-out; }
@keyframes lounge-tab-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

(The existing `prefers-reduced-motion` block at the bottom of the file already neutralizes these.)

- [ ] **Step 2: Add focus management & keyboard handlers in `UserStatsModal.tsx`**

Add to the imports at the top:

```tsx
import { useId } from 'react';
```

Inside the component, just below the existing `useState`/`useRef` declarations, add:

```tsx
const headingId = useId();
const panelRef = useRef<HTMLDivElement | null>(null);
const closeBtnRef = useRef<HTMLButtonElement | null>(null);
const previouslyFocusedRef = useRef<HTMLElement | null>(null);
const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

// Focus management
useEffect(() => {
  if (!isOpen) return;
  previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
  // Defer to after render so the close button exists in DOM.
  const t = setTimeout(() => closeBtnRef.current?.focus(), 0);
  return () => {
    clearTimeout(t);
    previouslyFocusedRef.current?.focus?.();
  };
}, [isOpen]);

// Escape to close + focus trap
useEffect(() => {
  if (!isOpen) return;
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusables = panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  document.addEventListener('keydown', onKeyDown);
  return () => document.removeEventListener('keydown', onKeyDown);
}, [isOpen, onClose]);

const onTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  e.preventDefault();
  const dir = e.key === 'ArrowRight' ? 1 : -1;
  const nextIndex = (currentIndex + dir + TABS.length) % TABS.length;
  setActiveTab(TABS[nextIndex].id);
  tabRefs.current[nextIndex]?.focus();
};
```

Note: the constant `TABS` was defined inside the render function in Task 3. Hoist it to module scope (above the `UserStatsModal` component declaration) so the keyboard handler can reference it:

```tsx
const TABS: Array<{ id: 'overview' | 'spotify' | 'gaming' | 'voice' | 'achievements'; label: string; icon: string }> = [
  { id: 'overview', label: 'Přehled', icon: '📊' },
  { id: 'spotify', label: 'Spotify', icon: '🎵' },
  { id: 'gaming', label: 'Hry', icon: '🎮' },
  { id: 'voice', label: 'Voice', icon: '🎤' },
  { id: 'achievements', label: 'Úspěchy', icon: '🏆' },
];
```

- [ ] **Step 3: Apply ARIA attributes and refs in the JSX**

Update the panel, header heading, close button, and tab elements:

```tsx
<div
  ref={panelRef}
  className="panel"
  role="dialog"
  aria-modal="true"
  aria-labelledby={headingId}
  onClick={(e) => e.stopPropagation()}
>
  {/* ...drag handle... */}

  <div className="header">
    {/* ...avatar wrap... */}
    <div className="meta">
      <span id={headingId} className="name">{displayName}</span>
      <span className="sub">Dnešní aktivita · {todayLabel}</span>
    </div>
    {/* ...live pill... */}
    <button
      ref={closeBtnRef}
      type="button"
      className="close-btn"
      onClick={onClose}
      aria-label="Zavřít"
    >
      {/* ...svg... */}
    </button>
  </div>

  <div className="tabs" role="tablist" aria-label="Statistiky">
    {TABS.map((tab, i) => (
      <button
        key={tab.id}
        ref={(el) => { tabRefs.current[i] = el; }}
        type="button"
        role="tab"
        id={`stats-tab-${tab.id}`}
        aria-selected={activeTab === tab.id}
        aria-controls={`stats-panel-${tab.id}`}
        tabIndex={activeTab === tab.id ? 0 : -1}
        className={`tab ${activeTab === tab.id ? 'is-active' : ''}`}
        onClick={() => setActiveTab(tab.id)}
        onKeyDown={(e) => onTabKeyDown(e, i)}
      >
        <span className="tab-icon" aria-hidden="true">{tab.icon}</span>
        <span className="tab-label">{tab.label}</span>
      </button>
    ))}
  </div>

  <div
    className="body"
    role="tabpanel"
    id={`stats-panel-${activeTab}`}
    aria-labelledby={`stats-tab-${activeTab}`}
  >
    {/* ...skeleton / error / stats... unchanged... */}
  </div>

  <div className="footer">Data se resetují každý den o půlnoci (CET)</div>
</div>
```

- [ ] **Step 4: Run verification**

```
npm run build
```

Then `npm run dev` and walk through the keyboard checklist in the Verify section (open, escape, tab cycle, arrow keys, reduced motion). Use the OS Reduce Motion toggle to validate the motion fallback.

- [ ] **Step 5: Commit**

```
git add src/app/components/UserStatsModal.tsx src/app/components/user-stats-modal.css
git commit -m "Add a11y (dialog/tablist), focus management, and motion to UserStatsModal"
```

---

## Task 9: Final cleanup and visual QA pass

**Goal:** Remove residual Tailwind classes from the modal that no longer have a purpose, confirm the modal works across breakpoints, verify the existing `MostActiveMembers` integration still triggers the modal correctly, and ship.

**Files:**
- Modify: `src/app/components/UserStatsModal.tsx`

**Acceptance Criteria:**
- [ ] No Tailwind utility classes remain inside the modal that aren't actively styling something (search the file for `className="bg-` and `className="text-gray-` — these should be gone or scoped clearly to the SafeImage fallback).
- [ ] `npm run build` and `npm run lint` both pass with no new diagnostics.
- [ ] At desktop, mobile (375px), and tablet (768px), modal renders without overflow, scroll, or layout glitches.
- [ ] Clicking a member in the homepage's "Nejaktivnější členové" panel opens the new modal as before.

**Verify:**
```
npm run build
npm run lint
```
Then `npm run dev`, navigate to `/#discord`, click a member to open the modal, click through every tab on desktop and at 375px width.

**Steps:**

- [ ] **Step 1: Search and remove dead Tailwind classes**

Run a quick scan from your shell:

```
grep -n "className=\"bg-\\|className=\"text-gray-\\|backdrop-blur" src/app/components/UserStatsModal.tsx
```

Any remaining hits in the modal body (other than inside the `SafeImage` fallback inline-styles, which are fine) should be deleted along with their wrapping element if it's no longer needed.

- [ ] **Step 2: Final visual QA**

In `npm run dev`:

1. Desktop: open modal → all 5 tabs render with new lounge styles.
2. Resize to 375px → bottom sheet appears, tab strip is icon-only and scrolls, hero tiles 2×2, badges 1-col, lists readable.
3. Resize to 768px → 4-tile row, badges 2-col, tab labels visible.
4. Trigger error (block the API in devtools network) → lounge error card appears, retry works.
5. With slow network throttling → skeleton appears for several seconds before content.
6. Hit Escape, hit close button, click scrim — all close the modal.

- [ ] **Step 3: Final lint + build**

```
npm run lint
npm run build
```

Both pass cleanly.

- [ ] **Step 4: Commit**

```
git add src/app/components/UserStatsModal.tsx
git commit -m "Final cleanup pass on UserStatsModal redesign"
```

---

## Self-Review Notes

- **Spec coverage:** Sections 1–13 of the spec map to Tasks 0–9.
  - §1 goals/non-goals → guides the whole plan, no specific task.
  - §2 architecture → Tasks 0, 1, 2.
  - §3 modal frame → Task 3.
  - §4 Overview → Task 4.
  - §5 Spotify/Hry/Voice → Task 5.
  - §6 Achievements → Task 6.
  - §7 color system → Tasks 2 (declared) and 4–6 (applied).
  - §8 motion → Task 8.
  - §9 mobile → applied across Tasks 3–6 via `@media (max-width: 640px)`, validated in Task 9.
  - §10 a11y → Task 8.
  - §11 loading & error → Task 7.
  - §12 out of scope → respected throughout.

- **Type consistency:** `calculateAchievementProgress` switches from a 1-arg closure to a 2-arg pure function in Task 1; all later call sites updated. `Achievement.category` values (`'gaming' | 'voice' | 'spotify' | 'special'`) match `CATEGORY_ORDER` in `AchievementsTab.tsx` (Task 6) and the `cat-*` CSS classes (Task 6 CSS). The `TABS` constant defined in Task 3 is hoisted in Task 8 — that's a single, intentional change.

- **No placeholders:** every step shows the code or command needed; nothing is "TBD".
