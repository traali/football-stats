# Architecture Review: Football Stats Modern

## Metadata

| Field | Value |
|-------|-------|
| Model | `big-pickle` |
| Original Audit | `2026-06-14T08:58:48Z` |
| **Plan Update** | **`2026-06-14` — Sync'd with commit `ecdc1ba` (shared utilities, types split, barrel exports)** |
| Arena Status | **Complete** — 3 teams, 300 points, 6 resolved clashes |

---

## The Arena Fight Summary

Three specialized teams conducted an independent audit of the 24-source-file codebase, each generating exactly 100 unique checkpoints (300 total). During synthesis, six major philosophical clashes emerged:

1. **Abstract Everything vs. Keep It Simple** — Team 1 demanded service layers, repositories, and dependency injection. Team 3 argued the 6-page, 24-file codebase didn't warrant the overhead. **Resolution:** Progressive abstraction — extract only the pain points (fetch client, Card component), defer full layered architecture.

2. **Validate Everything vs. TypeScript Is Enough** — Team 2 wanted zod/io-ts runtime validation for all API responses. Team 3 noted the working `as T` pattern. **Resolution:** Defense-in-depth — validate only at the API boundary for critical fields; log mismatches in dev without crashing production.

3. **Aggressive Caching vs. Cache as System Concern** — Team 2 wanted stale-while-revalidate and localStorage persistence. Team 1 insisted on formal eviction policies. **Resolution:** Keep simple in-memory cache, add LRU eviction at 500 entries, reject persistence (matches Team 1's own cache.ts docs).

4. **One Component Per File vs. Layer Separation** — Team 3 wanted TeamPage's 1073 lines decomposed. Team 1 wanted those files organized by architectural layer. **Resolution:** Decompose by feature directory (`features/team/`) — satisfies both size and separation concerns.

5. **Memory Safety vs. Readability** — Team 2 demanded WeakRef and FinalizationRegistry. Team 3 called this premature. **Resolution:** Fix the 3 confirmed memory leaks (scroll listener, timeout, unbounded cache); no WeakRef.

6. **Config as Code vs. Config as Env** — Team 1 liked the centralized `config.ts`. Team 2 wanted the API token in `.env`. **Resolution:** Hybrid — `.env` for secrets, `config.ts` for rate limits and documentation.

---

## The 300-Point Audit Ledger

### Team 1: The Enterprise Architect & Design Pattern Guard (100 points)

#### Core Architecture & Separation of Concerns (1–20)

| # | Checkpoint | Severity |
|---|------------|----------|
| 1 | No service layer abstraction — pages import `api.ts` directly | High |
| 2 | `dataProcessors.ts` imports `APP_CONFIG` directly from types | Medium |
| 3 | No per-route error boundaries; only root errorElement exists | Medium |
| 4 | Domain models mixed with API shapes in `types/api.ts` | High |
| 5 | Route param validation is inconsistent across pages | Medium |
| 6 | No reusable loading state manager (`useAsync`/`useResource`) | Medium |
| 7 | No shared cancellation token pattern — each page has its own AbortController | Medium |
| 8 | `useMatchData` mixes match, group, team, and player concerns | High |
| 9 | No repository pattern for cache — flat Map accessed directly | Low |
| 10 | No offline/online detection or service worker | Low |
| 11 | No data validation layer — API responses cast with `as T` | High |
| 12 | Error page renders outside layout — inconsistent UX on crash | Medium |
| 13 | `fetchAPIData` has no dependency injection point; hard to test | High |
| 14 | Rate limiter state is module-level mutable arrays | Medium |
| 15 | No feature flags — tournament IDs hardcoded in `Home` | Low |
| 16 | No state management — all state is local, prop drilling required | Low |
| 17 | `StandingsTable` mixes computation and display | Medium |
| 18 | `dataProcessors` has no interface — output is coupled to PlayerCard | Medium |
| 19 | No internationalization layer — all strings Finnish, hardcoded | Low |
| 20 | No analytics or observability | Low |

#### SOLID Principles Violations (21–40)

| # | Checkpoint | Severity |
|---|------------|----------|
| 21 | `fetchAPIData` violates SRP — rate limits, retries, parses, maps errors | High |
| 22 | Adding new endpoint requires changes in 4+ places | Medium |
| 23 | `getTeamData` deprecated with same signature as `getTeamProfile` | Medium |
| 24 | `MatchDetails` interface has 18 fields but consumers use subsets | Medium |
| 25 | `useMatchData` depends on low-level API functions, not abstractions | High |
| 26 | `cn()` couples to clsx + tailwind-merge with no abstraction | Low |
| 27 | `batchFetch` is not generic enough for non-string-keyed items | Low |
| 28 | No explicit contracts between pages and services | Medium |
| 29 | Error classes lack a common base discriminated type | Medium |
| 30 | `processPlayerMatchHistory` uses 4 positional arguments instead of options object | Medium |
| 31 | `useMatchData` returns flat nullable `data` requiring optional chaining | Medium |
| 32 | Layout component defined in `routes.tsx`, not separate file | Low |
| 33 | `useFavorites` doesn't sync across browser tabs | Medium |
| 34 | `getGroupDetails` and `getGroupFull` duplicate the same endpoint call | Medium |
| 35 | `getMatches` and `getTeamMatches` could be consolidated | Low |
| 36 | No data migration path for cache if API schema changes | Low |
| 37 | No environment variable strategy | Medium |
| 38 | `formatDate` accepts unvalidated string union | Low |
| 39 | No manual chunk configuration in Vite config | Low |
| 40 | `useMatchData` useCallback with empty deps references APP_CONFIG | Low |

#### Design Patterns & Coupling (41–60)

| # | Checkpoint | Severity |
|---|------------|----------|
| 41 | No observable/subscription pattern for state changes | Medium |
| 42 | No factory pattern for API endpoint functions | Medium |
| 43 | Match status branching duplicated across 6+ components | High |
| 44 | `CommonOpponents` has 7+ levels of nesting | High |
| 45 | `TeamPage` is a 1073-line god component | Critical |
| 46 | `buildSeasonStats` lives in `PlayerPage.tsx`, not in utils | Medium |
| 47 | `processPlayerMatchHistory` is not memoized | Medium |
| 48 | Two separate WLD computation functions (`getWldFromScore`/`getWldFromWinner`) | Medium |
| 49 | No dependency injection — testing requires module-level mocks | High |
| 50 | Cache TTLs hardcoded with no override mechanism | Medium |
| 51 | No request deduplication across page navigations | Low |
| 52 | Retry delays are a module constant, not customizable | Low |
| 53 | `FETCH_TIMEOUT_MS` is a module constant | Low |
| 54 | No pagination strategy despite API supporting limit/offset | Low |
| 55 | No stale-while-revalidate cache pattern | Low |
| 56 | In-flight promise race: all parallel callers fail if fetch rejects | Medium |
| 57 | `setCached` called asynchronously with dynamic import in `getMatchDetails` | Medium |
| 58 | `batchFetch` has no per-item timeout | Medium |
| 59 | `batchFetch` concurrency hardcoded at 5 | Low |
| 60 | No circuit breaker for failing endpoints | Low |

#### Domain Boundaries (61–80)

| # | Checkpoint | Severity |
|---|------------|----------|
| 61 | `GroupResponse` and `GroupDetails` are nearly identical types | Medium |
| 62 | `MatchSummary` and `DiscoveryMatch` have overlapping fields | Medium |
| 63 | `PastMatchDetail` is a computed view of `PlayerMatchEntry` | Low |
| 64 | No bounded context for "Team" — 4 different team-related types | Medium |
| 65 | `APIConfig` interface is defined but not used elsewhere | Low |
| 66 | API Accept token is hardcoded in `config.ts` (secret in source) | Critical |
| 67 | No `app` or `core` domain directory — everything flat under `src/` | Low |
| 68 | Components directory is flat with no sub-directories | Medium |
| 69 | Skeleton components are UI primitives, mixed with domain components | Low |
| 70 | No barrel exports — imports reference specific files | Medium |
| 71 | `StandingsTable` has page-specific logic (teamAId/teamBId props) | Medium |
| 72 | `PreMatchComparison` and `CommonOpponents` could be merged | Medium |
| 73 | `ErrorBoundaryPage` handles both 404 and render crashes | Low |
| 74 | No entity uniqueness enforcement | Low |
| 75 | No domain events for side effects | Low |
| 76 | No projection/read-model separation in cache layer | Low |
| 77 | `dataProcessors` is not side-effect free — imports APP_CONFIG | Medium |
| 78 | No explicit data flow architecture documentation | Low |
| 79 | `TurnauksetPage` monolithic useEffect handles 5 responsibilities | High |
| 80 | No write-model vs read-model distinction documented | Low |

#### Scalability Considerations (81–100)

| # | Checkpoint | Severity |
|---|------------|----------|
| 81 | No lazy loading for routes | Medium |
| 82 | No bundle analysis or budget | Low |
| 83 | 1073-line TeamPage is a single chunk | High |
| 84 | Framer Motion eagerly imported everywhere | Low |
| 85 | Lucide icons may not be tree-shaken effectively | Low |
| 86 | No virtual scrolling for long lists | Low |
| 87 | StandingsTable renders all teams at once | Low |
| 88 | TeamPage computes 7+ derived states from same matches array | Medium |
| 89 | No React.memo on list item components | Medium |
| 90 | Sequential batch fetching of 22 players takes 5 rounds × latency | Medium |
| 91 | No request priority queuing | Low |
| 92 | PlayerPage re-processes all matches on every filter change | Medium |
| 93 | No Web Worker for heavy computations | Low |
| 94 | Framer Motion animations block rendering during transitions | Low |
| 95 | CSS is not code-split | Low |
| 96 | Google Fonts loaded synchronously | Medium |
| 97 | No image optimization (srcSet, lazy loading) | Medium |
| 98 | No preconnect/dns-prefetch for API domain | Medium |
| 99 | No resource hints for navigation targets | Low |
| 100 | No performance budget defined | Low |

---

### Team 2: The Security, Resilience & Performance Hardener (100 points)

#### OWASP & Security (1–25)

| # | Checkpoint | Severity |
|---|------------|----------|
| 1 | API Accept token exposed in source code (`config.ts`) | Critical |
| 2 | API headers are public and readable in source | Medium |
| 3 | No input sanitization for matchId in MatchPage search | Medium |
| 4 | XSS vector: matchId in URL used in navigation | Medium |
| 5 | XSS vector: team/player/competition names from API rendered without sanitization | Medium |
| 6 | No dangerous innerHTML but untrusted data flows through JSX | Low |
| 7 | No Content Security Policy in index.html | Critical |
| 8 | No HSTS header configured | Low |
| 9 | localStorage for favorites unencrypted (low risk but no protection) | Low |
| 10 | No CSRF protection (app is read-only, but undocumented) | Low |
| 11 | Referer header leaks navigation context | Low |
| 12 | API token exposed in Accept header (logged by proxies/CDNs) | Medium |
| 13 | No OAuth or authentication — static token only | Low |
| 14 | Client-side rate limiter is cosmetic; trivially bypassed | Medium |
| 15 | 5xx retry without idempotency check — thundering herd risk | Medium |
| 16 | No request signing (HMAC/timestamp) | Low |
| 17 | localStorage data has no versioning — future parse errors | Low |
| 18 | `JSON.parse` in loadFavorites swallows all catch errors | Low |
| 19 | No max-length validation on matchId input | Low |
| 20 | No validation of teamId/playerId before API calls | Medium |
| 21 | Empty playerId sent to API without guard | Medium |
| 22 | No provenance validation of API data (no hash/signature) | Low |
| 23 | Kit image URLs from API loaded without sanitization | Low |
| 24 | No subresource integrity for Google Fonts CDN | Medium |
| 25 | No environment-agnostic configuration | Medium |

#### Data Privacy (26–40)

| # | Checkpoint | Severity |
|---|------------|----------|
| 26 | Player birth years displayed in UI (PII) | Medium |
| 27 | Player images loaded from CDN without privacy proxy | Low |
| 28 | No data retention policy — cache stores API responses indefinitely | Medium |
| 29 | No GDPR compliance notice shown to users | Medium |
| 30 | External team crest URLs track users implicitly | Low |
| 31 | No `loading="lazy"` on images | Medium |
| 32 | No privacy audit of bundled libraries (clsx, tailwind-merge) | Low |
| 33 | Google Fonts loads from external CDN — user IP exposed | Medium |
| 34 | No analytics consent framework | Low |
| 35 | No data minimization — full API responses cached | Medium |
| 36 | Team IDs exposed in URL (visible in browser history/referrer) | Low |
| 37 | Cache may store sensitive data if API changes | Low |
| 38 | No data flow documentation visible to users | Low |
| 39 | Player age calculated and displayed from birth year | Low |
| 40 | Youth player data (minors in B/C/D-juniorit) displayed without special handling | Medium |

#### State Management & Memory (41–60)

| # | Checkpoint | Severity |
|---|------------|----------|
| 41 | No cleanup of component state on unmount — stale flash possible | Low |
| 42 | AbortController created per-fetch but cleanup relies on mountedRef | Medium |
| 43 | Cache Map grows unbounded as user navigates | Critical |
| 44 | inFlight Map can grow with unique requests | Medium |
| 45 | lastCallTimes array grows unbounded (only shrinks after 60s) | Medium |
| 46 | Scroll listener in MatchPage leaks if component re-renders | Critical |
| 47 | No WeakRef/FinalizationRegistry for resource cleanup | Low |
| 48 | `player_statistics` accessed via unsafe `as Record<string, unknown>` cast | Medium |
| 49 | teamAPlayers/teamBPlayers not memoized in MatchPage | Medium |
| 50 | TeamPage has 14 useMemo calls — cascading recomputation | Medium |
| 51 | Two separate abortRefs in TeamPage — easy to miss cleanup | Medium |
| 52 | FavoritesPage uses boolean `cancelled` instead of AbortController | Medium |
| 53 | TurnauksetPage uses boolean `cancelled` — race conditions | Critical |
| 54 | React.StrictMode double-renders cause double fetches without cleanup | Medium |
| 55 | processPlayerMatchHistory mutates stats object | Low |
| 56 | pastMatches date sort uses localeCompare instead of date comparison | Low |
| 57 | Home re-fetches competitions on every mount | Medium |
| 58 | withCache stores result even after caller aborts | Low |
| 59 | useFavorites doesn't sync across tabs | Medium |
| 60 | No useSyncExternalStore for localStorage-backed state | Low |

#### Error Handling (61–80)

| # | Checkpoint | Severity |
|---|------------|----------|
| 61 | getCompetitions error silently swallowed in Home | Critical |
| 62 | FavoritesPage error silently swallowed | Critical |
| 63 | CategoryPage shows error but no retry | Medium |
| 64 | CompetitionPage shows error but no retry | Medium |
| 65 | GroupPage shows error but no retry | Medium |
| 66 | TeamPage has two error states (primary + history) with different UX | Medium |
| 67 | 429 rate limit from server classified as generic "API-virhe" | Medium |
| 68 | withCache in-flight promise rejects affect all parallel callers | Medium |
| 69 | signal abort listener added per retry attempt — potential leak | Medium |
| 70 | clearTimeout missing before `continue` in retry loop | Critical |
| 71 | Race condition between signal abort and retry loop iteration | Medium |
| 72 | APITimeoutError thrown for both real timeout and caller abort | Medium |
| 73 | batchFetch silently returns undefined for failed items | Medium |
| 74 | batchFetch has no error logging | Low |
| 75 | CommonOpponents logs error but doesn't show to user | Medium |
| 76 | TurnauksetPage catch uses unsafe `(err as Error).message` | Medium |
| 77 | ErrorBoundaryPage has no "retry children" button | Low |
| 78 | fetchAPIData has no centralized error normalization | Low |
| 79 | No global error handler (window.onerror, unhandledrejection) | Low |
| 80 | Missing cache parameter in MatchPage StandingsTable call | Medium |

#### Edge Cases & Reliability (81–100)

| # | Checkpoint | Severity |
|---|------------|----------|
| 81 | Empty player stats shows "teamsThisYear: ''" | Low |
| 82 | Match with no lineups renders empty team sections | Low |
| 83 | Team with no players handled gracefully | Low |
| 84 | Team with no categories — no category badges shown | Low |
| 85 | Competition with no seasons handled gracefully | Low |
| 86 | MatchPage passes `data.group.teams` to StandingsTable without fallback | Medium |
| 87 | StandingsTable handles empty matches array | Low |
| 88 | Invalid date strings in formatDate may produce wrong dates | Medium |
| 89 | Date parsing with 'T12:00:00' is timezone-dependent | Medium |
| 90 | String sort for ISO dates works but is fragile | Low |
| 91 | allowedYears range: 4 years back from current year | Low |
| 92 | Hardcoded SPL IDs miss new leagues | Medium |
| 93 | Hardcoded HC2026 links go stale after tournament | Low |
| 94 | Playoff name regex assumes specific naming convention | Medium |
| 95 | Inconsistent coercion (Number vs parseInt) | Medium |
| 96 | `Number('10a')` vs `parseInt('10a')` inconsistency | Low |
| 97 | Redundant `isNaN(parseInt(value))` checks | Low |
| 98 | ppg function recreated on every render in TeamPage | Low |
| 99 | CommonOpponents unused destructured props shadow named params | Low |
| 100 | Rapid expand/collapse causes concurrent getMatchDetails calls | Medium |

---

### Team 3: The Clean Code & Maintainability Evangelist (100 points)

#### Code Readability & Cognitive Load (1–25)

| # | Checkpoint | Severity |
|---|------------|----------|
| 1 | `TeamPage.tsx` is 1073 lines — extreme cognitive load | Critical |
| 2 | `CommonOpponents.tsx` has 7+ levels of nesting | High |
| 3 | `StandingsTable.tsx` deeply nested ternary in className | High |
| 4 | WLD abbreviation (V/T/H = Win/Draw/Loss) not documented for English speakers | Low |
| 5 | `processPlayerMatchHistory` is a single 100-line function | High |
| 6 | "Played" magic string used 8+ times across 6 files | High |
| 7 | "Fixture" magic string used 6+ times across 5 files | High |
| 8 | Inline template literals for color classes in MatchHeader | Medium |
| 9 | String replace on WLD_CONFIG colors ('.replace("/10", "/15")') | Medium |
| 10 | Manual className string building in CommonOpponents instead of cn() | Medium |
| 11 | formatDate has unused 'short' format logic | Low |
| 12 | getWldConfig returns 'V' (win) as fallback — semantically wrong | Medium |
| 13 | `cn` function name not self-documenting | Low |
| 14 | `_` and `__` as destructured unused props (non-standard) | Medium |
| 15 | `resultConfig.label` is ambiguous | Low |
| 16 | URL params `turnaus` and `sarja` are Finnish — opaque to non-Finnish devs | Medium |
| 17 | Page name "Turnaukset" clashes with param "turnaus" | Low |
| 18 | WLDKey type resolves to "V" | "T" | "H" — meaning unclear | Low |
| 19 | No ESLint configuration | High |
| 20 | No Prettier configuration | High |
| 21 | No lint-staged or pre-commit hooks | Medium |
| 22 | Inconsistent bracket spacing across files | Low |
| 23 | fetchData defined inside useEffect in TurnauksetPage — recreated every run | Low |
| 24 | Double blank lines before return in PlayerPage | Low |
| 25 | MatchPage combines search, scroll, data, and layout concerns | High |

#### Strict Typing & Linting (26–45)

| # | Checkpoint | Severity |
|---|------------|----------|
| 26 | TypeScript strict mode enabled — good, but code doesn't fully leverage it | Low |
| 27 | `as any[]` casts in TeamPage (4+ occurrences) bypass type safety | High |
| 28 | `as Record<string, unknown>` cast in PlayerPage defeats type checking | Medium |
| 29 | `as T` casts in api.ts — no runtime validation | Medium |
| 30 | `(err as Error).message` in TurnauksetPage — unsafe cast | Medium |
| 31 | `e?.preventDefault()` without null check on optional event | Low |
| 32 | `err: unknown` in useMatchData catch — correct pattern | Info |
| 33 | cn() returns string — no className type constraint | Low |
| 34 | StandingTeam fields are all strings, requiring parseInt everywhere | Medium |
| 35 | ScoreEntry and DiscoveryMatch have overlapping fields | Low |
| 36 | PlayerStatsEntry has optional player_id but used as key | Medium |
| 37 | WLDKey is inferred from WLD_CONFIG — changes propagate silently | Low |
| 38 | matchStatus param correctly typed (string \| undefined) | Info |
| 39 | batchFetch returns (T \| undefined)[] — requires non-null assertions | Medium |
| 40 | PlayerLineupInfo.captain is string "1"/"0" instead of boolean | Low |
| 41 | MAX_CALLS_PER_ENDPOINT is Record<string, number> — no endpoint key safety | Low |
| 42 | TeamResponse.primary_category typed as Record<string, string> — too loose | Low |
| 43 | GroupResponse.rounds typed as Record<string, string>[] — no structure | Low |
| 44 | Competition/Category have index signatures — hard to validate | Low |
| 45 | DiscoveryMatch has index signature | Low |

#### Documentation Completeness (46–60)

| # | Checkpoint | Severity |
|---|------------|----------|
| 46 | config.ts has excellent "HOW TO CHANGE" JSDoc | Info |
| 47 | cache.ts has clear rules header comment | Info |
| 48 | api.ts has good error class documentation | Info |
| 49 | ErrorBoundaryPage explains why it exists | Info |
| 50 | TeamPage has "WARNING" comments about fragile code | Info |
| 51 | PlayerPage has same "WARNING" comments | Info |
| 52 | Most components (Button, StandingsTable, PlayerCard) lack JSDoc | Medium |
| 53 | No README for docs/plans/ directory | Low |
| 54 | AGENTS.md is minimal but useful | Info |
| 55 | DESIGN.md exists but not reviewed for consistency | Info |
| 56 | No API documentation for consumed endpoints | Medium |
| 57 | No CHANGELOG.md | Medium |
| 58 | Component props typed but undocumented | Medium |
| 59 | TurnauksetPage complex domain logic undocumented | Medium |
| 60 | dataProcessors.ts has no module-level comment | Medium |

#### Testability & Mocking (61–80)

| # | Checkpoint | Severity |
|---|------------|----------|
| 61 | No test files found anywhere | Critical |
| 62 | No testing framework in package.json | Critical |
| 63 | fetchAPIData uses real fetch — must mock global.fetch | Medium |
| 64 | Rate limiter is module-scoped mutable state — must reset between tests | Medium |
| 65 | No dependency injection — direct imports everywhere | High |
| 66 | cache.ts is testable as pure module (getCached/setCached/clearCache) | Info |
| 67 | wld.ts is pure and deterministic — easy to test | Info |
| 68 | dates.ts depends on system timezone — needs timezone mocking | Medium |
| 69 | dataProcessors.ts is pure — good test candidate | Info |
| 70 | useFavorites requires localStorage mock | Medium |
| 71 | React components use hooks that call real APIs | High |
| 72 | Framer Motion requires special test wrappers | Medium |
| 73 | No visual regression testing (Storybook/Chromatic) | Low |
| 74 | No integration tests | High |
| 75 | No e2e tests (Playwright/Cypress) | High |
| 76 | withCache has complex promise flow | Medium |
| 77 | batchFetch requires timing-controlled tests | Medium |
| 78 | useMatchData requires 3+ API mocks | Medium |
| 79 | PlayerCard tightly coupled to PlayerStats shape | Medium |
| 80 | No snapshot testing | Medium |

#### Technical Debt Reduction (81–100)

| # | Checkpoint | Severity |
|---|------------|----------|
| 81 | Deprecated `getTeamData` still exists | Medium |
| 82 | Two similar functions: getGroupDetails/getGroupFull | Medium |
| 83 | StandingsTable computes form + opponent results in separate useMemos | Low |
| 84 | buildSeasonStats in PlayerPage file — extract to utils | Low |
| 85 | Scroll listener creates new function every render | Low |
| 86 | Duplicate opponent result logic in StandingsTable and PreMatchComparison | Medium |
| 87 | CommonOpponents formatResult duplicates WLD logic | Medium |
| 88 | GroupPage uses `m.date?.slice(5)` instead of formatDate | Low |
| 89 | Inconsistent formatDate usage (some with 'short', some without) | Low |
| 90 | Two WLD calculation patterns in PlayerPage | Low |
| 91 | getCategoryName defined twice in TeamPage | Medium |
| 92 | cn() used inconsistently across components | Low |
| 93 | Emoji hardcoded for cards (🟨🟥) instead of CSS | Low |
| 94 | PlayerCard uses `new Date().getFullYear() - 1` instead of APP_CONFIG | Medium |
| 95 | Default border-l-2 border-transparent overridden by selection style | Low |
| 96 | Inline style props instead of Tailwind classes (min-h-[44px]) | Low |
| 97 | Repeated card pattern could be a <Card> component | High |
| 98 | Inconsistent cn() import style | Low |
| 99 | GroupPage imports WLD_CONFIG but barely uses it | Low |
| 100 | No `noUnusedLocals`/`noUnusedParameters` in tsconfig | Medium |

---

## Cross-Reference Against Other Reviews

All findings from the other architecture reviews (`FIX_PLAN.md`, `FINAL_PLAN.md`, `architecture_review_opencode-mimo-v2.5-free`, `arkkitehtuuriarvio_deepseek-v4-flash-free`, `PLAN.md`, `deepseek-v4-flash-free_refactoring-plan`) have been verified against current codebase state.

**FIX_PLAN.md / FINAL_PLAN.md — all 6 phases verified:**
| Phase | Status | Notes |
|-------|--------|-------|
| 1. HTML & Config | ✅ Done | `lang=fi`, `viewport-fit=cover`, Google Fonts, body class |
| 2. Extract `cn()` | ✅ Done | Shared `src/utils/cn.ts` imported by all 5 component files |
| 3. Type Safety | ✅ Done | `any[]` → `PlayerMatchEntry[]` in dataProcessors & api.ts |
| 4. Error Handling | ✅ Done | AbortError, abort guard, signal, unmount cleanup, rate limit message |
| 5. Accessibility | ✅ Done | Focus rings, image onError, dots, font weights (1 remaining: see C11) |
| 6. Cleanup | ✅ Done | Dead deps removed, `npm ci`, hardcoded match ID removed |

**deepseek-v4-flash-free refactoring plan:**
| Phase | Status | Notes |
|-------|--------|-------|
| 1. Shared Utilities | ✅ Done | `dates.ts`, `wld.ts`, `crest.ts`, barrel exports |
| 2. Component Extraction | ⏳ Partial | `BackButton.tsx`, `PageLayout.tsx` done; Card component, TeamPage split pending |
| 3. Hook Extraction | ❌ Pending | `useScrollPosition` etc. not extracted |

**PLAN.md** — Over-engineered 5-7 week plan. Its actionable items (type fixes, abort handling, error states) are already covered by the items above.

**One item still outstanding** from the FIX_PLAN.md was missing from my original audit and has been added as C11 (empty matchId validation).

---

## The Unified Master Refactoring Plan

### ✅ Completed Since Original Audit

| Item | What Was Done | Commit |
|------|---------------|--------|
| Domain models extracted from `types/api.ts` | `types/competition.ts`, `types/matches.ts`, `types/players.ts`, `types/teams.ts` created | `ecdc1ba` |
| Barrel exports added | `src/utils/index.ts`, `src/components/index.ts`, `src/hooks/index.ts`, `src/services/index.ts`, `src/types/index.ts` | `ecdc1ba` |
| Shared utilities extracted | `dates.ts`, `wld.ts`, `crest.ts` in `src/utils/` | `ecdc1ba` |
| Config extracted from types | `src/config.ts` separated from `src/types/config.ts` | `ecdc1ba` |
| Component extraction | `BackButton.tsx`, `PageLayout.tsx` extracted from god pages | `ecdc1ba` |
| API rewrite | Typed errors, caching, retry, AbortController, rate limit | `a5113f1` |
| Player card rework | Vertical layout, per-team stats, image error handling | `332e7c8`, `d15cbee` |
| Scroll listener cleanup | MatchPage `removeEventListener` in cleanup (C3 ✅) | `a5113f1` |
| `cancelled` boolean removed | TurnauksetPage migrated away from boolean flag (C7 ✅) | `ecdc1ba` |
| Retry timeout leak fixed | `clearTimeout` now called in all paths (C4 ✅) | `a5113f1` |
| Type fixes | `img_url`/`club_crest` added to TeamResponse | `ed16ce5` |
| Playoff group detection | Dynamic regex-based playoff naming | `4e88c31` |

### 🔴 Critical (Must Fix — Immediate)

| Priority | Issue | Source | Status | Action |
|----------|-------|--------|--------|--------|
| C1 | API Accept token in source code | T2 #1 | ❌ Still in `config.ts` | Move to `.env` → `import.meta.env.VITE_API_TOKEN` with fallback |
| C2 | `TeamPage.tsx` 1068-line god component | T3 #1 | ❌ Still monolithic | Extract 5+ feature components under `src/features/team/` |
| C5 | Unbounded cache Map growth | T2 #43 | ❌ No LRU eviction | Add LRU eviction at 500 entries to `cache.ts` |
| C6 | getCompetitions error silently swallowed | T2 #61 | ❌ Not handled | Surface error state in Home component |
| C8 | "Played"/"Fixture" magic strings | T3 #6, #7 | ❌ Still in `dataProcessors.ts:48,98,112` | Create `MATCH_STATUS` constants in shared types |
| C10 | No Content Security Policy | T2 #7 | ❌ Missing from `index.html` | Add `<meta http-equiv="Content-Security-Policy">` |
| C11 | Empty matchId validation | FIX_PLAN §4.5 | ❌ MatchPage sends empty matchId to API | Add `else if (matchId !== '') setError('Virheellinen ottelun ID')` |

### 🟠 High (Should Fix — Next)

| Priority | Issue | Original # | Status | Action |
|----------|-------|------------|--------|--------|
| H1 | Repeated card pattern | T3 #97 | ❌ Not extracted | Extract `<Card>` component: `bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3` |
| H2 | getGroupDetails/getGroupFull duplicate | T1 #34 | ❌ Both still exist | Consolidate to single function with union return type |
| H3 | Deprecated getTeamData | T1 #23, #81 | ❌ Still in api.ts | Remove function, migrate callers |
| H4 | No lazy loading for routes | T1 #81 | ❌ Not added | Add `React.lazy()` for heavy pages (TeamPage, TurnauksetPage) |
| H5 | No runtime API response validation | T2 #11 | ❌ Still `as T` casts | Add validation in `fetchAPIData`, log dev warnings |
| H6 | processPlayerMatchHistory >100 lines | T3 #5 | ❌ Still monolithic | Split into `aggregateStats`, `buildPastMatchDetails`, `computeResult` |
| H7 | getCategoryName duplicated in TeamPage | T3 #91 | ❌ Likely still duplicated | Extract to shared utility |
| H8 | dataProcessors imports APP_CONFIG directly | T1 #2 | ❌ Still direct import | Pass config as parameter |
| H13 | Cross-tab favorites sync | T2 #59 | ❌ Not implemented | Listen to `window.addEventListener('storage', ...)` |
| H16 | FavoritesPage error silently swallowed | T2 #62 | ❌ Not handled | Add error state and display |
| H17 | No test framework or tests | T3 #61, #62 | ❌ Missing entirely | Add vitest, write tests for `wld.ts`, `dates.ts`, `cache.ts`, `dataProcessors.ts` |
| H9 | Rate limiter mutable state | T1 #14 | ❌ Module-scoped arrays | Create `RateLimiter` class with reset method |
| H12 | Duplicate opponent result logic | T1 #86 | ❌ Duplicated | Extract shared `computeOpponentResults` helper |
| H15 | CommonOpponents race on expand/collapse | T2 #100 | ❌ Not fixed | Per-opponent AbortController in `handleToggle` |

### 🟢 Medium (Backlog)

| Priority | Issue | Original # | Status | Action |
|----------|-------|------------|--------|--------|
| M2 | No preconnect for API domain | T2 #98 | ❌ Missing | Add `<link rel="preconnect" href="https://spl.torneopal.net">` |
| M3 | Bundle analysis | T1 #82 | ❌ Not done | Add `vite-bundle-visualizer` |
| M4 | React.memo on list items | T1 #89 | ❌ Not added | Wrap StandingsTable rows, PlayerCard |
| M6 | Hardcoded HC2026 links | T1 #15 | ❌ Still in Home | Move to config.ts |
| M7 | Hardcoded SPL_IDS | T1 #92 | ❌ Still hardcoded | Move league IDs to config.ts |
| M8 | Enable `noUnusedLocals` | T3 #100 | ❌ Not enabled | Add to compilerOptions |
| M9 | ESLint + Prettier | T3 #19, #20 | ❌ Not configured | Configure with React Hooks plugin |
| M10 | Consolidate WLD functions | T1 #48 | ❌ Still two functions | Merge `getWldFromScore` and `getWldFromWinner` |
| M11 | MatchPage StandingsTable fallback | T2 #86 | ❌ Missing | Add `teams={data.group?.teams || []}` |
| M12 | Image lazy loading | T2 #31 | ❌ Not added | Add `loading="lazy"` to all crests/player images |
| M14 | Set up vitest config | T3 #62 | ❌ Not started | Add `vitest.config.ts` |
| M15 | Google Fonts font-display: swap | T2 #96 | ❌ Not verified | Check font loading performance |
| M18 | Cache TTL override | T1 #50 | ❌ Not implemented | Add optional `ttlOverride` parameter |
| M19 | Extract buildQueryString utility | — | ❌ Still inline | Deduplicate param cleaning in api.ts |

---

### Phased Implementation Roadmap (Updated)

#### Phase 1: Safety & Security (Next)
1. Move API token to `.env` — C1
2. Add CSP meta tag — C10
3. Create `MATCH_STATUS` constants — C8
4. Add LRU cache eviction (500 entries) — C5
5. Surface `getCompetitions` error in Home — C6

#### Phase 2: Decomposition & Structure
1. Extract `<Card>` component — H1
2. Split `processPlayerMatchHistory` — H6
3. Remove deprecated `getTeamData`, consolidate group endpoints — H2, H3
4. Extract `buildQueryString` and `getCategoryName` — H7, M19
5. Enable `noUnusedLocals` — M8
6. Configure ESLint + Prettier — M9

#### Phase 3: God Component Breakdown
1. Decompose `TeamPage.tsx` → feature components — C2
2. Review `TurnauksetPage` useEffect decomposition — T1 #79
3. Add `React.lazy()` for heavy pages — H4
4. Consolidate WLD logic — M10
5. Deduplicate opponent result logic — H12

#### Phase 4: Resilience & Testing
1. Add runtime API response validation — H5
2. Add cross-tab sync for favorites — H13
3. Refactor rate limiter → `RateLimiter` class — H9
4. Add preconnect for API domain — M2
5. Set up vitest and write initial test suite — H17
6. Add image lazy loading — M12
7. Add `loading="lazy"` to all images

#### Phase 5: Hardening
1. Fix CommonOpponents race condition — H15
2. Fix FavoritesPage error handling — H16
3. Fix MatchPage StandingsTable fallback — M11
4. Add Cache TTL override parameter — M18
5. Move hardcoded config to config.ts — M6, M7
6. Run bundle analysis — M3
7. Add React.memo on list items — M4
