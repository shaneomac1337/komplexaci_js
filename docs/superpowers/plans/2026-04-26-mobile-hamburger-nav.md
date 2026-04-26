# Mobile Hamburger Nav Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken squashed mobile pill nav with a standard full-screen hamburger overlay at ≤768px, while leaving the desktop pill (>768px) and its dock-on-scroll choreography completely untouched.

**Architecture:** Dual-render pattern — both desktop horizontal items and mobile overlay are always rendered in the DOM, with CSS media queries controlling visibility via `display`. Hamburger toggles a React state; overlay slides in with a focus trap, body-scroll-lock, and ESC-to-close. AuthButton gains a `mobile` variant for the in-overlay login button.

**Tech Stack:** React 19 + Next.js 15 (App Router, client component), CSS in `src/app/komplexaci.css`, Supabase auth via existing `useSupabaseAuth` hook. No new libraries.

**Spec:** [docs/superpowers/specs/2026-04-26-mobile-hamburger-nav-design.md](../specs/2026-04-26-mobile-hamburger-nav-design.md)

**Verification approach:** This codebase has no UI test framework (no Vitest/Jest/Playwright UI tests). Verification is done via the `preview_*` tools (`preview_resize`, `preview_screenshot`, `preview_eval`, `preview_console_logs`, `preview_inspect`) against the running Next.js dev server (`preview_start name="next-dev"`). The dev server may already be running from prior work — `preview_list` first.

**Branch + commit strategy:** Each task is one commit on the current branch. No branching or PRs unless the user requests them at the end.

---

## File Structure

| Path | Responsibility | Change |
|------|---------------|--------|
| `src/components/AuthButton.tsx` | Render Discord login/logout button in 3 variants: default, pill (desktop nav), mobile (overlay) | Modify — add `mobile` variant branch |
| `src/app/components/Header.tsx` | Top navigation: floating pill, dock-on-scroll, scroll-spy, mobile hamburger + overlay | Modify — add hamburger button, overlay state, overlay JSX, body-scroll-lock + ESC + focus-trap effects |
| `src/app/komplexaci.css` | All nav styling: pill, dock, glow line, hamburger, overlay, responsive breakpoints | Modify — add hamburger button styles, mobile overlay styles, mobile auth styles, animations; overhaul existing 768/520 breakpoints |

No new files.

---

## Task 0: Add `mobile` variant to AuthButton

**Goal:** AuthButton supports a `variant="mobile"` prop that renders a full-width prominent button suitable for the mobile overlay, in three states (loading / not-authenticated / authenticated).

**Files:**
- Modify: `src/components/AuthButton.tsx` — add a new `variant === 'mobile'` branch returning JSX with `mobile-nav-auth-*` class names
- Modify: `src/app/komplexaci.css` — append CSS for `.mobile-nav-auth`, `.mobile-nav-auth-loading`, `.mobile-nav-login` (mobile), `.mobile-nav-user`, `.mobile-nav-avatar`, `.mobile-nav-username`, `.mobile-nav-logout`

**Acceptance Criteria:**
- [ ] `<AuthButton variant="mobile" />` renders without crashing
- [ ] In not-authenticated state: shows a full-width Discord-purple button "Login with Discord" with the Discord SVG icon, ≥48px tall
- [ ] In authenticated state: shows avatar + username + Logout button, all on one row, full-width container
- [ ] In loading state: shows a pulsing dot (reuses `pill-nav-pulse` keyframe)
- [ ] No regressions to `variant="pill"` (desktop) or `variant="default"` (other usages)

**Verify:**
1. Run `preview_list` to find the dev server ID (start one if needed via `preview_start name="next-dev"`)
2. `preview_resize preset="mobile"` (375×812)
3. `preview_eval` to inject a test render and inspect:
   ```js
   (() => { const tmp = document.createElement('div'); document.body.appendChild(tmp); return 'ok'; })()
   ```
   (Skip — instead verify via Task 2 once the overlay actually mounts the component)
4. **Realistic verify:** This task on its own can't be visually verified without the overlay context. Confirm correctness by:
   - `preview_console_logs level: error lines: 5` after page reload — no new errors
   - Reading `src/components/AuthButton.tsx` to confirm the new variant branch is well-formed and uses the existing `useSupabaseAuth` hook unchanged

**Steps:**

- [ ] **Step 1: Read current AuthButton.tsx to confirm structure**

Already reviewed during planning. The file has `variant?: 'default' | 'pill'` and three state branches per variant: loading, not-authenticated, authenticated.

- [ ] **Step 2: Update the type union and add the mobile variant branch**

Edit `src/components/AuthButton.tsx`:

Change the type:
```ts
type AuthButtonProps = {
  variant?: 'default' | 'pill' | 'mobile';
};
```

Add a new branch immediately after the `if (variant === 'pill') { ... }` block (before the default-variant `if (isLoading)` check):

```tsx
  if (variant === 'mobile') {
    if (isLoading) {
      return (
        <div className="mobile-nav-auth mobile-nav-auth-loading" aria-hidden="true">
          <span className="pill-nav-auth-dot" />
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <button
          onClick={loginWithDiscord}
          className="mobile-nav-auth mobile-nav-login"
          aria-label="Login with Discord"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          <span>Login with Discord</span>
        </button>
      );
    }

    return (
      <div className="mobile-nav-auth mobile-nav-user">
        <div className="mobile-nav-avatar">
          {user?.image ? (
            <img src={user.image} alt={user.name || 'User'} />
          ) : (
            <span className="pill-nav-avatar-fallback">{(user?.name || '?').charAt(0).toUpperCase()}</span>
          )}
        </div>
        <span className="mobile-nav-username">{user?.name}</span>
        <button
          onClick={logout}
          className="mobile-nav-logout"
          aria-label="Logout"
        >
          Logout
        </button>
      </div>
    );
  }
```

- [ ] **Step 3: Append mobile auth CSS to komplexaci.css**

Append at end of `src/app/komplexaci.css` (or co-located with the other mobile-overlay rules added in Task 2 — for now, append at end):

```css
/* ================================================================
   Mobile overlay: auth button styles. Used inside the hamburger
   overlay at top of the items list. Full-width, large tap target.
   ================================================================ */
.mobile-nav-auth {
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 56px;
    padding: 14px 20px;
    box-sizing: border-box;
    flex-shrink: 0;
}

.mobile-nav-auth-loading {
    justify-content: center;
}

.mobile-nav-login {
    justify-content: center;
    gap: 10px;
    background: #5865F2;
    color: #fff;
    border: 0;
    border-radius: 12px;
    cursor: pointer;
    font-family: 'Exo 2', system-ui, sans-serif;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    transition: background-color 0.2s ease;
}

.mobile-nav-login:hover,
.mobile-nav-login:active {
    background: #4752C4;
}

.mobile-nav-user {
    gap: 12px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
}

.mobile-nav-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #a855f7);
    border: 1px solid rgba(255, 255, 255, 0.16);
    overflow: hidden;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.mobile-nav-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.mobile-nav-username {
    flex: 1;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 13px;
    color: #d8d8e8;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.mobile-nav-logout {
    background: var(--pill-accent, var(--synthwave-cyan));
    color: #000;
    padding: 8px 14px;
    border: 0;
    border-radius: 8px;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    flex-shrink: 0;
}
```

- [ ] **Step 4: Verify no console errors after edit**

Run:
```
preview_eval expression: "window.location.reload(); 'reloading'"
preview_logs level: error lines: 10
preview_console_logs level: error lines: 10
```
Expected: no NEW errors compared to baseline (the pre-existing "Maximum update depth exceeded" warnings are unrelated and acceptable).

- [ ] **Step 5: Commit**

```bash
git add src/components/AuthButton.tsx src/app/komplexaci.css
git commit -m "feat(nav): add mobile variant to AuthButton with overlay-friendly styling"
```

---

## Task 1: Add hamburger button + responsive pill rearrangement

**Goal:** At ≤768px, the floating pill shows only `KOMPLEXÁCI` brand (left) + hamburger button (right). The desktop nav items list and the desktop AuthButton are hidden via CSS. The hamburger button is always in the DOM (just hidden on desktop). No overlay yet — tapping hamburger does nothing visible. After this task, the pill at mobile widths is no longer broken (no overflow, no overlapping items), but the menu is non-functional.

**Files:**
- Modify: `src/app/components/Header.tsx` — add `isMenuOpen` state (default false), add hamburger `<button>` JSX inside the `<nav>` after the AuthButton, with class `pill-nav-hamburger`. Add `onClick` handler that toggles `isMenuOpen`. No effects yet.
- Modify: `src/app/komplexaci.css` — add `.pill-nav-hamburger` button styles (44×44 tap area, 3 stacked lines, currentColor strokes, hover state), add the morph-to-X state via `.pill-nav-hamburger.is-open` class. Update the existing `@media (max-width: 768px)` and `@media (max-width: 520px)` blocks: remove the brand-hidden rule, remove the horizontal-scroll fallback, hide `.pill-nav-items`, hide the desktop `.pill-nav-auth` (which is the AuthButton with `variant="pill"`), hide `.pill-nav-divider`, show `.pill-nav-hamburger`. Keep `.pill-nav-hamburger` `display: none` above 768px.

**Acceptance Criteria:**
- [ ] At viewport >768px (desktop): zero visual change — pill renders identically to current
- [ ] At viewport ≤768px: pill shows ONLY `KOMPLEXÁCI` brand + hamburger button (3 horizontal lines)
- [ ] No horizontal overflow at 375px or 320px
- [ ] Brand text is visible and readable
- [ ] Hamburger button has 44×44px tap area (verify via `preview_inspect`)
- [ ] Tapping hamburger toggles `isMenuOpen` state and adds/removes `is-open` class on the button (lines morph to X) — verify via `preview_eval` reading state, no overlay visible yet (overlay is Task 2)
- [ ] Dock-on-scroll still works at mobile width (scroll past hero, pill morphs to full-width docked bar with brand + hamburger inside)

**Verify:**
```
# Desktop regression
preview_resize preset: "desktop"
preview_screenshot
# Expected: same nav as before, all items visible

# Mobile rearrangement
preview_resize preset: "mobile"
preview_eval expression: "window.location.reload(); 'reloading'"
preview_screenshot
# Expected: pill shows KOMPLEXACI on left, hamburger icon on right, no overflow

# Tap target size
preview_inspect selector: ".pill-nav-hamburger" styles: ["width", "height", "padding"]
# Expected: width+padding ≥44px, height+padding ≥44px

# Dock test (mobile)
preview_eval expression: "window.scrollTo({top: 800, behavior: 'instant'}); 'docked'"
preview_screenshot
# Expected: full-width docked bar with brand + hamburger visible

# Hamburger toggle
preview_click selector: ".pill-nav-hamburger"
preview_eval expression: "document.querySelector('.pill-nav-hamburger').classList.contains('is-open')"
# Expected: true
```

**Steps:**

- [ ] **Step 1: Add state + hamburger button to Header.tsx**

Edit `src/app/components/Header.tsx`:

After the existing `useState` declarations (around line 49), add:
```tsx
  const [isMenuOpen, setIsMenuOpen] = useState(false);
```

Inside the `<nav>` element, immediately after the `<AuthButton variant="pill" />` line (around line 327), add the hamburger button:

```tsx
      <button
        type="button"
        className={`pill-nav-hamburger ${isMenuOpen ? 'is-open' : ''}`}
        onClick={() => setIsMenuOpen((v) => !v)}
        aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isMenuOpen}
        aria-controls="mobile-nav-overlay"
      >
        <span className="pill-nav-hamburger-line" aria-hidden="true" />
        <span className="pill-nav-hamburger-line" aria-hidden="true" />
        <span className="pill-nav-hamburger-line" aria-hidden="true" />
      </button>
```

- [ ] **Step 2: Add hamburger button CSS**

In `src/app/komplexaci.css`, append (or co-locate with `.pill-nav-auth` block — append at end is fine):

```css
/* ================================================================
   Hamburger button — replaces the items list at ≤768px. Hidden
   above the breakpoint. 44×44 tap area, 3-line icon morphs to X
   when .is-open is applied.
   ================================================================ */
.pill-nav-hamburger {
    display: none;
    position: relative;
    width: 36px;
    height: 36px;
    padding: 6px;
    margin-left: 4px;
    background: transparent;
    border: 0;
    border-radius: 999px;
    cursor: pointer;
    flex-shrink: 0;
    box-sizing: content-box;
    align-items: center;
    justify-content: center;
}

.pill-nav-hamburger:hover {
    background: rgba(255, 255, 255, 0.06);
}

.pill-nav-hamburger-line {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 22px;
    height: 2px;
    margin-left: -11px;
    background: #d8d8e8;
    border-radius: 2px;
    transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1),
                opacity 0.18s ease-out;
}

.pill-nav-hamburger-line:nth-child(1) { transform: translateY(-7px); }
.pill-nav-hamburger-line:nth-child(2) { transform: translateY(0); }
.pill-nav-hamburger-line:nth-child(3) { transform: translateY(7px); }

.pill-nav-hamburger.is-open .pill-nav-hamburger-line:nth-child(1) {
    transform: translateY(0) rotate(45deg);
}
.pill-nav-hamburger.is-open .pill-nav-hamburger-line:nth-child(2) {
    opacity: 0;
}
.pill-nav-hamburger.is-open .pill-nav-hamburger-line:nth-child(3) {
    transform: translateY(0) rotate(-45deg);
}
```

- [ ] **Step 3: Overhaul the existing mobile media queries**

In `src/app/komplexaci.css`, replace the existing two blocks at lines 530-579 (the `@media (max-width: 768px)` and `@media (max-width: 520px)` blocks for `.pill-nav` rules) with these:

Find this block (current state):
```css
@media (max-width: 768px) {
    .pill-nav {
        top: 10px;
        gap: 0;
        padding: 4px;
    }
    .pill-nav-brand {
        padding: 6px 8px;
        font-size: 11px;
    }
    .pill-nav-item {
        padding: 6px 10px;
    }
    .pill-nav-divider {
        margin: 0 4px;
    }
    .pill-nav-username {
        display: none;
    }
    .pill-nav-auth {
        padding: 2px 2px 2px 4px;
    }
}

@media (max-width: 520px) {
    .pill-nav {
        left: 8px;
        right: 8px;
        transform: none;
        max-width: none;
        width: calc(100vw - 16px);
    }
    .pill-nav.is-docked {
        left: 0;
        right: 0;
    }
    .pill-nav-brand {
        display: none;
    }
    .pill-nav-items {
        overflow-x: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
    }
    .pill-nav-items::-webkit-scrollbar {
        display: none;
    }
}
```

Replace with:
```css
@media (max-width: 768px) {
    .pill-nav {
        top: 10px;
        gap: 0;
        padding: 4px 4px 4px 6px;
        justify-content: space-between;
    }
    .pill-nav-brand {
        padding: 6px 8px;
        font-size: 11px;
        margin-right: 0;
    }
    /* Hide desktop items list, indicator, divider, and pill-variant
       AuthButton at mobile widths — content moves into the overlay. */
    .pill-nav-items,
    .pill-nav-divider,
    .pill-nav-auth {
        display: none;
    }
    /* Show hamburger button. */
    .pill-nav-hamburger {
        display: inline-flex;
    }
    /* Floating pill width: hug content (brand + hamburger), no scrolling. */
    .pill-nav {
        width: max-content;
    }
}
```

Note: the `@media (max-width: 520px)` block is removed entirely — its concerns (brand hidden, scroll fallback) no longer apply because the items list is gone.

- [ ] **Step 4: Verify desktop regression**

```
preview_resize preset: "desktop"
preview_eval expression: "window.location.reload(); 'reloading'"
preview_screenshot
```
Expected: nav looks identical to before this task — KOMPLEXACI brand, all 6 items, Login button, no hamburger visible.

- [ ] **Step 5: Verify mobile rearrangement**

```
preview_resize preset: "mobile"
preview_eval expression: "window.location.reload(); 'reloading'"
preview_screenshot
```
Expected: pill shows KOMPLEXACI on left, 3-line hamburger icon on right, no overflow, no overlapping items.

- [ ] **Step 6: Verify hamburger toggle (no overlay yet)**

```
preview_click selector: ".pill-nav-hamburger"
preview_eval expression: "(() => { const b = document.querySelector('.pill-nav-hamburger'); return { open: b.classList.contains('is-open'), aria: b.getAttribute('aria-expanded') }; })()"
```
Expected: `{ open: true, aria: "true" }`

```
preview_screenshot
```
Expected: hamburger lines morphed into × icon, but no overlay visible (overlay is Task 2). Click again to verify it toggles back.

- [ ] **Step 7: Verify dock-on-scroll on mobile**

```
preview_eval expression: "(async () => { const b = document.querySelector('.pill-nav-hamburger'); if (b.classList.contains('is-open')) b.click(); window.scrollTo({top: 800, behavior: 'instant'}); await new Promise(r => setTimeout(r, 700)); return document.querySelector('.pill-nav').classList.contains('is-docked'); })()"
preview_screenshot
```
Expected: returns true; screenshot shows full-width docked bar with brand + hamburger visible inside it.

- [ ] **Step 8: Verify no console errors**

```
preview_console_logs level: error lines: 10
```
Expected: no NEW errors compared to baseline.

- [ ] **Step 9: Commit**

```bash
git add src/app/components/Header.tsx src/app/komplexaci.css
git commit -m "feat(nav): add hamburger button and hide desktop items at <=768px"
```

---

## Task 2: Add mobile overlay (state, JSX, effects, styles, animations)

**Goal:** Tapping the hamburger opens a full-screen slide-down overlay containing Login (top), Domů, O nás, Členové, Hry (with inline expandable submenu), Discord, Kontakt. Body scrolls locked, ESC closes, focus trap inside, focus returns to hamburger on close. Animations: 0.32s slide-down, items stagger-fade in.

**Files:**
- Modify: `src/app/components/Header.tsx` — add overlay JSX (rendered always, controlled by `is-open` class), add `useState` for `isHrySubmenuOpenMobile`, add `useEffect` for body-scroll-lock + ESC keydown, add `useEffect` for focus trap, modify `navigateToSection` to close the overlay when an item is tapped, add ref for the hamburger button to restore focus
- Modify: `src/app/komplexaci.css` — add overlay container, item, sub-item, divider, animation keyframes, reduced-motion overrides

**Acceptance Criteria:**
- [ ] Tapping hamburger opens a full-screen overlay with the dark blurred background
- [ ] Overlay items appear: Login button (top), Domů, O nás, Členové, Hry ▾, Discord, Kontakt
- [ ] Tapping Hry expands the inline submenu (League of Legends, CS2, WWE Games)
- [ ] Tapping any section item: closes overlay AND scroll-spy moves to that section (smooth scroll on `/`, navigation to `/#id` off-route)
- [ ] Tapping × (hamburger morphed) closes overlay
- [ ] Pressing ESC closes overlay (verify via `preview_eval` with KeyboardEvent dispatch)
- [ ] Body scroll is locked while overlay is open (`document.body` style.overflow === 'hidden')
- [ ] When overlay closes, focus returns to the hamburger button
- [ ] Focus trap: pressing Tab from the last focusable element wraps to first; Shift+Tab from first wraps to last
- [ ] Active section indicator: the current section's item shows a 4px-wide left-edge accent bar in the section's `SECTION_COLOR_MAP` color
- [ ] Open animation: overlay slides down over ~0.32s, items stagger-fade in
- [ ] Reduced motion: with `prefers-reduced-motion: reduce`, overlay opacity-fades only (no slide, no stagger)
- [ ] Desktop unaffected (hamburger hidden, no overlay rendered visibly)

**Verify:**
```
preview_resize preset: "mobile"
preview_eval expression: "window.location.reload(); 'reloading'"

# Open overlay
preview_click selector: ".pill-nav-hamburger"
preview_screenshot
# Expected: full-screen dark glass overlay with Login + 6 items visible

# Body scroll lock
preview_eval expression: "document.body.style.overflow"
# Expected: "hidden"

# Tap a section item (Domů should already be active)
preview_click selector: ".mobile-nav-overlay [data-id='o-nas']"
preview_eval expression: "(() => ({ open: document.querySelector('.mobile-nav-overlay').classList.contains('is-open'), bodyOverflow: document.body.style.overflow, scrollY: window.scrollY }))()"
# Expected: { open: false, bodyOverflow: "" or initial, scrollY: > 0 }

# ESC closes
preview_click selector: ".pill-nav-hamburger"  # reopen
preview_eval expression: "document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); 'sent'"
preview_eval expression: "document.querySelector('.mobile-nav-overlay').classList.contains('is-open')"
# Expected: false

# Hry submenu
preview_click selector: ".pill-nav-hamburger"  # reopen
preview_click selector: ".mobile-nav-overlay [data-id='hry']"
preview_eval expression: "document.querySelectorAll('.mobile-nav-submenu .mobile-nav-submenu-item').length"
# Expected: 3 (LoL, CS2, WWE Games)
preview_screenshot

# Reduced motion
preview_resize preset: "mobile" colorScheme: "dark"  # (resize tool also accepts colorScheme; reduced-motion may need media-query emulation via CDP — if not directly supported, confirm CSS rules exist via preview_inspect on .mobile-nav-overlay@media query)

# Desktop regression
preview_resize preset: "desktop"
preview_eval expression: "window.location.reload(); 'reloading'"
preview_screenshot
# Expected: identical to current desktop nav
```

**Steps:**

- [ ] **Step 1: Add overlay state, ref, and effects to Header.tsx**

In `src/app/components/Header.tsx`:

Add a ref for the hamburger button after the existing refs (around line 55):
```tsx
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [hrySubmenuOpenMobile, setHrySubmenuOpenMobile] = useState(false);
```

Add a body-scroll-lock + ESC keydown effect (place after the other useEffects, before `navigateToSection`):
```tsx
  useEffect(() => {
    if (!isMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [isMenuOpen]);
```

Add a focus-restore effect (separate, depends on isMenuOpen):
```tsx
  useEffect(() => {
    if (isMenuOpen) {
      // Move focus into the overlay when it opens (first focusable element)
      const overlay = overlayRef.current;
      if (overlay) {
        const first = overlay.querySelector<HTMLElement>(
          'button, a, [tabindex]:not([tabindex="-1"])'
        );
        first?.focus();
      }
    } else {
      // Restore focus to the hamburger button on close
      hamburgerRef.current?.focus();
    }
  }, [isMenuOpen]);
```

Add a focus-trap effect:
```tsx
  useEffect(() => {
    if (!isMenuOpen) return;
    const overlay = overlayRef.current;
    if (!overlay) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusables = Array.from(
        overlay.querySelectorAll<HTMLElement>(
          'button, a, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
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
    overlay.addEventListener('keydown', onKey);
    return () => overlay.removeEventListener('keydown', onKey);
  }, [isMenuOpen]);
```

- [ ] **Step 2: Modify navigateToSection to close overlay**

In `Header.tsx`, find the existing `navigateToSection` (around line 204):

Change:
```tsx
  const navigateToSection = (sectionId: string) => {
    setSubmenuOpen(false);
    if (pathname === '/') {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.location.href = `/#${sectionId}`;
    }
  };
```

To:
```tsx
  const navigateToSection = (sectionId: string) => {
    setSubmenuOpen(false);
    setIsMenuOpen(false);
    setHrySubmenuOpenMobile(false);
    if (pathname === '/') {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.location.href = `/#${sectionId}`;
    }
  };
```

- [ ] **Step 3: Wire the ref to the hamburger button**

In the hamburger button JSX added in Task 1 (around line 327), add `ref={hamburgerRef}`:
```tsx
      <button
        ref={hamburgerRef}
        type="button"
        className={`pill-nav-hamburger ${isMenuOpen ? 'is-open' : ''}`}
        ...
      >
```

- [ ] **Step 4: Add the mobile overlay JSX**

In `Header.tsx`, locate the existing JSX return:
```tsx
  return (
    <>
    <nav ...>
      ...
    </nav>
    <div className="pill-nav-spacer" aria-hidden="true" />
    </>
  );
```

Insert the overlay between the closing `</nav>` and the spacer:
```tsx
    <div
      ref={overlayRef}
      id="mobile-nav-overlay"
      className={`mobile-nav-overlay ${isMenuOpen ? 'is-open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Site navigation"
      aria-hidden={!isMenuOpen}
    >
      <div className="mobile-nav-overlay-inner" style={navStyle}>
        <AuthButton variant="mobile" />
        <ul className="mobile-nav-list">
          {NAV_ITEMS.map((item) => {
            if (item.children) {
              return (
                <li key={item.id} className="mobile-nav-list-item">
                  <button
                    type="button"
                    data-id={item.id}
                    className={`mobile-nav-item has-submenu ${isActive(item.id) ? 'on' : ''} ${hrySubmenuOpenMobile ? 'submenu-open' : ''}`}
                    onClick={() => setHrySubmenuOpenMobile((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={hrySubmenuOpenMobile}
                  >
                    <span>{item.label}</span>
                    <svg
                      className={`mobile-nav-caret ${hrySubmenuOpenMobile ? 'rotated' : ''}`}
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      aria-hidden="true"
                    >
                      <path d="M3 5 L7 9 L11 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {hrySubmenuOpenMobile && (
                    <ul className="mobile-nav-submenu" role="menu">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className="mobile-nav-submenu-item"
                            role="menuitem"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              setIsMenuOpen(false);
                              setHrySubmenuOpenMobile(false);
                            }}
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            }
            return (
              <li key={item.id} className="mobile-nav-list-item">
                <button
                  type="button"
                  data-id={item.id}
                  className={`mobile-nav-item ${isActive(item.id) ? 'on' : ''}`}
                  onClick={() => navigateToSection(item.id)}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
```

- [ ] **Step 5: Add overlay CSS**

In `src/app/komplexaci.css`, append (or co-locate after the `.mobile-nav-auth` rules added in Task 0):

```css
/* ================================================================
   Mobile overlay — full-screen menu opened by the hamburger button.
   Hidden above 768px and when not open. Slides down with stagger-
   fade-in items.
   ================================================================ */
.mobile-nav-overlay {
    --pill-accent: var(--synthwave-cyan);
    display: none;
    position: fixed;
    inset: 0;
    z-index: 1001;
    background: rgba(5, 5, 10, 0.94);
    backdrop-filter: blur(20px) saturate(140%);
    -webkit-backdrop-filter: blur(20px) saturate(140%);
    overflow-y: auto;
    transform: translateY(-100%);
    transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1),
                opacity 0.22s ease-out;
    opacity: 0;
}

.mobile-nav-overlay.is-open {
    transform: translateY(0);
    opacity: 1;
}

.mobile-nav-overlay-inner {
    padding: 80px 16px 24px 16px;
    max-width: 540px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.mobile-nav-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.mobile-nav-list-item {
    margin: 0;
    padding: 0;
}

.mobile-nav-item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 56px;
    padding: 14px 20px;
    background: transparent;
    border: 0;
    border-radius: 12px;
    color: #d8d8e8;
    font-family: 'Exo 2', system-ui, sans-serif;
    font-size: 17px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-align: left;
    cursor: pointer;
    box-sizing: border-box;
    transition: background-color 0.18s ease-out, color 0.18s ease-out;
}

.mobile-nav-item:hover,
.mobile-nav-item:active,
.mobile-nav-item:focus-visible {
    background: rgba(255, 255, 255, 0.06);
    outline: none;
}

.mobile-nav-item.on {
    color: #fff;
}

.mobile-nav-item.on::before {
    content: '';
    position: absolute;
    left: 6px;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 24px;
    background: var(--pill-accent);
    border-radius: 2px;
    box-shadow: 0 0 12px 1px color-mix(in srgb, var(--pill-accent) 60%, transparent);
}

.mobile-nav-caret {
    transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    color: #888;
}

.mobile-nav-caret.rotated {
    transform: rotate(180deg);
    color: var(--pill-accent);
}

.mobile-nav-submenu {
    list-style: none;
    margin: 4px 0 8px 0;
    padding: 0 0 0 20px;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.mobile-nav-submenu-item {
    display: flex;
    align-items: center;
    min-height: 48px;
    padding: 12px 16px;
    background: transparent;
    border-radius: 10px;
    color: #b8b8c8;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 13px;
    text-decoration: none;
    transition: background-color 0.18s ease-out, color 0.18s ease-out;
}

.mobile-nav-submenu-item:hover,
.mobile-nav-submenu-item:active {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
}

/* Stagger-fade for items when overlay opens. */
.mobile-nav-overlay.is-open .mobile-nav-auth,
.mobile-nav-overlay.is-open .mobile-nav-list-item {
    animation: mobile-nav-stagger 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.mobile-nav-overlay.is-open .mobile-nav-auth { animation-delay: 0.05s; }
.mobile-nav-overlay.is-open .mobile-nav-list-item:nth-child(1) { animation-delay: 0.10s; }
.mobile-nav-overlay.is-open .mobile-nav-list-item:nth-child(2) { animation-delay: 0.13s; }
.mobile-nav-overlay.is-open .mobile-nav-list-item:nth-child(3) { animation-delay: 0.16s; }
.mobile-nav-overlay.is-open .mobile-nav-list-item:nth-child(4) { animation-delay: 0.19s; }
.mobile-nav-overlay.is-open .mobile-nav-list-item:nth-child(5) { animation-delay: 0.22s; }
.mobile-nav-overlay.is-open .mobile-nav-list-item:nth-child(6) { animation-delay: 0.25s; }

@keyframes mobile-nav-stagger {
    0%   { opacity: 0; transform: translateY(8px); }
    100% { opacity: 1; transform: translateY(0); }
}

/* Show the overlay container at mobile widths. Above 768px it stays
   display:none even when .is-open is somehow set. */
@media (max-width: 768px) {
    .mobile-nav-overlay {
        display: block;
    }
}

/* Reduced motion: opacity-only, no slide, no stagger. */
@media (prefers-reduced-motion: reduce) {
    .mobile-nav-overlay {
        transform: none;
        transition: opacity 0.12s ease-out;
    }
    .mobile-nav-overlay.is-open {
        transform: none;
    }
    .mobile-nav-overlay.is-open .mobile-nav-auth,
    .mobile-nav-overlay.is-open .mobile-nav-list-item {
        animation: none;
    }
    .pill-nav-hamburger-line {
        transition: none;
    }
}
```

- [ ] **Step 6: Verify mobile overlay open/close**

```
preview_resize preset: "mobile"
preview_eval expression: "window.location.reload(); 'reloading'"
preview_click selector: ".pill-nav-hamburger"
preview_screenshot
```
Expected: full-screen dark glass overlay with Login button at top + Domů, O nás, Členové, Hry ▾, Discord, Kontakt as stacked rows.

- [ ] **Step 7: Verify body scroll lock**

```
preview_eval expression: "document.body.style.overflow"
```
Expected: `"hidden"`

- [ ] **Step 8: Verify Hry submenu inline expansion**

```
preview_click selector: ".mobile-nav-overlay [data-id='hry']"
preview_eval expression: "document.querySelectorAll('.mobile-nav-submenu .mobile-nav-submenu-item').length"
preview_screenshot
```
Expected: returns `3`; screenshot shows LoL/CS2/WWE indented under Hry.

- [ ] **Step 9: Verify ESC closes overlay**

```
preview_eval expression: "document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); 'sent'"
preview_eval expression: "(() => ({ open: document.querySelector('.mobile-nav-overlay').classList.contains('is-open'), bodyOverflow: document.body.style.overflow }))()"
```
Expected: `{ open: false, bodyOverflow: "" }`

- [ ] **Step 10: Verify navigation closes overlay**

```
preview_click selector: ".pill-nav-hamburger"  # reopen
preview_click selector: ".mobile-nav-overlay [data-id='o-nas']"
preview_eval expression: "(async () => { await new Promise(r => setTimeout(r, 600)); return { open: document.querySelector('.mobile-nav-overlay').classList.contains('is-open'), scrollY: window.scrollY }; })()"
```
Expected: `{ open: false, scrollY: > 0 }` (scrolled to o-nas section)

- [ ] **Step 11: Verify focus return**

```
preview_click selector: ".pill-nav-hamburger"  # reopen
preview_eval expression: "document.activeElement?.className"
# Expected: contains "mobile-nav-login" (focus moved to first focusable in overlay)
preview_eval expression: "document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); 'sent'"
preview_eval expression: "(async () => { await new Promise(r => setTimeout(r, 100)); return document.activeElement?.className; })()"
# Expected: contains "pill-nav-hamburger"
```

- [ ] **Step 12: Verify desktop regression**

```
preview_resize preset: "desktop"
preview_eval expression: "window.location.reload(); 'reloading'"
preview_screenshot
```
Expected: nav identical to current desktop — no overlay visible, no hamburger, items horizontal.

- [ ] **Step 13: Verify no console errors**

```
preview_console_logs level: error lines: 10
preview_logs serverId: <id> level: error lines: 10
```
Expected: no NEW errors compared to baseline.

- [ ] **Step 14: Commit**

```bash
git add src/app/components/Header.tsx src/app/komplexaci.css
git commit -m "feat(nav): add mobile hamburger overlay with submenu, focus trap, scroll lock"
```

---

## Task 3: End-to-end acceptance verification

**Goal:** Run through every acceptance criterion from the spec and confirm. If anything fails, fix inline and re-verify before completing.

**Files:** None modified unless an issue is found.

**Acceptance Criteria:**
- [ ] All spec acceptance criteria pass (see [spec](../specs/2026-04-26-mobile-hamburger-nav-design.md))

**Verify (run through the spec's testing/verification plan exactly):**

- [ ] **Step 1: Resize 768→375→320px**
  ```
  preview_resize width: 768 height: 1024
  preview_screenshot
  preview_resize width: 375 height: 812
  preview_screenshot
  preview_resize width: 320 height: 568
  preview_screenshot
  ```
  Expected: at all three widths, pill shows brand + hamburger only, no overflow, no overlap. The 768 width is the boundary — at exactly 768 it should already be in mobile mode (max-width: 768px is inclusive).

- [ ] **Step 2: Tap hamburger → overlay opens with stagger-fade**
  ```
  preview_resize preset: "mobile"
  preview_click selector: ".pill-nav-hamburger"
  preview_screenshot
  ```

- [ ] **Step 3: Tap Domů / O nás / Členové → close + scroll-spy**
  ```
  preview_eval expression: "window.scrollTo(0, 0); 'reset'"
  preview_click selector: ".pill-nav-hamburger"
  preview_click selector: ".mobile-nav-overlay [data-id='clenove']"
  preview_eval expression: "(async () => { await new Promise(r => setTimeout(r, 800)); return { open: document.querySelector('.mobile-nav-overlay').classList.contains('is-open'), section: document.querySelector('.mobile-nav-item.on')?.getAttribute('data-id') }; })()"
  ```
  Expected: `{ open: false, section: "clenove" or close to it }` — overlay closed and active indicator updated.

- [ ] **Step 4: Tap Hry → submenu expands inline → tap LoL → navigates**
  ```
  preview_click selector: ".pill-nav-hamburger"
  preview_click selector: ".mobile-nav-overlay [data-id='hry']"
  preview_screenshot
  preview_eval expression: "document.querySelectorAll('.mobile-nav-submenu-item').length"
  ```
  Expected: 3 sub-items visible.
  ```
  preview_eval expression: "document.querySelector('.mobile-nav-submenu-item').getAttribute('href')"
  ```
  Expected: `/league-of-legends`. (Don't actually click — opens new tab via `target="_blank"` which complicates the test. Confirming the `href` is sufficient.)

- [ ] **Step 5: Tap Login → Discord OAuth flow triggers**
  ```
  preview_click selector: ".pill-nav-hamburger"
  preview_inspect selector: ".mobile-nav-login" styles: ["background-color"]
  ```
  Expected: button visible at top of overlay with Discord purple background. (Don't click — would redirect away from preview. Verify presence only.)

- [ ] **Step 6: ESC closes**
  ```
  preview_eval expression: "document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); 'sent'"
  preview_eval expression: "document.querySelector('.mobile-nav-overlay').classList.contains('is-open')"
  ```
  Expected: false.

- [ ] **Step 7: Dock-on-scroll preserved at mobile width**
  ```
  preview_eval expression: "window.scrollTo({top: 800, behavior: 'instant'}); 'docked'"
  preview_eval expression: "(async () => { await new Promise(r => setTimeout(r, 700)); return { docked: document.querySelector('.pill-nav').classList.contains('is-docked'), brand: !!document.querySelector('.pill-nav-brand'), hamburger: !!document.querySelector('.pill-nav-hamburger') }; })()"
  preview_screenshot
  ```
  Expected: `{ docked: true, brand: true, hamburger: true }`. Screenshot shows full-width docked bar with brand + hamburger inside.

- [ ] **Step 8: Scroll-up undock — slow line trail-off intact, no phantom shelf**
  ```
  preview_eval expression: "window.scrollTo({top: 0, behavior: 'instant'}); 'unscroll'"
  preview_screenshot
  ```
  Expected: no visible phantom shadow band behind pill (this was fixed earlier in the session — regression check).

- [ ] **Step 9: Open overlay from docked state**
  ```
  preview_eval expression: "window.scrollTo({top: 800, behavior: 'instant'}); 'docked'"
  preview_eval expression: "(async () => { await new Promise(r => setTimeout(r, 700)); return document.querySelector('.pill-nav').classList.contains('is-docked'); })()"
  preview_click selector: ".pill-nav-hamburger"
  preview_screenshot
  preview_eval expression: "document.querySelector('.mobile-nav-overlay').classList.contains('is-open')"
  ```
  Expected: overlay opens correctly even when nav is in docked state. Returns true.

- [ ] **Step 10: Resize 769→1024→1920px — desktop regression**
  ```
  preview_resize width: 769 height: 800
  preview_screenshot
  preview_resize preset: "desktop"
  preview_screenshot
  preview_resize width: 1920 height: 1080
  preview_screenshot
  ```
  Expected: at all three widths, desktop pill renders identically to before this change — full items list, indicator pill, AuthButton in pill, no hamburger visible, no overlay rendered (overlay stays display:none above 768px).

- [ ] **Step 11: Final console check**
  ```
  preview_console_logs level: error lines: 20
  preview_logs serverId: <id> level: error lines: 20
  ```
  Expected: no NEW errors introduced by this work. (Pre-existing "Maximum update depth exceeded" warnings noted earlier are unrelated and acceptable.)

- [ ] **Step 12: If everything passes, commit (or noop if no changes)**

  If verification surfaced no issues requiring fixes, this task involves no commit. Otherwise:
  ```bash
  git add <fixed files>
  git commit -m "fix(nav): <specific fix found during verification>"
  ```
