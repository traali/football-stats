# API Error Handling Review

## CRITICAL: `batchFetch` uses `Promise.all` — one failure kills the whole batch
- **File**: `src/services/api.ts` :83
- **Issue**: `Promise.all` fails fast: if any single `getPlayerData` call rejects, the entire batch is lost and the error propagates up. In `useMatchData.ts:33`, this means a single player API failure prevents rendering the entire match page — all players, standings, etc.
- **Suggestion**: Replace `Promise.all` with `Promise.allSettled` in `batchFetch`. Filter for `fulfilled` results; for `rejected` entries, push a `null` placeholder (callers must handle `T | null`). This gracefully degrades when a subset of player data is unavailable.

## WARNING: `clearTimeout` not reached on fetch rejection
- **File**: `src/services/api.ts` :52–55
- **Issue**: `clearTimeout(timeoutId)` sits after `await fetch(...)` on line 55. If `fetch` throws (network error, DNS failure, abort), execution jumps to the caller's catch block and the timeout is never cleared. The stale timer fires `controller.abort()` on an already-settled controller (no-op), so it's not dangerous — but it is a minor leak per failed request.
- **Suggestion**: Move `clearTimeout` into a `finally` block so it always runs, or use `const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);` with `fetch(url, { signal })` and then `clearTimeout` after `fetch` completes — but wrap in try/finally.

## WARNING: Rate-limit error message is in English
- **File**: `src/services/api.ts` :41
- **Issue**: `"Rate limit exceeded for ${endpoint}. Please try again in a moment."` is English. The rest of the UI is Finnish (placeholders like `"Match ID (esim. 3760372)"`, error fallback `"Virhe ladattaessa tietoja"`).
- **Suggestion**: Use Finnish: `"Ylitettiin rajapinnan kutsuraja päätepisteelle ${endpoint}. Yritä hetken kuluttua uudelleen."`

## WARNING: HTTP-level API error messages are in English
- **File**: `src/services/api.ts` :58, :70, :91
- **Issue**: Lines 58 (`"API call to ${endpoint} failed. Status: ${response.status}"`), 70 (`"API error for ${endpoint}: ${data?.call?.status || 'unknown'}"`), and 91 (`"Match data is invalid for match ID ${matchId}."`) all produce English messages shown directly to users.
- **Suggestion**: Translate to Finnish, e.g., `"API-kutsu päätepisteelle ${endpoint} epäonnistui. Status: ${response.status}"`, `"API-virhe päätepisteelle ${endpoint}: ${data?.call?.status || 'tuntematon'}"`, `"Ottelun data on virheellinen ottelulle ${matchId}."`.

## INFO: `catch (e) { /* ignore */ }` is safe but blind
- **File**: `src/services/api.ts` :64
- **Issue**: When `response.json()` on an error response fails (non-JSON body), the parse error is silently swallowed. The primary error text (status code) is preserved, so the user does get actionable info. However, debugging server-side issues becomes harder.
- **Suggestion**: Add `console.warn('Failed to parse API error body:', e)` in development builds so the parse failure is visible in devtools without affecting production UX.

## INFO: No React Error Boundary wraps the app
- **File**: `src/routes.tsx` :19, `src/App.tsx` :4–6
- **Issue**: The router has `errorElement: <NotFound />` which catches route-level render errors, but there is no `<ErrorBoundary>` component wrapping the app tree. Unhandled render errors outside the router's scope (e.g., in a child of `Layout`) would propagate without a graceful UI fallback.
- **Suggestion**: Add a React Error Boundary (class-based `componentDidCatch`) in `Layout` or wrap `RouterProvider` in `App.tsx`, showing a generic "Jotain meni pieleen" fallback with a retry button.
