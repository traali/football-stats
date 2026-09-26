# Football Stats UI spec

Status: **signed off 2026-09-26** for other models, with the limits in section 0. Code-reviewed against `src/` on main `d71dd6c`. Not a fresh phone tap of every control in this session.
Live: https://football-stats-agk.pages.dev
Job: Palloliitto TASO for the teams this family actually follows, plus a way to open one match or import a Torneopal tournament. This is **not** the basketball/floorball discovery app.

If this doc and the code disagree, the code wins. Update this file in the same commit.

## 0. Sign-off

**Signed.** The shell, the routes that exist, the home blocks, the team tabs, the group page, and where favorites live.

**Do not "fix" these into the other monasteries:**

- There is no `/search` and no `/browse`. Bottom nav **Selaa** goes to `/competition/etejp26` (Etelä, from `FEATURED` in `src/config.ts`). **Ottelu** goes to `/match` so you can type an id.
- Home title is `Pelaajatilastot`. The subtitle `PPJ/Laru sin · P13 Kolmonen · Etelä` is a fixed identity line, not a live filter.
- The featured team card is `FEATURED`: team `185085`, PPJ/Laru sin, competition `etejp26`, category `P133`, group `4`.
- `FEATURED.calendarNote` is still `Vierumäki 4.–6.9.2026`. That date is **stale** as of 2026-09-26. Do not treat it as a live tournament clock. Updating the note is allowed. Inventing a new featured team is not.
- Favorites are `localStorage` keys `favoriteTeams` and the player list beside them. Not Cloudflare.
- WebMCP tools register from `src/mcp-app.ts` onto `document.modelContext`. There is **no** header badge. Do not add one just to match basketball unless you also show native vs polyfill honestly.
- `?embed=true` hides the bottom nav and the version footer.

**Not signed:** that every tournament import host still resolves, and the inner layout of match weather / lineups beyond the blocks named here.

## 1. Shell

| Element | File | Why |
|---|---|---|
| Bottom nav | `src/components/BottomNav.tsx` | Etusivu, Selaa (`/competition/etejp26`), Ottelu (`/match`), Suosikit |
| Version footer | `src/routes.tsx` Layout | `Football Stats` plus `v… (git:…)` so a parent screenshot can be tied to a commit |
| 404 | `src/pages/NotFound.tsx` | Unknown hash. Basketball redirects home. Football says 404. Leave it |
| Error boundary | `ErrorBoundaryPage` | A TASO failure must not blank the app |

Hash router. Routes in `src/routes.tsx`.

## 2. Routes

| Path | Page | Why |
|---|---|---|
| `/` | Home | Next match of the featured/favorite context, featured team, recent matches, favorites, tournament list, import |
| `/match` and `/match/:matchId` | Match | Open by id, or the deep link |
| `/competition/:compId` | Competition | Categories. Selaa lands on `etejp26` |
| `/competition/:compId/category/:catId` | Category | Groups |
| `/group/:compId/:catId/:groupId` | Group | Table, scorers, played, upcoming |
| `/team/:teamId` | Team | Matches and players |
| `/player/:playerId` | Player | Teams, games, the heart |
| `/favorites` | Favorites | Teams and players |
| `/turnaukset/:turnaus/:sarja/...` | Tournament | A cup imported from a Torneopal host, not the league |

## 3. Home

`src/pages/Home.tsx`

| Element | Why |
|---|---|
| Title + subtitle | Product name, then which child-team this install is about |
| Suosikkijoukkueet chips | Only if at least one favorite exists. Sets last-selected team and opens `/team/:id` |
| Hero card | Käynnissä, Viimeisin ottelu, or Seuraava ottelu. Score only when live or played. Venue is `venue_name`. Tap opens `/match/:id` |
| Featured team row | The configured PPJ/Laru sin entry. Shield, name, `Joukkue · Syksy 1 · {calendarNote}` |
| Avatut ottelut | Recently opened matches from the viewed cache. Hidden when empty |
| Suosikit | Players then teams. "Kaikki (n)" opens `/favorites` |
| Turnaukset ja Cupit | Saved tournament rows from `tournamentStorage` |
| Tuo turnaus linkillä | Paste a `*.torneopal.fi` team or series URL. This is how a cup gets in. Do not scrape a fake one |
| Hae ottelu tunnuksella | Collapsed. Match id to `/match/:id` |

## 4. Team

`src/pages/TeamPage.tsx`

Phone: tabs **Ottelut** and **Pelaajat**. Desktop: roster, scorers, and transitions stay visible beside the match list. There is no third "Sarjataulukko" tab on the team page. The table lives on the group page. Do not add a fake table on the team to copy basketball.

## 5. Group

`src/pages/GroupPage.tsx`

| Block | Why |
|---|---|
| Title | Group name, competition / category |
| Sarjataulukko | `StandingsTable`. Row tap selects a team |
| Maalintekijät | Only if the feed returned scorers. Rank, name, team, goals. Player opens `/player`, team name opens `/team` |
| Viimeisimmät ottelut | Played, newest last in the reversed list |
| Tulevat ottelut | Not yet played |

## 6. Match

`src/pages/MatchPage.tsx` is one scroll, not basketball's six tabs. Blocks that must stay if the feed has the data:

- Header (teams, score, status)
- Lineups
- Pre-match comparison when the match is not played (`DualStatBar` for dressed players, season goals, cards)
- Weather card when the venue is outdoor and coordinates exist
- Standings snippet for the two teams' group

Do not invent lineups.

## 7. What not to "improve"

- Do not add `/browse` by copying basketball unless you also remove the hardcoded Selaa target in the same change.
- Do not delete FEATURED. It is the family's team, not sample data.
- Do not refresh `calendarNote` by guessing. Read the tournament or delete the stale sentence.
- Do not show 0–0 for a fixture that has not been played.
- Do not overwrite a native `document.modelContext`.
