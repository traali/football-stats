## CRITICAL: `data?.players.filter()` crashes when `data` is null
- **File**: `src/pages/MatchPage.tsx` :33-34
- **Issue**: `const teamAPlayers = data?.players.filter(p => p.teamIdInMatch === data.match.team_A_id)` — optional chaining on `data` short-circuits to `undefined` when `data` is `null`, then `.filter()` is called on `undefined`, throwing `TypeError`. The `|| []` fallback never executes because the throw happens before it. This is a guaranteed crash on every initial render (state initializes as `null`).
- **Suggestion**: Change to `data && data.players.filter(...)` or `data?.players?.filter(...) || []` and use `data?.match?.team_A_id` for the inner access. Guard must be robust against null data.

## WARNING: Unsafe `as PlayerStats` cast in player processing
- **File**: `src/hooks/useMatchData.ts` :55
- **Issue**: The object spread from `ProcessedStats` + `lineupInfo` fields is cast with `as PlayerStats`. This suppresses all structural type checks. If `PlayerStats` gains a new required field (e.g., `clubCrest` or `finland_raised` which exist as optional but are never set), or `ProcessedStats` changes shape at runtime, this cast masks the mismatch.
- **Suggestion**: Remove the `as` cast and type the return value properly. Better: construct a typed `PlayerStats` object explicitly so the compiler validates every field, or narrow the return type of the map callback.

## WARNING: `any[]` leak from API response through player pipeline
- **File**: `src/types/api.ts` :6 → `src/utils/dataProcessors.ts` :19 → `src/hooks/useMatchData.ts` :37
- **Issue**: `PlayerAPIResponse.matches` is typed as `any[]`. This flows unsafely into `processPlayerMatchHistory(matches: any[])`, which accesses `match.player_goals`, `match.team_name`, `match.season_id`, `match.status`, `match.winner_id`, etc. with zero type safety. A malformed API response silently produces garbage stats or runtime errors inside the processor.
- **Suggestion**: Define a `PlayerAPIMatch` interface with known fields (`player_goals`, `player_warnings`, `team_name`, `season_id`, `status`, etc.) and type the API response as `matches: PlayerAPIMatch[]`. Validate/normalize at the processor boundary.

## WARNING: `fetchAPIApiData` params leaks `any` into API layer
- **File**: `src/services/api.ts` :39
- **Issue**: `fetchAPIApiData<T>(endpoint: string, params: Record<string, any>)` uses `any` for param values. Every caller passes untyped objects; no compiler check prevents wrong param names or types. This is mostly a hygiene issue for this codebase since param shapes are loose, but it means typos like `match_id` vs `matchId` aren't caught.
- **Suggestion**: Use `Record<string, string>` or define per-endpoint param interfaces to surface mismatches at compile time.

## INFO: `processPlayerMatchHistory` has inconsistent null handling
- **File**: `src/utils/dataProcessors.ts` :37-38
- **Issue**: `if (!matches) return { ...stats, teamsThisYear: "" }` guards against null/undefined, but the function signature accepts `matches: any[]`, implying it's always an array. The null guard returns a valid partial result, but the caller in useMatchData.ts:37 receives no signal that data was missing (no error thrown).
- **Suggestion**: Either make the parameter `matches: any[] | null | undefined` to reflect reality, or throw on null so the hook's error boundary catches the issue instead of silently returning zeroed stats.
