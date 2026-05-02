# CS2 Page Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring `src/app/cs2/page.tsx` into the homepage's "Esports Pro" visual language (gradient titles, mono kickers, chassis cards with index + stats strip), restructured into Hero / Maps / Weapons / Mechanics / CTA.

**Architecture:** New scoped CSS file `src/app/cs2/cs2-redesign.css` keyed off `.cs2-redesign` (mirrors `hero-members-redesign.css`, `games-redesign.css`). The page wrapper adopts `cs2-redesign section-heading-redesign` classes; all section-specific styles cascade from those scopes. Section-by-section migration of `page.tsx` JSX, replacing Tailwind utility classes and the existing `cs2.module.css` with the new design vocabulary. One small data-model addition (`theme` field on `GameMap`) feeds the maps stats strip.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, plain CSS (no CSS-in-JS), shared fonts via Google Fonts (Exo 2, Roboto, JetBrains Mono).

**Reference spec:** [docs/superpowers/specs/2026-05-02-cs2-page-modernization-design.md](../specs/2026-05-02-cs2-page-modernization-design.md)

---

## File Structure

| Path | Action | Responsibility |
| --- | --- | --- |
| `src/app/cs2/cs2-redesign.css` | **Create** | All scoped tokens + section/component styles for the redesign |
| `src/app/cs2/page.tsx` | **Major rewrite** | New section structure + JSX adopting new classes |
| `src/app/cs2/cs2.module.css` | **Delete** | Superseded by `cs2-redesign.css` |
| `src/app/cs2/loading.tsx` | **Update** | Match new spinner style |
| `src/app/types/cs2.ts` | **Modify** | Add `theme?: string` to `GameMap` |
| `src/app/api/cs2/maps/route.ts` | **Modify** | Populate `theme` for each of 7 maps |
| `src/app/components/MapCardSkeleton.tsx` | **Rewrite** | Chassis-style skeleton matching new map card |
| `src/app/components/WeaponCardSkeleton.tsx` | **Rewrite** | Chassis-style skeleton matching new weapon card |

Page gets restructured into 5 sections (Hero → Maps → Weapons → Mechanics → CTA), so the file does grow in JSX volume but its responsibility — "render the CS2 chapter page" — stays focused.

---

## Verification approach

This is a frontend visual redesign — no unit tests. Verification per task is browser-based:

```bash
npm run dev
# Open http://localhost:3000/cs2
```

Each task ends with a concrete "open the page, verify X" check.

---

### Task 1: Add `theme` field to map data

**Goal:** Add a short editorial `theme` label on each map record so the maps stats strip can render it.

**Files:**
- Modify: `src/app/types/cs2.ts`
- Modify: `src/app/api/cs2/maps/route.ts`

**Acceptance Criteria:**
- [ ] `GameMap` interface has `theme?: string`
- [ ] All 7 active maps (Ancient, Anubis, Dust II, Inferno, Mirage, Nuke, Train) have a `theme` value populated
- [ ] `GET /api/cs2/maps?active=true` response includes `theme` for each map
- [ ] TypeScript compiles with no errors (`npm run build` or `npx tsc --noEmit`)

**Verify:**

```bash
curl -s http://localhost:3000/api/cs2/maps?active=true | grep -o '"theme":"[^"]*"' | head
```
Expected: 7 lines, each like `"theme":"Desert"`, `"theme":"Italy"`, etc.

**Steps:**

- [ ] **Step 1: Update the type**

Edit `src/app/types/cs2.ts`:

```ts
export interface GameMap {
  id: string;
  name: string;
  description: string;
  image: string;
  type: 'defusal' | 'hostage' | 'wingman';
  active: boolean;
  releaseDate?: string;
  features: string[];
  theme?: string;          // NEW
}
```

- [ ] **Step 2: Populate `theme` on each map**

Edit `src/app/api/cs2/maps/route.ts`. Add a `theme` field to each of the 7 active map objects:

| Map id | theme |
| --- | --- |
| `ancient` | `'Jungle'` |
| `anubis` | `'Egypt'` |
| `dust2` | `'Desert'` |
| `inferno` | `'Italy'` |
| `mirage` | `'Morocco'` |
| `nuke` | `'Industrial'` |
| `train` | `'Industrial'` |

Example (apply this pattern to all 7 active maps):

```ts
{
  id: 'dust2',
  name: 'Dust II',
  description: 'Nejpopulárnější mapa v historii Counter-Strike. ...',
  image: 'https://cdn.komplexaci.cz/cs2/maps/dust2.jpg',
  type: 'defusal',
  active: true,
  releaseDate: '2001-03-13',
  features: ['Iconic design', 'Long sightlines', 'Balanced gameplay', 'Desert theme'],
  theme: 'Desert',         // NEW
},
```

The route's `GameMap` interface in this file mirrors the type definition — keep them in sync (i.e., add `theme?: string` to the local `GameMap` interface in this file too if it's redeclared rather than imported).

- [ ] **Step 3: Verify build**

```bash
npx tsc --noEmit
```
Expected: no errors.

```bash
npm run dev
# in another shell:
curl -s http://localhost:3000/api/cs2/maps?active=true
```
Expected: each map object includes a `theme` string.

- [ ] **Step 4: Commit**

```bash
git add src/app/types/cs2.ts src/app/api/cs2/maps/route.ts
git commit -m "Add theme field to CS2 maps for chassis stats strip"
```

---

### Task 2: Create `cs2-redesign.css` foundation

**Goal:** Author the full scoped stylesheet for the redesign — tokens, hero, section base, card chassis, weapon tabs, mechanics blocks, CTA strip, responsive rules. Page does not import it yet (Task 3).

**Files:**
- Create: `src/app/cs2/cs2-redesign.css`

**Acceptance Criteria:**
- [ ] All styles scoped under `.cs2-redesign` (no global selectors leak)
- [ ] Tokens defined (`--bg-0`, `--brand-cyan`, etc.) match those in spec table verbatim
- [ ] Classes for: `.cs2-hero`, `.cs2-section`, `.cs2-shell`, `.cs2-card`, `.cs2-weapon-tab`, `.cs2-mech-block`, `.cs2-cta-strip`, plus all sub-elements (`.ix-bar`, `.img-frame`, `.stats`, `.data-strip`, `.live-badge`, `.indicator`, etc.)
- [ ] Responsive rules for `≤1023px`, `≤767px`, `≤640px`
- [ ] `@media (prefers-reduced-motion: reduce)` block disables hover lifts, image scales, and pulse animation
- [ ] File compiles into the page (no CSS syntax errors)

**Verify:** After Task 3 imports this file, `npm run dev` boots without console CSS warnings.

**Steps:**

- [ ] **Step 1: Create the file**

Create `src/app/cs2/cs2-redesign.css` with the structure below. Refer to the spec for exact pixel values, gradients, and hover behaviors. Mirror the patterns in `src/app/hero-members-redesign.css` and `src/app/games-redesign.css` for grid overlay, radial washes, and typography.

```css
/* ================================================================
   CS2 page redesign — Esports Pro language, scoped under .cs2-redesign
   ================================================================ */

@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');

/* ---------- Scoped tokens ---------- */
.cs2-redesign {
  --bg-0: #07070d;
  --bg-1: #0a0a14;
  --bg-2: #11111e;
  --brand-cyan: #00FFFF;
  --brand-magenta: #ff6ec7;
  --brand-orange: #FF8C00;
  --line: rgba(255, 255, 255, 0.08);
  --line-strong: rgba(255, 255, 255, 0.16);
  --text-0: #ffffff;
  --text-1: #d8d8e8;
  --text-2: #9b9bb0;
  --text-3: #6b6b80;
  --font-display: 'Exo 2', system-ui, sans-serif;
  --font-body: 'Roboto', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  background: var(--bg-0);
  color: var(--text-0);
  font-family: var(--font-body);
  min-height: 100vh;
}

/* ---------- Hero ---------- */
.cs2-redesign .cs2-hero {
  position: relative;
  min-height: 100vh;
  margin-top: -64px;          /* bleed under reserved Header band */
  padding: 140px 48px 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
}
.cs2-redesign .cs2-hero .bg {
  position: absolute; inset: 0;
  background-size: cover; background-position: center;
  opacity: 0.55;
  transition: opacity 600ms ease;
}
.cs2-redesign .cs2-hero .wash {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse at 28% 22%, rgba(0,255,255,0.10), transparent 50%),
    radial-gradient(ellipse at 78% 80%, rgba(255,110,199,0.10), transparent 50%),
    linear-gradient(180deg, rgba(7,7,13,0.4) 0%, rgba(7,7,13,0.85) 70%, var(--bg-0) 100%);
}
.cs2-redesign .cs2-hero .grid-overlay {
  position: absolute; inset: 0; opacity: 0.34;
  background:
    linear-gradient(rgba(0,255,255,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,255,255,0.035) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: linear-gradient(180deg, transparent 0%, #000 22%, #000 72%, transparent 100%);
  pointer-events: none;
}

/* live badge (top-right) */
.cs2-redesign .cs2-hero .live-badge {
  position: absolute; top: 84px; right: 32px; z-index: 3;
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.2em;
  text-transform: uppercase; color: var(--brand-cyan);
  padding: 8px 12px;
  border: 1px solid rgba(0,255,255,0.4); border-radius: 4px;
  background: rgba(0,255,255,0.06);
}
.cs2-redesign .cs2-hero .live-badge::before {
  content: ''; display: inline-block; width: 6px; height: 6px; border-radius: 50%;
  background: var(--brand-cyan); margin-right: 8px; vertical-align: middle;
  animation: cs2-pulse 1.4s ease-in-out infinite;
}
@keyframes cs2-pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.3 } }

/* hero content */
.cs2-redesign .cs2-hero .content {
  position: relative; z-index: 2; max-width: 1100px; width: 100%;
}
.cs2-redesign .cs2-hero .kicker {
  font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.22em;
  color: var(--brand-cyan); text-transform: uppercase; margin-bottom: 18px;
}
.cs2-redesign .cs2-hero .kicker .dot {
  display: inline-block; width: 6px; height: 6px; border-radius: 50%;
  background: var(--brand-magenta); margin: 0 12px; vertical-align: middle;
}
.cs2-redesign .cs2-hero h1 {
  font-family: var(--font-display); font-weight: 900;
  font-size: clamp(54px, 8vw, 130px); line-height: 0.92;
  letter-spacing: -0.04em; margin: 0;
}
.cs2-redesign .cs2-hero h1 span {
  background: linear-gradient(135deg, var(--brand-cyan), var(--brand-magenta) 58%, var(--brand-orange));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.cs2-redesign .cs2-hero .lede {
  font-family: var(--font-body); font-weight: 300; font-size: 19px;
  color: var(--text-1); max-width: 680px; margin: 24px auto 40px;
  line-height: 1.55;
}

/* hero data strip */
.cs2-redesign .cs2-hero .data-strip {
  display: inline-flex; align-items: stretch;
  border: 1px solid var(--line-strong); border-radius: 12px; overflow: hidden;
  background: rgba(7,7,13,0.55); backdrop-filter: blur(10px);
}
.cs2-redesign .cs2-hero .data-strip .cell {
  padding: 14px 22px; border-right: 1px solid var(--line);
  font-family: var(--font-mono); text-align: left;
}
.cs2-redesign .cs2-hero .data-strip .cell:last-child { border-right: 0; }
.cs2-redesign .cs2-hero .data-strip .label {
  color: var(--text-3); font-size: 10px; letter-spacing: 0.16em;
  text-transform: uppercase; display: block; margin-bottom: 4px;
}
.cs2-redesign .cs2-hero .data-strip .val { color: var(--text-0); font-size: 14px; font-weight: 500; }
.cs2-redesign .cs2-hero .data-strip .val.cyan { color: var(--brand-cyan); }

/* hero rotation indicator */
.cs2-redesign .cs2-hero .indicator {
  position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 8px; z-index: 3;
}
.cs2-redesign .cs2-hero .indicator span {
  width: 22px; height: 2px; background: rgba(255,255,255,0.2); border-radius: 1px;
  transition: background 300ms ease;
}
.cs2-redesign .cs2-hero .indicator span.active {
  background: linear-gradient(90deg, var(--brand-cyan), var(--brand-magenta));
}

/* ---------- Section base ---------- */
.cs2-redesign .cs2-section { padding: 96px 0; position: relative; }
.cs2-redesign .cs2-shell {
  width: min(1180px, calc(100% - 48px));
  margin: 0 auto; position: relative;
}
.cs2-redesign .cs2-section-header { text-align: center; margin-bottom: 56px; }
.cs2-redesign .cs2-section-kicker {
  font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.22em;
  color: var(--brand-cyan); text-transform: uppercase; margin-bottom: 14px;
}
.cs2-redesign .cs2-section-sub {
  font-family: var(--font-body); color: var(--text-1); font-size: 16px;
  max-width: 720px; margin: 18px auto 0; line-height: 1.55;
}

/* ---------- Card chassis (Maps + Weapons share) ---------- */
.cs2-redesign .cs2-grid-cards {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px;
}
.cs2-redesign .cs2-card {
  position: relative; border-radius: 12px; overflow: hidden;
  background: rgba(12,14,24,0.9); border: 1px solid var(--line);
  transition: border-color 220ms ease, transform 220ms ease;
}
.cs2-redesign .cs2-card:hover {
  transform: translateY(-3px);
  border-color: rgba(0,255,255,0.32);
}
.cs2-redesign .cs2-card .ix-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 11px 16px; border-bottom: 1px solid var(--line);
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.18em;
  text-transform: uppercase;
}
.cs2-redesign .cs2-card .ix-bar .index { color: var(--brand-cyan); }
.cs2-redesign .cs2-card .ix-bar .ix-tag { color: var(--brand-magenta); }
.cs2-redesign .cs2-card .img-frame {
  aspect-ratio: 16/9; background-size: cover; background-position: center;
  position: relative; overflow: hidden;
}
.cs2-redesign .cs2-card .img-frame::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(180deg, transparent 50%, rgba(7,7,13,0.92) 100%);
  pointer-events: none;
}
.cs2-redesign .cs2-card .img-frame > img {
  width: 100%; height: 100%; object-fit: cover;
  transition: transform 400ms ease;
}
.cs2-redesign .cs2-card:hover .img-frame > img { transform: scale(1.04); }

/* weapon variant: contained image, no edge-bleed, no bottom gradient */
.cs2-redesign .cs2-card .img-frame.weapon {
  background: rgba(7,7,13,0.6);
  display: flex; align-items: center; justify-content: center;
}
.cs2-redesign .cs2-card .img-frame.weapon::after { display: none; }
.cs2-redesign .cs2-card .img-frame.weapon > img {
  width: auto; height: auto;
  max-height: 70%; max-width: 70%; object-fit: contain;
}

.cs2-redesign .cs2-card .body { padding: 14px 16px 16px; }
.cs2-redesign .cs2-card h3,
.cs2-redesign .cs2-card h4 {
  font-family: var(--font-display); font-weight: 800; font-size: 19px;
  margin: 0 0 6px; color: var(--text-0); letter-spacing: -0.01em;
}
.cs2-redesign .cs2-card .desc {
  color: var(--text-1); font-size: 13px; margin: 0 0 14px; line-height: 1.5;
}
.cs2-redesign .cs2-card .stats {
  display: flex; gap: 16px;
  border-top: 1px solid var(--line); padding-top: 12px;
  font-family: var(--font-mono);
}
.cs2-redesign .cs2-card .stats .s { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.cs2-redesign .cs2-card .stats .s .lbl {
  color: var(--text-3); font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase;
}
.cs2-redesign .cs2-card .stats .s .val { color: var(--text-0); font-size: 12px; }
.cs2-redesign .cs2-card .stats .s .val.cyan { color: var(--brand-cyan); }
.cs2-redesign .cs2-card .stats .s .val.pink { color: var(--brand-magenta); }

/* ---------- Weapon tabs ---------- */
.cs2-redesign .cs2-weapon-tabs {
  display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;
  margin-bottom: 36px;
}
.cs2-redesign .cs2-weapon-tab {
  padding: 10px 18px;
  background: rgba(12,14,24,0.6); border: 1px solid var(--line);
  color: var(--text-1); border-radius: 8px;
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.18em;
  text-transform: uppercase; cursor: pointer;
  transition: background 200ms ease, border-color 200ms ease, color 200ms ease;
}
.cs2-redesign .cs2-weapon-tab:hover {
  border-color: rgba(0,255,255,0.3);
  color: var(--text-0);
}
.cs2-redesign .cs2-weapon-tab:focus-visible {
  outline: 2px solid var(--brand-cyan);
  outline-offset: 2px;
}
.cs2-redesign .cs2-weapon-tab.active {
  background: linear-gradient(135deg, rgba(0,255,255,0.15), rgba(255,110,199,0.15));
  border-color: rgba(0,255,255,0.5);
  color: var(--text-0);
}
.cs2-redesign .cs2-weapon-tab .count {
  color: var(--text-3); margin-left: 6px; font-size: 10px;
}
.cs2-redesign .cs2-weapon-tab.active .count { color: var(--brand-cyan); }

/* ---------- Mechanics ---------- */
.cs2-redesign .cs2-mechanics {
  background:
    radial-gradient(circle at 8% 10%, rgba(0,255,255,0.06), transparent 32%),
    radial-gradient(circle at 88% 90%, rgba(255,140,0,0.06), transparent 30%),
    linear-gradient(180deg, var(--bg-0), #0c0c18 50%, var(--bg-0) 100%);
}
.cs2-redesign .cs2-mech-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
}
.cs2-redesign .cs2-mech-block {
  border: 1px solid var(--line); border-radius: 12px;
  padding: 22px 24px; background: rgba(12,14,24,0.5);
}
.cs2-redesign .cs2-mech-block .num {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.18em;
  color: var(--brand-cyan); text-transform: uppercase; margin-bottom: 8px;
}
.cs2-redesign .cs2-mech-block h3 {
  font-family: var(--font-display); font-weight: 800; font-size: 18px;
  margin: 0 0 8px; color: var(--text-0); letter-spacing: -0.005em;
}
.cs2-redesign .cs2-mech-block p {
  color: var(--text-1); font-size: 13px; margin: 0; line-height: 1.55;
}

/* ---------- CTA strip ---------- */
.cs2-redesign .cs2-cta-strip {
  padding: 80px 24px;
  text-align: center;
  border-top: 1px solid var(--line);
  background:
    radial-gradient(ellipse at 50% 0%, rgba(0,255,255,0.08), transparent 60%),
    var(--bg-0);
}
.cs2-redesign .cs2-cta-strip .cta-kicker {
  font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.22em;
  color: var(--brand-magenta); text-transform: uppercase; margin-bottom: 14px;
}
.cs2-redesign .cs2-cta-strip .cta-link {
  display: inline-flex; align-items: center; gap: 10px;
  font-family: var(--font-display); font-weight: 800; font-size: 24px;
  color: var(--text-0); text-decoration: none;
  padding: 16px 32px;
  border: 1px solid var(--line-strong); border-radius: 12px;
  background: rgba(12,14,24,0.7);
  transition: border-color 200ms ease, transform 200ms ease;
}
.cs2-redesign .cs2-cta-strip .cta-link:hover {
  border-color: rgba(0,255,255,0.4);
  transform: translateY(-2px);
}
.cs2-redesign .cs2-cta-strip .cta-link:focus-visible {
  outline: 2px solid var(--brand-cyan);
  outline-offset: 4px;
}
.cs2-redesign .cs2-cta-strip .cta-link .arrow { color: var(--brand-cyan); }

/* ---------- Loading spinner (replaces .loadingSpinner from cs2.module.css) ---------- */
.cs2-redesign .cs2-spinner {
  width: 24px; height: 24px;
  border: 2px solid rgba(0,255,255,0.2);
  border-top-color: var(--brand-cyan);
  border-radius: 50%;
  animation: cs2-spin 0.9s linear infinite;
}
@keyframes cs2-spin { to { transform: rotate(360deg) } }

/* ---------- Skeletons (chassis-shaped) ---------- */
.cs2-redesign .cs2-skel-card {
  border-radius: 12px; overflow: hidden;
  background: rgba(12,14,24,0.9); border: 1px solid var(--line);
}
.cs2-redesign .cs2-skel-bar {
  height: 36px; border-bottom: 1px solid var(--line);
  background: linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.08), rgba(255,255,255,0.04));
  background-size: 200% 100%;
  animation: cs2-shimmer 1.4s ease-in-out infinite;
}
.cs2-redesign .cs2-skel-img {
  aspect-ratio: 16/9;
  background: linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.08), rgba(255,255,255,0.04));
  background-size: 200% 100%;
  animation: cs2-shimmer 1.4s ease-in-out infinite;
}
.cs2-redesign .cs2-skel-line {
  height: 12px; border-radius: 4px; margin: 8px 0;
  background: linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.08), rgba(255,255,255,0.04));
  background-size: 200% 100%;
  animation: cs2-shimmer 1.4s ease-in-out infinite;
}
.cs2-redesign .cs2-skel-line.short { width: 60%; }
.cs2-redesign .cs2-skel-line.medium { width: 80%; }
.cs2-redesign .cs2-skel-strip {
  height: 28px; margin-top: 10px;
  border-top: 1px solid var(--line);
}
@keyframes cs2-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ---------- Responsive ---------- */
@media (max-width: 1023px) {
  .cs2-redesign .cs2-grid-cards { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 767px) {
  .cs2-redesign .cs2-grid-cards { grid-template-columns: 1fr; }
  .cs2-redesign .cs2-mech-grid { grid-template-columns: 1fr; }
  .cs2-redesign .cs2-section { padding: 64px 0; }
  .cs2-redesign .cs2-section-header { margin-bottom: 36px; }
}
@media (max-width: 640px) {
  .cs2-redesign .cs2-hero { padding: 100px 24px 60px; }
  .cs2-redesign .cs2-hero .live-badge { top: 76px; right: 16px; }
  .cs2-redesign .cs2-hero .data-strip {
    flex-direction: column; display: flex;
  }
  .cs2-redesign .cs2-hero .data-strip .cell {
    border-right: 0; border-bottom: 1px solid var(--line);
  }
  .cs2-redesign .cs2-hero .data-strip .cell:last-child { border-bottom: 0; }
}

/* ---------- Reduced motion ---------- */
@media (prefers-reduced-motion: reduce) {
  .cs2-redesign .cs2-card,
  .cs2-redesign .cs2-card .img-frame > img,
  .cs2-redesign .cs2-cta-strip .cta-link {
    transition: none !important;
    transform: none !important;
  }
  .cs2-redesign .cs2-card:hover { transform: none; }
  .cs2-redesign .cs2-card:hover .img-frame > img { transform: none; }
  .cs2-redesign .cs2-hero .live-badge::before,
  .cs2-redesign .cs2-skel-bar,
  .cs2-redesign .cs2-skel-img,
  .cs2-redesign .cs2-skel-line {
    animation: none;
  }
}
```

- [ ] **Step 2: Verify file parses**

Open `npm run dev`. The file isn't imported anywhere yet, but verify Next.js doesn't throw during compile.

- [ ] **Step 3: Commit**

```bash
git add src/app/cs2/cs2-redesign.css
git commit -m "Add cs2-redesign.css foundation (tokens, hero, cards, mechanics, cta)"
```

---

### Task 3: Hero rewrite

**Goal:** Replace the corner-bracket hero with the new chassis: gradient title, mono kicker, embedded data strip, live badge, tick indicator. Wrap the entire page tree in `cs2-redesign section-heading-redesign`.

**Files:**
- Modify: `src/app/cs2/page.tsx`

**Acceptance Criteria:**
- [ ] Page wrapper top-level `<div>` has `className="cs2-redesign section-heading-redesign"`
- [ ] `cs2-redesign.css` and `section-headings-redesign.css` are imported at the top of the file
- [ ] Hero markup matches the spec (live badge, kicker, gradient `<h1>`, lede, data strip with 4 cells, tick indicator)
- [ ] Screenshot rotation continues to function (12s interval); the active tick advances with each rotation
- [ ] No corner brackets, no red border, no `bg-black/30`, no `Oficiální screenshoty ze hry` line — all removed
- [ ] Other sections below the hero still render (using existing styles temporarily) — no runtime errors
- [ ] `AnimatedSection` wrapper is removed from the hero (other sections may keep theirs for now)

**Verify:**

```bash
npm run dev
# Open http://localhost:3000/cs2 and inspect the hero
```
Expected:
- Cyan kicker `// CHAPTER 03 · TACTICAL FPS` above the gradient title
- `COUNTER-STRIKE 2` rendered with cyan→pink→orange gradient
- Data strip with Engine / Released / Mode / Esport
- `// LIVE FEED` badge top-right with pulsing cyan dot
- 5 tick bars centered at the bottom; the active one is gradient-filled
- After 12s the active tick advances and the background screenshot changes

**Steps:**

- [ ] **Step 1: Add new state for screenshot index**

Edit `src/app/cs2/page.tsx`. In the existing component, alongside `currentScreenshot`, add:

```tsx
const [currentScreenshotIndex, setCurrentScreenshotIndex] = useState<number>(0);
```

Update the rotation logic to maintain both the URL and the index:

```tsx
useEffect(() => {
  const idx = Math.floor(Math.random() * cs2Screenshots.length);
  setCurrentScreenshotIndex(idx);
  setCurrentScreenshot(cs2Screenshots[idx]);
}, []);

useEffect(() => {
  const interval = setInterval(() => {
    const idx = Math.floor(Math.random() * cs2Screenshots.length);
    setCurrentScreenshotIndex(idx);
    setCurrentScreenshot(cs2Screenshots[idx]);
  }, 12000);
  return () => clearInterval(interval);
}, []);
```

The existing `getRandomCS2Screenshot` helper can be inlined and removed.

- [ ] **Step 2: Update imports and wrapper**

Add these imports near the top of `page.tsx` (after the existing `styles` and `komplexaci.css` imports):

```tsx
import './cs2-redesign.css';
import '../section-headings-redesign.css';
```

Do NOT remove `import '../komplexaci.css';` — that file ships the global `.pill-nav-*` styles for the `Header` component, and every page that renders `<Header />` imports it. Removing it breaks the header on the CS2 page (verified in the original draft of this plan; corrected here).

Also keep `import styles from './cs2.module.css';` for now — the loading state and the not-yet-migrated sections still reference `styles.*`. Task 9 deletes the module file after all sections are migrated.

(Keep all other imports — `Image`, `Link`, types, `Header`, `AnimatedSection`, `StaggeredGrid`, `MapCardSkeleton`, `WeaponCardSkeleton`, `Icon`. They'll be used or pruned in later tasks.)

In the success-state `return`, change the outer wrapper:

```tsx
return (
  <div className="cs2-redesign section-heading-redesign min-h-screen text-white">
    <Header />
    {/* ... sections ... */}
  </div>
);
```

- [ ] **Step 3: Replace the hero JSX**

Replace the existing `{/* Hero Section */}` block (everything from `<section className={...}>` through its closing `</section>`) with:

```tsx
<section className="cs2-hero">
  {currentScreenshot && (
    <div
      className="bg"
      style={{ backgroundImage: `url(${currentScreenshot})` }}
    />
  )}
  <div className="wash" />
  <div className="grid-overlay" />
  <div className="live-badge">// LIVE FEED</div>

  <div className="content">
    <div className="kicker">
      // CHAPTER 03<span className="dot" />TACTICAL FPS
    </div>
    <h1>
      <span>{gameInfo?.title ?? 'COUNTER-STRIKE 2'}</span>
    </h1>
    <p className="lede">
      Legendární taktická FPS od Valve. Pokračování CS:GO na enginu Source 2 přináší nové kouřové granáty, sub-tick a vylepšenou fyziku.
    </p>
    <div className="data-strip">
      <div className="cell">
        <span className="label">Engine</span>
        <span className="val cyan">{gameInfo?.basicInfo.engine ?? 'Source 2'}</span>
      </div>
      <div className="cell">
        <span className="label">Released</span>
        <span className="val">{gameInfo?.basicInfo.releaseDate ?? '—'}</span>
      </div>
      <div className="cell">
        <span className="label">Mode</span>
        <span className="val">{gameInfo?.basicInfo.model ?? '—'}</span>
      </div>
      <div className="cell">
        <span className="label">Esport</span>
        <span className="val cyan">Tier · S</span>
      </div>
    </div>
  </div>

  <div className="indicator">
    {cs2Screenshots.map((_, i) => (
      <span key={i} className={i === currentScreenshotIndex ? 'active' : ''} />
    ))}
  </div>
</section>
```

Notes:
- The "Esport" cell is hard-coded as the editorial short label `Tier · S` (per spec — `gameInfo.basicInfo.esport` is a long sentence not suitable for the strip).
- The 19-screenshot indicator may look crowded; if it does, reduce to a 5-bar windowed indicator in a follow-up. For this task the 1-bar-per-screenshot mapping is correct per spec.
- `AnimatedSection` wrapper is intentionally not used here — CSS handles the visual entrance via opacity/transform if needed.

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
# Open http://localhost:3000/cs2
```

Walk the verify checks. Confirm screenshot rotation + tick advance work correctly.

- [ ] **Step 5: Commit**

```bash
git add src/app/cs2/page.tsx
git commit -m "Rewrite CS2 hero in Esports Pro chassis with data strip + tick indicator"
```

---

### Task 4: Maps section

**Goal:** Replace the maps grid with chassis cards (`// MAP · ##`, `DEFUSAL` tag, mono stats strip with Released / Theme / Mode).

**Files:**
- Modify: `src/app/cs2/page.tsx`

**Acceptance Criteria:**
- [ ] Section uses `cs2-section` + `cs2-shell` classes (not Tailwind)
- [ ] Section header shows `// SECTION 01 · BATTLEGROUNDS` kicker, gradient `MAPY V CS2` title, subtitle
- [ ] Map cards use the new chassis: index bar, image frame with bottom gradient overlay, body with title + desc + stats strip (Released / Theme / Mode)
- [ ] Sequential index numbers, zero-padded (`MAP · 01` … `MAP · 0N`)
- [ ] No Tailwind utility classes remain inside the maps section
- [ ] Hover behavior matches spec (lift, border tint, image scale)

**Verify:** Open `/cs2`, scroll to maps. Each card has the mono header bar, image, mono stats strip. Hover lifts the card and scales the image. Theme value matches the data populated in Task 1.

**Steps:**

- [ ] **Step 1: Replace the maps section JSX**

Find the existing `{/* Maps Section */}` block. Replace the entire `<section ...>...</section>` with:

```tsx
<section className="cs2-section">
  <div className="cs2-shell">
    <div className="cs2-section-header">
      <div className="cs2-section-kicker">// SECTION 01 · BATTLEGROUNDS</div>
      <h2 className="section-title"><span>MAPY V CS2</span></h2>
      <p className="cs2-section-sub">
        Aktivní competitive pool. Ikonické mapy přepracované pro Source 2.
      </p>
    </div>

    <div className="cs2-grid-cards">
      {maps.map((map, idx) => {
        const indexLabel = String(idx + 1).padStart(2, '0');
        const releasedYear = map.releaseDate
          ? new Date(map.releaseDate).getFullYear()
          : '—';
        const modeLabel = map.type.charAt(0).toUpperCase() + map.type.slice(1);
        return (
          <article key={map.id} className="cs2-card">
            <div className="ix-bar">
              <span className="index">// MAP · {indexLabel}</span>
              <span className="ix-tag">{modeLabel.toUpperCase()}</span>
            </div>
            <div className="img-frame">
              <Image
                src={map.image}
                alt={map.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                unoptimized
              />
            </div>
            <div className="body">
              <h3>{map.name}</h3>
              <p className="desc">{map.description}</p>
              <div className="stats">
                <div className="s">
                  <span className="lbl">Released</span>
                  <span className="val">{releasedYear}</span>
                </div>
                <div className="s">
                  <span className="lbl">Theme</span>
                  <span className="val">{map.theme ?? '—'}</span>
                </div>
                <div className="s">
                  <span className="lbl">Mode</span>
                  <span className="val cyan">{modeLabel}</span>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  </div>
</section>
```

Notes:
- The `<Image fill>` requires the `.img-frame` to be `position: relative`; the CSS already sets that via the chassis card's `position: relative` cascading + the `.img-frame` rules.
- Drop the existing `<StaggeredGrid>` wrapper for this section — staggered entrance animation is intentionally removed.
- Drop the `console.log('Rendering map: ...')` debug line during this rewrite.

- [ ] **Step 2: Verify**

Open `/cs2` and scroll to Maps. Verify:
- Header matches `// SECTION 01 · BATTLEGROUNDS` + `MAPY V CS2` (gradient).
- 7 cards with sequential `// MAP · 01` … `// MAP · 07`.
- Each card's stats strip shows Released year, Theme (e.g. `Desert`), Mode (e.g. `Defusal` in cyan).
- Hover: card lifts 3px, border tints cyan, image scales 1.04.
- Layout: 3 columns desktop, 2 columns at ~900–1023px, 1 column ≤767px.

- [ ] **Step 3: Commit**

```bash
git add src/app/cs2/page.tsx
git commit -m "Restyle CS2 maps grid with chassis cards + mono stats strip"
```

---

### Task 5: Weapons section

**Goal:** Replace pill category buttons with rectangular chassis tabs, weapon cards with the chassis (contained image frame for transparent PNGs, `// WPN · ##` index, price/damage/team stats).

**Files:**
- Modify: `src/app/cs2/page.tsx`

**Acceptance Criteria:**
- [ ] Section uses `cs2-section` + `cs2-shell`
- [ ] Header shows `// SECTION 02 · ARMORY` kicker, gradient `ZBRANĚ & VYBAVENÍ` title, subtitle
- [ ] Tabs are rectangular with mono uppercase labels and `/count` suffix in faint text (cyan when active)
- [ ] Active tab uses gradient bg + cyan border (no `transform: scale` or `pulseGlow`)
- [ ] Weapon cards use chassis with `// WPN · ##` index + category tag (`PISTOL`, `RIFLE`, etc.)
- [ ] Weapon image frame is contained (16:9, dark bg, image centered, `object-fit: contain`, max 70%)
- [ ] Stats strip: Price (cyan) / Damage / Team (pink)
- [ ] No Tailwind classes remain inside the weapons section
- [ ] Category description card (`<div className="bg-gray-800/50 ...">`) is removed

**Verify:** Open `/cs2`, scroll to Weapons. Tabs are rectangular with `/count`. Click a tab → weapon set switches → active tab gets gradient bg. Hover on tab tints border cyan. Cards show centered weapon images, mono stats strip.

**Steps:**

- [ ] **Step 1: Replace the weapons section JSX**

Find the existing `{/* Weapons Section */}` block. Replace the entire `<section ...>...</section>` with:

```tsx
<section className="cs2-section">
  <div className="cs2-shell">
    <div className="cs2-section-header">
      <div className="cs2-section-kicker">// SECTION 02 · ARMORY</div>
      <h2 className="section-title"><span>ZBRANĚ &amp; VYBAVENÍ</span></h2>
      <p className="cs2-section-sub">
        Široká škála zbraní pro každou ekonomickou situaci a strategii.
      </p>
    </div>

    <div className="cs2-weapon-tabs" role="tablist">
      {weaponCategories.map((category) => (
        <button
          key={category.id}
          role="tab"
          aria-pressed={activeCategory === category.id}
          onClick={() => setActiveCategory(category.id)}
          className={`cs2-weapon-tab ${activeCategory === category.id ? 'active' : ''}`}
        >
          {category.title}
          <span className="count">/ {String(category.weapons.length).padStart(2, '0')}</span>
        </button>
      ))}
    </div>

    {currentCategory && (
      <div className="cs2-grid-cards">
        {currentCategory.weapons.map((weapon, idx) => {
          const indexLabel = String(idx + 1).padStart(2, '0');
          const teamLabel = weapon.team.toUpperCase();
          return (
            <article key={weapon.id} className="cs2-card">
              <div className="ix-bar">
                <span className="index">// WPN · {indexLabel}</span>
                <span className="ix-tag">{currentCategory.title.toUpperCase()}</span>
              </div>
              <div className="img-frame weapon">
                <Image
                  src={weapon.image}
                  alt={weapon.name}
                  width={160}
                  height={100}
                  unoptimized
                />
              </div>
              <div className="body">
                <h3>{weapon.name}</h3>
                <p className="desc">{weapon.stats}</p>
                <div className="stats">
                  <div className="s">
                    <span className="lbl">Price</span>
                    <span className="val cyan">{weapon.price}</span>
                  </div>
                  <div className="s">
                    <span className="lbl">Damage</span>
                    <span className="val">{weapon.damage}</span>
                  </div>
                  <div className="s">
                    <span className="lbl">Team</span>
                    <span className="val pink">{teamLabel}</span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    )}
  </div>
</section>
```

Notes:
- The `<StaggeredGrid>` wrapper around weapons is dropped.
- The category-description card (which currently renders `currentCategory.description` inside an outer bordered div) is removed — the redesign moves the contextual subtitle up to the section header level.
- Removed: `transform: scale(1.05)` and `pulseGlow` on the active tab. Active state is now purely a color/border change.

- [ ] **Step 2: Verify**

Open `/cs2`, scroll to Weapons. Click each tab in turn. Verify:
- Tabs render as rectangular chassis with `/##` count.
- Active tab has the cyan-pink gradient bg.
- Cards show contained weapon images (no edge-bleed), `// WPN · 01` indexes, price/damage/team stats.
- Tab hover tints border cyan.
- Tab keyboard focus shows cyan outline.

- [ ] **Step 3: Commit**

```bash
git add src/app/cs2/page.tsx
git commit -m "Restyle CS2 weapons: chassis tabs + chassis cards"
```

---

### Task 6: Mechanics section (replaces Game Info)

**Goal:** Drop the existing 2-column "Game Info" block (Basic Info + Mechanics cards). Add a new "Mechanics" section at the bottom with 6 numbered intel blocks.

**Files:**
- Modify: `src/app/cs2/page.tsx`

**Acceptance Criteria:**
- [ ] Existing `{/* Game Info Section */}` block removed entirely
- [ ] New mechanics section added between Weapons and the back button
- [ ] Section uses `cs2-section cs2-mechanics` (gets the deep-dive ambient bg)
- [ ] Header: `// SECTION 03 · MECHANICS` kicker, gradient `HERNÍ MECHANIKY` title, subtitle from `gameInfo.mechanics.description`
- [ ] 6 numbered mech blocks in 2-column grid; each shows `// 01` … `// 06`, parsed title, parsed body
- [ ] Feature strings are split on `' - '` into `{title, body}` (existing data follows this format, e.g. `"Ekonomický systém - nakupování..."`)
- [ ] If a feature has no `' - '`, the whole string becomes the title (graceful fallback)

**Verify:** Open `/cs2`, scroll past Weapons. The Game Info section is gone. A new Mechanics section appears with 6 numbered blocks in a 2-col grid. Subtitle copy matches `gameInfo.mechanics.description`.

**Steps:**

- [ ] **Step 1: Remove the Game Info section**

Find and delete the entire `{gameInfo && (<section className="py-20 px-4">...</section>)}` block (the "O hře Counter-Strike 2" + Basic Info + Mechanics cards block). Its content has been redistributed:
- Basic info → hero data strip (Task 3)
- Mechanics features → new Mechanics section (this task)
- Description paragraph → dropped (lede in hero replaces it)

- [ ] **Step 2: Add the new Mechanics section**

Insert this section after the weapons `</section>` and before the existing back-button block:

```tsx
{gameInfo && (
  <section className="cs2-section cs2-mechanics">
    <div className="cs2-shell">
      <div className="cs2-section-header">
        <div className="cs2-section-kicker">// SECTION 03 · MECHANICS</div>
        <h2 className="section-title"><span>HERNÍ MECHANIKY</span></h2>
        <p className="cs2-section-sub">{gameInfo.mechanics.description}</p>
      </div>

      <div className="cs2-mech-grid">
        {gameInfo.mechanics.features.map((feature, idx) => {
          const dashIndex = feature.indexOf(' - ');
          const title = dashIndex >= 0 ? feature.slice(0, dashIndex) : feature;
          const body = dashIndex >= 0 ? feature.slice(dashIndex + 3) : '';
          const numLabel = String(idx + 1).padStart(2, '0');
          return (
            <div key={idx} className="cs2-mech-block">
              <div className="num">// {numLabel}</div>
              <h3>{title}</h3>
              {body && <p>{body}</p>}
            </div>
          );
        })}
      </div>
    </div>
  </section>
)}
```

- [ ] **Step 3: Verify**

Open `/cs2`. Scroll past Weapons. Confirm:
- No more Basic Info / 2-col Mechanics card block in the middle of the page.
- New Mechanics section at the bottom with 6 blocks, each with `// 01`–`// 06`, a title, and a description paragraph (e.g. block 1: `Ekonomický systém` / `nakupování zbraní a vybavení na začátku každého kola`).
- Subtitle: `Counter-Strike 2 je známý svou hloubkou a vysokým stropem dovedností. Klíčové herní mechaniky zahrnují:`
- Layout: 2 columns desktop, 1 column ≤767px.

- [ ] **Step 4: Commit**

```bash
git add src/app/cs2/page.tsx
git commit -m "Replace CS2 game info with bottom Mechanics section (6 numbered blocks)"
```

---

### Task 7: CTA strip

**Goal:** Replace the existing `Zpět na hlavní stránku` button with the framed CTA strip.

**Files:**
- Modify: `src/app/cs2/page.tsx`

**Acceptance Criteria:**
- [ ] Existing red rounded back button is removed
- [ ] New `<section className="cs2-cta-strip">` is the last element inside the page wrapper
- [ ] Contains a pink mono kicker `// END · CHAPTER 03` and a framed `Link` button to `/`
- [ ] Link shows `Zpět na hlavní stránku` + cyan `→` arrow
- [ ] Hover lifts the button 2px and tints border cyan
- [ ] Keyboard focus shows cyan outline

**Verify:** Open `/cs2`, scroll to bottom. The framed CTA replaces the old red pill button. Hover lifts. Click navigates to `/`.

**Steps:**

- [ ] **Step 1: Replace the back-button block**

Find the `<AnimatedSection ... className="text-center mt-12">` block containing the `Link` to `/`. Replace it (and its surrounding wrapper) with:

```tsx
<section className="cs2-cta-strip">
  <div className="cta-kicker">// END · CHAPTER 03</div>
  <Link href="/" className="cta-link">
    Zpět na hlavní stránku <span className="arrow" aria-hidden="true">→</span>
  </Link>
</section>
```

Note: this CTA section sits as a sibling of the other `<section>` elements — it is not inside any other `<section>`. Make sure there are no leftover wrapper `<section>` or `<div>` from the original button block.

- [ ] **Step 2: Verify**

Open `/cs2`. Scroll to the very bottom. Confirm:
- Framed dark button with `Zpět na hlavní stránku →` (cyan arrow), centered.
- Pink mono kicker above it.
- Hover lifts 2px and border tints cyan.
- Tab key focuses the link with a cyan outline.
- Click navigates to `/`.

- [ ] **Step 3: Commit**

```bash
git add src/app/cs2/page.tsx
git commit -m "Replace CS2 back button with framed CTA strip"
```

---

### Task 8: Skeleton components

**Goal:** Update `MapCardSkeleton` and `WeaponCardSkeleton` to match the chassis layout so the loading state aligns with the new design.

**Files:**
- Rewrite: `src/app/components/MapCardSkeleton.tsx`
- Rewrite: `src/app/components/WeaponCardSkeleton.tsx`

**Acceptance Criteria:**
- [ ] Both components keep their public API: `count?: number` prop, default export, no behavioral change in call sites
- [ ] Markup uses chassis-shaped placeholders: outer `cs2-skel-card` shell, `cs2-skel-bar` for the index bar, `cs2-skel-img` for the image, `cs2-skel-line` for text, `cs2-skel-strip` for the stats strip
- [ ] No Tailwind utility classes in either file
- [ ] Loading state on `/cs2` shows chassis-shaped skeletons that visually match the loaded cards

**Verify:** With network throttled to "Slow 3G" in DevTools, navigate to `/cs2`. The skeleton placeholders match the new card chassis (header bar, image area, body lines, stats strip) instead of the old grey rectangles.

**Steps:**

- [ ] **Step 1: Rewrite `MapCardSkeleton.tsx`**

Replace the file contents with:

```tsx
'use client';

interface MapCardSkeletonProps {
  count?: number;
}

const MapCardSkeleton: React.FC<MapCardSkeletonProps> = ({ count = 7 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="cs2-skel-card">
          <div className="cs2-skel-bar" />
          <div className="cs2-skel-img" />
          <div className="body" style={{ padding: '14px 16px 16px' }}>
            <div className="cs2-skel-line medium" />
            <div className="cs2-skel-line short" />
            <div className="cs2-skel-strip" />
          </div>
        </div>
      ))}
    </>
  );
};

export default MapCardSkeleton;
```

- [ ] **Step 2: Rewrite `WeaponCardSkeleton.tsx`**

Replace the file contents with:

```tsx
'use client';

interface WeaponCardSkeletonProps {
  count?: number;
}

const WeaponCardSkeleton: React.FC<WeaponCardSkeletonProps> = ({ count = 6 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="cs2-skel-card">
          <div className="cs2-skel-bar" />
          <div className="cs2-skel-img" />
          <div className="body" style={{ padding: '14px 16px 16px' }}>
            <div className="cs2-skel-line medium" />
            <div className="cs2-skel-line short" />
            <div className="cs2-skel-strip" />
          </div>
        </div>
      ))}
    </>
  );
};

export default WeaponCardSkeleton;
```

(MapCardSkeleton and WeaponCardSkeleton are visually identical now — both render the same chassis shape. Keep them as separate components for callsite clarity and to leave room for divergence later.)

- [ ] **Step 3: Update the loading-state JSX in `page.tsx`**

The skeleton classes only render correctly inside the `cs2-redesign` scope. Update the `if (loading) { return ... }` branch in `page.tsx` to wrap the loading return in the same wrapper as the success state and replace its Tailwind skeleton scaffolding:

```tsx
if (loading) {
  return (
    <div className="cs2-redesign section-heading-redesign min-h-screen text-white">
      <Header />
      <section className="cs2-hero">
        <div className="wash" />
        <div className="grid-overlay" />
        <div className="content">
          <div className="kicker">// CHAPTER 03 · TACTICAL FPS</div>
          <h1><span>COUNTER-STRIKE 2</span></h1>
          <p className="lede">&nbsp;</p>
        </div>
      </section>

      <section className="cs2-section">
        <div className="cs2-shell">
          <div className="cs2-section-header">
            <div className="cs2-section-kicker">// SECTION 01 · BATTLEGROUNDS</div>
            <h2 className="section-title"><span>MAPY V CS2</span></h2>
          </div>
          <div className="cs2-grid-cards">
            <MapCardSkeleton count={6} />
          </div>
        </div>
      </section>

      <section className="cs2-section">
        <div className="cs2-shell">
          <div className="cs2-section-header">
            <div className="cs2-section-kicker">// SECTION 02 · ARMORY</div>
            <h2 className="section-title"><span>ZBRANĚ &amp; VYBAVENÍ</span></h2>
          </div>
          <div className="cs2-grid-cards">
            <WeaponCardSkeleton count={6} />
          </div>
        </div>
      </section>

      <div style={{ position: 'fixed', bottom: 32, right: 32 }}>
        <div className="cs2-spinner" />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Open DevTools → Network tab → throttle to "Slow 3G". Hard-reload `/cs2`. Confirm:
- Hero placeholder, two skeleton sections (Maps, Weapons), each with chassis-shaped placeholders.
- Bottom-right cs2-spinner spinning.
- After data loads, skeletons replaced with real cards (no flash of unstyled content).

- [ ] **Step 5: Commit**

```bash
git add src/app/components/MapCardSkeleton.tsx src/app/components/WeaponCardSkeleton.tsx src/app/cs2/page.tsx
git commit -m "Match CS2 skeletons + loading state to redesign chassis"
```

---

### Task 9: Cleanup, route loader, and verification pass

**Goal:** Delete `cs2.module.css`, prune dead imports, align `loading.tsx`, and run the full verification matrix from the spec.

**Files:**
- Delete: `src/app/cs2/cs2.module.css`
- Modify: `src/app/cs2/page.tsx` (prune unused imports)
- Modify: `src/app/cs2/loading.tsx` (match new style)

**Acceptance Criteria:**
- [ ] `src/app/cs2/cs2.module.css` is deleted
- [ ] No reference to `styles.*` (the CSS module) remains in `page.tsx`
- [ ] `import '../komplexaci.css';` IS still present (global Header pill-nav styles live there — every page that renders `<Header />` keeps this import)
- [ ] No usage of `AnimatedSection` or `StaggeredGrid` remains in `page.tsx` (their imports are also removed; the components themselves stay because `wwe-games/page.tsx` still uses them)
- [ ] No usage of `Icon` remains in `page.tsx` if no icons are referenced (remove import if so)
- [ ] `src/app/cs2/loading.tsx` uses Esports Pro language (cs2-redesign scope, cyan spinner, dark bg, mono "// LOADING" kicker)
- [ ] `npm run build` succeeds with no TS or lint errors
- [ ] All spec verification-plan checks pass

**Verify:** Full verification matrix below.

**Steps:**

- [ ] **Step 1: Delete `cs2.module.css`**

```bash
git rm src/app/cs2/cs2.module.css
```

- [ ] **Step 2: Prune `page.tsx` imports**

Open `src/app/cs2/page.tsx`. Remove any of these imports if no usage remains in the file:
- `import styles from './cs2.module.css';` (must be gone — `cs2.module.css` is being deleted)
- `import AnimatedSection from '../components/AnimatedSection';` (remove)
- `import StaggeredGrid from '../components/StaggeredGrid';` (remove)
- `import { Icon } from '../components/Icon';` (remove if Icon no longer used)

Keep `import '../komplexaci.css';` — it provides the global `.pill-nav-*` styles for `<Header />`. Every page that uses Header imports it.

Also confirm these imports are present:
- `import './cs2-redesign.css';`
- `import '../section-headings-redesign.css';`

- [ ] **Step 3: Align `loading.tsx`**

Replace `src/app/cs2/loading.tsx` contents:

```tsx
import './cs2-redesign.css';

export default function Loading() {
  return (
    <div className="cs2-redesign" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="cs2-spinner" style={{ margin: '0 auto 16px' }} />
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-cyan)', fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 8 }}>
          // LOADING
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--text-0)' }}>
          Counter-Strike 2
        </div>
        <div style={{ fontFamily: 'var(--font-body)', color: 'var(--text-2)', fontSize: 13, marginTop: 4 }}>
          Připravujeme zbraně a mapy
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Build and lint**

```bash
npm run build
```
Expected: success, no TS errors, no ESLint errors.

If lint complains about an unused import or variable, remove it.

- [ ] **Step 5: Visual verification matrix**

Run `npm run dev` and walk through each item from the spec's verification plan:

1. **Visual cohesion**: Open `/` and `/cs2` side-by-side. Confirm shared visual language (gradient titles, mono kickers, chassis cards).
2. **Hero**: Background screenshot rotates every 12s. Tick indicator advances. Live badge dot pulses.
3. **Maps**: 7 cards rendering in 3-col grid. Hover lifts + image scales. Theme value populated.
4. **Weapons**: All categories tabbable. Active tab has gradient bg + cyan border. Card weapon images centered (no edge-bleed). Stats show price (cyan) / damage / team (pink).
5. **Mechanics**: 6 numbered blocks at the bottom. Subtitle from `gameInfo.mechanics.description`. 2-col → 1-col responsive.
6. **CTA**: Framed link at the very bottom. Hover lifts. Tab focus has cyan outline. Clicks navigate to `/`.
7. **Loading**: Throttle to Slow 3G, hard-reload. Skeletons match chassis. No flash of unstyled content when data loads.
8. **Responsive**: Resize 1280 → 1024 → 768 → 640 → 360. Section header sizes clamp; grids collapse 3 → 2 → 1. Hero data strip stacks vertically at ≤640px.
9. **Accessibility**: Tab through page. Each interactive element (weapon tabs, CTA link) shows cyan focus outline. In macOS Reduced Motion / Windows Animation Off setting (or DevTools "Emulate prefers-reduced-motion: reduce"), confirm card hover lifts and image scales are suppressed; live badge pulse is disabled.
10. **Console**: No errors or warnings in DevTools console during navigation, hover, or tab clicks.
11. **Layout shift**: Reload page, watch for CLS. The hero placeholder + skeleton sections should pre-occupy roughly the same space as the loaded content (no content jump after fetch resolves).

If any check fails, fix it before proceeding to commit. Document any expected gaps as follow-ups in the commit message.

- [ ] **Step 6: Commit**

```bash
git add -A src/app/cs2/ src/app/components/
git commit -m "Clean up CS2 redesign: remove cs2.module.css, prune dead imports, polish loader"
```

---

## Self-review

**Spec coverage:**
- Visual identity tokens → Task 2 (✓)
- 5-section page structure → Tasks 3–7 (✓)
- Hero with rotating screenshots, live badge, tick indicator, data strip → Task 3 (✓)
- Maps chassis cards with `// MAP · ##`, stats strip (Released / Theme / Mode) → Task 4 (✓)
- Weapons rectangular tabs + chassis cards with `// WPN · ##`, stats strip (Price / Damage / Team) → Task 5 (✓)
- Mechanics 6-block deep dive → Task 6 (✓)
- CTA strip → Task 7 (✓)
- `theme` field on `GameMap` → Task 1 (✓)
- Loading skeletons + loader → Task 8, Task 9 step 3 (✓)
- Responsive + reduced-motion + a11y → Task 2 (CSS rules), Task 9 (verification) (✓)
- Delete `cs2.module.css` + prune imports → Task 9 (✓)

**Placeholder scan:** No "TBD" / "implement later" / "appropriate error handling" placeholders — every step has concrete code or commands.

**Type consistency:**
- `theme?: string` defined in Task 1, used in Task 4 with `map.theme ?? '—'` ✓
- `currentScreenshotIndex` defined in Task 3, used in Task 3 indicator ✓
- `cs2-redesign` wrapper class introduced in Task 3, used by skeletons in Task 8, used by loader in Task 9 ✓
- Card chassis classes (`cs2-card`, `ix-bar`, `img-frame`, `body`, `stats`) defined in Task 2, used identically in Task 4 (maps) and Task 5 (weapons) ✓

No outstanding gaps.
