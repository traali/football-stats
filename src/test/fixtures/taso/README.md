# Taso fixtures

Real responses from `https://spl.torneopal.net/taso/rest/` captured on 2026-10-08 (Helsinki, about 07:00).
To keep the repo small, each file keeps only the fields the app reads; every value is exactly what Taso sent.

| File | What it proves |
|---|---|
| `getMatches_team_185085.json` | 124 matches for PPJ/Laru sin: 122 Played, 1 Fixture (tonight 18:00), 1 Planned (2022, no time). List scores for unplayed games are `''`. |
| `getMatch_4208643.json` | Tonight's Fixture. Taso sends `fs_A='0'`, `fs_B='0'`, `live_A='0'` before kickoff. That is not a score. |
| `getMatch_4321827.json` | SAPA vs PPJ/Laru mus, same 18:00 slot. |
| `getMatch_4208631.json` | Played 2–3 with Taso's own temperature `13`, weather `Pilvistä`, attendance `30`. |
| `getMatch_4208570.json` | A walkover: getMatch says `status: Played`, `walkover: 1`, `forfeit_A: 'match'`. |
| `getGroup_etejp26_P133_4.json` | Syksy 1: 3 `Forfeited` matches, `show_points_per_match: 1`, table order by points per match. |
| `getPlayer_535740.json` | Simo Oinonen: stale 2023 Fixture 2904676 in `matches`, tonight's two games in `upcoming`. |
| `getMatches_placeholders_2026-10-31.json` | Knockout games with no teams yet (`team_A_id: ''`, names like `v345983`). |
| `getGroup_hc2026_B13-8_13.json`, `_17.json` | Helsinki Cup 2026 B13 8v8: group M and the B-final bracket. |
| `getGroups_hc2026_B13-8.json` | `getGroups` answers `Not allowed` for Helsinki Cup, so the app has to read groups one by one. |
| `getMatch_unknown.json` | Unknown match id: HTTP 200 with `status: error`. |
| `search_*.json` | `search?text=` for a player and for teams/clubs. |
| `getCategory_etejp26_P133.json` | getCategory lists the groups (ids 4, 5, 1, 2: not 1..N). `getGroups` answers `Not allowed` for this league too. |
| `getClub_52_trimmed.json` | getClub shape with three active teams and one archived. Taso also sends contact name/email/phone and officials: those values are **masked here** and the app must drop them. |
