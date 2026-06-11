# Critical Issues — football-stats

**Generated**: 2026-06-11T12:00:00Z
**Source files**: review-api-1-mimo-v2-5-free, review-code-1-1-nemotron-3-ultra-free, review-ux-1-opencode-mimo-v25-free, review-code-1-opencode-mimo-v2-5-free, review-api-2-mimo-v2-5-free, review-ux-2-mimo-v2-free, review-data-flow-1-opencode-mimo-v2-5-free, review-data-flow-2-opencode-mimo-v2-free, review-ux-2-deepseek-v4-flash-free, review-api-2-opencode-deepseek-v4-flash-free, review-data-flow-1-deepseek_v4_flash_free, review-api-1-opencode-deepseek-v4-flash-free, review-data-flow-2-deepseek-v4-flash-free, review-code-2-deepseek-v4-flash-free, review-code-1-deepseek-v4-flash-free

## Summary

| Metric | Count |
|--------|-------|
| Total CRITICAL findings (across all reports) | 33 |
| Unique issues (deduplicated by root cause) | 20 |
| Models that reported CRITICALs | deepseek-v4-flash-free, opencode/mimo (v2.5-free + v2-free), nemotron-3-ultra-free |

## Issues by Severity Impact

### Runtime crashes

### C05: `batchFetch` uses `Promise.all` — single failure kills entire batch
- **Severity**: CRITICAL
- **Category**: Runtime crash / Error handling
- **Found by**: deepseek-v4-flash-free, opencode/mimo
- **File**: `src/services/api.ts:83`
- **Issue**: `Promise.all` fails fast on any single rejection. For a match with 22+ players, one transient API failure on any player crashes the entire match page — all previously resolved results are lost. All players, standings, and match data are discarded.
- **Fix**: Replace `Promise.all` with `Promise.allSettled`. Collect fulfilled results and push `null` for rejected entries. Callers must handle `T | null`.
- **Status**: Not fixed

### C06: No request cancellation / AbortController in `useMatchData`
- **Severity**: CRITICAL
- **Category**: Runtime crash / Error handling
- **Found by**: deepseek-v4-flash-free, opencode/mimo
- **File**: `src/hooks/useMatchData.ts:19-65`
- **Issue**: `fetchData` has no `AbortController`. If `matchId` changes rapidly, multiple concurrent `fetchData` calls run in parallel. The earliest response can overwrite the latest, displaying stale/wrong match data. React 18 strict mode double-invocation compounds the race.
- **Fix**: Add `useRef<AbortController>()`. Abort previous in-flight request before starting a new one. Pass `controller.signal` through to `fetchAPIData` and `batchFetch`.
- **Status**: Not fixed

### C07: `batchFetch` has no abort signal propagation
- **Severity**: CRITICAL
- **Category**: Runtime crash / Error handling
- **Found by**: opencode/mimo
- **File**: `src/services/api.ts:75-87`
- **Issue**: `batchFetch` accepts no `AbortSignal`. Even if `useMatchData` were to abort, `batchFetch` would continue firing all remaining fetch calls. Each call creates its own internal `AbortController`, but the outer batch loop has no way to be cancelled.
- **Fix**: Accept an optional `AbortSignal` in `batchFetch`. Check `signal.aborted` before each batch iteration. Reject with `AbortError` if aborted.
- **Status**: Not fixed

### C08: Stale data visible during loading when `matchId` changes
- **Severity**: CRITICAL
- **Category**: Runtime crash
- **Found by**: deepseek-v4-flash-free, opencode/mimo
- **File**: `src/hooks/useMatchData.ts:9-17`
- **Issue**: `fetchData` does not clear `data` before fetching. When `matchId` changes, old match data remains visible while the skeleton loads — users see a flash of stale match content with the new loading spinner on top. Both old data and skeleton render simultaneously.
- **Fix**: Call `setData(null)` at the top of `fetchData`, before `setLoading(true)`, so old data is cleared immediately when a new fetch starts.
- **Status**: Not fixed

### C09: Error and Loading can display simultaneously
- **Severity**: CRITICAL
- **Category**: Runtime crash
- **Found by**: opencode/mimo
- **File**: `src/pages/MatchPage.tsx:71-101`
- **Issue**: The `AnimatePresence` renders both error and loading blocks without mutual exclusion. After an error, `error` remains non-null while a new `fetchData` sets `loading=true`. The UI shows the error banner AND the loading skeleton simultaneously — a flash of contradictory state.
- **Fix**: Use mutually exclusive state. Clear `error` when `loading` starts, or conditionally render: show skeleton only when `loading && !error && !data`, show error only when `error && !loading`.
- **Status**: Not fixed

### C16: `fetchAPIData` generic wrapper does not model `call.status` envelope — crashes on non-standard responses
- **Severity**: CRITICAL
- **Category**: Runtime crash / Error handling
- **Found by**: opencode/mimo
- **File**: `src/services/api.ts:69-71`
- **Issue**: Every API response is checked via `data?.call?.status?.toLowerCase() !== "ok"`, but the return type is the raw inner payload `<T>`. If the API ever returns a shape without a `call` property (e.g. `{ data: ... }`), `data` is returned as-is but typed as the inner shape, causing downstream crashes. `data?.call?.status` evaluates to `undefined` for error-shaped responses, silently passing them through.
- **Fix**: Define an `APIResponse<T>` wrapper type `{ call: { status: string }; [key: string]: unknown }`, use it in `fetchAPIData`, and unwrap before returning.
- **Status**: Not fixed

### C17: `data?.players.filter()` crashes when `data` is null
- **Severity**: CRITICAL
- **Category**: Runtime crash
- **Found by**: deepseek-v4-flash-free
- **File**: `src/pages/MatchPage.tsx:33-34`
- **Issue**: `data?.players.filter(p => p.teamIdInMatch === data.match.team_A_id)` — optional chaining on `data` short-circuits to `undefined` when `data` is `null`, then `.filter()` is called on `undefined`, throwing `TypeError`. The `|| []` fallback never executes. This is a guaranteed crash on every initial render (state initializes as `null`).
- **Fix**: Change to `data?.players?.filter(...) || []` and use `data?.match?.team_A_id` for the inner access. Guard must be robust against null data.
- **Status**: Not fixed

### C19: No `useEffect` cleanup — state updates on unmounted component
- **Severity**: CRITICAL
- **Category**: Runtime crash
- **Found by**: deepseek-v4-flash-free
- **File**: `src/pages/MatchPage.tsx:19-24`
- **Issue**: The `useEffect` that calls `fetchData` has no cleanup function. If the component unmounts while a fetch is in-flight, `setData`/`setError`/`setLoading` will execute on an unmounted component (React warning, and potential memory/state leak).
- **Fix**: Add a cleanup boolean or abort the controller in the effect's cleanup.
- **Status**: Not fixed

---

### Type safety

### C01: `any[]` in `PlayerAPIResponse.matches` — zero type safety on match object shape
- **Severity**: CRITICAL
- **Category**: Type safety
- **Found by**: deepseek-v4-flash-free, opencode/mimo, nemotron-3-ultra-free
- **File**: `src/types/api.ts:6`, `src/utils/dataProcessors.ts:19`, `src/hooks/useMatchData.ts:37`
- **Issue**: `matches: any[]` means every property access in `dataProcessors.ts` (player_goals, player_warnings, player_suspensions, season_id, status, fs_A, fs_B, team_A_name, team_B_name, team_A_id, team_id, winner_id, date) is unvalidated. A misspelling or API change silently produces NaN/undefined. This propagates through `processPlayerMatchHistory(matches: any[])` to the UI. Universal consensus — every model flagged this as the #1 type-safety failure (10+ agents across 3 models).
- **Fix**: Define a `PlayerMatchHistory`/`PlayerMatchEntry` interface covering all consumed fields and type `matches` as `PlayerMatchHistory[]`.
- **Status**: Not fixed

### C02: Unsafe `as PlayerStats` assertion in `useMatchData`
- **Severity**: CRITICAL
- **Category**: Type safety
- **Found by**: deepseek-v4-flash-free, opencode/mimo, nemotron-3-ultra-free
- **File**: `src/hooks/useMatchData.ts:55`
- **Issue**: The object literal is cast with `as PlayerStats`, disabling all structural type checking. If `PlayerStats` gains new required fields or an existing field is renamed, this code silently produces an invalid object. `clubCrest` and `finland_raised` exist as optional fields but are never populated from API data. The cast hides mismatches between `ProcessedStats` and `PlayerStats`.
- **Fix**: Remove the `as` assertion and let TypeScript validate the object shape. Explicitly construct the object with all required fields. Add `clubCrest: undefined` or source it from team data.
- **Status**: Not fixed

### C03: `Record<string, any>` in `fetchAPIData` params
- **Severity**: CRITICAL
- **Category**: Type safety
- **Found by**: opencode/mimo, nemotron-3-ultra-free
- **File**: `src/services/api.ts:39`
- **Issue**: `params: Record<string, any>` allows passing non-stringifiable values (objects, arrays) to `URLSearchParams`, which silently coerces them to `[object Object]` or `"true"`, producing wrong API queries. Every caller passes untyped objects with no compiler check.
- **Fix**: Change to `Record<string, string | number | boolean | undefined>` and convert values with `String(val)` before passing to `URLSearchParams`.
- **Status**: Not fixed

### C04: Index signatures `[key: string]: unknown` defeating type safety
- **Severity**: CRITICAL
- **Category**: Type safety
- **Found by**: nemotron-3-ultra-free
- **File**: `src/types/api.ts:7,35,42,49,117,129`
- **Issue**: Six interfaces (`PlayerAPIResponse`, `Competition`, `Category`, `Season`, `DiscoveryMatch`, `ScoreEntry`) use `[key: string]: unknown` index signatures, allowing arbitrary properties and preventing excess property checking. On `PlayerAPIResponse` specifically, it hides the `any[]` on `matches` because the index signature makes the type wider without narrowing known fields.
- **Fix**: Remove index signatures. If API returns extra fields, use a separate mapped type for parsing then map to strict internal types.
- **Status**: Not fixed

### C15: `PastMatchDetail` fields allow `undefined` but typed as required `string`
- **Severity**: CRITICAL
- **Category**: Type safety
- **Found by**: opencode/mimo
- **File**: `src/types/api.ts:150-158`
- **Issue**: `playerTeamScore` and `opponentScore` are typed as `string` but assigned from `match.fs_A`/`match.fs_B` which are `any` (from the `any[]` leak). If the API returns `null` or `undefined`, the code assigns `undefined` to a `string` variable, and the UI renders `"undefined - undefined"` in PlayerCard titles.
- **Fix**: Make `playerTeamScore` and `opponentScore` optional (`string?`) in `PastMatchDetail`, and add `?? ''` fallback in `dataProcessors.ts:65-66,69-70`.
- **Status**: Not fixed

---

### Accessibility

### C10: Missing `lang="fi"` in HTML root element
- **Severity**: CRITICAL
- **Category**: Accessibility
- **Found by**: opencode/mimo
- **File**: `index.html:11`
- **Issue**: `<html lang="en">` but the app is Finnish-language per DESIGN.md. Screen readers will misidentify the language, and search engines won't index Finnish content correctly.
- **Fix**: Change to `<html lang="fi">`.
- **Status**: Not fixed

### C11: No font loading — Inter and JetBrains Mono are referenced but never fetched
- **Severity**: CRITICAL
- **Category**: Accessibility / Design system
- **Found by**: opencode/mimo
- **File**: `src/index.css:38-39`
- **Issue**: `--font-display` and `--font-mono` reference `"InterVariable"`, `"Inter"`, `"JetBrains Mono Variable"`, `"JetBrains Mono"` but no `@font-face`, Google Fonts `<link>`, or `@import` exists. The app falls back to system fonts, breaking the entire design system's typography spec (ss03 'g', zero-with-dot, tabular figures).
- **Fix**: Add Google Fonts `<link>` in `index.html` for Inter and JetBrains Mono, or use `@font-face` in CSS with local/WOFF2 sources.
- **Status**: Not fixed

### C13: Search inputs have `focus:ring-0` removing visible focus indicator
- **Severity**: CRITICAL
- **Category**: Accessibility
- **Found by**: opencode/mimo
- **File**: `src/pages/Home.tsx:50`, `src/pages/MatchPage.tsx:60`
- **Issue**: Both search inputs use `focus:ring-0`, completely removing the focus ring. DESIGN.md §10.2 requires "Focus visible: 2px solid hero-accent ring" on all interactive elements. Keyboard users cannot see when the input is focused.
- **Fix**: Replace `focus:ring-0` with `focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-canvas`.
- **Status**: Not fixed

### C14: Missing `viewport-fit=cover` prevents safe-area-inset from working
- **Severity**: CRITICAL
- **Category**: Accessibility
- **Found by**: opencode/mimo
- **File**: `index.html:7`
- **Issue**: The viewport meta tag lacks `viewport-fit=cover`. Without it, iOS will not honor `env(safe-area-inset-bottom)` or `env(safe-area-inset-top)`, meaning the BottomNav's `pb-[env(safe-area-inset-bottom,0px)]` will always resolve to `0px` on notched iPhones.
- **Fix**: Change to `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />`
- **Status**: Not fixed

### C18: px-based font sizes (`text-[10px]`) prevent user font scaling
- **Severity**: CRITICAL
- **Category**: Accessibility
- **Found by**: deepseek-v4-flash-free
- **File**: `src/components/BottomNav.tsx:32`, `src/components/MatchHeader.tsx:17,37`, `src/components/PlayerCard.tsx:42,70`, `src/components/StandingsTable.tsx:16`, `src/components/StatBadge.tsx:34`, `src/pages/MatchPage.tsx:114`
- **Issue**: 7 instances of `text-[10px]` across 6 components. px-based font sizes break browser font-size zoom — users who increase default font size in settings won't see larger text.
- **Fix**: Replace all `text-[10px]` with `text-xs` (0.75rem) across the codebase.
- **Status**: Not fixed

---

### Error handling

### C05: `batchFetch` uses `Promise.all` — single failure kills entire batch
- (See Runtime crashes section above)

### C06: No request cancellation / AbortController
- (See Runtime crashes section above)

### C07: `batchFetch` has no abort signal propagation
- (See Runtime crashes section above)

### C16: `fetchAPIData` envelope crash
- (See Runtime crashes section above)

---

### Design system

### C11: No font loading
- (See Accessibility section above)

### C12: Missing `--space-*` tokens in CSS — no 8px grid spacing system
- **Severity**: CRITICAL
- **Category**: Design system
- **Found by**: opencode/mimo
- **File**: `src/index.css:3-48`
- **Issue**: DESIGN.md §5.1 defines a full spacing scale (`--space-1` through `--space-9`) as an 8px grid system. The `@theme` block defines `--radius-*` tokens but completely omits all `--space-*` tokens. Components use Tailwind utility spacing which works, but the token layer is absent — the spacing system isn't overridable or themeable.
- **Fix**: Add `--space-1` through `--space-9` to the `@theme` block matching DESIGN.md §12 values.
- **Status**: Not fixed

### C20: `flex-grow` class does not exist in Tailwind v4
- **Severity**: CRITICAL
- **Category**: Design system
- **Found by**: deepseek-v4-flash-free
- **File**: `src/pages/Home.tsx:50`, `src/pages/MatchPage.tsx:60`
- **Issue**: `flex-grow` was an alias for `grow` in Tailwind v3 but was removed in v4. These styles silently fail — the input elements will not grow to fill available space.
- **Fix**: Replace `flex-grow` with `grow` in both files.
- **Status**: Not fixed

---

## Each Issue Entry

### C01: `any[]` in `PlayerAPIResponse.matches` — zero type safety on match object shape
- **Severity**: CRITICAL
- **Category**: Type safety
- **Found by**: deepseek-v4-flash-free, opencode/mimo, nemotron-3-ultra-free
- **File**: `src/types/api.ts:6` → `src/utils/dataProcessors.ts:19` → `src/hooks/useMatchData.ts:37`
- **Issue**: `matches: any[]` means every property access in `dataProcessors.ts` (player_goals, player_warnings, player_suspensions, season_id, status, fs_A, fs_B, team_A_name, team_B_name, team_A_id, team_id, winner_id, date) is unvalidated. A misspelling or API change silently produces NaN/undefined. Universal consensus — every model flagged this as the #1 type-safety failure (10+ agents across 3 models).
- **Fix**: Define a `PlayerMatchHistory`/`PlayerMatchEntry` interface covering all consumed fields and type `matches` as `PlayerMatchHistory[]`.
- **Status**: Not fixed

### C02: Unsafe `as PlayerStats` assertion in `useMatchData`
- **Severity**: CRITICAL
- **Category**: Type safety
- **Found by**: deepseek-v4-flash-free, opencode/mimo, nemotron-3-ultra-free
- **File**: `src/hooks/useMatchData.ts:55`
- **Issue**: The object literal is cast with `as PlayerStats`, disabling all structural type checking. If `PlayerStats` gains new required fields or an existing field is renamed, this code silently produces an invalid object. `clubCrest` and `finland_raised` exist as optional fields but are never populated from API data. The cast hides mismatches between `ProcessedStats` and `PlayerStats`.
- **Fix**: Remove the `as` assertion and let TypeScript validate the object shape. Explicitly construct the object with all required fields. Add `clubCrest: undefined` or source it from team data.
- **Status**: Not fixed

### C03: `Record<string, any>` in `fetchAPIData` params
- **Severity**: CRITICAL
- **Category**: Type safety
- **Found by**: opencode/mimo, nemotron-3-ultra-free
- **File**: `src/services/api.ts:39`
- **Issue**: `params: Record<string, any>` allows passing non-stringifiable values to `URLSearchParams`, silently coercing them to `[object Object]`. Every caller passes untyped objects with no compiler check.
- **Fix**: Change to `Record<string, string | number | boolean | undefined>` and convert values with `String(val)`.
- **Status**: Not fixed

### C04: Index signatures `[key: string]: unknown` defeating type safety
- **Severity**: CRITICAL
- **Category**: Type safety
- **Found by**: nemotron-3-ultra-free
- **File**: `src/types/api.ts:7,35,42,49,117,129`
- **Issue**: Six interfaces use `[key: string]: unknown` index signatures, allowing arbitrary properties and preventing excess property checking. This weakens type checking on known-key access and hides the `any[]` on `matches`.
- **Fix**: Remove index signatures. Use a separate mapped type for parsing then map to strict internal types.
- **Status**: Not fixed

### C05: `batchFetch` uses `Promise.all` — single failure kills entire batch
- **Severity**: CRITICAL
- **Category**: Runtime crash / Error handling
- **Found by**: deepseek-v4-flash-free, opencode/mimo
- **File**: `src/services/api.ts:83`
- **Issue**: `Promise.all` fails fast on any single rejection. For a match with 22+ players, one transient API failure on any player crashes the entire match page.
- **Fix**: Replace with `Promise.allSettled`. Collect fulfilled results and push `null` for rejected entries.
- **Status**: Not fixed

### C06: No request cancellation / AbortController in `useMatchData`
- **Severity**: CRITICAL
- **Category**: Runtime crash / Error handling
- **Found by**: deepseek-v4-flash-free, opencode/mimo
- **File**: `src/hooks/useMatchData.ts:19-65`
- **Issue**: No `AbortController` — multiple concurrent fetches race, earliest response can overwrite latest, showing stale/wrong match data.
- **Fix**: Add `useRef<AbortController>()`. Abort previous in-flight request before starting a new one. Pass signal through API chain.
- **Status**: Not fixed

### C07: `batchFetch` has no abort signal propagation
- **Severity**: CRITICAL
- **Category**: Runtime crash / Error handling
- **Found by**: opencode/mimo
- **File**: `src/services/api.ts:75-87`
- **Issue**: `batchFetch` accepts no `AbortSignal`. Even if `useMatchData` were to abort, batch loop continues firing all remaining calls.
- **Fix**: Accept optional `AbortSignal` in `batchFetch`. Check `signal.aborted` before each batch iteration.
- **Status**: Not fixed

### C08: Stale data visible during loading when `matchId` changes
- **Severity**: CRITICAL
- **Category**: Runtime crash
- **Found by**: deepseek-v4-flash-free, opencode/mimo
- **File**: `src/hooks/useMatchData.ts:9-17`
- **Issue**: `fetchData` does not clear `data` before fetching. Old match data remains visible during loading — users see a flash of stale content.
- **Fix**: Call `setData(null)` at the top of `fetchData`, before `setLoading(true)`.
- **Status**: Not fixed

### C09: Error and Loading can display simultaneously
- **Severity**: CRITICAL
- **Category**: Runtime crash
- **Found by**: opencode/mimo
- **File**: `src/pages/MatchPage.tsx:71-101`
- **Issue**: Error banner and loading skeleton render simultaneously after an error triggers a new fetch.
- **Fix**: Use mutually exclusive state. Clear `error` when `loading` starts.
- **Status**: Not fixed

### C10: Missing `lang="fi"` in HTML root element
- **Severity**: CRITICAL
- **Category**: Accessibility
- **Found by**: opencode/mimo
- **File**: `index.html:11`
- **Issue**: `<html lang="en">` for a Finnish-language app. Screen readers misidentify language.
- **Fix**: Change to `<html lang="fi">`.
- **Status**: Not fixed

### C11: No font loading — Inter and JetBrains Mono never fetched
- **Severity**: CRITICAL
- **Category**: Accessibility / Design system
- **Found by**: opencode/mimo
- **File**: `src/index.css:38-39`
- **Issue**: Font families are referenced in CSS tokens but never loaded via `@font-face` or Google Fonts `<link>`. Entire typography spec silently falls back to system fonts.
- **Fix**: Add Google Fonts `<link>` in `index.html` for Inter and JetBrains Mono, or use `@font-face`.
- **Status**: Not fixed

### C12: Missing `--space-*` tokens in CSS
- **Severity**: CRITICAL
- **Category**: Design system
- **Found by**: opencode/mimo
- **File**: `src/index.css:3-48`
- **Issue**: DESIGN.md defines `--space-1` through `--space-9` 8px grid tokens. The `@theme` block omits them entirely.
- **Fix**: Add `--space-1` through `--space-9` to the `@theme` block.
- **Status**: Not fixed

### C13: Search inputs have `focus:ring-0` removing visible focus indicator
- **Severity**: CRITICAL
- **Category**: Accessibility
- **Found by**: opencode/mimo
- **File**: `src/pages/Home.tsx:50`, `src/pages/MatchPage.tsx:60`
- **Issue**: `focus:ring-0` removes keyboard focus indicator on both search inputs.
- **Fix**: Replace with `focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-canvas`.
- **Status**: Not fixed

### C14: Missing `viewport-fit=cover` prevents safe-area-inset
- **Severity**: CRITICAL
- **Category**: Accessibility
- **Found by**: opencode/mimo
- **File**: `index.html:7`
- **Issue**: No `viewport-fit=cover`. iOS safe-area-inset env values always resolve to 0 on notched iPhones.
- **Fix**: Add `viewport-fit=cover` to the viewport meta tag.
- **Status**: Not fixed

### C15: `PastMatchDetail` fields allow `undefined` but typed as required `string`
- **Severity**: CRITICAL
- **Category**: Type safety
- **Found by**: opencode/mimo
- **File**: `src/types/api.ts:150-158`
- **Issue**: `playerTeamScore` and `opponentScore` typed as `string` but receive `any` values from `any[]` leak. `undefined` renders as `"undefined-undefined"` in UI.
- **Fix**: Make fields optional and add `?? ''` fallback in dataProcessors.ts.
- **Status**: Not fixed

### C16: `fetchAPIData` generic wrapper does not model `call.status` envelope
- **Severity**: CRITICAL
- **Category**: Runtime crash / Error handling
- **Found by**: opencode/mimo
- **File**: `src/services/api.ts:69-71`
- **Issue**: Return type is raw inner payload `<T>`. API responses without `call.status` are returned as-is, causing downstream crashes.
- **Fix**: Define `APIResponse<T>` wrapper type and unwrap before returning.
- **Status**: Not fixed

### C17: `data?.players.filter()` crashes when `data` is null
- **Severity**: CRITICAL
- **Category**: Runtime crash
- **Found by**: deepseek-v4-flash-free
- **File**: `src/pages/MatchPage.tsx:33-34`
- **Issue**: Guaranteed `TypeError` on initial render — `data` is `null`, optional chaining yields `undefined`, `.filter()` called on `undefined`.
- **Fix**: Use `data?.players?.filter(...) || []` and `data?.match?.team_A_id`.
- **Status**: Not fixed

### C18: px-based font sizes (`text-[10px]`) prevent user font scaling
- **Severity**: CRITICAL
- **Category**: Accessibility
- **Found by**: deepseek-v4-flash-free
- **File**: 7 instances across 6 components (BottomNav, MatchHeader, PlayerCard, StandingsTable, StatBadge, MatchPage)
- **Issue**: `text-[10px]` breaks browser font-size zoom.
- **Fix**: Replace all `text-[10px]` with `text-xs` (0.75rem).
- **Status**: Not fixed

### C19: No `useEffect` cleanup — state updates on unmounted component
- **Severity**: CRITICAL
- **Category**: Runtime crash
- **Found by**: deepseek-v4-flash-free
- **File**: `src/pages/MatchPage.tsx:19-24`
- **Issue**: No cleanup function. State setters execute on unmounted component if fetch is in-flight.
- **Fix**: Add cleanup boolean or abort controller in effect cleanup.
- **Status**: Not fixed

### C20: `flex-grow` class does not exist in Tailwind v4
- **Severity**: CRITICAL
- **Category**: Design system
- **Found by**: deepseek-v4-flash-free
- **File**: `src/pages/Home.tsx:50`, `src/pages/MatchPage.tsx:60`
- **Issue**: `flex-grow` removed in Tailwind v4. Styles silently fail — inputs don't grow.
- **Fix**: Replace `flex-grow` with `grow`.
- **Status**: Not fixed

## Status Summary

| Issue | Status |
|-------|--------|
| C01: `any[]` in `PlayerAPIResponse.matches` | ❌ Not fixed |
| C02: Unsafe `as PlayerStats` assertion | ❌ Not fixed |
| C03: `Record<string, any>` in `fetchAPIData` params | ❌ Not fixed |
| C04: Index signatures `[key: string]: unknown` | ❌ Not fixed |
| C05: `batchFetch` `Promise.all` kills entire batch | ❌ Not fixed |
| C06: No request cancellation / AbortController | ❌ Not fixed |
| C07: `batchFetch` no abort signal propagation | ❌ Not fixed |
| C08: Stale data visible during loading | ❌ Not fixed |
| C09: Error and Loading display simultaneously | ❌ Not fixed |
| C10: Missing `lang="fi"` in HTML root element | ❌ Not fixed |
| C11: No font loading — Inter/JetBrains Mono never fetched | ❌ Not fixed |
| C12: Missing `--space-*` tokens in CSS | ❌ Not fixed |
| C13: Search inputs `focus:ring-0` removes focus indicator | ❌ Not fixed |
| C14: Missing `viewport-fit=cover` | ❌ Not fixed |
| C15: `PastMatchDetail` fields allow `undefined` | ❌ Not fixed |
| C16: `fetchAPIData` envelope not modeled | ❌ Not fixed |
| C17: `data?.players.filter()` crashes on null | ❌ Not fixed |
| C18: px-based font sizes prevent font scaling | ❌ Not fixed |
| C19: No `useEffect` cleanup on unmount | ❌ Not fixed |
| C20: `flex-grow` class removed in Tailwind v4 | ❌ Not fixed |
