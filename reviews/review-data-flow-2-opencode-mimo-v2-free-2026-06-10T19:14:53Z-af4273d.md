# Data Flow Review: opencode/mimo-v2-free

## CRITICAL: Race Condition — No Fetch Cancellation
- **File**: `src/hooks/useMatchData.ts` :19-64
- **Issue**: When `matchId` changes rapidly (e.g., user navigates between matches or types quickly), multiple `fetchData` calls run concurrently. No AbortController is passed to the API calls, so the first (stale) response can overwrite the second (current) response if it resolves later. The hook uses `useCallback` with empty deps but doesn't cancel in-flight requests.
- **Suggestion**: Add an `AbortController` ref that is created on each `fetchData` invocation and aborted when a new call starts. Pass the signal through `fetchAPIData` → `fetch()`.

## CRITICAL: Error and Loading Can Display Simultaneously
- **File**: `src/pages/MatchPage.tsx` :71-101
- **Issue**: The `AnimatePresence` renders both `{error && ...}` and `{loading && ...}` blocks without mutual exclusion. After an error, `error` remains non-null while a new `fetchData` sets `loading=true`. The UI shows the error banner AND the loading skeleton simultaneously — a flash of contradictory state.
- **Suggestion**: Use a mutually exclusive state pattern. Either clear `error` when `loading` starts, or conditionally render: show skeleton only when `loading && !error && !data`, show error only when `error && !loading`.

## WARNING: Stale Data Flash on Navigation
- **File**: `src/hooks/useMatchData.ts` :19-21, `src/pages/MatchPage.tsx` :19-24
- **Issue**: `fetchData` sets `setLoading(true)` but doesn't clear `data` until the try/catch block. During the brief window where `loading=true` and `data` is still the previous match's data, the `{data ? ...}` block in `MatchPage.tsx` renders the old match's content with the new loading skeleton beneath it. Users see a flash of stale match data.
- **Suggestion**: Set `setData(null)` immediately when `fetchData` begins (before the API calls), or render content only when `loading && !data`.

## WARNING: batchFetch Fails Entirely on Any Single Failure
- **File**: `src/services/api.ts` :75-87
- **Issue**: `batchFetch` uses `Promise.all`, so if any single player fetch fails (rate limit, timeout, network blip), the entire `fetchData` call fails and the user sees a generic error. One flaky player endpoint shouldn't prevent the entire match from loading.
- **Suggestion**: Use `Promise.allSettled` and filter/handle rejected items individually, or implement a retry per-batch with a fallback to partial results.

## WARNING: No Revalidation / Stale-While-Revalidate Pattern
- **File**: `src/hooks/useMatchData.ts` :8-68
- **Issue**: The hook has no concept of revalidation. Once data is loaded, there is no mechanism to refresh it (e.g., when the user navigates back, or if live data needs updating). If a user navigates away and back, `useEffect` fires again with the same `matchId`, but `data` is still the old hook-level state — it shows stale data until the new fetch resolves. There's also no deduplication of concurrent requests for the same matchId.
- **Suggestion**: Implement a stale-while-revalidate pattern: keep existing `data` visible while fetching in background, or at minimum clear data on matchId change to avoid stale flash.

## WARNING: Empty `playerIds` Triggers Unnecessary batchFetch
- **File**: `src/hooks/useMatchData.ts` :31-33
- **Issue**: If `match.lineups` is empty or undefined, `playerIds` is `[]` and `batchFetch([], getPlayerData, 5)` is called. This returns `[]` and the processing loop produces zero players — silently showing an empty player list without any indication that the match has no lineup data vs. a data fetch failure.
- **Suggestion**: Guard against empty lineups. If `playersInMatch.length === 0`, either skip the batch fetch or set a meaningful empty state so the UI can show "No lineup data available."

## INFO: Image Error Handler Swallows Error Silently
- **File**: `src/components/PlayerCard.tsx` :34
- **Issue**: `onError={(e) => (e.currentTarget.style.display = 'none')}` hides broken images by setting display to none. This creates a layout shift where the avatar container collapses. The fallback `<User />` placeholder is never shown because the element is hidden rather than replaced.
- **Suggestion**: Use React state to toggle between `<img>` and the placeholder `<User />` component on error, avoiding layout shift.

## INFO: MatchPage Doesn't Handle Invalid matchId Param
- **File**: `src/pages/MatchPage.tsx` :14
- **Issue**: `matchId` defaults to `''` via destructuring. If the URL is `/match/` (trailing slash), `matchId` is empty and `fetchData('')` is called. `getMatchDetails('')` will hit the API with an invalid ID and throw, but the error message won't be user-friendly ("API call to getMatch failed. Status: 400").
- **Suggestion**: Validate `matchId` format before calling `fetchData`, and show a specific "Invalid match ID" message in the UI.

## INFO: Data Not Cleared Between Match Transitions
- **File**: `src/hooks/useMatchData.ts` :58
- **Issue**: `setData(...)` only sets new data on success. On error, `setData(null)` is called. But on the happy path, old `data` persists until the new data arrives. Combined with `AnimatePresence mode="wait"`, the transition shows the old data exiting then new data entering — but during the fetch, the old data is visible.
- **Suggestion**: Call `setData(null)` at the start of `fetchData` to ensure a clean slate, then the loading skeleton renders properly without stale data underneath.
