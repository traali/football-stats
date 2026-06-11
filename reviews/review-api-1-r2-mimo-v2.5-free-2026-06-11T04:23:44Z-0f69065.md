# API Review — Round 2

**Model:** `opencode/mimo-v2.5-free`
**Date:** 2026-06-11T04:23:44Z
**Commit:** `0f69065`

---

## 1. Response Shape Mismatch — `fetchAPIData` returns raw API envelope, not unwrapped payload

**Severity:** HIGH
**Files:** `src/services/api.ts:39`, `src/services/api.ts:72-76`

`fetchAPIData<T>` receives the full JSON response (including `data.call.status`) but returns the whole object. The typed response `T` in `fetchAPIData<{ match: MatchDetails }>` describes only the *inner* structure, yet `data` (the full envelope) is returned as `T`. If the API ever nests data differently or adds fields, the cast is silently wrong.

Concrete consequence: `getMatchDetails` does `data.match` — this works only because the envelope has a `match` key. But `fetchAPIData` is generic and says "I return `T`" when it actually returns the full envelope. The generic `T` is a lie at the return statement on line 76 — it should be the envelope type, not the inner type.

**Fix:** Define an `APIEnvelope<T>` type: `{ call: { status: string }; data?: T }`. Return `Envelope<T>` from `fetchAPIData` and let callers do the unwrapping.

---

## 2. Index Signatures `[key: string]: unknown` Leak Type Safety

**Severity:** MEDIUM
**Files:** `src/types/api.ts:24,52,59,66,134,147`

`PlayerAPIResponse`, `Competition`, `Category`, `Season`, `DiscoveryMatch`, and `ScoreEntry` all have `[key: string]: unknown`. This means any accidental access on a misspelled property compiles without error and silently resolves to `undefined`. Combined with the optional fields, this creates a false sense of safety — the types say "shape is X" but arbitrary extra fields won't surface bugs at compile time.

**Fix:** Remove index signatures unless genuinely needed for dynamic keys. If extra API fields exist, add a single `[raw: Record<string, unknown>]` property instead.

---

## 3. `getGroupDetails` Returns `GroupDetails | null` While `getMatchDetails` Never Returns Null

**Severity:** MEDIUM
**Files:** `src/services/api.ts:95-99,101-109`

- `getMatchDetails` throws on missing data (line 97) — never null.
- `getGroupDetails` returns `data.group || null` — can be null.
- `getTeamData` can return null if input is falsy (line 112).

Callers like `useMatchData` treat `group` as nullable (line 14), `teamA`/`teamB` as nullable (line 15-16), but `match` as guaranteed non-null (line 12). This asymmetry is correct for `group` (API may not have standings), but `getTeamData` returns `null` only when `!teamId` — a condition that can never happen since `match.team_A_id` is a required string in `MatchDetails`. The null-return path is dead code but the consumer still checks for it.

**Inconsistency:** Why does `getMatchDetails` throw on missing `data.match` but `getGroupDetails` silently returns null on missing `data.group`? Same API envelope pattern, different failure semantics.

---

## 4. Optional Fields Used as Required in Downstream Code

**Severity:** HIGH
**Files:** `src/types/api.ts:119-135`, `src/hooks/useMatchData.ts:38-40`

`DiscoveryMatch` declares `team_A_id`, `team_B_id`, `competition_id`, `category_id`, `group_id` as optional. But in `useMatchData`:

```typescript
getGroupDetails(match.competition_id, match.category_id, match.group_id)  // all optional
getTeamData(match.team_A_id)  // optional
getTeamData(match.team_B_id)  // optional
```

`getGroupDetails` and `getTeamData` accept `string` parameters, not `string | undefined`. TypeScript should error here — yet `getGroupDetails` internally calls `fetchAPIData` with `Record<string, string | number | boolean | undefined>`, so the params silently pass through as `undefined` in the query string, which gets cleaned to `""` by the param filter. This means the API receives empty values for missing IDs and returns wrong data or errors at runtime rather than compile time.

---

## 5. `parseInt(match.player_goals ?? "")` — Fragile Numeric Parsing

**Severity:** LOW
**Files:** `src/utils/dataProcessors.ts:40-42`

```typescript
const goals = parseInt(match.player_goals ?? "") || 0;
```

`parseInt("")` returns `NaN`, caught by `|| 0`. But `parseInt` with no radix defaults to base 10 for most cases but can be confused by leading zeros. More critically, if the API returns `"1.5"` or `"1,000"`, `parseInt` silently truncates. The `??` fallback to `""` means null/undefined fields produce `0`, which is correct, but the code relies on `NaN || 0` coercion rather than explicit handling.

---

## 6. `MatchSummary` Has All Fields Required — Realistic?

**Severity:** MEDIUM
**Files:** `src/types/api.ts:104-117`

`MatchSummary` (used inside `GroupDetails.matches`) declares every field as required: `match_id`, `date`, `time`, `team_A_id`, `team_B_id`, `team_A_name`, `team_B_name`, `fs_A`, `fs_B`, `winner_id`, `status`. But `MatchDetails` (the full match object) makes `fs_A`/`fs_B`/`time`/`winner_id` optional. The API returns the same match data — why would a summary have stricter requirements? If any summary match has a missing score or time, this type is wrong.

---

## 7. `StandingTeam` All-Strings Typing Assumes Consistent API Format

**Severity:** LOW
**Files:** `src/types/api.ts:90-102`

Every field in `StandingTeam` is `string` — including numeric fields like `matches_played`, `goals_for`, `points`. The `StandingsTable` component (line 5) does `parseInt(a.current_standing)` with a fallback, acknowledging the value might not parse. If the API ever returns a number or null instead of a string, the parsing breaks silently.

---

## 8. `getCompetitions`/`getCategories`/`getMatches`/`getScore`/`getSeasons` — Empty-Array Default Masks API Failure

**Severity:** LOW
**Files:** `src/services/api.ts:122-148`

All five list-fetching functions return `data.X || []`, defaulting to empty array on missing data. This is intentional resilience, but combined with the optional keys (`competitions?`, `categories?`, etc.), it means a changed API key name (e.g., `"competitions_list"` instead of `"competitions"`) silently returns an empty array instead of surfacing a bug. No logging, no warning.

---

## 9. `PlayerAPIResponse.matches` — No Null/Empty Guard at Type Level

**Severity:** MEDIUM
**Files:** `src/types/api.ts:18-25`

`PlayerAPIResponse.matches` is typed as `PlayerMatchEntry[]` (required), but `processPlayerMatchHistory` (line 37) defensively checks `if (!matches)` before iterating. The type says it's always present, but the code doesn't trust it. Either the type is wrong (should be `matches?: PlayerMatchEntry[]`) or the null check is dead code.

---

## Summary

| # | Finding | Severity |
|---|---------|----------|
| 1 | `fetchAPIData` returns full envelope but generic says inner type | HIGH |
| 2 | Index signatures `[key: string]: unknown` leak type safety | MEDIUM |
| 3 | Inconsistent null-return semantics across API functions | MEDIUM |
| 4 | Optional IDs passed as required strings — runtime breakage | HIGH |
| 5 | `parseInt` fragile parsing of string fields | LOW |
| 6 | `MatchSummary` overly strict vs `MatchDetails` optional fields | MEDIUM |
| 7 | `StandingTeam` all-string typing fragile | LOW |
| 8 | Empty-array defaults mask API key renames | LOW |
| 9 | `PlayerAPIResponse.matches` type contradicts runtime null check | MEDIUM |
