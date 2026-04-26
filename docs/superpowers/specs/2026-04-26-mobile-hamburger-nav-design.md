# Mobile Hamburger Nav — Design

## Context

The current `Header.tsx` pill nav (`src/app/components/Header.tsx`, styled in `src/app/komplexaci.css`) targets desktop-first and breaks on phones. At 375px:

- 6 nav items + Login + brand cannot fit, items overlap (`ČLENOVÉRY`, `DISCORDKONTA`)
- Login button is clipped at the right edge
- Brand is hidden below 520px (existing rule)
- A horizontal-scroll fallback exists below 520px but conflicts with the indicator-pill math and the `Hry` dropdown

The desktop pill — including the dock-on-scroll choreography (chassis morph, glow line draw, shelf wipe, slow undock trail) — works well above ~768px. This spec only changes mobile behavior; desktop is untouched.

## Goal

Replace the squashed mobile pill with a standard full-screen hamburger overlay that:

- Fits all phone widths (320–768px) with safe touch targets (≥48px)
- Preserves the existing dock-on-scroll behavior on the closed pill
- Reuses existing scroll-spy, section accent colors, and `navigateToSection` logic
- Stays accessible (focus trap, ESC, ARIA, reduced-motion)

## Non-goals

- Any change to the desktop pill, indicator, dock animation, glow line, or shelf at >768px
- Restyling the `NAV_ITEMS` data structure or per-page `PAGE_COLOR_MAP`
- Bottom-tab-bar pattern (rejected)
- Pill-morph-into-overlay pattern (rejected as non-standard)

## Activation breakpoint

**≤768px** activates hamburger mode. The cutoff matches the existing `@media (max-width: 768px)` block in `komplexaci.css` and the iPad-mini portrait threshold. Above 768px, no behavior changes.

## Closed (pill) state at ≤768px

- Same floating pill chassis at `top: 10px`, centered, with all existing dock-on-scroll behavior preserved
- Contents reorganized to: `KOMPLEXÁCI` brand (left) + hamburger icon button (right)
- The full nav-items list and the existing AuthButton are NOT rendered into the pill at this width — they live in the overlay
- Brand becomes visible again on mobile (current rule hiding it <520px is removed; with items moved out, there is room)
- Active section accent (`--pill-accent`) still drives the chassis bottom border / dock glow line, exactly as today, derived from scroll-spy
- Hamburger button: 44×44px tap area, three 18px-wide stacked lines, `currentColor` strokes, `aria-label="Open menu"` / `aria-label="Close menu"`, `aria-expanded`, `aria-controls`

## Open (overlay) state

- Triggered by tap on hamburger button
- Full-viewport overlay, position fixed, `inset: 0`, z-index above page content but below the pill chassis (so the pill remains visible at the top)
- Background: `rgba(5, 5, 10, 0.94)` with `backdrop-filter: blur(20px) saturate(140%)` — same vocabulary as the docked-bar background
- Content layout, top to bottom:
  1. Login button (full-width, prominent, top of list)
  2. Domů
  3. O nás
  4. Členové
  5. Hry ▾ (tap expands an indented sub-list inline: League of Legends / CS2 / WWE Games)
  6. Discord
  7. Kontakt
- Each top-level item: ≥48px tall, full-width tap target, 16-18px font, left-aligned with horizontal padding
- Active section: 4px-wide left-edge accent bar in the section's `SECTION_COLOR_MAP` color (same map already used)
- Hover/focus state: faint accent-tinted background fill

## Animations

- Open: overlay slides down from `translateY(-100%)` to `translateY(0)` over 0.32s, `cubic-bezier(0.22, 1, 0.36, 1)`. Items inside stagger-fade in (each item delayed by ~30ms after the previous, opacity 0 → 1 + small `translateY(8px) → 0`)
- Close: reverse — overlay slides back up over 0.28s with the same easing. Items don't need staggered exit; they fade with the overlay
- Hamburger ↔ × icon: lines transform via CSS — top line rotates 45° + translates down, middle line fades out, bottom line rotates -45° + translates up. ~0.22s ease-out
- Reduced motion (`@media (prefers-reduced-motion: reduce)`): skip slide and stagger; overlay opacity-fades only over 0.12s; hamburger icon swaps without rotation animation

## Interactions

- Hamburger button toggles overlay open/closed
- Tapping any nav item: closes overlay AND triggers existing `navigateToSection(id)` (which on `/` smooth-scrolls; off-route navigates to `/#id`)
- Tapping a Hry sub-item: closes overlay AND navigates to `/league-of-legends`, `/cs2`, or `/wwe-games` (existing `Link` behavior preserved)
- Tapping the Login button inside overlay: closes overlay + triggers existing AuthButton click handler
- Tap on overlay background outside any item: no-op (avoid accidental dismissal mid-scroll)
- Explicit close: × button (the morphed hamburger), still in same position
- ESC key: closes overlay
- Body scroll-lock while overlay is open (set `overflow: hidden` on `<body>`; restore on close)
- Closing the overlay restores focus to the hamburger button

## Dock-on-scroll behavior

Preserved unchanged. When the user scrolls past the hero on mobile:

- Pill morphs to full-width docked bar (existing 0.56s chassis transition + spring keyframe)
- Glow line draws across (existing 1.4s expo-out)
- Shelf wipes in (existing)
- Brand + hamburger button live inside the docked bar, hamburger remains tappable
- Undock plays the slow line trail-off + fast shelf snap (the recent fix)

The overlay is independent of dock state — it can be opened from either the floating pill or the docked bar.

## Accessibility

- Hamburger button: `aria-expanded`, `aria-controls="mobile-nav-overlay"`, `aria-label`
- Overlay: `role="dialog"`, `aria-modal="true"`, `aria-label="Site navigation"`
- Focus trap inside overlay while open (focus cycles among Login + nav items + close button)
- ESC closes
- Focus returns to hamburger on close
- Submenu (`Hry`): tap expands; `aria-expanded` on the Hry item, `role="menu"` on the sub-list
- Reduced-motion handling above

## Components / data flow

**Render strategy: dual-render with CSS visibility toggle (no JS viewport detection).**
Both the desktop horizontal items and the mobile overlay are always rendered in the DOM. CSS media queries control which is visible via `display`. This keeps React state stable across resize and avoids `matchMedia` listeners.

- All state lives in `Header.tsx`:
  - New `useState<boolean>` for overlay open/closed (default false)
  - New `useEffect` for body-scroll-lock (toggles `overflow: hidden` on `<body>` when open) and global ESC keydown listener — both only attached while overlay is open
  - Inline focus trap inside the overlay (cycle Tab among Login + nav items + close button), no external library
- `NAV_ITEMS` and `SECTION_COLOR_MAP` reused as-is
- `navigateToSection` reused; called from overlay items (closes overlay, then scrolls/navigates)
- `AuthButton` rendered twice — once in the desktop pill, once at the top of the mobile overlay. Both share auth state via NextAuth session context; no duplication concern since `useSession` returns from a single source. Pass `variant="pill"` for desktop (existing behavior) and `variant="mobile"` for the overlay version
- Indicator pill (`pill-nav-indicator`) is part of the desktop items DOM. When that container is `display: none` at ≤768px, `getBoundingClientRect` returns zeros and the indicator is invisible naturally. The `updateIndicator` effect can keep running — it's a no-op at mobile widths. **No JS guard needed.**
- Overlay scrolls internally if items exceed viewport height (`overflow-y: auto` on the overlay container) — relevant on small phones in landscape

## Files affected

- `src/app/components/Header.tsx`:
  - Add overlay state, hamburger button, mobile overlay JSX
  - Body scroll-lock + ESC + focus-return effects
- `src/app/komplexaci.css`:
  - Hamburger button styles (44×44 tap area, line styles, hover, ↔× animation)
  - Mobile overlay container, item, sub-item, login styles
  - Stagger keyframes
  - Update existing `@media (max-width: 768px)` and `@media (max-width: 520px)` blocks: remove brand-hidden + horizontal-scroll fallback, replace with hamburger-mode rules
  - Reduced-motion overrides for the new animations
- No new files

## Testing / verification plan

Manual via the existing preview server (`preview_start name="next-dev"`):

1. **Resize 768→375→320px**: hamburger appears at ≤768px, no horizontal overflow, pill reads cleanly with brand + hamburger
2. **Tap hamburger**: overlay slides down, items stagger in, scroll-locked
3. **Tap Domů / O nás / etc.**: overlay closes, page scroll-spy moves accent, returns to that section
4. **Tap Hry**: sub-list expands inline; tap LoL → navigates to `/league-of-legends`, overlay closed
5. **Tap Login**: triggers Discord OAuth flow as today
6. **ESC key**: closes overlay (test via preview_eval)
7. **Scroll-down test (mobile width)**: pill docks normally, glow line draws, hamburger still works inside docked bar
8. **Scroll-up undock**: slow line trail-off intact, no phantom shelf (the recent fix preserved)
9. **Resize 769→1024→1920px**: desktop pill renders identically to current (regression check)
10. **Reduced-motion**: with `prefers-reduced-motion: reduce`, overlay fade-only, no slide

Use `preview_resize`, `preview_screenshot`, `preview_eval` for state inspection, and `preview_console_logs level: error` to confirm no new errors introduced.
