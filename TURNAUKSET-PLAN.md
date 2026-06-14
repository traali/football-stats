# TurnauksetPage — Implementation Plan

## Goal
Add a route `/turnaukset/:turnaus/:sarja/:teamId` that renders a dedicated **TurnauksetPage** for viewing a team's tournament data (group stage, standings, matches, playoff brackets, and roster) at a single tournament — without modifying the existing `TeamPage`.

## Example URL
```
#/turnaukset/hc2026/B13-8/185085
```

## Data Sources (all existing REST API endpoints)

| Call | What it returns |
|------|----------------|
| `getGroups(comp, cat)` | All groups for a competition+category, including standings per group (`GroupDetails[]` with `teams: StandingTeam[]`) |
| `getGroupFull(comp, cat, groupId)` | Full group data including all matches (`GroupResponse` with `matches: MatchSummary[]`) |
| `getTeamProfile(teamId)` | Team name, crest, player roster (`TeamResponse` with `players: TeamRosterPlayer[]`) |
| `batchFetch(ids, fn, 3)` | Parallel fetch of playoff groups (A-fin=16, B-fin=17, C-fin=18) |

## Data Flow

```
useEffect mount
  │
  ├─ getGroups(turnaus, sarja)
  │    └─ scan 18 groups → find one where teams[].team_id === teamId
  │       saves: groupId, groupName, standings
  │
  ├─ Promise.all( getGroupFull, getTeamProfile )
  │    ├─ getGroupFull → matches (all group matches)
  │    └─ getTeamProfile → teamName, crest, players
  │
  ├─ batchFetch(['16','17','18'], id => getGroupFull(turnaus, sarja, id), 3)
  │    └─ playoffMatches for A/B/C-fin
  │
  └─ setState({ loading: false })
```

## UI Structure (vertical stack, mobile-first)

```
[← Takaisin]

┌─ Hero Card ──────────────────────────────┐
│ crest · teamName                          │
│ competitionName · categoryName            │
│ lohkoName · Sija N · 0 ottelua           │
└──────────────────────────────────────────┘

┌─ Sarjataulukko ──────────────────────────┐
│ <standings table>                         │
│ # | Joukkue | O | V | T | H | TM | PM | P│
│ PPJ row highlighted (bg-accent/5)         │
└──────────────────────────────────────────┘

┌─ PPJ:n ottelut (N) ──────────────────────┐
│ [date] [time]  teamA vs teamB    score    │
│ PPJ name in accent color                  │
│ venue name in muted text                  │
│ clickable → /match/:id                    │
└──────────────────────────────────────────┘

┌─ Jatko-ottelut ──────────────────────────┐
│  ● A-fin · Sijoille 1.–2.  [▼/▶]        │  (collapsible)
│  ● B-fin · Sijoille 3.–4.  [▼/▶]        │
│  ● C-fin · Sijoille 5.–6.  [▼/▶]        │
│                                          │
│  Expanded: sorted matches, like group     │
│  Matches with "M/" highlighted (M-lohko) │
│                                          │
│  Note: "M/I = Lohko M, sija 1"          │
└──────────────────────────────────────────┘

┌─ Kokoonpano (N) ─────────────────────────┐
│ [player card grid]                        │
│ avatar + name + birthyear + #shirt       │
│ clickable → /player/:id                  │
└──────────────────────────────────────────┘
```

## Key Design Decisions

### Standings table
- Use `StandingTeam[]` from `getGroups` response (already sorted by API by `current_standing`)
- Columns: `# | Joukkue | O | V | T | H | TM | PM | ME | P`
- PPJ row highlighted with `bg-accent/5` and team name in `text-accent`
- No sort controls needed (data is static, no games played yet for HC)

### Matches list
- Filter group matches to only PPJ's (`team_A_id === teamId || team_B_id === teamId`)
- Sort by `(date+time)` ascending
- Show full team names, PPJ in accent
- Score: show `m.fs_A–m.fs_B` for played matches, `–` for fixtures (`status === 'Fixture'`)
- Venue shown as muted text below teams (from `MatchSummary` extended with `venue_name`, `venue_location_name`)
- Clickable → navigate to `/match/:matchId`

### Playoff brackets
- Three collapsible cards (A-fin, B-fin, C-fin), all collapsed by default
- On expand: show all matches for that group, sorted by date+time
- Matches referencing "M/" (PPJ's Lohko M) highlighted with `font-semibold text-text-primary`
- Other matches rendered as `text-text-muted/80`
- Final match (match 7680) appears only once (deduplicated by API itself)
- Accompanying explanatory note about lohko → playoff mapping

### Player roster
- From `getTeamProfile().players`
- Same card grid pattern as `TeamPage` (avatar, name, birthyear, shirt number)
- Clickable → `/player/:playerId`

### Errors & Loading
- Loading: skeleton pulsing cards
- Error: centered red text
- Not found (team not in any group): "Joukkuetta ei löydy tästä turnauksesta"

### No new types needed
- Extend `MatchSummary` locally with `venue_name?: string; venue_location_name?: string` as a `MatchWithVenue` interface
- Everything else uses existing types (`StandingTeam`, `TeamRosterPlayer`, `GroupResponse`)

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/TurnauksetPage.tsx` | **Create** (~250 lines) |
| `src/routes.tsx` | **Modify** (+1 import +1 route) |

## Build Commands
```bash
npm run build   # tsc + vite build
```

## Helsinki Cup 2026 Constants (for reference)

| Item | Value |
|------|-------|
| competition | `hc2026` |
| category | `B13-8` |
| PPJ team ID | `185085` |
| PPJ group | `13` (Lohko M) |
| A-fin group | `16` |
| B-fin group | `17` |
| C-fin group | `18` |
| All matches | 5 group matches, all fixtures (status: "Fixture") |
| Player stats | empty for HC categories |
