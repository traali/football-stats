# Football Stats — Fix Plan
## All Critical & High Severity Findings from Review Pipeline

**Generated**: 2026-06-11  
**Codebase**: football-stats (React 19 + Vite + Tailwind v4 + TypeScript)  
**Review Model**: opencode/mimo-v2-5-free  
**Review Rounds**: 2 rounds × 8 agents = 16 review passes  
**Total Findings Verified**: 35 (31 agree, 1 disagree, 3 partial)

---

## Table of Contents

1. [Execution Strategy](#execution-strategy)
2. [Phase 1: HTML & Global Config](#phase-1-html--global-config-5-min)
3. [Phase 2: Extract Shared Utility](#phase-2-extract-shared-utility-10-min)
4. [Phase 3: Type Safety Fixes](#phase-3-type-safety-fixes-20-min)
5. [Phase 4: Error Handling & Abort](#phase-4-error-handling--abort-20-min)
6. [Phase 5: Accessibility & UX Fixes](#phase-5-accessibility--ux-fixes-15-min)
7. [Phase 6: Build & Dependency Cleanup](#phase-6-build--dependency-cleanup-10-min)
8. [Verification Checklist](#verification-checklist)
9. [What NOT to Fix](#what-not-to-fix-accepted-risks)
10. [Commit Strategy](#commit-strategy)
11. [File Reference](#file-reference)

---

## Execution Strategy

Fix in **6 phases**, ordered by dependency and risk. Each phase produces a buildable, testable state. Run `npm run build` after each phase to verify no regressions.

**Rules**:
- Each phase is independent — it can be done by a different model/agent
- Each phase ends with `npm run build` verification
- If build fails, STOP and fix before proceeding
- Do NOT skip phases — they are ordered by dependency
- Do NOT add comments to code unless explicitly fixing a "no comments" convention

---

## Phase 1: HTML & Global Config (5 min)

**Risk**: LOW | **Impact**: HIGH | **Files**: `index.html` only

These are one-line changes with zero code risk. Do this first.

### 1.1 Add `lang="fi"` to HTML root element

**File**: `index.html:2`

**Current code**:
```html
<html lang="en">
```

**New code**:
```html
<html lang="fi">
```

**Why**: The app is Finnish-language per DESIGN.md. Screen readers misidentify language. Search engines won't index Finnish content correctly.

**Verification**: Open browser DevTools → Elements → verify `<html lang="fi">`.

---

### 1.2 Add `viewport-fit=cover` to meta viewport

**File**: `index.html:7`

**Current code**:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

**New code**:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

**Why**: Without `viewport-fit=cover`, iOS ignores `env(safe-area-inset-bottom)` entirely. BottomNav's `pb-[env(safe-area-inset-bottom,0px)]` always resolves to `0px` on notched iPhones (X, 12–15 series). The bottom navigation is clipped on every notched iPhone.

**Verification**: On notched iPhone, verify bottom nav has padding below the home indicator.

---

### 1.3 Add Google Fonts link for Inter + JetBrains Mono

**File**: `index.html` (add inside `<head>`, before `<title>`)

**Add these lines**:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

**Why**: `--font-display` in `src/index.css:38` references `"InterVariable", "Inter"` but no font is loaded via `@font-face`, Google Fonts `<link>`, or `@import`. The app falls back to system fonts (San Francisco on macOS, Segoe UI on Windows), breaking the entire design system's typography spec (ss03 'g', zero-with-dot, tabular figures).

**Verification**: Open browser DevTools → Network → filter by "font" → verify Inter and JetBrains Mono fonts load.

---

### 1.4 Fix body class conflict

**File**: `index.html:11`

**Current code**:
```html
<body class="bg-black text-white antialiased">
```

**New code**:
```html
<body class="antialiased">
```

**Why**: `bg-black` applies `#000` which conflicts with `--color-canvas: #0a0a0a` set via CSS custom properties in `src/index.css:53`. `text-white` is redundant since `color: var(--color-text-primary)` is already set via `:root`. The CSS handles these colors via tokens — the HTML classes override them with wrong values.

**Verification**: Page background should be `#0a0a0a` (very dark gray), not `#000` (pure black). Visually subtle but technically correct.

---

### Phase 1 Build Check

```bash
npm run build
```

Should pass with zero errors. If it fails, check for HTML syntax errors.

---

## Phase 2: Extract Shared Utility (10 min)

**Risk**: LOW | **Impact**: MEDIUM | **Files**: 6 files (1 new, 5 modified)

This is a pure refactor with no behavior change. Do this early because Phases 3–5 touch the same files.

### 2.1 Create `src/utils/cn.ts`

**File**: NEW `src/utils/cn.ts`

**Content**:
```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
```

**Why**: The identical `cn()` function is copy-pasted in 5 separate component files. Any bug fix or enhancement must be applied in all 5 places. This is a DRY violation and maintenance hazard.

---

### 2.2 Update 5 component files to import from shared utility

For each of the 5 files below, perform these changes:

1. **Remove** the local `cn()` function definition (lines with `function cn(...)`)
2. **Remove** `import { clsx, type ClassValue } from 'clsx'` (no longer needed locally)
3. **Remove** `import { twMerge } from 'tailwind-merge'` (no longer needed locally)
4. **Add** `import { cn } from '../utils/cn'`

**Files to update**:

| File | Local cn() at line | Import to remove |
|------|-------------------|------------------|
| `src/components/Button.tsx` | Lines 6–8 | Lines 3–4 |
| `src/components/PlayerCard.tsx` | Lines 8–10 | Lines 4–5 |
| `src/components/BottomNav.tsx` | Lines 6–8 | Lines 3–4 |
| `src/components/StatBadge.tsx` | Lines 5–7 | Lines 2–3 |
| `src/components/Skeleton.tsx` | Lines 4–6 | Lines 1–2 |

**Example — Button.tsx**:

Before:
```typescript
import { twMerge } from 'tailwind-merge'
import { clsx, type ClassValue } from 'clsx'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
```

After:
```typescript
import { cn } from '../utils/cn'
```

**Why**: Five identical copies = maintenance liability. Zero behavior change.

**Verification**: `npm run build` passes. No visual changes. All components render identically.

---

### Phase 2 Build Check

```bash
npm run build
```

Should pass. If it fails, check for missing imports or circular dependencies.

---

## Phase 3: Type Safety Fixes (20 min)

**Risk**: MEDIUM | **Impact**: CRITICAL | **Files**: 3–4

These fix `any` type leaks and unsafe assertions. Must be done before Phase 4 (error handling) because error handling depends on correct types.

### 3.1 Fix `any` type in `dataProcessors.ts`

**File**: `src/utils/dataProcessors.ts:19`

**Current code** (approximately):
```typescript
export function processPlayerMatchHistory(
    matches: any[],  // <-- THIS LINE
    currentSeasonId: string,
    previousSeasonId: string,
    teamNameForContext: string
) {
```

**New code**:
```typescript
import { PlayerMatchEntry } from '../types/api';

export function processPlayerMatchHistory(
    matches: PlayerMatchEntry[],
    currentSeasonId: string,
    previousSeasonId: string,
    teamNameForContext: string
) {
```

**Why**: `matches: any[]` forces all downstream field accesses (`match.player_goals`, `match.season_id`, etc.) to be unvalidated. A typo in any field name silently returns `undefined` → `NaN`. The `PlayerMatchEntry` type already exists in `src/types/api.ts:1-16` with all the right fields.

**Verification**: TypeScript should now catch any field name typos in `dataProcessors.ts`. Run `npm run build`.

---

### 3.2 Fix `any` type in `PlayerAPIResponse.matches`

**File**: `src/types/api.ts:23`

**Current code**:
```typescript
export interface PlayerAPIResponse {
    birthyear: string;
    firstname: string;
    lastname: string;
    img_url?: string;
    matches: any[];  // <-- THIS LINE
    [key: string]: unknown;
}
```

**New code**:
```typescript
export interface PlayerAPIResponse {
    birthyear: string;
    firstname: string;
    lastname: string;
    img_url?: string;
    matches: PlayerMatchEntry[];  // <-- USE EXISTING TYPE
    [key: string]: unknown;
}
```

**Why**: Same as 3.1. The type already exists. This propagates type safety to all consumers of `PlayerAPIResponse`.

**Verification**: `npm run build` passes. All code that accesses `response.matches` now has type safety.

---

### 3.3 Verify `fetchAPIData` params type (already fixed)

**File**: `src/services/api.ts:39`

**Current code**:
```typescript
export async function fetchAPIData<T>(
    endpoint: string,
    params: Record<string, string | number | boolean | undefined> = {}
): Promise<T> {
```

**Status**: ✅ Already correct. No change needed. Previous review found `Record<string, any>` but current code has the proper type.

---

### 3.4 Verify `as PlayerStats` assertion (already clean)

**File**: `src/hooks/useMatchData.ts:60-71`

**Current code**:
```typescript
processedPlayers.push({
    name: lineupInfo.player_name,
    shirtNumber: lineupInfo.shirt_number,
    birthYear: playerData.birthyear,
    img_url: playerData.img_url,
    teamIdInMatch: lineupInfo.team_id,
    ...processedHistory,
    isCaptainInMatch: lineupInfo.captain === "1",
    position_fi: lineupInfo.position_fi,
    height: lineupInfo.height,
    weight: lineupInfo.weight,
});
```

**Status**: ✅ Already clean. No `as PlayerStats` assertion present. The object is constructed inline and TypeScript validates the shape.

---

### Phase 3 Build Check

```bash
npm run build
```

Should pass. TypeScript now enforces that `PlayerMatchEntry` fields are accessed correctly throughout the data pipeline.

---

## Phase 4: Error Handling & Abort (20 min)

**Risk**: MEDIUM | **Impact**: CRITICAL | **Files**: 2

These fix the most user-visible bugs: confusing error messages, race conditions, and silent data loss. Do this after Phase 3 because correct types are needed for the error handling patterns.

### 4.1 Catch AbortError with clean message

**File**: `src/services/api.ts`

**Location**: Inside `fetchAPIData`, after the `fetch()` call and `clearTimeout(timeoutId)`, in the catch block.

**Current code** (approximately):
```typescript
const response = await fetch(url, { headers: APP_CONFIG.API_HEADERS, signal: controller.signal });
clearTimeout(timeoutId);

if (!response.ok) {
    let errorText = `API call to ${endpoint} failed. Status: ${response.status}`;
    try {
        const errorData = await response.json();
        if (errorData && (errorData.error || errorData.message)) {
            errorText += ` - ${errorData.error?.message || errorData.message}`;
        }
    } catch (e) { /* ignore */ }
    throw new Error(errorText);
}

const data = await response.json();
```

**New code** — wrap the entire fetch + response handling in a try/catch that specifically handles AbortError:

```typescript
try {
    const response = await fetch(url, { headers: APP_CONFIG.API_HEADERS, signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
        let errorText = `API call to ${endpoint} failed. Status: ${response.status}`;
        try {
            const errorData = await response.json();
            if (errorData && (errorData.error || errorData.message)) {
                errorText += ` - ${errorData.error?.message || errorData.message}`;
            }
        } catch { /* non-JSON error response */ }
        throw new Error(errorText);
    }

    const data = await response.json();
    if (data?.call?.status?.toLowerCase() !== "ok") {
        throw new Error(`API error for ${endpoint}: ${data?.call?.status || 'unknown'}`);
    }
    return data;
} catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error(`API-kutsu ${endpoint} aikakatistiin ${FETCH_TIMEOUT}ms jälkeen`);
    }
    throw err;
}
```

**Why**: When `controller.abort()` fires (10s timeout or hook cleanup), `fetch()` throws a `DOMException` with message "The user aborted a request." The hook catch passes this straight to `setError()`. User sees "The user aborted a request" instead of a clean timeout message.

**Also**: Fix `catch (e) { /* ignore */ }` → `catch { /* non-JSON error response */ }` to avoid unused variable warnings.

**Verification**: Trigger a timeout (slow network or mock). User should see "API-kutsu getMatch aikakatistiin 10000ms jälkeen" not "The user aborted a request".

---

### 4.2 Add abort guard in useMatchData catch block

**File**: `src/hooks/useMatchData.ts:75-77`

**Current code**:
```typescript
} catch (err: unknown) {
    setError(err instanceof Error ? err.message : 'Virhe ladattaessa tietoja');
    setData(null);
} finally {
```

**New code**:
```typescript
} catch (err: unknown) {
    if (controller.signal.aborted || !mountedRef.current) return;
    setError(err instanceof Error ? err.message : 'Virhe ladattaessa tietoja');
    setData(null);
} finally {
```

**Why**: When `fetchData("match-2")` starts and clears error at line 32, the OLD `fetchData("match-1")` promise chain can still reject (rate limit, 404, network error). The old catch runs in a separate microtask and calls `setError("old error")`, overwriting the cleared state. React 18 renders this as: `data=null, loading=true, error="old error"` — the user sees a skeleton AND an error banner simultaneously for a brief flash.

**Verification**: Navigate to a valid match → navigate to an invalid match ID → while the first request is in flight, the old request fails → should NOT see flash of error+loading.

---

### 4.3 Pass AbortController signal to fetch layer

**File 1**: `src/services/api.ts` — Add optional `signal` parameter

**Current code**:
```typescript
export async function fetchAPIData<T>(
    endpoint: string,
    params: Record<string, string | number | boolean | undefined> = {}
): Promise<T> {
```

**New code**:
```typescript
export async function fetchAPIData<T>(
    endpoint: string,
    params: Record<string, string | number | boolean | undefined> = {},
    signal?: AbortSignal
): Promise<T> {
```

Then in the `fetch()` call, pass the signal:
```typescript
const response = await fetch(url, {
    headers: APP_CONFIG.API_HEADERS,
    signal: signal ?? controller.signal  // Prefer caller's signal
});
```

**File 2**: `src/hooks/useMatchData.ts` — Pass signal to API calls

In `getMatchDetails` call (line 34), `getGroupDetails` (line 38), `getTeamData` (lines 39-40), and `batchFetch` (line 46) — these functions internally call `fetchAPIData`. The signal needs to be threaded through.

**Simpler approach**: Since `fetchAPIData` already creates its own AbortController with a 10s timeout, and the hook creates its own for navigation cancellation, you can merge them:

```typescript
// In useMatchData, before the try block:
const timeoutController = new AbortController();
const timeoutId = setTimeout(() => timeoutController.abort(), 10000);

// Chain the two controllers:
controller.signal.addEventListener('abort', () => timeoutController.abort());

// Pass timeoutController.signal to fetchAPIData
```

**Why**: `useMatchData` creates an AbortController and aborts it on re-invocation (line 26), but its signal is never passed to `fetchAPIData` → `fetch()`. The API layer creates its OWN AbortController with a 10s timeout (api.ts:55-56). When the user navigates rapidly between matches, ALL old HTTP requests continue running until they time out or succeed. Bandwidth and API quota are wasted.

**Verification**: Navigate rapidly between matches. In Network tab, old requests should be canceled (status: canceled), not completing.

---

### 4.4 Clean up abortRef on unmount

**File**: `src/hooks/useMatchData.ts:22`

**Current code**:
```typescript
useEffect(() => {
    return () => { mountedRef.current = false; };
}, []);
```

**New code**:
```typescript
useEffect(() => {
    return () => {
        mountedRef.current = false;
        abortRef.current?.abort();
    };
}, []);
```

**Why**: Cleanup sets `mountedRef.current = false` but never calls `abortRef.current?.abort()`. If the component unmounts mid-fetch, in-flight requests continue consuming bandwidth and the AbortController is leaked. The `mountedRef` check catches state updates, but the network request is still wasted.

**Verification**: Unmount component during fetch. Network tab should show canceled requests.

---

### 4.5 Fix empty matchId validation

**File**: `src/pages/MatchPage.tsx:21`

**Current code**:
```typescript
useEffect(() => {
    setSearchValue(matchId)
    if (matchId.trim()) {
        fetchData(matchId.trim())
    }
}, [matchId, fetchData])
```

**New code**:
```typescript
useEffect(() => {
    setSearchValue(matchId)
    if (matchId.trim()) {
        fetchData(matchId.trim())
    } else if (matchId !== '') {
        setError('Virheellinen ottelun ID')
    }
}, [matchId, fetchData])
```

**Why**: `useParams()` returns `matchId = ''` when the URL is `/match/` (trailing slash) or `/match`. `fetchData('')` is called, which hits `getMatch?match_id=`. The API returns a 400 error. The error message displayed is the raw API error: "API call to getMatch failed. Status: 400" — not user-friendly.

**Verification**: Navigate to `/match/` or `/match` — should show "Virheellinen ottelun ID" not raw API error.

---

### 4.6 Localize rate limit error message

**File**: `src/services/api.ts:41`

**Current code**:
```typescript
throw new Error(`Rate limit exceeded for ${endpoint}. Please try again in a moment.`);
```

**New code**:
```typescript
throw new Error('Palvelun käyttöraja täynnä. Yritä hetken päästä uudelleen.');
```

**Why**: Mixed Finnish/English error messages confuse the target audience (Finnish youth football). The endpoint string (e.g., `getMatch`, `getPlayer`) is exposed to the user — technical and confusing.

**Verification**: Trigger rate limit. Error message should be in Finnish only.

---

### Phase 4 Build Check

```bash
npm run build
```

Should pass. Test error handling by:
1. Disconnecting network → should show Finnish error
2. Navigating rapidly between matches → no flash of stale error
3. Letting request timeout → should show clean timeout message

---

## Phase 5: Accessibility & UX Fixes (15 min)

**Risk**: LOW | **Impact**: MEDIUM | **Files**: 6

These fix focus rings, input accessibility, and minor UI issues. Low risk because they're mostly CSS class additions.

### 5.1 Fix search input focus rings

**File 1**: `src/pages/Home.tsx:50`

**Current code**:
```tsx
className="flex-grow bg-transparent border-none focus:ring-0 text-text-primary px-4 py-3 placeholder:text-text-muted text-lg"
```

**New code**:
```tsx
className="flex-grow bg-transparent border-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none text-text-primary px-4 py-3 placeholder:text-text-muted text-lg"
```

**File 2**: `src/pages/MatchPage.tsx:60`

Same change as Home.tsx.

**Why**: DESIGN.md §10.2 requires "Focus visible: 2px solid hero-accent ring" on all interactive elements. Both search inputs use `focus:ring-0`, completely removing the focus ring. Keyboard users cannot see when the input is focused.

**Verification**: Tab to search input. Should see 2px accent-colored ring around input.

---

### 5.2 Add focus-visible to NotFound Link

**File**: `src/pages/NotFound.tsx:9`

**Current code**:
```tsx
<Link to="/" className="inline-flex items-center justify-center rounded-md bg-accent px-5 py-3 font-semibold text-text-inverse hover:bg-accent/90 transition-colors active:scale-[0.97]">
```

**New code**:
```tsx
<Link to="/" className="inline-flex items-center justify-center rounded-md bg-accent px-5 py-3 font-semibold text-text-inverse hover:bg-accent/90 transition-colors active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50">
```

**Why**: The "Takaisin etusivulle" Link has no `focus-visible:ring-*` classes. Keyboard-only users cannot see focus state.

**Verification**: Tab to the link. Should see accent ring.

---

### 5.3 Add focus-visible to BottomNav NavLink

**File**: `src/components/BottomNav.tsx:22-26`

**Current code**:
```tsx
className={({ isActive }) =>
    cn(
        'flex flex-col items-center justify-center gap-0.5 py-2 px-4 min-w-[64px] min-h-[48px] transition-colors duration-200',
        isActive ? 'text-accent' : 'text-text-muted hover:text-text-secondary',
    )
}
```

**New code**:
```tsx
className={({ isActive }) =>
    cn(
        'flex flex-col items-center justify-center gap-0.5 py-2 px-4 min-w-[64px] min-h-[48px] transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
        isActive ? 'text-accent' : 'text-text-muted hover:text-text-secondary',
    )
}
```

**Why**: NavLink anchors are keyboard-navigable interactive elements but have no `focus-visible:ring-*` styling. When tabbing through the bottom nav, users get no visible focus indicator.

**Verification**: Tab through bottom nav. Each tab should show accent ring.

---

### 5.4 Fix PlayerCard image onError

**File**: `src/components/PlayerCard.tsx:17-40`

**Current code**:
```tsx
export function PlayerCard({ stats }: { stats: PlayerStats }) {
    const hasHistory = stats.pastMatchesDetails && stats.pastMatchesDetails.length > 0;

    return (
        <motion.div ...>
            <div className="relative">
                {stats.img_url ? (
                    <img
                        src={stats.img_url}
                        alt={stats.name}
                        className="w-16 h-16 rounded-xl object-cover border border-border-hairline"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                ) : (
                    <div className="w-16 h-16 rounded-xl bg-surface-2 border border-border-hairline flex items-center justify-center">
                        <User className="w-8 h-8 text-text-muted" aria-label="Player avatar placeholder" />
                    </div>
                )}
```

**New code**:
```tsx
export function PlayerCard({ stats }: { stats: PlayerStats }) {
    const [imgError, setImgError] = useState(false);
    const hasHistory = stats.pastMatchesDetails && stats.pastMatchesDetails.length > 0;

    return (
        <motion.div ...>
            <div className="relative">
                {!imgError && stats.img_url ? (
                    <img
                        src={stats.img_url}
                        alt={stats.name}
                        className="w-16 h-16 rounded-xl object-cover border border-border-hairline"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="w-16 h-16 rounded-xl bg-surface-2 border border-border-hairline flex items-center justify-center">
                        <User className="w-8 h-8 text-text-muted" aria-label="Player avatar placeholder" />
                    </div>
                )}
```

Also add `useState` import:
```tsx
import { useState } from 'react'
```

**Why**: `onError={(e) => (e.currentTarget.style.display = 'none')}` permanently hides the image element in the DOM, even if the src changes on re-render. It also removes the space the image occupied, causing layout shift. The React ternary `stats.img_url ? <img .../> : <div>...` never renders the `<User />` fallback because the `<img>` element still exists in the DOM (just hidden).

**Verification**: Load a player with broken image URL. Should see User placeholder icon, not a collapsed gap.

---

### 5.5 Fix PlayerCard dots accessibility

**File**: `src/components/PlayerCard.tsx:76-87`

**Current code**:
```tsx
<div
    key={i}
    role="button"
    tabIndex={0}
    title={`${match.date}: vs ${match.opponentName} (${match.playerTeamScore}-${match.opponentScore})`}
    className={cn(
        "w-2.5 h-2.5 rounded-full shrink-0 min-w-[10px] min-h-[10px]",
        match.resultIndicator === 'win' ? "bg-semantic-green" :
            match.resultIndicator === 'loss' ? "bg-semantic-red" :
                match.resultIndicator === 'fixture' ? "bg-semantic-gray" : "bg-semantic-amber"
    )}
/>
```

**New code** (remove interactive semantics — these are decorative indicators only):
```tsx
<div
    key={i}
    title={`${match.date}: vs ${match.opponentName} (${match.playerTeamScore}-${match.opponentScore})`}
    className={cn(
        "w-2.5 h-2.5 rounded-full shrink-0 min-w-[10px] min-h-[10px]",
        match.resultIndicator === 'win' ? "bg-semantic-green" :
            match.resultIndicator === 'loss' ? "bg-semantic-red" :
                match.resultIndicator === 'fixture' ? "bg-semantic-gray" : "bg-semantic-amber"
    )}
    aria-hidden="true"
/>
```

**Why**: Dots have `role="button"` and `tabIndex={0}` making them focusable and screen-reader-interactive. However, there is no `onClick` or `onKeyDown` handler — pressing Enter/Space does nothing. Screen reader users will encounter non-functional button landmarks. Since these are purely visual indicators (tooltip on hover), remove interactive semantics.

**Verification**: Tab through player card. Dots should NOT be focusable. Screen reader should skip them.

---

### 5.6 Fix font-weight on table headers

**File**: `src/components/StandingsTable.tsx:14-24`

**Find all `<th>` elements** and change `font-medium` to `font-bold`.

**Current code** (example):
```tsx
<th className="... font-medium ...">
```

**New code**:
```tsx
<th className="... font-bold ...">
```

**Why**: DESIGN.md §6.7 says table header is "text caption (10px/700/uppercase)". The `<th>` elements use `font-medium` (weight 500) instead of `font-bold` (weight 700). Headers won't stand out as intended.

**Verification**: Standings table headers should be noticeably bolder.

---

### 5.7 Fix font-weight on team names

**Files**:
- `src/components/MatchHeader.tsx:49,60`
- `src/pages/MatchPage.tsx:124,141`

**Find all team name headings** and change `font-black` to `font-bold`.

**Current code** (example):
```tsx
<h2 className="text-3xl font-black text-text-primary">{data.match.team_A_name}</h2>
```

**New code**:
```tsx
<h2 className="text-3xl font-bold text-text-primary">{data.match.team_A_name}</h2>
```

**Why**: DESIGN.md §4.2 says section-title is "24px 700". The team names use `font-black` (weight 900), which is heavier than the spec.

**Verification**: Team names should be bold (700) not black (900).

---

### 5.8 Fix silent catch with unused variable

**File**: `src/services/api.ts:68`

**Current code**:
```typescript
} catch (e) { /* ignore */ }
```

**New code**:
```typescript
} catch { /* non-JSON error response */ }
```

**Why**: ES2019 optional catch binding. The `e` variable is unused and may trigger lint warnings.

**Verification**: `npm run build` passes with no unused variable warnings.

---

### Phase 5 Build Check

```bash
npm run build
```

Should pass. Test accessibility:
1. Tab through all interactive elements — each should show focus ring
2. Screen reader should NOT announce PlayerCard dots as buttons
3. Image errors should show placeholder icon, not collapsed gap

---

## Phase 6: Build & Dependency Cleanup (10 min)

**Risk**: LOW | **Impact**: LOW | **Files**: 3

### 6.1 Remove dead devDependencies

**File**: `package.json`

**Run command**:
```bash
npm uninstall autoprefixer postcss
```

**Why**: With Tailwind CSS v4 + `@tailwindcss/vite` plugin, vendor prefixing is handled internally by Lightning CSS. There is no `postcss.config.*` file. `autoprefixer@10.4.20` and `postcss@^8.4.47` are installed but never loaded — dead weight from a Tailwind v3 setup.

**Verification**: `npm run build` still passes. `ls node_modules/autoprefixer` should fail (not installed).

---

### 6.2 Fix GitHub Actions CI

**File**: `.github/workflows/deploy.yml:28`

**Current code**:
```yaml
- run: npm install
```

**New code**:
```yaml
- run: npm ci
```

**Why**: In CI environments, `npm ci` is preferred because it installs from `package-lock.json` deterministically, fails if the lockfile is out of sync, and is faster. `npm install` can modify `package-lock.json` and produce non-reproducible builds.

**Verification**: Push to GitHub. CI should pass with `npm ci`.

---

### 6.3 Fix hardcoded match ID in BottomNav

**File**: `src/components/BottomNav.tsx:12`

**Current code**:
```typescript
const navItems = [
    { to: '/', label: 'Etusivu', icon: Home },
    { to: '/match/3760372', label: 'Ottelu', icon: Search },
]
```

**New code** (option A — remove the nav item):
```typescript
const navItems = [
    { to: '/', label: 'Etusivu', icon: Home },
]
```

**New code** (option B — link to match search):
```typescript
const navItems = [
    { to: '/', label: 'Etusivu', icon: Home },
    { to: '/match/', label: 'Ottelu', icon: Search },
]
```

**Why**: The "Ottelu" nav link hardcodes `{ to: '/match/3760372' }`. This is debug/test data left in production code. It always navigates to the same match regardless of context.

**Recommendation**: Use option A (remove) since Home page already has a match search form.

**Verification**: Bottom nav should have 1 tab (Etusivu) or 2 tabs linking to valid routes.

---

### Phase 6 Build Check

```bash
npm run build
```

Should pass. Run `npm run dev` and verify the app works correctly.

---

## Verification Checklist

After all 6 phases, verify:

- [ ] `npm run build` passes with zero errors
- [ ] `npm run dev` starts without errors
- [ ] Page background is #0a0a0a (not #000)
- [ ] Inter font loads (check Network tab)
- [ ] Tab through all interactive elements — each shows focus ring
- [ ] Search input shows focus ring when tabbed to
- [ ] Bottom nav shows focus ring when tabbed to
- [ ] Navigate to `/match/` — shows "Virheellinen ottelun ID"
- [ ] Player with broken image shows User placeholder icon
- [ ] PlayerCard dots are NOT focusable via tab
- [ ] Table headers are bold (700 weight)
- [ ] Team names are bold (700 weight), not black (900)
- [ ] No `any` types in `src/types/api.ts` or `src/utils/dataProcessors.ts`
- [ ] `src/utils/cn.ts` exists and is imported by 5 components
- [ ] `autoprefixer` and `postcss` not in package.json
- [ ] BottomNav has no hardcoded match ID

---

## What NOT to Fix (Accepted Risks)

These findings were reviewed and intentionally not fixed:

1. **Missing `--space-*` tokens** — Design system refinement, not a bug. All spacing works via Tailwind utilities. Adding tokens is a separate PR.

2. **Missing skip-to-content link** — Mobile-first app with bottom nav only. Keyboard navigation through bottom nav is acceptable. Low priority.

3. **`drop-shadow` on BottomNav** — Glow effect on active icons is acceptable UX feedback. DESIGN.md says "no shadows" on cards/surfaces, but icon glow is a different category.

4. **No test files** — Important for long-term maintenance but not blocking. Add Vitest + React Testing Library in a separate PR.

5. **Framer Motion + prefers-reduced-motion** — Requires `<MotionConfig reducedMotion="user">` wrapper. Can be done in a separate PR. CSS-level `prefers-reduced-motion` rule is already correct.

6. **`role="button"` on PlayerCard dots** — Fixed by removing the role (Phase 5.5), not adding handlers.

7. **Index signatures `[key: string]: unknown`** — Kept for API flexibility. Adding `raw: Record<string, unknown>` is a separate refactor.

8. **`fetchAPIData` envelope vs inner type** — Low risk since API is consistent. Types are technically misleading but functionally correct.

---

## Commit Strategy

One commit per phase:

```
fix: html lang, viewport-fit, and font loading
refactor: extract shared cn() utility
fix: remove any types and unsafe assertions
fix: abort handling, error messages, race conditions
fix: focus rings, accessibility, font weights
chore: remove dead deps, fix CI, clean hardcoded match ID
```

---

## File Reference

All files referenced in this plan:

| File | Phases | Changes |
|------|--------|---------|
| `index.html` | 1 | lang, viewport, fonts, body class |
| `src/utils/cn.ts` | 2 | NEW FILE |
| `src/components/Button.tsx` | 2 | Import cn from shared |
| `src/components/PlayerCard.tsx` | 2, 5 | Import cn, fix image onError, fix dots |
| `src/components/BottomNav.tsx` | 2, 5, 6 | Import cn, add focus ring, fix nav items |
| `src/components/StatBadge.tsx` | 2 | Import cn from shared |
| `src/components/Skeleton.tsx` | 2 | Import cn from shared |
| `src/utils/dataProcessors.ts` | 3 | Fix any type |
| `src/types/api.ts` | 3 | Fix matches type |
| `src/services/api.ts` | 4, 5 | AbortError, catch fix, rate limit msg |
| `src/hooks/useMatchData.ts` | 4 | Abort guard, signal, unmount cleanup |
| `src/pages/MatchPage.tsx` | 4, 5 | matchId validation, focus ring, font weight |
| `src/pages/Home.tsx` | 5 | Focus ring |
| `src/pages/NotFound.tsx` | 5 | Focus ring |
| `src/components/StandingsTable.tsx` | 5 | Font weight |
| `src/components/MatchHeader.tsx` | 5 | Font weight |
| `package.json` | 6 | Remove deps |
| `.github/workflows/deploy.yml` | 6 | npm ci |

---

*Plan complete. Execute phases sequentially. Build after each phase.*
