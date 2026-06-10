# Code Review: Build Config, Tailwind, Deps, Bundler

**Agent**: code-2
**Model**: mimo-v2-5-free
**Date**: 2026-06-10T19:14:42Z
**SHA**: af4273d
**Focus**: Build config, Tailwind class usage, deprecated deps, bundler warnings

---

## WARNING: Unnecessary PostCSS/Autoprefixer Dependencies

- **File**: `package.json` :25-26
- **Issue**: `autoprefixer` (^10.4.20) and `postcss` (^8.4.47) are listed as devDependencies but are unused. Tailwind v4 with `@tailwindcss/vite` plugin does not use PostCSS at all — it has its own Vite-native pipeline. These are leftover from a Tailwind v3 setup.
- **Suggestion**: Remove both from `devDependencies`:
  ```json
  "autoprefixer": "^10.4.20",
  "postcss": "^8.4.47",
  ```
  This reduces install size and avoids confusion about the build pipeline.

## WARNING: Hardcoded Match ID in BottomNav

- **File**: `src/components/BottomNav.tsx` :12
- **Issue**: The "Ottelu" nav link hardcodes `{ to: '/match/3760372' }`. This is a non-functional static link — it always navigates to the same match regardless of context.
- **Suggestion**: Either remove this nav item (since Home page already has a match search form), or make it a dynamic route like the current match being viewed (requires passing match state up to the layout).

## WARNING: `cn()` Utility Duplicated Across 5 Files

- **File**: `src/components/BottomNav.tsx` :6-8, `src/components/StatBadge.tsx` :5-7, `src/components/Skeleton.tsx` :4-6, `src/components/PlayerCard.tsx` :8-10, `src/components/Button.tsx` :6-8
- **Issue**: The `cn()` helper (`twMerge(clsx(inputs))`) is copy-pasted identically in 5 separate component files. This is a maintenance burden — any change to the utility must be replicated 5 times.
- **Suggestion**: Extract to a shared `src/utils/cn.ts`:
  ```ts
  import { clsx, type ClassValue } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }
  ```
  Then import from each component.

## WARNING: `any` Types in Data Layer

- **File**: `src/services/api.ts` :39
- **Issue**: `fetchAPIData` uses `params: Record<string, any>` — the `any` type defeats TypeScript safety on query parameters.
- **Suggestion**: Use `Record<string, string | number | boolean | undefined>` or a more specific params interface.

- **File**: `src/types/api.ts` :6
- **Issue**: `PlayerAPIResponse.matches: any[]` — the matches array from the API has no typed shape, making downstream processing in `dataProcessors.ts` unsafe.
- **Suggestion**: Define a `PlayerMatchRaw` interface based on the API response shape used in `dataProcessors.ts` (fields: `season_id`, `status`, `player_goals`, `player_warnings`, `player_suspensions`, `team_name`, `team_id`, `team_A_name`, `team_B_name`, `fs_A`, `fs_B`, `winner_id`, `date`).

- **File**: `src/utils/dataProcessors.ts` :19
- **Issue**: `matches: any[]` parameter — same issue as above; no compile-time safety when accessing `match.player_goals`, `match.season_id`, etc.
- **Suggestion**: Use the typed `PlayerMatchRaw[]` interface once defined.

## WARNING: `as PlayerStats` Type Assertion Bypasses Type Checking

- **File**: `src/hooks/useMatchData.ts` :55
- **Issue**: The return value of the mapping uses `as PlayerStats` type assertion. This bypasses TypeScript's structural checking — if `processedHistory` or `lineupInfo` fields don't match `PlayerStats`, no error is raised at compile time.
- **Suggestion**: Construct the object literal inline so TypeScript can validate the shape against the `PlayerStats` interface, or use a Zod/io-ts schema for runtime validation.

## WARNING: Non-Interactive Element with `role="button"` and `tabIndex`

- **File**: `src/components/PlayerCard.tsx` :77-78
- **Issue**: A `<div>` has `role="button"` and `tabIndex={0}` but no `onClick`, `onKeyDown`, or `onKeyPress` handler. This creates an accessible element that does nothing when activated via keyboard (Enter/Space), which is confusing for screen reader and keyboard users.
- **Suggestion**: Either add a keyboard handler (e.g., open a player detail modal) or remove `role="button"` and `tabIndex={0}` — the dots are purely visual indicators and should remain non-interactive.

## WARNING: `focus:ring-0` on Input Contradicts Focus Ring Convention

- **File**: `src/pages/Home.tsx` :50
- **File**: `src/pages/MatchPage.tsx` :60
- **Issue**: Both search inputs use `focus:ring-0` which disables the focus ring entirely. AGENTS.md specifies `focus-visible:ring-2 ring-accent/50` for interactive elements. The parent wrapper div uses `focus-within:ring-1 focus-within:ring-accent` which provides some visual feedback, but the input itself has no accessible focus indicator.
- **Suggestion**: Replace `focus:ring-0` with `focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none` on the `<input>` element.

## INFO: Missing `focus-visible` Ring on NotFound Link

- **File**: `src/pages/NotFound.tsx` :9
- **Issue**: The "Takaisin etusivulle" `<Link>` has `hover:bg-accent/90` and `active:scale-[0.97]` but no `focus-visible:ring-2 ring-accent/50` class. Per AGENTS.md conventions, all interactive elements should have `focus-visible:ring-2 ring-accent/50`.
- **Suggestion**: Add `focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none` to the Link className.

## WARNING: `index.html` Body Classes Conflict with CSS Theme

- **File**: `index.html` :11
- **Issue**: `<body class="bg-black text-white antialiased">` uses hardcoded `bg-black` and `text-white` Tailwind utility classes. The actual theme is defined via CSS custom properties in `index.css` (`--color-canvas: #0a0a0a`, `--color-text-primary: #f4f4f4`). The `bg-black` class applies `#000` which conflicts with the intended `#0a0a0a` canvas color. The `text-white` class is redundant since `color: var(--color-text-primary)` is already set via `:root`.
- **Suggestion**: Remove `bg-black text-white` from `<body>` since the CSS handles these via custom properties. Keep `antialiased` only.

## WARNING: Favicon References Non-Existent Vite Default

- **File**: `index.html` :6
- **Issue**: `<link rel="icon" type="image/svg+xml" href="/vite.svg" />` references the default Vite favicon which is not included in the project. This results in a 404 for the favicon in production.
- **Suggestion**: Either add a proper favicon SVG to the `public/` directory or remove the `<link>` tag.

## WARNING: Fragile String Comparison for Shirt Number

- **File**: `src/components/PlayerCard.tsx` :50
- **Issue**: `stats.shirtNumber !== "N/A"` is a string literal comparison. The `PlayerStats` type defines `shirtNumber: string`, but the "N/A" convention is implicit and fragile — if the API ever returns `null`, `undefined`, `"n/a"`, or `""`, the check silently fails.
- **Suggestion**: Normalize the shirt number at the data layer (e.g., convert `null`/`undefined`/`"N/A"` to a consistent sentinel in `useMatchData.ts`) or use a truthy check: `stats.shirtNumber && stats.shirtNumber !== "N/A"`.

## WARNING: Unstable React Keys for Player Lists

- **File**: `src/pages/MatchPage.tsx` :133, :150
- **Issue**: `key={player.name + player.shirtNumber}` concatenates name and shirt number. If two players share the same name and shirt number (unlikely but possible), React reconciliation breaks. Additionally, if `shirtNumber` is `"N/A"`, the key becomes `"John DoeN/A"` which is unusual.
- **Suggestion**: Use `player.name + player.teamIdInMatch` or the `player_id` from lineup data (available as `lineupInfo.player_id`) as a more stable unique key.

## INFO: Build Passes Cleanly

- **File**: `vite.config.ts` :1-12
- **Issue**: The build (`tsc && vite build`) completes without any warnings or errors. No bundler deprecation warnings are emitted.
- **Suggestion**: No action needed — the build is clean.

## WARNING: GitHub Actions Uses `npm install` Instead of `npm ci`

- **File**: `.github/workflows/deploy.yml` :28
- **Issue**: The CI step runs `npm install` instead of `npm ci`. In CI environments, `npm ci` is preferred because it installs from `package-lock.json` deterministically, fails if the lockfile is out of sync, and is faster. `npm install` can modify `package-lock.json` and produce non-reproducible builds.
- **Suggestion**: Change `npm install` to `npm ci` in the workflow.

## INFO: Tailwind v4 Theme Configuration is Correct

- **File**: `src/index.css` :1-87
- **Issue**: The Tailwind v4 `@theme` block correctly defines all design tokens (surface ladder, accent, semantic colors, typography, radius). The `@import "tailwindcss"` directive is the correct v4 syntax.
- **Suggestion**: No action needed.
