# API Response Shape Review

**Agent**: api-1 / 5  
**Model**: opencode/mimo-v2-5-free  
**Date**: 2026-06-10T19-14:44Z  
**Commit**: af4273d  

---

## CRITICAL: `PastMatchDetail` fields allow `undefined` but typed as required `string`

- **File**: `src/types/api.ts:150-158`
- **Issue**: `playerTeamScore` and `opponentScore` are typed as `string` but in `dataProcessors.ts:65-70`, they are assigned directly from `match.fs_A` / `match.fs_B` which are `any` (from `PlayerAPIResponse.matches: any[]`). If the API returns `null` or `undefined` for these fields, the code assigns `undefined` to a `string` variable, and `PastMatchDetail` promises non-optional `string`. The UI then passes these to `PlayerCard`'s title attribute (`playerTeamScore` - `opponentScore`) which will render as `"undefined - undefined"`.
- **Suggestion**: Make `playerTeamScore` and `opponentScore` optional (`string?`) in `PastMatchDetail`, and add `?? ''` fallback in `dataProcessors.ts:65-66,69-70`.

## CRITICAL: `PlayerAPIResponse.matches` typed as `any[]` — zero type safety on match object shape

- **File**: `src/types/api.ts:6`
- **Issue**: `matches: any[]` means every property access in `dataProcessors.ts` (lines 40-43, 45-46, 63-76, 101-102) is unvalidated. Fields like `player_goals`, `player_warnings`, `player_suspensions`, `season_id`, `status`, `fs_A`, `fs_B`, `team_A_name`, `team_B_name`, `team_A_id`, `team_id`, `winner_id`, `date` are all accessed without compile-time guarantees. A misspelling or API change silently produces NaN/undefined.
- **Suggestion**: Define a `PlayerMatchHistory` interface covering the fields consumed in `dataProcessors.ts` and type `matches` as `PlayerMatchHistory[]`.

## CRITICAL: `fetchAPIData` generic wrapper does not model the `call.status` envelope — crashes on non-standard responses

- **File**: `src/services/api.ts:69-71`
- **Issue**: Every API response is checked via `data?.call?.status?.toLowerCase() !== "ok"`, but the return type is `<T>` (e.g., `MatchDetails`, `GroupDetails`). If the upstream API ever returns a shape without a `call` property (e.g. `{ data: ... }` instead of `{ call: { status: "ok" }, match: ... }`), the `data` object is returned as-is but typed as the inner shape, causing downstream crashes. Also, `data?.call?.status` will be `undefined` for error-shaped responses that don't include `call`, silently passing them through.
- **Suggestion**: Define an `APIResponse<T>` wrapper type `{ call: { status: string }; [key: string]: unknown }`, use it in `fetchAPIData`, and unwrap before returning. This enforces the envelope at the type level.

## WARNING: `getGroupDetails` returns `null` on missing `data.group` but callers may not expect it

- **File**: `src/services/api.ts:102`
- **Issue**: `return data.group || null;` — if the API returns `{ call: { status: "ok" } }` without a `group` key, this silently returns `null`. `MatchPage.tsx:157` checks `{data.group && ...}` so this is handled, but `useMatchData.ts:58` stores it as `GroupDetails | null` which is correct. However, the type says `GroupDetails | null` but there's no explicit null-check at `api.ts:101` — if `data.group` is `undefined` it falls through to `null`, but the type says it should be a `GroupDetails` or `null`. This is fragile.
- **Suggestion**: Add explicit `data.group ?? null` for clarity and consistency with `getTeamData`.

## WARNING: `getTeamData` returns `undefined` (not `null`) when `data.team` is falsy

- **File**: `src/services/api.ts:108`
- **Issue**: `return data.team;` — if `data.team` is `undefined` (API returned no `team` key), the function returns `undefined`, but the return type is `TeamBasic | null`. The mismatch means callers like `useMatchData.ts:27-28` store `undefined` in `teamA`/`teamB` which are typed as `TeamBasic | null | undefined` (state is `TeamBasic | null | undefined`). `MatchHeader.tsx:24` accesses `teamA?.img_url` which handles `undefined`, but the type contract is inconsistent.
- **Suggestion**: Change to `return data.team ?? null` to match the declared return type.

## WARNING: Rate limiter records calls BEFORE the fetch executes — false count inflation

- **File**: `src/services/api.ts:30-33`
- **Issue**: `endpointLastCalls[endpoint].push(now)` is called inside `checkRateLimit()` (line 30) and `lastCallTimes.push(now)` on line 33, both before the actual `fetch()` on line 54. If the fetch aborts (timeout) or throws, the rate limit counter is already incremented. Over time with timeouts, this can artificially throttle valid requests.
- **Suggestion**: Move the counter increment to after a successful `response.ok` check, or decrement on error/abort.

## WARNING: `fetchAPIData` error body parsing can throw, masking the original error

- **File**: `src/services/api.ts:59-64`
- **Issue**: `await response.json()` inside the error handler (line 60) is wrapped in try/catch, but if the body is not valid JSON (e.g. HTML 502 page), `errorData` is `undefined` after the catch. The code then checks `errorData && (errorData.error || errorData.message)` which is safe, but the `catch(e)` silently swallows the parse error. More importantly, if the response body IS valid JSON but structured differently (e.g. `{ errors: [...] }`), the error message shows only the status code with no detail.
- **Suggestion**: Log `e` in the catch block (even as `console.debug`) and consider checking `errorData.errors` array as well.

## WARNING: `dataProcessors.ts` fixture opponent lookup doesn't account for `team_id` field

- **File**: `src/utils/dataProcessors.ts:91`
- **Issue**: When `match.status === "Fixture"`, the opponent is determined by `match.team_A_name === teamNameForContext ? match.team_B_name : match.team_A_name`. This is name-based only. If the player's team name doesn't exactly match `match.team_A_name` (e.g. trailing space, abbreviation), the wrong opponent is selected. For "Played" matches (line 63), both name AND `team_id` are checked (`match.team_A_id === match.team_id`), but for fixtures only name is used.
- **Suggestion**: Use `match.team_A_id === match.team_id` for fixtures too, if `match.team_id` is available in the API response for fixture entries.

## WARNING: `useMatchData.ts` builds `PlayerStats` via `as PlayerStats` cast — no runtime validation

- **File**: `src/hooks/useMatchData.ts:55`
- **Issue**: The return value of `processPlayerMatchHistory` is spread into an object and cast with `as PlayerStats`. If `processPlayerMatchHistory` returns extra fields or omits required ones (e.g. `teamsThisYear` comes from `ProcessedStats` which is not part of the cast target), the cast hides type mismatches. Additionally, `clubCrest` from `PlayerStats` is never populated from the API.
- **Suggestion**: Remove the `as PlayerStats` cast; instead, explicitly construct the object with all required fields from both `lineupInfo`, `playerData`, and `processedHistory`. Add `clubCrest: undefined` or source it from team data.

## INFO: All numeric standings fields typed as `string` — silent `parseInt` on every access

- **File**: `src/types/api.ts:73-85` (`StandingTeam`)
- **Issue**: Fields like `current_standing`, `matches_played`, `points` etc. are all `string`. Every consumer must `parseInt()` — `StandingsTable.tsx:5` does `parseInt(a.current_standing) || 999`, and the table renders the raw string values directly. This works but means the type doesn't distinguish "number as string" from "actual string". If the API ever returns `null` for a field (e.g. a team with no matches), `parseInt(null)` gives `NaN`.
- **Suggestion**: Consider a `NumericString` branded type or parse to `number` at the API boundary.

## INFO: `Competition`, `Category`, `Season` use `[key: string]: unknown` index signatures

- **File**: `src/types/api.ts:30-50`
- **Issue**: Index signatures allow arbitrary property access without type errors, which is convenient for unknown API fields but weakens type safety — any misspelling of a known property silently falls through to `unknown` instead of erroring.
- **Suggestion**: If extra fields are needed, consider a `RawCompetition` type with the index signature and a `Competition` type without it, mapped at the API boundary.

## INFO: `DiscoveryMatch` has optional `fs_A`/`fs_B` but `MatchDetails` has them as optional too — inconsistent nullability

- **File**: `src/types/api.ts:102-118` vs `src/types/api.ts:10-28`
- **Issue**: Both `DiscoveryMatch` and `MatchDetails` define `fs_A?: string` and `fs_B?: string`. In `MatchHeader.tsx:54`, the score display uses `match.fs_A ?? '-'` with nullish coalescing, which is correct. But `MatchPage.tsx:115` uses `Number(data.match.fs_A || 0)` — the `||` operator treats empty string `""` as falsy (coerces to `0`), while `??` treats only `null`/`undefined` as missing. If the API returns `fs_A: ""`, the `||` gives `0` (correct) but `??` would give `""` (NaN for `Number()`). The two usages are inconsistent.
- **Suggestion**: Standardize on `??` with explicit fallback: `Number(data.match.fs_A ?? 0)`.

## WARNING: `batchFetch` does not handle individual fetch failures — one failure aborts entire batch

- **File**: `src/services/api.ts:75-87`
- **Issue**: `Promise.all(batch.map(id => fetchFn(id)))` — if any single `getPlayerData` call fails (e.g. invalid player ID, timeout), the entire `batchFetch` rejects and `useMatchData.ts:33` catches it, showing a generic error. This means one bad player ID out of 22 prevents any data from loading.
- **Suggestion**: Use `Promise.allSettled` and filter/handle rejected results gracefully, or wrap each fetch with a fallback (e.g. return `null` for failed individual fetches and skip them in processing).
