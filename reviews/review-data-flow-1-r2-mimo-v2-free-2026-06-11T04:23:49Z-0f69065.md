# Data-Flow Review Round 2

**Model:** mimo-v2-free  
**Date:** 2026-06-11T04:23:49Z  
**SHA:** 0f69065  
**Focus:** API→hook→component data paths, `any` leaks, type narrowing

---

## Data Flow Map

```
fetchAPIData<T> ──→ getMatchDetails ──→ useMatchData.fetchData ──→ MatchPage
                  ──→ getGroupDetails ──→ useMatchData.fetchData ──→ StandingsTable
                  ──→ getTeamData ──→ useMatchData.fetchData ──→ MatchHeader
                  ──→ getPlayerData ──→ batchFetch ──→ processPlayerMatchHistory ──→ PlayerCard
```

## Findings

### CRITICAL: None

### HIGH

**H1. `api.ts:72` — `response.json()` implicitly `any`, no runtime validation**
`fetchAPIData<T>` parses `const data = await response.json()` (inferred `any`), then returns `data` as `T`. The generic provides compile-time safety but zero runtime validation. If the API shape drifts, the crash surfaces deep in a component, not at the boundary. A zod/io-ts schema per endpoint would catch this at the API layer.

**H2. `api.ts:64-66` — Error-path response parsing is untyped**
```ts
const errorData = await response.json(); // any
if (errorData && (errorData.error || errorData.message)) {
    errorText += ` - ${errorData.error?.message || errorData.message}`;
}
```
`errorData` is implicitly `any`. Works, but a malformed error response would silently pass through. Low blast radius since it's a string concatenation in a catch block, but still a type hole.

### MEDIUM

**M1. Six `[key: string]: unknown` index signatures dilute type contracts**
`api.ts:24,52,59,66,134,146` — `PlayerAPIResponse`, `Competition`, `Category`, `Season`, `DiscoveryMatch`, `ScoreEntry` all have index signatures. Any accidental property access compiles silently:
```ts
const x: Competition = ...;
x.nonexistent_field; // compiles, returns unknown
```
Consider removing index signatures and using `Pick<>` or explicit optional fields for known API extras.

**M2. `api.ts:89` — `batchFetch` silently swallows errors into `undefined`**
```ts
results.push(r.status === 'fulfilled' ? r.value : undefined)
```
A rejected player fetch produces `undefined` at that index. The hook (`useMatchData.ts:53`) handles this with `if (!playerData) continue`, so it's safe — but a failed player is silently dropped with no logging. In a 22-player lineup, one failed fetch means a missing card with no user feedback.

**M3. `dataProcessors.ts:63` — Comparison relies on `string | undefined` equality**
```ts
if (match.team_A_name === teamNameForContext || match.team_A_id === match.team_id)
```
`match.team_A_id` and `match.team_id` are both `string | undefined` from `PlayerMatchEntry`. If both are `undefined`, the condition is `true` (falsy-falsy equality), which could misroute opponent name resolution. Should be `match.team_A_id != null && match.team_A_id === match.team_id`.

### LOW

**L1. `MatchPage.tsx:115` — `Number(data.match.fs_A || 0)` double conversion**
`fs_A` is `string | undefined`. `fs_A || 0` coerces `undefined` → `0`, then `Number(0)` → `0`. Works but redundant; `Number(data.match.fs_A ?? 0)` is cleaner.

**L2. `useMatchData.ts:67` — Captain check is string literal comparison**
`lineupInfo.captain === "1"` is correct per API contract, but brittle if API ever returns `"true"` or `1`. Minor.

**L3. `StandingsTable.tsx:5` — `parseInt` fallback to 999**
`parseInt(a.current_standing) || 999` — correct for sorting, but 999 as sentinel is undocumented.

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 2 |
| Medium | 3 |
| Low | 3 |

**No `any` leaks found in application code.** The codebase uses `unknown` for error catch blocks (`useMatchData.ts:75`) and index signatures. The only implicit `any` is `response.json()` in `api.ts` (lines 64, 72) which is a standard TypeScript limitation.

**Type narrowing is correct** throughout the hook→component path. The `if (!playerData) continue` guard in `useMatchData.ts:53` properly narrows `PlayerAPIResponse | undefined` to `PlayerAPIResponse`. Optional chaining and nullish coalescing are used consistently.

**Recommendation:** Add runtime response validation at the `fetchAPIData` boundary (H1) and log dropped players in `batchFetch` (M2).
