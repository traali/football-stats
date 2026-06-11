# UX Review — Round 2 (mimo-v2.5-free)

**Date**: 2026-06-11T04:23:46Z  
**Commit**: 0f69065  
**Reviewer**: ux-2 (mimo-v2.5-free)  
**Focus**: Mobile UX — touch targets, safe-area, focus-visible rings, reduced motion

---

## CRITICAL

### 1. Missing `viewport-fit=cover` — safe-area-inset broken on notched iPhones
- **File**: `index.html:7`
- **Issue**: `<meta name="viewport">` lacks `viewport-fit=cover`. Without it, iOS ignores `env(safe-area-inset-bottom)` entirely. BottomNav's `pb-[env(safe-area-inset-bottom,0px)]` always resolves to `0px` on all notched iPhones (X, 12–15 series).
- **Fix**: Change to `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">`
- **Priority**: P0 — bottom nav is clipped on every notched iPhone.

---

## WARNING

### 2. Button dense size below 44px touch target
- **File**: `src/components/Button.tsx:29`
- **Issue**: `dense` size uses `h-10` (40px height). The WCAG 2.5.8 minimum is 44×44px. While `dense` isn't currently used in the codebase, it's exported and available.
- **Fix**: Change `h-10` to `h-11` or document as intentionally sub-44px for secondary actions only.

### 3. BottomNav NavLink missing focus-visible ring
- **File**: `src/components/BottomNav.tsx:22`
- **Issue**: NavLink receives no `focus-visible:ring-*` classes. Keyboard users see no visual focus indicator on the primary navigation.
- **Fix**: Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas` to the NavLink className.

### 4. PlayerCard dot indicators — 10×10px touch target, no focus ring
- **File**: `src/components/PlayerCard.tsx:81`
- **Issue**: Past-match dots have `min-w-[10px] min-h-[10px]` (10×10px) with `role="button"` and `tabIndex={0}`. Touch target is 4.4× below WCAG minimum. Also missing `focus-visible:ring`.
- **Fix**: Either increase to 44×44px (likely too large for layout) or remove `role="button"` and `tabIndex` if these are decorative only. If interactive, wrap in a 44px hit area.

### 5. NotFound Link missing focus-visible ring
- **File**: `src/pages/NotFound.tsx:9`
- **Issue**: The "Takaisin etusivulle" Link has no `focus-visible:ring-*` classes. Keyboard-only users cannot see focus state.
- **Fix**: Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas`.

---

## INFO

### 6. Framer-motion animations ignore `prefers-reduced-motion`
- **Files**: `src/components/DualStatBar.tsx:29-39`, `src/components/PlayerCard.tsx:21`, `src/components/MatchHeader.tsx`, `src/pages/MatchPage.tsx`
- **Issue**: CSS rule at `src/index.css:82-86` kills CSS animations, but all framer-motion `motion.div` animations (stat bar fills, card stagger-enters, match header transitions) are JS-driven and bypass the media query. Users with `prefers-reduced-motion: reduce` still see all motion.
- **Fix**: Wrap app root with `<MotionConfig reducedMotion="user">` (framer-motion v10+) or use `useReducedMotion()` hook per component.

### 7. BottomNav missing safe-area-inset-left/right for landscape
- **File**: `src/components/BottomNav.tsx:17`
- **Issue**: Only `pb-[env(safe-area-inset-bottom,0px)]` is applied. `left-0 right-0` ignores left/right safe-area insets. In landscape on notched iPhones, nav content can overlap the sensor area.
- **Fix**: Add `left-[env(safe-area-inset-left,0px)] right-[env(safe-area-inset-right,0px)]` and internal `px-[env(safe-area-inset-left,0px)]`.

### 8. `text-[10px]` used across multiple components
- **Files**: `src/components/BottomNav.tsx:32`, `src/components/PlayerCard.tsx:42`, `src/components/StatBadge.tsx:34`
- **Issue**: 10px text breaks browser font scaling and is below recommended 12px minimum for body text. Users with low vision or zoom settings may not be able to read labels.
- **Fix**: Consider `text-xs` (12px) minimum for these labels, or ensure they're purely decorative/supplementary.

### 9. No keyboard handlers on interactive PlayerCard dots
- **File**: `src/components/PlayerCard.tsx:77-86`
- **Issue**: Dots have `role="button"` and `tabIndex={0}` but no `onKeyDown` handler. Pressing Enter/Space does nothing.
- **Fix**: Either add `onKeyDown` handler that triggers the same action as a click, or remove interactive semantics if these are tooltip-only.

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 1 |
| WARNING  | 4 |
| INFO     | 4 |

**Top priority**: Fix `viewport-fit=cover` (P0) — it's a one-line change that unblocks all safe-area-inset usage on notched iPhones. Add focus-visible rings to NavLink, NotFound Link, and PlayerCard dots for keyboard accessibility.
