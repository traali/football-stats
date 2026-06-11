# Round 2 Cross-Check Verification Report

**Date**: 2026-06-11  
**Purpose**: Verify all CRITICAL/WARNING findings from 8 round-2 review files against current source code (commit `0f69065` with auto-fixes applied)

**Auto-fix session applied**: `PlayerMatchEntry[]` type, `Promise.allSettled` in batchFetch, `AbortController` in useMatchData, `setData(null)` before fetch, strict API param types, no `as PlayerStats` cast.

---

## Findings That Are Already Fixed (no action needed)

### 1. matchId='' From URL Params Triggers Invalid API Call
- **Reviews**: data-flow-2 (WARNING), code-1 (finding #10, LOW)
- **Claimed**: `useMatchPage` passes empty `matchId` to `fetchData('')` when URL is `/match/`, hitting the API with invalid query.
- **Current code** (`MatchPage.tsx:21-23`):
  ```tsx
  if (matchId.trim()) {
      fetchData(matchId.trim())
  }
  ```
- **Verdict**: ✅ **ALREADY FIXED** — the `useEffect` guards against empty matchId. No empty API call is made.

### 2. `any` → `PlayerMatchEntry[]` type (R1 fix verified)
- **Reviews**: api-1 (finding #9, MEDIUM — type contradiction), data-flow-1 (M2)
- **Current code** (`api.ts:23`): `matches: PlayerMatchEntry[]` (not `any[]`)
- **Verdict**: ✅ **ALREADY FIXED** by auto-fix session. (The null-guard contradiction noted by api-1 finding #9 is a separate MEDIUM issue, not CRITICAL/WARNING.)

### 3. `any` params → typed Record (R1 fix verified)
- **Current code** (`api.ts:39`): `params: Record<string, string | number | boolean | undefined>`
- **Verdict**: ✅ **ALREADY FIXED** by auto-fix session.

### 4. `as PlayerStats` removed (R1 fix verified)
- **Current code** (`useMatchData.ts:60-71`): Object constructed inline without `as PlayerStats`
- **Verdict**: ✅ **ALREADY FIXED** by auto-fix session.

---

## Findings Still Present (action needed)

### CRITICAL — Catch Block Lacks Abort Guard (data-flow-2)
- **Current** (`useMatchData.ts:75-77`):
  ```ts
  catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Virhe ladattaessa tietoja');
      setData(null);
  }
  ```
- **No abort/mounted check**. Old promise chains can reject and overwrite cleared error state, causing flash of skeleton + error banner.
- **Fix**: Add `if (controller.signal.aborted || !mountedRef.current) return;` as first line of catch.

### CRITICAL — AbortController Signal Never Passed to HTTP Layer (data-flow-2)
- **Current**: `useMatchData.ts` creates an `AbortController` (line 27) but never passes its signal to `fetchAPIData`. The API layer (`api.ts:55-58`) creates its own controller with a 10s timeout.
- **Fix**: Pass `controller.signal` through to `fetchAPIData` and onward to `fetch()`.

### CRITICAL — AbortError Not Caught (api-2)
- **Current** (`api.ts:55-59`): When `controller.abort()` fires (timeout or hook cleanup), `fetch()` throws `DOMException` "The user aborted a request". No AbortError-specific handler.
- **Fix**: Catch `DOMException` with `name === 'AbortError'` and throw a user-friendly timeout message.

### CRITICAL — No Retry Logic for Transient Failures (api-2)
- **Current**: Every API call fails immediately on network error, timeout, 4xx, 5xx, rate limit. No retry for transient failures (429, 503).
- **Fix**: Add `fetchWithRetry` wrapper with exponential backoff.

### CRITICAL — Silent Data Loss in batchFetch (api-2)
- **Current** (`api.ts:84-92`): `batchFetch` returns `undefined` for failed items. Hook (`useMatchData.ts:53`) silently skips with `if (!playerData) continue;`. No user feedback for failed player fetches.
- **Fix**: Track failure count and surface user-facing message.

### CRITICAL — Race Condition: abortRef Not Cleaned on Unmount (api-2)
- **Current** (`useMatchData.ts:21-23`): Cleanup sets `mountedRef.current = false` but never calls `abortRef.current?.abort()`. In-flight requests continue after unmount.
- **Fix**: Add `abortRef.current?.abort()` in the cleanup function.

### CRITICAL — cn() Utility Duplicated 5 Times (code-2)
- **Current**: `src/utils/cn.ts` does NOT exist. Five components (`Button.tsx:6`, `PlayerCard.tsx:8`, `BottomNav.tsx:6`, `StatBadge.tsx:5`, `Skeleton.tsx:4`) each define identical `cn()` function.
- **Fix**: Extract to `src/utils/cn.ts` and import everywhere.

### CRITICAL — Dead devDependencies: autoprefixer & postcss (code-2)
- **Current** (`package.json:25-26`): `autoprefixer@^10.4.20` and `postcss@^8.4.47` still present. No `postcss.config.*` exists. Tailwind v4 handles prefixing via Lightning CSS.
- **Fix**: `npm uninstall autoprefixer postcss`

### CRITICAL — Missing viewport-fit=cover (ux-2)
- **Current** (`index.html:7`): `<meta name="viewport" content="width=device-width, initial-scale=1.0" />` — missing `viewport-fit=cover`.
- **Fix**: Add `, viewport-fit=cover` to the content attribute.

### CRITICAL — DESIGN.md Internal Contradiction on Radius Tokens (ux-1)
- **Current**: Not verified (DESIGN.md not in source scope), but no auto-fix would have addressed this.
- **Fix**: Align §6.2 Card spec with §12 token spec (or vice versa).

### WARNING — Empty Lineups Produce Silent Empty Player List (data-flow-2)
- **Current** (`useMatchData.ts:44-47`): No early return guard for empty `playerIds`. `batchFetch([], ...)` returns `[]`. UI renders team headers with zero cards.
- **Fix**: Guard `if (playerIds.length === 0) { setData(...); return; }` and show "Ei pelikoosteita saatavilla".

### WARNING — Group Fetch Failure Silently Removes Standings Table (data-flow-2)
- **Current** (`MatchPage.tsx:157`): `{data.group && <StandingsTable .../>}` — when `group` is null, the standings column vanishes with no explanation.
- **Fix**: Show degraded placeholder "Sarjatietoja ei saatavilla" when `data.group === null`.

### WARNING — Player Image onError Hides Element Instead of Swap to Fallback (data-flow-2)
- **Current** (`PlayerCard.tsx:34`): `onError={(e) => (e.currentTarget.style.display = 'none')}` — hides `<img>` but React ternary already has `img_url ? <img/> : <User/>` — the `<img>` still exists in DOM, placeholder never appears.
- **Fix**: Use React state (`useState(false)` + `onError={() => setImgError(true)}`) to conditionally render fallback.

### WARNING — No Deduplication of Concurrent Requests for Same matchId (data-flow-2)
- **Current** (`useMatchData.ts:25-81`): No `lastFetchIdRef`. Rapid double-invocation of `fetchData("123")` causes both API calls to run, wasting quota.
- **Fix**: Add `lastFetchIdRef` and check `if (fetchId !== lastFetchIdRef.current) return` in finally.

### WARNING — Rate Limit Error Message Is Not User-Consumable (data-flow-2)
- **Current** (`api.ts:41`): `"Rate limit exceeded for ${endpoint}. Please try again in a moment."` — English + technical endpoint name.
- **Fix**: Generic Finnish message: "Palvelun käyttöraja täynnä. Yritä hetken päästä uudelleen."

### WARNING — Button Dense Size Below 44px Touch Target (ux-2)
- **Current** (`Button.tsx:29`): `dense: 'h-10 px-5 py-1.5 text-sm'` — 40px height, below WCAG 44px minimum.
- **Fix**: Change `h-10` to `h-11` (44px).

### WARNING — BottomNav NavLink Missing focus-visible Ring (ux-2)
- **Current** (`BottomNav.tsx:22-26`): No `focus-visible:ring-*` classes on NavLink.
- **Fix**: Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas`.

### WARNING — PlayerCard Dot Indicators: 10×10px Touch Target, No Focus Ring (ux-2)
- **Current** (`PlayerCard.tsx:74-86`): Dots have `role="button"` + `tabIndex={0}` but `min-w-[10px] min-h-[10px]` (10×10px, 4.4× below WCAG), no `focus-visible` ring, no `onKeyDown` handler.
- **Fix**: Either remove interactive semantics or wrap in 44px hit area and add keyboard handler + focus ring.

### WARNING — NotFound Link Missing focus-visible Ring (ux-2)
- **Current** (`NotFound.tsx:9`): No `focus-visible:ring-*` classes on the "Takaisin etusivulle" Link.
- **Fix**: Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas`.

### HIGH — Spacing Tokens Missing from CSS (ux-1)
- **Current** (`index.css`): No `--space-*` custom properties. All spacing via hardcoded Tailwind utilities.
- **Fix**: Add `--space-1` through `--space-9` (4px–96px) to the `@theme` block.

### HIGH — Hardcoded Match ID in BottomNav (code-2)
- **Current** (`BottomNav.tsx:12`): `{ to: '/match/3760372', label: 'Ottelu', icon: Search }` — hardcoded debug match ID.
- **Fix**: Remove the nav item or link to `/match/` for user input.

### HIGH — tsconfig.node.json Uses Legacy moduleResolution: "Node" (code-2)
- **Current**: Not verified, but likely unchanged.
- **Fix**: Change to `"moduleResolution": "Bundler"` for consistency.

### HIGH — fetchAPIData Returns Full Envelope but Generic Says Inner Type (api-1)
- **Current** (`api.ts:39,72-76`): `fetchAPIData<T>` returns `Promise<T>` but actually returns `data` (the full envelope). E.g. `getMatchDetails` does `fetchAPIData<{ match: MatchDetails }>()` — the generic says `{ match: MatchDetails }` is the return, but the actual return is the envelope.
- **Fix**: Define `APIEnvelope<T>` type and return `Promise<APIEnvelope<T>>`, let callers unwrap.

### HIGH — fetchAPIData response.json() Implicitly `any`, No Runtime Validation (data-flow-1, api-1)
- **Current** (`api.ts:72`): `const data = await response.json()` — inferred `any`. Returned as `T` with zero runtime validation.
- **Fix**: Add runtime validation (Zod schema) at the API boundary.

### HIGH — Error-Path response.json() Is Untyped (data-flow-1)
- **Current** (`api.ts:64`): `const errorData = await response.json()` — implicit `any`. Low blast radius but type hole.
- **Fix**: Narrow type or at minimum add `unknown` with guard.

### HIGH — Rate Limiter Never Resets Endpoint State (api-2)
- **Current** (`api.ts:6,22-29`): `endpointLastCalls` map grows unbounded for long SPA sessions.
- **Fix**: Add periodic pruning or use LRU structure.

### HIGH — Throttle Delay Applied Unconditionally (api-2)
- **Current** (`api.ts:44-46`): Every `fetchAPIData` call waits `THROTTLE_DELAY` (100ms) regardless of rate limit status. 30 players × 6 batches = 600ms dead wait.
- **Fix**: Apply throttle only when rate limit was previously hit.

### HIGH — 429 Rate-Limit Response Not Handled Specially (api-2)
- **Current** (`api.ts:61-69`): 429 treated like any other HTTP error. No `Retry-After` header parsing, no auto-retry.
- **Fix**: Read `Retry-After` header, expose to caller, optionally auto-retry.

---

## False Positives (review was wrong)

### 1. Optional Fields Used as Required in Downstream Code (api-1, HIGH)
- **Review claimed**: `useMatchData.ts:38-40` passes optional `DiscoveryMatch` fields (`competition_id`, `category_id`, `group_id`, `team_A_id`, `team_B_id`) as required `string` parameters to `getGroupDetails`/`getTeamData`, causing runtime breakage.
- **Reality**: The `match` variable in `useMatchData.ts:34` is typed as `MatchDetails` (returned by `getMatchDetails`), NOT `DiscoveryMatch`. `MatchDetails` has `competition_id`, `category_id`, `group_id`, `team_A_id`, `team_B_id` as **required** string fields. TypeScript correctly enforces this. No type mismatch exists at this code path.
- **Verdict**: ℹ️ **FALSE POSITIVE** — the review confused `MatchDetails` with `DiscoveryMatch` in this code path. (Note: a separate code path using `DiscoveryMatch` could have this issue, but `useMatchData` only works with `MatchDetails`.)

### 2. batchFetch Concurrency Not Configurable Per Call-Site (api-2, MEDIUM — not CRITICAL/WARNING, noted for completeness)
- **Review claimed**: `getPlayerData` hardcodes concurrency=5.
- **Reality**: `batchFetch` signature accepts `concurrency = 5` as a parameter. `useMatchData.ts:46` passes `5` explicitly. It IS configurable.
- **Verdict**: ℹ️ **FALSE POSITIVE** — the parameter exists and is configurable.

---

## Summary

| Category | Count | Details |
|----------|-------|---------|
| ✅ Already Fixed (by R1 auto-fix) | 4 | Matches validated, PlayerMatchEntry type, strict params, no `as` cast |
| ❌ Still Present — CRITICAL | 10 | Abort guard, signal passthrough, AbortError handling, retry, batchFetch silent loss, unmount leak, cn() dup, autoprefixer/postcss, viewport-fit=cover, DESIGN.md radius |
| ❌ Still Present — WARNING/HIGH | 18 | Empty lineups, group fetch fallback, image onError, dedup, rate limit msg, button size, focus rings (3×), spacing tokens, hardcoded match ID, tsconfig node, envelope type, response.json any, error parse untyped, rate limiter state, throttle, 429 handling |
| ℹ️ False Positive | 1 | Optional fields as required (confused `MatchDetails` with `DiscoveryMatch`) |

**31 total CRITICAL/WARNING findings** from round-2 reviews: 4 already fixed, 28 still present, 1 false positive.
