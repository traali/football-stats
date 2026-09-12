# Football Stats — 5-point test spec

1. **User Journey:** A parent opens football-stats, searches a P13 team, opens a played match, and reads form + H2H.
2. **Reason it exists:** Junior football families need Palloliitto data without TASO 403 cache blanks.
3. **What it tests:** `SportStatsContract`, TASO `getTeam`/`getMatch` via taso-proxy then origin+`_cb`, embed `?embed=true`.
4. **When it succeeds:** Search returns the team; match page shows both sides; `recentForm` letters are W/D/L; live origin or `_cb` returns JSON `{`.
5. **When it should fail:** Empty 403 from `spl.torneopal.net` without retry; dropped `deepLinkUrl`; AGENTS.md over 1500 words.
