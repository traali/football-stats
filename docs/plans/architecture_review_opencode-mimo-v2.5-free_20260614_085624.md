# Architecture Review — football-stats

---

## Metadata

| Field | Value |
|-------|-------|
| **Model** | `opencode/mimo-v2.5-free` |
| **Execution Timestamp** | `2026-06-14T08:56:24Z` |
| **Arena Status** | COMPLETE — 300 findings synthesized |
| **Codebase** | Finnish youth football statistics SPA |
| **Stack** | React 19 + TypeScript + Vite 7 + Tailwind 4 + Framer Motion |

---

## The Arena Fight Summary

Three expert teams competed to produce the highest-quality architectural audit of this 35-file React/TypeScript football statistics application.

### Team 1: Enterprise Architect & Design Pattern Guard
Delivered 100 findings focused on SOLID violations, god components, DRY violations, cache key collisions, mutable singletons, and missing abstractions. Their strongest finding: **TeamPage.tsx is a 1073-line god component** with 12+ useMemo hooks, 3 useEffect hooks, and inline JSX for 6+ distinct content sections — the single highest-priority refactoring target.

### Team 2: Security, Resilience & Performance Hardener
Delivered 100 findings focused on hardcoded API credentials, missing AbortControllers, unbounded cache growth, stack traces exposed to users, and silent failure modes. Their strongest finding: **API Accept token is hardcoded in source code** and visible in the compiled bundle — a credential exposure risk.

### Team 3: Clean Code & Maintainability Evangelist
Delivered 100 findings focused on zero test infrastructure, no ESLint/Prettier, duplicated logic across 6+ files, hardcoded Finnish strings with no i18n, and missing barrel exports. Their strongest finding: **The codebase has zero tests** — no test framework, no test files, no test scripts.

### Synthesis Conflicts Resolved

| Conflict | Resolution |
|----------|-----------|
| Barrel exports + path aliases vs. simple imports | **Adopt** — small codebase, aliases reduce import verbosity |
| Code splitting (React.lazy) vs. eager loading | **Adopt for heavy pages only** — TeamPage, TurnauksetPage, PlayerPage |
| Shared utility extraction vs. YAGNI | **Strong agree on extraction** — getMatchResult, toNum, getWldBadgeClasses are highest ROI |
| Zod runtime validation vs. manual guards | **Skip Zod** — use manual type guards, Zod is overkill for this app size |
| Storybook vs. inline docs | **Medium priority** — after core refactoring is complete |

---

## The 300-Point Audit Ledger

### Team 1: Enterprise Architect & Design Pattern Guard (100 Findings)

| # | Priority | Finding | File(s) |
|---|----------|---------|---------|
| 1 | C | God Component — TeamPage.tsx (1073 lines) | `src/pages/TeamPage.tsx:13-1073` |
| 2 | C | Duplicated `getCategoryName` helper (3x in TeamPage) | `src/pages/TeamPage.tsx:369,818` |
| 3 | C | Cache key collision between getGroupDetails and getGroupFull | `src/services/api.ts:251,351` |
| 4 | C | Dynamic import of cache module inside getMatchDetails | `src/services/api.ts:244-248` |
| 5 | C | Hardcoded tournament links on Home page | `src/pages/Home.tsx:93-123` |
| 6 | H | No error boundary on individual pages | `src/routes.tsx:27` |
| 7 | H | batchFetch drops failures silently to undefined | `src/services/api.ts:211-227` |
| 8 | H | useMatchData hook orchestration complexity | `src/hooks/useMatchData.ts:1-92` |
| 9 | H | Rate limiter state is module-level mutable | `src/services/api.ts:51-52` |
| 10 | H | waitForRateLimit is a busy-wait loop | `src/services/api.ts:55-91` |
| 11 | H | CommonOpponents does not pass signal to getMatchDetails | `src/components/CommonOpponents.tsx:88-91` |
| 12 | H | No abort signal in CompetitionPage and CategoryPage | `src/pages/CompetitionPage.tsx:18`, `CategoryPage.tsx:17` |
| 13 | H | No abort signal in GroupPage | `src/pages/GroupPage.tsx:22` |
| 14 | H | FavoritesPage missing abort controller | `src/pages/FavoritesPage.tsx:17` |
| 15 | H | Home.tsx missing abort controller | `src/pages/Home.tsx:20-23` |
| 16 | H | CommonOpponents unused destructured aliases | `src/components/CommonOpponents.tsx:25` |
| 17 | H | TurnauksetPage is 569 lines with inline logic | `src/pages/TurnauksetPage.tsx:34-569` |
| 18 | H | Standings table duplicated in TurnauksetPage | `src/pages/TurnauksetPage.tsx:256-300` |
| 19 | H | APP_CONFIG is mutable singleton with hardcoded secrets | `src/types/config.ts:54-113` |
| 20 | H | No environment variable support | `src/types/config.ts:61-65` |
| 21 | H | CURRENT_YEAR/PREVIOUS_YEAR are static strings | `src/types/config.ts:73-74` |
| 22 | H | PlayerPage uses unsafe type assertion for player_statistics | `src/pages/PlayerPage.tsx:113` |
| 23 | H | PlayerAPIResponse has index signature hiding missing fields | `src/types/api.ts:28` |
| 24 | H | Multiple types have [key: string]: unknown index signatures | `src/types/api.ts:28,151,158,165,233` |
| 25 | M | StandingTeam uses strings for all numeric fields | `src/types/api.ts:189-201` |
| 26 | M | MatchSummary types fs_A/fs_B as string not optional | `src/types/api.ts:210-211` |
| 27 | M | Inconsistent error handling in pages | Multiple pages |
| 28 | M | dataProcessors.ts has too many responsibilities | `src/utils/dataProcessors.ts:19-122` |
| 29 | M | useFavorites stores raw team IDs with no validation | `src/hooks/useFavorites.ts:5-8` |
| 30 | M | No shared useAbortEffect custom hook | All pages with useEffect |
| 31 | M | getWldFromScore returns default 'V' for missing scores | `src/utils/wld.ts:14` |
| 32 | M | getWldFromWinner returns 'V' when winnerId is undefined | `src/utils/wld.ts:23` |
| 33 | M | BottomNav hardcodes competition ID | `src/components/BottomNav.tsx:7` |
| 34 | M | MatchPage scroll listener has no debounce/throttle | `src/pages/MatchPage.tsx:31-39` |
| 35 | M | No lazy loading of route components | `src/routes.tsx:1-42` |
| 36 | M | match_status cache rule split between api.ts and cache.ts | `src/services/api.ts:235-248`, `cache.ts:76` |
| 37 | M | APIConfig type does not match runtime structure | `src/types/config.ts:8-52` |
| 38 | M | processPlayerMatchHistory strict equality on season_id | `src/utils/dataProcessors.ts:47,111` |
| 39 | M | TeamPage inline type RosterEntry defined inside render | `src/pages/TeamPage.tsx:504` |
| 40 | M | TeamPage inline rosterPlayers after early returns | `src/pages/TeamPage.tsx:503-515` |
| 41 | M | Home.tsx filters competitions by hardcoded SPL IDs | `src/pages/Home.tsx:10` |
| 42 | M | PreMatchComparison and CommonOpponents overlap | Two component files |
| 43 | M | formatResult builds Tailwind classes via string concatenation | `src/components/CommonOpponents.tsx:134-171` |
| 44 | M | TeamPage WLD badge classes built via string manipulation | `src/pages/TeamPage.tsx:760-761` |
| 45 | M | useMatchData error message drops typed error info | `src/hooks/useMatchData.ts:84` |
| 46 | M | TeamPage historical fetch depends on team?.players in deps | `src/pages/TeamPage.tsx:212` |
| 47 | M | No strict null checks for API response fields | `src/types/api.ts` |
| 48 | M | TurnauksetPage does not use AbortController | `src/pages/TurnauksetPage.tsx:58-124` |
| 49 | M | batchFetch sequential batching instead of concurrent | `src/services/api.ts:218-226` |
| 50 | M | No global error/toast notification system | All components |
| 51 | M | MatchHeader receives 5 props but only uses 4 | `src/components/MatchHeader.tsx:24` |
| 52 | M | StandingsTable props interface is inline not named | `src/components/StandingsTable.tsx:7-15` |
| 53 | M | StandingsTable sorting doesn't handle tied points | `src/components/StandingsTable.tsx:19` |
| 54 | M | TeamPage statsByYear recalculates for all years | `src/pages/TeamPage.tsx:215-288` |
| 55 | M | allowedYears useMemo has no dependencies | `src/pages/TeamPage.tsx:60-63` |
| 56 | M | Home page competition lists not memoized | `src/pages/Home.tsx:32-33` |
| 57 | M | GroupPage top scorers computed in render not memoized | `src/pages/GroupPage.tsx:30-33` |
| 58 | M | PlayerPage buildSeasonStats called every render | `src/pages/PlayerPage.tsx:87` |
| 59 | M | TurnauksetPage state fragmented across 10+ useState | `src/pages/TurnauksetPage.tsx:38-56` |
| 60 | M | TeamPage WLD badge color construction has bug | `src/pages/TeamPage.tsx:760` |
| 61 | M | CommonOpponents same no-op replace pattern | `src/components/CommonOpponents.tsx:152-162` |
| 62 | M | No unit tests for processPlayerMatchHistory | `src/utils/dataProcessors.ts` |
| 63 | M | No unit tests for cache logic | `src/services/cache.ts` |
| 64 | M | No unit tests for rate limiter | `src/services/api.ts:55-91` |
| 65 | M | No unit tests for wld.ts utilities | `src/utils/wld.ts` |
| 66 | M | No unit tests for dates.ts | `src/utils/dates.ts` |
| 67 | M | TeamPage effect dep includes team?.players reference | `src/pages/TeamPage.tsx:212` |
| 68 | M | TurnauksetPage renders match detail without score for fixtures | `src/pages/TurnauksetPage.tsx:318-368` |
| 69 | M | CommonOpponents fetches without cache invalidation | `src/components/CommonOpponents.tsx:85-101` |
| 70 | M | FavoritesPage shows team ID as name while loading | `src/pages/FavoritesPage.tsx:60` |
| 71 | M | TeamPage sort of upcoming matches has bug | `src/pages/TeamPage.tsx:437` |
| 72 | M | PlayerPage age calculation uses current year | `src/pages/PlayerPage.tsx:117` |
| 73 | M | TeamPage performanceComparison uses years[0] fallback | `src/pages/TeamPage.tsx:296` |
| 74 | M | TurnauksetPage playoffGroups detection heuristic fragile | `src/pages/TurnauksetPage.tsx:96` |
| 75 | M | TeamPage categoriesByYear deduplicates by name not ID | `src/pages/TeamPage.tsx:394` |
| 76 | M | getTeamData deprecated but still exported | `src/services/api.ts:261-265` |
| 77 | M | MatchPage teamAPlayers/teamBPlayers not memoized | `src/pages/MatchPage.tsx:49-50` |
| 78 | M | MatchPage stats computations not memoized | `src/pages/MatchPage.tsx:52-58` |
| 79 | M | PreMatchComparison overlapping useMemo dependency | `src/components/PreMatchComparison.tsx:16-69` |
| 80 | M | StatBadge does not handle large numbers | `src/components/StatBadge.tsx:28` |
| 81 | M | Button component missing type="button" default | `src/components/Button.tsx:28` |
| 82 | M | TeamPage historical fetch doesn't handle partial failures | `src/pages/TeamPage.tsx:112-120` |
| 83 | M | TeamPage relevantGroups type uses any[] | `src/pages/TeamPage.tsx:88` |
| 84 | M | TeamPage categoriesByYear also uses any[] | `src/pages/TeamPage.tsx:381,401` |
| 85 | M | PlayerPage stats uses double unsafe cast | `src/pages/PlayerPage.tsx:113` |
| 86 | M | TurnauksetPage uses as MatchWithVenue[] cast | `src/pages/TurnauksetPage.tsx:85` |
| 87 | M | TeamPage rosterPlayers inline type definition | `src/pages/TeamPage.tsx:504` |
| 88 | M | MatchPage no loading state for initial render | `src/pages/MatchPage.tsx:190-294` |
| 89 | M | Home.tsx tournament cards lack keyboard support | `src/pages/Home.tsx:93-123` |
| 90 | M | TeamPage inline roster card not extracted | `src/pages/TeamPage.tsx:538-563` |
| 91 | M | TeamPage inline transition card not extracted | `src/pages/TeamPage.tsx:597-619,653-676` |
| 92 | M | TeamPage inline top scorer row not extracted | `src/pages/TeamPage.tsx:689-706` |
| 93 | M | TeamPage inline match row JSX repeated | `src/pages/TeamPage.tsx:718-729,740-777` |
| 94 | M | TurnauksetPage inline match row JSX | `src/pages/TurnauksetPage.tsx:313-371` |
| 95 | M | TurnauksetPage inline playoff match row | `src/pages/TurnauksetPage.tsx:412-446` |
| 96 | M | No centralized route constants | All page files |
| 97 | M | TeamPage last5Form sort is incorrect | `src/pages/TeamPage.tsx:437` |
| 98 | M | cache.ts TTL_MS map missing getTeamMatches key | `src/services/cache.ts:17-28` |
| 99 | M | PlayerPage expanded state uses object not efficient | `src/pages/PlayerPage.tsx:49` |
| 100 | M | api.ts fetchAPIData has inconsistent error re-throw logic | `src/services/api.ts:186-190` |

### Team 2: Security, Resilience & Performance Hardener (100 Findings)

| # | Priority | Finding | File(s) |
|---|----------|---------|---------|
| 1 | C | API authentication token hardcoded in source code | `src/types/config.ts:63` |
| 2 | C | API Referer header hardcoded in source code | `src/types/config.ts:64` |
| 3 | C | Stack traces exposed to users in ErrorBoundaryPage | `src/components/ErrorBoundaryPage.tsx:44-65` |
| 4 | C | External image URLs loaded without sanitization | Multiple components |
| 5 | C | localStorage favorites stored without validation | `src/hooks/useFavorites.ts:5-8` |
| 6 | C | No Content Security Policy headers | `index.html` |
| 7 | C | Cache never evicted — unbounded memory growth | `src/services/cache.ts:38,80` |
| 8 | C | CommonOpponents fetches without AbortController | `src/components/CommonOpponents.tsx:86-101` |
| 9 | C | batchFetch silently swallows individual failures | `src/services/api.ts:222-224` |
| 10 | C | No Retry-After header handling from API | `src/services/api.ts:61-63` |
| 11 | C | parseInt calls without NaN checks in score calculations | Multiple files |
| 12 | C | Rate limiter lastCallTimes grows unbounded within window | `src/services/api.ts:51,69` |
| 13 | C | Race condition in TeamPage historical players fetch | `src/pages/TeamPage.tsx:99-212` |
| 14 | C | FavoritesPage makes unbounded parallel requests | `src/pages/FavoritesPage.tsx:17` |
| 15 | C | No input validation on route parameters beyond match ID | Multiple pages |
| 16 | C | No CSRF protection for API calls | `src/services/api.ts:137-140` |
| 17 | C | MatchPage scroll listener not cleaned on fast navigation | `src/pages/MatchPage.tsx:30-40` |
| 18 | C | Dynamic import in getMatchDetails creates untracked promise | `src/services/api.ts:244-246` |
| 19 | C | No maximum size limit on localStorage favorites | `src/hooks/useFavorites.ts:15-22` |
| 20 | C | API response validation missing for many endpoints | `src/services/api.ts:159-166` |
| 21 | C | inFlight map promise rejection leaves stale entry | `src/services/cache.ts:112-115` |
| 22 | C | No rate limiting on client-side favorites loading | `src/pages/FavoritesPage.tsx:17` |
| 23 | C | Match ID not sanitized before URL construction | `src/pages/MatchPage.tsx:46`, `Home.tsx:29` |
| 24 | C | Error messages leaked to console in CommonOpponents | `src/components/CommonOpponents.tsx:97` |
| 25 | C | No subresource integrity for external font loading | `index.html:10` |
| 26 | H | mountedRef pattern causes silent data loss on navigation | `src/hooks/useMatchData.ts:19,42,49,54,83` |
| 27 | H | Rate limiter 200ms polling creates CPU waste | `src/services/api.ts:89` |
| 28 | H | No abort signal propagation in FavoritesPage | `src/pages/FavoritesPage.tsx:17` |
| 29 | H | useEffect dependencies in GroupPage missing cleanup | `src/pages/GroupPage.tsx:19-25` |
| 30 | H | useEffect dependencies in CompetitionPage missing cleanup | `src/pages/CompetitionPage.tsx:15-21` |
| 31 | H | useEffect dependencies in CategoryPage missing cleanup | `src/pages/CategoryPage.tsx:14-20` |
| 32 | H | TurnauksetPage uses cancelled flag but doesn't abort HTTP | `src/pages/TurnauksetPage.tsx:60-124` |
| 33 | H | StandingsTable parses scores without radix parameter | `src/components/StandingsTable.tsx:32-33,65-66` |
| 34 | H | PreMatchComparison parses scores without default fallback | `src/components/PreMatchComparison.tsx:22-23` |
| 35 | H | WLD_CONFIG access without type safety in TeamPage | `src/pages/TeamPage.tsx:760-761` |
| 36 | H | TeamPage allows any type for groups and categories | `src/pages/TeamPage.tsx:88,381,401` |
| 37 | H | PlayerPage uses unsafe type assertion for player_statistics | `src/pages/PlayerPage.tsx:113` |
| 38 | H | MatchPage parses parseInt without NaN check | `src/pages/MatchPage.tsx:54-55` |
| 39 | H | Home page makes API call without AbortController | `src/pages/Home.tsx:19-23` |
| 40 | H | TeamPage selectedYear state not reset when team changes | `src/pages/TeamPage.tsx:22` |
| 41 | H | FavoritesPage shows raw team ID when name unavailable | `src/pages/FavoritesPage.tsx:59` |
| 42 | H | Home page hardcoded tournament links | `src/pages/Home.tsx:94,109` |
| 43 | H | BottomNav hardcoded to /competition/spl | `src/components/BottomNav.tsx:7` |
| 44 | H | Error messages in Finnish not localizable | Multiple files |
| 45 | H | Rate limiter doesn't handle tab backgrounding | `src/services/api.ts:51-91` |
| 46 | H | Cache key generation doesn't handle object parameters | `src/services/cache.ts:42-48` |
| 47 | H | Cache TTL not configurable per-entry | `src/services/cache.ts:17-28` |
| 48 | H | TurnauksetPage doesn't validate route params format | `src/pages/TurnauksetPage.tsx:59` |
| 49 | H | FavoritesPage doesn't handle individual team fetch failures | `src/pages/FavoritesPage.tsx:17-19` |
| 50 | H | MatchPage selectedTeam state not cleared on match change | `src/pages/MatchPage.tsx:19` |
| 51 | H | PlayerCard image error state not reset when player changes | `src/components/PlayerCard.tsx:15` |
| 52 | H | MatchHeader doesn't validate team IDs before linking | `src/components/MatchHeader.tsx:50,69` |
| 53 | H | CommonOpponents tab state shared across all opponents | `src/components/CommonOpponents.tsx:29` |
| 54 | H | TeamPage allowedYears computed on every render | `src/pages/TeamPage.tsx:60-63` |
| 55 | H | TeamPage sort comparator bug in upcoming matches | `src/pages/TeamPage.tsx:437` |
| 56 | H | InFlight map promise cleanup on unmount | `src/services/cache.ts:103-104` |
| 57 | H | No timeout on batchFetch individual requests | `src/services/api.ts:211-227` |
| 58 | H | TeamPage historical players uses any for group metadata | `src/pages/TeamPage.tsx:88,110,134` |
| 59 | H | MatchPage Number constructor for score display | `src/pages/MatchPage.tsx:224` |
| 60 | H | FavoritesPage no loading state for individual teams | `src/pages/FavoritesPage.tsx:49-65` |
| 61 | H | No retry logic for FavoritesPage team fetches | `src/pages/FavoritesPage.tsx:17-19` |
| 62 | H | TeamPage historicalPlayersByYear initialized empty | `src/pages/TeamPage.tsx:25` |
| 63 | H | StandingsTable doesn't handle missing current_standing | `src/components/StandingsTable.tsx:19` |
| 64 | H | PlayerCard doesn't handle missing player_name | `src/components/PlayerCard.tsx:102` |
| 65 | H | MatchHeader score display uses ?? operator | `src/components/MatchHeader.tsx:59` |
| 66 | H | No error boundary for individual route segments | `src/routes.tsx:27` |
| 67 | H | MatchPage searchValue not synced on back navigation | `src/pages/MatchPage.tsx:18,23-28` |
| 68 | H | TeamPage performanceComparison depends on empty years | `src/pages/TeamPage.tsx:296-338` |
| 69 | H | PlayerPage seasonName sort uses string comparison | `src/pages/PlayerPage.tsx:40` |
| 70 | H | No request deduplication for parallel getTeamProfile calls | `src/pages/FavoritesPage.tsx:17` |
| 71 | M | useEffect in MatchPage has fetchData in dependency array | `src/pages/MatchPage.tsx:28` |
| 72 | M | No loading state for CompetitionPage seasons | `src/pages/CompetitionPage.tsx:11` |
| 73 | M | StandingsTable sorted array created on every render | `src/components/StandingsTable.tsx:19` |
| 74 | M | TeamPage displayStats fallback creates new object | `src/pages/TeamPage.tsx:290-292` |
| 75 | M | PlayerCard cardVariants defined outside component | `src/components/PlayerCard.tsx:9-12` |
| 76 | M | Home page primaryComps/otherComps recomputed every render | `src/pages/Home.tsx:32-33` |
| 77 | M | MatchPage teamAPlayers/teamBPlayers recomputed every render | `src/pages/MatchPage.tsx:49-50` |
| 78 | M | Dates utility doesn't handle invalid date strings | `src/utils/dates.ts:3` |
| 79 | M | formatTime returns empty string for undefined | `src/utils/dates.ts:12` |
| 80 | M | WLD_CONFIG getWldConfig returns wrong default | `src/utils/wld.ts:10` |
| 81 | M | MatchPage doesn't debounce search input | `src/pages/MatchPage.tsx:144` |
| 82 | M | TeamPage goalsByTeamThisYear key could have collisions | `src/utils/dataProcessors.ts:54` |
| 83 | M | PlayerPage teamKeys deduplication uses Set | `src/pages/PlayerPage.tsx:114` |
| 84 | M | MatchPage AnimatePresence mode wait causes layout shift | `src/pages/MatchPage.tsx:157` |
| 85 | M | PlayerCard uses key={i} for past matches | `src/components/PlayerCard.tsx:93` |
| 86 | M | GroupPage uses key={i} for top scorers | `src/pages/GroupPage.tsx:64` |
| 87 | M | MatchHeader uses key={i} for goals and bookings | `src/components/MatchHeader.tsx:87,140` |
| 88 | M | TeamPage form indicators use array index as key | `src/pages/TeamPage.tsx:862` |
| 89 | M | StandingsTable form indicators use array index as key | `src/components/StandingsTable.tsx:189` |
| 90 | M | No aria-label on icon-only buttons | Multiple components |
| 91 | M | Missing alt text for team crest images | `src/components/MatchHeader.tsx:53,73` |
| 92 | M | BottomNav uses min-w-[64px] not responsive | `src/components/BottomNav.tsx:21` |
| 93 | M | No loading="lazy" on below-the-fold images | Multiple components |
| 94 | M | Home page footer copyright year hardcoded | `src/pages/Home.tsx:172` |
| 95 | M | MatchPage sticky header z-index may conflict | `src/pages/MatchPage.tsx:75` |
| 96 | M | PlayerPage season comparison doesn't handle empty seasons | `src/pages/PlayerPage.tsx:225-317` |
| 97 | M | MatchPage no keyboard navigation for search | `src/pages/MatchPage.tsx:137-154` |
| 98 | M | TeamPage WLD badge uses string concatenation for CSS | `src/pages/TeamPage.tsx:760-761` |
| 99 | M | MatchPage staggerContainer variants recreated every render | `src/pages/MatchPage.tsx:60-63` |
| 100 | M | No service worker for offline support | `index.html`, `vite.config.ts` |

### Team 3: Clean Code & Maintainability Evangelist (100 Findings)

| # | Priority | Finding | File(s) |
|---|----------|---------|---------|
| 1 | C | TeamPage.tsx is a 1073-line god component | `src/pages/TeamPage.tsx:1-1073` |
| 2 | C | TurnauksetPage.tsx is a 569-line monolith | `src/pages/TurnauksetPage.tsx:1-569` |
| 3 | C | No test infrastructure whatsoever | `package.json`, `src/` |
| 4 | C | No ESLint or Prettier configuration | project root |
| 5 | C | getCategoryName function duplicated inside TeamPage | `src/pages/TeamPage.tsx:369,818` |
| 6 | C | as any[] casts in TeamPage bypass type safety | `src/pages/TeamPage.tsx:88,381,401` |
| 7 | C | CommonOpponents destructures props as _ and __ | `src/components/CommonOpponents.tsx:25` |
| 8 | C | Home.tsx hardcodes tournament paths | `src/pages/Home.tsx:93-123` |
| 9 | C | All routes eagerly loaded — no code splitting | `src/routes.tsx:1-42` |
| 10 | C | No barrel exports anywhere | `src/components/`, `src/hooks/`, etc. |
| 11 | H | Duplicate WLD badge styling logic in 6 files | Multiple files |
| 12 | H | getCategoryName defined inline in TurnauksetPage too | `src/pages/TurnauksetPage.tsx:90-93` |
| 13 | H | Inconsistent error handling across pages | Multiple pages |
| 14 | H | No AbortController in GroupPage, CompetitionPage, CategoryPage | Three page files |
| 15 | H | date.slice(0, 4) repeated 10+ times with no helper | `src/pages/TeamPage.tsx` (5+), PlayerPage, GroupPage |
| 16 | H | Match result calculation duplicated across 6 files | Multiple files |
| 17 | H | parseInt(value \|\| '0') scattered everywhere | 20+ occurrences |
| 18 | H | Skeleton components defined alongside real components | `src/components/Skeleton.tsx`, inline in pages |
| 19 | H | No prop-types or JSDoc on any component | All component files |
| 20 | H | cn() utility usage is inconsistent | Multiple files |
| 21 | H | getCategoryName called with any parameter types | `src/pages/TeamPage.tsx:369,818` |
| 22 | H | TurnauksetPage has [key: string]: unknown index signature | `src/pages/TurnauksetPage.tsx:24` |
| 23 | H | Multiple types in api.ts have index signature escape hatches | `src/types/api.ts:27,151,159,166,233,245` |
| 24 | H | formatDate/formatTime used but no barrel export from utils | `src/utils/` |
| 25 | H | formatDayName function in dates.ts is unused | `src/utils/dates.ts:15-18` |
| 26 | H | useFavorites hook stores raw team IDs — no resolution on Home | `src/pages/Home.tsx:68-85` |
| 27 | H | useMatchData hook returns stale data on re-mount | `src/hooks/useMatchData.ts:19-23` |
| 28 | H | useMatchData hook missing fetchData in useCallback deps | `src/hooks/useMatchData.ts:89` |
| 29 | H | No code-level documentation for API layer retry/cache | `src/services/api.ts`, `cache.ts` |
| 30 | H | No TypeScript path aliases configured | `tsconfig.json`, `vite.config.ts` |
| 31 | M | MatchPage has inline sticky header logic | `src/pages/MatchPage.tsx:30-40` |
| 32 | M | handleToggle in CommonOpponents lacks abort support | `src/components/CommonOpponents.tsx:76-101` |
| 33 | M | processPlayerMatchHistory is only extracted pure function | `src/utils/dataProcessors.ts` vs inline logic |
| 34 | M | Hardcoded Finnish strings throughout UI with no i18n | All page/component files |
| 35 | M | SPL_IDS constant in Home.tsx not documented or exported | `src/pages/Home.tsx:10` |
| 36 | M | BottomNav hardcodes /competition/spl as browse route | `src/components/BottomNav.tsx:7` |
| 37 | M | api.ts has deprecated function still in codebase | `src/services/api.ts:261-265` |
| 38 | M | useFavorites reads from localStorage synchronously | `src/hooks/useFavorites.ts:3-10` |
| 39 | M | TeamPage has 12 useMemo hooks — excessive memoization | `src/pages/TeamPage.tsx:60-484` |
| 40 | M | No engines field in package.json | `package.json` |
| 41 | M | fetchAPIData returns data as T without runtime validation | `src/services/api.ts:168` |
| 42 | M | withCache matchStatus parameter is confusing | `src/services/cache.ts:90-119` |
| 43 | M | getMatchDetails uses dynamic import instead of static | `src/services/api.ts:244` |
| 44 | M | getGroupFull and getGroupDetails are near-duplicates | `src/services/api.ts:251,351` |
| 45 | M | APP_CONFIG.PREVIOUS_YEAR is manually decremented | `src/types/config.ts:73-74` |
| 46 | M | APP_CONFIG contains API secrets in frontend bundle | `src/types/config.ts:62-64` |
| 47 | M | batchFetch silently swallows errors as undefined | `src/services/api.ts:211-227` |
| 48 | M | Rate limiter uses module-level mutable arrays | `src/services/api.ts:51-91` |
| 49 | M | createHashRouter used instead of createBrowserRouter | `src/routes.tsx:1,24` |
| 50 | M | No viewport or theme-color in HTML | `index.html` |
| 51 | M | PlayerPage buildSeasonStats defined at module scope | `src/pages/PlayerPage.tsx:19-41` |
| 52 | M | statFilters object in PlayerPage re-created every render | `src/pages/PlayerPage.tsx:234-255` |
| 53 | M | TeamPage relevantGroups useEffect depends on team?.players | `src/pages/TeamPage.tsx:212` |
| 54 | M | StandingsTable hoveredTeam state duplicates CSS hover | `src/components/StandingsTable.tsx:17,21` |
| 55 | M | TurnauksetPage renderPlayoffTeamName uses href with onClick | `src/pages/TurnauksetPage.tsx:179-181` |
| 56 | M | PreMatchComparison is 138 lines with 3 useMemo hooks | `src/components/PreMatchComparison.tsx:1-138` |
| 57 | M | formatResult builds badge classes via string concat | `src/components/CommonOpponents.tsx:152-162` |
| 58 | M | MatchHeader emoji usage inconsistent with lucide icons | `src/components/MatchHeader.tsx:145-163` |
| 59 | M | TeamPage statsByYear recalculates for all years even if unused | `src/pages/TeamPage.tsx:215-288` |
| 60 | M | Home page stats display doesn't use the stats hook | `src/pages/Home.tsx:68-85` |
| 61 | M | TurnauksetPage playoffGroups computed on every render | `src/pages/TurnauksetPage.tsx:96-120` |
| 62 | M | FavoritesPage shows team IDs before names load | `src/pages/FavoritesPage.tsx:59-60` |
| 63 | M | Button uses cn() with potentially redundant class merging | `src/components/Button.tsx:30` |
| 64 | M | StandingsTable has complex nested ternary logic | `src/components/StandingsTable.tsx:72-83` |
| 65 | M | MatchPage match detail cards have excessive inline styles | `src/pages/MatchPage.tsx:190-294` |
| 66 | M | TeamPage transition tabs use 3 separate useState | `src/pages/TeamPage.tsx:30-32` |
| 67 | M | TurnauksetPage has 10+ useState calls | `src/pages/TurnauksetPage.tsx:38-56` |
| 68 | M | PlayerCard variants defined outside component | `src/components/PlayerCard.tsx:9-12` |
| 69 | M | MatchPage has unused MatchDetail type in routes | `src/routes.tsx:11-17` |
| 70 | M | FavoritesPage missing loading state for initial load | `src/pages/FavoritesPage.tsx:26-35` |
| 71 | M | TeamPage uses Date.now() for age calculation | `src/pages/TeamPage.tsx:117` |
| 72 | M | CommonOpponents renders duplicate separator class | `src/components/CommonOpponents.tsx:261-270` |
| 73 | M | GroupPage top scorers use default import incorrectly | `src/pages/GroupPage.tsx:2,79-80` |
| 74 | M | TeamPage stats comparison shows 0-0 for empty years | `src/pages/TeamPage.tsx:296-338` |
| 75 | M | StandingsTable uses hardcoded min-w-[50px] | `src/components/StandingsTable.tsx:59` |
| 76 | M | MatchPage doesn't use Suspense boundaries | `src/pages/MatchPage.tsx:190-294` |
| 77 | M | Home page loads stats but doesn't use them | `src/pages/Home.tsx:17-23` |
| 78 | M | MatchPage tabs use conditional Tailwind classes | `src/pages/MatchPage.tsx:162-167` |
| 79 | M | CommonOpponents formatResult returns 'V' instead of '-' | `src/components/CommonOpponents.tsx:170` |
| 80 | M | TeamPage sort comparator doesn't handle equal matches | `src/pages/TeamPage.tsx:437` |
| 81 | M | PreMatchComparison renders with hardcoded width classes | `src/components/PreMatchComparison.tsx:72-114` |
| 82 | M | TurnauksetPage has no error state handling | `src/pages/TurnauksetPage.tsx:58-124` |
| 83 | M | PlayerCard missing error boundary for image | `src/components/PlayerCard.tsx:14-17` |
| 84 | M | FavoritesPage shows "Tilastot" as team name | `src/pages/FavoritesPage.tsx:60` |
| 85 | M | TeamPage inline transition card not memoized | `src/pages/TeamPage.tsx:597-676` |
| 86 | M | StandingsTable hoveredTeam resets on mouse leave | `src/components/StandingsTable.tsx:21-22` |
| 87 | M | MatchPage search doesn't handle special characters | `src/pages/MatchPage.tsx:144` |
| 88 | M | GroupPage teamStandings computed twice | `src/pages/GroupPage.tsx:28-33` |
| 89 | M | Button spinner animation uses animate-spin | `src/components/Button.tsx:50-51` |
| 90 | M | Skeleton uses Tailwind animate-pulse directly | `src/components/Skeleton.tsx:11` |
| 91 | M | TeamPage doesn't handle network errors gracefully | `src/pages/TeamPage.tsx:99-212` |
| 92 | M | Home page favorites section lacks empty state | `src/pages/Home.tsx:68-85` |
| 93 | M | TurnauksetPage no transition states for tab switches | `src/pages/TurnauksetPage.tsx:138-183` |
| 94 | M | MatchPage team stats cards overlap on mobile | `src/pages/MatchPage.tsx:190-294` |
| 95 | M | PreMatchComparison form rendering duplicates logic | `src/components/PreMatchComparison.tsx:82-113` |
| 96 | M | CommonOpponents doesn't show loading state during fetch | `src/components/CommonOpponents.tsx:76-101` |
| 97 | M | PlayerPage season selector lacks visual feedback | `src/pages/PlayerPage.tsx:170-189` |
| 98 | M | TeamPage categories not deduplicated by ID | `src/pages/TeamPage.tsx:394` |
| 99 | M | MatchPage match cards don't show team crests | `src/pages/MatchPage.tsx:265-293` |
| 100 | M | Home page competition logos not lazy loaded | `src/pages/Home.tsx:141-162` |

---

## Unified Master Refactoring Plan

### Critical (C) — 16 items
Address immediately. These are security risks, architectural violations, or bugs affecting production.

| # | Finding | Team(s) | Scope | Action |
|---|---------|---------|-------|--------|
| C-1 | God Component — TeamPage.tsx (1073 lines) | T1, T3 | `src/pages/TeamPage.tsx` | Extract into 8+ sub-components: TeamHeader, TeamStatsSummary, TeamRoster, TeamTransitions, TeamMatches, TeamTopScorers, TeamCategories, TeamPerformance. Target: each < 200 lines. |
| C-2 | God Component — TurnauksetPage.tsx (569 lines) | T1, T3 | `src/pages/TurnauksetPage.tsx` | Extract into: TournamentBracket, TournamentStandings, TournamentMatches, PlayoffTracker, GroupSelector, SeasonSelector. |
| C-3 | Hardcoded API token and Referer header | T2 | `src/types/config.ts:62-64` | Move to `import.meta.env.VITE_API_TOKEN` / `VITE_API_REFERER`. Add `.env.example`. Never commit real tokens. |
| C-4 | API Referer header hardcoded | T2 | `src/types/config.ts:64` | Same as C-3. Use env vars. |
| C-5 | Stack traces exposed to users | T2 | `src/components/ErrorBoundaryPage.tsx:44-65` | Only show error.message in production. Use `import.meta.env.DEV` to conditionally show stack. |
| C-6 | Cache key collision (getGroupDetails vs getGroupFull) | T1 | `src/services/api.ts:251,351` | Prefix cache keys with endpoint name: `group-details:${id}` vs `group-full:${id}`. |
| C-7 | Dynamic import in getMatchDetails | T1 | `src/services/api.ts:244-248` | Change to static import at top of file. |
| C-8 | Hardcoded tournament links | T1 | `src/pages/Home.tsx:93-123` | Create `src/config/tournaments.ts` with tournament metadata array. |
| C-9 | Cache never evicted (unbounded memory) | T2 | `src/services/cache.ts:38,80` | Add LRU eviction with MAX_CACHE_SIZE = 200. Evict oldest on insert. |
| C-10 | CommonOpponents fetches without AbortController | T2 | `src/components/CommonOpponents.tsx:86-101` | Add useEffect cleanup with signal, mountedRef pattern. |
| C-11 | batchFetch silently swallows failures | T2 | `src/services/api.ts:222-224` | Return `{ results: T[], errors: Error[] }` tuple. Log errors, show toast for critical failures. |
| C-12 | No input validation on route parameters | T2 | Multiple pages | Add URL pattern guards: `/:id(\\d+)` in route config. Validate parseInt results. |
| C-13 | Race condition in TeamPage historical fetch | T2 | `src/pages/TeamPage.tsx:99-212` | Use AbortController with cleanup. Return early if stale. |
| C-14 | FavoritesPage unbounded parallel requests | T2 | `src/pages/FavoritesPage.tsx:17` | Use batchFetch or limit concurrency to 5. |
| C-15 | No test infrastructure | T3 | `package.json`, `src/` | Add vitest + @testing-library/react. Create `src/__tests__/` with smoke tests for each page. |
| C-16 | No ESLint/Prettier | T3 | project root | Add eslint + prettier + typescript-eslint. Add lint/format scripts to package.json. |

### High (H) — 50 items
Address within 2 weeks. These degrade maintainability, introduce subtle bugs, or create poor developer experience.

| # | Finding | Team(s) | Scope | Action |
|---|---------|---------|-------|--------|
| H-1 | Duplicated getCategoryName (3x in TeamPage) | T1 | `src/pages/TeamPage.tsx:369,818` | Extract to `src/utils/formatters.ts` as `getCategoryName(categories, id)`. |
| H-2 | No error boundary on individual pages | T1 | `src/routes.tsx:27` | Wrap each Route in Suspense + ErrorBoundary. |
| H-3 | useMatchData hook orchestration complexity | T1 | `src/hooks/useMatchData.ts:1-92` | Simplify: separate loading/error/data into clearer states. Consider React Query. |
| H-4 | Rate limiter state is module-level mutable | T1 | `src/services/api.ts:51-52` | Encapsulate in a class or closure. |
| H-5 | waitForRateLimit busy-wait loop | T1 | `src/services/api.ts:55-91` | Use setTimeout + Promise pattern. |
| H-6 | No abort signal in CompetitionPage/CategoryPage | T1 | Two files | Add useEffect cleanup with AbortController. |
| H-7 | No abort signal in GroupPage | T1 | `src/pages/GroupPage.tsx:22` | Same pattern as H-6. |
| H-8 | FavoritesPage missing abort controller | T1 | `src/pages/FavoritesPage.tsx:17` | Same pattern. |
| H-9 | Home.tsx missing abort controller | T1 | `src/pages/Home.tsx:20-23` | Same pattern. |
| H-10 | CommonOpponents unused destructured aliases | T1 | `src/components/CommonOpponents.tsx:25` | Remove `_` and `__`, use actual prop names. |
| H-11 | Standings table duplicated in TurnauksetPage | T1 | `src/pages/TurnauksetPage.tsx:256-300` | Reuse existing `StandingsTable` component. |
| H-12 | APP_CONFIG mutable singleton with hardcoded secrets | T1 | `src/types/config.ts:54-113` | Convert to `as const` config. Remove API keys. |
| H-13 | No environment variable support | T1 | `src/types/config.ts:61-65` | Add `src/config/env.ts` with Vite env var validation. |
| H-14 | CURRENT_YEAR/PREVIOUS_YEAR static strings | T1 | `src/types/config.ts:73-74` | Compute dynamically: `const CURRENT_YEAR = new Date().getFullYear()`. |
| H-15 | PlayerPage unsafe type assertion | T1, T2 | `src/pages/PlayerPage.tsx:113` | Add runtime check or proper type guard. |
| H-16 | Multiple types with index signature escape hatches | T1, T3 | `src/types/api.ts:27,151,159,166,233,245` | Remove `[key: string]: unknown` from all interfaces. |
| H-17 | Inconsistent error handling in pages | T1 | Multiple pages | Create `src/hooks/useAsyncData.ts` with consistent error/loading/data pattern. |
| H-18 | dataProcessors.ts too many responsibilities | T1 | `src/utils/dataProcessors.ts:19-122` | Split into: `matchFormatters.ts`, `teamStatsCalculators.ts`, `standingsCalculators.ts`. |
| H-19 | useFavorites stores raw team IDs with no validation | T1 | `src/hooks/useFavorites.ts:5-8` | Add ID format validation on read. |
| H-20 | No shared useAbortEffect custom hook | T1 | All pages with useEffect | Create `src/hooks/useAbortEffect.ts` that wraps signal + mountedRef pattern. |
| H-21 | mountedRef pattern causes silent data loss | T2 | `src/hooks/useMatchData.ts:19,42,49,54,83` | Use AbortController cleanup instead of mountedRef. |
| H-22 | Rate limiter 200ms polling CPU waste | T2 | `src/services/api.ts:89` | Switch to setTimeout-based wait. |
| H-23 | No abort signal in FavoritesPage | T2 | `src/pages/FavoritesPage.tsx:17` | Same as H-8. |
| H-24 | useEffect missing cleanup in GroupPage/CompetitionPage/CategoryPage | T2 | Three files | Add AbortController cleanup in all useEffect. |
| H-25 | StandingsTable parses scores without radix | T2 | `src/components/StandingsTable.tsx:32-33,65-66` | Add `10` as second arg to all parseInt calls. |
| H-26 | PreMatchComparison parses without default fallback | T2 | `src/components/PreMatchComparison.tsx:22-23` | Use `parseInt(val \|\| '0', 10)`. |
| H-27 | WLD_CONFIG access without type safety | T2 | `src/pages/TeamPage.tsx:760-761` | Type the config properly. |
| H-28 | TeamPage allows any type for groups/categories | T1, T2 | `src/pages/TeamPage.tsx:88,381,401` | Remove `as any[]` casts, add proper types. |
| H-29 | MatchPage parseInt without NaN check | T2 | `src/pages/MatchPage.tsx:54-55` | Guard with `Number.isNaN()`. |
| H-30 | Home page API call without AbortController | T2 | `src/pages/Home.tsx:19-23` | Same pattern as H-6. |
| H-31 | TeamPage selectedYear not reset on team change | T2 | `src/pages/TeamPage.tsx:22` | Add teamId to useEffect deps to reset year. |
| H-32 | FavoritesPage shows raw team ID | T1, T2 | `src/pages/FavoritesPage.tsx:59` | Fetch and cache team names. |
| H-33 | Home page hardcoded tournament links | T1, T2 | `src/pages/Home.tsx:94,109` | Extract to config file (C-8). |
| H-34 | BottomNav hardcoded to /competition/spl | T1, T2 | `src/components/BottomNav.tsx:7` | Make configurable via props or context. |
| H-35 | Error messages not localizable | T2 | Multiple files | Extract all strings to `src/i18n/strings.ts`. |
| H-36 | Rate limiter doesn't handle tab backgrounding | T2 | `src/services/api.ts:51-91` | Reset on visibility change. |
| H-37 | Cache key generation doesn't handle object params | T2 | `src/services/cache.ts:42-48` | Use `JSON.stringify` for object keys. |
| H-38 | Cache TTL not configurable per-entry | T2 | `src/services/cache.ts:17-28` | Accept TTL as optional param in withCache. |
| H-39 | No request deduplication for FavoritesPage | T2 | `src/pages/FavoritesPage.tsx:17` | Use inFlight dedup from cache.ts. |
| H-40 | Duplicate WLD badge styling logic (6 files) | T3 | Multiple files | Extract `getWldBadgeClasses()` to `src/utils/wld.ts`. |
| H-41 | getCategoryName inline in TurnauksetPage | T3 | `src/pages/TurnauksetPage.tsx:90-93` | Use shared function from utils. |
| H-42 | date.slice(0,4) repeated 10+ times | T3 | Multiple files | Create `getYearFromDate(date: string): string` helper. |
| H-43 | Match result calculation duplicated (6 files) | T3 | Multiple files | Create `src/utils/matchResults.ts` with `getMatchResult(match, teamId)`. |
| H-44 | parseInt(value \|\| '0') scattered 20+ times | T3 | Multiple files | Create `toNum(val: string \| undefined): number` helper. |
| H-45 | Skeleton components alongside real components | T3 | Multiple files | Move all skeletons to `src/components/skeletons/` barrel. |
| H-46 | No prop-types or JSDoc on components | T3 | All component files | Add JSDoc to all exported components. |
| H-47 | cn() usage inconsistent | T3 | Multiple files | Standardize: always use `cn()` for class merging. |
| H-48 | formatDayName unused in dates.ts | T3 | `src/utils/dates.ts:15-18` | Remove dead code. |
| H-49 | useMatchData stale data on re-mount | T3 | `src/hooks/useMatchData.ts:19-23` | Use AbortController pattern. |
| H-50 | No barrel exports anywhere | T3 | `src/components/`, `src/hooks/`, etc. | Add index.ts barrel files to each directory. |

### Medium (M) — 100 items
Address within 1 month. Code quality improvements, consistency fixes, and minor optimizations.

| # | Finding | Team(s) | Scope | Action |
|---|---------|---------|-------|--------|
| M-1 | StandingTeam uses strings for numeric fields | T1 | `src/types/api.ts:189-201` | Change to number types. |
| M-2 | MatchSummary fs_A/fs_B as string not optional | T1 | `src/types/api.ts:210-211` | Make optional with `?`. |
| M-3 | getWldFromScore returns default 'V' | T1 | `src/utils/wld.ts:14` | Return undefined instead. |
| M-4 | getWldFromWinner returns 'V' on undefined | T1 | `src/utils/wld.ts:23` | Return undefined. |
| M-5 | MatchPage scroll listener no debounce | T1 | `src/pages/MatchPage.tsx:31-39` | Use requestAnimationFrame. |
| M-6 | No lazy loading of route components | T1 | `src/routes.tsx:1-42` | Wrap heavy pages in React.lazy. |
| M-7 | match_status cache rule split | T1 | Two files | Consolidate in cache.ts. |
| M-8 | APIConfig type mismatch | T1 | `src/types/config.ts:8-52` | Align type with runtime shape. |
| M-9 | processPlayerMatchHistory strict equality | T1 | `src/utils/dataProcessors.ts:47,111` | Use loose comparison or normalize types. |
| M-10 | TeamPage inline type RosterEntry | T1 | `src/pages/TeamPage.tsx:504` | Move to types file. |
| M-11 | PreMatchComparison/CommonOpponents overlap | T1 | Two files | Merge or clearly separate responsibilities. |
| M-12 | formatResult string concatenation | T1 | `src/components/CommonOpponents.tsx:134-171` | Use cn() or object lookup. |
| M-13 | TeamPage WLD badge string manipulation | T1 | `src/pages/TeamPage.tsx:760-761` | Use shared getWldBadgeClasses(). |
| M-14 | useMatchData error message drops info | T1 | `src/hooks/useMatchData.ts:84` | Preserve error.message. |
| M-15 | TurnauksetPage no AbortController | T1 | `src/pages/TurnauksetPage.tsx:58-124` | Add AbortController pattern. |
| M-16 | batchFetch sequential batching | T1 | `src/services/api.ts:218-226` | Use Promise.all for concurrent. |
| M-17 | No global error/toast system | T1 | All components | Create ErrorContext provider. |
| M-18 | MatchHeader receives 5 props, uses 4 | T1 | `src/components/MatchHeader.tsx:24` | Remove unused prop. |
| M-19 | StandingsTable inline props interface | T1 | `src/components/StandingsTable.tsx:7-15` | Extract named type. |
| M-20 | StandingsTable sort doesn't handle ties | T1 | `src/components/StandingsTable.tsx:19` | Add tiebreaker (goal diff). |
| M-21 | TurnauksetPage state fragmented 10+ useState | T1 | `src/pages/TurnauksetPage.tsx:38-56` | Consolidate with useReducer. |
| M-22 | No tests for dataProcessors | T1 | `src/utils/dataProcessors.ts` | Add vitest tests. |
| M-23 | No tests for cache | T1 | `src/services/cache.ts` | Add vitest tests. |
| M-24 | No tests for rate limiter | T1 | `src/services/api.ts:55-91` | Add vitest tests. |
| M-25 | No tests for wld.ts | T1 | `src/utils/wld.ts` | Add vitest tests. |
| M-26 | No tests for dates.ts | T1 | `src/utils/dates.ts` | Add vitest tests. |
| M-27 | CommonOpponents fetches without cache invalidation | T1 | `src/components/CommonOpponents.tsx:85-101` | Use withCache properly. |
| M-28 | FavoritesPage shows team ID while loading | T1 | `src/pages/FavoritesPage.tsx:60` | Show skeleton instead. |
| M-29 | TeamPage sort of upcoming matches bug | T1 | `src/pages/TeamPage.tsx:437` | Fix sort comparator. |
| M-30 | PlayerPage age uses current year | T1 | `src/pages/PlayerPage.tsx:117` | Use birth_year from API. |
| M-31 | TeamPage performanceComparison years[0] fallback | T1 | `src/pages/TeamPage.tsx:296` | Handle empty years case. |
| M-32 | TurnauksetPage playoff detection fragile | T1 | `src/pages/TurnauksetPage.tsx:96` | Use API field if available. |
| M-33 | getTeamData deprecated but exported | T1 | `src/services/api.ts:261-265` | Remove or mark @deprecated. |
| M-34 | MatchPage teamAPlayers/teamBPlayers not memoized | T1 | `src/pages/MatchPage.tsx:49-50` | Wrap in useMemo. |
| M-35 | MatchPage stats not memoized | T1 | `src/pages/MatchPage.tsx:52-58` | Wrap in useMemo. |
| M-36 | PreMatchComparison overlapping useMemo | T1 | `src/components/PreMatchComparison.tsx:16-69` | Consolidate dependencies. |
| M-37 | StatBadge doesn't handle large numbers | T1 | `src/components/StatBadge.tsx:28` | Add number formatting. |
| M-38 | Button missing type="button" | T1 | `src/components/Button.tsx:28` | Add default type="button". |
| M-39 | TeamPage as any[] casts | T1, T2 | `src/pages/TeamPage.tsx:88,381,401` | Add proper types. |
| M-40 | MatchPage no loading state | T1 | `src/pages/MatchPage.tsx:190-294` | Add Suspense/lazy loading. |
| M-41 | Home.tsx tournament cards lack keyboard | T1 | `src/pages/Home.tsx:93-123` | Add tabIndex and onKeyDown. |
| M-42 | TeamPage inline roster card | T1 | `src/pages/TeamPage.tsx:538-563` | Extract to RosterCard component. |
| M-43 | TeamPage inline transition card | T1 | `src/pages/TeamPage.tsx:597-676` | Extract to TransitionCard component. |
| M-44 | TeamPage inline top scorer row | T1 | `src/pages/TeamPage.tsx:689-706` | Extract to TopScorerRow component. |
| M-45 | TeamPage inline match row JSX | T1 | `src/pages/TeamPage.tsx:718-777` | Extract to MatchRow component. |
| M-46 | TurnauksetPage inline match row | T1 | `src/pages/TurnauksetPage.tsx:313-371` | Reuse MatchRow from TeamPage. |
| M-47 | TurnauksetPage inline playoff match row | T1 | `src/pages/TurnauksetPage.tsx:412-446` | Extract component. |
| M-48 | No centralized route constants | T1 | All page files | Create `src/config/routes.ts`. |
| M-49 | cache.ts TTL missing getTeamMatches key | T1 | `src/services/cache.ts:17-28` | Add entry. |
| M-50 | PlayerPage expanded state object | T1 | `src/pages/PlayerPage.tsx:49` | Use Set<number> instead. |
| M-51 | api.ts inconsistent error re-throw | T1 | `src/services/api.ts:186-190` | Standardize pattern. |
| M-52 | No loading state for CompetitionPage seasons | T2 | `src/pages/CompetitionPage.tsx:11` | Add skeleton. |
| M-53 | StandingsTable sorted on every render | T2 | `src/components/StandingsTable.tsx:19` | Wrap in useMemo. |
| M-54 | TeamPage displayStats fallback object | T2 | `src/pages/TeamPage.tsx:290-292` | Memoize. |
| M-55 | PlayerCard cardVariants outside component | T2 | `src/components/PlayerCard.tsx:9-12` | Move inside or use useMemo. |
| M-56 | Home page primaryComps/otherComps | T2 | `src/pages/Home.tsx:32-33` | Wrap in useMemo. |
| M-57 | Dates invalid date strings | T2 | `src/utils/dates.ts:3` | Add try/catch or validation. |
| M-58 | formatTime empty string | T2 | `src/utils/dates.ts:12` | Return null or placeholder. |
| M-59 | WLD_CONFIG wrong default | T2 | `src/utils/wld.ts:10` | Fix default value. |
| M-60 | MatchPage search no debounce | T2 | `src/pages/MatchPage.tsx:144` | Add debounce. |
| M-61 | TeamPage goalsByTeamThisYear collisions | T2 | `src/utils/dataProcessors.ts:54` | Use unique key. |
| M-62 | MatchPage AnimatePresence layout shift | T2 | `src/pages/MatchPage.tsx:157` | Use mode="wait". |
| M-63 | PlayerCard key={i} past matches | T2 | `src/components/PlayerCard.tsx:93` | Use match_id as key. |
| M-64 | GroupPage key={i} top scorers | T2 | `src/pages/GroupPage.tsx:64` | Use player_id as key. |
| M-65 | MatchHeader key={i} goals/bookings | T2 | `src/components/MatchHeader.tsx:87,140` | Use unique identifiers. |
| M-66 | TeamPage form indicators key={i} | T2 | `src/pages/TeamPage.tsx:862` | Use index + match info. |
| M-67 | StandingsTable form indicators key={i} | T2 | `src/components/StandingsTable.tsx:189` | Use round number. |
| M-68 | No aria-label on icon-only buttons | T2 | Multiple components | Add aria-label. |
| M-69 | Missing alt text for team crests | T2 | `src/components/MatchHeader.tsx:53,73` | Add alt text. |
| M-70 | BottomNav min-w-[64px] not responsive | T2 | `src/components/BottomNav.tsx:21` | Use responsive classes. |
| M-71 | No loading="lazy" on images | T2 | Multiple components | Add loading="lazy". |
| M-72 | Home footer copyright year hardcoded | T2 | `src/pages/Home.tsx:172` | Use `new Date().getFullYear()`. |
| M-73 | MatchPage sticky header z-index | T2 | `src/pages/MatchPage.tsx:75` | Use z-30 or z-40. |
| M-74 | PlayerPage season comparison empty | T2 | `src/pages/PlayerPage.tsx:225-317` | Handle empty case. |
| M-75 | MatchPage no keyboard nav search | T2 | `src/pages/MatchPage.tsx:137-154` | Add keyboard handler. |
| M-76 | TeamPage WLD string concat CSS | T2 | `src/pages/TeamPage.tsx:760-761` | Use cn(). |
| M-77 | MatchPage staggerContainer variants | T2 | `src/pages/MatchPage.tsx:60-63` | Move outside component. |
| M-78 | No service worker offline | T2 | `index.html`, `vite.config.ts` | Add workbox if needed. |
| M-79 | Hardcoded Finnish strings (i18n) | T3 | All page/component files | Create `src/i18n/strings.ts`. |
| M-80 | SPL_IDS not documented | T3 | `src/pages/Home.tsx:10` | Add JSDoc and export. |
| M-81 | api.ts deprecated function | T3 | `src/services/api.ts:261-265` | Remove. |
| M-82 | No engines field | T3 | `package.json` | Add `"engines": { "node": ">=18" }`. |
| M-83 | fetchAPIData no runtime validation | T3 | `src/services/api.ts:168` | Add manual type guard. |
| M-84 | withCache matchStatus confusing | T3 | `src/services/cache.ts:90-119` | Rename param. |
| M-85 | getGroupFull/getGroupDetails duplicates | T3 | `src/services/api.ts:251,351` | Consolidate into one function with params. |
| M-86 | APP_CONFIG.PREVIOUS_YEAR manual | T3 | `src/types/config.ts:73-74` | Compute dynamically. |
| M-87 | createHashRouter vs createBrowserRouter | T3 | `src/routes.tsx:1,24` | Switch to BrowserRouter (GH Pages workaround is fine). |
| M-88 | No viewport/theme-color HTML | T3 | `index.html` | Add meta tags. |
| M-89 | PlayerPage buildSeasonStats module scope | T3 | `src/pages/PlayerPage.tsx:19-41` | Move inside component or keep as pure util. |
| M-90 | statFilters re-created every render | T3 | `src/pages/PlayerPage.tsx:234-255` | Wrap in useMemo. |
| M-91 | TurnauksetPage playoffGroups render | T3 | `src/pages/TurnauksetPage.tsx:96-120` | Memoize. |
| M-92 | FavoritesPage team IDs before names | T3 | `src/pages/FavoritesPage.tsx:59-60` | Show skeleton. |
| M-93 | Button cn() redundant merging | T3 | `src/components/Button.tsx:30` | Simplify. |
| M-94 | StandingsTable complex ternary | T3 | `src/components/StandingsTable.tsx:72-83` | Extract to helper. |
| M-95 | MatchPage excessive inline styles | T3 | `src/pages/MatchPage.tsx:190-294` | Extract to Tailwind classes. |
| M-96 | TeamPage transition tabs 3 useState | T3 | `src/pages/TeamPage.tsx:30-32` | Consolidate. |
| M-97 | PlayerCard variants outside | T3 | `src/components/PlayerCard.tsx:9-12` | Move inside or memoize. |
| M-98 | MatchPage unused MatchDetail type | T3 | `src/routes.tsx:11-17` | Remove. |
| M-99 | FavoritesPage missing initial loading | T3 | `src/pages/FavoritesPage.tsx:26-35` | Add skeleton. |
| M-100 | Home page competition logos not lazy | T3 | `src/pages/Home.tsx:141-162` | Add loading="lazy". |

---

## Phased Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] **C-3/C-4**: Move API tokens to env vars, add .env.example
- [ ] **C-5**: Remove stack traces from production error boundary
- [ ] **C-6**: Fix cache key collision
- [ ] **C-7**: Change dynamic import to static in api.ts
- [ ] **C-8**: Extract tournament links to config
- [ ] **C-9**: Add LRU eviction to cache
- [ ] **C-10**: Add AbortController to CommonOpponents
- [ ] **C-11**: Return errors from batchFetch instead of swallowing
- [ ] **C-12**: Add route parameter validation
- [ ] **C-15**: Add vitest + @testing-library/react, create smoke tests
- [ ] **C-16**: Add ESLint + Prettier, run lint --fix
- [ ] **H-1**: Extract getCategoryName to utils
- [ ] **H-40**: Extract getWldBadgeClasses to wld.ts
- [ ] **H-42**: Create getYearFromDate helper
- [ ] **H-43**: Create getMatchResult utility
- [ ] **H-44**: Create toNum helper
- [ ] **H-48**: Remove unused formatDayName
- [ ] **H-50**: Add barrel exports to all directories

### Phase 2: Component Decomposition (Week 3-4)
- [ ] **C-1**: Decompose TeamPage into 8 sub-components
- [ ] **C-2**: Decompose TurnauksetPage into 6 sub-components
- [ ] **H-11**: Reuse StandingsTable in TurnauksetPage
- [ ] **H-20**: Create useAbortEffect hook, apply to all pages
- [ ] **H-32**: Fetch and cache team names for FavoritesPage
- [ ] **M-42**: Extract RosterCard from TeamPage
- [ ] **M-43**: Extract TransitionCard from TeamPage
- [ ] **M-44**: Extract TopScorerRow from TeamPage
- [ ] **M-45**: Extract MatchRow, reuse across TeamPage and TurnauksetPage
- [ ] **M-47**: Extract PlayoffMatchRow from TurnauksetPage
- [ ] **M-48**: Create routes.ts config file

### Phase 3: Type Safety & Performance (Week 5-6)
- [ ] **H-16**: Remove index signature escape hatches from types
- [ ] **H-28**: Remove as any[] casts, add proper types
- [ ] **H-35**: Extract Finnish strings to i18n/strings.ts
- [ ] **M-1**: Fix StandingTeam numeric types
- [ ] **M-2**: Fix MatchSummary optional fields
- [ ] **M-3/M-4**: Fix WLD undefined returns
- [ ] **M-6**: Add React.lazy for heavy pages
- [ ] **M-20**: Add tiebreaker to StandingsTable sort
- [ ] **M-22-M-26**: Add unit tests for all utils and services
- [ ] **M-37**: Add number formatting to StatBadge
- [ ] **M-38**: Add type="button" to Button

### Phase 4: Polish & Documentation (Week 7-8)
- [ ] **M-17**: Create ErrorContext for global error handling
- [ ] **M-41**: Add keyboard support to Home tournament cards
- [ ] **M-68**: Add aria-labels to icon-only buttons
- [ ] **M-69**: Add alt text to team crest images
- [ ] **M-70**: Fix BottomNav responsive classes
- [ ] **M-71**: Add loading="lazy" to below-fold images
- [ ] **M-88**: Add viewport/theme-color meta tags
- [ ] **M-94**: Extract StandingsTable ternary to helper
- [ ] **H-46**: Add JSDoc to all exported components
- [ ] Add comprehensive README with architecture overview
- [ ] Add CONTRIBUTING.md with code conventions

---

*Generated by opencode-mimo-v2.5-free on 2026-06-14T08:56:24Z*
