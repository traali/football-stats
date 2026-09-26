# Football Stats UI components

Status: **component catalog 2026-09-26**. Every file under `src/components/`, including `tournament/`. Screen contract: [UI_SPEC.md](./UI_SPEC.md). If a row and the file disagree, the file wins.

This app is not basketball. There is no `WebMcpBadge`. Tools still register from `src/mcp-app.ts`.

## Shell

| File | Mounted by | What the parent sees | Why |
|---|---|---|---|
| `BottomNav.tsx` | `routes.tsx` | Etusivu, Selaa (`/competition/etejp26`), Ottelu (`/match`), Suosikit | Selaa is Etelä, not a discovery browse |
| `PageLayout.tsx` | Home, competition, category, group, favorites, turnaukset | Page padding and title slot | Shared page frame |
| `BackButton.tsx` | Match, competition, category, group, favorites, turnaukset | Back | History, not a new route |
| `Button.tsx` | Home, match, competition | Primary button | Tuo, Avaa |
| `Card.tsx` | Group, team, match list | Surface panel | Groups the blocks below |
| `ErrorBoundaryPage.tsx` | router `errorElement` | 404 or Sivulla tapahtui virhe | Unknown hash stays a 404. Do not redirect home |
| `Skeleton.tsx` | Match | `Skeleton`, `PlayerCardSkeleton`, `MatchHeaderSkeleton`, `StandingsTableSkeleton` | Loading. Not fake stats |
| `index.ts` | pages | Barrel | Re-exports only |

## Match

| File | Mounted by | What the parent sees | Why |
|---|---|---|---|
| `MatchHeader.tsx` | Match | Teams, KÄYNNISSÄ, score, Maalit, Varoitukset | The game. Score only when TASO has one |
| `MatchLineups.tsx` | Match | Two lineups | Who dressed. Hosts `PlayerCard` and `EligibilityChip` |
| `PlayerCard.tsx` | Lineups, roster, tournament | One player, stats | Tap opens `/player/:id` |
| `PlayerAvatar.tsx` | Team | Photo or initial | No photo is not an error |
| `EligibilityChip.tsx` | Lineups | Age/level chip, `SquadQuotaBar` | Over-age or wrong level must be visible |
| `DualStatBar.tsx` | Match | Home vs away bar | Pre-match comparison of dressed players, goals, cards. Not a result |
| `CommonOpponents.tsx` | Match | Ei kokoonpanoa, or Yhteisiä vastaan | Shared opponents. Empty lineup must say so |
| `StandingsTable.tsx` | Group, match, `TeamStandingsBlock` | Joukkue, Kunto, opponent note | Group table. Row selects a team |
| `TeamStandingsBlock.tsx` | `TeamMatchList` | The same table, scoped | So the team list can show the group without a third tab |
| `PitchWeatherCard.tsx` | Match | FMI, Avaa sadetutka, temperature, grip, wind, rain, 30/30 | Outdoor only. No coordinates means no invented weather |
| `MatchPreviewExport.tsx` | Match | Jaa WhatsAppiin | Share text. Do not invent a message if the template is empty |
| `StatBadge.tsx` | Player card, team | One number with a label | Ottelut, goals, and the rest. A badge without a feed value should not show 0 as fact |

## Team and rows

| File | Mounted by | What the parent sees | Why |
|---|---|---|---|
| `TeamHeader.tsx` | Team | Joukkueprofiili, Kunto | Name, category, form |
| `TeamMatchList.tsx` | Team | Upcoming and played, Ei otteluita | Uses `MatchRowPast` and `MatchRowFixture` |
| `TeamRoster.tsx` | Team | Players, or Ei pelaajatietoja | Do not synthesize a squad |
| `MatchRow.tsx` | Group, team list | `MatchRowPast`, `MatchRowSymmetric`, `MatchRowFixture` | One row shape for played, both-teams, and future |

## Tournament import

Mounted from `TurnauksetPage.tsx`.

| File | What the parent sees | Why |
|---|---|---|
| `tournament/TournamentStandingsTable.tsx` | Joukkue table for the cup group | Cup table is not the league table |
| `tournament/TournamentMatchesList.tsx` | Matches, venue, or Ei otteluita | The cup schedule |
| `tournament/TournamentPlayoffsTree.tsx` | Knockout. Ei otteluita if the feed has no bracket | Do not draw an empty bracket as if teams are known |
| `tournament/TournamentScorersList.tsx` | Cup scorers | Only when the feed returned them |
| `tournament/index.ts` | Barrel | Re-exports only |

## Unmounted

| File | What it would show | Why it is unused |
|---|---|---|
| `PreMatchComparison.tsx` | Yhteensä yhteisiä vastustajia vastaan | Match page uses `DualStatBar` and `CommonOpponents` instead. Do not mount both |
