# Code Review — Round 2

**Model:** `opencode/mimo-v2.5-free`
**Date:** 2026-06-11T04-23:46Z
**SHA:** `0f69065`
**Scope:** TS strictness, missing types, `any` usage, unused imports, component prop safety

---

## Verdict: Clean codebase. Zero `any`, zero `@ts-ignore`, strict mode enabled. Below are aggressive findings.

---

## 1. Unused / Incorrect Import Modality (4 issues)

| File | Line | Issue |
|------|------|-------|
| `src/hooks/useMatchData.ts` | 5 | `import { PlayerLineupInfo }` — only used as type annotation. Should be `import type`. |
| `src/components/MatchHeader.tsx` | 1 | `import { MatchDetails, GroupDetails, TeamBasic }` — all used as types only. Should be `import type`. |
| `src/components/PlayerCard.tsx` | 2 | `import { PlayerStats }` — type-only usage in props. Should be `import type`. |
| `src/components/StandingsTable.tsx` | 1 | `import { GroupDetails }` — type-only usage in props. Should be `import type`. |

**Impact:** Value imports of interfaces generate runtime import statements. In a bundler-optimized build this is dead code that increases bundle size.

---

## 2. Duplicated `cn()` Utility (5 locations)

| File | Line |
|------|------|
| `src/components/Button.tsx` | 6 |
| `src/components/PlayerCard.tsx` | 8 |
| `src/components/StatBadge.tsx` | 5 |
| `src/components/BottomNav.tsx` | 6 |
| `src/components/Skeleton.tsx` | 4 |

**Fix:** Extract to `src/lib/cn.ts` and import. Five identical copies is a maintenance liability.

---

## 3. Unsafe Type Assertions (2 issues)

| File | Line | Code |
|------|------|------|
| `src/services/api.ts` | 135 | `params as Record<string, string \| number \| boolean \| undefined>` |
| `src/services/api.ts` | 140 | `params as Record<string, string \| number \| boolean \| undefined>` |

**Why:** `GetMatchesParams` values are `string | undefined`, but `as` cast widens to include `number | boolean`. If caller passes a non-string, runtime breaks silently. Should use a typed helper or constrain the cast.

---

## 4. Silent Catch with Unused Variable

| File | Line | Code |
|------|------|------|
| `src/services/api.ts` | 68 | `catch (e) { /* ignore */ }` |

**Fix:** Rename to `_e` or use bare `catch { }` (ES2019+) to signal intentional discard.

---

## 5. Unconstrained Generic on `fetchAPIData`

| File | Line |
|------|------|
| `src/services/api.ts` | 39 |

`fetchAPIData<T>()` accepts any `T` with no runtime validation. Callers assert shape via generic parameter (`{ match: MatchDetails }`) but the actual JSON response is unchecked. A malformed API response silently returns the wrong shape.

**Suggestion:** Add a Zod schema or at minimum a runtime guard for critical paths.

---

## 6. Array Index Keys (2 issues)

| File | Line | Code | Risk |
|------|------|------|------|
| `src/pages/Home.tsx` | 64 | `key={i}` on feature cards | Low (static list) |
| `src/components/PlayerCard.tsx` | 74 | `key={i}` on past match dots | Medium — list can reorder |

**Fix for PlayerCard:** Use `key={match.date + match.opponentName}` or a composite key.

---

## 7. Hardcoded Route in BottomNav

| File | Line | Code |
|------|------|------|
| `src/components/BottomNav.tsx` | 12 | `{ to: '/match/3760372', ... }` |

The "Ottelu" nav link points to a hardcoded match ID. If this is intentional (demo link), it should be documented. If not, it's a bug.

---

## 8. Missing Explicit Return Types (2 functions)

| File | Line | Function |
|------|------|----------|
| `src/utils/dataProcessors.ts` | 18 | `processPlayerMatchHistory` — returns inferred `ProcessedStats` |
| `src/hooks/useMatchData.ts` | 25 | `fetchData` — returns inferred `Promise<void>` |

**Impact:** With `noUncheckedIndexedAccess` or stricter settings, inferred returns can silently widen. Adding explicit return types is cheap insurance.

---

## 9. tsconfig Gap: `skipLibCheck: true`

`tsconfig.json` has `skipLibCheck: true`. This disables type checking of `.d.ts` files from `node_modules`. If a dependency ships broken types, errors propagate silently. Consider removing for stricter builds.

---

## 10. Missing `useParams` Type Narrowing

| File | Line |
|------|------|
| `src/pages/MatchPage.tsx` | 14 |

```ts
const { matchId = '' } = useParams()
```

`useParams()` returns `Record<string, string | undefined>`. The default `''` covers the undefined case, but there's no validation that the string is a valid match ID format before triggering `fetchData`. An empty or malformed ID will hit the API and fail at the network layer.

---

## Summary

| Category | Count | Severity |
|----------|-------|----------|
| Incorrect import modality | 4 | Low |
| Duplicated utility | 5 | Medium |
| Unsafe type assertions | 2 | Medium |
| Silent catch | 1 | Low |
| Unconstrained generic | 1 | Medium |
| Array index keys | 2 | Low-Medium |
| Hardcoded route | 1 | Low |
| Missing return types | 2 | Low |
| skipLibCheck | 1 | Low |
| Missing input validation | 1 | Low |
| **Total** | **20** | |
