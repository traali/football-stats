# Data Flow Review R2: opencode/mimo-v2-5-free

**Focus**: State lifecycle — loading→empty→error→data→revalidate. Missing states? Flash of wrong content?

---

## CRITICAL: Catch Block Lacks Abort Guard — Stale Error Leaks Into New Fetch

- **File**: `src/hooks/useMatchData.ts:75-77`
- **Issue**: The catch block does not check `controller.signal.aborted || !mountedRef.current`. When `fetchData("match-2")` starts and clears error at line 32, the OLD `fetchData("match-1")` promise chain can still reject (rate limit, 404, network error). The old catch runs in a separate microtask and calls `setError("old error")`, overwriting the cleared state. React 18 renders this as: `data=null, loading=true, error="old error"` — the user sees a skeleton AND an error banner simultaneously for a brief flash.
- **Reproduction**: Navigate to a valid match → navigate to an invalid match ID → while the first request is in flight, the old request fails → flash of error+loading.
- **Suggestion**: Add `if (controller.signal.aborted || !mountedRef.current) return;` as the first line inside the catch block.

## CRITICAL: AbortController Never Passed to HTTP Layer — Requests Cannot Be Cancelled

- **File**: `src/hooks/useMatchData.ts:27-28`, `src/services/api.ts:55-58`
- **Issue**: `useMatchData` creates an `AbortController` and aborts it on re-invocation (line 26), but its `signal` is never passed to `fetchAPIData` → `fetch()`. The API layer creates its OWN `AbortController` with a 10s timeout (api.ts:55-56). When the user navigates rapidly between matches, ALL old HTTP requests continue running until they time out or succeed. The abort checks at lines 35/42/47 prevent stale state updates, but bandwidth and API quota are wasted. Worse: if a stale request hits the rate limiter, it throws, and the catch block (see CRITICAL #1 above) leaks the error.
- **Suggestion**: Pass the abort signal from `useMatchData` through to `fetchAPIData` so `fetch()` receives it: `fetch(url, { signal: controller.signal })`. Or accept an optional signal parameter in `fetchAPIData`.

## WARNING: Empty Lineups Produce Silent Empty Player List

- **File**: `src/hooks/useMatchData.ts:44-46`
- **Issue**: If `match.lineups` is `undefined` or `[]`, `playerIds` becomes `[]`, `batchFetch([], ...)` returns `[]`, and the processing loop produces zero `PlayerStats`. The UI renders team headers (`data.match.team_A_name`, `data.match.team_B_name`) with zero player cards beneath them. There is no visual distinction between "match has no lineup data" and "all player fetches failed" and "match genuinely has 0 players."
- **Suggestion**: Guard: `if (playersInMatch.length === 0) { setData({ match, group, players: [], teamA, teamB }); return; }` and add a UI element: "Ei pelikoosteita saatavilla" when `players.length === 0`.

## WARNING: Group Fetch Failure Silently Removes Standings Table

- **File**: `src/hooks/useMatchData.ts:37-41`, `src/pages/MatchPage.tsx:157`
- **Issue**: `getGroupDetails` returns `null` on failure (api.ts:108: `return data.group || null`). `data.group` is set to `null`. In MatchPage, the standings section is guarded by `{data.group && <StandingsTable>}` — so when group is null, the entire standings column vanishes with no explanation. The user sees a two-column layout that collapses to a single column with no indication that standings data failed to load.
- **Suggestion**: Either show a degraded standings placeholder ("Sarjatietoja ei saatavilla") when `data.group === null`, or propagate a partial error so the UI can distinguish "group doesn't exist" from "group fetch failed."

## WARNING: matchId='' From URL Params Triggers Invalid API Call

- **File**: `src/pages/MatchPage.tsx:14`, `src/hooks/useMatchData.ts:25`
- **Issue**: `useParams()` returns `matchId = ''` when the URL is `/match/` (trailing slash) or `/match`. `fetchData('')` is called, which calls `getMatchDetails('')`, which hits `getMatch?match_id=`. The API returns a 400 or error response. The error message displayed is the raw API error: "API call to getMatch failed. Status: 400" — not user-friendly.
- **Suggestion**: Validate `matchId` before calling `fetchData`: `if (!matchId.trim()) return;` in the useEffect, and show "Virheellinen ottelun ID" in the UI.

## WARNING: Player Image onError Hides Element Instead of Swapping to Fallback

- **File**: `src/components/PlayerCard.tsx:34`
- **Issue**: `onError={(e) => (e.currentTarget.style.display = 'none')}` sets `display: none` on the `<img>`. The React ternary `stats.img_url ? <img .../> : <div>...User placeholder...</div>` never renders the `<User />` fallback because the `<img>` element still exists in the DOM (just hidden). This causes: (1) layout shift as the 16x16 avatar container collapses, (2) the placeholder never appears, leaving a gap in the player card header.
- **Suggestion**: Use React state: `const [imgError, setImgError] = useState(false)` and render `{!imgError && stats.img_url ? <img onError={() => setImgError(true)} /> : <User placeholder />}`.

## WARNING: No Deduplication of Concurrent Requests for Same matchId

- **File**: `src/hooks/useMatchData.ts:25-81`
- **Issue**: If `fetchData("123")` is called twice rapidly (e.g., React StrictMode in dev, or double-click on search), both calls run concurrently. Both will succeed and both will call `setData(...)`. The second call's `abortRef.current?.abort()` only aborts the FIRST controller — but since neither controller's signal is passed to the HTTP layer, both requests complete. The second call's data overwrites the first (correct order), but both sets of player data are fetched (wasted API calls, wasted quota).
- **Suggestion**: Add a `lastFetchIdRef` that increments on each `fetchData` call. In the finally block, check `if (fetchId !== lastFetchIdRef.current) return` to prevent the older call from committing state.

## WARNING: Rate Limit Error Message Is Not User-Consumable

- **File**: `src/services/api.ts:41`
- **Issue**: `throw new Error("Rate limit exceeded for ${endpoint}. Please try again in a moment.")` — the endpoint string (e.g., `getMatch`, `getPlayer`) is exposed to the user. The error message is technical and confusing.
- **Suggestion**: Return a generic user-facing message: "Palvelun käyttöraja täynnä. Yritä hetken päästä uudelleen."

## INFO: batchFetch Returns undefined for Failed Items — Silently Skipped in Processing

- **File**: `src/services/api.ts:89`, `src/hooks/useMatchData.ts:53`
- **Issue**: `batchFetch` uses `Promise.allSettled` and pushes `undefined` for rejected items. In `useMatchData`, line 53: `if (!playerData) continue;` silently skips failed player fetches. The player is absent from the final list with no indication. This is acceptable for individual player failures but could mask systematic issues (e.g., all player fetches failing due to rate limit).
- **Suggestion**: Track skipped player count and add a banner: "Osan pelaajatiedoista lataaminen epäonnistui" when `skipped > 0`.

## INFO: `data.group` Null vs Undefined Ambiguity

- **File**: `src/hooks/useMatchData.ts:37-41`, `src/types/api.ts:81`
- **Issue**: `getGroupDetails` returns `null` on failure. The `data` state types `group` as `GroupDetails | null`. In MatchPage, `data.group && <StandingsTable>` treats both `null` and `undefined` as falsy. But there's a semantic difference: `null` = "fetch failed", `undefined` = "not yet fetched" (impossible here since group is always fetched). The `null` return from `getGroupDetails` is intentional but the UI treats it identically to "group doesn't exist in the API response."
- **Suggestion**: Use a discriminated union or explicit status field if you need to distinguish "fetch failed" from "group doesn't exist."

---

## State Lifecycle Trace

```
Initial:       loading=false, error=null, data=null          → Empty state ("Syötä ottelun ID...")
fetchData() →  loading=true,  error=null, data=null          → Skeleton
  success:     loading=false, error=null, data={...}         → Content
  failure:     loading=false, error=msg,  data=null          → Error banner + empty state
  abort (new):  loading=true,  error=null, data=null          → Skeleton (error cleared ✓)
  stale catch:  loading=true,  error=old,  data=null          → Skeleton + Error banner ✗ (CRITICAL)
re-navigate:   Same as fetchData() flow
unmount:       mountedRef prevents stale commits ✓
```

**R1 Fixes Verified**: ✅ AbortController + signal checks (lines 26,35,42,47), ✅ `setData(null)` at fetch start (line 30), ✅ `Promise.allSettled` in batchFetch (line 87), ✅ Error cleared when loading starts (line 32).

**R1 Issues Still Present**: ⚠️ Catch block abort guard (CRITICAL #1 — worsened by R1's abort check being only in success path).
