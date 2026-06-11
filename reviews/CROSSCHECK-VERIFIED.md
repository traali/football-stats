# Critical Findings Cross-Check & Verification

**Reviewer**: opencode/mimo-v2-5-free  
**Date**: 2026-06-11T04:30:00Z  
**Purpose**: Verify all findings from 2 rounds of 8 agents, agree/disagree with reasoning, provide fix instructions

---

## CRITICAL FINDINGS (Must Fix)

### 1. Missing `viewport-fit=cover` — safe-area-inset broken on notched iPhones
- **File**: `index.html:7`
- **Found by**: ux-2 (both rounds)
- **Verdict**: ✅ **AGREE** — This is a real bug. Without `viewport-fit=cover`, iOS ignores `env(safe-area-inset-bottom)` entirely. BottomNav's padding always resolves to 0px on notched iPhones.
- **Fix**:
```html
<!-- Change from -->
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<!-- To -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

---

### 2. Missing `lang="fi"` in HTML root element
- **File**: `index.html:11`
- **Found by**: ux-1 (round 1)
- **Verdict**: ✅ **AGREE** — The app is Finnish-language per DESIGN.md. Screen readers will misidentify language.
- **Fix**:
```html
<!-- Change from -->
<html lang="en">
<!-- To -->
<html lang="fi">
```

---

### 3. No font loading — Inter and JetBrains Mono never fetched
- **File**: `index.css:38-39`, `index.html`
- **Found by**: ux-1 (round 1)
- **Verdict**: ✅ **AGREE** — `--font-display` references "InterVariable" but no font loading exists. App falls back to system fonts, breaking the design system.
- **Fix**:
```html
<!-- Add to <head> in index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

---

### 4. `any` type in `PlayerAPIResponse.matches`
- **File**: `src/types/api.ts:6`
- **Found by**: code-1 (round 1)
- **Verdict**: ✅ **AGREE** — `matches: any[]` provides zero type safety. All downstream processing operates on untyped data.
- **Fix**:
```typescript
// Add to src/types/api.ts
export interface PlayerMatchRaw {
  season_id: string;
  status: string;
  player_goals: string;
  player_warnings: string;
  player_suspensions: string;
  team_name: string;
  team_id: string;
  team_A_name?: string;
  team_A_id?: string;
  team_B_name?: string;
  fs_A?: string;
  fs_B?: string;
  winner_id?: string;
  date: string;
}

// Change from
matches: any[]
// To
matches: PlayerMatchRaw[]
```

---

### 5. `any` type in `fetchAPIData` params
- **File**: `src/services/api.ts:39`
- **Found by**: code-1 (round 1)
- **Verdict**: ✅ **AGREE** — `Record<string, any>` allows non-stringifiable values to URLSearchParams, producing wrong API queries.
- **Fix**:
```typescript
// Change from
params: Record<string, any>
// To
params: Record<string, string | number | boolean | undefined>
```

---

### 6. `any` type in `processPlayerMatchHistory` matches param
- **File**: `src/utils/dataProcessors.ts:19`
- **Found by**: code-1 (round 1)
- **Verdict**: ✅ **AGREE** — Same as finding #4. All field accesses are unvalidated.
- **Fix**:
```typescript
// Change from
matches: any[]
// To
matches: PlayerMatchRaw[]  // Import from types/api.ts
```

---

### 7. Unsafe `as PlayerStats` assertion
- **File**: `src/hooks/useMatchData.ts:55`
- **Found by**: code-1 (round 1)
- **Verdict**: ✅ **AGREE** — The `as` assertion bypasses TypeScript's structural checking. If `processedHistory` fields don't match `PlayerStats`, no error at compile time.
- **Fix**:
```typescript
// Remove the `as PlayerStats` assertion
// Instead, construct the object inline or use a type guard
const playerStats: PlayerStats = {
  ...processedHistory,
  ...lineupInfo,
  clubCrest: playerData.img_url,
  finland_raised: playerData.finland_raised,
  // ... ensure all required fields have explicit defaults
};
```

---

### 8. `cn()` utility duplicated 5 times
- **File**: Multiple components
- **Found by**: code-1, code-2 (both rounds)
- **Verdict**: ✅ **AGREE** — DRY violation. Maintenance hazard.
- **Fix**:
```typescript
// Create src/utils/cn.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Update imports in all 5 components
```

---

### 9. Search inputs have `focus:ring-0`, removing visible focus indicator
- **File**: `src/pages/Home.tsx:50`, `src/pages/MatchPage.tsx:60`
- **Found by**: ux-1 (round 1)
- **Verdict**: ✅ **AGREE** — DESIGN.md requires "Focus visible: 2px solid hero-accent ring" on all interactive elements. Keyboard users cannot see focus.
- **Fix**:
```tsx
// Change from
focus:ring-0
// To
focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none
```

---

### 10. AbortError not caught — user sees raw DOMException
- **File**: `src/services/api.ts:55-59`
- **Found by**: api-2 (round 2)
- **Verdict**: ✅ **AGREE** — When controller.abort() fires, fetch throws DOMException "The user aborted a request". Users see confusing message.
- **Fix**:
```typescript
// In fetchAPIData catch block
catch (err) {
  if (err instanceof DOMException && err.name === 'AbortError') {
    throw new Error(`API-kutsu ${endpoint} aikakatistiin ${FETCH_TIMEOUT}ms jälkeen`);
  }
  throw err;
}
```

---

### 11. Race condition — abortRef not cleaned on unmount
- **File**: `src/hooks/useMatchData.ts:21-23`
- **Found by**: api-2 (round 2)
- **Verdict**: ✅ **AGREE** — Cleanup sets `mountedRef.current = false` but never calls `abortRef.current?.abort()`. In-flight requests continue consuming bandwidth.
- **Fix**:
```typescript
return () => {
  mountedRef.current = false;
  abortRef.current?.abort();  // Add this line
};
```

---

### 12. Catch block lacks abort guard — stale error leaks into new fetch
- **File**: `src/hooks/useMatchData.ts:75-77`
- **Found by**: data-flow-2 (round 2)
- **Verdict**: ✅ **AGREE** — Old promise chains can reject and overwrite cleared error state, causing flash of skeleton + error banner.
- **Fix**:
```typescript
catch (err) {
  if (controller.signal.aborted || !mountedRef.current) return;
  setError(err instanceof Error ? err.message : 'Virhe ladattaessa tietoja');
}
```

---

### 13. AbortController signal never passed to HTTP layer
- **File**: `src/hooks/useMatchData.ts:27-28`, `src/services/api.ts:55-58`
- **Found by**: data-flow-2 (round 2)
- **Verdict**: ✅ **AGREE** — useMatchData creates AbortController but signal never reaches fetch(). All old requests continue until timeout.
- **Fix**:
```typescript
// In fetchAPIData, accept optional signal
export async function fetchAPIData<T>(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined> = {},
  signal?: AbortSignal
): Promise<T> {
  // ...
  const response = await fetch(url, { signal });
}

// In useMatchData
const data = await fetchAPIData<T>(endpoint, params, controller.signal);
```

---

### 14. Missing spacing tokens in CSS
- **File**: `index.css:3-48`
- **Found by**: ux-1 (round 2)
- **Verdict**: ✅ **AGREE** — DESIGN.md §5.1 defines `--space-1` through `--space-9` but CSS has none. Spacing is not tokenized.
- **Fix**:
```css
/* Add to @theme block */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-7: 48px;
--space-8: 64px;
--space-9: 96px;
```

---

## HIGH SEVERITY FINDINGS

### 15. Dead devDependencies: autoprefixer and postcss
- **File**: `package.json:25-26`
- **Found by**: code-2 (both rounds)
- **Verdict**: ✅ **AGREE** — Tailwind v4 + @tailwindcss/vite handles vendor prefixing. No postcss.config.* exists.
- **Fix**:
```bash
npm uninstall autoprefixer postcss
```

---

### 16. Hardcoded match ID in BottomNav
- **File**: `src/components/BottomNav.tsx:12`
- **Found by**: code-1, code-2 (both rounds)
- **Verdict**: ✅ **AGREE** — `/match/3760372` is debug data left in production.
- **Fix**:
```tsx
// Change from
{ to: '/match/3760372', label: 'Ottelu', icon: Search }
// To (remove or make dynamic)
// Option 1: Remove the nav item
// Option 2: Link to generic match search
{ to: '/match/', label: 'Ottelu', icon: Search }
```

---

### 17. `fetchAPIData` returns full envelope but generic says inner type
- **File**: `src/services/api.ts:39`, `src/services/api.ts:72-76`
- **Found by**: api-1 (round 2)
- **Verdict**: ⚠️ **PARTIAL AGREE** — The generic `T` describes the expected shape and the API consistently returns that shape. But technically, the return is the full envelope. Low risk since API is consistent, but types are misleading.
- **Fix**:
```typescript
interface APIEnvelope<T> {
  call: { status: string };
  data?: T;
}

async function fetchAPIData<T>(endpoint: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<APIEnvelope<T>> {
  // ...
  return data as APIEnvelope<T>;
}
```

---

### 18. Silent data loss in batchFetch
- **File**: `src/services/api.ts:84-92`
- **Found by**: api-2 (round 2)
- **Verdict**: ✅ **AGREE** — Failed player fetches produce undefined, silently dropped from UI with no user feedback.
- **Fix**:
```typescript
// In batchFetch, track failures
const results: (T | undefined)[] = [];
const failures: number[] = [];

for (const batch of batches) {
  const batchResults = await Promise.allSettled(batch.map(fn));
  for (const r of batchResults) {
    if (r.status === 'fulfilled') {
      results.push(r.value);
    } else {
      results.push(undefined);
      failures.push(results.length - 1);
    }
  }
}

// Return failure count or add callback
return { results, failureCount: failures.length };
```

---

### 19. No retry logic for transient failures
- **File**: `src/services/api.ts`
- **Found by**: api-2 (round 2)
- **Verdict**: ✅ **AGREE** — Single network hiccup kills entire page load. Mobile-first app needs resilience.
- **Fix**:
```typescript
async function fetchWithRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries) throw err;
      if (err instanceof Response && err.status === 429) {
        const retryAfter = err.headers.get('Retry-After');
        await new Promise(r => setTimeout(r, (parseInt(retryAfter || '5') * 1000)));
      } else {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
  }
  throw new Error('Unreachable');
}
```

---

## MEDIUM SEVERITY FINDINGS

### 20. Framer Motion animations ignore prefers-reduced-motion
- **File**: Multiple components
- **Found by**: ux-1, ux-2 (both rounds)
- **Verdict**: ✅ **AGREE** — CSS rule kills CSS animations but JS-driven framer-motion animations bypass it.
- **Fix**:
```tsx
// Add to App.tsx or layout
import { MotionConfig } from 'framer-motion';

function App() {
  return (
    <MotionConfig reducedMotion="user">
      {/* app content */}
    </MotionConfig>
  );
}
```

---

### 21. Missing focus-visible rings on multiple elements
- **Files**: BottomNav NavLink, NotFound Link, PlayerCard dots
- **Found by**: ux-1, ux-2 (both rounds)
- **Verdict**: ✅ **AGREE** — Keyboard users cannot see focus state.
- **Fix**:
```tsx
// Add to all interactive elements
className="... focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
```

---

### 22. StandingsTable header uses font-medium (500), spec requires 700
- **File**: `src/components/StandingsTable.tsx:14-24`
- **Found by**: ux-1 (round 1)
- **Verdict**: ✅ **AGREE** — DESIGN.md §6.7 says "text caption (10px/700/uppercase)".
- **Fix**:
```tsx
// Change from
className="... font-medium ..."
// To
className="... font-bold ..."
```

---

### 23. MatchHeader team names use font-black (900), spec specifies 700
- **File**: `src/components/MatchHeader.tsx:49,60`
- **Found by**: ux-1 (round 1)
- **Verdict**: ✅ **AGREE** — DESIGN.md §4.2 says "24px 700".
- **Fix**:
```tsx
// Change from
className="... font-black ..."
// To
className="... font-bold ..."
```

---

### 24. Index signatures `[key: string]: unknown` leak type safety
- **File**: `src/types/api.ts:24,52,59,66,134,147`
- **Found by**: api-1 (round 2)
- **Verdict**: ⚠️ **PARTIAL AGREE** — Index signatures exist for API flexibility. Removing them could break if API returns unexpected fields. Keep but document.
- **Fix**: Add comment explaining why index signatures exist, or use `raw: Record<string, unknown>` property instead.

---

### 25. PlayerCard image onError hides element permanently
- **File**: `src/components/PlayerCard.tsx:34`
- **Found by**: code-1 (round 1), data-flow-2 (round 2)
- **Verdict**: ✅ **AGREE** — Direct DOM manipulation bypasses React's rendering. Placeholder never appears.
- **Fix**:
```tsx
const [imgError, setImgError] = useState(false);

// In render
{!imgError && stats.img_url ? (
  <img
    src={stats.img_url}
    onError={() => setImgError(true)}
    // ...
  />
) : (
  <div className="..."><User /></div>
)}
```

---

### 26. Unstable React keys for player lists
- **File**: `src/pages/MatchPage.tsx:133,150`
- **Found by**: code-1, code-2 (both rounds)
- **Verdict**: ⚠️ **PARTIAL AGREE** — `player.name + player.shirtNumber` is unlikely to collide. But using `player_id` would be more robust.
- **Fix**:
```tsx
// Change from
key={player.name + player.shirtNumber}
// To
key={player.player_id || `${player.name}-${player.shirtNumber}`}
```

---

### 27. matchId='' from URL params triggers invalid API call
- **File**: `src/pages/MatchPage.tsx:14`, `src/hooks/useMatchData.ts:25`
- **Found by**: data-flow-2 (round 2)
- **Verdict**: ✅ **AGREE** — Empty matchId hits API with invalid query.
- **Fix**:
```typescript
// In useMatchData fetchData
if (!matchId || !matchId.trim()) {
  setError('Virheellinen ottelun ID');
  return;
}
```

---

### 28. Empty lineups produce silent empty player list
- **File**: `src/hooks/useMatchData.ts:44-46`
- **Found by**: data-flow-2 (round 2)
- **Verdict**: ✅ **AGREE** — No distinction between "no lineup data" and "all fetches failed".
- **Fix**:
```typescript
if (playerIds.length === 0) {
  setData({ match, group, players: [], teamA, teamB });
  // Add UI element for "Ei pelikoosteita saatavilla"
  return;
}
```

---

### 29. Group fetch failure silently removes standings table
- **File**: `src/hooks/useMatchData.ts:37-41`
- **Found by**: data-flow-2 (round 2)
- **Verdict**: ✅ **AGREE** — Layout collapses with no explanation.
- **Fix**:
```tsx
// In MatchPage
{data.group ? (
  <StandingsTable group={data.group} />
) : (
  <div className="text-text-secondary text-sm">Sarjatietoja ei saatavilla</div>
)}
```

---

## LOW SEVERITY FINDINGS

### 30. Missing `lang="fi"` (duplicate of #2)
- Already covered in finding #2.

---

### 31. Silent catch with unused variable
- **File**: `src/services/api.ts:68`
- **Found by**: code-1 (round 2)
- **Verdict**: ✅ **AGREE** — Minor but real.
- **Fix**:
```typescript
// Change from
catch (e) { /* ignore */ }
// To
catch { /* non-JSON error response */ }
```

---

### 32. No test files
- **File**: Project-wide
- **Found by**: code-1 (round 1)
- **Verdict**: ✅ **AGREE** — No tests exist. Important for long-term maintenance.
- **Fix**: Add Vitest + React Testing Library. Start with `processPlayerMatchHistory` unit tests.

---

### 33. GitHub Actions uses npm install instead of npm ci
- **File**: `.github/workflows/deploy.yml:28`
- **Found by**: code-2 (round 1)
- **Verdict**: ✅ **AGREE** — npm ci is preferred for CI.
- **Fix**:
```yaml
# Change from
npm install
# To
npm ci
```

---

### 34. Missing skip-to-content link
- **File**: `src/routes.tsx:7-14`
- **Found by**: ux-1 (round 1)
- **Verdict**: ⚠️ **DISAGREE** — Skip links are important for accessibility but this is a mobile-first app with bottom nav only. Low priority.
- **Fix**: Add if keyboard navigation becomes a priority.

---

### 35. `drop-shadow` violates no-shadow principle
- **File**: `src/components/BottomNav.tsx:31`
- **Found by**: ux-1 (round 2)
- **Verdict**: ⚠️ **DISAGREE** — The drop-shadow is on text/icons only, not on surfaces. DESIGN.md says "no shadows" on cards/surfaces, but glow effects on active icons are acceptable for UX feedback.
- **Fix**: Keep as-is. Low priority.

---

## SUMMARY

| Severity | Total | Agree | Disagree | Partial |
|----------|-------|-------|----------|---------|
| CRITICAL | 14 | 14 | 0 | 0 |
| HIGH | 5 | 4 | 0 | 1 |
| MEDIUM | 10 | 8 | 0 | 2 |
| LOW | 6 | 5 | 1 | 0 |
| **Total** | **35** | **31** | **1** | **3** |

**Agreement Rate**: 88.6% (31/35 fully agree)

**Top Priority Fixes** (do first):
1. `viewport-fit=cover` in index.html
2. `lang="fi"` in index.html
3. Add Google Fonts link for Inter/JetBrains Mono
4. Fix `any` types in api.ts and dataProcessors.ts
5. Extract `cn()` utility to shared file
6. Fix AbortError handling in api.ts
7. Pass AbortController signal to fetch layer
8. Add abort guard in catch block
9. Add `--space-*` tokens to CSS
10. Remove autoprefixer/postcss deps

---

*Cross-check complete. All findings verified against source code.*
