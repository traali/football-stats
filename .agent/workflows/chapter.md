# Workflow: Chapter (Session Opening Rite)
The opening rite for any agent session in `football-stats`.

## Steps
1. **Read `AGENTS.md`**: Verify non-negotiables, stack rules, and testing requirements.
2. **Read the tail of `ROLL.md`**: Review the last ~10 entries to understand recent decisions and dead ends.
3. **Read the Task**: Understand the user request or feature spec.
4. **Select Accountable Office & Model Tier**:
   - `cellarer_office`: API routing, SPL client caching, package configs (`pro`/`flash`)
   - `scriptorium_office`: Parsers, data normalizers, statistics aggregators (`pro`/`flash`)
   - `prior_office`: Match state, head-to-head calculations, standings engine (`pro`)
   - `works_office`: UI components, "Night Captain" design tokens, animations (`inherit`/`flash`)
   - `sacrist_office`: Unit test suites, mock fixtures (`flash`)
   - `legate_office`: Cross-repo contract conformance with Pelipäivä (`pro`/`inherit`)
   - `visitor_office`: Clean-room adversarial audit (`pro`/`inherit`)
5. **Plan Before Execution**: Formulate a concise plan. For major changes, write an implementation plan.
