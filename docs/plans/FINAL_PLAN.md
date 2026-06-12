# FINAL FIX PLAN — Football Stats
## Consolidated from 3 models, 16 review passes, 35 verified findings

**Author**: opencode/mimo-v2-5-free  
**Generated**: 2026-06-11T07:40:00Z  
**Git base**: current HEAD  
**Sources**: FIX_PLAN.md (mimo), PLAN.md (multi-model), reviews/FIX_PLAN.md (deepseek-v4-flash-free)  
**Total issues**: 35 verified (31 agree, 1 disagree, 3 partial)  
**Estimated effort**: 80 minutes  
**Build command**: `npm run build` (runs after every phase)

---

## Table of Contents

1. [Execution Rules](#execution-rules)
2. [Phase 1: HTML & Config](#phase-1-html--config-5-min)
3. [Phase 2: Extract cn()](#phase-2-extract-cn-10-min)
4. [Phase 3: Type Safety](#phase-3-type-safety-15-min)
5. [Phase 4: Error Handling](#phase-4-error-handling-20-min)
6. [Phase 5: Accessibility](#phase-5-accessibility-15-min)
7. [Phase 6: Cleanup](#phase-6-cleanup-10-min)
8. [Verification Checklist](#verification-checklist)
9. [Accepted Risks](#accepted-risks)
10. [File Reference](#file-reference)

---

## Execution Rules

1. Run `npm run build` after EVERY phase. If build fails, STOP.
2. Each phase is independent — can be done by different models.
3. Do NOT add comments unless fixing a "no comments" convention.
4. Use the Edit tool for changes, not sed (sed is dangerous for JSX).
5. One commit per phase with the specified message.

---

## Phase 1: HTML & Config (5 min)

**Risk**: LOW | **Impact**: HIGH | **Files**: `index.html`

### 1.1 Add `lang="fi"`

**File**: `index.html:2`

```
BEFORE: <html lang="en">
AFTER:  <html lang="fi">
```

**Why**: Screen readers use English pronunciation for Finnish text. Search engines won't index Finnish content.

---

### 1.2 Add `viewport-fit=cover`

**File**: `index.html:7`

```
BEFORE: <meta name="viewport" content="width=device-width, initial-scale=1.0" />
AFTER:  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

**Why**: Without this, `env(safe-area-inset-bottom)` always resolves to 0px on notched iPhones. Bottom nav is clipped.

---

### 1.3 Add Google Fonts

**File**: `index.html` — insert before `<title>` (line 8)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
```

**Why**: `--font-display` references Inter but no font is loaded. Falls back to system fonts. Breaks entire design system.

---

### 1.4 Fix body class conflict

**File**: `index.html:11`

```
BEFORE: <body class="bg-black text-white antialiased">
AFTER:  <body class="antialiased">
```

**Why**: `bg-black` (#000) conflicts with `--color-canvas` (#0a0a0a) in CSS. `text-white` is redundant.

---

### Phase 1 Commit

```
git add index.html
git commit -m "fix: lang=fi, viewport-fit=cover, Google Fonts, body class"
```

### Phase 1 Build Check

```bash
npm run build
```

---

## Phase 2: Extract cn() (10 min)

**Risk**: LOW | **Impact**: MEDIUM | **Files**: 6 (1 new, 5 modified)

### 2.1 Create `src/utils/cn.ts`

**File**: NEW `src/utils/cn.ts`

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
```

---

### 2.2 Update 5 component files

For each file:
1. Remove local `cn()` function (lines with `function cn(...)`)
2. Remove `import { clsx, type ClassValue } from 'clsx'`
3. Remove `import { twMerge } from 'tailwind-merge'`
4. Add `import { cn } from '../utils/cn'`

| File | Local cn() lines | Import lines to remove |
|------|-----------------|----------------------|
| `src/components/Button.tsx` | 6–8 | 3–4 |
| `src/components/PlayerCard.tsx` | 8–10 | 4–5 |
| `src/components/BottomNav.tsx` | 6–8 | 3–4 |
| `src/components/StatBadge.tsx` | 5–7 | 2–3 |
| `src/components/Skeleton.tsx` | 4–6 | 1–2 |

**Why**: 5 identical copies = maintenance hazard. DRY violation.

---

### Phase 2 Commit

```
git add src/utils/cn.ts src/components/
git commit -m "refactor: extract shared cn() utility"
```

### Phase 2 Build Check

```bash
npm run build
```

---

## Phase 3: Type Safety (15 min)

**Risk**: MEDIUM | **Impact**: CRITICAL | **Files**: 3

### 3.1 Fix `any` in dataProcessors.ts

**File**: `src/utils/dataProcessors.ts:19`

```
BEFORE: matches: any[]
AFTER:  matches: PlayerMatchEntry[]
```

Add import at top: `import { PlayerMatchEntry } from '../types/api';`

**Why**: All field accesses (`match.player_goals`, etc.) are unvalidated. Typos silently return `undefined` → `NaN`.

---

### 3.2 Fix `any` in PlayerAPIResponse

**File**: `src/types/api.ts:23`

```
BEFORE: matches: any[]
AFTER:  matches: PlayerMatchEntry[]
```

**Why**: Same as 3.1. Type already exists.

---

### 3.3 Verify fetchAPIData params (already fixed)

**File**: `src/services/api.ts:39`

Status: ✅ Already `Record<string, string | number | boolean | undefined>`. No change needed.

---

### 3.4 Verify as PlayerStats assertion (already clean)

**File**: `src/hooks/useMatchData.ts:60-71`

Status: ✅ Object constructed inline, no `as` assertion. No change needed.

---

### Phase 3 Commit

```
git add src/types/api.ts src/utils/dataProcessors.ts
git commit -m "fix: remove any types from data pipeline"
```

### Phase 3 Build Check

```bash
npm run build
```

---

## Phase 4: Error Handling (20 min)

**Risk**: MEDIUM | **Impact**: CRITICAL | **Files**: 2

### 4.1 Catch AbortError with clean message

**File**: `src/services/api.ts` — wrap the fetch + response handling

Current flow: `fetch()` → `response.ok` check → `response.json()` → return

New flow: wrap in try/catch that handles AbortError:

```typescript
try {
    // ... existing fetch + response handling ...
} catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error(`API-kutsu ${endpoint} aikakatistiin ${FETCH_TIMEOUT}ms jälkeen`);
    }
    throw err;
}
```

Also fix: `catch (e) { /* ignore */ }` → `catch { /* non-JSON error response */ }`

**Why**: Users see "The user aborted a request" instead of clean timeout message.

---

### 4.2 Add abort guard in catch block

**File**: `src/hooks/useMatchData.ts:75-77`

```
BEFORE: } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Virhe ladattaessa tietoja');
AFTER:  } catch (err: unknown) {
            if (controller.signal.aborted || !mountedRef.current) return;
            setError(err instanceof Error ? err.message : 'Virhe ladattaessa tietoja');
```

**Why**: Old promise chains can reject and overwrite cleared error state. Flash of skeleton + error banner.

---

### 4.3 Pass AbortController signal to fetch layer

**File 1**: `src/services/api.ts` — add optional signal parameter

```typescript
export async function fetchAPIData<T>(
    endpoint: string,
    params: Record<string, string | number | boolean | undefined> = {},
    signal?: AbortSignal  // ADD THIS
): Promise<T> {
```

In the fetch call:
```typescript
const response = await fetch(url, {
    headers: APP_CONFIG.API_HEADERS,
    signal: signal ?? controller.signal  // Use caller's signal if provided
});
```

**File 2**: `src/hooks/useMatchData.ts` — pass signal to API calls

The signal needs to reach `batchFetch` for player data fetching. Add signal parameter to `batchFetch`:

```typescript
export async function batchFetch<T>(
    items: string[],
    fetchFn: (id: string) => Promise<T>,
    concurrency = 5,
    signal?: AbortSignal  // ADD THIS
): Promise<(T | undefined)[]> {
    const results: (T | undefined)[] = []
    for (let i = 0; i < items.length; i += concurrency) {
        if (signal?.aborted) return results  // CHECK BEFORE EACH BATCH
        const batch = items.slice(i, i + concurrency)
        const settled = await Promise.allSettled(batch.map(id => fetchFn(id)))
        for (const r of settled) {
            results.push(r.status === 'fulfilled' ? r.value : undefined)
        }
    }
    return results
}
```

In useMatchData:
```typescript
const playerDataList = await batchFetch(playerIds, getPlayerData, 5, controller.signal);
```

**Why**: Old requests continue until timeout when user navigates rapidly.

---

### 4.4 Clean up abortRef on unmount

**File**: `src/hooks/useMatchData.ts:22`

```
BEFORE: return () => { mountedRef.current = false; };
AFTER:  return () => { mountedRef.current = false; abortRef.current?.abort(); };
```

**Why**: In-flight requests continue after component unmounts. Memory leak.

---

### 4.5 Fix empty matchId validation

**File**: `src/pages/MatchPage.tsx:21`

```
BEFORE: useEffect(() => {
            setSearchValue(matchId)
            if (matchId.trim()) {
                fetchData(matchId.trim())
            }
        }, [matchId, fetchData])

AFTER:  useEffect(() => {
            setSearchValue(matchId)
            if (matchId.trim()) {
                fetchData(matchId.trim())
            } else if (matchId !== '') {
                setError('Virheellinen ottelun ID')
            }
        }, [matchId, fetchData])
```

**Why**: `/match/` shows raw "API call failed. Status: 400" instead of user-friendly message.

---

### 4.6 Localize rate limit error

**File**: `src/services/api.ts:41`

```
BEFORE: throw new Error(`Rate limit exceeded for ${endpoint}. Please try again in a moment.`);
AFTER:  throw new Error('Palvelun käyttöraja täynnä. Yritä hetken päästä uudelleen.');
```

**Why**: Mixed Finnish/English confuses target audience.

---

### Phase 4 Commit

```
git add src/services/api.ts src/hooks/useMatchData.ts src/pages/MatchPage.tsx
git commit -m "fix: abort handling, error messages, race conditions"
```

### Phase 4 Build Check

```bash
npm run build
```

---

## Phase 5: Accessibility (15 min)

**Risk**: LOW | **Impact**: MEDIUM | **Files**: 6

### 5.1 Fix search input focus rings

**File 1**: `src/pages/Home.tsx:50`

```
BEFORE: className="flex-grow bg-transparent border-none focus:ring-0 text-text-primary px-4 py-3 placeholder:text-text-muted text-lg"
AFTER:  className="grow bg-transparent border-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none text-text-primary px-4 py-3 placeholder:text-text-muted text-lg"
```

**File 2**: `src/pages/MatchPage.tsx:60` — same change

Also remove parent `focus-within:ring-1 focus-within:ring-accent` from both files (line 41 in Home.tsx, line 51 in MatchPage.tsx) to prevent double ring.

**Why**: DESIGN.md requires focus ring on all interactive elements.

---

### 5.2 Add focus-visible to NotFound Link

**File**: `src/pages/NotFound.tsx:9`

Add to className: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50`

---

### 5.3 Add focus-visible to BottomNav NavLink

**File**: `src/components/BottomNav.tsx:22-26`

Add to NavLink className: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50`

---

### 5.4 Fix PlayerCard image onError

**File**: `src/components/PlayerCard.tsx`

Add `import { useState } from 'react'` at top.

Add state: `const [imgError, setImgError] = useState(false);`

Replace onError handler:
```
BEFORE: onError={(e) => (e.currentTarget.style.display = 'none')}
AFTER:  onError={() => setImgError(true)}
```

Update ternary:
```
BEFORE: {stats.img_url ? (
AFTER:  {!imgError && stats.img_url ? (
```

**Why**: Direct DOM manipulation bypasses React. Placeholder never appears.

---

### 5.5 Fix PlayerCard dots accessibility

**File**: `src/components/PlayerCard.tsx:76-87`

Remove `role="button"` and `tabIndex={0}` from the dot div. Add `aria-hidden="true"`.

**Why**: ARIA buttons with no keyboard handler confuse screen readers.

---

### 5.6 Fix font-weight on table headers

**File**: `src/components/StandingsTable.tsx` — find all `<th>` elements

```
BEFORE: font-medium
AFTER:  font-bold
```

**Why**: DESIGN.md §6.7 says weight 700.

---

### 5.7 Fix font-weight on team names

**Files**: `src/components/MatchHeader.tsx:49,60`, `src/pages/MatchPage.tsx:124,141`

```
BEFORE: font-black
AFTER:  font-bold
```

**Why**: DESIGN.md §4.2 says weight 700.

---

### Phase 5 Commit

```
git add src/pages/ src/components/
git commit -m "fix: focus rings, accessibility, font weights"
```

### Phase 5 Build Check

```bash
npm run build
```

---

## Phase 6: Cleanup (10 min)

**Risk**: LOW | **Impact**: LOW | **Files**: 3

### 6.1 Remove dead devDependencies

```bash
npm uninstall autoprefixer postcss
```

**Why**: Tailwind v4 handles vendor prefixing. No postcss.config.* exists.

---

### 6.2 Fix GitHub Actions CI

**File**: `.github/workflows/deploy.yml:28`

```
BEFORE: npm install
AFTER:  npm ci
```

**Why**: Deterministic installs in CI.

---

### 6.3 Fix hardcoded match ID

**File**: `src/components/BottomNav.tsx:12`

```
BEFORE: { to: '/match/3760372', label: 'Ottelu', icon: Search },
AFTER:  REMOVE THIS LINE (or change to { to: '/match/', label: 'Ottelu', icon: Search })
```

**Why**: Debug data left in production.

---

### 6.4 Fix unused catch variable

**File**: `src/services/api.ts:68`

```
BEFORE: } catch (e) { /* ignore */ }
AFTER:  } catch { /* non-JSON error response */ }
```

**Why**: Unused variable may trigger lint warnings.

---

### Phase 6 Commit

```
git add package.json package-lock.json .github/ src/components/BottomNav.tsx src/services/api.ts
git commit -m "chore: remove dead deps, fix CI, clean hardcoded values"
```

### Phase 6 Build Check

```bash
npm run build
```

---

## Verification Checklist

After all 6 phases:

- [ ] `npm run build` passes with zero errors
- [ ] `npm run dev` starts without errors
- [ ] Page background is #0a0a0a (not #000)
- [ ] Inter font loads (check Network tab for font files)
- [ ] Tab through all interactive elements — each shows focus ring
- [ ] Search input shows accent ring when tabbed to
- [ ] Bottom nav shows accent ring when tabbed to
- [ ] Navigate to `/match/` — shows "Virheellinen ottelun ID"
- [ ] Player with broken image shows User placeholder icon
- [ ] PlayerCard dots are NOT focusable via tab
- [ ] Table headers are bold (700 weight)
- [ ] Team names are bold (700 weight), not black (900)
- [ ] No `any` types in `src/types/api.ts` or `src/utils/dataProcessors.ts`
- [ ] `src/utils/cn.ts` exists and is imported by 5 components
- [ ] `autoprefixer` and `postcss` not in package.json
- [ ] BottomNav has no hardcoded match ID
- [ ] AbortError shows Finnish timeout message, not DOMException
- [ ] Rapid navigation cancels old requests (Network tab shows "canceled")

---

## Accepted Risks (NOT fixing)

These were reviewed and intentionally not fixed:

1. **Missing `--space-*` tokens** — All spacing works via Tailwind utilities. Adding tokens is cosmetic.

2. **Missing skip-to-content link** — Mobile-first app with bottom nav only. Low priority.

3. **`drop-shadow` on BottomNav** — Glow effect on icons is acceptable UX feedback.

4. **No test files** — Important but separate concern. Add Vitest in a dedicated PR.

5. **Framer Motion + prefers-reduced-motion** — Requires `<MotionConfig>` wrapper. Separate PR.

6. **Index signatures `[key: string]: unknown`** — Kept for API flexibility on most interfaces. Only removed from `PlayerAPIResponse`.

7. **`fetchAPIData` envelope vs inner type** — Low risk. Runtime `call.status` check catches malformed responses. The type lie is harmless.

---

## Commit Summary

```
fix: lang=fi, viewport-fit=cover, Google Fonts, body class
refactor: extract shared cn() utility
fix: remove any types from data pipeline
fix: abort handling, error messages, race conditions
fix: focus rings, accessibility, font weights
chore: remove dead deps, fix CI, clean hardcoded values
```

---

## File Reference

| File | Phase | Change |
|------|-------|--------|
| `index.html` | 1 | lang, viewport, fonts, body class |
| `src/utils/cn.ts` | 2 | NEW FILE |
| `src/components/Button.tsx` | 2 | Import cn from shared |
| `src/components/PlayerCard.tsx` | 2, 5 | Import cn, fix image, fix dots |
| `src/components/BottomNav.tsx` | 2, 5, 6 | Import cn, focus ring, nav items |
| `src/components/StatBadge.tsx` | 2 | Import cn from shared |
| `src/components/Skeleton.tsx` | 2 | Import cn from shared |
| `src/utils/dataProcessors.ts` | 3 | Fix any type |
| `src/types/api.ts` | 3 | Fix matches type |
| `src/services/api.ts` | 4, 5, 6 | AbortError, signal, catch, rate msg |
| `src/hooks/useMatchData.ts` | 4 | Abort guard, signal, unmount |
| `src/pages/MatchPage.tsx` | 4, 5 | matchId validation, focus ring, font |
| `src/pages/Home.tsx` | 5 | Focus ring |
| `src/pages/NotFound.tsx` | 5 | Focus ring |
| `src/components/StandingsTable.tsx` | 5 | Font weight |
| `src/components/MatchHeader.tsx` | 5 | Font weight |
| `package.json` | 6 | Remove deps |
| `.github/workflows/deploy.yml` | 6 | npm ci |

---

*Author: opencode/mimo-v2-5-free*  
*Consolidated from: FIX_PLAN.md (mimo), PLAN.md (multi-model), reviews/FIX_PLAN.md (deepseek-v4-flash-free)*  
*Verified against: 16 review passes, 35 findings, source code inspection*
