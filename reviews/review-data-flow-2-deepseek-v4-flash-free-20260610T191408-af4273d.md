## CRITICAL: Stale data visible during loading when matchId changes
- **File**: `src/hooks/useMatchData.ts` :9-17
- **Issue**: `fetchData` sets `loading(true)` and `error(null)` but does **not** clear `data`. In `MatchPage.tsx:71-176`, the `loading` and `data` blocks are sibling conditions — when `loading` becomes `true` after a new `matchId` is submitted, `data` still holds the previous match's data, so **both** the skeleton AND the old match content render simultaneously. This is a flash of wrong/stale content.
- **Suggestion**: Call `setData(null)` at the top of `fetchData`, before `setLoading(true)`, so old data is cleared immediately when a new fetch starts.

## CRITICAL: Race condition — no stale request discarding
- **File**: `src/hooks/useMatchData.ts` :19-65
- **Issue**: No `AbortController` or stale-request tracking. If `matchId` changes twice in quick succession (e.g. user types two IDs rapidly), both fetches run concurrently. Whichever resolves last wins — **not** necessarily the latest `matchId`. This can show data for a wrong match.
- **Suggestion**: Use a ref (`React.useRef<AbortController>`) to abort in-flight requests before starting a new one, or use an incrementing counter to discard responses from stale invocations.

## CRITICAL: No useEffect cleanup — state updates on unmounted component
- **File**: `src/pages/MatchPage.tsx` :19-24
- **Issue**: The `useEffect` that calls `fetchData` has no cleanup function. If the component unmounts while a fetch is in-flight, `setData`/`setError`/`setLoading` will execute on an unmounted component (React warning, and potential memory/state leak).
- **Suggestion**: Add a cleanup boolean or abort the controller in the effect's cleanup.

## WARNING: No retry mechanism on error
- **File**: `src/pages/MatchPage.tsx` :71-79
- **Issue**: The error block displays the error message in a styled div but offers no retry button or action. The user must manually re-submit the match ID.
- **Suggestion**: Add a "Yritä uudelleen" (Retry) button inside the error block that calls `fetchData(matchId)` again.

## INFO: Empty state is meaningful
- **File**: `src/pages/MatchPage.tsx` :167-176
- **Issue**: (Positive finding) The empty state shows "Syötä ottelun ID avataksesi ottelusivun." — a clear, user-friendly instruction. No change needed.

## INFO: Loading shows skeletons
- **File**: `src/pages/MatchPage.tsx` :82-101
- **Issue**: (Positive finding) Loading state renders `MatchHeaderSkeleton`, `PlayerCardSkeleton`, and `StandingsTableSkeleton` — all three main content areas have corresponding skeleton placeholders. No change needed.

## WARNING: PlayerCardSkeleton count hardcoded
- **File**: `src/pages/MatchPage.tsx` :92-95
- **Issue**: Only 2 `PlayerCardSkeleton` instances are rendered, but a real match could have 11+ players per team. The mismatch between skeleton count and actual content height/scroll position causes visual jank when real cards replace skeletons.
- **Suggestion**: Render a dynamic number of skeletons proportional to typical lineup size (e.g. 6-8), or add a `repeat` prop to `PlayerCardSkeleton`.

## WARNING: Error message may contain unfriendly raw text
- **File**: `src/hooks/useMatchData.ts` :60
- **Issue**: The error is set as `err instanceof Error ? err.message : 'Virhe ladattaessa tietoja'`. Network errors or API 4xx/5xx responses may leak technical messages (e.g. "Failed to fetch", JSON parse errors) that are not user-friendly.
- **Suggestion**: Map known error types to user-friendly Finnish messages (e.g. "Palvelin ei vastaa — tarkista verkkoyhteys." for network errors, "Ottelua ei löydy." for 404s).
