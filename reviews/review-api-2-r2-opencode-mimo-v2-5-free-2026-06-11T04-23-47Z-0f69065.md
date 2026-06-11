# API Error Handling Review — Round 2

**Model:** opencode/mimo-v2.5-free  
**Date:** 2026-06-11T04:23:47Z  
**Commit:** 0f69065  
**Focus:** Error handling — timeout, abort, rate-limit, HTTP errors

---

## CRITICAL

### 1. AbortError not caught — user sees raw DOMException
`src/services/api.ts:55-59` — When `controller.abort()` fires (10s timeout or hook cleanup), `fetch()` throws a `DOMException` with message "The user aborted a request." The hook catch at `src/hooks/useMatchData.ts:76` passes this straight to `setError()`. User sees "The user aborted a request" instead of a clean timeout message.

**Fix:** Catch `AbortError` specifically in `fetchAPIData` and throw a clear timeout error:
```ts
catch (err) {
  if (err instanceof DOMException && err.name === 'AbortError') {
    throw new Error(`API timeout for ${endpoint} after ${FETCH_TIMEOUT}ms`);
  }
  throw err;
}
```

### 2. No retry logic for any failure mode
`src/services/api.ts` — Every API call fails immediately on: network error, timeout, 4xx, 5xx, rate limit. No retry for transient failures (429, 503, network blip). User must manually re-submit.

For a mobile-first app hitting a third-party API (SPL Torneopal), this is aggressive. A single network hiccup kills the entire page load.

### 3. Silent data loss in batchFetch
`src/services/api.ts:84-92` — `batchFetch` returns `undefined` for failed items with zero indication of what failed. A 50-player match where 10 players fail silently shows only 40 players. No error, no warning, no count.

The hook at `src/hooks/useMatchData.ts:53` skips `undefined` players with `if (!playerData) continue;` — silently dropping them from the UI.

### 4. Race condition — abortRef not cleaned on unmount
`src/hooks/useMatchData.ts:21-23` — Cleanup sets `mountedRef.current = false` but never calls `abortRef.current?.abort()`. If the component unmounts mid-fetch, in-flight requests continue consuming bandwidth and the AbortController is leaked. The `mountedRef` check catches state updates, but the network request is still wasted.

---

## HIGH

### 5. Rate limiter never resets endpoint state
`src/services/api.ts:6` — `endpointLastCalls` is keyed by endpoint string. The pruning loop (line 23) only removes entries older than 60s. If the user navigates between pages rapidly, old endpoint entries accumulate. For a long SPA session, this dict grows unbounded — not just a memory leak, but also causes false rate-limit hits if the same endpoint name is reused with different param shapes.

### 6. Throttle delay applied unconditionally
`src/services/api.ts:44-46` — Every `fetchAPIData` call waits 100ms even if rate limit hasn't been hit. With `batchFetch(concurrency=5)` calling `getPlayerData` for 30 players, that's 6 batches × 100ms = 600ms of pure dead wait. The throttle should be conditional on actually needing to slow down, not a blanket delay.

### 7. 429 rate-limit response not handled specially
`src/services/api.ts:61-69` — If the upstream API returns HTTP 429 (rate limit), the code treats it like any other HTTP error. It should: (a) read the `Retry-After` header, (b) expose that info to the caller, (c) potentially auto-retry after the delay. Currently, a 429 just throws a generic error.

---

## MEDIUM

### 8. Error JSON parsing silently swallowed
`src/services/api.ts:68` — The `catch (e) { /* ignore */ }` at line 68 swallows JSON parse errors when reading error responses. While this is intentional (non-JSON error bodies), the empty catch means you lose diagnostic info about malformed error responses.

### 9. No offline detection
`src/services/api.ts` — No `navigator.onLine` check before fetching. On mobile (Finnish youth football = parents at games with spotty signal), every offline request burns through the 10s timeout before failing. A quick `if (!navigator.onLine) throw new Error('Ei internet-yhteyttä')` saves 10s of dead wait.

### 10. batchFetch concurrency not configurable per call-site
`src/services/api.ts:82` — `getPlayerData` hardcodes concurrency=5. For a 30-player match, that's 6 sequential batches. The upstream API rate limit for `getPlayer` is 50/min, so this is safe. But if concurrency were raised without checking limits, it would silently 429. The rate limiter and batch concurrency are not coordinated.

---

## LOW

### 11. Error message in Finnish in hook only
`src/hooks/useMatchData.ts:76` — The catch falls back to Finnish: `'Virhe ladattaessa tietoja'`. But the API errors from `api.ts` are in English (`API call to X failed. Status: Y`). Mixed language error messages are confusing for the target audience.

### 12. No error boundary around MatchPage
`src/pages/MatchPage.tsx` — If `useMatchData` throws during render (not just during fetch), there's no error boundary. A malformed API response that passes the `data.call.status` check but has unexpected shape will crash the page with no recovery.

---

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 4 | Must fix |
| HIGH | 3 | Should fix |
| MEDIUM | 3 | Nice to fix |
| LOW | 2 | Accepted risk |

**Verdict:** Core `fetchAPIData` has solid foundations (AbortController, response.ok, status check, rate limiter), but the error handling is brittle at the edges. The two biggest gaps are: (1) no retry for transient failures, and (2) silent data loss in `batchFetch`. The abort error propagation is the most user-visible bug — every timeout shows a confusing DOMException message.
