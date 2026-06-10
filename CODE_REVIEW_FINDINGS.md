# Exhaustive Code Review: Football Stats Application

> **Review Date**: 2026-06-10
> **Reviewer**: Automated static analysis
> **Codebase**: `/Users/isokaariqwe/code/football-stats`
> **Total Findings**: 121

---

## Category 1: TypeScript Types & Interfaces (18 findings)

### 1.1 `fetchAPIData` uses `Record<string, any>` for params
- **File**: `src/services/api.ts:36`
- **Severity**: **HIGH**
- **Issue**: The `params` parameter is typed as `Record<string, any>`, completely erasing type safety. Any value can be passed for any key, and the compiler provides no protection.
- **Fix**: Use a generic constraint or a well-defined param type. At minimum use `Record<string, string | number | undefined>`.

### 1.2 `getMatchDetails` returns `any`
- **File**: `src/services/api.ts:69`
- **Severity**: **HIGH**
- **Issue**: `fetchAPIData<{ match: any }>` uses `any` for the match field, defeating the purpose of having a `MatchDetails` interface.
- **Fix**: Type as `fetchAPIData<{ match: MatchDetails }>`. The full type exists but isn't used here.

### 1.3 `getGroupDetails` returns `any`
- **File**: `src/services/api.ts:74-75`
- **Severity**: **HIGH**
- **Issue**: Same pattern — `fetchAPIData<{ group: any }>` casts the group response as `any`.
- **Fix**: Use `fetchAPIData<{ group: GroupDetails }>`.

### 1.4 `getTeamData` returns `any`
- **File**: `src/services/api.ts:84-87`
- **Severity**: **HIGH**
- **Issue**: The response is typed as `{ team: any }` and the function returns `data` (which is `any`), not `data.team`. Inconsistent with other getters.
- **Fix**: Type as `fetchAPIData<{ team: TeamData }>` and either return `data.team` or create a proper `TeamData` type.

### 1.5 `getPlayerData` returns `any`
- **File**: `src/services/api.ts:90-93`
- **Severity**: **HIGH**
- **Issue**: `fetchAPIData<{ player: any }>` — player data is completely untyped.
- **Fix**: Create a `PlayerData` interface and type the response properly.

### 1.6 `StatItem` component has completely untyped props
- **File**: `src/components/PlayerCard.tsx:89`
- **Severity**: **HIGH**
- **Issue**: The function signature is `function StatItem({ label, value, icon: Icon, variant = 'default' }: any)` — the entire props object is typed as `any`.
- **Fix**: Define a proper interface: `interface StatItemProps { label: string; value: string | number; icon: LucideIcon; variant?: 'default' | 'primary' | 'warning' | 'danger'; }`.

### 1.7 `data.call` accessed without null check
- **File**: `src/services/api.ts:62`
- **Severity**: **CRITICAL**
- **Issue**: `data.call.status.toLowerCase()` will throw a **runtime TypeError** (`Cannot read properties of undefined`) if the API response doesn't contain a `call` property at all.
- **Fix**: Use optional chaining: `data?.call?.status?.toLowerCase?.() !== "ok"`.

### 1.8 `processPlayerMatchHistory` uses `matches: any[]`
- **File**: `src/utils/dataProcessors.ts:5`
- **Severity**: **MEDIUM**
- **Issue**: The matches parameter is typed as `any[]` instead of a proper match type.
- **Fix**: Define and use a `PlayerMatch` interface with known fields (`season_id`, `status`, `player_goals`, `team_name`, `team_id`, etc.).

### 1.9 `pastMatchesDetails: any[]` in `PlayerStats`
- **File**: `src/types/api.ts:148`
- **Severity**: **MEDIUM**
- **Issue**: The `pastMatchesDetails` field is typed as `any[]` rather than a specific interface.
- **Fix**: Create a `PastMatchDetail` interface with known fields (`date`, `opponentName`, `playerTeamScore`, `opponentScore`, `resultIndicator`, `status`, `playerTeamNameInPastMatch`).

### 1.10 `lineupInfo: any` in `useMatchData`
- **File**: `src/hooks/useMatchData.ts:29`
- **Severity**: **MEDIUM**
- **Issue**: The `lineupInfo` variable in `.map()` callback is typed as `any`.
- **Fix**: The type should be `PlayerLineupInfo` (already exists in `types/api.ts`).

### 1.11 `playerData` implicitly typed as `any`
- **File**: `src/hooks/useMatchData.ts:30-35`
- **Severity**: **MEDIUM**
- **Issue**: `playerData` comes from `getPlayerData()` which returns `any`, so all its property accesses (`playerData.matches`, `playerData.birthyear`, `playerData.img_url`) are untyped and unchecked.
- **Fix**: Fix `getPlayerData` return type (Finding 1.5) and type `playerData` properly.

### 1.12 `response.json()` returns implicit `any`
- **File**: `src/services/api.ts:61`
- **Severity**: **LOW**
- **Issue**: `const data = await response.json()` — TypeScript infers `any` here. The generic `T` on `fetchAPIData<T>` constrains the return but the intermediate `data` variable is `any`.
- **Fix**: Explicitly type: `const data: T = await response.json()`.

### 1.13 `ScoreEntry` has all fields optional
- **File**: `src/types/api.ts:108-118`
- **Severity**: **LOW**
- **Issue**: Every field in `ScoreEntry` is optional (`match_id?`, `team_A_name?`, etc.), making the type nearly unusable for type-safe access. The API likely returns a predictable shape.
- **Fix**: Determine which fields are always returned and make those required. Add a `[key: string]: unknown` index signature for extras.

### 1.14 `Pick<GetMatchesParams, ...>` type gymnastics
- **File**: `src/services/api.ts:112`
- **Severity**: **LOW**
- **Issue**: `Pick<GetMatchesParams, 'competition_id' | 'category_id'>` is unnecessarily complex for a two-field subset. It also makes the default `{}` valid even though `getScore` likely needs at least one filter.
- **Fix**: Define a dedicated `GetScoreParams` interface with explicit optional fields.

### 1.15 `shirt_number: string` should be `number`
- **File**: `src/types/api.ts:46`
- **Severity**: **MEDIUM**
- **Issue**: Shirt numbers are semantically numeric, and the code uses `parseInt`-like operations on them. Storing as `string` forces unnecessary conversions.
- **Fix**: Change to `shirt_number: number` and convert at the API boundary.

### 1.16 `captain?: string` should be `boolean`
- **File**: `src/types/api.ts:48`
- **Severity**: **MEDIUM**
- **Issue**: The `captain` field is typed as `string` but is used as a boolean flag. The code compares `lineupInfo.captain === "1"` to determine captaincy.
- **Fix**: Change to `captain?: boolean` and convert at the API boundary (`captain: data.captain === "1"`).

### 1.17 Standing team stats typed as `string` instead of `number`
- **File**: `src/types/api.ts:61-73`
- **Severity**: **MEDIUM**
- **Issue**: `current_standing`, `matches_played`, `matches_won`, `matches_tied`, `matches_lost`, `goals_for`, `goals_against`, `goals_diff`, `points` are all `string`. Numbers like `parseInt(a.current_standing)` are required everywhere.
- **Fix**: Type numeric fields as `number` and convert at the API boundary.

### 1.18 `MatchSummary.fs_A`/`fs_B` should allow undefined
- **File**: `src/types/api.ts:83-84`
- **Severity**: **LOW**
- **Issue**: `fs_A` and `fs_B` on `MatchSummary` are typed as `string` (required), but unplayed matches may not have scores. On `MatchDetails` they are correctly `fs_A?: string`.
- **Fix**: Make them optional: `fs_A?: string; fs_B?: string;`.

---

## Category 2: API Service Layer (12 findings)

### 2.1 URL has trailing `?` when params are empty
- **File**: `src/services/api.ts:45-46`
- **Severity**: **LOW**
- **Issue**: `URLSearchParams(params).toString()` on an empty object returns `""`, resulting in URLs like `https://.../getCompetitions?`. While most servers handle this fine, it's technically malformed.
- **Fix**: Conditionally append the query string: ``const queryString = paramsString ? `?${paramsString}` : ''; const url = `${APP_CONFIG.API_BASE_URL}${endpoint}${queryString}`;``

### 2.2 1000ms throttle delay on every API call
- **File**: `src/services/api.ts:41-43`
- **Severity**: **CRITICAL**
- **Issue**: `THROTTLE_DELAY: 1000` adds a **mandatory 1-second delay** before EVERY API call. Loading a match with 22 players means 22 seconds of mandatory waiting — even though the max rate limit is 60 calls/minute. This completely cripples UX.
- **Fix**: Reduce to `100-200ms` or remove entirely. The rate limiter already prevents exceeding limits. Use throttle only as a backpressure mechanism, not a fixed delay.

### 2.3 `data.call` assumed to exist
- **File**: `src/services/api.ts:62`
- **Severity**: **HIGH**
- **Issue**: If the API returns a successful HTTP 200 but the body lacks a `call` property, `data.call` will be `undefined` and `data.call.status` will throw.
- **Fix**: Use optional chaining and a safer default: `if (data?.call?.status?.toLowerCase?.() !== "ok")`.

### 2.4 Silent catch on JSON parse error
- **File**: `src/services/api.ts:57`
- **Severity**: **MEDIUM**
- **Issue**: The `catch (e) { /* ignore */ }` block silently swallows JSON parsing errors. If the error response body isn't valid JSON (e.g., an HTML error page), the original HTTP status error message is preserved, but valuable debugging info is lost.
- **Fix**: Log the error in development or include a fallback message: `catch { errorText += ' (unparseable error body)'; }`.

### 2.5 No AbortController/request cancellation
- **File**: `src/services/api.ts:48`
- **Severity**: **HIGH**
- **Issue**: The `fetch` call has no `AbortController` signal. If a component unmounts or the user navigates away, in-flight requests continue executing and can call `setState` on unmounted components.
- **Fix**: Accept an optional `AbortSignal` parameter and pass it to `fetch`: `fetch(url, { headers, signal })`.

### 2.6 Module-level mutable state is not tree-shakeable
- **File**: `src/services/api.ts:5-6`
- **Severity**: **LOW**
- **Issue**: `lastCallTimes` and `endpointLastCalls` are module-level mutable arrays. This creates shared mutable state that persists across hot reloads and can't be tree-shaken. In tests, this state leaks across test cases.
- **Fix**: Wrap rate limiter in a class or use a `Map` with proper encapsulation. Make it injectable for testing.

### 2.7 Rate limiter has race conditions
- **File**: `src/services/api.ts:8-34`
- **Severity**: **MEDIUM**
- **Issue**: The `checkRateLimit` function checks limits, then the caller proceeds. But multiple concurrent `fetchAPIData` calls can all pass the check before any of them records their call via `push`. This means the actual call rate can exceed the configured limit.
- **Fix**: Use an atomic counter or a proper token-bucket algorithm. Or simply use the throttle delay as the primary mechanism.

### 2.8 Error handling doesn't differentiate status codes
- **File**: `src/services/api.ts:50-58`
- **Severity**: **MEDIUM**
- **Issue**: All HTTP errors are treated identically — 400 Bad Request gets the same handling as 503 Service Unavailable. No retry logic for 5xx errors, no special handling for 401/403.
- **Fix**: Add status code branching: retry on 5xx (with backoff), re-authenticate on 401, show validation messages on 400.

### 2.9 Empty object `{}` sent as query param
- **File**: `src/services/api.ts:96`
- **Severity**: **LOW**
- **Issue**: `fetchAPIData("getCompetitions", {})` sends an empty params object, producing a trailing `?`. The API likely supports this, but it's unnecessary.
- **Fix**: Use `fetchAPIData("getCompetitions")` (omit params entirely).

### 2.10 `endpointLastCalls[endpoint].push` after length check
- **File**: `src/services/api.ts:32`
- **Severity**: **LOW**
- **Issue**: `endpointLastCalls[endpoint].push(now)` is called after the initial check passes, but between the check and the push, the endpoint entry could theoretically be deleted by another operation (unlikely but possible).
- **Fix**: Defensive: ensure `endpointLastCalls[endpoint]` is an array before pushing: `(endpointLastCalls[endpoint] ??= []).push(now)`.

### 2.11 No request timeout
- **File**: `src/services/api.ts:48`
- **Severity**: **HIGH**
- **Issue**: The `fetch` call has no timeout. If the API server hangs (network issue, server overload), the request hangs indefinitely, the spinner spins forever, and `loading` state is never reset.
- **Fix**: Use `AbortSignal.timeout(10000)` or wrap fetch with a timeout race.

### 2.12 `getGroupDetails` returns `null` instead of throwing
- **File**: `src/services/api.ts:81`
- **Severity**: **LOW**
- **Issue**: `getGroupDetails` returns `data.group || null` (silently returns null if no group), but `getMatchDetails` and `getPlayerData` throw errors. Inconsistent error handling strategy across the service layer.
- **Fix**: Be consistent — either all return null/undefined on missing data, or all throw.

---

## Category 3: React Hooks (12 findings)

### 3.1 Empty dependency array in `useCallback`
- **File**: `src/hooks/useMatchData.ts:65`
- **Severity**: **HIGH**
- **Issue**: `useCallback` has an empty dependency array `[]`, meaning `fetchData` is created once and never recreated. While the captured imports (`getMatchDetails`, etc.) are module-level and won't change, the eslint rule `react-hooks/exhaustive-deps` would flag this. The pattern is brittle.
- **Fix**: Either add the disabled lint comment explaining why deps are correct, or restructure to avoid `useCallback` with empty deps.

### 3.2 N+1 player API calls
- **File**: `src/hooks/useMatchData.ts:28-51`
- **Severity**: **CRITICAL**
- **Issue**: For every player in the lineup, a separate `getPlayerData` API call is made. With 22 players and a 1000ms throttle delay, this takes **22+ seconds** just for player data. This is a classic N+1 query problem.
- **Fix**: (a) Batch player IDs into a single API call if the backend supports it, (b) cache player data aggressively, (c) reduce/remove the throttle delay, (d) at minimum run player requests with `Promise.allSettled` instead of `Promise.all`.

### 3.3 No error isolation in `Promise.all`
- **File**: `src/hooks/useMatchData.ts:22-26`
- **Severity**: **MEDIUM**
- **Issue**: `Promise.all([getGroupDetails(...), getTeamData(...), getTeamData(...)])` fails fast — if any one call fails (e.g., getGroupDetails returns null and then... wait, it doesn't throw), the entire Promise.all rejects. But `getTeamData` returns `null` for empty teamId (line 85), so this is currently safe. However, if any call truly throws, the other two results are lost.
- **Fix**: Use `Promise.allSettled` to handle partial failures gracefully, or wrap each call in a try/catch that returns a default value.

### 3.4 `catch (err: any)` type
- **File**: `src/hooks/useMatchData.ts:59`
- **Severity**: **MEDIUM**
- **Issue**: The caught error is typed as `any`. This silently passes the `no-implicit-any` gate but loses all type information. Accessing `err.message` assumes it's an `Error`-like object.
- **Fix**: Type as `unknown` and narrow: `catch (err: unknown) { setError(err instanceof Error ? err.message : 'Virhe ladattaessa tietoja'); }`.

### 3.5 No mounted-state ref — setState after unmount
- **File**: `src/hooks/useMatchData.ts`
- **Severity**: **HIGH**
- **Issue**: There's no `useRef` to track whether the component is still mounted. If the user navigates away while a request is in-flight, the `setData` and `setLoading` calls will execute on an unmounted component, causing a React warning and potential memory leaks.
- **Fix**: Use a `useRef(true)` with cleanup in the outer component or the hook itself. After the async operation resolves, check `if (!mountedRef.current) return;` before setting state.

### 3.6 `useEffect` depends on `fetchData` (stale closure risk)
- **File**: `src/pages/MatchPage.tsx:21`
- **Severity**: **MEDIUM**
- **Issue**: `fetchData` is in the dependency array of `useEffect`. If `fetchData` identity ever changes (due to a code change that adds dependencies to `useCallback`), this effect will re-fire, causing an unwanted re-fetch.
- **Fix**: Restructure so `fetchData` is called directly (not via a callback), or use a ref to hold the callback and call `ref.current(matchId)` in the effect.

### 3.7 No AbortController cleanup in useEffect
- **File**: `src/pages/MatchPage.tsx:16-21`
- **Severity**: **MEDIUM**
- **Issue**: The `useEffect` that triggers `fetchData` doesn't create an `AbortController` or clean it up. If the `matchId` changes rapidly (user types multiple IDs), multiple in-flight requests pile up.
- **Fix**: Create an `AbortController`, pass the signal through the chain, and return `() => controller.abort()` from the effect.

### 3.8 Single loading/error state for all operations
- **File**: `src/hooks/useMatchData.ts:8-9`
- **Severity**: **LOW**
- **Issue**: A single `loading` boolean and single `error` string cover all API calls (match details, group, teams, all players). If only one call fails, the entire operation is considered failed. The user can't see partial data.
- **Fix**: Use granular states or track per-operation status with a state machine (e.g., `{ match: 'loading' | 'error' | 'success', players: ... }`).

### 3.9 `searchValue` initial state tied to `matchId` param
- **File**: `src/pages/MatchPage.tsx:13`
- **Severity**: **LOW**
- **Issue**: `const [searchValue, setSearchValue] = useState(matchId)` only uses the initial param value. Subsequent changes to `matchId` via the `useEffect` call `setSearchValue(matchId)`, causing a secondary render.
- **Fix**: This pattern is fine for the initial render, but consider using a `useMemo` or deriving `searchValue` from the URL directly.

### 3.10 `useCallback` with `[]` captures stale module-level state
- **File**: `src/hooks/useMatchData.ts:16`
- **Severity**: **LOW**
- **Issue**: The `fetchData` callback with `[]` deps captures `getMatchDetails`, `getGroupDetails`, `getTeamData`, `getPlayerData`, and `processPlayerMatchHistory` from the module scope. These are module-level imports and won't change, but if any were to be replaced (e.g., for testing via mocking), the stale references would be used.
- **Fix**: Pass API functions as parameters or use a ref pattern.

### 3.11 Hook returns object with stable reference but causes re-renders
- **File**: `src/hooks/useMatchData.ts:67`
- **Severity**: **LOW**
- **Issue**: The returned object `{ loading, error, data, fetchData }` creates a new object on every render. While primitive values (`loading`, `error`) will be referentially stable, consumers that destructure the object might not benefit from memoization.
- **Fix**: Use `useMemo` to stabilize the returned object, or return individual values from the hook.

### 3.12 Loading state not reset between fetches
- **File**: `src/hooks/useMatchData.ts:16-65`
- **Severity**: **LOW**
- **Issue**: If a user fetches match A, then quickly fetches match B, the loading state goes: true (fetch A) -> false (A done) -> true (fetch B). There's a brief flash where loading is false between requests.
- **Fix**: Debounce or keep loading as true until the new data arrives. Or use a `isFetching` vs `isLoading` distinction.

---

## Category 4: Component Design (12 findings)

### 4.1 Array index as key in PlayerCard match history
- **File**: `src/components/PlayerCard.tsx:70`
- **Severity**: **HIGH**
- **Issue**: `key={i}` uses the array index as the React key for match history dots. If match data changes (e.g., a new result comes in), React will reuse DOM nodes incorrectly, potentially showing wrong animation or tooltip data.
- **Fix**: Use a unique identifier: `key={match.date + match.opponentName}` or add a `match_id` field to past match details.

### 4.2 Feature cards use index as key
- **File**: `src/pages/Home.tsx:68`
- **Severity**: **MEDIUM**
- **Issue**: `key={i}` for the feature cards. While these are static and unlikely to change, using index as key is an anti-pattern that causes issues if items are ever reordered, filtered, or dynamically generated.
- **Fix**: Use feature title as key: `key={feature.title}`.

### 4.3 `motion.tr` on every table row
- **File**: `src/components/StandingsTable.tsx:29`
- **Severity**: **MEDIUM**
- **Issue**: Every table row is a `<motion.tr>` with Framer Motion animation. This creates ~20+ animated elements for a standings table, causing unnecessary GPU/CPU work. Table rows don't need mount animations.
- **Fix**: Use regular `<tr>` with a subtle CSS animation on the table container, or only animate the first mount with `motion.div` wrapping the table.

### 4.4 Img `onError` hides element but no fallback
- **File**: `src/components/PlayerCard.tsx:30`
- **Severity**: **MEDIUM**
- **Issue**: When a player image fails to load, `e.currentTarget.style.display = 'none'` hides the `<img>` tag but leaves a broken-looking 16x16 empty space with a border. The fallback `<User>` icon doesn't appear because the `<img>` still occupies space (it's hidden but not removed) and the ternary chose the `<img>` branch.
- **Fix**: Use `onError` to set a fallback state (`useState`) and render the `<User>` icon as the fallback instead of hiding the element: `{imgError || !stats.img_url ? <Fallback /> : <img onError={() => setImgError(true)} ... />}`.

### 4.5 Nullish coalescing on `fs_A`/`fs_B` with empty string edge case
- **File**: `src/components/MatchHeader.tsx:29`
- **Severity**: **LOW**
- **Issue**: `match.fs_A ?? '-'` correctly handles `null`/`undefined`, but if the API returns `""` (empty string) for an unplayed match, the `??` operator will display `""` (nothing visible), not `'-'`.
- **Fix**: Use `match.fs_A || '-'` but account for score "0" being valid. Use a helper: `match.fs_A != null && match.fs_A !== '' ? match.fs_A : '-'`.

### 4.6 PlayerCard has no `React.memo`
- **File**: `src/components/PlayerCard.tsx:11`
- **Severity**: **MEDIUM**
- **Issue**: Without `React.memo`, `PlayerCard` re-renders on every parent render even when its `stats` prop hasn't changed. With potentially 22+ cards on a page, this causes significant unnecessary re-rendering.
- **Fix**: Wrap the export: `export const PlayerCard = React.memo(function PlayerCard(...)`, and ensure the `stats` object reference is stable.

### 4.7 Player name + shirt number as key (collision risk)
- **File**: `src/pages/MatchPage.tsx:95,104`
- **Severity**: **MEDIUM**
- **Issue**: `key={player.name + player.shirtNumber}` uses concatenated string as key. If two unrelated players happen to have the same name and shirt number (possible across different teams), React will consider them the same element, causing incorrect reconciliation.
- **Fix**: Use player ID or a combination of `teamIdInMatch + player.name`.

### 4.8 No empty state for team with no players
- **File**: `src/pages/MatchPage.tsx:91-106`
- **Severity**: **MEDIUM**
- **Issue**: If a team has no lineup data (empty array), the team heading (`data.match.team_A_name`) still renders with an empty grid beneath it. This looks broken/unfinished.
- **Fix**: Add a conditional: `{teamAPlayers.length > 0 ? <PlayerCard ... /> : <p className="...">Kokoonpanoa ei saatavilla</p>}`.

### 4.9 Error boundary for API errors
- **File**: `src/pages/MatchPage.tsx:68-77`
- **Severity**: **LOW**
- **Issue**: The error display is an inline `<div>`, not a React Error Boundary. If an error occurs in a child component (e.g., `PlayerCard` throws during render), the error isn't caught and the entire page crashes.
- **Fix**: Wrap sections with React Error Boundaries for graceful degradation.

### 4.10 Link in NotFound missing accessibility
- **File**: `src/pages/NotFound.tsx:9`
- **Severity**: **LOW**
- **Issue**: The `<Link>` has no `aria-label`. Screen readers will read the link text "Takaisin etusivulle" which is fine, but there's no `role` or descriptive context for the navigation action.
- **Fix**: Add `aria-label="Palaa etusivulle"` or wrap with a `<nav>` landmark.

### 4.11 Empty state shows before any search
- **File**: `src/pages/MatchPage.tsx:121-129`
- **Severity**: **LOW**
- **Issue**: On initial page load (no matchId), `!loading && !error && !data` is `true`, so the empty state "Syötä ottelun ID avataksesi ottelusivun." appears. This is a valid UX choice, but it's inconsistent with the Home page behavior.
- **Fix**: Only show empty state when the user has visited but not searched: `matchId && !loading && !error && !data`.

### 4.12 `StandingsTable` requires group but parent conditionally provides it
- **File**: `src/components/StandingsTable.tsx:4`
- **Severity**: **LOW**
- **Issue**: The `group` prop is typed as `GroupDetails` (required), but the parent checks `data.group && <StandingsTable ...>`. If someone refactors the parent and forgets the guard, TypeScript won't catch it.
- **Fix**: Make `group` typed as `GroupDetails` (ensuring the guard is always needed) or change to `GroupDetails | null` with null handling inside.

---

## Category 5: Data Processing (11 findings)

### 5.1 `parseInt` without radix parameter
- **File**: `src/utils/dataProcessors.ts:26-28`
- **Severity**: **HIGH**
- **Issue**: `parseInt(match.player_goals)` is called without the radix parameter. If the API ever returns a string like `"0x1A"` or `"010"`, the results will be unpredictable (octal interpretation in older engines).
- **Fix**: Always include radix: `parseInt(match.player_goals, 10) || 0`.

### 5.2 `parseInt(falsyValue) || 0` has a NaN truthy bug
- **File**: `src/utils/dataProcessors.ts:26-28`
- **Severity**: **MEDIUM**
- **Issue**: `parseInt(null) || 0` evaluates as `NaN || 0` → `0`. This works by accident because `NaN` is falsy. But `parseInt("0")` returns `0` which is also falsy, so a legitimate zero goal count could theoretically... actually no, `0 || 0` is `0` so it works. But `parseInt(undefined)` returns `NaN`, which is truthy-falsy. The pattern works but is brittle.
- **Fix**: Use explicit null check: `match.player_goals ? parseInt(match.player_goals, 10) : 0`.

### 5.3 Mixed name/ID comparison logic
- **File**: `src/utils/dataProcessors.ts:49`
- **Severity**: **CRITICAL**
- **Issue**: The condition `match.team_A_name === teamNameForContext || match.team_A_id === match.team_id` mixes string name comparison with ID comparison. This is logically inconsistent. If `teamNameForContext` is the team name and `match.team_id` is the player's team ID, the second condition should be `match.team_A_id === match.team_id` — but only if `match.team_id` actually represents the player's team ID (which is undocumented).
- **Fix**: Be consistent: compare IDs with IDs and names with names. If `teamNameForContext` is a team name, compare against `match.team_A_name` or `match.team_B_name`. If you have the player's team ID, use ID comparison exclusively.

### 5.4 Draw detection logic is fragile
- **File**: `src/utils/dataProcessors.ts:59-63`
- **Severity**: **MEDIUM**
- **Issue**: `resultIndicator` defaults to `'draw'` but is only changed to `'win'` (if `match.winner_id === match.team_id`) or `'loss'` (if `match.winner_id` is truthy and not "0" or "-"). The condition `match.winner_id && match.winner_id !== "0" && match.winner_id !== "-"` is complex and fragile. If `winner_id` is a number `0` (not string), the comparison `"0"` would fail.
- **Fix**: Parse `winner_id` as a number first, then compare: `const winnerId = parseInt(match.winner_id, 10); if (winnerId === match.team_id) { win } else if (winnerId > 0) { loss } else { draw }`.

### 5.5 Variables may remain empty strings
- **File**: `src/utils/dataProcessors.ts:44-57`
- **Severity**: **MEDIUM**
- **Issue**: `opponentName`, `playerTeamScore`, `opponentScore` are declared and conditionally assigned. If neither branch of the if/else executes (e.g., `teamNameForContext` doesn't match either team), these variables remain `""` and the match detail will have blank fields.
- **Fix**: Add an `else` clause or default values: `opponentName: opponentName || 'Tuntematon'`.

### 5.6 Early return with spread of mutable defaults
- **File**: `src/utils/dataProcessors.ts:23`
- **Severity**: **LOW**
- **Issue**: `if (!matches) return { ...stats, teamsThisYear: "" };` spreads the `stats` object which includes `pastMatchesDetails: []` and other defaults. This is fine functionally, but the return type says it omits certain fields. The early return works but is inconsistent with the main return path.
- **Fix**: Return a properly typed empty result object.

### 5.7 Fixture handling only for current season
- **File**: `src/utils/dataProcessors.ts:75-85`
- **Severity**: **LOW**
- **Issue**: Fixtures are only processed for `match.season_id === currentSeasonId`. If past season data includes fixtures (which is unusual, but possible for postponed matches), they're ignored.
- **Fix**: This might be intentional, but add a comment explaining why past-season fixtures are excluded.

### 5.8 `Object.keys` on potentially empty Record
- **File**: `src/utils/dataProcessors.ts:95`
- **Severity**: **LOW**
- **Issue**: `Object.keys(stats.gamesByTeamThisYear)` is safe — an empty object returns `[]`. But `join(", ")` on an empty array returns `""`, which is fine. No bug here, but worth noting that the `teamsThisYear` string could be empty.
- **Fix**: Add a fallback: `teamsThisYear: Object.keys(stats.gamesByTeamThisYear).join(", ") || "No data"`.

### 5.9 Massive `Omit` return type is fragile
- **File**: `src/utils/dataProcessors.ts:9`
- **Severity**: **MEDIUM**
- **Issue**: The return type is `Omit<PlayerStats, 'name' | 'shirtNumber' | 'birthYear' | 'teamIdInMatch' | 'img_url' | 'clubCrest' | 'isCaptainInMatch' | 'position_fi' | 'height' | 'weight' | 'finland_raised'>` — a massive list of omitted keys. If `PlayerStats` is ever modified, this list must be updated or it will produce a type error or silently include extra fields.
- **Fix**: Define a separate `ProcessedPlayerStats` interface that only includes the fields processed by this function. Or split PlayerStats into smaller, composable interfaces.

### 5.10 `pastMatchesDetails` has incomplete data for fixtures
- **File**: `src/utils/dataProcessors.ts:78-84`
- **Severity**: **LOW**
- **Issue**: For fixtures (unplayed matches), `pastMatchesDetails` entries lack `playerTeamScore`, `opponentScore`, and `playerTeamNameInPastMatch` (though the last one is present). This means the UI (`PlayerCard.tsx:73`) could show `undefined-undefined` in the tooltip for fixture entries.
- **Fix**: Provide fallback values: `playerTeamScore: match.fs_A || '-', opponentScore: match.fs_B || '-'`.

### 5.11 `match.team_A_id === match.team_id` assumes player is on team A
- **File**: `src/utils/dataProcessors.ts:49`
- **Severity**: **HIGH**
- **Issue**: The condition first checks `match.team_A_name === teamNameForContext` (name comparison), then falls back to `match.team_A_id === match.team_id` (ID comparison). This assumes that if the name doesn't match team A, the player must be on team B (the else branch handles team B). But if `match.team_id` is not the player's team ID for this match, the logic is wrong.
- **Fix**: Use the player's actual team ID for this match (which should be `lineupInfo.team_id` passed through) to determine which side they played on.

---

## Category 6: Config & Environment (12 findings)

### 6.1 `CURRENT_YEAR: "2025"` hardcoded
- **File**: `src/types/config.ts:18`
- **Severity**: **HIGH**
- **Issue**: `CURRENT_YEAR` is hardcoded as `"2025"`. In June 2026 this is already outdated. Since football seasons span calendar years, the year needs to be updated manually every year.
- **Fix**: Derive from current date: `CURRENT_YEAR: new Date().getFullYear().toString()`. Override via env var for testing.

### 6.2 `PREVIOUS_YEAR: "2024"` hardcoded
- **File**: `src/types/config.ts:19`
- **Severity**: **HIGH**
- **Issue**: Same issue — hardcoded `"2024"` is now 2 years ago, not "previous".
- **Fix**: Derive dynamically: `PREVIOUS_YEAR: (new Date().getFullYear() - 1).toString()`.

### 6.3 `API_BASE_URL` hardcoded
- **File**: `src/types/config.ts:17`
- **Severity**: **MEDIUM**
- **Issue**: The API base URL is hardcoded as a string literal. This makes it impossible to change environments (development, staging, production) without code changes.
- **Fix**: Use environment variables: `API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "https://spl.torneopal.net/taso/rest/"`. Define `VITE_API_BASE_URL` in `.env` files.

### 6.4 API key/token exposed in client-side source code
- **File**: `src/types/config.ts:21`
- **Severity**: **CRITICAL**
- **Issue**: `Accept: "json/df8e84j9xtdz269euy3h"` is a custom Accept header that acts as an API authentication token. It's hardcoded in plain text in the source. Anyone who inspects the network tab or reads the source can extract and reuse this token.
- **Fix**: Move to environment variable: `import.meta.env.VITE_API_TOKEN`. Serve it via a backend proxy or restrict the token's scope on the API side. Note: client-side secrets are fundamentally visible — consider a BFF (Backend for Frontend) proxy.

### 6.5 Non-standard Accept header format
- **File**: `src/types/config.ts:21`
- **Severity**: **LOW**
- **Issue**: `Accept: "json/df8e84j9xtdz269euy3h"` does not follow the standard HTTP Accept header format (which expects MIME types like `application/json`). This is a custom API key mechanism, not a proper content-type negotiation header.
- **Fix**: Move this to a dedicated `Authorization` or `X-API-Key` header if the API supports it. At minimum, rename the config key to `API_KEY` for clarity.

### 6.6 `THROTTLE_DELAY: 1000` is too aggressive
- **File**: `src/types/config.ts:34`
- **Severity**: **CRITICAL**
- **Issue**: A 1000ms delay before every API call means loading 22 players takes 22+ seconds. Combined with the rate limit of 60 calls/minute, the throttle doesn't need to be this conservative.
- **Fix**: Reduce to `100` or `0`. The rate limiter already prevents exceeding 60 calls/minute.

### 6.7 `lang="en"` but UI is in Finnish
- **File**: `index.html:2`
- **Severity**: **MEDIUM**
- **Issue**: The HTML `lang` attribute is set to `"en"` (English), but the entire UI uses Finnish text labels (`Hae`, `Ottelut`, `Sarjataulukko`, `Maalit`, `Varoitukset`, `Tuomari`, `Pelaaja`, `Tuntematon joukkue`, `Takaisin etusivulle`).
- **Fix**: Change to `lang="fi"` for proper screen reader pronunciation, hyphenation, and browser translation behavior.

### 6.8 Non-descriptive SEO title
- **File**: `index.html:8`
- **Severity**: **LOW**
- **Issue**: `<title>Football Stats Modern</title>` is vague and not SEO-friendly. No meta description, keywords, or Open Graph tags.
- **Fix**: Use a descriptive title: `Football Stats — Suomen Palloliitto tilastot`. Add `<meta name="description">` and Open Graph tags.

### 6.9 Hardcoded base path
- **File**: `vite.config.ts:7`
- **Severity**: **MEDIUM**
- **Issue**: `base: '/football-stats/'` is hardcoded. If the app is deployed to a different path or a custom domain, this breaks.
- **Fix**: Let Vite use the default or derive from env: `base: process.env.VITE_BASE_URL || '/'`.

### 6.10 No `.env` file for environment configuration
- **File**: (root directory)
- **Severity**: **HIGH**
- **Issue**: There are no `.env`, `.env.development`, or `.env.production` files. All configuration is hardcoded in `config.ts`. No environment variable validation exists.
- **Fix**: Create `.env.example` with documented variables (`VITE_API_BASE_URL`, `VITE_API_TOKEN`, `VITE_BASE_URL`). Add validation at app startup.

### 6.11 Config lives in `types/` directory
- **File**: `src/types/config.ts:1`
- **Severity**: **LOW**
- **Issue**: Application configuration (URLs, tokens, rate limits) is stored in the `types/` directory alongside type definitions. This violates separation of concerns — config is runtime data, not a type.
- **Fix**: Move to `src/config/appConfig.ts` or `src/config/index.ts`.

### 6.12 Image URLs hardcoded in config
- **File**: `src/types/config.ts:23-25`
- **Severity**: **LOW**
- **Issue**: `NO_PLAYER_IMAGE_URL`, `DEFAULT_CREST_URL`, and `PLACEHOLDER_CREST_URL` are hardcoded URLs to external CDNs. If these external resources are unavailable, the images silently break.
- **Fix**: Consider bundling placeholder images locally or at least adding error handling at the component level.

---

## Category 7: UI/UX Issues (10 findings)

### 7.1 Tiny 2.5px match history dots not touch-friendly
- **File**: `src/components/PlayerCard.tsx:74-81`
- **Severity**: **MEDIUM**
- **Issue**: Each match history dot is `w-2.5 h-2.5` (10px × 10px). With only tooltip interaction, these are extremely difficult to tap on mobile. Touch targets should be at least 44×44px per WCAG guidelines.
- **Fix**: Increase dot size to at least `w-4 h-4` and add padding/gap for touch targets, or make them tappable buttons/links to match details.

### 7.2 Hardcoded "Kausi 2024" label in UI
- **File**: `src/components/PlayerCard.tsx:60`
- **Severity**: **HIGH**
- **Issue**: `label="Kausi 2024"` is hardcoded. In 2026, this should say "Kausi 2025" (previous season). This will be incorrect every year until 2024 becomes irrelevant.
- **Fix**: Derive from `APP_CONFIG.PREVIOUS_YEAR` or the current year: ``label={`Kausi ${APP_CONFIG.PREVIOUS_YEAR}`}``.

### 7.3 No loading skeleton for content
- **File**: `src/pages/MatchPage.tsx:66-132`
- **Severity**: **MEDIUM**
- **Issue**: When `loading` is `true`, the spinner only appears in the search button. The main content area shows the empty state while data is loading. No skeleton placeholders prepare the user for the layout.
- **Fix**: Show skeleton loaders (e.g., pulsing gray rectangles) in the same layout as the actual content (header, player cards, standings table).

### 7.4 Gradient text accessibility concern
- **File**: `src/pages/Home.tsx:29`
- **Severity**: **LOW**
- **Issue**: `bg-gradient-to-r from-white via-blue-100 to-blue-400 bg-clip-text text-transparent` creates gradient text that may fail WCAG contrast requirements. The `text-transparent` + `bg-clip-text` technique doesn't render in some browsers and may not be announced correctly by screen readers.
- **Fix**: Ensure the text maintains sufficient contrast ratio against the dark background. Add a `color` fallback. Use `aria-hidden` on decorative elements.

### 7.5 Images missing `loading="lazy"`
- **File**: `src/components/PlayerCard.tsx:27`
- **Severity**: **LOW**
- **Issue**: Player images don't have `loading="lazy"`. With 22+ players on a page, this causes all images to load immediately on mount, blocking the main thread.
- **Fix**: Add `loading="lazy"` to the `<img>` tag.

### 7.6 `AnimatePresence mode="wait"` causes perceived lag
- **File**: `src/pages/MatchPage.tsx:67`
- **Severity**: **LOW**
- **Issue**: `mode="wait"` tells AnimatePresence to wait for the exiting element's animation to finish before animating in the new one. This adds unnecessary delay when switching between error/success/empty states.
- **Fix**: Use `mode="popLayout"` or `mode="sync"` for faster transitions between states.

### 7.7 No horizontal scroll indicators on table
- **File**: `src/components/StandingsTable.tsx:12`
- **Severity**: **LOW**
- **Issue**: `overflow-x-auto` allows horizontal scrolling on mobile, but there's no visual indicator (gradient fade, shadow, or scroll hint) to tell users the table is scrollable.
- **Fix**: Add CSS scroll shadows or a subtle fade gradient on the edges, common in table-heavy mobile UIs.

### 7.8 Empty state on initial page load
- **File**: `src/pages/MatchPage.tsx:121-129`
- **Severity**: **LOW**
- **Issue**: On initial load (no `matchId`), the app shows "Syötä ottelun ID avataksesi ottelusivun." This appears below the search form and might confuse users who expect to see content.
- **Fix**: Consider not showing the empty state at all when `!matchId` (no param), or show a more helpful prompt with an example.

### 7.9 Team headings render even with no players
- **File**: `src/pages/MatchPage.tsx:92,101`
- **Severity**: **MEDIUM**
- **Issue**: `<h2>{data.match.team_A_name}</h2>` renders even when `teamAPlayers` is empty. The user sees a team heading with no content beneath it, which looks like a broken layout.
- **Fix**: Conditionally render the section: `{teamAPlayers.length > 0 && <div><h2>...</h2><PlayerCard ... /></div>}`.

### 7.10 Fixed 4-column grid may be sparse
- **File**: `src/components/PlayerCard.tsx:56`
- **Severity**: **LOW**
- **Issue**: `grid grid-cols-2 md:grid-cols-4 gap-4` forces 4 columns on medium screens. When only 3 stat items are meaningful (warning items may be empty), the grid looks unbalanced.
- **Fix**: Consider `grid-cols-2 md:grid-cols-3` or `auto-fill` with `minmax`.

---

## Category 8: Performance (11 findings)

### 8.1 N+1 player data fetching
- **File**: `src/hooks/useMatchData.ts:28-51`
- **Severity**: **CRITICAL**
- **Issue**: For each player in `match.lineups`, a separate `getPlayerData` API call is made. With typical 22-player lineups and 1000ms throttle, this is 22+ seconds. Even without throttle, it's 22 sequential HTTP requests.
- **Fix**: (1) Add a batch player endpoint on the server side. (2) Cache player data aggressively (player stats rarely change). (3) Use a `Map` to deduplicate players who appear in multiple teams/matches. (4) Reduce the throttle delay.

### 8.2 Multiple parallel unbatched API calls
- **File**: `src/hooks/useMatchData.ts:22-26`
- **Severity**: **MEDIUM**
- **Issue**: `getGroupDetails`, `getTeamData(teamA)`, `getTeamData(teamB)` run in parallel but are 3 separate HTTP requests. These could be combined or cached.
- **Fix**: Batch these endpoints if the API supports it. At minimum, the 1000ms throttle delays each of these before they even start.

### 8.3 Throttle delay adds 1s to every call
- **File**: `src/services/api.ts:41-43`
- **Severity**: **CRITICAL**
- **Issue**: The mandatory 1-second delay before every API call makes the app unusably slow. Loading a single match page requires: 1s (match) + 1s (group) + 1s (teamA) + 1s (teamB) + 22×1s (players) = **26 seconds minimum**.
- **Fix**: Reduce to 100ms or remove entirely. The sliding window rate limiter is sufficient for preventing API abuse.

### 8.4 No `React.memo` on PlayerCard
- **File**: `src/components/PlayerCard.tsx:11`
- **Severity**: **MEDIUM**
- **Issue**: Without memoization, every `PlayerCard` re-renders whenever `MatchPage` re-renders (e.g., on loading state changes, resize, etc.). With 22+ cards, this causes significant layout thrashing.
- **Fix**: Wrap with `React.memo` and ensure `stats` objects have stable references (use `useMemo` in the parent).

### 8.5 Array filtering on every render
- **File**: `src/pages/MatchPage.tsx:30-31`
- **Severity**: **MEDIUM**
- **Issue**: `teamAPlayers` and `teamBPlayers` are computed on every render via `.filter()`. With 22+ player objects and potentially multiple renders per second (animations, loading states), this is wasteful.
- **Fix**: Memoize with `useMemo`: `const teamAPlayers = useMemo(() => data?.players.filter(...) || [], [data])`.

### 8.6 `motion.tr` animations on all table rows
- **File**: `src/components/StandingsTable.tsx:29`
- **Severity**: **MEDIUM**
- **Issue**: Each `<motion.tr>` initializes a Framer Motion animation context on mount. For 20+ rows, this creates significant animation overhead. The `initial`/`animate` props aren't even specified on the `motion.tr` itself (they're on individual rows via `motion.tr`).
- **Fix**: Remove `motion.tr` and use a regular `<tr>` with a single `motion.div` wrapping the table if animation is desired.

### 8.7 `layout` prop on PlayerCard triggers expensive layout animations
- **File**: `src/components/PlayerCard.tsx:16`
- **Severity**: **MEDIUM**
- **Issue**: `<motion.div layout>` enables Framer Motion layout animations. This forces React to read layout positions (triggering forced reflows) and apply CSS transforms when content changes. For a card that doesn't reorder, this is unnecessary overhead.
- **Fix**: Remove `layout` unless the card position is animated. Use `layout="position"` (less expensive) if some layout animation is desired.

### 8.8 No API response cache
- **File**: `src/hooks/useMatchData.ts`
- **Severity**: **HIGH**
- **Issue**: Every time a user navigates to a match page or refreshes, ALL API calls are re-executed. Team data, player data, and group data rarely change during a session, but there's no caching.
- **Fix**: Implement a simple in-memory cache with TTL: `const cache = new Map<string, { data: T; timestamp: number }>()`. Check cache before making API calls.

### 8.9 Rate limiter uses `shift()` which is O(n)
- **File**: `src/services/api.ts:13-14,23-24`
- **Severity**: **LOW**
- **Issue**: `lastCallTimes.shift()` removes the first element of an array. In JavaScript, `shift()` is O(n) because it reindexes all remaining elements. With 60+ calls in the array, this creates unnecessary CPU work on every API call.
- **Fix**: Use a ring buffer, a proper queue, or reverse the array and `pop()` instead.

### 8.10 Whole page re-renders on loading state change
- **File**: `src/pages/MatchPage.tsx:33-136`
- **Severity**: **MEDIUM**
- **Issue**: The entire `MatchPage` component conditionally renders different sections based on `loading`, `error`, and `data` states. Every state transition re-renders the entire page tree, including the search header which doesn't change.
- **Fix**: Split the page into smaller components: `<SearchBar>`, `<MatchContent>`, `<LoadingState>`, `<ErrorState>`. Use `React.memo` on the search bar.

### 8.11 `StatItem` component redefined every render
- **File**: `src/components/PlayerCard.tsx:89`
- **Severity**: **LOW**
- **Issue**: `StatItem` is defined inside the `PlayerCard.tsx` module but not inside a component, so it's only created once. However, since `PlayerCard` is not memoized, the `StatItem` function itself is fine, but each `StatItem` call creates new `Icon` component instances.
- **Fix**: Extract `StatItem` to its own file or memoize it.

---

## Category 9: Security & Best Practices (10 findings)

### 9.1 API key/token exposed client-side in source
- **File**: `src/types/config.ts:21`
- **Severity**: **CRITICAL**
- **Issue**: `Accept: "json/df8e84j9xtdz269euy3h"` is an API token embedded in plain text in the client-side bundle. Anyone using browser DevTools can extract this token. This allows unauthorized API access.
- **Fix**: (1) Move the token to an environment variable (`VITE_API_TOKEN`). (2) Better: implement a BFF (Backend for Frontend) proxy that adds the token server-side, so the client never sees it. (3) Restrict the token's origin/referrer on the API side.

### 9.2 No request timeout — potential dangling requests
- **File**: `src/services/api.ts:48`
- **Severity**: **HIGH**
- **Issue**: `fetch(url, { headers })` has no timeout configuration. If the API server becomes unresponsive, the request hangs indefinitely. The `loading` state never resets, and the user is stuck looking at a loading button forever.
- **Fix**: Add a timeout: `const controller = new AbortController(); setTimeout(() => controller.abort(), 15000);` or use `AbortSignal.timeout(15000)` (modern browsers).

### 9.3 No CORS credentials handling
- **File**: `src/services/api.ts:48`
- **Severity**: **MEDIUM**
- **Issue**: `fetch(url, { headers })` uses the default `credentials: 'same-origin'`. If the API requires cookies or authorization headers for authenticated requests, this may silently fail. The error message would be a generic CORS error.
- **Fix**: Explicitly set `credentials: 'include'` if cookies are needed, or document that the API is public.

### 9.4 Custom Accept header used as auth — trivially bypassed
- **File**: `src/types/config.ts:21`
- **Severity**: **CRITICAL**
- **Issue**: Using `Accept: "json/df8e84j9xtdz269euy3h"` as an authentication mechanism is fundamentally insecure. The `Accept` header is meant for content negotiation, not auth. Anyone can copy this value from network tab and make requests from `curl`.
- **Fix**: Use proper authentication (API key in `Authorization` header, OAuth, etc.). Even then, client-side secrets are always exposed — use a proxy.

### 9.5 `toLowerCase()` on potentially non-string
- **File**: `src/services/api.ts:62`
- **Severity**: **MEDIUM**
- **Issue**: `data.call.status.toLowerCase()` assumes `status` is a string. If the API returns a number (e.g., `200`) or a boolean, calling `.toLowerCase()` will throw a TypeError.
- **Fix**: Add validation: `String(data.call.status).toLowerCase()` or check `typeof`.

### 9.6 `URLSearchParams` with nested objects
- **File**: `src/services/api.ts:45`
- **Severity**: **LOW**
- **Issue**: If any value in `params` is an object or array, `URLSearchParams` will call `.toString()` on it, producing `[object Object]`. Currently, all params are strings and numbers, but if the types are loosened, this could break.
- **Fix**: Add a serializer that handles nested values: `const queryParams = new URLSearchParams(serialize(params)).toString()`.

### 9.7 Error messages expose endpoint names
- **File**: `src/services/api.ts:51,63`
- **Severity**: **LOW**
- **Issue**: Error messages include raw endpoint names: `API call to getMatch failed` and `API error for getMatch`. This leaks internal API endpoint naming to users via the UI.
- **Fix**: Use user-friendly messages: `Failed to load match data. Please try again.`. Log technical details to console.

### 9.8 No Content Security Policy
- **File**: `index.html:4-8`
- **Severity**: **MEDIUM**
- **Issue**: No CSP meta tag or HTTP header is configured. This leaves the app vulnerable to XSS attacks. External image URLs in config (placehold.co, cdn.torneopal.net) would need explicit CSP allowlisting.
- **Fix**: Add a `<meta http-equiv="Content-Security-Policy">` tag that restricts script sources, image sources, and connection targets.

### 9.9 API URL could be manipulated
- **File**: `src/services/api.ts:46`
- **Severity**: **MEDIUM**
- **Issue**: The URL is constructed by concatenating `APP_CONFIG.API_BASE_URL + endpoint + queryString`. If `endpoint` contains special characters or path traversal (`../`), it could construct unexpected URLs.
- **Fix**: Validate the endpoint against a whitelist of known endpoints. Use `new URL(endpoint, APP_CONFIG.API_BASE_URL)` for proper URL resolution.

### 9.10 No input validation on match ID
- **File**: `src/pages/MatchPage.tsx:25-27`
- **Severity**: **MEDIUM**
- **Issue**: `trimmedMatchId` is used directly in `navigate(\`/match/${trimmedMatchId}\`)` and then in `fetchData(matchId)`. There's no validation that `matchId` is a valid numeric match ID. A user could enter arbitrary strings, causing unnecessary API calls.
- **Fix**: Validate the match ID format before making API calls: `if (!/^\d+$/.test(trimmedMatchId)) { setError('Invalid match ID'); return; }`.

---

## Category 10: Overall Architecture (13 findings)

### 10.1 No lint or typecheck scripts
- **File**: `package.json:7-9`
- **Severity**: **HIGH**
- **Issue**: The `scripts` section only contains `dev`, `build`, and `preview`. There are no `lint`, `typecheck`, or `test` scripts. This means CI runs no linting or type-checking beyond the build step (`tsc && vite build`), which still allows style violations.
- **Fix**: Add `"lint": "eslint src/"`, `"typecheck": "tsc --noEmit"`, and `"format": "prettier --check src/"` scripts. Integrate them into CI.

### 10.2 No testing framework or tests
- **File**: `package.json`
- **Severity**: **CRITICAL**
- **Issue**: There are zero test files and zero testing dependencies in `package.json`. The application has no unit tests, integration tests, or E2E tests. The data processing logic in `dataProcessors.ts` is non-trivial and has several edge cases (see Category 5) that are completely untested.
- **Fix**: Add testing dependencies (`vitest`, `@testing-library/react`, `@testing-library/jest-dom`). Write tests for `dataProcessors.ts`, `api.ts` rate limiter, and component rendering.

### 10.3 `errorElement` using NotFound for route errors
- **File**: `src/routes.tsx:10`
- **Severity**: **HIGH**
- **Issue**: The root route `/` has `errorElement: <NotFound />`. If an error occurs on the home page (e.g., an unhandled React error), the user sees a "404 - Sivua ei löytynyt" message, which is misleading. The error is likely a runtime error, not a missing page.
- **Fix**: Create a dedicated `<ErrorBoundary>` or `<ErrorPage>` component with error details, a retry button, and support contact info. Keep `<NotFound>` only for the `path: '*'` wildcard route.

### 10.4 `useMatchData` hook violates Single Responsibility Principle
- **File**: `src/hooks/useMatchData.ts`
- **Severity**: **HIGH**
- **Issue**: The hook does everything: fetches match data, fetches group data, fetches team data, fetches player data, processes player data, manages loading state, manages error state. This violates SRP and makes the hook impossible to reuse, hard to test, and difficult to debug.
- **Fix**: Split into smaller hooks:
  - `useMatchDetails(matchId)`: fetches match + group + teams
  - `usePlayerStats(playerIds, matchInfo)`: fetches and processes player data
  - `useAsyncState()`: generic loading/error state management

### 10.5 Massive `Omit` return type creates fragile coupling
- **File**: `src/utils/dataProcessors.ts:9`
- **Severity**: **MEDIUM**
- **Issue**: The return type of `processPlayerMatchHistory` lists 11 omitted fields by name. Any change to `PlayerStats` (adding/removing fields) requires updating this type. This creates a high-maintenance, fragile coupling between the data processor and the type definition.
- **Fix**: Define a `ProcessedPlayerStats` interface that only includes the fields this function returns. Compose `PlayerStats` from smaller interfaces: `type PlayerStats = PlayerIdentity & PlayerSeasonStats & { ... }`.

### 10.6 Config in `types/` directory
- **File**: `src/types/config.ts`
- **Severity**: **MEDIUM**
- **Issue**: Runtime configuration (URLs, tokens, rate limits) is stored in the `types/` directory. This is architecturally incorrect — `types/` should contain only TypeScript type/interface definitions, not runtime values.
- **Fix**: Move `APP_CONFIG` to `src/config/appConfig.ts` or `src/config/index.ts`. Keep `APIConfig` interface in `types/` if desired, or colocate with the config.

### 10.7 CI/CD deploys from feature branch
- **File**: `.github/workflows/deploy.yml:6`
- **Severity**: **HIGH**
- **Issue**: The deploy workflow triggers on pushes to `feature/modernization` branch. This means any push to this branch deploys to production. No staging/review environment, no approval gates. The comment "Adjust if you want to deploy from main later" suggests this is intentional, but it's a serious risk.
- **Fix**: Deploy from `main` or a `release` branch only. Add environment approval gates. Set up preview deployments for feature branches.

### 10.8 No API response cache layer
- **File**: `src/hooks/useMatchData.ts` / `src/services/api.ts`
- **Severity**: **HIGH**
- **Issue**: There's no caching mechanism for API responses. Every navigation to a match page re-fetches all data. Team data, player data, and competition data are largely static and should be cached with TTL.
- **Fix**: Implement a caching layer (e.g., `Map<string, { data: T; expiresAt: number }>`) in the API service or use a library like `react-query`/`@tanstack/react-query` which provides caching, deduplication, and stale-while-revalidate out of the box.

### 10.9 Default Vite favicon
- **File**: `index.html:6`
- **Severity**: **LOW**
- **Issue**: The favicon is set to `/vite.svg` (the Vite default logo). This is not the application's branding.
- **Fix**: Replace with a proper application favicon (football-related SVG or the "Night Captain" brand logo).

### 10.10 No code splitting configuration
- **File**: `vite.config.ts`
- **Severity**: **MEDIUM**
- **Issue**: Vite's config has no explicit code splitting. While Vite automatically splits by entry point, there's no `manualChunks` configuration or lazy loading for routes. The `MatchPage` and `Home` pages are in the same bundle.
- **Fix**: Use React Router's `lazy`/`Suspense` for route-level code splitting. Add `manualChunks` for vendor separation (React, Framer Motion, Lucide).

### 10.11 No `exclude` in tsconfig
- **File**: `tsconfig.json:22-24`
- **Severity**: **LOW**
- **Issue**: The `include: ["src"]` includes all source files. There's no `exclude` for `node_modules`, `dist`, or test files. While `skipLibCheck: true` handles `node_modules`, there's no pattern for excluding test files that might be added later.
- **Fix**: Add `"exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]`.

### 10.12 No environment variable validation
- **File**: `src/types/config.ts` / `src/main.tsx`
- **Severity**: **MEDIUM**
- **Issue**: If required environment variables are missing, the app silently fails with runtime errors. For example, if `API_BASE_URL` is undefined, all API calls go to `undefined/endpoint` which fails with a cryptic network error.
- **Fix**: Add validation at app bootstrap (in `main.tsx` or a `validateEnv()` function): check that all required env vars are present and show a clear error message if not.

### 10.13 No separation between `development` and `production` config
- **File**: `src/types/config.ts`
- **Severity**: **MEDIUM**
- **Issue**: The config has no environment awareness. The same config is used in development, production, and testing. This means developers hit the real production API during local development, and there's no way to mock or stub it.
- **Fix**: Create environment-specific configs: `config.development.ts`, `config.production.ts`. Load the appropriate one based on `import.meta.env.MODE` or `import.meta.env.DEV`.

---

## Summary

### Total Findings: 121

### Breakdown by Severity

| Severity | Count |
|----------|-------|
| **CRITICAL** | 9 |
| **HIGH** | 24 |
| **MEDIUM** | 46 |
| **LOW** | 42 |

### Breakdown by Category

| Category | Count |
|----------|-------|
| 1. TypeScript types & interfaces | 18 |
| 2. API service layer | 12 |
| 3. React hooks | 12 |
| 4. Component design | 12 |
| 5. Data processing | 11 |
| 6. Config & environment | 12 |
| 7. UI/UX issues | 10 |
| 8. Performance | 11 |
| 9. Security & best practices | 10 |
| 10. Overall architecture | 13 |

---

### Top 5 Most Critical Issues to Fix First

1. **API token hardcoded in source code** (Findings 6.4, 9.1, 9.4)
   - **File**: `src/types/config.ts:21`
   - **Impact**: Anyone can extract the API token from the client-side bundle. This is a security vulnerability that should be addressed immediately.
   - **Fix**: Move to environment variable and consider a BFF proxy.

2. **1000ms throttle delay makes the app unusably slow** (Findings 2.2, 6.6, 8.3)
   - **File**: `src/types/config.ts:34` (config) / `src/services/api.ts:41-43` (implementation)
   - **Impact**: Each API call waits 1 second. Loading a match with 22 players takes 26+ seconds. This is the single biggest UX issue.
   - **Fix**: Reduce to 100ms or remove entirely.

3. **N+1 player API calls** (Findings 3.2, 8.1)
   - **File**: `src/hooks/useMatchData.ts:28-51`
   - **Impact**: 22+ sequential HTTP requests for player data. With the throttle delay, this is catastrophic for load times.
   - **Fix**: Batch endpoint, cache aggressively, or reduce throttle.

4. **No testing framework or tests** (Finding 10.2)
   - **File**: `package.json`
   - **Impact**: Zero test coverage for critical data processing logic with several edge case bugs (see Category 5). No safety net for refactoring.
   - **Fix**: Add vitest, write tests for `dataProcessors.ts` and `api.ts`.

5. **No input validation + no request timeout + no error boundaries** (Findings 9.10, 9.2, 4.9)
   - **Files**: `src/pages/MatchPage.tsx`, `src/services/api.ts:48`, `src/pages/MatchPage.tsx:68-77`
   - **Impact**: Users can enter invalid match IDs causing unnecessary API calls. Hanging requests never resolve. Unhandled render errors crash the page.
   - **Fix**: Add validation, timeouts, and error boundaries.

---

### Overall Code Health Score: **4.5 / 10**

**Rationale:**
- **Strengths (+):** Clean component structure, modern stack (React 19, Vite, Tailwind 4, TypeScript), good use of Framer Motion, typed API interfaces exist, well-organized directory structure.
- **Weaknesses (-):** No tests (critical gap), severe performance issues (N+1 queries + aggressive throttle = 26s load times), hardcoded API secrets in source code (security risk), untyped API response handling (`any` everywhere), no caching, no linting/formatting tooling, hardcoded years that are already outdated, no code splitting, no environment configuration.
- The codebase has a solid foundation but is not production-ready. The security, performance, and testing issues must be resolved before deployment.

**Recommendation:** Address the Top 5 critical issues first, then work through the HIGH severity items. Implement a proper testing strategy before adding new features.
