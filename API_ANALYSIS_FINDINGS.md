# Football Stats App — API Integration Bug Analysis

> Based on: real `getMatch?match_id=4106880` response, source code audit, and Torneopal SPL REST API behavior.

---

## CRITICAL BUGS (Runtime Crashes)

### 1. `checkRateLimit` crashes on endpoints not in `MAX_CALLS_PER_ENDPOINT`
- **File**: `src/services/api.ts:32`
- **Issue**: Line 32 does `endpointLastCalls[endpoint].push(now)` but the array is only initialized inside the `if` block on line 22, which requires the endpoint to exist in `APP_CONFIG.RATE_LIMIT.MAX_CALLS_PER_ENDPOINT`. For any endpoint NOT in that config (e.g., `"getCompetitions"`, `"getCategories"`, `"getMatches"`, `"getScore"`, `"getSeasons"`), `endpointLastCalls[endpoint]` is `undefined`, and calling `.push()` throws `TypeError: Cannot read properties of undefined`.
- **Impact**: Any call to `getCompetitions()`, `getCategories()`, `getMatches()`, `getScore()`, or `getSeasons()` crashes the app on the first call.
- **Fix**: Initialize the array unconditionally when endpoint is provided:
  ```typescript
  if (endpoint) {
      if (!endpointLastCalls[endpoint]) endpointLastCalls[endpoint] = [];
      endpointLastCalls[endpoint].push(now);
  }
  ```

### 2. `data.call.status.toLowerCase()` crashes when `call` is missing
- **File**: `src/services/api.ts:62`
- **Issue**: The real API response has a `call` object. But if the API changes or a different endpoint returns a different structure, `data.call` is `undefined`, and `data.call.status` throws `TypeError: Cannot read properties of undefined`.
- **Impact**: Silent crash — the `throw` on line 63 would instead become an uncaught TypeError.
- **Fix**: Use optional chaining: `if (data.call?.status?.toLowerCase() !== "ok")`

### 3. `data.call.status.toLowerCase()` crashes when `status` is missing or not a string
- **File**: `src/services/api.ts:62`
- **Issue**: If `data.call.status` is missing, `undefined.toLowerCase()` throws. If it's a number or object, `.toLowerCase()` doesn't exist.
- **Impact**: Same as above — uncaught TypeError.
- **Fix**: `if (typeof data.call?.status !== 'string' || data.call.status.toLowerCase() !== "ok")`

---

## DATA INTEGRITY BUGS

### 4. `CURRENT_YEAR` hardcoded to `"2025"` — real API uses `"2026"`
- **File**: `src/types/config.ts:18`
- **Issue**: `APP_CONFIG.CURRENT_YEAR = "2025"` but the real `getMatch` response shows `season_id: "2026"`. The `processPlayerMatchHistory` function filters matches by `season_id === currentSeasonId` (line 31), so ALL player match data for the current season is silently dropped.
- **Impact**: Players show 0 games played, 0 goals, etc. — the entire stats tab is empty.
- **Fix**: `CURRENT_YEAR: "2026"` (or better, derive it dynamically: `new Date().getFullYear().toString()`)

### 5. `PREVIOUS_YEAR` hardcoded to `"2024"` — should be `"2025"`
- **File**: `src/types/config.ts:19`
- **Issue**: Same structural issue as #4. Previous season data will never match.
- **Impact**: `gamesPlayedLastSeason` and `goalsScoredLastSeason` are always 0.
- **Fix**: `PREVIOUS_YEAR: "2025"` (or derive dynamically)

### 6. `getTeamData` returns full response object, not `data.team`
- **File**: `src/services/api.ts:84-88`
- **Issue**: `getMatchDetails` returns `data.match`, `getPlayerData` returns `data.player`. But `getTeamData` returns `data` (the full response including `call` metadata). This is inconsistent.
- **Impact**: Callers in `useMatchData.ts:22-26` receive the entire API envelope instead of just the team object. The returned objects are never used, masking the bug — but if someone actually tries to use `teamA` or `teamB`, they'll get unexpected structure (e.g., `teamA.team_id` would be `undefined` since it's at `teamA.team.team_id`).
- **Fix**: `return data.team;` instead of `return data;`

### 7. `PlayerLineupInfo` declares `team_name` — API lineup entries don't have it
- **File**: `src/types/api.ts:49`
- **Issue**: The real `getMatch` response shows lineup entries do NOT contain a `team_name` field. Each lineup has `team_id` but not `team_name`.
- **Impact**: In `useMatchData.ts:35`, `lineupInfo.team_name` is always `undefined`, so the fallback logic (`lineupInfo.team_id === match.team_A_id ? match.team_A_name : match.team_B_name`) is the actual code path. The interface is misleading.
- **Fix**: Remove `team_name` from `PlayerLineupInfo`, or mark it as optional with a comment explaining it's not in the API.

### 8. `PlayerStats` has `height` and `weight` — not available from API
- **File**: `src/types/api.ts:151-152`
- **Issue**: The API lineup entries contain no `height` or `weight` fields. In `useMatchData.ts:47-48`, these are read from `lineupInfo` (the lineup entry object), which doesn't have them.
- **Impact**: `height` and `weight` are always `undefined` in every `PlayerStats` object. If any component renders these, it shows nothing or breaks. The `PlayerCard` doesn't use them currently, so it's hidden but still clutters the type.
- **Fix**: Remove `height` and `weight` from `PlayerStats`, or add them as optional with a source comment.

### 9. `PlayerStats` has `finland_raised` — never populated
- **File**: `src/types/api.ts:153`
- **Issue**: `finland_raised` is declared in `PlayerStats` but is never read from any API response or set in `useMatchData.ts`.
- **Impact**: Always `undefined`. If rendered, shows nothing.
- **Fix**: Remove or populate from a real data source.

### 10. `PlayerStats` has `clubCrest` — never populated
- **File**: `src/types/api.ts:136`
- **Issue**: `clubCrest` is declared in `PlayerStats` and referenced in the `Omit` type in `dataProcessors.ts:9`, but is never set in `useMatchData.ts`.
- **Impact**: Always `undefined`. The `PlayerCard` doesn't use it, but it's dead weight in the type.
- **Fix**: Remove or populate.

### 11. `lineupInfo.position_fi` doesn't exist — API has `position`, not `position_fi`
- **File**: `src/hooks/useMatchData.ts:46`
- **Issue**: The real API lineup entry has a field called `position` (value: `"mv"`, `""`, etc.), but the code reads `lineupInfo.position_fi`. The field name `position_fi` doesn't exist in the API response.
- **Impact**: `position_fi` is always `undefined`. The `PlayerCard` renders `{stats.position_fi || 'Pelaaja'}`, which always shows "Pelaaja" instead of the actual position.
- **Fix**: Read `lineupInfo.position` instead:
  ```typescript
  position_fi: lineupInfo.position,
  ```

### 12. `getGroupDetails` passes `matches: 1` — unclear if API accepts this parameter
- **File**: `src/services/api.ts:79`
- **Issue**: The real API reference only shows the `getMatch` response. The `getGroup` endpoint's expected parameters are unknown. Passing `matches: 1` may be ignored, cause an error, or expect a different format.
- **Impact**: Group data (standings table) may not load correctly, or the request might fail silently (returns `data.group || null`).
- **Fix**: Verify the `getGroup` API documentation. If `matches` is not a valid param, remove it. If it expects a boolean or string, fix accordingly.

---

## RATE LIMITING & THROTTLING BUGS

### 13. `THROTTLE_DELAY: 1000` doesn't serialize concurrent requests — thundering herd
- **File**: `src/services/api.ts:41-43`, `src/hooks/useMatchData.ts:29`
- **Issue**: All ~20+ player fetch promises are created simultaneously via `playersInMatch.map(async ...)`. Each call enters `fetchAPIData`, awaits the 1000ms throttle delay at approximately the same time, then all ~20+ requests fire concurrently. The throttle does NOT serialize them — it's just a fixed delay before each fires.
- **Impact**: All getPlayer requests hit the API simultaneously in a burst, potentially triggering server-side rate limiting or overwhelming the connection. The endpoint-specific rate limit of 50/min is the only guard, but all 20+ could pass before the first minute window expires.
- **Fix**: Implement a proper serialization queue or semaphore that spaces requests at least 1000ms apart:
  ```typescript
  let lastCallTime = 0;
  async function throttle() {
      const now = Date.now();
      const wait = Math.max(0, 1000 - (now - lastCallTime));
      await new Promise(r => setTimeout(r, wait));
      lastCallTime = Date.now();
  }
  ```

### 14. `MAX_CALLS_PER_MINUTE: 60` vs `getPlayer: 50` — global limit is looser than endpoint limit
- **File**: `src/types/config.ts:27,32`
- **Issue**: The global rate limit allows 60 calls/min but the getPlayer endpoint limit is 50/min. Since the global check passes first, a burst could send 60 calls to getPlayer before the endpoint-specific limit of 50 kicks in.
- **Impact**: The endpoint-specific limit (the tighter one) is effectively the real limit, making the global check redundant and potentially allowing excess calls.
- **Fix**: Either make the global limit tighter (≤ min of all endpoint limits) or remove it.

### 15. `THROTTLE_DELAY: 1000` + `getPlayer: 50/min` — inconsistent effective rates
- **File**: `src/types/config.ts:32-34`
- **Issue**: A 1000ms throttle delay allows at most ~60 calls/min (1000ms × 60 = 60s), but the getPlayer endpoint limit is 50/min. These two mechanisms don't align — the throttle allows more calls than the limit permits.
- **Impact**: Confusing behavior: some users will be throttled to 50/min by one mechanism, others to 60/min by the other, depending on timing.
- **Fix**: Align the throttle delay with the endpoint limit: e.g., for 50/min, use 1200ms throttle.

---

## NETWORK & ERROR HANDLING BUGS

### 16. No network error handling in `fetchAPIData`
- **File**: `src/services/api.ts:36-66`
- **Issue**: `fetch()` throws a `TypeError` on network failures (DNS failure, connection refused, CORS error, timeout). There is no `try/catch` in `fetchAPIData` to handle this. The error propagates to `useMatchData`'s `catch` block, which only shows `err.message`.
- **Impact**: Network errors are shown as generic "Failed to fetch" to the user with no retry or user-friendly messaging.
- **Fix**: Wrap the fetch call in a try/catch:
  ```typescript
  try {
      const response = await fetch(url, { ... });
      ...
  } catch (networkError) {
      throw new Error(`Verkkovirhe: ${networkError instanceof Error ? networkError.message : 'Pyyntö epäonnistui'}`);
  }
  ```

### 17. No request timeout
- **File**: `src/services/api.ts:48`
- **Issue**: `fetch()` has no timeout configuration. If the API server hangs (e.g., due to load or a bug), the request will hang indefinitely, and the loading spinner in the UI never stops.
- **Impact**: Users see an infinite loading state with no way to recover.
- **Fix**: Use `AbortSignal.timeout()` or a manual `AbortController`:
  ```typescript
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const response = await fetch(url, { headers: APP_CONFIG.API_HEADERS, signal: controller.signal });
  clearTimeout(timeout);
  ```

### 18. No retry logic on failure
- **File**: `src/services/api.ts:48-66`
- **Issue**: Any HTTP 5xx error, network blip, or transient failure causes an immediate error with no retry.
- **Impact**: A single transient failure (common with mobile network APIs) causes a full failure for the user.
- **Fix**: Implement exponential backoff retry (e.g., up to 3 retries with 1s/2s/4s delays).

### 19. Error parsing has misleading optional chaining
- **File**: `src/services/api.ts:53-56`
- **Issue**: Line 55: `errorData.error?.message || errorData.message`. If `errorData.error` is a string (e.g., `{ "error": "Not found" }`), then `errorData.error?.message` returns `undefined` (because strings don't have a `message` property), and it falls through to `errorData.message`. But if `errorData` has `{ "error": { "text": "..." } }`, no field is matched and the error text is lost.
- **Impact**: API error messages are often opaque or empty in the UI.
- **Fix**: Handle multiple error shapes:
  ```typescript
  const errorMsg = typeof errorData.error === 'string' ? errorData.error
      : errorData.error?.message || errorData.message || '';
  ```

### 20. `URLSearchParams` serializes `undefined` values as string `"undefined"`
- **File**: `src/services/api.ts:45`
- **Issue**: If any param value is `undefined` (e.g., `GetMatchesParams` has optional fields), `URLSearchParams` converts it to the string `"undefined"`, producing query strings like `?competition_id=undefined`.
- **Impact**: The API receives literal `"undefined"` as parameter values, likely causing incorrect responses or errors.
- **Fix**: Filter out undefined values before passing to URLSearchParams:
  ```typescript
  const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null)
  );
  const queryParams = new URLSearchParams(cleanParams).toString();
  ```

---

## TYPE & INTERFACE MISMATCHES

### 21. `MatchDetails.lineups` typed as `PlayerLineupInfo[]` — too restrictive
- **File**: `src/types/api.ts:18,43-50`
- **Issue**: `PlayerLineupInfo` only declares `player_id`, `player_name`, `shirt_number`, `team_id`, `captain?`, `team_name?`. But the real API lineup entry has many more fields: `goals`, `assists`, `warnings`, `suspensions`, `fouls`, `birthyear`, `position`, `start`. The interface hides this data.
- **Impact**: `lineupInfo.goals`, `lineupInfo.assists` etc. have no type information. TypeScript doesn't catch access to these fields, but they're invisible to developers exploring the API surface.
- **Fix**: Expand `PlayerLineupInfo` to include all fields present in the API response:
  ```typescript
  export interface PlayerLineupInfo {
      lineup_id: string;
      match_id: string;
      team_id: string;
      player_id: string;
      player_name: string;
      shirt_number: string;
      start: string;
      captain: string;
      position: string;
      goals: number;
      assists: number;
      warnings: number;
      suspensions: number;
      fouls: number;
      birthyear: string;
  }
  ```

### 22. `GroupDetails` interface may not match actual `getGroup` response
- **File**: `src/types/api.ts:52-59`
- **Issue**: `GroupDetails` is inferred but never validated against a real API response. It assumes `teams: StandingTeam[]` and `matches: MatchSummary[]`, but the actual `getGroup` response structure is unknown.
- **Impact**: `StandingsTable` accesses `group.teams` and maps it — if the real response nests teams under a different key, or uses different field names (e.g., `rank` instead of `current_standing`), the component silently breaks.
- **Fix**: Validate against a real `getGroup` response and update the interface accordingly.

### 23. `ScoreEntry` assumed structure — `getScore` endpoint may not exist or return different data
- **File**: `src/types/api.ts:108-118`, `src/services/api.ts:112-114`
- **Issue**: `getScore` calls method `"getScore"` and expects `{ score?: ScoreEntry[] }`. Whether the Torneopal API has a `getScore` method is unconfirmed. Parameter names and response shape are guesses.
- **Impact**: This function likely returns an empty array or throws an error when called.
- **Fix**: Verify `getScore` is a valid method. If not, remove it. If yes, validate with a real response.

---

## DATA PROCESSING BUGS

### 24. `teamNameForContext` fallback fragile — `lineupInfo.team_name` is always undefined
- **File**: `src/hooks/useMatchData.ts:35`
- **Issue**: `lineupInfo.team_name` doesn't exist in the API response (see #7). The fallback to `match.team_A_name` or `match.team_B_name` works correctly, but only because the actual field is always undefined. This is fragile and confusing.
- **Impact**: If the API ever adds `team_name` to lineup entries in a different format (e.g., abbreviation), the behavior changes silently.
- **Fix**: Remove the `lineupInfo.team_name` reliance entirely:
  ```typescript
  lineupInfo.team_id === match.team_A_id ? match.team_A_name : match.team_B_name
  ```

### 25. `processPlayerMatchHistory` uses `match.team_id` but field name may differ in getPlayer response
- **File**: `src/utils/dataProcessors.ts:49,59`
- **Issue**: The function reads `match.team_id` from each match entry in `playerData.matches`. The real getPlayer response structure is assumed but not confirmed. If the field is named `team_id_A` or `player_team_id` instead of `team_id`, the entire comparison chain breaks silently.
- **Impact**: All result indicators (`win`/`loss`/`draw`) and team-specific stats are incorrect.
- **Fix**: Validate against a real `getPlayer` response and confirm the field name.

### 26. `pastMatchesDetails` aggregates regardless of `team_id` vs `team_name` matching
- **File**: `src/utils/dataProcessors.ts:41,65`
- **Issue**: The code pushes to `pastMatchesDetails` only when `teamName === teamNameForContext`. But `teamName` comes from `match.team_name`, which is the name of the team the player was on. The `teamNameForContext` is derived from the current match's lineup. If the player has played for multiple teams, the comparison works fine. But the `opponentName` logic on lines 49-57 uses `match.team_A_name` vs `match.team_B_name` — this is correct only if `teamNameForContext` matches one of them. Edge case: if the player was on a team that doesn't match either A or B name (shouldn't happen in normal data, but is fragile).
- **Impact**: Relatively minor — data is likely correct for most cases.
- **Fix**: Add defensive check that teamNameForContext matches at least one of team_A_name or team_B_name.

### 27. `parseInt` without radix (though default 0 mitigates)
- **File**: `src/utils/dataProcessors.ts:26-28`
- **Issue**: While `parseInt(match.player_goals) || 0` works because it defaults to 0 on NaN, it uses the implicit radix (auto-detection). Best practice is explicit radix 10.
- **Impact**: Very minor — could cause issues in edge cases with leading zeros in older JS engines.
- **Fix**: `parseInt(match.player_goals, 10) || 0`

---

## CONCURRENCY & CLEANUP BUGS

### 28. No `AbortController` — stale requests not cancellable
- **File**: `src/services/api.ts:48`, `src/hooks/useMatchData.ts:16-65`
- **Issue**: When the user navigates away or types a new match ID, the previous request(s) continue in-flight. `fetchData` is called again, but the old promise chain still resolves and calls `setData`/`setError` after the component may have unmounted.
- **Impact**: React "Can't perform a React state update on an unmounted component" warning. Rate limit budget wasted on stale requests.
- **Fix**: Use `AbortController` and pass the signal through, checking in `fetchData`:
  ```typescript
  const abortRef = useRef<AbortController>();
  const fetchData = useCallback(async (matchId: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      // pass controller.signal to fetch
  }, []);
  ```

### 29. All player fetch promises fire simultaneously
- **File**: `src/hooks/useMatchData.ts:29,52`
- **Issue**: `playersInMatch.map(async ...)` creates all promises immediately, and `Promise.all` waits for all. Combined with the throttle delay of 1000ms (see #13), all ~20+ players get their 1s delay concurrently, then fire simultaneously.
- **Impact**: Burst of concurrent API calls, potential connection saturation, server-side rate limiting.
- **Fix**: Use a sequential queue or a concurrency-limited pool (e.g., 3 at a time):
  ```typescript
  async function processBatch(items, batchSize = 3) {
      const results = [];
      for (let i = 0; i < items.length; i += batchSize) {
          const batch = items.slice(i, i + batchSize);
          const batchResults = await Promise.all(batch.map(item => process(item)));
          results.push(...batchResults);
      }
      return results;
  }
  ```

---

## API CALL & PARAMETER BUGS

### 30. Suspicious `Accept` header `"json/df8e84j9xtdz269euy3h"` — non-standard MIME type
- **File**: `src/types/config.ts:21`
- **Issue**: The `Accept` header is set to `"json/df8e84j9xtdz269euy3h"` — this looks like a custom MIME type or token. Standard API Accept headers should be `"application/json"`. This custom type may cause CORS preflight failures or be rejected by the server.
- **Impact**: If the server doesn't accept this custom type, requests may fail with 406 Not Acceptable or trigger CORS issues.
- **Fix**: Use standard `"application/json"` (or verify this is an API key that must be sent as a header — if so, rename the header to `X-API-Key` or similar).

### 31. `getScore` endpoint may not be a valid Torneopal method
- **File**: `src/services/api.ts:112-114`
- **Issue**: The Torneopal SPL REST API uses methods like `getMatch`, `getGroup`, `getTeam`, `getPlayer`, `getCompetitions`, `getCategories`, `getSeasons`, `getMatches`. Whether `getScore` is a valid method is unknown.
- **Impact**: Likely returns a 404 or unknown method error.
- **Fix**: Verify with API docs. If it doesn't exist, remove the function or map to the correct method.

### 32. `getMatches` passes `GetMatchesParams` directly — `limit` and `offset` are numbers
- **File**: `src/services/api.ts:107-109`
- **Issue**: `GetMatchesParams` includes `limit?: number` and `offset?: number`. `URLSearchParams` converts numbers to strings, which is fine. But the actual API may expect different parameter names (e.g., `limit` vs `count`, `offset` vs `start`).
- **Impact**: Pagination params may be silently ignored by the API.
- **Fix**: Verify parameter names against the real API.

---

## CONFIGURATION & ENVIRONMENT BUGS

### 33. All config values are hardcoded — no environment variable support
- **File**: `src/types/config.ts:16-36`
- **Issue**: `API_BASE_URL`, `CURRENT_YEAR`, `API_HEADERS`, etc. are all hardcoded literals. There's no `.env` support, no way to change the API URL for development/staging/production.
- **Impact**: Developers must edit source code to change the API endpoint or year. Impossible to deploy to different environments.
- **Fix**: Use Vite environment variables (`import.meta.env.VITE_*`) with fallbacks.

### 34. `NO_PLAYER_IMAGE_URL` and `DEFAULT_CREST_URL` hardcoded — may 404
- **File**: `src/types/config.ts:23-24`
- **Issue**: These URLs point to external domains (`palloliitto.fi`, `cdn.torneopal.net`). If the external resources change or are removed, the images silently fail (the onError handler hides the broken image, but no alternative is shown).
- **Impact**: Broken images in the UI.
- **Fix**: Consider bundling placeholder images locally or using a more robust fallback chain.

---

## MISSING VALIDATION & SAFETY

### 35. No runtime validation of API response shapes
- **File**: `src/services/api.ts:48-66`
- **Issue**: The code casts API responses to generic types (`as T`), but there's no runtime validation. If the API changes its response structure (new field naming, different nesting), TypeScript won't catch it at runtime, and the app silently uses `undefined` values.
- **Impact**: Hard-to-debug production issues where data appears empty.
- **Fix**: Use Zod or io-ts to validate API responses at runtime.

### 36. `getGroupDetails` silently returns `null` when `data.group` is missing
- **File**: `src/services/api.ts:81`
- **Issue**: `return data.group || null;` — if `data.group` is undefined, the function returns null. But it could also return an error from the API (e.g., `{ call: { status: "error" }, error: "..." }`). The function doesn't check `data.call.status`.
- **Impact**: API errors for group data are silently swallowed, and the standings table just doesn't appear.
- **Fix**: Check `data.call.status` before accessing `data.group`:
  ```typescript
  if (data.call?.status !== "ok") throw new Error(`API error for getGroup: ${data.call?.status}`);
  ```

### 37. `processPlayerMatchHistory` silently skips matches where `season_id` doesn't match
- **File**: `src/utils/dataProcessors.ts:31,87`
- **Issue**: If `match.season_id` is undefined, null, or a different type, the match is silently skipped without any warning or logging.
- **Impact**: Missing data is invisible to developers.
- **Fix**: Add a debug log for unexpected season_id values (at least in development).

### 38. `getGroupDetails` expects `competition_id`, `category_id`, `group_id` — but real API param names may differ
- **File**: `src/services/api.ts:75-80`
- **Issue**: The code passes `competition_id`, `category_id`, `group_id`. If the `getGroup` endpoint expects different casing or naming (e.g., `competitionId`, `categoryId`, `groupId`), the request silently fails.
- **Impact**: No group/standings data.
- **Fix**: Verify against real API documentation.

---

## MINOR / COSMETIC

### 39. `PlayerCard` uses `stats.name + stats.shirtNumber` as React key — not unique
- **File**: `src/pages/MatchPage.tsx:95,104`
- **Issue**: `key={player.name + player.shirtNumber}` — if two players have the same name and shirt number (unlikely but possible in youth teams where siblings might share a number across different lineups), the key collides.
- **Impact**: Potential React rendering bugs (duplicate keys).
- **Fix**: Use `player.player_id` or `player.teamIdInMatch + player.shirtNumber + player.name`.

### 40. `StatItem` uses `any` type for props
- **File**: `src/components/PlayerCard.tsx:89`
- **Issue**: `function StatItem({ label, value, icon: Icon, variant = 'default' }: any)` — no type safety.
- **Impact**: Bugs from mismatched props are not caught by TypeScript.
- **Fix**: Define a proper interface for StatItem props.

---

## SUMMARY TABLE

| # | Severity | Category | File | Line |
|---|----------|----------|------|------|
| 1 | CRITICAL | Runtime crash | api.ts | 32 |
| 2 | CRITICAL | Runtime crash | api.ts | 62 |
| 3 | CRITICAL | Runtime crash | api.ts | 62 |
| 4 | HIGH | Data integrity | config.ts | 18 |
| 5 | HIGH | Data integrity | config.ts | 19 |
| 6 | HIGH | Data integrity | api.ts | 84-88 |
| 7 | HIGH | Data integrity | api.ts | 49 |
| 8 | MEDIUM | Data integrity | api.ts | 151-152 |
| 9 | MEDIUM | Data integrity | api.ts | 153 |
| 10 | MEDIUM | Data integrity | api.ts | 136 |
| 11 | MEDIUM | Data integrity | useMatchData.ts | 46 |
| 12 | MEDIUM | Data integrity | api.ts | 79 |
| 13 | HIGH | Rate limiting | api.ts | 41-43 |
| 14 | MEDIUM | Rate limiting | config.ts | 27 |
| 15 | LOW | Rate limiting | config.ts | 32-34 |
| 16 | HIGH | Error handling | api.ts | 36-66 |
| 17 | HIGH | Error handling | api.ts | 48 |
| 18 | MEDIUM | Error handling | api.ts | 48-66 |
| 19 | MEDIUM | Error handling | api.ts | 53-56 |
| 20 | MEDIUM | Error handling | api.ts | 45 |
| 21 | MEDIUM | Typing | api.ts | 18,43-50 |
| 22 | MEDIUM | Typing | api.ts | 52-59 |
| 23 | MEDIUM | Typing | api.ts | 108-118 |
| 24 | MEDIUM | Data processing | useMatchData.ts | 35 |
| 25 | MEDIUM | Data processing | dataProcessors.ts | 49,59 |
| 26 | LOW | Data processing | dataProcessors.ts | 41,65 |
| 27 | LOW | Data processing | dataProcessors.ts | 26-28 |
| 28 | MEDIUM | Concurrency | api.ts | 48 |
| 29 | MEDIUM | Concurrency | useMatchData.ts | 29 |
| 30 | MEDIUM | API call | config.ts | 21 |
| 31 | MEDIUM | API call | api.ts | 112-114 |
| 32 | LOW | API call | api.ts | 107-109 |
| 33 | MEDIUM | Config | config.ts | 16-36 |
| 34 | LOW | Config | config.ts | 23-24 |
| 35 | MEDIUM | Validation | api.ts | 48-66 |
| 36 | MEDIUM | Validation | api.ts | 81 |
| 37 | LOW | Validation | dataProcessors.ts | 31,87 |
| 38 | MEDIUM | API call | api.ts | 75-80 |
| 39 | LOW | React | MatchPage.tsx | 95,104 |
| 40 | LOW | Typing | PlayerCard.tsx | 89 |
