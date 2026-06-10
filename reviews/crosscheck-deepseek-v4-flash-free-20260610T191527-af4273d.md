# Cross-Reference Report

**Generated**: 20260610T191527  
**Git SHA**: af4273d  
**Model**: deepseek-v4-flash-free  

**Reports analyzed**: 16 total (8 deepseek-v4-flash-free successes, 8 moonshotai-kimi-k2 failures)

---

## Agreed Findings (found by 2+ agents)

### 1. `any[]` leak from `PlayerAPIResponse.matches` through player pipeline
- **Files**: `src/types/api.ts:6` → `src/utils/dataProcessors.ts:19` → `src/hooks/useMatchData.ts:37`
- **Agreed by**: **3 agents**
  - `review-api-1-opencode-deepseek-v4-flash-free` — CRITICAL: `PlayerAPIResponse.matches` typed as `any[]`
  - `review-code-1-deepseek-v4-flash-free` — CRITICAL: `any[]` leaks unchecked data throughout the pipeline
  - `review-data-flow-1-deepseek_v4_flash_free` — WARNING: `any[]` leak from API response through player pipeline
- **Summary**: All three agents independently flagged the same untyped `any[]` in the API response type. Downstream processors access `match.player_goals`, `match.team_name`, `match.season_id`, etc. with zero compiler validation.

### 2. Unsafe `as PlayerStats` cast in `useMatchData.ts:55`
- **File**: `src/hooks/useMatchData.ts:55`
- **Agreed by**: **2 agents**
  - `review-code-1-deepseek-v4-flash-free` — CRITICAL: `as PlayerStats` assertion bypasses required-field checks
  - `review-data-flow-1-deepseek_v4_flash_free` — WARNING: Unsafe `as PlayerStats` cast in player processing
- **Summary**: Both agents flagged the same line — an object spread from `ProcessedStats` + `lineupInfo` cast with `as PlayerStats`, disabling structural type checking. If `PlayerStats` gains new required fields, the mismatch is silently hidden.

### 3. `Record<string, any>` / untyped fetch params in `api.ts:39`
- **File**: `src/services/api.ts:39`
- **Agreed by**: **2 agents**
  - `review-code-1-deepseek-v4-flash-free` — WARNING: `Record<string, any>` in generic fetch function
  - `review-data-flow-1-deepseek_v4_flash_free` — WARNING: `fetchAPIApiData` params leaks `any` into API layer
- **Summary**: Both identified the loose `any` typing in `fetchAPIApiData`'s params argument. No compiler protection against wrong param names or types.

---

## Disagreements (same file+line, different opinions)

**No substantive disagreements found.** The three cross-referenced findings above show agents assigning different severity levels (CRITICAL vs WARNING) to the same root issue, but they concur on the substance. All other findings are unique to a single agent and do not conflict.

The 8 moonshotai/kimi-k2 reviews produced errors only, so no cross-model disagreement data exists.

---

## Unique Findings (only 1 agent caught them)

### review-ux-1-deepseek-v4-flash-free (4 unique)
| Finding | Severity |
|---|---|
| DESIGN.md §6.2 Card radius spec conflicts with §12 token spec | WARNING |
| Missing `--space-*` design tokens in `index.css` despite DESIGN.md defining them | INFO |
| Input focus ring uses `ring-1` (1px) but spec requires 2px | INFO |
| Skeleton stat badge uses `rounded-xl` (16px) but StatBadge uses `rounded-md` (8px) | INFO |

### review-ux-2-deepseek-v4-flash-free (10 unique)
| Finding | Severity |
|---|---|
| `text-[10px]` prevents user font scaling across 7 components | CRITICAL |
| Button `dense` size `h-10` (40px) below 44px minimum touch target | WARNING |
| Match-result dots (10×10px) lack adequate touch target despite being focusable | WARNING |
| Match-result dots missing keyboard event handler (Enter/Space) | WARNING |
| Missing `focus-visible:ring` on BottomNav NavLink items | WARNING |
| Missing `focus-visible:ring` on NotFound back link | WARNING |
| PlayerCard dot indicators missing `focus-visible:ring` | WARNING |
| Page content lacks bottom padding for fixed BottomNav overlap | INFO |
| BottomNav ignores `safe-area-inset-left/right` for landscape/notched phones | INFO |
| No `prefers-reduced-motion` respect in framer-motion animations | INFO |

### review-api-2-opencode-deepseek-v4-flash-free (6 unique)
| Finding | Severity |
|---|---|
| `batchFetch` uses `Promise.all` — one failure kills the entire batch | CRITICAL |
| `clearTimeout` not reached on fetch rejection (not in `finally`) | WARNING |
| Rate-limit error message is in English (rest of UI is Finnish) | WARNING |
| HTTP-level API error messages are in English | WARNING |
| `catch(e) { /* ignore */ }` swallows parse errors silently | INFO |
| No React Error Boundary wraps the app tree | INFO |

### review-data-flow-1-deepseek_v4_flash_free (5 unique minus cross-refs)
| Finding | Severity |
|---|---|
| `data?.players.filter()` crashes when `data` is null (guaranteed crash on initial render) | CRITICAL |
| `processPlayerMatchHistory` inconsistent null handling — returns partial results silently | INFO |

### review-api-1-opencode-deepseek-v4-flash-free (7 unique minus cross-refs)
| Finding | Severity |
|---|---|
| `MatchSummary` required fields (`fs_A`, `fs_B`, `winner_id`, `status`) the API may omit/null | WARNING |
| `StandingTeam` all fields required — fragile for zero-game teams | WARNING |
| `string?` fields may receive `null` from API, not `undefined` | WARNING |
| `[key: string]: unknown` index signature weakens known-key type checking | INFO |
| No envelope type for API `call` wrapper | INFO |
| `ScoreEntry` all fields optional — overly loose | INFO |

### review-data-flow-2-deepseek-v4-flash-free (8 unique)
| Finding | Severity |
|---|---|
| Stale data visible during loading when `matchId` changes (no `setData(null)` before fetch) | CRITICAL |
| Race condition — no stale request discarding (no `AbortController`) | CRITICAL |
| No `useEffect` cleanup — state updates on unmounted component | CRITICAL |
| No retry mechanism on error — user must manually re-submit match ID | WARNING |
| `PlayerCardSkeleton` count hardcoded at 2 (real match has 11+ players) | WARNING |
| Error message may contain unfriendly raw text (network/parse errors leaked) | WARNING |
| Empty state shows clear user-friendly instruction (positive) | INFO |
| Loading state shows appropriate skeletons for all 3 content areas (positive) | INFO |

### review-code-2-deepseek-v4-flash-free (12 unique)
| Finding | Severity |
|---|---|
| `flex-grow` class removed in Tailwind v4 — silently fails | CRITICAL |
| Unnecessary `autoprefixer` and `postcss` devDependencies | WARNING |
| Unnecessary `tailwindcss` standalone package | WARNING |
| No route-level code splitting (eager imports increase bundle) | WARNING |
| `moduleResolution: "Node"` in `tsconfig.node.json` — outdated | WARNING |
| API token exposed in client-side bundle (`config.ts:18`) | WARNING |
| `framer-motion` bundle weight (~32KB gzipped) for trivial animations | INFO |
| `bg-black` on `<body>` in `index.html` inconsistent with CSS theme (`#0a0a0a`) | INFO |
| Unused `React` import in `main.tsx` with React 19 auto JSX runtime | INFO |
| `@vitejs/plugin-react@^5` likely incompatible with Vite 7 | INFO |
| No dynamic `<title>` management per route | INFO |
| `space-y-12` (48px) creates excessive scrolling on mobile | INFO |

### review-code-1-deepseek-v4-flash-free (11 unique minus cross-refs)
| Finding | Severity |
|---|---|
| `response.json()` and `errorData` are untyped (implicit `any`) | WARNING |
| `PlayerLineupInfo` imported as value, not type (inconsistent) | WARNING |
| `clubCrest` and `finland_raised` defined in `PlayerStats` but never populated | INFO |
| Component functions lack explicit return types (`: JSX.Element`) | INFO |
| Inconsistent semicolons in `api.ts` | INFO |
| Mutative DOM escape hatch in `PlayerCard.tsx:34` (`style.display = 'none'`) | INFO |

---

## Summary Stats

| Metric | Count |
|---|---|
| **Total findings across all reports** | **63** |
| CRITICAL | 10 |
| WARNING | 28 |
| INFO | 25 |
| **Models that contributed** | 1 (deepseek-v4-flash-free) |
| **Agents that reported** | 8/8 from deepseek-v4-flash-free; **0/8 from moonshotai-kimi-k2** (all failed with model errors) |

**Failed moonshotai/kimi-k2 reviews** (8 files — no findings produced):
- `review-code-1-moonshotai-kimi-k2` — `UnknownError`
- `review-code-2-moonshotai-kimi-k2` — `UnknownError`
- `review-api-5-moonshotai-kimi-k2` — `Model not found: moonshotai/kimi-k2`
- `review-api-6-moonshotai-kimi-k2` — `UnknownError`
- `review-data-flow-7-moonshotai-kimi-k2` — `Model not found: moonshotai/kimi-k2`
- `review-data-flow-8-moonshotai-kimi-k2` — `Model not found: moonshotai/kimi-k2`
- `review-ux-3-moonshotai-kimi-k2` — `Model not found: moonshotai/kimi-k2`
- `review-ux-4-moonshotai-kimi-k2` — `Model not found: moonshotai/kimi-k2`

---

## Key Takeaways

1. **Fix `any[]` type leak (3 agents agreed)** — `src/types/api.ts:6` defines `matches: any[]` which propagates unchecked through the entire data pipeline. Define a `PlayerMatchEntry` interface. This is the single highest-consensus finding.

2. **Fix stale data + race condition in `useMatchData` (CRITICAL × 3)** — The hook does not clear old data on refetch (`setData(null)`), does not abort in-flight requests (no `AbortController`), and has no `useEffect` cleanup. Users can see wrong match data when navigating between matches quickly.

3. **Fix `batchFetch` `Promise.all` crash (1 agent, CRITICAL)** — `src/services/api.ts:83` uses `Promise.all` in `batchFetch`, so a single failed player API call prevents rendering the entire match page. Replace with `Promise.allSettled`.

4. **Fix `data?.players.filter()` null crash (1 agent, CRITICAL)** — `src/pages/MatchPage.tsx:33-34` crashes on every initial render because optional chaining on `null` produces `undefined`, then `.filter()` is called on `undefined`. Use `data?.players?.filter(...) || []`.

5. **Fix accessibility issues (1 agent, 1 CRITICAL + 6 WARNING)** — `text-[10px]` across 7 components breaks browser font scaling. Touch targets below 44px, missing `focus-visible` rings, missing keyboard handlers, and no `prefers-reduced-motion` respect in framer-motion animations.
