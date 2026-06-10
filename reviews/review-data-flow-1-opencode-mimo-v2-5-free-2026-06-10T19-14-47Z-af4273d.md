# Review: Data Flow — Agent 7

**Model**: `opencode/mimo-v2.5-free`
**Date**: 2026-06-10T19:14:47Z
**Commit**: `af4273d`

---

## CRITICAL: `matches: any[]` in PlayerAPIResponse — upstream type leak

- **File**: `src/types/api.ts:6`
- **Issue**: `matches: any[]` is the root `any` leak. This propagates to `processPlayerMatchHistory(matches: any[], ...)` in `src/utils/dataProcessors.ts:19`. Every property access inside that function (`match.player_goals`, `match.player_warnings`, `match.player_suspensions`, `match.team_name`, `match.season_id`, `match.status`, `match.fs_A`, `match.fs_B`, `match.winner_id`, `match.team_A_name`, `match.team_B_name`, `match.team_A_id`, `match.team_B_id`, `match.team_id`, `match.date`) is completely untyped. Typos or API schema changes silently produce `undefined` instead of errors.
- **Suggestion**: Define a `PlayerMatchEntry` interface with the known fields and use `matches: PlayerMatchEntry[]`.

## CRITICAL: Unsafe `as PlayerStats` assertion in useMatchData

- **File**: `src/hooks/useMatchData.ts:55`
- **Issue**: The return value is cast with `as PlayerStats` after spreading `processedHistory` (which is `ProcessedStats`) with lineup info. `ProcessedStats` is missing `teamIdInMatch`, `isCaptainInMatch`, `position_fi`, `height`, `weight`, `finland_raised`, `clubCrest`, and `name`/`shirtNumber`/`birthYear`/`img_url` from `PlayerStats`. While those are added in the spread, `ProcessedStats` also has `gamesPlayedLastSeason: number` and `goalsScoredLastSeason: number` which overlap with `PlayerStats` — but `ProcessedStats` does NOT have `teamIdInMatch` or `pastMatchesDetails` shape matching exactly (it does match, but the assertion bypasses compile-time verification). If `PlayerStats` gains new required fields, this cast silently breaks.
- **Suggestion**: Remove the `as PlayerStats` assertion and let TypeScript infer the object literal type against `PlayerStats`. This will catch missing fields at compile time.

## WARNING: `Record<string, any>` params in fetchAPIData

- **File**: `src/services/api.ts:39`
- **Issue**: `fetchAPIData<T>(endpoint: string, params: Record<string, any> = {})` accepts `any` values for query params. While `URLSearchParams` will stringify anything, this means callers can pass objects, arrays, or `undefined` values without a type error.
- **Suggestion**: Change to `Record<string, string | number | boolean | undefined>` to enforce primitive values at the call sites.

## WARNING: Index signatures `[key: string]: unknown` on API types

- **File**: `src/types/api.ts:7,35,43,49,117,129`
- **Issue**: `PlayerAPIResponse`, `Competition`, `Category`, `Season`, `DiscoveryMatch`, and `ScoreEntry` all have `[key: string]: unknown`. This defeats the purpose of the named fields — any property access on these types returns `unknown | <named type>`, and extra/malformed API fields pass through unchecked. It also means code like `data.competition_name` compiles but doesn't guarantee the field exists at runtime.
- **Suggestion**: Remove index signatures. If the API returns extra fields you don't care about, they simply won't be in the type. If you need unknown fields for a specific consumer, use a separate mapped type or `Omit`/`Pick`.

## WARNING: `processPlayerMatchHistory` accesses `match.fs_A` / `match.fs_B` without narrowing

- **File**: `src/utils/dataProcessors.ts:65-66,69-70`
- **Issue**: `playerTeamScore` and `opponentScore` are assigned from `match.fs_A` / `match.fs_B` which are untyped (`any`). These could be `undefined` at runtime, and the `PastMatchDetail` type defines them as `playerTeamScore?: string`. The downstream `PlayerCard.tsx:79` uses them in a title attribute: `(${match.playerTeamScore}-${match.opponentScore})` — if both are undefined, the user sees `(undefined-undefined)`.
- **Suggestion**: Default to `'-'` or `''` when `match.fs_A`/`match.fs_B` are falsy.

## WARNING: Hardcoded match ID in BottomNav

- **File**: `src/components/BottomNav.tsx:12`
- **Issue**: `{ to: '/match/3760372', label: 'Ottelu', icon: Search }` hardcodes a specific match ID as the nav destination. This is likely a development artifact.
- **Suggestion**: Either remove the hardcoded route or make it navigate to the current match context (e.g., `/match` with a search input, or the most recently viewed match).

## WARNING: Missing null-safety on `playerData.matches` in useMatchData

- **File**: `src/hooks/useMatchData.ts:38`
- **Issue**: `processPlayerMatchHistory(playerData.matches, ...)` is called without checking if `playerData` is defined or if `playerData.matches` exists. While `getPlayerData` throws if the API fails, a malformed API response could return `{ player: { ... } }` with a missing `matches` field, causing a runtime crash.
- **Suggestion**: Add a null guard: `playerData?.matches ?? []`.

## INFO: `parseInt` fallbacks silently coerce to 0

- **File**: `src/utils/dataProcessors.ts:40-42`
- **Issue**: `parseInt(match.player_goals) || 0` will silently return `0` for `undefined`, `null`, `NaN`, or non-numeric strings. While this is intentional for display, it masks data issues — a misspelled field name like `match.player_goal` (typo) would silently zero out all goals.
- **Suggestion**: Log a warning in development mode when `parseInt` returns `NaN` for non-empty strings, to catch API schema mismatches early.

## INFO: Duplicate `cn()` utility across 4 components

- **File**: `src/components/PlayerCard.tsx:8`, `src/components/StatBadge.tsx:5`, `src/components/Skeleton.tsx:4`, `src/components/Button.tsx:6`, `src/components/BottomNav.tsx:6`
- **Issue**: `cn()` is defined identically in 5 files. This is a maintenance concern — changes to the utility require updating all copies.
- **Suggestion**: Extract `cn()` to a shared `src/utils/cn.ts` and import it.

## INFO: API key exposed in source code

- **File**: `src/types/config.ts:18`
- **Issue**: `Accept: "json/4h7dznqdxwtp3hsfdyf5r793uahfxy7x"` contains what appears to be an API token/key in plain text. If this repo is public, the key is exposed.
- **Suggestion**: Move the API key to an environment variable (`import.meta.env.VITE_API_KEY`) and add `.env` to `.gitignore`.

---

## Data Flow Trace Summary

```
API (fetchAPIData<T> with Record<string, any>)
  → getMatchDetails / getPlayerData / etc. (typed wrappers)
    → useMatchData: fetches match + players, maps to PlayerStats[]
      → processPlayerMatchHistory(matches: any[], ...) ← ANY leak here
        → PlayerStats (cast via `as PlayerStats` ← unsafe assertion)
          → PlayerCard / MatchHeader / StandingsTable (consume typed props)
```

**Weakest link**: The `any[]` in `PlayerAPIResponse.matches` and the `as PlayerStats` assertion. Together they create a type-safety gap from the API boundary through to the UI components.
