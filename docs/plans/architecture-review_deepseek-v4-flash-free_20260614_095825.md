# Architecture Review — Football Stats (SPL / Palloliitto)

**Model:** deepseek-v4-flash-free
**Timestamp:** 2026-06-14 09:58 UTC
**Status:** COMPLETE

---

## Plan Landscape

| Plan File | Language | Scope | Status |
|-----------|----------|-------|--------|
| `FIX_PLAN.md` | English | 35 findings, 80-min fix | Partially done |
| `FINAL_PLAN.md` | English | 35 findings from 3 models | Partially done |
| `PLAN.md` | English | 4-phase, 5-7 week plan | Superseded (criticized as over-engineered) |
| `deepseek-v4-flash-free_refactoring-plan.md` | English | 20-step refactoring plan | Phases 1-2 mostly done |
| `architecture_review_big-pickle.md` | English | 300-point audit from big-pickle | Reference |
| `architecture_review_opencode-mimo-v2.5-free.md` | English | 300-point audit from opencode-mimo | Reference |
| *(this file)* | **English** | Consolidated delta from all plans | **Current** |

---

## What the Latest Commit Already Did

Commit `ecdc1ba` ("refactor: shared utilities, components, types & barrel exports") executed the existing `deepseek-v4-flash-free_refactoring-plan.md` Phases 1-2:

### Done — Shared Utilities
- `src/utils/dates.ts` — `formatDate`, `formatTime`, `formatDayName`
- `src/utils/wld.ts` — `WLD_CONFIG`, `getWldFromScore`, `getWldFromWinner`
- `src/utils/crest.ts` — `resolveCrest`, `resolveCrestFromBasic`
- Barrel exports in `utils/index.ts`, `components/index.ts`, `hooks/index.ts`, `types/index.ts`

### Done — Shared Components
- `BackButton.tsx` — reusable back button with optional `to`/`label` props
- `PageLayout.tsx` — reusable page wrapper (`min-h-screen px-4 py-6 > max-w-6xl mx-auto`)

### Done — WLD Deduplication
- `CommonOpponents.tsx` — replaced manual color logic with `WLD_CONFIG`
- `PreMatchComparison.tsx` — same
- `StandingsTable.tsx` — same

### Done — Types & Config
- `types/api.ts` split into `matches.ts`, `teams.ts`, `players.ts`, `competition.ts`
- `config.ts` runtime config separated from `types/config.ts` type definition
- Duplicate barrel exports removed from `types/index.ts`

---

## Remaining Work

### 🔴 Critical — Finnish UI

The following UI strings are still in English and must be Finnish:

| # | File | Line | Current Text | Fix To |
|---|------|------|-------------|--------|
| 1 | `src/pages/MatchPage.tsx` | 133 | `<h1>Match View</h1>` | `<h1>Ottelut</h1>` |
| 2 | `src/pages/MatchPage.tsx` | 134 | `<p>Current single-match experience, now on its own route.</p>` | Remove or replace with Finnish description |
| 3 | `src/pages/Home.tsx` | 172 | `Data provided by Suomen Palloliitto` | `Data: Suomen Palloliitto` |

### 🔴 Critical — Dead Code Removal

| # | Function/Type | File | Reason |
|---|--------------|------|--------|
| 1 | `getScore` | `src/services/api.ts` | Defined but never called |
| 2 | `getTeamData` | `src/services/api.ts` | `@deprecated`, just calls `getTeamProfile` |
| 3 | `clearCache` | `src/services/cache.ts` | Exported but never called |
| 4 | `getWldFromWinner` | `src/utils/wld.ts` | Defined but never called |
| 5 | `getCached` | `src/services/cache.ts` | Only used internally by `withCache` |
| 6 | `ScoreEntry` type | `src/types/matches.ts` | Never used |
| 7 | `getGroupDetails` | `src/services/api.ts` | Nearly identical to `getGroupFull` |

### 🟠 High — Splits & Extractions

Remaining refactoring from `deepseek-v4-flash-free_refactoring-plan.md` Phase 3-5:

| # | Task | Priority | Notes |
|---|------|----------|-------|
| 1 | Extract `src/services/errors.ts` — move 4 error classes out of `api.ts` | High | api.ts is still doing too much |
| 2 | Create `PlayerAvatar` component — consolidate `<img>`/`<User>` fallback pattern (6 locations) | High | Pattern in TeamPage, TurnauksetPage, PlayerPage, PlayerCard |
| 3 | Create `MatchRow` component — consolidate match row rendering (5+ locations, ~300 lines) | **Highest ROI** | TeamPage, GroupPage, PlayerPage, TurnauksetPage, CommonOpponents all duplicate this |
| 4 | Create `VenueDisplay` component — venue name + location display (2 locations) | Medium | TurnauksetPage + hidden MatchHeader venue |
| 5 | Standardize skeleton loaders — replace raw `animate-pulse` divs with `Skeleton` component | Medium | 6 locations still using raw pulse |
| 6 | Add AbortController to GroupPage, CompetitionPage, CategoryPage | Medium | Currently no abort safety on unmount |
| 7 | Fix unused imports (MatchHeader: `Goal`, CommonOpponents: `Shield`/`Goal`/`Calendar`) | Low | |
| 8 | Move `src/index.css` → `src/styles/index.css` | Low | |
| 9 | Add venue display to `MatchHeader.tsx` (property exists but not rendered) | Low | |

### 🟡 Medium — Architecture & Type Safety

| # | Task | Source |
|---|------|--------|
| 1 | Add LRU eviction to cache (max 500 entries) | All 3 architecture reviews |
| 2 | Add `loading="lazy"` to all player images and crests | Team 2 (Performance) |
| 3 | Eliminate remaining `any[]` casts (TeamPage categories, PlayerPage player_statistics) | Team 3 (Typing) |
| 4 | Add CSP meta tag to `index.html` | Team 2 (Security) |
| 5 | Add eslint + prettier config | Team 3 (Maintainability) |
| 6 | Replace framer-motion stagger with CSS animations | Team 2 (Performance) |
| 7 | Add Vitest + React Testing Library | Team 3 (Testing) |
| 8 | Split `processPlayerMatchHistory` into 4 focused functions | Team 1 (Architecture) |
| 9 | Split `TeamPage.tsx` (925+ lines) into sub-components | All 3 teams |
| 10 | Split `TurnauksetPage.tsx` (568 lines) into sub-components | All 3 teams |

---

## Consolidated Action Roadmap

### Sprint 1 (Immediate — English UI Fixes + Dead Code)
```
Day 1:  MatchPage.tsx:133-134 "Match View" → "Ottelut"
Day 1:  Home.tsx:172 footer "Data provided by" → "Data: Suomen Palloliitto"
Day 1:  Audit entire app for any remaining English strings
Day 2:  Remove dead code: getScore, getTeamData, clearCache, getWldFromWinner, ScoreEntry
Day 2:  Remove duplicate getGroupDetails (just keep getGroupFull)
```

### Sprint 2 (High ROI — Component Extraction)
```
Day 3:  Extract errors.ts from api.ts
Day 4:  Create PlayerAvatar component (consolidate 6 img/fallback locations)
Day 5-6: Create MatchRow component (consolidate 5+ match row locations)
Day 7:  Create VenueDisplay component
Day 7:  Add AbortController to GroupPage, CompetitionPage, CategoryPage
```

### Sprint 3 (Architecture & Quality)
```
Day 8-9:  Standardize skeleton loaders
Day 10:   LRU eviction for cache, lazy loading for images
Day 11:   Eliminate any[] casts
Day 12:   CSP header, eslint/prettier config
Day 13:   CSS animation replacement for framer-motion stagger
Day 14:   Vitest + first test suite
```

### Sprint 4 (Monolith Splits)
```
Week 3:   Split processPlayerMatchHistory
Week 3:   Split TeamPage.tsx into sub-components + useTeamData hook
Week 4:   Split TurnauksetPage.tsx into sub-components + useTournamentData hook
```

**Total:** ~4 weeks for full completion. The `deepseek-v4-flash-free_refactoring-plan.md` file remains the canonical step-by-step guide — this file serves as the delta/status tracker.

---

## References

- `docs/plans/deepseek-v4-flash-free_refactoring-plan_2026-06-14_11-32-37.md` — Canonical 20-step refactoring plan
- `docs/plans/FINAL_PLAN.md` — 35 findings from 3 models (80-min fix plan)
- `docs/plans/FIX_PLAN.md` — Original 35 findings
- `docs/plans/architecture_review_big-pickle_20260614_085848.md` — 300-point audit
- `docs/plans/architecture_review_opencode-mimo-v2.5-free_20260614_085624.md` — 300-point audit

