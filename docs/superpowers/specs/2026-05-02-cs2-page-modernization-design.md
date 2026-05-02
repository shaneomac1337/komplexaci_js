# CS2 Page Modernization — Design

## Context

The homepage was recently modernized into an "Esports Pro" visual language. It uses scoped CSS files (`hero-members-redesign.css`, `community-redesign.css`, `games-redesign.css`, `section-headings-redesign.css`, `about-redesign.css`) keyed off class names like `.hero-redesign` and `.games-redesign`. The shared signature:

- Palette: `#07070d` / `#0a0a14` / `#11111e` backgrounds, accents in `#00FFFF` (cyan), `#ff6ec7` (pink), `#FF8C00` (orange)
- Typography: `Exo 2` (display, weight 900, tight letter-spacing), `Roboto` (body), `JetBrains Mono` (mono labels and detail strips)
- Big gradient section titles (cyan → pink → orange)
- Subtle grid overlay textures, radial gradient washes, mono kicker labels (`// SECTION 01 · ...`)
- Card chassis with mono header bars and stat strips

The current CS2 page (`src/app/cs2/page.tsx`, `src/app/cs2/cs2.module.css`) does not share this language. It uses Tailwind utility classes (`bg-gray-900`, `text-red-400`, etc.), red/orange CS2-themed accents, generic card layouts, a corner-bracket hero, and pill-shaped weapon category buttons. It functions but feels disconnected from the homepage chapter.

## Goal

Bring CS2 into the homepage's Esports Pro language so it reads as another "chapter" of the same site — not a redesign of the brand, just a re-skin and a small re-org of the same content. Keep the rotating screenshot hero (signature element). Drop nothing user-facing.

## Non-goals

- No change to APIs (`/api/cs2/weapons`, `/api/cs2/maps`, `/api/cs2/game-info`) other than a single optional field addition (see Data Model).
- No new live data (no Discord / Steam / community modules added). Out of scope; can be a follow-up.
- No changes to the global Header, Footer, or other pages.
- No CS2 brand-color palette (red/orange) — using the homepage's cyan/pink/orange.
- No animation library swap. Keep `AnimatedSection` / `StaggeredGrid` if useful; otherwise replace with simple CSS transitions.

## Visual identity (locked)

Same scoped tokens as the homepage. The new CS2 stylesheet defines them under `.cs2-redesign`:

| Token | Value |
| --- | --- |
| `--bg-0` | `#07070d` |
| `--bg-1` | `#0a0a14` |
| `--bg-2` | `#11111e` |
| `--brand-cyan` | `#00FFFF` |
| `--brand-magenta` | `#ff6ec7` |
| `--brand-orange` | `#FF8C00` |
| `--line` | `rgba(255,255,255,0.08)` |
| `--line-strong` | `rgba(255,255,255,0.16)` |
| `--text-0` / `--text-1` / `--text-2` / `--text-3` | `#ffffff` / `#d8d8e8` / `#9b9bb0` / `#6b6b80` |
| `--font-display` | `Exo 2` |
| `--font-body` | `Roboto` |
| `--font-mono` | `JetBrains Mono` |

Section titles use the existing `.section-heading-redesign` gradient (cyan → pink → orange) — adopt that class on each section header on the page so it matches the rest of the site verbatim.

## Page structure

Five sections, top to bottom:

1. **Hero** (replaces current corner-bracket hero)
2. **Maps** (re-styled, content unchanged)
3. **Weapons** (re-styled, tabs restyled)
4. **Mechanics** (replaces current 2-column "Game Info" cards; moved to the bottom)
5. **CTA strip** (replaces current "Zpět na hlavní stránku" button)

The current standalone "O hře Counter-Strike 2" intro paragraph is dropped — its content collapses cleanly into:
- **Basic info** (developer, engine, release, mode, esport) → embedded in the hero data strip
- **Description** → reused as the hero `lede` (1–2 sentences, condensed)
- **Mechanics features** → main focus of section 4 (Mechanics)

This reduces scroll fatigue and turns the page into a narrative arc: intro → terrain → arsenal → "what makes it CS".

## Section 1 — Hero

Full-bleed, `min-height: 100vh`, bleeds up under the 64px header band (`margin-top: -64px`, `padding-top: 140px`) — same approach as `.hero-redesign`.

**Background**: existing `cs2Screenshots` array (19 official Steam shots) cycled every 12s exactly as today. The current dual-image (blurred + main) treatment is dropped; replace with a single full-cover image at `opacity: 0.55`. Above it:

- A radial gradient wash: `radial-gradient(ellipse at 28% 22%, rgba(0,255,255,0.10), transparent 50%), radial-gradient(ellipse at 78% 80%, rgba(255,110,199,0.10), transparent 50%), linear-gradient(180deg, rgba(7,7,13,0.4) 0%, rgba(7,7,13,0.85) 70%, var(--bg-0) 100%)`
- A subtle grid overlay: 56px×56px lines at `rgba(0,255,255,0.04)` / `rgba(0,255,255,0.035)`, masked with vertical fade

**Foreground content** (centered):

1. **Live badge** (top-right, absolute): `// LIVE FEED` in JetBrains Mono, cyan, with a pulsing 6px cyan dot. Indicates the rotation is active.
2. **Mono kicker**: `// CHAPTER 03 · TACTICAL FPS` (cyan, JetBrains Mono, letter-spacing `0.22em`)
3. **Gradient title**: `COUNTER-STRIKE 2` — `Exo 2` 900, `clamp(54px, 8vw, 130px)`, `letter-spacing: -0.04em`, gradient text (cyan → pink → orange). Uses the same `.section-title span` pattern as the homepage.
4. **Lede**: condensed 1–2 sentence intro. Default copy: *"Legendární taktická FPS od Valve. Pokračování CS:GO na enginu Source 2 přináší nové kouřové granáty, sub-tick a vylepšenou fyziku."* Roboto 300, 19px, `max-width: 680px`.
5. **Data strip** (inline-flex, centered, `border-radius: 12px`, `backdrop-filter: blur(10px)`, dark translucent bg). Four cells separated by 1px hairlines:
   - **Engine**: `Source 2` (cyan)
   - **Released**: `27 · 09 · 2023` (white)
   - **Mode**: `Free-to-play` (white)
   - **Esport**: `Tier · S` (cyan)
6. **Tick indicator** (absolute, bottom-center): 5 small bars (`22px × 2px`), the current screenshot's index gets a cyan→pink gradient fill, the rest are `rgba(255,255,255,0.2)`.

Data strip values map to fields already in `gameInfo.basicInfo` (`engine`, `releaseDate`, `model`, plus a hard-coded `esport` short label). The current chassis (corner brackets, red border, "Oficiální screenshoty ze hry" tagline) is removed entirely.

**Mobile (≤640px)**: data strip becomes a vertical stack with bottom hairlines instead of right hairlines. Live badge + tick indicator stay. Title clamp scales down naturally.

## Section 2 — Maps

`.section` (96px vertical padding, `min(1180px, calc(100% - 48px))` shell). Standard Esports Pro section header:

- **Kicker**: `// SECTION 01 · BATTLEGROUNDS`
- **Gradient title**: `MAPY V CS2`
- **Subtitle**: *"Aktivní competitive pool. Ikonické mapy přepracované pro Source 2."*

Below: a 3-column grid (2-col at ≤900px, 1-col at ≤640px), gap 18px, with **chassis cards** (Style B from brainstorming):

```
┌─────────────────────────────────┐
│ // MAP · 03         DEFUSAL     │  ← mono index bar (cyan / pink), 1px bottom hairline
├─────────────────────────────────┤
│                                 │
│         [16:9 image]            │  ← background-image, scales 1.04 on hover
│                                 │
├─────────────────────────────────┤
│ Dust II                         │  ← Exo 2 800, 19px
│ Pouštní prostředí, dva...       │  ← Roboto, 13px
│ ─────────────────────           │  ← hairline
│ RELEASED  THEME    MODE         │  ← stats strip (3 cells, JetBrains Mono)
│ 2001      Desert   Defusal      │
└─────────────────────────────────┘
```

- Card border: `1px solid var(--line)` → `rgba(0,255,255,0.32)` on hover
- Card lifts `translateY(-3px)` on hover (220ms ease)
- Image has a bottom-half dark gradient overlay so the bottom edge of the image blends into the card body
- Index numbers are sequential per render order (`MAP · 01` to `MAP · 0N`), zero-padded to 2 digits

**Stats strip cells** (3, mono labels in `--text-3` / values in `--text-0` or `--brand-cyan`):
- **RELEASED**: year extracted from `releaseDate` (e.g. `2001`)
- **THEME**: new field added to `GameMap`. See Data Model below.
- **MODE**: `type` field, capitalized (`defusal` → `Defusal`)

The current `features` array is no longer surfaced on cards (replaced by the structured stats strip). It can stay in the data model for future use.

## Section 3 — Weapons

Same section shell. Header:

- **Kicker**: `// SECTION 02 · ARMORY`
- **Gradient title**: `ZBRANĚ & VYBAVENÍ`
- **Subtitle**: *"Široká škála zbraní pro každou ekonomickou situaci a strategii."*

**Category tabs** (replaces current pill buttons): rectangular chassis tabs centered, gap 8px.

```
┌──────────────────┐  ┌──────────────────┐
│ PISTOLE / 09     │  │ SMG / 06         │
└──────────────────┘  └──────────────────┘
```

- Tab: `padding: 10px 18px`, `border-radius: 8px`, `border: 1px solid var(--line)`, dark bg
- Mono label (`JetBrains Mono`, `0.18em` tracking, uppercase, 11px), with a `/count` suffix in `--text-3` showing the weapon count for that category
- Active tab: gradient background `linear-gradient(135deg, rgba(0,255,255,0.15), rgba(255,110,199,0.15))`, cyan border, white label, cyan `/count`
- Hover: cyan-tinted border, white label
- Removed: `transform: scale(1.05)` and `pulseGlow` from the current implementation — visually too loud against the new chassis aesthetic

**Weapon cards**: same chassis as map cards, with key differences:

- Index bar: `// WPN · ##` cyan, category tag (`PISTOL`, `RIFLE`, etc.) in pink
- **Image frame** is `aspect-ratio: 16/9` with a dark `rgba(7,7,13,0.6)` background; weapon image is centered (`object-fit: contain`, `max-height: 70%`, `max-width: 70%`). Weapons use transparent PNGs, so an edge-bleed image (like maps) wouldn't work — they need a contained frame. No bottom gradient overlay on the weapon frame.
- Stats strip cells:
  - **PRICE** (cyan): `$200`
  - **DAMAGE** (white): `28`
  - **TEAM** (pink): `T` / `CT` / `BOTH` — derived from existing `team` field

The category description text (currently shown above the weapons grid in a bordered card) is dropped — the new visual hierarchy makes it redundant.

## Section 4 — Mechanics (replaces "Game Info")

Section is given a slight ambient background tint to mark it as a "deep dive" zone:

```css
background:
  radial-gradient(circle at 8% 10%, rgba(0,255,255,0.06), transparent 32%),
  radial-gradient(circle at 88% 90%, rgba(255,140,0,0.06), transparent 30%),
  linear-gradient(180deg, var(--bg-0), #0c0c18 50%, var(--bg-0) 100%);
```

Header:

- **Kicker**: `// SECTION 03 · MECHANICS`
- **Gradient title**: `HERNÍ MECHANIKY`
- **Subtitle**: comes from `gameInfo.mechanics.description` (*"Counter-Strike 2 je známý hloubkou..."*)

**Mech blocks**: 2-column grid (1-col at ≤900px), gap 14px. Replaces the current bullet list inside the "Mechanics" card.

```
┌────────────────────────────────────┐
│ // 01                              │  ← mono numbered kicker, cyan
│ Ekonomický systém                  │  ← Exo 2 800, 18px
│ Nakupování zbraní a vybavení...    │  ← Roboto, 13px, --text-1
└────────────────────────────────────┘
```

- Block: `padding: 22px 24px`, `border: 1px solid var(--line)`, `border-radius: 12px`, dark translucent bg
- Mono kicker: `// 01` to `// 06`, JetBrains Mono, cyan, `0.18em` tracking
- Title: existing first clause of the feature string (e.g. `"Ekonomický systém"`)
- Body: existing description text after the dash (e.g. `"Nakupování zbraní a vybavení na začátku každého kola podle týmové ekonomiky."`)

The current `gameInfo.mechanics.features` array (6 strings) maps 1-to-1 to 6 blocks. Each feature string is split on `" - "` into `{ title, body }`. Existing data already follows this format, so no data changes needed for Mechanics.

## Section 5 — CTA strip

Full-width band, top hairline border, vertical padding 80px, centered content. Background:

```css
background:
  radial-gradient(ellipse at 50% 0%, rgba(0,255,255,0.08), transparent 60%),
  var(--bg-0);
```

- **Kicker**: `// END · CHAPTER 03` (pink, JetBrains Mono)
- **Link**: framed button, dark translucent bg, hairline border that lifts to cyan on hover, `Exo 2` 800, `Zpět na hlavní stránku → ` (arrow in cyan)

Replaces the current red rounded `Zpět na hlavní stránku` button.

## Data model changes

One new optional field on `GameMap`:

```ts
// src/app/types/cs2.ts
export interface GameMap {
  id: string;
  name: string;
  description: string;
  image: string;
  type: 'defusal' | 'hostage' | 'wingman';
  active: boolean;
  releaseDate?: string;
  features: string[];
  theme?: string;          // NEW — short editorial theme label, e.g. "Desert", "Italy"
}
```

Populate `theme` for each of the 7 active maps in `src/app/api/cs2/maps/route.ts`:

| Map | Theme |
| --- | --- |
| Ancient | Jungle |
| Anubis | Egypt |
| Dust II | Desert |
| Inferno | Italy |
| Mirage | Morocco |
| Nuke | Industrial |
| Train | Industrial |

If `theme` is absent at render time, render `—` in that cell (graceful fallback).

No other API changes. `GameInfo`, `Weapon`, `WeaponCategory` types are untouched.

## Loading and error states

- **Loading skeleton**: replace the current Tailwind-grey skeletons with chassis-style placeholders matching the new card layout (mono header bar with shimmer, image frame with shimmer, stats strip placeholder). Same six skeleton cards in the maps section, three in weapons, and a hero-shaped placeholder.
- **Error state**: keep the current minimalist centered red error message but restyle: `JetBrains Mono`, cyan border accent, no full-page red.

Skeleton components (`MapCardSkeleton`, `WeaponCardSkeleton`) at `src/app/components/MapCardSkeleton.tsx` and `WeaponCardSkeleton.tsx` get rewritten to match the new chassis. Their props (`count`) and call sites are unchanged.

## Component / file plan

**New file** — `src/app/cs2/cs2-redesign.css`

- All scoped tokens under `.cs2-redesign`
- All section / component styles (hero, section, card, weapon-tab, mech-block, cta-strip, etc.)
- Responsive breakpoints
- Imported once at the top of `page.tsx` (alongside `section-headings-redesign.css`)
- ~600–800 lines, similar to `games-redesign.css`

**Major rewrite** — `src/app/cs2/page.tsx`

- Wrap entire page tree in `<div className="cs2-redesign section-heading-redesign">`
- Drop all Tailwind utility classes (`bg-gray-900`, `text-red-400`, `rounded-2xl`, etc.)
- Replace inline corner-bracket hero with new hero structure
- Restructure: Hero → Maps → Weapons → Mechanics → CTA (drop "O hře" intro section, drop "Game Info" 2-column block; merge into hero data strip + Mechanics)
- Keep existing data fetching (`useEffect` with `Promise.all` of three endpoints) unchanged
- Keep `currentScreenshot` rotation logic exactly as today
- Add `currentScreenshotIndex` state alongside `currentScreenshot` to drive the tick indicator
- Replace category description card with a one-line subtitle under the section title (gameInfo or hardcoded)
- Likely retire `AnimatedSection` / `StaggeredGrid` wrappers in favor of CSS-only transitions (the homepage doesn't use them; consistency)
- Replace category buttons with `weapon-tab` markup
- Replace all card markup with the new chassis structure
- Remove the `cs2.module.css` import; it is deleted in this pass

**Deleted** — `src/app/cs2/cs2.module.css`

- All styles superseded by `cs2-redesign.css`. Specifically gone: `.heroSection`, `.parallaxBg`, `.textShadow`, `.textGradient`, `.textGlow`, `.glowEffect`, `.cardHover`, `.imageReveal`, `.categoryButton`, `.categoryButtonActive`, `.pulseGlow`, `.loadingSpinner`. The new spinner (used briefly during loading state) is moved into the new redesign CSS.

**Updated** — `src/app/api/cs2/maps/route.ts`

- Add `theme: string` to each of the 7 map objects
- No interface changes beyond the new optional field on `GameMap`

**Updated** — `src/app/types/cs2.ts`

- Add `theme?: string` to `GameMap`

**Updated** — `src/app/components/MapCardSkeleton.tsx`, `src/app/components/WeaponCardSkeleton.tsx`

- Rewrite markup + classes to match new chassis. Same exported API.

**Untouched**

- `src/app/cs2/layout.tsx` (just sets metadata)
- `src/app/cs2/loading.tsx` (route-level loader; check whether it needs alignment)
- `src/app/cs2/error.tsx` (minimal error boundary)
- `src/app/cs2/README.md` (page docs)
- `src/app/api/cs2/weapons/route.ts`, `src/app/api/cs2/game-info/route.ts`
- `Header`, `AnimatedSection`, `StaggeredGrid`, `Icon` components — left in place; usage on this page may shrink

## Animations and motion

Match the homepage's restraint. No heavy animation framework, no scroll-triggered animations beyond what the rest of the site uses. Specifically:

- Hero screenshot rotation: existing 12s `setInterval` unchanged
- Hero live badge dot: 1.4s ease-in-out pulse opacity (CSS keyframes)
- Cards: hover lift (`translateY(-3px)`, 220ms), border color (`var(--line)` → `rgba(0,255,255,0.32)`), and image scale (`1.04`, 400ms ease)
- Weapon tabs: 200ms transitions on background, border, text color
- CTA link: 200ms hover transitions

Respect `prefers-reduced-motion`: disable card lifts, image scales, and the pulse animation. The 12s screenshot rotation stays (it's a content rotation, not motion).

## Accessibility

- All interactive controls (weapon tabs, CTA link) keyboard-focusable with visible focus styles (cyan outline, matches site norm)
- `aria-pressed` on the active weapon tab
- Images keep `alt` text from data
- Color contrast verified for all `--text-*` tokens against `--bg-0` (already passing in homepage; same tokens)
- Live badge pulse animation honors `prefers-reduced-motion`

## Responsive breakpoints

- `≥1024px`: 3-column maps + weapons grid, 2-column mechanics grid
- `768–1023px`: 2-column maps + weapons, 2-column mechanics
- `≤767px`: 1-column maps + weapons, 1-column mechanics, hero data strip stacks vertically with bottom hairlines, section titles clamp down (mirror `section-headings-redesign.css` mobile rules)
- Hero `padding` reduces to `100px 24px 60px` at `≤640px`

## Open questions / future work (not in this spec)

- Tier badge on maps (S / A) — purely editorial; currently dropped from the spec because the data is opinion, not fact. Could add later as a follow-up if desired.
- Live community module showing CS2 players in the Discord — out of scope; would need data work.
- Cross-chapter "next" link in CTA strip (e.g. → /league-of-legends) — left as a simple back-to-home for now.
- Schema.org JSON-LD update — `gameInfo.schema` exists in the API but isn't currently emitted by the page. Out of scope for the redesign; can be tackled separately.

## Verification plan

After implementation, in the browser at `localhost:3000/cs2`:

- Visual: scroll the page and verify each section matches the mockup (hero with rotating screenshots + ticks, maps grid, weapons tabs + grid, mechanics blocks, CTA strip). Compare side-by-side with homepage at `localhost:3000` to confirm shared visual language.
- Functional: weapon category tab clicks switch the displayed weapon set; screenshot rotation cycles every 12s; tick indicator advances; hover effects work on cards.
- Loading: throttle network and verify skeletons render with the new chassis style.
- Responsive: resize from 1280px down to 360px and verify section header sizing, grid collapses, hero data strip stacks, mobile padding.
- Accessibility: tab through interactive controls; check focus rings; toggle `prefers-reduced-motion` and verify pulse / lift animations are suppressed.
- No console errors. No layout shift after data loads.
