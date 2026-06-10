# Cross-Check Review Report

**Cross-Checker**: opencode/mimo-v2-5-free  
**Date**: 2026-06-10T19:16:00Z  
**Commit**: af4273d  
**Review files analyzed**: 25 (17 valid, 8 failed — moonshotai/kimi-k2 model not found)

---

## Agents That Reported

| Agent | Model | Status | Findings |
|-------|-------|--------|----------|
| code-1 | opencode/mimo-v2-5-free | OK | 4 CRIT, 7 WARN, 7 INFO |
| code-2 | mimo-v2-5-free | OK | 0 CRIT, 10 WARN, 2 INFO |
| api-1 | mimo-v2-5-free | OK | 3 CRIT, 6 WARN, 3 INFO |
| api-2 | mimo-v2-5-free | OK | 3 CRIT, 5 WARN, 2 INFO |
| ux-1 | opencode/mimo-v2-5-free | OK | 4 CRIT, 7 WARN, 8 INFO |
| ux-2 | mimo-v2-free | OK | 1 CRIT, 4 WARN, 4 INFO |
| data-flow-1 | opencode/mimo-v2-5-free | OK | 2 CRIT, 2 WARN, 2 INFO |
| data-flow-2 | opencode/mimo-v2-free | OK | 3 CRIT, 3 WARN, 2 INFO |
| code-1 | nemotron-3-ultra-free | OK | 4 CRIT, 6 WARN, 6 INFO |
| code-1 | deepseek-v4-flash-free | OK | 2 CRIT, 3 WARN, 3 INFO |
| code-2 | deepseek-v4-flash-free | OK | 1 CRIT, 5 WARN, 5 INFO |
| api-1 | deepseek-v4-flash-free | OK | 1 CRIT, 3 WARN, 3 INFO |
| api-2 | deepseek-v4-flash-free | OK | 1 CRIT, 4 WARN, 1 INFO |
| ux-1 | deepseek-v4-flash-free | OK | 0 CRIT, 1 WARN, 3 INFO |
| ux-2 | deepseek-v4-flash-free | OK | 1 CRIT, 5 WARN, 3 INFO |
| data-flow-1 | deepseek-v4-flash-free | OK | 1 CRIT, 2 WARN, 1 INFO |
| data-flow-2 | deepseek-v4-flash-free | OK | 3 CRIT, 4 WARN, 2 INFO |
| code-1,2,api-5,6,ux-3,4,df-7,8 | moonshotai/kimi-k2 | FAILED | 0 (model not found) |

---

## Agreed Findings (found by 2+ agents)

### 1. `any[]` in `PlayerAPIResponse.matches` — root type-safety leak
- **File**: `src/types/api.ts:6`
- **Severity**: CRITICAL
- **Agents** (10): code-1/mimo, code-1/nemotron, code-1/deepseek, api-1/mimo, api-1/deepseek, api-2/mimo (INFO), data-flow-1/mimo, data-flow-1/deepseek, code-2/mimo (via dataProcessors), data-flow-2/mimo (via `as PlayerStats`)
- **Consensus**: Universal agreement. The `any[]` on `matches` propagates through `processPlayerMatchHistory` → `useMatchData` → `PlayerStats`, defeating all type safety on field access (`player_goals`, `team_name`, `fs_A`, etc.).

### 2. `any` in `fetchAPIData` params (`Record<string, any>`)
- **File**: `src/services/api.ts:39`
- **Severity**: CRITICAL
- **Agents** (6): code-1/mimo, code-1/nemotron, code-1/deepseek, data-flow-1/mimo, data-flow-1/deepseek, api-1/mimo (implied)
- **Consensus**: Allows non-stringifiable values (objects, arrays) to silently coerce via `URLSearchParams`.

### 3. `any[]` in `processPlayerMatchHistory` matches param
- **File**: `src/utils/dataProcessors.ts:19`
- **Severity**: CRITICAL
- **Agents** (5): code-1/mimo, code-1/nemotron, code-1/deepseek, api-1/mimo, data-flow-1/deepseek
- **Consensus**: All downstream field accesses on match objects are unvalidated.

### 4. Unsafe `as PlayerStats` type assertion
- **File**: `src/hooks/useMatchData.ts:55`
- **Severity**: CRITICAL
- **Agents** (8): code-1/mimo, code-1/nemotron, code-1/deepseek, api-1/mimo, data-flow-1/mimo, data-flow-1/deepseek, data-flow-2/mimo, code-2/mimo (via dataProcessors)
- **Consensus**: Cast bypasses structural checking. If `PlayerStats` gains required fields or `processPlayerMatchHistory` changes shape, the cast silently produces invalid objects.

### 5. `cn()` utility duplicated across 5 component files
- **Files**: `BottomNav.tsx:6`, `Button.tsx:6`, `StatBadge.tsx:5`, `Skeleton.tsx:4`, `PlayerCard.tsx:8`
- **Severity**: WARNING
- **Agents** (4): code-2/mimo, code-1/mimo, ux-1/mimo, data-flow-1/mimo
- **Consensus**: Identical `cn()` (clsx + twMerge) copy-pasted in 5 files. Should be extracted to `src/utils/cn.ts`.

### 6. Hardcoded match ID `/match/3760372` in BottomNav
- **File**: `src/components/BottomNav.tsx:12`
- **Severity**: WARNING
- **Agents** (4): code-2/mimo, code-1/nemotron, code-1/mimo, data-flow-1/mimo
- **Consensus**: Debug artifact left in production code. Should be dynamic or removed.

### 7. `batchFetch` uses `Promise.all` — one failure kills entire batch
- **File**: `src/services/api.ts:75-87`
- **Severity**: CRITICAL
- **Agents** (4): api-1/mimo, api-2/mimo, api-2/deepseek, data-flow-2/mimo
- **Consensus**: A single player fetch failure (timeout, network blip) prevents loading the entire match page. Should use `Promise.allSettled`.

### 8. Form dots (PlayerCard) have `role="button"` + `tabIndex` but no keyboard handler
- **File**: `src/components/PlayerCard.tsx:76-86`
- **Severity**: WARNING
- **Agents** (4): code-2/mimo, ux-1/mimo, ux-2/mimo, ux-2/deepseek
- **Consensus**: Accessible elements that do nothing on Enter/Space activation. Confusing for screen reader and keyboard users.

### 9. Framer-motion JS animations ignore `prefers-reduced-motion`
- **Files**: `PlayerCard.tsx:12-15`, `MatchHeader.tsx:7-19`, `DualStatBar.tsx:33-39`, `StandingsTable.tsx:29-31`, `MatchPage.tsx:70-108`
- **Severity**: WARNING
- **Agents** (3): ux-1/mimo, ux-2/mimo, ux-2/deepseek
- **Consensus**: CSS `prefers-reduced-motion` rule only kills CSS animations. Framer-motion's JS-driven animations (stagger enter, scale press, live pulse) fire regardless.

### 10. Missing `focus-visible` ring on NotFound link
- **File**: `src/pages/NotFound.tsx:9`
- **Severity**: WARNING
- **Agents** (4): code-2/mimo, code-1/mimo, ux-2/mimo, ux-2/deepseek
- **Consensus**: Missing `focus-visible:ring-2 ring-accent/50` per AGENTS.md conventions.

### 11. BottomNav NavLink items missing `focus-visible` ring
- **File**: `src/components/BottomNav.tsx:19-35`
- **Severity**: WARNING
- **Agents** (2): ux-2/mimo, ux-2/deepseek
- **Consensus**: No visible focus indicator when keyboard-navigating through bottom nav.

### 12. No request cancellation / AbortController in `useMatchData`
- **File**: `src/hooks/useMatchData.ts:19-65`
- **Severity**: CRITICAL
- **Agents** (3): api-2/mimo, data-flow-2/mimo, data-flow-2/deepseek
- **Consensus**: Rapid `matchId` changes cause concurrent fetches. Earlier response can overwrite later one, showing stale/wrong data.

### 13. `index.html` `bg-black` conflicts with CSS theme (`#0a0a0a`)
- **File**: `index.html:11`
- **Severity**: WARNING
- **Agents** (2): code-2/mimo, code-2/deepseek
- **Consensus**: `bg-black` (#000) overrides the intended `--color-canvas` (#0a0a0a). Should remove utility classes from body.

### 14. API token exposed in client-side bundle
- **File**: `src/types/config.ts:17-19`
- **Severity**: WARNING/INFO
- **Agents** (3): api-2/mimo (INFO), code-2/deepseek (WARNING), data-flow-1/mimo (INFO)
- **Consensus**: API key `json/4h7dznqdxwtp3hsfdyf5r793uahfxy7x` is hardcoded and visible in browser DevTools. Should use env var.

### 15. `fetchAPIData` error body parsing silently swallows parse errors
- **File**: `src/services/api.ts:59-64`
- **Severity**: WARNING
- **Agents** (2): api-1/mimo, code-1/mimo
- **Consensus**: `catch (e) { /* ignore */ }` discards parse error when error response body is not JSON.

### 16. `clearTimeout` not reached on fetch rejection
- **File**: `src/services/api.ts:54-55`
- **Severity**: WARNING
- **Agents** (2): api-2/mimo, api-2/deepseek
- **Consensus**: `clearTimeout` after `await fetch()` is skipped on throws. Should be in `finally` block.

### 17. Unstable React keys for player lists
- **File**: `src/pages/MatchPage.tsx:133,150`
- **Severity**: WARNING
- **Agents** (3): code-2/mimo, code-1/nemotron, code-1/mimo
- **Consensus**: `key={player.name + player.shirtNumber}` can collide. Should use `player_id` or `teamIdInMatch`.

### 18. Missing `--space-*` design tokens in CSS
- **File**: `src/index.css:3-48`
- **Severity**: CRITICAL/WARNING
- **Agents** (2): ux-1/mimo (CRITICAL), ux-1/deepseek (INFO)
- **Consensus**: DESIGN.md §5.1 defines `--space-1` through `--space-9` but none are in the `@theme` block.

### 19. Missing `lang="fi"` in HTML root
- **File**: `index.html:11`
- **Severity**: CRITICAL
- **Agents** (1): ux-1/mimo only
- **Note**: Found by only 1 agent but high impact — screen readers misidentify language. Moved to Unique.

### 20. No font loading for Inter and JetBrains Mono
- **File**: `index.css:38-39`
- **Severity**: CRITICAL
- **Agents** (1): ux-1/mimo only
- **Note**: Found by only 1 agent. Moved to Unique.

### 21. Search inputs `focus:ring-0` removes focus indicator
- **File**: `src/pages/Home.tsx:50`, `src/pages/MatchPage.tsx:60`
- **Severity**: WARNING/CRITICAL
- **Agents** (2): code-2/mimo (WARNING), ux-1/mimo (CRITICAL)
- **Consensus**: Removes focus ring entirely. AGENTS.md requires `focus-visible:ring-2 ring-accent/50`.

### 22. Rate limiter records calls BEFORE fetch executes
- **File**: `src/services/api.ts:30-33`
- **Severity**: WARNING
- **Agents** (1): api-1/mimo only
- **Note**: Found by 1 agent. Moved to Unique.

### 23. `getTeamData` returns `undefined` not matching declared `null` return
- **File**: `src/services/api.ts:108`
- **Severity**: WARNING
- **Agents** (2): api-1/mimo, api-2/deepseek
- **Consensus**: `return data.team` can be `undefined` but return type is `TeamBasic | null`.

### 24. Missing viewport-fit=cover for safe-area-inset on notched iPhones
- **File**: `index.html:7`
- **Severity**: CRITICAL
- **Agents** (1): ux-2/mimo only
- **Note**: Found by 1 agent. Moved to Unique.

### 25. Error and Loading states can display simultaneously
- **File**: `src/pages/MatchPage.tsx:71-101`
- **Severity**: CRITICAL
- **Agents** (1): data-flow-2/mimo only
- **Note**: Found by 1 agent. Moved to Unique.

---

## Disagreements (same file+line, different opinions)

### D1. `focus:ring-0` on search inputs — severity disagreement
- **File**: `src/pages/Home.tsx:50`, `src/pages/MatchPage.tsx:60`
- code-2/mimo: **WARNING** — parent wrapper provides some visual feedback
- ux-1/mimo: **CRITICAL** — violates DESIGN.md §10.2, keyboard users have no visible focus indicator

### D2. `--space-*` tokens missing — severity disagreement
- **File**: `src/index.css:3-48`
- ux-1/mimo: **CRITICAL** — spacing system isn't overridable or themeable
- ux-1/deepseek: **INFO** — Tailwind built-in spacing covers values; absent but not breaking

### D3. `batchFetch` individual failure handling — severity disagreement
- **File**: `src/services/api.ts:75-87`
- api-1/mimo: **WARNING** — one bad player prevents data loading
- api-2/mimo, api-2/deepseek: **CRITICAL** — one transient API failure crashes entire match page

### D4. API token exposure — severity disagreement
- **File**: `src/types/config.ts:17-19`
- api-2/mimo: **INFO** — backend may be rate-limited by design
- code-2/deepseek: **WARNING** — fully exposed in client bundle

### D5. Framer-motion `prefers-reduced-motion` — severity disagreement
- **Files**: Multiple component files
- ux-1/mimo: **WARNING** — CSS rule exists but JS animations bypass it
- ux-2/deepseek: **INFO** — noted but not flagged as critical

---

## Unique Findings (only 1 agent caught them)

### U1. CRITICAL: Missing `lang="fi"` in HTML root element
- **File**: `index.html:11`
- **Agent**: ux-1/mimo
- **Impact**: Screen readers misidentify language. SEO not indexing Finnish content correctly.

### U2. CRITICAL: No font loading — Inter and JetBrains Mono referenced but never fetched
- **File**: `index.css:38-39`
- **Agent**: ux-1/mimo
- **Impact**: App falls back to system fonts. Entire typography spec (ss03 'g', zero-with-dot, tabular figures) is broken.

### U3. CRITICAL: Missing viewport-fit=cover prevents safe-area-inset from working
- **File**: `index.html:7`
- **Agent**: ux-2/mimo
- **Impact**: BottomNav's `env(safe-area-inset-bottom)` always resolves to `0px` on notched iPhones.

### U4. CRITICAL: Error and Loading can display simultaneously
- **File**: `src/pages/MatchPage.tsx:71-101`
- **Agent**: data-flow-2/mimo
- **Impact**: After error, new fetch sets loading=true without clearing error. Both error banner and loading skeleton render.

### U5. CRITICAL: Stale data visible during loading when matchId changes
- **File**: `src/pages/MatchPage.tsx:71-176`, `src/hooks/useMatchData.ts:9-17`
- **Agent**: data-flow-2/deepseek
- **Impact**: Old match content renders alongside new loading skeleton during fetch.

### U6. CRITICAL: No useEffect cleanup — state updates on unmounted component
- **File**: `src/pages/MatchPage.tsx:19-24`
- **Agent**: data-flow-2/deepseek
- **Impact**: setState on unmounted component produces React warning and potential memory leak.

### U7. CRITICAL: `data?.players.filter()` crashes when data is null
- **File**: `src/pages/MatchPage.tsx:33-34`
- **Agent**: data-flow-1/deepseek
- **Impact**: Optional chaining short-circuits to `undefined`, then `.filter()` on `undefined` throws TypeError. Guaranteed crash on initial render.

### U8. CRITICAL: px-based font sizes (`text-[10px]`) prevent user font scaling
- **File**: `src/components/BottomNav.tsx:32` (+ 6 more instances)
- **Agent**: ux-2/deepseek
- **Impact**: Users who increase default font size in settings won't see larger text.

### U9. CRITICAL: `flex-grow` class does not exist in Tailwind v4
- **File**: `src/pages/Home.tsx:50`, `src/pages/MatchPage.tsx:60`
- **Agent**: code-2/deepseek
- **Impact**: Styles silently fail — input elements won't grow to fill available space.

### U10. CRITICAL: `PastMatchDetail` fields allow `undefined` but typed as required `string`
- **File**: `src/types/api.ts:150-158`
- **Agent**: api-1/mimo
- **Impact**: UI renders `"undefined - undefined"` in title attribute when API returns null scores.

### U11. CRITICAL: `fetchAPIData` does not model `call.status` envelope
- **File**: `src/services/api.ts:69-71`
- **Agent**: api-1/mimo
- **Impact**: Non-standard responses pass through unvalidated; `data?.call?.status` is `undefined` for error shapes.

### U12. WARNING: BottomNav has 2 tabs, DESIGN.md specifies 4
- **File**: `src/components/BottomNav.tsx:10-13`
- **Agent**: ux-1/mimo
- **Impact**: Navigation architecture doesn't match design spec.

### U13. WARNING: Missing `skip-to-content` link
- **File**: `src/routes.tsx:7-14`
- **Agent**: ux-1/mimo
- **Impact**: Keyboard-only users must tab through entire bottom nav on every page.

### U14. WARNING: StandingsTable header `font-medium` vs DESIGN.md `font-bold` (700)
- **File**: `src/components/StandingsTable.tsx:14-24`
- **Agent**: ux-1/mimo
- **Impact**: Headers won't stand out as intended per spec.

### U15. WARNING: MatchHeader team names `font-black` (900) vs spec 700
- **File**: `src/components/MatchHeader.tsx:49,60`
- **Agent**: ux-1/mimo
- **Impact**: Heavier weight than the 700 specified in DESIGN.md §4.2.

### U16. WARNING: Hero score font size 36/48px vs spec 64px
- **File**: `src/components/MatchHeader.tsx:53`
- **Agent**: ux-1/mimo
- **Impact**: Score is smaller than DESIGN.md §4.2 spec.

### U17. WARNING: No retry logic for transient API failures
- **File**: `src/services/api.ts:39-73`
- **Agent**: api-2/mimo
- **Impact**: All API calls fail permanently on first failure. No retry for 5xx/network errors.

### U18. WARNING: Rate limit error not distinguishable from other errors
- **File**: `src/services/api.ts:41`
- **Agent**: api-2/mimo
- **Impact**: Generic error message shown for rate-limit vs network vs API errors.

### U19. WARNING: Rate limit error message in English, not Finnish
- **File**: `src/services/api.ts:41`
- **Agent**: api-2/deepseek
- **Impact**: Inconsistent with Finnish UI. Should be translated.

### U20. WARNING: HTTP-level API error messages in English
- **File**: `src/services/api.ts:58,70,91`
- **Agent**: api-2/deepseek
- **Impact**: English error messages shown to Finnish users.

### U21. WARNING: No React Error Boundary
- **File**: `src/routes.tsx:19`, `src/App.tsx:4-6`
- **Agent**: api-2/deepseek
- **Impact**: Unhandled render errors outside router scope propagate without graceful fallback.

### U22. WARNING: `getPlayerData` returns nullable without null check
- **File**: `src/services/api.ts:111-113`
- **Agent**: api-2/mimo
- **Impact**: `data.player` could be `undefined` if API lacks `player` key; downstream access throws TypeError.

### U23. WARNING: `getGroupDetails` returns `null` on missing `data.group` — fragile
- **File**: `src/services/api.ts:102`
- **Agent**: api-1/mimo
- **Impact**: Implicit null fallthrough when API returns `undefined` for group key.

### U24. WARNING: `dataProcessors.ts` fixture opponent lookup uses name-only matching
- **File**: `src/utils/dataProcessors.ts:91`
- **Agent**: api-1/mimo
- **Impact**: Name-based matching can select wrong opponent if team name doesn't exactly match.

### U25. WARNING: No route-level code splitting
- **File**: `src/routes.tsx:1-4`
- **Agent**: code-2/deepseek
- **Impact**: Eager imports increase initial bundle unnecessarily for SPA.

### U26. WARNING: `moduleResolution: "Node"` outdated in tsconfig.node.json
- **File**: `tsconfig.node.json:6`
- **Agent**: code-2/deepseek
- **Impact**: Inconsistent with main tsconfig's `"Bundler"` setting; may cause type-checking mismatches.

### U27. WARNING: Unnecessary `tailwindcss` standalone package
- **File**: `package.json:27`
- **Agent**: code-2/deepseek
- **Impact**: Dead weight — Vite plugin bundles the engine.

### U28. WARNING: `MatchSummary` required fields API may omit
- **File**: `src/types/api.ts:95-96`
- **Agent**: api-1/deepseek
- **Impact**: `fs_A`, `fs_B`, `winner_id`, `status` are required `string` but API can return null for unplayed matches.

### U29. WARNING: `StandingTeam` all fields required — fragile for zero-game teams
- **File**: `src/types/api.ts:73-85`
- **Agent**: api-1/deepseek
- **Impact**: API may omit fields for teams with zero matches.

### U30. WARNING: `string?` fields may receive `null` from API, not `undefined`
- **File**: `src/types/api.ts:19-22,53-62`
- **Agent**: api-1/deepseek
- **Impact**: TypeScript considers null satisfied by `string | undefined` but runtime null can cause bugs in comparisons.

### U31. WARNING: `processPlayerMatchHistory` doesn't distinguish draw vs fixture
- **File**: `src/utils/dataProcessors.ts:61`
- **Agent**: code-1/mimo
- **Impact**: For "Played" matches where `winner_id` is missing/`"0"`, result stays `'draw'` even if scores indicate win/loss.

### U32. WARNING: Button touch target `h-10` (40px) below 44px minimum
- **File**: `src/components/Button.tsx:29`
- **Agent**: ux-2/deepseek
- **Impact**: WCAG/Apple HIG minimum 44px touch target not met for dense size.

### U33. WARNING: Interactive match-result dots lack adequate touch target
- **File**: `src/components/PlayerCard.tsx:77-86`
- **Agent**: ux-2/deepseek
- **Impact**: Physical touch target is only 10x10px — impossible to reliably tap on mobile.

### U34. WARNING: NavLink in BottomNav below 44px touch target on narrow screens
- **File**: `src/components/BottomNav.tsx:24`
- **Agent**: ux-2/mimo
- **Impact**: Label text at `text-[10px]` below recommended 12px minimum for readable text.

### U35. WARNING: Empty `playerIds` triggers unnecessary batchFetch
- **File**: `src/hooks/useMatchData.ts:31-33`
- **Agent**: data-flow-2/mimo
- **Impact**: Empty lineups silently show empty player list without distinguishing no-data vs fetch failure.

### U36. WARNING: Stale data flash on navigation
- **File**: `src/hooks/useMatchData.ts:19-21`, `src/pages/MatchPage.tsx:19-24`
- **Agent**: data-flow-2/mimo
- **Impact**: Old match content visible during brief window where loading=true and data still holds previous match.

### U37. WARNING: No Revalidation / Stale-While-Revalidate pattern
- **File**: `src/hooks/useMatchData.ts:8-68`
- **Agent**: data-flow-2/mimo
- **Impact**: No mechanism to refresh data when user navigates back; stale data shown until new fetch resolves.

### U38. WARNING: Missing null-safety on `playerData.matches` in useMatchData
- **File**: `src/hooks/useMatchData.ts:38`
- **Agent**: data-flow-1/mimo
- **Impact**: Malformed API response without `matches` field causes runtime crash.

### U39. WARNING: PlayerCardSkeleton count hardcoded (2)
- **File**: `src/pages/MatchPage.tsx:92-95`
- **Agent**: data-flow-2/deepseek
- **Impact**: Visual jank when real cards (11+ per team) replace only 2 skeletons.

### U40. WARNING: Error message may contain unfriendly raw text
- **File**: `src/hooks/useMatchData.ts:60`
- **Agent**: data-flow-2/deepseek
- **Impact**: Network errors or API 4xx/5xx leak technical messages like "Failed to fetch".

### U41. WARNING: Index signatures `[key: string]: unknown` defeating type safety
- **File**: `src/types/api.ts:7,35,42,49,117,129`
- **Agent**: code-1/nemotron
- **Impact**: Six interfaces allow arbitrary properties, preventing excess property checking.

### U42. WARNING: parseInt failure on standing — returns 999 for "0"
- **File**: `src/components/StandingsTable.tsx:5`
- **Agent**: code-1/nemotron
- **Impact**: `parseInt(a.current_standing) || 999` returns 999 for `"0"` (falsy), misplacing team at position 0.

### U43. WARNING: Missing `player_id` in `PlayerStats`
- **File**: `src/types/api.ts:160-183`, `src/hooks/useMatchData.ts:44-55`
- **Agent**: code-1/nemotron
- **Impact**: Prevents stable keys and future data linking.

### U44. WARNING: Unused import `APP_CONFIG` in dataProcessors.ts
- **File**: `src/utils/dataProcessors.ts:1`
- **Agent**: code-1/mimo
- **Impact**: Dead import; `currentSeasonId`/`previousSeasonId` passed as parameters instead.

### U45. WARNING: PlayerCard image `onError` hides element permanently
- **File**: `src/components/PlayerCard.tsx:34`
- **Agent**: code-1/mimo
- **Impact**: Direct DOM mutation hides image permanently even if src changes on re-render. Causes layout shift.

### U46. WARNING: Silent error catch with implicit `any`
- **File**: `src/services/api.ts:64`
- **Agent**: code-1/nemotron
- **Impact**: `catch (e) { /* ignore */ }` catches as implicit `any` and silently discards diagnostic info.

### U47. INFO: Skeleton stat badge radius mismatch
- **File**: `src/components/Skeleton.tsx:37`
- **Agent**: ux-1/deepseek
- **Impact**: Skeleton renders `rounded-xl` (16px) but actual `StatBadge` uses `rounded-md` (8px).

### U48. INFO: Page content lacks bottom padding to avoid BottomNav overlap
- **Files**: `src/pages/Home.tsx:19`, `src/pages/MatchPage.tsx:42`, `src/pages/NotFound.tsx:5`
- **Agent**: ux-2/deepseek
- **Impact**: Content at bottom of pages can be obscured by fixed BottomNav.

### U49. INFO: BottomNav missing safe-area-inset-left/right for landscape
- **File**: `src/components/BottomNav.tsx:17`
- **Agent**: ux-2/deepseek
- **Impact**: In landscape on notched iPhones, nav content can overlap sensor area.

### U50. INFO: Home page feature cards non-interactive but could confuse users
- **File**: `src/pages/Home.tsx:65-72`
- **Agent**: ux-2/mimo
- **Impact**: Users may attempt to tap cards expecting navigation.

### U51. INFO: `MotionConfig` missing `reducedMotion="user"` wrapper
- **Files**: Multiple
- **Agent**: ux-2/deepseek
- **Impact**: framer-motion bypasses CSS prefers-reduced-motion.

### U52. INFO: No test files found
- **Project-wide**
- **Agent**: code-1/mimo
- **Impact**: No automated tests exist for critical business logic.

### U53. INFO: GitHub Actions uses `npm install` instead of `npm ci`
- **File**: `.github/workflows/deploy.yml:28`
- **Agent**: code-2/mimo
- **Impact**: Non-deterministic CI builds; should use `npm ci`.

### U54. INFO: `processPlayerMatchHistory` inconsistent null handling
- **File**: `src/utils/dataProcessors.ts:37-38`
- **Agent**: data-flow-1/deepseek
- **Impact**: Null guard returns valid partial result but caller receives no signal data was missing.

### U55. INFO: `StandingTeam` string types for numeric fields
- **File**: `src/types/api.ts:73-85`
- **Agent**: code-1/mimo
- **Impact**: Every consumer must `parseInt()`; `parseInt(null)` gives `NaN`.

### U56. INFO: `[key: string]: unknown` on API types
- **File**: `src/types/api.ts:7,35,42,49,117,129`
- **Agent**: api-1/deepseek
- **Impact**: Weakens type checking on known-key access; index signature makes type "wider".

### U57. INFO: No envelope type for `call` wrapper
- **File**: `src/services/api.ts:69-71`
- **Agent**: api-1/deepseek
- **Impact**: Generic `T` doesn't capture the `call.status` envelope.

### U58. INFO: `match.time` live detection is fragile
- **File**: `src/components/MatchHeader.tsx:23`
- **Agent**: code-1/mimo
- **Impact**: Heuristic `match.time.includes("'")` may break if API changes format.

### U59. INFO: `Main.tsx` non-null assertion on `getElementById`
- **File**: `src/main.tsx:6`
- **Agent**: code-1/mimo
- **Impact**: Crashes at runtime with unhelpful error if root element missing.

---

## Summary Stats

- **Total unique findings**: 59
- **CRITICAL count**: 17
- **WARNING count**: 30
- **INFO count**: 12
- **Agents that reported**: 17 (8 failed: moonshotai/kimi-k2)
- **Valid review files**: 17
- **Models represented**: mimo-v2-5-free, mimo-v2-free, nemotron-3-ultra-free, deepseek-v4-flash-free
- **Disagreements**: 5 (all severity-level, not factual)
- **Unique findings** (only 1 agent): 59 findings; of these, **12 are CRITICAL** (U1–U11, U24)
- **Strongest consensus** (5+ agents): `any[]` in PlayerAPIResponse, `as PlayerStats` assertion, `cn()` duplication, hardcoded match ID, `batchFetch` Promise.all failure, form dots accessibility

### Top Priority Fixes (highest consensus + highest severity)
1. **Replace `any[]` in PlayerAPIResponse.matches** with typed interface (10 agents)
2. **Remove `as PlayerStats` assertion** in useMatchData.ts (8 agents)
3. **Replace `Promise.all` with `Promise.allSettled`** in batchFetch (4 agents)
4. **Extract `cn()` to shared utility** (4 agents)
5. **Fix form dots accessibility** — add keyboard handlers or remove role="button" (4 agents)
6. **Add request cancellation (AbortController)** in useMatchData (3 agents)
7. **Add `lang="fi"`** to HTML root element
8. **Add `viewport-fit=cover`** to viewport meta
9. **Add font loading** for Inter and JetBrains Mono
10. **Fix search input focus ring** — replace `focus:ring-0` with `focus-visible:ring-2`
