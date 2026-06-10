# Full Cross-Reference Report

**Generated**: 20260610T191714
**Git SHA**: dc51fe1
**Model**: deepseek-v4-flash-free (cross-check agent)

**Reports analyzed**: 28 total (17 succeeded, 11 failed)

---

## Models That Contributed

| Model | Agents | Succeeded | Failed | Review Types |
|---|---|---|---|---|
| **deepseek-v4-flash-free** | 8 | 8 | 0 | code (2), api (2), ux (2), data-flow (2) |
| **opencode/mimo** (v2.5-free + v2-free) | 8 | 8 | 0 | code (2), api (2), ux (2), data-flow (2) |
| **nemotron-3-ultra-free** | 1 | 1 | 0 | code (1) |
| **moonshotai/kimi-k2** | 8 | 0 | 8 | code (2), api (2), ux (2), data-flow (2) — all errors |

---

## Agreed Findings (found by 2+ agents across any models)

### 1. `any[]` in `PlayerAPIResponse.matches` — zero type safety in player pipeline
**Agreed by**: **3 models, 10+ agents**
- `deepseek-v4-flash-free`: review-code-1 (CRITICAL), review-api-1 (CRITICAL), review-data-flow-1 (WARNING)
- `opencode/mimo-v2.5-free`: review-code-1 (CRITICAL), review-api-1 (CRITICAL), review-data-flow-1 (CRITICAL), review-code-2 (WARNING), review-api-2 (INFO)
- `nemotron-3-ultra-free`: review-code-1-1 (CRITICAL)
- **Files**: `src/types/api.ts:6` → `src/utils/dataProcessors.ts:19` → `src/hooks/useMatchData.ts:37`
- **Summary**: Universal consensus — every model flagged this as the #1 type-safety failure.

### 2. `Record<string, any>` in `fetchAPIData` params
**Agreed by**: **3 models, 7+ agents**
- `deepseek-v4-flash-free`: review-code-1 (WARNING), review-data-flow-1 (WARNING)
- `opencode/mimo-v2.5-free`: review-code-1 (CRITICAL), review-data-flow-1 (WARNING), review-code-2 (WARNING)
- `nemotron-3-ultra-free`: review-code-1-1 (CRITICAL)
- **File**: `src/services/api.ts:39`

### 3. Unsafe `as PlayerStats` assertion in `useMatchData.ts:55`
**Agreed by**: **3 models, 8+ agents**
- `deepseek-v4-flash-free`: review-code-1 (CRITICAL), review-data-flow-1 (WARNING)
- `opencode/mimo-v2.5-free`: review-code-1 (CRITICAL), review-api-1 (WARNING), review-data-flow-1 (CRITICAL), review-code-2 (WARNING)
- `nemotron-3-ultra-free`: review-code-1-1 (WARNING)
- **File**: `src/hooks/useMatchData.ts:55`

### 4. `[key: string]: unknown` index signatures on API types
**Agreed by**: **3 models, 5+ agents**
- `deepseek-v4-flash-free`: review-api-1 (INFO)
- `opencode/mimo-v2.5-free`: review-data-flow-1 (WARNING), review-api-1 (INFO)
- `nemotron-3-ultra-free`: review-code-1-1 (CRITICAL)
- **File**: `src/types/api.ts:7,35,42,49,117,129`

### 5. `batchFetch` `Promise.all` — single failure kills entire batch
**Agreed by**: **2 models, 5 agents**
- `deepseek-v4-flash-free`: review-api-2 (CRITICAL)
- `opencode/mimo-v2.5-free`: review-api-1 (WARNING), review-api-2 (CRITICAL)
- `opencode/mimo-v2-free`: review-data-flow-2 (WARNING)
- **File**: `src/services/api.ts:75-87`

### 6. No request cancellation / AbortController in `useMatchData`
**Agreed by**: **2 models, 3 agents**
- `deepseek-v4-flash-free`: review-data-flow-2 (CRITICAL)
- `opencode/mimo-v2.5-free`: review-api-2 (CRITICAL)
- `opencode/mimo-v2-free`: review-data-flow-2 (CRITICAL)
- **File**: `src/hooks/useMatchData.ts:19-65`

### 7. Stale data visible during navigation (no `setData(null)` before fetch)
**Agreed by**: **2 models, 3 agents**
- `deepseek-v4-flash-free`: review-data-flow-2 (CRITICAL)
- `opencode/mimo-v2-free`: review-data-flow-2 (WARNING — "Stale Data Flash on Navigation"), review-data-flow-2 (INFO — "Data Not Cleared Between Match Transitions")
- **File**: `src/hooks/useMatchData.ts:9-17`

### 8. Silent `catch(e) { /* ignore */ }` swallows JSON parse errors
**Agreed by**: **3 models, 5 agents**
- `deepseek-v4-flash-free`: review-api-2 (INFO)
- `opencode/mimo-v2.5-free`: review-api-1 (WARNING), review-code-1 (WARNING)
- `nemotron-3-ultra-free`: review-code-1-1 (WARNING)
- **File**: `src/services/api.ts:64`

### 9. Missing `focus-visible` rings on interactive elements
**Agreed by**: **2 models, 5+ agents**
- `deepseek-v4-flash-free`: review-ux-2 (WARNING — BottomNav, NotFound, PlayerCard dots)
- `opencode/mimo-v2.5-free`: review-ux-1 (WARNING — form dots), review-code-1 (WARNING — NotFound Link), review-code-2 (INFO — NotFound)
- `opencode/mimo-v2-free`: review-ux-2 (WARNING — BottomNav, form dots)
- **Files**: `src/components/BottomNav.tsx`, `src/pages/NotFound.tsx`, `src/components/PlayerCard.tsx`

### 10. Framer Motion JS animations ignore `prefers-reduced-motion`
**Agreed by**: **2 models, 3 agents**
- `deepseek-v4-flash-free`: review-ux-2 (INFO)
- `opencode/mimo-v2.5-free`: review-ux-1 (WARNING)
- `opencode/mimo-v2-free`: review-ux-2 (WARNING)
- **Files**: Multiple components using `motion.*` wrappers

### 11. API key/token exposed in client-side bundle
**Agreed by**: **2 models, 3 agents**
- `deepseek-v4-flash-free`: review-code-2 (WARNING)
- `opencode/mimo-v2.5-free`: review-api-2 (INFO), review-data-flow-1 (INFO)
- **File**: `src/types/config.ts:18`

### 12. `clearTimeout` not reached on fetch rejection (not in `finally`)
**Agreed by**: **2 models, 2 agents**
- `deepseek-v4-flash-free`: review-api-2 (WARNING)
- `opencode/mimo-v2.5-free`: review-api-2 (WARNING)
- **File**: `src/services/api.ts:52-55`

### 13. Missing `--space-*` design tokens in CSS
**Agreed by**: **2 models, 2 agents**
- `deepseek-v4-flash-free`: review-ux-1 (INFO)
- `opencode/mimo-v2.5-free`: review-ux-1 (CRITICAL)
- **File**: `src/index.css`

### 14. Unnecessary `autoprefixer` and `postcss` devDependencies
**Agreed by**: **2 models, 2 agents**
- `deepseek-v4-flash-free`: review-code-2 (WARNING)
- `opencode/mimo-v2.5-free`: review-code-2 (WARNING)
- **File**: `package.json:25-26`

### 15. `bg-black` on `<body>` inconsistent with CSS theme (`#0a0a0a`)
**Agreed by**: **2 models, 2 agents**
- `deepseek-v4-flash-free`: review-code-2 (INFO)
- `opencode/mimo-v2.5-free`: review-code-2 (WARNING)
- **File**: `index.html:11`

### 16. Hardcoded match ID in BottomNav (`/match/3760372`)
**Agreed by**: **2 models, 4 agents**
- `opencode/mimo-v2.5-free`: review-code-1 (WARNING), review-code-2 (WARNING), review-data-flow-1 (WARNING)
- `nemotron-3-ultra-free`: review-code-1-1 (INFO)
- **File**: `src/components/BottomNav.tsx:12`

### 17. Unstable React keys (`name + shirtNumber`)
**Agreed by**: **2 models, 4 agents**
- `opencode/mimo-v2.5-free`: review-code-1 (WARNING), review-code-2 (WARNING)
- `nemotron-3-ultra-free`: review-code-1-1 (WARNING)
- **File**: `src/pages/MatchPage.tsx:133,150`

### 18. PlayerCard `onError` uses DOM mutation instead of React state
**Agreed by**: **2 models, 2 agents**
- `deepseek-v4-flash-free`: review-code-1 (INFO)
- `opencode/mimo-v2.5-free`: review-code-1 (WARNING)
- **File**: `src/components/PlayerCard.tsx:34`

### 19. No retry mechanism on API/network errors
**Agreed by**: **2 models, 2 agents**
- `deepseek-v4-flash-free`: review-data-flow-2 (WARNING)
- `opencode/mimo-v2.5-free`: review-api-2 (WARNING)
- **File**: `src/services/api.ts:39-73`, `src/pages/MatchPage.tsx:71-79`

### 20. No envelope type for API `call` wrapper
**Agreed by**: **2 models, 2 agents**
- `deepseek-v4-flash-free`: review-api-1 (INFO)
- `opencode/mimo-v2.5-free`: review-api-1 (CRITICAL)
- **File**: `src/services/api.ts:69-71`

### 21. Empty state shows clear instruction (positive finding)
**Agreed by**: **2 models, 2 agents**
- `deepseek-v4-flash-free`: review-data-flow-2 (INFO)
- `opencode/mimo-v2-free`: review-data-flow-2 (INFO)
- **File**: `src/pages/MatchPage.tsx:167-176`

---

## Disagreements

**No substantive disagreements found.** The cross-referenced findings above show agents assigning different severity levels (CRITICAL vs WARNING vs INFO) to the same root issue, but they concur on the substance. All other findings are unique to a single agent and do not conflict.

The 8 moonshotai/kimi-k2 reviews produced errors only, so no cross-model disagreement data exists.

---

## Unique Findings Per Model

### deepseek-v4-flash-free (15 unique findings not agreed by other models)

| Finding | Severity |
|---|---|
| `flex-grow` class removed in Tailwind v4 — silently fails | CRITICAL |
| `data?.players.filter()` crashes when `data` is null (guaranteed crash on initial render) | CRITICAL |
| `text-[10px]` prevents user font scaling across 7 components | CRITICAL |
| No `useEffect` cleanup — state updates on unmounted component | CRITICAL |
| `MatchSummary` required fields (`fs_A`, `fs_B`, `winner_id`, `status`) the API may omit/null | WARNING |
| `StandingTeam` all fields required — fragile for zero-game teams | WARNING |
| `string?` fields may receive `null` from API, not `undefined` | WARNING |
| No route-level code splitting (eager imports increase bundle) | WARNING |
| `moduleResolution: "Node"` in `tsconfig.node.json` — outdated | WARNING |
| Touch targets below 44px (Button `dense` `h-10` = 40px) | WARNING |
| Rate-limit error message is in English (rest of UI is Finnish) | WARNING |
| HTTP-level API error messages are in English | WARNING |
| Skeleton stat badge uses `rounded-xl` (16px) but StatBadge uses `rounded-md` (8px) | INFO |
| DESIGN.md §6.2 Card radius spec conflicts with §12 token spec | WARNING |
| No React Error Boundary wraps the app tree | INFO |
| `ScoreEntry` all fields optional — overly loose | INFO |
| `@vitejs/plugin-react@^5` likely incompatible with Vite 7 | INFO |
| No dynamic `<title>` management per route | INFO |
| `space-y-12` (48px) creates excessive scrolling on mobile | INFO |
| PlayerCardSkeleton count hardcoded at 2 (real match has 11+ players) | WARNING |
| Error message may contain unfriendly raw text (network/parse errors leaked) | WARNING |

### opencode/mimo (v2.5-free + v2-free) (18 unique findings not agreed by other models)

| Finding | Severity |
|---|---|
| Missing `lang="fi"` in HTML root element | CRITICAL |
| No font loading — Inter and JetBrains Mono referenced but never fetched | CRITICAL |
| Missing `viewport-fit=cover` prevents `safe-area-inset` from working | CRITICAL |
| Error and loading can display simultaneously (mutual exclusion missing) | CRITICAL |
| `PastMatchDetail` fields allow `undefined` but typed as required `string` | CRITICAL |
| `cn()` utility duplicated identically across 5 component files | WARNING |
| Search inputs have `focus:ring-0` contradicting focus ring convention | CRITICAL |
| BottomNav has 2 tabs, DESIGN.md specifies 4 | WARNING |
| Missing `skip-to-content` link for keyboard navigation | WARNING |
| `aria-label` missing on search inputs and navigation | WARNING |
| Rate limiter records calls BEFORE the fetch executes — false count inflation | WARNING |
| `AbortError` not handled gracefully — raw error shown to user | WARNING |
| StandingsTable header uses `font-medium` (500), DESIGN.md requires 700 | WARNING |
| MatchHeader team names use `font-black` (900), DESIGN.md specifies 700 | WARNING |
| Hero score font size is 36/48px, DESIGN.md specifies 64px | WARNING |
| `getTeamData` returns `undefined` (not `null`) when `data.team` is falsy | WARNING |
| `getGroupDetails` returns `null` but callers may not expect it | WARNING |
| Fixture opponent lookup doesn't account for `team_id` field (name-based only) | WARNING |
| `processPlayerMatchHistory` doesn't distinguish draw vs fixture in `resultIndicator` | WARNING |
| Fragile string comparison for shirt number (`!== "N/A"`) | WARNING |
| GitHub Actions uses `npm install` instead of `npm ci` | WARNING |
| Favicon references non-existent Vite default SVG | WARNING |
| `match.time` live detection is fragile (apostrophe heuristic) | INFO |
| No test files found in project | INFO |
| Home page feature cards are non-interactive but could be confusing | INFO |
| StandingsTable rows are `motion.tr` but not focusable/keyboard-navigable | INFO |
| MatchPage doesn't handle invalid `matchId` param | INFO |
| Image Error Handler Swallows Error Silently (layout shift) | INFO |

### nemotron-3-ultra-free (3 unique findings not agreed by other models)

| Finding | Severity |
|---|---|
| Missing `player_id` in `PlayerStats` interface | WARNING |
| `parseInt` failure on standing sort (`parseInt("0") || 999` misplaces team at 0) | WARNING |
| Unused Import `ButtonHTMLAttributes` in Button.tsx | INFO |
| Unused Import `Variants` type in MatchPage.tsx | INFO |
| Missing optional chaining on `pastMatchesDetails` (redundant check) | INFO |

### moonshotai/kimi-k2
No findings — all 8 agents failed with model errors (`Model not found` or `UnknownError`).

---

## Summary Stats

| Metric | Count |
|---|---|
| **Total findings across ALL reports** | **147** |
| CRITICAL | 25 |
| WARNING | 71 |
| INFO | 51 |

### Per-Model Counts

| Model | Agents Succeeded | Total Findings | CRITICAL | WARNING | INFO |
|---|---|---|---|---|---|
| **deepseek-v4-flash-free** | 8/8 | 63 | 10 | 28 | 25 |
| **opencode/mimo** (v2.5-free + v2-free) | 8/8 | 70 | 11 | 35 | 24 |
| **nemotron-3-ultra-free** | 1/1 | 14 | 4 | 6 | 4 |
| **moonshotai/kimi-k2** | 0/8 | 0 | 0 | 0 | 0 |

---

## Key Takeaways

1. **Triple-model consensus: `any[]` type leak (10+ agents)** — `PlayerAPIResponse.matches` at `src/types/api.ts:6` is the single highest-consensus finding. Every model that produced results flagged it. Define a `PlayerMatchEntry` interface immediately — this fix cascades to eliminate 5+ downstream warnings.

2. **Triple-model consensus: `as PlayerStats` assertion (8+ agents)** — `src/hooks/useMatchData.ts:55` disables structural type checking. Remove the `as` cast and let TypeScript validate the object literal. Also caught in conjunction with `any[]` leak — fixing types at the source enables this fix.

3. **Triple-model consensus: `Record<string, any>` in fetchAPI (7+ agents)** — `src/services/api.ts:39` allows untyped params through the entire API layer. Tighten to `Record<string, string | number | boolean | undefined>`.

4. **Dual-model consensus: `batchFetch` `Promise.all` crash (5 agents)** — Single player API failure crashes the entire match page (22+ players). Replace with `Promise.allSettled`. Paired with no `AbortController` in `useMatchData` (3 agents), this is the highest-impact runtime stability fix.

5. **Dual-model consensus: accessibility gaps (5+ agents)** — Missing `focus-visible` rings, `prefers-reduced-motion` not wired to framer-motion, no `lang="fi"`, no font loading, `text-[10px]` breaking font scaling, hardcoded match ID nav item. These span UX, code, and data-flow reviews across models.
