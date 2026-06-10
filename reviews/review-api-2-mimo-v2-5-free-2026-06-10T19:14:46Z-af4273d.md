# API Error Handling Review — api-2 (agent 6)

**Model**: `mimo-v2-5-free`  
**Date**: 2026-06-10T19:14:46Z  
**Commit**: `af4273d`

---

## CRITICAL: `batchFetch` swallows individual failures — single failure kills entire batch

- **File**: `src/services/api.ts:83`
- **Issue**: `Promise.all` is used on the entire batch. If a single `fetchFn` call (e.g. `getPlayerData` for one player) rejects, the entire batch and all previously resolved results are lost. For a match with 22+ players, one transient API failure for any player crashes the entire match page.
- **Suggestion**: Use `Promise.allSettled` and collect partial results. Log failed items and return succeeded results. Alternatively, implement per-item retry before failing. Example:
  ```ts
  const settled = await Promise.allSettled(batch.map(id => fetchFn(id)));
  settled.forEach((r, i) => { if (r.status === 'rejected') console.warn(`Failed: ${batch[i]}`, r.reason); });
  results.push(...settled.map(r => r.status === 'fulfilled' ? r.value : null));
  ```

## CRITICAL: No request cancellation in `useMatchData` — stale data race condition

- **File**: `src/hooks/useMatchData.ts:19-65`
- **Issue**: `fetchData` has no `AbortController` or cancellation token. If `matchId` changes rapidly (e.g. user navigates between matches), multiple concurrent `fetchData` calls run in parallel. The earlier call's response can overwrite the later call's response, displaying stale data. React 18's strict mode also double-invokes effects, compounding this.
- **Suggestion**: Add an `AbortController` to `fetchData`. Pass the signal through to `fetchAPIData` and `batchFetch`. On re-render or re-invocation, abort the previous in-flight request:
  ```ts
  const controllerRef = useRef<AbortController>();
  const fetchData = useCallback(async (matchId: string) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      // pass controller.signal to API calls...
  }, []);
  ```

## CRITICAL: `batchFetch` has no abort signal propagation

- **File**: `src/services/api.ts:75-87`
- **Issue**: `batchFetch` accepts no `AbortSignal`. Even if `useMatchData` were to abort, `batchFetch` would continue firing all remaining `fetchFn` calls. Each `fetchFn` creates its own `AbortController` internally, but the outer batch loop has no way to be cancelled.
- **Suggestion**: Accept an optional `AbortSignal` in `batchFetch` and check `signal.aborted` before each batch iteration. Reject with `AbortError` if aborted.

## WARNING: `AbortError` not handled gracefully — raw error shown to user

- **File**: `src/services/api.ts:54`
- **Issue**: When the 10-second timeout fires, `controller.abort()` causes `fetch()` to reject with a `DOMException` named `"AbortError"`. This propagates up to `useMatchData` where the catch block at line 60 shows the raw error message to the user. The message is unhelpful (typically just `"Aborted"` or `"The operation was aborted"`).
- **Suggestion**: Catch `AbortError` specifically in `fetchAPIData` and re-throw as a descriptive timeout error:
  ```ts
  } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
          throw new Error(`API call to ${endpoint} timed out after ${FETCH_TIMEOUT}ms`);
      }
      throw err;
  }
  ```

## WARNING: No retry logic for transient API failures

- **File**: `src/services/api.ts:39-73`
- **Issue**: All API calls fail permanently on first failure. No retry is attempted for 5xx server errors, network errors, or transient failures. A single network blip crashes the entire experience.
- **Suggestion**: Implement exponential backoff retry in `fetchAPIData` for retryable errors (5xx, network errors). Keep retry count low (2-3 attempts) to respect rate limits. Do NOT retry on 4xx errors.

## WARNING: Rate limit error is not distinguishable from other errors in UI

- **File**: `src/services/api.ts:41`
- **Issue**: The rate limit error throws a generic `Error` with the message `Rate limit exceeded for ${endpoint}...`. The `useMatchData` catch block (line 60) renders it identically to network errors or API errors. There's no way for the UI to differentiate a rate-limit situation and show an appropriate "please wait" message.
- **Suggestion**: Create a custom `RateLimitError` class. Catch it in `useMatchData` and display a rate-specific message with a retry timer.

## WARNING: `clearTimeout` skipped on fetch failure

- **File**: `src/services/api.ts:54-55`
- **Issue**: `clearTimeout(timeoutId)` is placed after `await fetch()`. If `fetch()` throws (network error, abort, DNS failure), execution jumps past `clearTimeout`. While the timeout has likely already fired in the abort case, for non-abort errors (e.g. DNS failure) the timer remains active and will call `controller.abort()` on an already-rejected fetch — this is benign but messy.
- **Suggestion**: Move `clearTimeout` into a `finally` block:
  ```ts
  try {
      const response = await fetch(url, { headers: APP_CONFIG.API_HEADERS, signal: controller.signal });
      // ... handle response
  } finally {
      clearTimeout(timeoutId);
  }
  ```

## WARNING: `getPlayerData` returns nullable without null check

- **File**: `src/services/api.ts:111-113`
- **Issue**: `getPlayerData` returns `data.player` which could be `undefined` if the API response lacks the `player` key (e.g. invalid player ID). In `useMatchData.ts:36`, `playerDataList[idx]` could be `undefined`, and accessing `playerData.matches`, `playerData.birthyear` (lines 38-48) would throw a `TypeError`.
- **Suggestion**: Add a null check in `getPlayerData`:
  ```ts
  if (!data.player) throw new Error(`Player data not found for ID ${playerId}`);
  ```

## WARNING: `getTeamData` returns null silently for empty team IDs

- **File**: `src/services/api.ts:105-109`
- **Issue**: `getTeamData` returns `null` if `teamId` is falsy, but does NOT call the API. In `useMatchData.ts:25-29`, `Promise.all` expects non-null values for `teamA` and `teamB`. If a team ID is empty/undefined, the API is never called and `null` is returned — this is safe but the null is silently swallowed by the caller. A more explicit validation would be better.
- **Suggestion**: Consider throwing if `teamId` is empty but not undefined, or at minimum log a warning.

## INFO: API credentials hardcoded in client bundle

- **File**: `src/types/config.ts:17-19`
- **Issue**: The API `Accept` header contains what appears to be an API key (`json/4h7dznqdxwtp3hsfdyf5r793uahfxy7x`). This is bundled into the client-side JavaScript and visible in browser DevTools. While the backend may be rate-limited by design, this key is fully exposed.
- **Suggestion**: Move API key to an environment variable (`import.meta.env.VITE_API_KEY`) and ensure the repo's `.env` is gitignored. For a production app, consider proxying API calls through a backend.

## INFO: `dataProcessors.ts` uses `any[]` for match data

- **File**: `src/utils/dataProcessors.ts:19`
- **Issue**: `processPlayerMatchHistory` accepts `matches: any[]`, bypassing TypeScript's type safety. Malformed data from the API (missing `player_goals`, `status`, `season_id`) is handled defensively with `|| 0` and fallback strings, but a proper type would catch issues at compile time.
- **Suggestion**: Define a `PlayerMatchHistory` interface matching the API response shape and use it instead of `any[]`.

## INFO: Global rate limiter state is module-scoped — no cleanup

- **File**: `src/services/api.ts:5-6`
- **Issue**: `lastCallTimes` and `endpointLastCalls` are module-level arrays/objects that grow unboundedly. Old entries are cleaned up per-call (via `shift()`), but in a long-running SPA with many navigation events, the arrays could accumulate before cleanup runs. In practice this is unlikely to be a real memory issue, but it's worth noting.
- **Suggestion**: Consider using a sliding window with a fixed-size buffer or TTL-based cache instead of growing arrays.

---

**Summary**: 3 CRITICAL issues (batch failure handling, request cancellation, abort propagation), 5 WARNINGs (AbortError UX, no retry, rate-limit distinction, clearTimeout placement, nullable player data), 2 INFOs (exposed credentials, untyped data).
