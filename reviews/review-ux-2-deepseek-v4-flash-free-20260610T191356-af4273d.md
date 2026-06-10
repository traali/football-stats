## CRITICAL: px-based font sizes (`text-[10px]`) prevent user font scaling
- **File**: `src/components/BottomNav.tsx` :32
- **Issue**: `text-[10px]` for nav labels breaks browser font-size zoom — users who increase default font size in settings won't see larger text.
- **Suggestion**: Replace all `text-[10px]` with `text-xs` (0.75rem) across the codebase.

- **File**: `src/components/MatchHeader.tsx` :17,37
- **File**: `src/components/PlayerCard.tsx` :42,70
- **File**: `src/components/StandingsTable.tsx` :16
- **File**: `src/components/StatBadge.tsx` :34
- **File**: `src/pages/MatchPage.tsx` :114
- **Issue**: Same `text-[10px]` pattern in all these components — 7 instances total.
- **Suggestion**: Use `text-xs` instead.

## WARNING: Touch targets below 44px minimum (Button dense `h-10`)
- **File**: `src/components/Button.tsx` :29
- **Issue**: `dense` size sets `h-10` (40px), below WCAG/Apple HIG minimum 44px touch target.
- **Suggestion**: Change to `h-11` (44px) or keep `h-10` but add `min-h-[44px]`.

## WARNING: Interactive match-result dots (10px) lack adequate touch target
- **File**: `src/components/PlayerCard.tsx` :77-86
- **Issue**: Dots have `role="button"` and `tabIndex={0}` making them focusable, but physical touch target is only 10×10px — impossible to reliably tap on mobile.
- **Suggestion**: Increase to at least `w-11 h-11` (44px) with inner colored circle, or remove `role="button"` if non-interactive.

## WARNING: Interactive match-result dots missing keyboard event handler
- **File**: `src/components/PlayerCard.tsx` :78
- **Issue**: `role="button"` and `tabIndex={0}` indicate interactivity but there is no `onKeyDown` handler for Enter/Space. Keyboard users get focus but cannot activate.
- **Suggestion**: Add `onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { /* action */ } }}` or link to a tooltip/overlay.

## WARNING: Missing focus-visible ring on BottomNav NavLink items
- **File**: `src/components/BottomNav.tsx` :22-27
- **Issue**: Nav items have no `focus-visible:ring-*` styles. Keyboard users navigating via Tab have no visible focus indicator.
- **Suggestion**: Add `focus-visible:ring-2 focus-visible:ring-accent/50` to the `cn()` call.

## WARNING: Missing focus-visible ring on NotFound back link
- **File**: `src/pages/NotFound.tsx` :9
- **Issue**: The `<Link>` to home has hover and active states but no `focus-visible` ring.
- **Suggestion**: Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas`.

## WARNING: PlayerCard dot indicators missing focus-visible ring
- **File**: `src/components/PlayerCard.tsx` :80-86
- **Issue**: Focusable `role="button"` elements with no visible focus indicator.
- **Suggestion**: Add `focus-visible:ring-2 focus-visible:ring-accent/50` to the `cn()`.

## INFO: Page content lacks bottom padding to avoid BottomNav overlap
- **File**: `src/pages/Home.tsx` :19
- **File**: `src/pages/MatchPage.tsx` :42
- **File**: `src/pages/NotFound.tsx` :5
- **Issue**: BottomNav is `fixed bottom-0` at ~48px + safe-area. Page containers use `py-8` (32px bottom) — content at the bottom of each page can be obscured by the nav bar.
- **Suggestion**: Add `pb-[calc(env(safe-area-inset-bottom,0px)+56px)]` to the page wrapper or main content area.

## INFO: BottomNav missing safe-area-inset-left/right for landscape/notched phones
- **File**: `src/components/BottomNav.tsx` :17
- **Issue**: `pb-[env(safe-area-inset-bottom,0px)]` handles bottom notch but `left-0 right-0` ignores `safe-area-inset-left`/`safe-area-inset-right`. In landscape on iPhones with Dynamic Island/notch, nav content can overlap the sensor area.
- **Suggestion**: Change to `left-[env(safe-area-inset-left,0px)] right-[env(safe-area-inset-right,0px)]` and add `px-[env(safe-area-inset-left,0px)]` padding.

## INFO: No `prefers-reduced-motion` respect in framer-motion animations
- **File**: `src/index.css` :82-87
- **File**: `src/components/DualStatBar.tsx` :31-39, `src/components/MatchHeader.tsx` :8-19,29-30, `src/components/PlayerCard.tsx` :13-15, `src/pages/MatchPage.tsx` :72-176
- **Issue**: CSS `prefers-reduced-motion` reduces CSS transitions/animations but framer-motion bypasses CSS — it uses JavaScript-based animations via `MotionConfig`. Users who enable reduced motion will still see all framer-motion animations (scale, spring, opacity, stagger, pulsing dot in LiveBadge).
- **Suggestion**: Wrap the app root with `<MotionConfig reducedMotion="user">` (framer-motion v10+) to respect OS preference. Add `@media (prefers-reduced-motion: reduce) { .animate-shimmer { animation: none !important; } }` for the shimmer skeleton.
