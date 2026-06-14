# Refactoring Plan — Football Stats

> **Model**: deepseek-v4-flash-free  
> **Date**: 2026-06-14 11:32  
> **Goal**: Make the codebase world-class: eliminate duplication, split monster files, enforce consistent conventions, and improve maintainability.

---

## Guiding Principles

- **One concern per file** — no file should do more than one thing
- **Extract until pain disappears** — if a pattern appears 3+ times, it's a component
- **Top-down execution** — start with foundation pieces smaller components depend on
- **Build after every step** — never leave the tree broken
- **Keep Finnish naming** for user-facing concepts (TurnauksetPage stays)

---

## Phase 1: Shared Utilities

Files that pure functions / constants many components will import.

### Step 1.1 — `src/utils/dates.ts`

**Create** shared date/time formatters.

```typescript
export function formatDate(dateStr: string, format: 'short' | 'day-month' = 'day-month'): string
export function formatTime(time: string): string  // "14:00"
export function formatDayName(dateStr: string): string  // "Pe"
```

**Replace all inline date formatting:**
- `src/pages/TurnauksetPage.tsx:35-42` — delete local `formatDate`/`formatTime`, import from utils
- `src/pages/GroupPage.tsx:102,128` — replace `m.date?.slice(5)` → `formatDate(m.date, 'short')`
- `src/pages/PlayerPage.tsx:100,297,354,398` — replace `slice(5)` calls
- `src/pages/TeamPage.tsx:722,749` — replace `slice(5)` calls
- `src/components/PlayerCard.tsx:100` — replace `slice(5)` call

---

### Step 1.2 — `src/utils/wld.ts`

**Create** shared WLD (win/draw/loss) configuration.

```typescript
export const WLD = {
  V: { label: 'V', color: 'text-semantic-green', bg: 'bg-semantic-green/10', dot: 'bg-semantic-green' },
  T: { label: 'T', color: 'text-accent', bg: 'bg-accent/10', dot: 'bg-accent' },
  H: { label: 'H', color: 'text-semantic-red', bg: 'bg-semantic-red/10', dot: 'bg-semantic-red' },
} as const

export function getWldFromScore(fsA: string, fsB: string, teamId: string): 'V' | 'T' | 'H'
export function getWldFromWinner(winnerId: string, teamId: string): 'V' | 'T' | 'H'
```

**Replace inline WLD configs in:**
- `src/components/StandingsTable.tsx:52-57`
- `src/components/PreMatchComparison.tsx:82-86`
- `src/components/CommonOpponents.tsx:133-170`
- `src/pages/TeamPage.tsx:757-761`
- `src/pages/GroupPage.tsx:93-95`
- `src/pages/PlayerPage.tsx:289-290,344`

---

### Step 1.3 — `src/utils/crest.ts`

**Create** shared crest resolution helper.

```typescript
export function resolveCrest(team: { img_url?: string; club_crest?: string; crest?: string }): string | undefined
```

**Consolidate** the `img_url || club_crest || crest` pattern used in:
- `src/components/MatchHeader.tsx`
- `src/pages/TeamPage.tsx`
- `src/pages/TurnauksetPage.tsx`

---

### Step 1.4 — Barrel Exports

**Create** `index.ts` in each directory:

| File | Exports |
|---|---|
| `src/utils/index.ts` | `dates`, `wld`, `crest`, `cn`, `dataProcessors` |
| `src/components/index.ts` | all components (created in later steps too) |
| `src/hooks/index.ts` | all hooks |
| `src/services/index.ts` | api, cache, errors |
| `src/types/index.ts` | all types |

**Update** all imports across the project to use barrel paths where cleaner.

---

## Phase 2: Shared Components

### Step 2.1 — `src/components/BackButton.tsx`

**Props**: `to?: string` (default `-1`), `label?: string` (default `'Takaisin'`)

**Replace** the 6 inline back buttons:
| File | Lines |
|---|---|
| `TeamPage.tsx` | 782-783 |
| `PlayerPage.tsx` | 127-128 |
| `GroupPage.tsx` | 40-41 |
| `TurnauksetPage.tsx` | 226-227 |
| `CompetitionPage.tsx` | 29-30 |
| `CategoryPage.tsx` | 28-29 |

**Net reduction**: ~48 lines → ~15 lines

---

### Step 2.2 — `src/components/PageLayout.tsx`

```typescript
export function PageLayout({ children, className }: { children: React.ReactNode; className?: string })
```

Wraps in `min-h-screen px-4 py-6 > max-w-6xl mx-auto space-y-6`.

**Replace** the wrapper div in all 9 pages:
| File | Lines |
|---|---|
| `Home.tsx` | 36-37 |
| `TeamPage.tsx` | 780-781 |
| `PlayerPage.tsx` | 125-126 |
| `TurnauksetPage.tsx` | 224-225 |
| `GroupPage.tsx` | 38-39 |
| `MatchPage.tsx` | 66, 130 |
| `CompetitionPage.tsx` | 27-28 |
| `CategoryPage.tsx` | 26-27 |
| `FavoritesPage.tsx` | 24-25 |

---

### Step 2.3 — `src/components/PlayerAvatar.tsx`

**Props**: `imgUrl?: string`, `size: 'sm' | 'md' | 'lg'` (maps to w-7, w-9, w-12)

**Replace** the `<img>`/`<User>` fallback pattern in:
| File | Lines | Size |
|---|---|---|
| `TeamPage.tsx` | 544-548, 602-607, 658-662 | `w-9 h-9` |
| `TurnauksetPage.tsx` | 528-531 | `w-12 h-12` |
| `PlayerPage.tsx` | 135-139 | `w-16 h-16` |
| `PlayerCard.tsx` | 26-37 | `w-10 h-10` |

---

### Step 2.4 — `src/components/MatchRow.tsx` ⭐ **HIGHEST IMPACT**

**Props**: `match: MatchSummary | DiscoveryMatch`, `teamId?: string` (to highlight own team), `showVenue?: boolean`, `showReferee?: boolean`, `onClick?: () => void`

**Renders**: date | team_A vs team_B | score + optional venue + optional referee.

**Consolidate** match row rendering from **6 locations**:
| File | Lines | Variation |
|---|---|---|
| `TeamPage.tsx` | 716-771 | upcoming + past, WLD badge |
| `GroupPage.tsx` | 85-136 | past + upcoming, WLD from winner_id |
| `PlayerPage.tsx` | 320-416 | past + upcoming, "MAALI" badge |
| `TurnauksetPage.tsx` | 313-384 | team matches with home/away logic |
| `TurnauksetPage.tsx` | 419-457 | playoff matches with renderPlayoffTeamName |
| `CommonOpponents.tsx` | ~140-170 | via formatResult |

**Design notes**:
- Accept `renderTeamName?: (name: string) => ReactNode` prop for playoff name rendering
- Score display: `isFixture` → `–`, otherwise `score–score`
- Date: uses `formatDate(m.date)` from Step 1.1
- Optional venue/referee sub-rows

**Net reduction**: ~300+ duplicated lines → ~80 lines of component

---

### Step 2.5 — `src/components/VenueDisplay.tsx`

**Props**: `venueName?: string`, `venueLocation?: string`

**Consolidate** venue rendering from:
- `TurnauksetPage.tsx:356-361, 441-446`
- `MatchHeader.tsx:141` (currently hidden)

Renders: `<MapPin className="w-3 h-3" /> {venueName} · {venueLocation}`

---

## Phase 3: Service & Type Cleanup

### Step 3.1 — `src/services/errors.ts`

**Extract** the 4 error classes from `api.ts:31-46`:
- `APINotFoundError`
- `APINetworkError`
- `APITimeoutError`
- `APIRateLimitError`

**Update** `api.ts` imports from `./errors`. Update all files that import these errors (currently they come from `api.ts`).

---

### Step 3.2 — `src/types/` split

Split the 298-line `src/types/api.ts` by domain:

| New file | Contents |
|---|---|
| `src/types/matches.ts` | `MatchSummary`, `MatchDetails`, `MatchGoal`, `MatchBooking`, `DiscoveryMatch`, `GetMatchesParams` |
| `src/types/teams.ts` | `TeamBasic`, `TeamResponse`, `StandingTeam`, `GroupDetails`, `GroupResponse` |
| `src/types/players.ts` | `PlayerBasic`, `PlayerLineupInfo`, `PlayerStatsEntry`, `PlayerAPIResponse` |
| `src/types/competition.ts` | `Competition`, `Category`, `Season`, `ScoreEntry` |
| `src/types/index.ts` | re-exports all of the above |
| `src/types/api.ts` | **(deleted)** |

---

### Step 3.3 — `src/config.ts` from `src/types/config.ts`

**Split** `src/types/config.ts`:
- Keep only the `APIConfig` interface → `src/types/config.ts`
- Extract runtime `APP_CONFIG` constant → `src/config.ts`

---

## Phase 4: Big Page Refactors

### Step 4.1 — Refactor `src/pages/TeamPage.tsx` (1073→~300 lines)

1. **Create** `src/hooks/useTeamData.ts` — all data fetching + memo computations
2. **Create** `src/components/TeamDetailHeader.tsx` — crest, name, stats grid
3. **Create** `src/components/TeamRosterList.tsx` — player list with PlayerAvatar
4. **Create** `src/components/TeamScorersList.tsx` — top scorers
5. **Create** `src/components/TeamTransitionsList.tsx` — player transfers
6. **Create** `src/components/TeamMatchList.tsx` — upcoming + past matches (uses MatchRow)
7. **Refactor** `TeamPage.tsx` — orchestrate the above components with tab navigation

**Before**: 1073 lines, 9 inline sections  
**After**: ~250 lines, 6 components + 1 hook

---

### Step 4.2 — Refactor `src/pages/TurnauksetPage.tsx` (579→~300 lines)

1. **Create** `src/hooks/useTournamentData.ts` — all data fetching + memo computations
2. **Create** `src/components/TournamentHero.tsx` — crest, name, group info, gradient bar
3. **Create** `src/components/PlayoffSection.tsx` — collapsible bracket list with MatchRow
4. **Reuse** `StandingsTable.tsx` (already exists!) — replace the inline `<table>` at lines 265-311
5. **Refactor** `TurnauksetPage.tsx` — compose hero + StandingsTable + MatchRow + PlayoffSection + scorers + roster

**Key**: The inline standings table (45 lines) must support the TM/PM/ME columns that TurnauksetPage uses. If StandingsTable doesn't have these columns, add an optional `showGoalDiff` prop.

---

### Step 4.3 — Refactor `src/pages/PlayerPage.tsx` (421→~200 lines)

1. **Create** `src/hooks/usePlayerData.ts` — all fetching + `buildSeasonStats`
2. **Create** `src/components/PlayerSeasonComparison.tsx` — the expandable stat filter system (lines 223-315)
3. **Refactor** `PlayerPage.tsx` — compose header + filter sidebar + SeasonComparison + MatchRow instances

---

## Phase 5: Polishing

### Step 5.1 — Standardize Skeleton Loading

**Replace** raw `animate-pulse` divs with `Skeleton` component (already exists at `src/components/Skeleton.tsx`!) in:
- `TeamPage.tsx:484-491`
- `PlayerPage.tsx:108`
- `GroupPage.tsx:25`
- `CompetitionPage.tsx:23`
- `CategoryPage.tsx:22`
- `TurnauksetPage.tsx:207-215`

---

### Step 5.2 — Fix Unused Imports

| File | Import to remove |
|---|---|
| `MatchHeader.tsx` | `Goal` from lucide-react |
| `CommonOpponents.tsx` | `Shield`, `Goal`, `Calendar` from lucide-react |
| `useMatchData.ts` | Change `PlayerLineupInfo` to `type` import |

---

### Step 5.3 — Add AbortController

Add abort signal handling to pages that currently lack it:
- `GroupPage.tsx` — currently no abort safety
- `CompetitionPage.tsx` — no abort safety  
- `CategoryPage.tsx` — no abort safety

---

### Step 5.4 — `src/styles/index.css`

**Move** `src/index.css` → `src/styles/index.css`. Update import in `main.tsx`.

---

### Step 5.5 — Consistent Venue Display

**Add** venue display to `MatchHeader.tsx` (currently hidden: line 141 has the property but doesn't render it).

---

## Execution Order Summary

```
Phase 1: Utils        dates.ts → wld.ts → crest.ts → barrel exports
Phase 2: Components   BackButton → PageLayout → PlayerAvatar → MatchRow → VenueDisplay
Phase 3: Services     errors.ts → types/ split → config.ts split
Phase 4: Pages        TeamPage → TurnauksetPage → PlayerPage
Phase 5: Polish       Skeletons → unused imports → AbortController → css move → venue consistency
```

**Total**: ~20 steps. Each step is `edit` + `npm run build`. Estimated: 2-4 hours of focused work.

---

## Risk Notes

| Risk | Mitigation |
|---|---|
| `.includes('M/')` in playground rendering is specific to HC2026 | When extracting PlayoffSection, keep the involvesM logic but make it configurable via a `highlightFilter` prop |
| `StandingsTable.tsx` doesn't have goal-diff columns | Add an optional `showGoalDiff` prop — avoids duplicating the table |
| Renaming files breaks imports | Do barrel exports first, then use `git mv` for file renames |
| `renderPlayoffTeamName` is specific to TurnauksetPage | Keep it in TurnauksetPage but extract the regex/lookup into a helper; pass it as MatchRow's `renderTeamName` prop |
