# Code Review — Round 2

**Reviewer:** opencode/mimo-v2-5-free
**Date:** 2026-06-11T04-23:42Z
**Commit:** `0f69065`

---

## Build Status

Build passes cleanly (`tsc && vite build`) with zero warnings. 14.07s build time, 460 KB JS / 38 KB CSS output.

---

## Findings

### CRITICAL

#### 1. `cn()` utility duplicated 5 times
**Files:** `Button.tsx:6`, `PlayerCard.tsx:8`, `BottomNav.tsx:6`, `StatBadge.tsx:5`, `Skeleton.tsx:4`

The identical `cn()` function (combining `clsx` + `twMerge`) is defined locally in 5 separate component files. This is a DRY violation and a maintenance hazard. Extract to `src/utils/cn.ts` and import everywhere.

#### 2. Dead devDependency: `autoprefixer`
**File:** `package.json:26`

With Tailwind CSS v4 + `@tailwindcss/vite` plugin, vendor prefixing is handled internally by Lightning CSS. There is no `postcss.config.*` file. `autoprefixer@10.4.20` is installed but never loaded — dead weight. Remove it.

#### 3. Dead devDependency: `postcss`
**File:** `package.json:27`

No `postcss.config.*` exists. PostCSS is only present as a transitive dep of `autoprefixer` and Vite. With Tailwind v4's native Vite plugin, there is no PostCSS pipeline. The explicit `postcss@^8.4.47` devDependency serves no purpose.

### HIGH

#### 4. Hardcoded match ID in BottomNav
**File:** `src/components/BottomNav.tsx:12`

```tsx
{ to: '/match/3760372', label: 'Ottelu', icon: Search },
```

The "Ottelu" nav link points to a hardcoded match ID `3760372`. This makes no sense as a persistent navigation target. Either this should be dynamic (last-viewed match) or removed entirely.

#### 5. `tsconfig.node.json` uses legacy `moduleResolution: "Node"`
**File:** `tsconfig.node.json:6`

The node config uses `"moduleResolution": "Node"` while the main `tsconfig.json` uses `"Bundler"`. Since this only covers `vite.config.ts`, it works, but it's inconsistent and won't resolve package exports correctly if vite.config.ts ever imports from packages using the `exports` field.

### MEDIUM

#### 6. Inconsistent className patterns — template literals vs `cn()`
**Files:** `StandingsTable.tsx:31,34`, `DualStatBar.tsx:30,36`

`StandingsTable` and `DualStatBar` use template literal interpolation for className (`${isMatchTeam ? 'text-accent' : 'text-text-secondary'}`) while all other components use `cn()`. This is a style inconsistency. Worse: if these components ever need conditional class merging (e.g., responsive overrides), the template approach will silently fail.

#### 7. No `cn.ts` utility — each component re-imports `clsx` and `tailwind-merge`
**Files:** All 5 components with `cn()`

Beyond the duplication, each component individually imports `clsx` (with `ClassValue` type) and `twMerge`. If `clsx` is ever swapped for an alternative (e.g., `cva`), 5 files need updating.

#### 8. `vite.config.ts` missing build optimizations
**File:** `vite.config.ts`

No `build.rollupOptions.output.manualChunks` configured. The single 460 KB JS bundle includes `framer-motion`, `react-router-dom`, `lucide-react`, and all app code. Consider splitting vendor chunks for better caching.

#### 9. `react-router-dom@^7.14.2` — minor version behind
**File:** `package.json:17`

Latest react-router-dom v7 is `7.17.0`. The `^7.14.2` range allows updates but isn't locked to a recent version. Verify no breaking changes in 7.15–7.17 affect the `createBrowserRouter` API usage.

### LOW

#### 10. No ESLint or Prettier configuration
**Files:** None

No `.eslintrc*`, `eslint.config.*`, or `.prettierrc*` exists. The `build` script relies solely on `tsc` for type checking. Lint rules would catch unused imports, the duplicated `cn()` pattern, and template literal className inconsistencies automatically.

#### 11. `body` class in `index.html` duplicates CSS
**File:** `index.html:11`

`<body class="bg-black text-white antialiased">` applies Tailwind utility classes, but `src/index.css:59-64` already sets `background-color: var(--color-canvas)` and `color: var(--color-text-primary)` on `body`. The `bg-black` in index.html is overwritten by the CSS. The `antialiased` class is also redundant since `index.css:55-56` sets `-webkit-font-smoothing: antialiased`.

#### 12. `useDefineForClassFields` is redundant
**File:** `tsconfig.json:5`

`"useDefineForClassFields": true` is the default for `target: "ESNext"`. It's not harmful but adds noise.

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 3 |
| HIGH     | 2 |
| MEDIUM   | 4 |
| LOW      | 3 |

The codebase builds cleanly and the Tailwind v4 theme system is well-structured. The main issues are dead dependencies (`autoprefixer`, `postcss`), the duplicated `cn()` utility, and a hardcoded match ID in navigation.
