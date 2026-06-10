# Code Review: Agent 2 (Build Config / Tailwind / Deps)

**Model**: deepseek-v4-flash-free  
**Datetime**: 20260610T191237  
**Git SHA**: 0df46ea

---

## CRITICAL: `flex-grow` class does not exist in Tailwind v4
- **File**: `src/pages/Home.tsx` :50
- **File**: `src/pages/MatchPage.tsx` :60
- **Issue**: `flex-grow` was an alias for `grow` in Tailwind v3 but was removed in v4. These styles silently fail — the input elements will not grow to fill available space.
- **Suggestion**: Replace `flex-grow` with `grow` in both files.

---

## WARNING: Unnecessary `autoprefixer` and `postcss` devDependencies
- **File**: `package.json` :25-26
- **Issue**: Tailwind CSS v4 uses `@tailwindcss/vite` which processes CSS internally via Lightning CSS — it does not require PostCSS or Autoprefixer. These packages are dead weight in both install and build.
- **Suggestion**: Remove `autoprefixer` and `postcss` from `devDependencies`.

---

## WARNING: Unnecessary `tailwindcss` standalone package
- **File**: `package.json` :27
- **Issue**: With `@tailwindcss/vite` plugin installed and configured, the standalone `tailwindcss` package is not needed for builds. The Vite plugin bundles the engine. Only keep if required for editor IntelliSense (and if so, ensure version matches `@tailwindcss/vite`).
- **Suggestion**: Remove `tailwindcss` from `devDependencies` unless specifically needed for tooling.

---

## WARNING: No route-level code splitting
- **File**: `src/routes.tsx` :1-4
- **Issue**: `Home`, `MatchPage`, and `NotFound` are eagerly imported at the top of the routes module. For an SPA with `framer-motion` and `lucide-react`, this increases the initial bundle unnecessarily. React Router v7 supports `React.lazy()` with `Suspense`.
- **Suggestion**: Convert imports to `React.lazy(() => import('./pages/Home'))` etc., wrap in `<Suspense>` with a skeleton fallback in the Layout component.

---

## WARNING: `moduleResolution: "Node"` in tsconfig.node.json
- **File**: `tsconfig.node.json` :6
- **Issue**: `moduleResolution: "Node"` is outdated and inconsistent with the main `tsconfig.json` which uses `"Bundler"`. This can cause type-checking mismatches for Vite config imports.
- **Suggestion**: Change to `"moduleResolution": "Bundler"`.

---

## WARNING: API token exposed in client-side bundle
- **File**: `src/types/config.ts` :18
- **Issue**: The `Accept` header contains what appears to be an API token/key (`4h7dznqdxwtp3hsfdyf5r793uahfxy7x`). Since this file is imported by `api.ts` which is used in the browser bundle, this value is visible to every client viewing the page source.
- **Suggestion**: Move sensitive tokens to environment variables (`VITE_API_TOKEN`) and reference via `import.meta.env`. If the token is intentionally public, rename to avoid confusion.

---

## INFO: `framer-motion` bundle weight
- **File**: `package.json` :13
- **Issue**: `framer-motion` ~32KB gzipped is imported in 6 components (`DualStatBar`, `PlayerCard`, `MatchHeader`, `StandingsTable`, `Home`, `MatchPage`). Many animations (simple fades, scales) could be achieved with CSS transitions/animations, reducing JS bundle size.
- **Suggestion**: Consider replacing trivial `motion.div` wrappers with CSS `@keyframes` or `transition` classes. Tree-shake by importing only used exports.

---

## INFO: `bg-black` on `<body>` in index.html inconsistent with CSS theme
- **File**: `index.html` :11
- **Issue**: `<body class="bg-black text-white antialiased">` — `bg-black` is `#000000` but `index.css` sets `background-color: var(--color-canvas)` which is `#0a0a0a`. If `bg-black` takes precedence (utility classes often win), the background will be true black instead of the intended dark canvas `#0a0a0a`.
- **Suggestion**: Remove `bg-black text-white` from the body tag in `index.html` and rely on the CSS rules in `index.css` (`background-color: var(--color-canvas); color: var(--color-text-primary)`).

---

## INFO: Unused `React` import in `main.tsx`
- **File**: `src/main.tsx` :1
- **Issue**: With React 19's automatic JSX runtime, `import React from 'react'` is unnecessary (only `React.StrictMode` requires it, but `StrictMode` can be imported as a named export).
- **Suggestion**: Replace with `import { StrictMode } from 'react'` or remove entirely and use `<StrictMode>` directly.

---

## INFO: `@vitejs/plugin-react` version may be incompatible with Vite 7
- **File**: `package.json` :24
- **Issue**: `@vitejs/plugin-react@^5.1.3` targets Vite 5.x. The project uses `vite@^7.3.1`. Major version mismatch between Vite and the React plugin can cause build failures or subtle bugs.
- **Suggestion**: Verify compatibility — upgrade to `@vitejs/plugin-react` v6 or v7 as appropriate, or downgrade Vite to v5.

---

## INFO: No `<title>` dynamic management
- **File**: `index.html` :8
- **Issue**: The `<title>` is static "Football Stats Modern". Each page (Home, MatchPage, NotFound) should set a dynamic title for better UX and SEO.
- **Suggestion**: Add a `<title>` tag per route using `document.title` in useEffect or a custom `useTitle` hook.

---

## INFO: `space-y-12` on main containers creates large gaps on mobile
- **File**: `src/pages/Home.tsx` :20
- **File**: `src/pages/MatchPage.tsx` :43
- **Issue**: `space-y-12` = 3rem (48px) spacing. On mobile (320–375px wide viewports), this vertical spacing is excessive relative to content and forces significant scrolling.
- **Suggestion**: Use responsive spacing like `space-y-8 md:space-y-12` to reduce gaps on small screens.
