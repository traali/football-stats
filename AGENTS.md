# AGENTS.md — The Rule of Football Stats

The canonical, tool-agnostic rule for all AI agents and contributors working in `football-stats`.

---

## §0 Precedence
1. `AGENTS.md` (this file) is the supreme project rule.
2. Native tool configs (`CLAUDE.md`, `.cursorrules`, etc.) are thin pointers to this file and must contain no independent rules.
3. In conflicts between code comments and `AGENTS.md`, `AGENTS.md` wins.

---

## §1 Identity & Architecture
- **Identity:** Modern Finnish youth football statistics viewer and match intelligence dashboard.
- **Architecture:** Fast client-side SPA (React 19, Vite, Tailwind CSS v4) consuming Suomen Palloliitto (SPL) APIs with edge rate limiting, caching, and cross-repo contract conformance with `pelipaiva`.

---

## §2 Stack & Invariants

| Use | Never |
|---|---|
| Strict TypeScript (no `any` types) | Ad-hoc `any` casting, untyped dynamic JSON objects |
| React 19 + Tailwind CSS v4 + Framer Motion | Legacy CSS, un-animated jarring layout shifts |
| "Night Captain" OLED Dark Design System | Ad-hoc light themes, hardcoded hex colors |
| Suomen Palloliitto (SPL) typed API client | Scraping un-typed HTML without rate limits |
| Canonical `SportStatsContract` interface | Altering or removing contract fields without a major version bump |
| Zero-Secret Commitment | Hardcoded API keys or environment secrets in client bundle |

---

## §3 Testing & Quality Gates
- **Pre-visitation Gate:** Run `npm run visit` before any commit.
- **Contract Verification:** Local types and exports must satisfy `SportStatsContract`.
- **Definition of Done:**
  1. `npm run lint` reports 0 errors.
  2. `npm run test` passes with 100% green tests.
  3. `npm run build` compiles production bundle without warnings.
  4. Cross-repo contract compatibility check passes.

---

## §4 Security & Hardening
- **Zero Secrets:** Never commit credentials, tokens, or environment keys.
- **Defensive API Ingestion:** Validate and sanitize all external SPL responses before rendering.
- **Rate-Limiting & Timeouts:** All remote API calls must use `AbortController` (10s timeout) and concurrency batching.

---

## §5 Design & Usability ("Night Captain")
- **Palette:** Dark canvas (`#0a0b0e`), electric yellow accent (`#faff69`), layered surface ladder (`surface-1/2/3`).
- **Touch Targets:** All buttons and interactive tabs must have minimum 44px height (`min-h-[44px]`).
- **Cards & Visuals:** `rounded-xl`, `bg-surface-1`, subtle hairline borders, smooth spring animations.

---

## §6 Visitation (Separation of Duties)
- The author who wrote a change does NOT perform its final audit.
- An independent **Visitor subagent** receives only: `AGENTS.md`, the git diff, and test results (no conversation history).
- **Verdicts:** `PASS` · `PASS WITH FINDINGS` · `BLOCK`
- **Finding Classes:**
  - `blocking`: Security flaw, contract breach, build failure. Must fix before merge.
  - `advisory`: Rule violation without breakage. Fix or log in `DEBT.md`.
- **Fault Attribution:** `house` (fix code) vs `RULE` (amend `AGENTS.md` and log in `ROLL.md`).

---

## §7 Volatile Facts
Do NOT put volatile facts in `AGENTS.md`. Single sources of truth:
- Library versions: `package.json`
- Recent history: `CHANGELOG.md` and git log
- Architecture decisions: `ROLL.md` and `docs/`
