# Architecture Review — football-stats

---

## Metadata

| Field | Value |
|-------|-------|
| **Model** | `opencode/mimo-v2.5-free` |
| **Execution Timestamp** | `2026-06-14T08:56:24Z` |
| **Updated** | `2026-06-14T14:00:00Z` |
| **Arena Status** | REVISED — 168 remaining findings (147 resolved, 15 merged from big-pickle & deepseek) |
| **Codebase** | Finnish youth football statistics SPA |
| **Stack** | React 19 + TypeScript + Vite 7 + Tailwind 4 + Framer Motion |
| **Sources** | mimo-v2.5-free (300), big-pickle (300), deepseek-v4-flash-free (300) — 900 total audited |

---

## What's Been Done (147 items resolved)

| Category | Resolved Items |
|----------|---------------|
| **Shared utilities** | dates.ts, wld.ts, crest.ts, cn.ts — all extracted and used across codebase |
| **Shared components** | BackButton (6 inline → 1), PageLayout (9 pages → 1) |
| **Types split** | api.ts → matches.ts, teams.ts, players.ts, competition.ts + barrel exports |
| **Config split** | types/config.ts (interface only) + config.ts (runtime APP_CONFIG) |
| **Barrel exports** | index.ts in utils/, components/, hooks/, services/, types/ |
| **API resilience** | Typed error classes, queue-based rate limiter, signal propagation, retry logic, 10s timeout |
| **Abort handling** | useMatchData: abortRef, mountedRef cleanup, abort guard in catch, signal passed to all API calls |
| **HTML/accessibility** | lang="fi", viewport-fit=cover, Google Fonts, body class fix |
| **Type safety** | dataProcessors any → PlayerMatchEntry, PlayerAPIResponse matches typed |
| **Finnish i18n** | Error messages localized to Finnish throughout |

---

## Remaining 168 Findings

### Critical (C) — 14 items

| # | Finding | Source | File(s) | Action |
|---|---------|--------|---------|--------|
| C-1 | God Component — TeamPage.tsx (1068 lines) | all | `src/pages/TeamPage.tsx` | Decompose into: useTeamData hook, TeamHeader, TeamStats, TeamRoster, TeamTransitions, TeamMatches, TeamTopScorers. Target <300 lines. |
| C-2 | God Component — TurnauksetPage.tsx (566 lines) | all | `src/pages/TurnauksetPage.tsx` | Decompose into: useTournamentData hook, TournamentHero, PlayoffSection, reuse StandingsTable. Target <300 lines. |
| C-3 | God Component — PlayerPage.tsx (420 lines) | all | `src/pages/PlayerPage.tsx` | Decompose into: usePlayerData hook, PlayerSeasonComparison. Target <200 lines. |
| C-4 | API tokens hardcoded in source | mimo, big-pickle | `src/config.ts:10-11` | Move to `import.meta.env.VITE_API_TOKEN` / `VITE_API_REFERER`. Add `.env.example`. |
| C-5 | Stack traces exposed to users | mimo | `src/components/ErrorBoundaryPage.tsx` | Only show error.message in production. Use `import.meta.env.DEV` for stack. |
| C-6 | Cache never evicted (unbounded memory) | all | `src/services/cache.ts` | Add LRU eviction with MAX_CACHE_SIZE = 500. |
| C-7 | CommonOpponents fetches without AbortController | mimo | `src/components/CommonOpponents.tsx:86-101` | Add signal, mountedRef pattern. |
| C-8 | batchFetch silently swallows failures | all | `src/services/api.ts:211-227` | Return `{ results, errors }` tuple. |
| C-9 | No test infrastructure | all | `package.json` | Add vitest + @testing-library/react. Smoke tests for pages. |
| C-10 | No ESLint/Prettier | all | project root | Add eslint + prettier + typescript-eslint. |
| C-11 | Hardcoded tournament links | mimo | `src/pages/Home.tsx:93-123` | Extract to `src/config/tournaments.ts`. |
| C-12 | Duplicate exports in types/index.ts | mimo, deepseek | `src/types/index.ts` | Remove duplicate `export * from` lines. |
| C-13 | English UI text ("Match View", footer) | deepseek | `MatchPage.tsx:133-134`, `Home.tsx:172` | Translate all to Finnish: "Ottelut", "Data: Suomen Palloliitto". |
| C-14 | "Played"/"Fixture" magic strings | big-pickle | `dataProcessors.ts:48,98,112` | Create `MATCH_STATUS` constants in shared types. |

### High (H) — 49 items

| # | Finding | Source | File(s) | Action |
|---|---------|--------|---------|--------|
| H-1 | MatchRow extraction (6 locations duplicated) | all | TeamPage, GroupPage, PlayerPage, TurnauksetPage, CommonOpponents | Create `src/components/MatchRow.tsx`. ~300 duplicated lines → ~80 lines. |
| H-2 | PlayerAvatar extraction (4 locations) | deepseek | TeamPage, TurnauksetPage, PlayerPage, PlayerCard | Create `src/components/PlayerAvatar.tsx` with sm/md/lg sizes. |
| H-3 | VenueDisplay extraction | deepseek | TurnauksetPage, MatchHeader | Create `src/components/VenueDisplay.tsx`. |
| H-4 | No useAbortEffect shared hook | mimo | All pages with useEffect | Create `src/hooks/useAbortEffect.ts` wrapping signal + mountedRef. |
| H-5 | No AbortController in GroupPage | mimo | `src/pages/GroupPage.tsx` | Add useEffect cleanup with AbortController. |
| H-6 | No AbortController in CompetitionPage | mimo | `src/pages/CompetitionPage.tsx` | Same pattern. |
| H-7 | No AbortController in CategoryPage | mimo | `src/pages/CategoryPage.tsx` | Same pattern. |
| H-8 | No route parameter validation | mimo | Multiple pages | Add URL pattern guards: `/:id(\\d+)`. |
| H-9 | errors.ts extraction from api.ts | mimo | `src/services/api.ts:31-46` | Move error classes to `src/services/errors.ts`. |
| H-10 | FavoritesPage unbounded parallel requests | mimo | `src/pages/FavoritesPage.tsx` | Use batchFetch or limit concurrency to 5. |
| H-11 | FavoritesPage shows raw team ID while loading | mimo | `src/pages/FavoritesPage.tsx:59` | Show skeleton instead. |
| H-12 | FavoritesPage missing AbortController | mimo | `src/pages/FavoritesPage.tsx` | Add signal pattern. |
| H-13 | Home.tsx missing AbortController | mimo | `src/pages/Home.tsx` | Add signal pattern. |
| H-14 | CommonOpponents unused `_`/`__` aliases | all | `src/components/CommonOpponents.tsx:25` | Remove aliases, use actual prop names. |
| H-15 | StandingsTable duplicated in TurnauksetPage | mimo | `src/pages/TurnauksetPage.tsx:256-300` | Reuse existing StandingsTable component. |
| H-16 | getCategoryName duplicated (TeamPage + TurnauksetPage) | mimo, big-pickle | Two files | Extract to `src/utils/formatters.ts`. |
| H-17 | No barrel export for config | mimo | `src/config.ts` | Add to services/index.ts or create config barrel. |
| H-18 | APP_CONFIG.PREVIOUS_YEAR static | mimo | `src/config.ts:14` | Compute: `String(new Date().getFullYear() - 1)`. |
| H-19 | TeamPage as any[] casts | all | `src/pages/TeamPage.tsx:88,381,401` | Add proper types. |
| H-20 | StandingsTable sort doesn't handle ties | mimo | `src/components/StandingsTable.tsx:19` | Add tiebreaker (goal diff). |
| H-21 | TeamPage selectedYear not reset on team change | mimo | `src/pages/TeamPage.tsx:22` | Add teamId to reset logic. |
| H-22 | TeamPage sort comparator bug | mimo | `src/pages/TeamPage.tsx:437` | Fix sort for upcoming matches. |
| H-23 | Multiple types with index signature escape hatches | mimo, big-pickle | `src/types/*.ts` | Remove `[key: string]: unknown` from interfaces. |
| H-24 | No error boundary on individual pages | mimo | `src/routes.tsx` | Wrap routes in Suspense + ErrorBoundary. |
| H-25 | No centralized route constants | mimo, deepseek | All page files | Create `src/config/routes.ts`. |
| H-26 | Rate limiter doesn't handle tab backgrounding | mimo | `src/services/api.ts` | Reset on visibility change. |
| H-27 | Cache key generation doesn't handle object params | mimo | `src/services/cache.ts` | Use JSON.stringify for object keys. |
| H-28 | withCache matchStatus parameter confusing | mimo | `src/services/cache.ts` | Rename param. |
| H-29 | getGroupFull/getGroupDetails near-duplicates | all | `src/services/api.ts:251,351` | Consolidate into one function with params. |
| H-30 | getTeamData deprecated but exported | all | `src/services/api.ts:261-265` | Remove or mark @deprecated. |
| H-31 | batchFetch sequential instead of concurrent | mimo | `src/services/api.ts:218-226` | Use Promise.all for concurrent. |
| H-32 | InFlight map promise rejection leaves stale entry | mimo | `src/services/cache.ts:112-115` | Clean up on rejection. |
| H-33 | Error messages not localizable (scattered strings) | mimo | Multiple files | Extract to `src/i18n/strings.ts`. |
| H-34 | No prop-types or JSDoc on components | mimo | All component files | Add JSDoc to all exported components. |
| H-35 | cn() usage inconsistent | mimo | Multiple files | Standardize: always use cn(). |
| H-36 | StandingsTable inline props interface | mimo | `src/components/StandingsTable.tsx:7-15` | Extract named type. |
| H-37 | TeamPage historical fetch depends on team?.players | mimo | `src/pages/TeamPage.tsx:212` | Fix dependency array. |
| H-38 | TeamPage relevantGroups type uses any[] | mimo, deepseek | `src/pages/TeamPage.tsx:88` | Add proper type. |
| H-39 | PlayerPage unsafe type assertion | mimo, deepseek | `src/pages/PlayerPage.tsx:113` | Add runtime check. |
| H-40 | TurnauksetPage uses as MatchWithVenue[] cast | mimo | `src/pages/TurnauksetPage.tsx:85` | Add proper type. |
| H-41 | No global error/toast system | mimo | All components | Create ErrorContext provider. |
| H-42 | Card component extraction | big-pickle | Multiple pages | Create `src/components/Card.tsx` for repeated `bg-surface-1 border border-border-hairline rounded-xl p-5` pattern. |
| H-43 | Split processPlayerMatchHistory | big-pickle | `dataProcessors.ts` | Split into `aggregateStats`, `buildPastMatchDetails`, `computeResult`. |
| H-44 | Cross-tab favorites sync | big-pickle | `useFavorites.ts` | Add `window.addEventListener('storage', ...)` listener. |
| H-45 | CommonOpponents race on expand/collapse | big-pickle | `CommonOpponents.tsx:76-101` | Per-opponent AbortController in handleToggle. |
| H-46 | useScrollPosition custom hook | deepseek | `MatchPage.tsx:31-40` | Extract duplicated scroll logic. |
| H-47 | useDebounce hook | deepseek | `MatchPage.tsx:144` | Extract search debounce. |
| H-48 | Retry button in error boundary | deepseek | `ErrorBoundaryPage.tsx` | Add "Yritä uudelleen" retry button. |
| H-49 | Dead code removal | deepseek | `api.ts` (getScore, getTeamData, clearCache, getWldFromWinner, ScoreEntry) | Remove all unused exports. |

### Medium (M) — 105 items

| # | Finding | Source | File(s) | Action |
|---|---------|--------|---------|--------|
| M-1 | React.lazy for heavy pages | mimo | `src/routes.tsx` | Wrap TeamPage, TurnauksetPage, PlayerPage in lazy. |
| M-2 | StandingsTable sorted on every render | mimo | `src/components/StandingsTable.tsx:19` | Wrap in useMemo. |
| M-3 | Home page primaryComps/otherComps recomputed | mimo | `src/pages/Home.tsx:32-33` | Wrap in useMemo. |
| M-4 | MatchPage teamAPlayers/teamBPlayers recomputed | mimo | `src/pages/MatchPage.tsx:49-50` | Wrap in useMemo. |
| M-5 | MatchPage stats not memoized | mimo | `src/pages/MatchPage.tsx:52-58` | Wrap in useMemo. |
| M-6 | PreMatchComparison overlapping useMemo | mimo | `src/components/PreMatchComparison.tsx:16-69` | Consolidate. |
| M-7 | TeamPage 12 useMemo hooks excessive | mimo, deepseek | `src/pages/TeamPage.tsx:60-484` | Consolidate after decomposition. |
| M-8 | TurnauksetPage state fragmented 10+ useState | mimo | `src/pages/TurnauksetPage.tsx:38-56` | Consolidate with useReducer. |
| M-9 | TeamPage transition tabs 3 useState | mimo | `src/pages/TeamPage.tsx:30-32` | Consolidate. |
| M-10 | StandingsTable complex nested ternary | mimo | `src/components/StandingsTable.tsx:72-83` | Extract to helper. |
| M-11 | formatResult string concatenation | mimo | `src/components/CommonOpponents.tsx:134-171` | Use cn() or object lookup. |
| M-12 | TeamPage WLD badge string manipulation | mimo | `src/pages/TeamPage.tsx:760-761` | Use shared getWldConfig. |
| M-13 | StatBadge doesn't handle large numbers | mimo | `src/components/StatBadge.tsx:28` | Add number formatting. |
| M-14 | Button missing type="button" | mimo | `src/components/Button.tsx:28` | Add default type="button". |
| M-15 | MatchPage no loading state for initial render | mimo | `src/pages/MatchPage.tsx:190-294` | Add Suspense/lazy. |
| M-16 | Home.tsx tournament cards lack keyboard | mimo | `src/pages/Home.tsx:93-123` | Add tabIndex + onKeyDown. |
| M-17 | TeamPage inline roster card | mimo | `src/pages/TeamPage.tsx:538-563` | Extract to RosterCard. |
| M-18 | TeamPage inline transition card | mimo | `src/pages/TeamPage.tsx:597-676` | Extract to TransitionCard. |
| M-19 | TeamPage inline top scorer row | mimo | `src/pages/TeamPage.tsx:689-706` | Extract to TopScorerRow. |
| M-20 | TeamPage inline match row JSX | mimo | `src/pages/TeamPage.tsx:718-777` | Use MatchRow. |
| M-21 | TurnauksetPage inline match row | mimo | `src/pages/TurnauksetPage.tsx:313-371` | Use MatchRow. |
| M-22 | TurnauksetPage inline playoff match row | mimo | `src/pages/TurnauksetPage.tsx:412-446` | Extract component. |
| M-23 | No tests for dataProcessors | mimo | `src/utils/dataProcessors.ts` | Add vitest tests. |
| M-24 | No tests for cache | mimo | `src/services/cache.ts` | Add vitest tests. |
| M-25 | No tests for rate limiter | mimo | `src/services/api.ts:55-91` | Add vitest tests. |
| M-26 | No tests for wld.ts | mimo | `src/utils/wld.ts` | Add vitest tests. |
| M-27 | No tests for dates.ts | mimo | `src/utils/dates.ts` | Add vitest tests. |
| M-28 | PlayerCard image onError DOM manipulation | mimo | `src/components/PlayerCard.tsx:17` | Use React state (imgError). |
| M-29 | PlayerCard dots role="button" with no handler | mimo | `src/components/PlayerCard.tsx:76-87` | Remove role, add aria-hidden. |
| M-30 | StandingsTable font-medium should be font-bold | mimo | `src/components/StandingsTable.tsx` | Fix th elements. |
| M-31 | MatchHeader font-black should be font-bold | mimo | `src/components/MatchHeader.tsx:49,60` | Fix team names. |
| M-32 | Focus ring on search inputs | mimo | `src/pages/Home.tsx:50`, `MatchPage.tsx:60` | Add focus-visible:ring-2. |
| M-33 | Focus ring on NotFound Link | mimo | `src/pages/NotFound.tsx:9` | Add focus-visible classes. |
| M-34 | Focus ring on BottomNav NavLink | mimo | `src/components/BottomNav.tsx:22-26` | Add focus-visible classes. |
| M-35 | Dead autoprefixer/postcss deps | mimo | `package.json` | npm uninstall autoprefixer postcss. |
| M-36 | CI npm install → npm ci | mimo | `.github/workflows/deploy.yml:28` | Fix to npm ci. |
| M-37 | Hardcoded match ID in BottomNav | mimo | `src/components/BottomNav.tsx:12` | Remove or fix. |
| M-38 | formatDayName unused in dates.ts | mimo | `src/utils/dates.ts:15-18` | Remove dead code. |
| M-39 | No engines field in package.json | mimo | `package.json` | Add `"engines": { "node": ">=18" }`. |
| M-40 | createHashRouter vs createBrowserRouter | mimo | `src/routes.tsx:1,24` | Switch to BrowserRouter. |
| M-41 | No viewport/theme-color in HTML | mimo | `index.html` | Add meta tags. |
| M-42 | MatchPage AnimatePresence layout shift | mimo | `src/pages/MatchPage.tsx:157` | Use mode="wait". |
| M-43 | PlayerCard key={i} for past matches | mimo | `src/components/PlayerCard.tsx:93` | Use match_id. |
| M-44 | GroupPage key={i} for top scorers | mimo | `src/pages/GroupPage.tsx:64` | Use player_id. |
| M-45 | MatchHeader key={i} for goals/bookings | mimo | `src/components/MatchHeader.tsx:87,140` | Use unique IDs. |
| M-46 | No aria-label on icon-only buttons | mimo | Multiple components | Add aria-label. |
| M-47 | Missing alt text for team crests | mimo | `src/components/MatchHeader.tsx:53,73` | Add alt text. |
| M-48 | BottomNav min-w-[64px] not responsive | mimo | `src/components/BottomNav.tsx:21` | Use responsive classes. |
| M-49 | No loading="lazy" on images | mimo, big-pickle | Multiple components | Add loading="lazy". |
| M-50 | Home footer copyright year hardcoded | mimo | `src/pages/Home.tsx:172` | Use new Date().getFullYear(). |
| M-51 | MatchPage sticky header z-index | mimo | `src/pages/MatchPage.tsx:75` | Use z-30 or z-40. |
| M-52 | PlayerPage season comparison empty seasons | mimo | `src/pages/PlayerPage.tsx:225-317` | Handle empty case. |
| M-53 | MatchPage no keyboard nav search | mimo | `src/pages/MatchPage.tsx:137-154` | Add keyboard handler. |
| M-54 | MatchPage staggerContainer variants | mimo | `src/pages/MatchPage.tsx:60-63` | Move outside component. |
| M-55 | StandingTeam uses strings for numeric fields | mimo | `src/types/teams.ts` | Change to number types. |
| M-56 | MatchSummary fs_A/fs_B as string not optional | mimo | `src/types/matches.ts` | Make optional. |
| M-57 | getWldFromScore returns 'V' on undefined | mimo | `src/utils/wld.ts:14` | Return undefined. |
| M-58 | getWldFromWinner returns 'V' on undefined | mimo | `src/utils/wld.ts:22` | Return undefined. |
| M-59 | WLD_CONFIG getWldConfig wrong default | mimo | `src/utils/wld.ts:10` | Fix default. |
| M-60 | Dates utility invalid date strings | mimo | `src/utils/dates.ts:3` | Add try/catch. |
| M-61 | formatTime empty string for undefined | mimo | `src/utils/dates.ts:12` | Return placeholder. |
| M-62 | MatchPage search no debounce | mimo, deepseek | `src/pages/MatchPage.tsx:144` | Use useDebounce hook. |
| M-63 | TeamPage goalsByTeamThisYear collisions | mimo | `src/utils/dataProcessors.ts:54` | Use unique key. |
| M-64 | PreMatchComparison parses without default | mimo | `src/components/PreMatchComparison.tsx:22-23` | Use parseInt(val \|\| '0', 10). |
| M-65 | StandingsTable parses without radix | mimo | `src/components/StandingsTable.tsx:32-33` | Add radix 10. |
| M-66 | PlayerPage statFilters re-created every render | mimo | `src/pages/PlayerPage.tsx:234-255` | useMemo. |
| M-67 | TurnauksetPage playoffGroups render | mimo | `src/pages/TurnauksetPage.tsx:96-120` | Memoize. |
| M-68 | FavoritesPage team IDs before names | mimo | `src/pages/FavoritesPage.tsx:59-60` | Show skeleton. |
| M-69 | Button cn() redundant merging | mimo | `src/components/Button.tsx:30` | Simplify. |
| M-70 | PlayerCard variants outside component | mimo | `src/components/PlayerCard.tsx:9-12` | Move inside or memoize. |
| M-71 | MatchPage unused MatchDetail type | mimo | `src/routes.tsx:11-17` | Remove. |
| M-72 | FavoritesPage missing initial loading | mimo | `src/pages/FavoritesPage.tsx:26-35` | Add skeleton. |
| M-73 | Home page competition logos not lazy | mimo | `src/pages/Home.tsx:141-162` | Add loading="lazy". |
| M-74 | MatchPage Number constructor for score | mimo | `src/pages/MatchPage.tsx:224` | Use parseInt. |
| M-75 | TeamPage historicalPlayersByYear empty init | mimo | `src/pages/TeamPage.tsx:25` | Initialize properly. |
| M-76 | StandingsTable doesn't handle missing standing | mimo | `src/components/StandingsTable.tsx:19` | Add null check. |
| M-77 | PlayerCard doesn't handle missing player_name | mimo | `src/components/PlayerCard.tsx:102` | Add fallback. |
| M-78 | MatchHeader score display uses ?? | mimo | `src/components/MatchHeader.tsx:59` | Handle properly. |
| M-79 | MatchPage searchValue not synced back nav | mimo | `src/pages/MatchPage.tsx:18,23-28` | Sync state. |
| M-80 | TeamPage performanceComparison years[0] | mimo | `src/pages/TeamPage.tsx:296` | Handle empty. |
| M-81 | PlayerPage seasonName string sort | mimo | `src/pages/PlayerPage.tsx:40` | Use numeric sort. |
| M-82 | CommonOpponents no-op replace pattern | mimo | `src/components/CommonOpponents.tsx:152-162` | Fix or remove. |
| M-83 | FavoritesPage shows "Tilastot" as name | mimo | `src/pages/FavoritesPage.tsx:60` | Fix display. |
| M-84 | GroupPage teamStandings computed twice | mimo | `src/pages/GroupPage.tsx:28-33` | Memoize once. |
| M-85 | Button spinner animate-spin | mimo | `src/components/Button.tsx:50-51` | Keep as-is (correct). |
| M-86 | Skeleton animate-pulse | mimo | `src/components/Skeleton.tsx:11` | Keep as-is (correct). |
| M-87 | Home page favorites empty state | mimo | `src/pages/Home.tsx:68-85` | Add empty state. |
| M-88 | TurnauksetPage no transition states | mimo | `src/pages/TurnauksetPage.tsx:138-183` | Add transitions. |
| M-89 | MatchPage team stats overlap mobile | mimo | `src/pages/MatchPage.tsx:190-294` | Fix responsive. |
| M-90 | PreMatchComparison form duplicates logic | mimo | `src/components/PreMatchComparison.tsx:82-113` | Extract. |
| M-91 | CommonOpponents no loading state | mimo | `src/components/CommonOpponents.tsx:76-101` | Add loading. |
| M-92 | PlayerPage season selector feedback | mimo | `src/pages/PlayerPage.tsx:170-189` | Add visual feedback. |
| M-93 | TeamPage categories not deduped by ID | mimo | `src/pages/TeamPage.tsx:394` | Fix dedup. |
| M-94 | MatchPage match cards no crests | mimo | `src/pages/MatchPage.tsx:265-293` | Add crests. |
| M-95 | TeamPage displayStats fallback object | mimo | `src/pages/TeamPage.tsx:290-292` | Memoize. |
| M-96 | api.ts inconsistent error re-throw | mimo | `src/services/api.ts:186-190` | Standardize. |
| M-97 | No loading state for CompetitionPage seasons | mimo | `src/pages/CompetitionPage.tsx:11` | Add skeleton. |
| M-98 | MatchPage useEffect deps includes fetchData | mimo | `src/pages/MatchPage.tsx:28` | Fix deps. |
| M-99 | Home page stats not used | mimo | `src/pages/Home.tsx:17-23` | Remove or use. |
| M-100 | BottomNav hardcoded /competition/spl | mimo | `src/components/BottomNav.tsx:7` | Make configurable. |
| M-101 | Framer Motion → CSS stagger | deepseek | Multiple components | Replace stagger animations with CSS, keep AnimatePresence. |
| M-102 | React.memo on list items | big-pickle | StandingsTable, PlayerCard | Wrap row/item components. |
| M-103 | Enable noUnusedLocals | big-pickle | `tsconfig.json` | Add `"noUnusedLocals": true`. |
| M-104 | Consolidate WLD functions | big-pickle | `wld.ts` | Merge getWldFromScore + getWldFromWinner. |
| M-105 | APINetworkError → APIHttpError | deepseek | `api.ts`, all consumers | Rename for clarity on 4xx/5xx. |

---

## Phased Implementation Roadmap

### Phase 1: Infrastructure (Week 1)
- [ ] **C-4**: Move API tokens to env vars
- [ ] **C-5**: Remove stack traces from production error boundary
- [ ] **C-6**: Add LRU eviction to cache
- [ ] **C-9**: Add vitest + @testing-library/react
- [ ] **C-10**: Add ESLint + Prettier
- [ ] **C-12**: Fix duplicate exports in types/index.ts
- [ ] **C-13**: Translate English UI text to Finnish
- [ ] **C-14**: Create MATCH_STATUS constants
- [ ] **H-9**: Extract errors.ts from api.ts
- [ ] **H-25**: Create routes.ts config
- [ ] **H-49**: Remove dead code (getScore, getTeamData, clearCache, etc.)
- [ ] **M-35**: Remove autoprefixer/postcss
- [ ] **M-36**: Fix CI npm ci
- [ ] **M-37**: Fix hardcoded match ID
- [ ] **M-103**: Enable noUnusedLocals
- [ ] **M-105**: Rename APINetworkError → APIHttpError

### Phase 2: Shared Components (Week 1-2)
- [ ] **H-1**: Create MatchRow component (highest ROI)
- [ ] **H-2**: Create PlayerAvatar component
- [ ] **H-3**: Create VenueDisplay component
- [ ] **H-4**: Create useAbortEffect hook, apply to all pages
- [ ] **H-14**: Fix CommonOpponents unused aliases + add AbortController
- [ ] **H-15**: Reuse StandingsTable in TurnauksetPage
- [ ] **H-16**: Extract getCategoryName to formatters.ts
- [ ] **H-42**: Create Card component
- [ ] **H-46**: Create useScrollPosition hook
- [ ] **H-47**: Create useDebounce hook
- [ ] **M-1**: Add React.lazy for heavy pages

### Phase 3: God Component Decomposition (Week 2-3)
- [ ] **C-1**: Decompose TeamPage (1068 → ~300 lines)
  - Create useTeamData hook
  - Extract TeamHeader, TeamStats, TeamRoster, TeamTransitions, TeamMatches, TeamTopScorers
- [ ] **C-2**: Decompose TurnauksetPage (566 → ~300 lines)
  - Create useTournamentData hook
  - Extract TournamentHero, PlayoffSection
- [ ] **C-3**: Decompose PlayerPage (420 → ~200 lines)
  - Create usePlayerData hook
  - Extract PlayerSeasonComparison
- [ ] **H-43**: Split processPlayerMatchHistory into 4 functions

### Phase 4: Type Safety & Error Handling (Week 3-4)
- [ ] **H-19**: Remove as any[] casts from TeamPage
- [ ] **H-23**: Remove index signature escape hatches from types
- [ ] **H-38**: Fix TeamPage relevantGroups any[] type
- [ ] **H-39**: Fix PlayerPage unsafe type assertion
- [ ] **H-40**: Fix TurnauksetPage as MatchWithVenue[] cast
- [ ] **H-41**: Create ErrorContext for global error handling
- [ ] **H-48**: Add retry button in error boundary
- [ ] **M-55**: Fix StandingTeam numeric types
- [ ] **M-56**: Fix MatchSummary optional fields
- [ ] **M-57/M-58**: Fix WLD undefined returns
- [ ] **M-104**: Consolidate WLD functions

### Phase 5: Resilience & Polish (Week 4-5)
- [ ] **H-44**: Cross-tab favorites sync
- [ ] **H-45**: Fix CommonOpponents race on expand/collapse
- [ ] **M-28**: Fix PlayerCard image onError
- [ ] **M-29**: Fix PlayerCard dots accessibility
- [ ] **M-30**: Fix StandingsTable font-weight
- [ ] **M-31**: Fix MatchHeader font-weight
- [ ] **M-32-M-34**: Add focus-visible rings
- [ ] **M-46**: Add aria-labels
- [ ] **M-47**: Add alt text for crests
- [ ] **M-48**: Fix BottomNav responsive
- [ ] **M-49**: Add loading="lazy"
- [ ] **M-101**: Replace Framer Motion stagger with CSS
- [ ] **M-102**: Add React.memo on list items

### Phase 6: Testing & Documentation (Week 5-6)
- [ ] **M-23-M-27**: Add unit tests for all utils and services
- [ ] **H-34**: Add JSDoc to all exported components
- [ ] **H-33**: Extract Finnish strings to i18n/strings.ts
- [ ] Add comprehensive README
- [ ] Add CONTRIBUTING.md

---

*Generated by opencode-mimo-v2.5-free on 2026-06-14T08:56:24Z*
*Updated: 2026-06-14T14:00:00Z — merged 15 unique findings from big-pickle & deepseek reviews*
