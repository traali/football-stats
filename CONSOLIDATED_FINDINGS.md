# Football Stats Application — Consolidated Findings

> Generated: 2026-06-10
> Sources: CODE_REVIEW_FINDINGS.md (121 findings) + API_ANALYSIS_FINDINGS.md (40 findings)

---

## CRITICAL ISSUES BLOCKING THE APP

### 1. ACCEPT HEADER (API KEY) IS STALE
- **`src/types/config.ts:21`** — Code has `Accept: "json/df8e84j9xtdz269euy3h"` but browser sends `Accept: json/4h7dznqdxwtp3hsfdyf5r793uahfxy7x`
- The Accept header value acts as an API authentication token. The hardcoded value in the code is expired/wrong.
- **Fix**: Replace with the correct token: `"json/4h7dznqdxwtp3hsfdyf5r793uahfxy7x"` — or better, move to env var.

### 2. WRONG CURRENT YEAR (2025 vs 2026)
- **`src/types/config.ts:18`** — `CURRENT_YEAR: "2025"` but real API uses season `"2026"`. All player stats show 0 games/goals because nothing matches.

### 3. RATE LIMITER CRASHES ON MOST ENDPOINTS
- **`src/services/api.ts:32`** — `checkRateLimit` crashes for any endpoint NOT in `MAX_CALLS_PER_ENDPOINT` (getCompetitions, getCategories, getMatches, getScore, getSeasons). Uninitialized array causes `TypeError` on `.push()`.

### 4. 1000ms THROTTLE DELAY KILLS PERFORMANCE
- **`src/types/config.ts:34`** — Each API call waits 1s. Loading a match with 22 players = **26+ seconds** of mandatory waiting.

### 5. N+1 PLAYER FETCHES (22+ sequential API calls)
- **`src/hooks/useMatchData.ts:28-51`** — Every player in lineup triggers a separate `getPlayerData` call. No batching, no caching.

### 6. API RESPONSE PARSING CAN CRASH
- **`src/services/api.ts:62`** — `data.call.status.toLowerCase()` throws if `call` or `status` is missing. No optional chaining.

---

## OTHER CRITICAL ISSUES

### 7. `getTeamData` returns wrong shape
- **`src/services/api.ts:84-88`** — Returns full response `data` instead of `data.team`. Inconsistent with other getters.

### 8. `lineupInfo.position_fi` doesn't exist
- **`src/hooks/useMatchData.ts:46`** — API lineup has `position` field, not `position_fi`. All positions show "Pelaaja".

### 9. `team_name` not in lineup entries
- **`src/types/api.ts:49`** — `PlayerLineupInfo` declares `team_name` but the real API lineup entries don't have it.

### 10. `height`, `weight`, `finland_raised`, `clubCrest` declared but never populated
- **`src/types/api.ts:136,151-153`** — Dead fields in the interface, always `undefined`.

### 11. Hardcoded "Kausi 2024" in PlayerCard
- **`src/components/PlayerCard.tsx:60`** — Label hardcoded as `"Kausi 2024"`, should use `APP_CONFIG.PREVIOUS_YEAR`.

### 12. No request timeout or abort support
- **`src/services/api.ts:48`** — `fetch()` hangs indefinitely on network issues. No `AbortController` for cleanup.

### 13. No tests anywhere
- Zero test files, zero test dependencies. Data processing logic with known edge cases is untested.

---

## SUMMARY TABLE

| Severity | Count |
|----------|-------|
| CRITICAL | 13 |
| HIGH | 28 |
| MEDIUM | 52 |
| LOW | 48 |
| **Total** | **141** (unique combined) |

## API CALL ANALYSIS: ROOT CAUSE

The app's API key (Accept header) is **expired/stale**:
- **Browser sends**: `accept: json/4h7dznqdxwtp3hsfdyf5r793uahfxy7x`
- **Code sends**: `Accept: json/df8e84j9xtdz269euy3h`

This explains why the API works in your browser (it has the correct key from visiting tulospalvelu.palloliitto.fi) but fails from the app.

### Score: 4/10 — Not production-ready
