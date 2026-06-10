# UX Review — Agent UX-1

**Model**: opencode/mimo-v2.5-free
**Date**: 2026-06-10T19:14:39Z
**Commit**: af4273d
**Scope**: Design tokens, accessibility, component consistency, DESIGN.md compliance

---

## CRITICAL: Missing `lang="fi"` in HTML root element

- **File**: `index.html` :11
- **Issue**: `<html lang="en">` but the app is Finnish-language per DESIGN.md ("Finnish-language interface, minimal copy"). Screen readers will misidentify the language, and search engines won't index Finnish content correctly.
- **Suggestion**: Change to `<html lang="fi">`.

---

## CRITICAL: No font loading — Inter and JetBrains Mono are referenced but never fetched

- **File**: `index.css` :38-39
- **Issue**: `--font-display` and `--font-mono` reference `"InterVariable"`, `"Inter"`, `"JetBrains Mono Variable"`, `"JetBrains Mono"` but no `@font-face`, Google Fonts `<link>`, or `@import` exists. The app falls back to system fonts, breaking the entire design system's typography spec (ss03 'g', zero-with-dot, tabular figures).
- **Suggestion**: Add Google Fonts `<link>` in `index.html` for Inter and JetBrains Mono, or use `@font-face` in CSS with local/WOFF2 sources.

---

## CRITICAL: Missing `--space-*` tokens in CSS — no 8px grid spacing system

- **File**: `index.css` :3-48
- **Issue**: DESIGN.md §5.1 defines a full spacing scale (`--space-1` through `--space-9`) as an 8px grid system. The `@theme` block defines `--radius-*` tokens but **completely omits all `--space-*` tokens**. Components use Tailwind utility spacing (`p-5`, `gap-3`, etc.) which works, but the token layer is absent — the spacing system isn't overridable or themeable.
- **Suggestion**: Add `--space-1` through `--space-9` to the `@theme` block matching DESIGN.md §12 values.

---

## CRITICAL: Search inputs have `focus:ring-0`, removing visible focus indicator

- **File**: `src/pages/Home.tsx` :50
- **File**: `src/pages/MatchPage.tsx` :60
- **Issue**: Both search inputs use `focus:ring-0`, completely removing the focus ring. DESIGN.md §10.2 requires "Focus visible: 2px solid hero-accent ring" on all interactive elements. Keyboard users cannot see when the input is focused.
- **Suggestion**: Replace `focus:ring-0` with `focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-canvas` (matching Button.tsx pattern).

---

## WARNING: BottomNav has 2 tabs, DESIGN.md specifies 4

- **File**: `src/components/BottomNav.tsx` :10-13
- **Issue**: DESIGN.md §11 says "Bottom tab bar (4 tabs)" for all breakpoints. The nav only has "Etusivu" and "Ottelu". Two missing tabs means the navigation architecture doesn't match the design spec.
- **Suggestion**: Add the remaining 2 tabs (likely "Sarjatulukset" and "Pelaajat" based on the feature set).

---

## WARNING: `cn()` utility duplicated 5 times across components

- **File**: `src/components/BottomNav.tsx` :6-8
- **File**: `src/components/Button.tsx` :6-8
- **File**: `src/components/StatBadge.tsx` :5-7
- **File**: `src/components/Skeleton.tsx` :4-6
- **File**: `src/components/PlayerCard.tsx` :8-10
- **Issue**: Identical `cn()` function (clsx + twMerge) is copy-pasted in 5 component files. This creates maintenance risk — if the merge logic changes, 5 files must be updated.
- **Suggestion**: Extract to a shared `src/utils/cn.ts` and import everywhere.

---

## WARNING: Form dots have `role="button"` and `tabIndex` but no keyboard event handler

- **File**: `src/components/PlayerCard.tsx` :76-86
- **Issue**: Form dots are marked as `role="button"` with `tabIndex={0}`, making them focusable and screen-reader-interactive. However, there is no `onClick` or `onKeyDown` handler — pressing Enter/Space does nothing. DESIGN.md §10.2 says "Form dots accessible via Enter/Space for tooltip." The dots also lack `aria-label` describing the match result.
- **Suggestion**: Add `onClick`/`onKeyDown` handlers and `aria-label` (e.g., `aria-label="Win vs HJK, 2-1"`). Consider using a popover component.

---

## WARNING: Framer-motion animations ignore `prefers-reduced-motion`

- **File**: `src/components/PlayerCard.tsx` :12-15
- **File**: `src/components/MatchHeader.tsx` :7-19
- **File**: `src/pages/MatchPage.tsx` :70-108
- **Issue**: `src/index.css` :82-86 disables CSS animations for `prefers-reduced-motion: reduce`. However, framer-motion's `motion.div`, `AnimatePresence`, and `variants` are JS-driven and ignore this media query. Stagger enter, scale press, and live pulse animations will still fire for users who prefer reduced motion.
- **Suggestion**: Use framer-motion's `useReducedMotion()` hook or wrap animations in a provider that respects the preference.

---

## WARNING: Missing `skip-to-content` link (accessibility)

- **File**: `src/routes.tsx` :7-14
- **Issue**: DESIGN.md §10.2 requires a "Skip-to-content link (hidden until focused)" for keyboard navigation. The `Layout` component has no skip link. Keyboard-only users must tab through the entire bottom nav on every page.
- **Suggestion**: Add `<a href="#main-content" className="sr-only focus:not-sr-only ...">Siirry sisältöön</a>` as the first child of the layout.

---

## WARNING: `aria-label` missing on search inputs and navigation

- **File**: `src/pages/Home.tsx` :45-51
- **File**: `src/pages/MatchPage.tsx` :55-61
- **File**: `src/components/BottomNav.tsx` :19-35
- **Issue**: Search inputs have placeholder text but no `aria-label`. NavLink items have visible labels but no `aria-label` on the nav element itself. Screen readers will announce "edit text" for the inputs.
- **Suggestion**: Add `aria-label="Hae ottelun ID"` to inputs, `aria-label="Päänavigointi"` to the nav element.

---

## WARNING: StandingsTable header uses `font-medium` (500), DESIGN.md requires weight 700

- **File**: `src/components/StandingsTable.tsx` :14-24
- **Issue**: DESIGN.md §6.7 says table header is "text caption (10px/700/uppercase)". The `<th>` elements use `font-medium` (weight 500) instead of `font-bold` (weight 700). Headers won't stand out as intended.
- **Suggestion**: Change `font-medium` to `font-bold` on `<th>` elements.

---

## WARNING: MatchHeader team names use `font-black` (900), DESIGN.md specifies 700

- **File**: `src/components/MatchHeader.tsx` :49, :60
- **Issue**: DESIGN.md §4.2 says section-title is "24px 700". The team names use `font-black` (weight 900), which is heavier than the spec. Similarly on `src/pages/MatchPage.tsx` :124, :141.
- **Suggestion**: Change `font-black` to `font-bold` (700) for section titles.

---

## WARNING: Hero score font size is 36/48px, DESIGN.md specifies 64px

- **File**: `src/components/MatchHeader.tsx` :53
- **Issue**: DESIGN.md §4.2 says "Hero-score: 64px, 700". The scoreline uses `text-4xl md:text-6xl` (36px/48px). On desktop it's still 48px, not 64px.
- **Suggestion**: Add `lg:text-7xl` (72px, closest available) or use a custom size for the hero score.

---

## INFO: `StatBadge` uses `rounded-md` (6px) — matches DESIGN.md

- **File**: `src/components/StatBadge.tsx` :29
- **Issue**: None. DESIGN.md §6.4 says Stat Badge radius is "rounded-md (6px)". Tailwind's `rounded-md` is 6px. This is correct.

---

## INFO: Button radius `rounded-md` matches DESIGN.md (8px)

- **File**: `src/components/Button.tsx` :38
- **Issue**: None. DESIGN.md §6.1 says buttons use "Rounded-md (8px)". Correct implementation.

---

## INFO: Card radius `rounded-xl` matches DESIGN.md (12px)

- **File**: `src/components/PlayerCard.tsx` :23, `MatchHeader.tsx` :31, `StandingsTable.tsx` :8
- **Issue**: None. DESIGN.md §6.2 says cards use "rounded-xl (12px)". Tailwind `rounded-xl` is 12px. Correct.

---

## INFO: BMW M tricolor implemented correctly

- **File**: `src/components/StandingsTable.tsx` :37
- **File**: `src/pages/MatchPage.tsx` :123, :140
- **Issue**: None. Tricolor gradient uses `from-bmw-cyan via-bmw-magenta to-bmw-amber` on a 4px left-border stripe. Matches DESIGN.md §3.4.

---

## INFO: Semantic colors in tokens match DESIGN.md exactly

- **File**: `src/index.css` :24-29
- **Issue**: None. All hex values for green (#22c55e), red (#ef4444), amber (#eab308), blue (#3b82f6), gray (#52525b) match DESIGN.md §3.3 exactly.

---

## INFO: Surface ladder tokens match DESIGN.md exactly

- **File**: `src/index.css` :4-12
- **Issue**: None. Canvas (#0a0a0a), surface-1/2/3 (#141414/#1c1c1c/#242424), border-hairline (#2a2a2a), border-strong (#3a3a3a) all match DESIGN.md §3.1 and §12.

---

## INFO: `prefers-reduced-motion` CSS rule is correctly implemented

- **File**: `src/index.css` :82-86
- **Issue**: None. Matches DESIGN.md §7.4 spec exactly.

---

## INFO: `::selection` uses accent color correctly

- **File**: `src/index.css` :66-69
- **Issue**: None. Selection background uses accent, text uses inverse — matches brand treatment.

---

*Review complete — 4 critical, 7 warnings, 8 info findings.*
