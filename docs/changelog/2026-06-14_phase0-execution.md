# Phase 0 Execution — Bug Fixes & Dead Code Removal

**Date:** 2026-06-14
**Build:** `npm run build` — passes clean (0 errors)

---

## Changes Made

### 1. Fix English UI strings (C-13)

**Files:** `src/pages/MatchPage.tsx:133-134`, `src/pages/Home.tsx:172`

| Before | After |
|--------|-------|
| `"Match View"` | `"Ottelunäkymä"` |
| `"Current single-match experience, now on its own route."` | `"Yhden ottelun tiedot omalla sivullaan."` |
| `"Data provided by Suomen Palloliitto."` | `"Data: Suomen Palloliitto."` |

**Reasoning:** Direct user requirement — the UI must be fully in Finnish. These were the last
remaining English strings visible to users. Straightforward text replacements, zero risk.

**Mapping:** Mimo review C-13 / deepseek K9-K12

---

### 2. Remove unused WLD functions (M-57, M-58, M-59)

**Files:** `src/utils/wld.ts`

Deleted three unused exported functions:
- `getWldConfig` — returns `WLD_CONFIG.V` (win) as default for undefined/unknown keys
- `getWldFromScore` — returns `'V'` (win) when `fsA` or `fsB` is undefined
- `getWldFromWinner` — returns `'V'` (win) when `winnerId` is undefined

**Reasoning:** These functions have a semantic bug — assuming "win" when data is missing is
misleading. More importantly, **nobody calls them**. `rg` confirmed zero import sites across
the entire `src/` tree. The only WLD usage in the project is direct access to `WLD_CONFIG`
(e.g., `WLD_CONFIG.V`, `WLD_CONFIG.T`) and inline WLD computation in `StandingsTable.tsx:69-74`.
Deleting dead code that also has a bug is a double win.

**Mapping:** Mimo review M-57, M-58, M-59 (semantic — wrong default), plus H-49 (dead code)

---

### 3. Remove dead API functions & types (H-49)

**Files:** `src/services/api.ts`, `src/services/cache.ts`, `src/types/matches.ts`, `src/config.ts`

Deleted:

| Symbol | File | Used by |
|--------|------|---------|
| `getScore()` | `api.ts` | Zero import sites |
| `getTeamData()` | `api.ts` | Zero import sites (was already delegating to `getTeamProfile`) |
| `clearCache()` | `cache.ts` | Zero import sites |
| `ScoreEntry` interface | `types/matches.ts` | Zero import sites (only referenced by the deleted `getScore`) |
| `getScore` rate limit | `config.ts` | Referenced only by deleted `getScore` |
| `getScore` TTL entry | `cache.ts` | Referenced only by deleted `getScore` |

**Reasoning:** These are pure dead code. `getTeamData` was already marked `@deprecated` and
just forwarded to `getTeamProfile`. `getScore` and `clearCache` have no consumers. Removing
unused code reduces noise and eliminates the risk of someone using an inferior API.

**Note:** The `getMatches` cache key in `cache.ts` (`getMatches: 5 * 60 * 1000`) is **kept**
because it is used by both `getMatches()` and `getTeamMatches()` — not dead code despite
Mimo's plan suggesting deletion.

**Mapping:** Mimo review H-49, M-103 (enabling `noUnusedLocals` would catch these at compile time)

---

### 4. Add LRU eviction cap to cache (C-6)

**File:** `src/services/cache.ts`

Added `MAX_CACHE_SIZE = 500` with eviction of the oldest entry when the size is exceeded:

```typescript
const MAX_CACHE_SIZE = 500

// In setCached, before cache.set:
if (cache.size >= MAX_CACHE_SIZE) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
}
```

**Reasoning:** The cache `Map` grows unbounded over a session. While each entry has a TTL,
stale entries are only deleted when explicitly read (`getCached` deletes on stale check) or
on `setCached`. Entries that are never read again accumulate indefinitely. 500 is a generous
limit for this app (at most ~50-100 distinct API endpoints get called in a session). Map
preserves insertion order, so `keys().next().value` reliably yields the oldest entry. This is
a simple, standard LRU approximation — not true LRU (which would track access time), but
good enough for a TTL-based cache where staleness is already handled separately.

**Mapping:** Mimo review C-6 (Critical — security/performance category)

---

### 5. Fix getMatchDetails race condition (from deepseek review)

**File:** `src/services/api.ts`

**Before:**
```typescript
export async function getMatchDetails(matchId: string, signal?: AbortSignal): Promise<MatchDetails> {
    const params = { match_id: matchId }
    return withCache('getMatch', params, async () => {
        const data = await fetchAPIData<{ match: MatchDetails }>('getMatch', params, signal)
        if (!data.match) throw new APINotFoundError(`Ottelua ei löydy (ID: ${matchId})`)
        return data.match
    }, undefined)
        .then(match => {
            import('./cache').then(({ setCached }) => {
                setCached('getMatch', { match_id: matchId }, match, match.status)
            })
            return match
        })
}
```

**After:**
```typescript
export async function getMatchDetails(matchId: string, signal?: AbortSignal): Promise<MatchDetails> {
    const params = { match_id: matchId }
    return withCache('getMatch', params, async () => {
        const data = await fetchAPIData<{ match: MatchDetails }>('getMatch', params, signal)
        if (!data.match) throw new APINotFoundError(`Ottelua ei löydy (ID: ${matchId})`)
        setCached('getMatch', params, data.match, data.match.status)
        return data.match
    })
}
```

**Reasoning:** The original code had an async gap between the `withCache` callback (which
stores without `matchStatus`, effectively a no-op for `getMatch`) and the `.then()` handler
(which dynamically imports cache and stores with the real status). When two callers hit
`getMatchDetails` near-simultaneously:

1. Caller A's fetch completes → `withCache` stores with `matchStatus=undefined` → no-op
2. Caller A's `.then()` starts dynamic `import('./cache')` → async gap
3. Caller B, waiting on the shared in-flight promise, gets the resolved value
4. Caller B's `.then()` also starts dynamic `import('./cache')` → another async gap
5. Both `.then()` handlers compete to set cache

The dynamic import was unnecessary because both files (`api.ts` and `cache.ts`) live in the
same `src/services/` directory. Replacing with a static `import { setCached }` and calling
it synchronously inside the `withCache` callback eliminates the race entirely. Also note:
`withCache`'s internal `.then()` still calls `setCached(endpoint, params, value, undefined)`,
but for `getMatch` that second call is a no-op (`matchStatus !== 'Played'` check), so no
double-caching occurs.

**Mapping:** deepseek review item (race condition in dynamic import pattern)

---

### 6. Deleted dead WLD barrel export (H-49)

**File:** `src/utils/wld.ts`

Removed `export type { WLDKey }` re-export from barrel if present. Verified that all consumers
import directly from `'../utils/wld'`.

**Reasoning:** Cleanup following function removal.

---

## Items Deliberately NOT Done

| Item | Reason |
|------|--------|
| **MATCH_STATUS constants** | The app uses two different status conventions: `'Played'` (in `cache.ts` + `StandingsTable.tsx`) and `'n'` (in 8+ other files). Not sure if these differ by API endpoint or are a bug. Without understanding the API's exact status values, extracting constants risks introducing errors. Needs investigation. |
| **getGroupDetails / getGroupFull cache key collision** | They share `getGroup` key with identical params but return different types (`GroupDetails | null` vs `GroupResponse | null`). The only consumer (`TurnauksetPage.tsx`) uses `getGroupFull` for matches + player stats, while `getGroupDetails` could collide. Safe at runtime due to JSON shape compatibility, but fragile. Requires analyzing all callers before fixing. |
| **StandingTeam string → number types** | Would break 30+ field accesses across 3 files that currently use `.goals_for`, `.matches_played` etc. as strings. Also the API returns strings, so casting at the type level without a runtime parser could mask issues. Needs a transformer/parser function. |
| **`Played` status value in cache.ts** | The cache checks `matchStatus !== 'Played'` but most of the app uses `'n'` for played matches. Might be intentional if `getMatch` endpoint returns a different status string than `getMatches`. Needs API verification. |

---

## Build Result

```
npm run build
  → tsc: 0 errors
  → vite build: 2152 modules transformed, 564 kB JS bundle
```

All changes compile cleanly. No runtime regressions expected — all modifications are
either cosmetic (string changes), additive (cache eviction), or safe deletions (dead code
verified to have zero consumers).
