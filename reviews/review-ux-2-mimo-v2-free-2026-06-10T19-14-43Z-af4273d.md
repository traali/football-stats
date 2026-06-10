# UX Review — Agent 4 (mimo-v2-free)

**Model**: mimo-v2-free  
**Date**: 2026-06-10T19:14:43Z  
**Commit**: af4273d  
**Focus**: Mobile UX — touch targets, safe-area, focus-visible, reduced motion

---

## CRITICAL: Missing viewport-fit=cover prevents safe-area-inset from working

- **File**: `index.html:7`
- **Issue**: The `<meta name="viewport">` tag is `width=device-width, initial-scale=1.0` but lacks `viewport-fit=cover`. Without it, iOS will not honor `env(safe-area-inset-bottom)` or `env(safe-area-inset-top)`, meaning the BottomNav's `pb-[env(safe-area-inset-bottom,0px)]` will always resolve to `0px` on notched iPhones (X, 12, 13, 14, 15 series).
- **Suggestion**: Change to `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />`

## WARNING: NavLink in BottomNav has no focus-visible ring

- **File**: `src/components/BottomNav.tsx:19-35`
- **Issue**: The `NavLink` anchors are keyboard-navigable interactive elements but have no `focus-visible:ring-*` styling. When tabbing through the bottom nav, users get no visible focus indicator. The design spec (DESIGN.md:424) requires "Focus visible: 2px solid hero-accent ring."
- **Suggestion**: Add `focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1` to the NavLink className.

## WARNING: Form dots are ARIA buttons with no keyboard handler or focus ring

- **File**: `src/components/PlayerCard.tsx:74-87`
- **Issue**: Each form dot has `role="button"` and `tabIndex={0}` making it a tab stop, but (1) there is no `onClick` or `onKeyDown` handler — tapping/pressing does nothing, and (2) there is no `focus-visible` styling. Screen reader users will encounter non-functional button landmarks. Keyboard users can tab to dots but get no visual feedback and no action on Enter/Space.
- **Suggestion**: Either remove `role="button"` and `tabIndex={0}` (making them purely decorative), or implement a tooltip/popover on focus/click and add `focus-visible:ring-2 focus-visible:ring-accent`.

## WARNING: Framer Motion JS animations not respecting prefers-reduced-motion

- **File**: `src/components/MatchHeader.tsx:13-15`, `src/components/DualStatBar.tsx:33-39`, `src/components/PlayerCard.tsx:12-15`, `src/components/StandingsTable.tsx:29-31`
- **Issue**: The CSS `prefers-reduced-motion` rule in `index.css:82-86` only kills CSS animations/transitions. Framer Motion's JS-driven `initial`/`animate`/`transition` props run regardless — the live pulse (`LiveBadge`), stat bar fills, card stagger-enters, and form dot entrances all fire for users who prefer reduced motion.
- **Suggestion**: Add `useReducedMotion()` from Framer Motion to conditionally disable animations, or use `motion.create` with a `motion` prop that checks `prefers-reduced-motion`. A simpler approach: add `useEffect` to set `import { reduceMotion } from 'framer-motion';` and respect it.

## WARNING: NavLink items below 44px touch target on narrow screens

- **File**: `src/components/BottomNav.tsx:24`
- **Issue**: Each NavLink has `min-w-[64px] min-h-[48px]` which meets the 44px minimum. However, the icons are `w-5 h-5` (20px) and the label text is `text-[10px]` — on devices with very small text scaling or in landscape mode, the visual tap target appears smaller than the actual hit area. The label `text-[10px]` at 10px is below the recommended 12px minimum for readable text on mobile.
- **Suggestion**: Consider increasing label to `text-[11px]` or `text-xs` for readability. The min-h is fine but the visual weight is light.

## INFO: Input focus ring uses focus-within on parent, not focus-visible on the input itself

- **File**: `src/pages/Home.tsx:41,50` and `src/pages/MatchPage.tsx:51,60`
- **Issue**: The search input uses `focus:ring-0` to suppress the browser default, relying on the parent div's `focus-within:ring-1 focus-within:ring-accent` for visual feedback. This is `ring-1` (1px) while the design spec calls for "2px solid hero-accent ring" (DESIGN.md:424). Additionally, using `focus:` instead of `focus-visible:` means the ring appears on click, not just keyboard navigation.
- **Suggestion**: Change `focus-within:ring-1` to `focus-within:ring-2 focus-within:ring-accent` on the parent, and consider adding `focus-visible:` variants to avoid the ring on mouse click.

## INFO: NotFound page link missing focus-visible ring

- **File**: `src/pages/NotFound.tsx:9`
- **Issue**: The "Takaisin etusivulle" link is a styled `<Link>` with `inline-flex items-center justify-center rounded-md bg-accent px-5 py-3` but has no `focus-visible:ring-*` class. It will use the browser default focus outline.
- **Suggestion**: Add `focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1` to match the Button component's focus style.

## INFO: Home page feature cards are non-interactive but could be confusing

- **File**: `src/pages/Home.tsx:65-72`
- **Issue**: The three feature cards have icons and descriptive text but are plain `<div>` elements with no interactive role. On mobile, users may attempt to tap them expecting navigation. This is a minor UX friction point.
- **Suggestion**: Consider making these navigational links to their respective sections, or adding a visual cue (e.g., subtle arrow) to indicate they're informational only.

## INFO: StandingsTable rows are motion.tr but not focusable or keyboard-navigable

- **File**: `src/components/StandingsTable.tsx:29-31`
- **Issue**: Table rows are `motion.tr` elements with animation but no `tabIndex`, `role`, or keyboard interaction. They're data-only so this is acceptable, but if the design evolves to make rows tappable, accessibility should be added.
- **Suggestion**: No action needed for current state. Document this as a future consideration.

---

**Summary**: 1 critical viewport issue, 4 warnings around focus-visible/reduced-motion/touch-targets, 4 informational findings. The critical viewport-fit=cover fix is the highest priority — it breaks safe-area-inset on all notched iPhones.
