# ROLL.md — The Chronicle of Football Stats
Append-only record of architectural decisions, dispensations, rule amendments, and visitation verdicts.

---

## 2026-09-02 — Monastic Foundation & Shared Contract Alignment
- **Actor:** Archon & Legate
- **Action:** Established AGENTS.md, .agent/workflows, and monastery-visitor gate with SportStatsContract compatibility check.
- **Verdict:** PASS
- **Summary:** Aligned football-stats with canonical shared contracts v1.0.0 for seamless, non-breaking integration with Pelipäivä.

## 2026-09-02 — Interactive MCP App H2H Card Layer (Option 1)
- **Actor:** Master of Works & Cellarer
- **Action:** Created `src/mcp-app.ts` (`get_h2h_card` tool) and `public/mcp-h2h.html` widget implementing `@modelcontextprotocol/ext-apps`.
- **Verdict:** PASS
- **Summary:** Standalone H2H card widget exposes animated comparison bars and recent form indicators to AI hosts via `ui://football/h2h-card` while leaving existing web UI 100% intact.

---

## Format for New Entries:
```markdown
## YYYY-MM-DD — <Title of Change>
- **Office / Author:** <Office Name>
- **Base / Commit:** <sha>
- **Verdict:** PASS | PASS WITH FINDINGS | BLOCK
- **Summary:** <1-2 sentences on what was decided or changed>
```
