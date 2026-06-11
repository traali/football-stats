# Fix Plan — All Remaining Critical Issues

**Generated**: 2026-06-11T12:00:00Z  
**Author model**: deepseek-v4-flash-free  
**Git base**: `689e33d` (commit `251c267` contains verified CRITICAL_ISSUES.md + CRITICAL_VERIFIED.md)  
**Total issues to fix**: 11 (5 CRITICAL, 4 WARNING, 2 INFO)  
**Estimated total effort**: 80 minutes  

---

## Table of Contents

1. [Overview](#overview)
2. [Round 1: Quick Wins — index.html + 2 components](#round-1-quick-wins)
3. [Round 2: Typography + Accessibility — fonts + text-xs + focus rings](#round-2-typography--accessibility)
4. [Round 3: Type Safety — API envelope + batchFetch abort + index signatures](#round-3-type-safety)
5. [Round 4: UI Polish — error/loading guard + space tokens](#round-4-ui-polish)
6. [Build Verification](#build-verification)
7. [Appendix: All Issues Reference](#appendix)

---

## Overview

### Priority Ordering Rationale

| Priority tier | Rule | Rounds |
|---|---|---|
| **P0** | Runtime behavior bug, 1-2 min fix | Round 1 |
| **P1** | Accessibility/design system, multiple files | Round 2 |
| **P2** | Type safety refactor, needs careful testing | Round 3 |
| **P3-P4** | Edge case / cosmetic consistency | Round 4 |

Each round is independent. They can be done in parallel by different models if desired, but the ordering above minimizes risk (simplest, highest-impact fixes first).

### Files Touched

```
index.html              (3 edits: lang, viewport, fonts)
src/index.css           (1 addition: space tokens)
src/services/api.ts     (2 edits: envelope unwrap, batchFetch signal)
src/types/api.ts        (1 edit: remove index signature)
src/hooks/useMatchData.ts (1 edit: pass signal to batchFetch)
src/pages/Home.tsx      (2 edits: flex-grow, focus ring)
src/pages/MatchPage.tsx (2 edits: flex-grow, focus ring, error/loading guard)
src/components/BottomNav.tsx    (1 edit: text-[10px])
src/components/MatchHeader.tsx  (2 edits: text-[10px] ×2)
src/components/PlayerCard.tsx   (2 edits: text-[10px] ×2)
src/components/StandingsTable.tsx (1 edit: text-[10px])
src/components/StatBadge.tsx    (1 edit: text-[10px])
```

---

## Round 1: Quick Wins

**Files**: `index.html`, `Home.tsx`, `MatchPage.tsx`  
**Effort**: 10 minutes  
**Build expected**: ✅ clean  

### Fix C20: `flex-grow` → `grow`

**Why**: Tailwind v4 removed the `flex-grow` utility class (was an alias for `grow` in v3). It now silently produces no CSS. Both search inputs will not stretch to fill their parent flex container.

**File**: `src/pages/Home.tsx` — line 50

```diff
- className="flex-grow bg-transparent border-none focus:ring-0 text-text-primary px-4 py-3 placeholder:text-text-muted text-lg"
+ className="grow bg-transparent border-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-canvas text-text-primary px-4 py-3 placeholder:text-text-muted text-lg"
```

**File**: `src/pages/MatchPage.tsx` — line 60

```diff
- className="flex-grow bg-transparent border-none focus:ring-0 text-text-primary px-4 py-3 placeholder:text-text-muted text-lg"
+ className="grow bg-transparent border-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-canvas text-text-primary px-4 py-3 placeholder:text-text-muted text-lg"
```

Note: We combine C20 + C13 in one edit (fix `flex-grow` AND replace `focus:ring-0` at the same time).

---

### Fix C14: Missing `viewport-fit=cover`

**Why**: Without `viewport-fit=cover`, iOS ignores `env(safe-area-inset-*)` CSS functions. BottomNav's safe-area padding (`pb-[env(safe-area-inset-bottom,0px)]`) always resolves to 0 on notched iPhones. The bottom of the nav is hidden behind the home indicator.

**File**: `index.html` — line 7

```diff
- <meta name="viewport" content="width=device-width, initial-scale=1.0" />
+ <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

---

### Fix C10: Missing `lang="fi"`

**Why**: `<html lang="en">` tells screen readers and search engines the page is English. The entire UI is in Finnish. VoiceOver uses English pronunciation rules for Finnish text (wrong vowel sounds, wrong syllable emphasis). Search engines may not index Finnish content correctly.

**File**: `index.html` — line 2

```diff
- <html lang="en">
+ <html lang="fi">
```

---

### Round 1 — After applying

```bash
# Verify
npm run build && echo "✅ Round 1 passes"
```

---

## Round 2: Typography + Accessibility

**Files**: `index.html`, 6 component files  
**Effort**: 15 minutes  
**Build expected**: ✅ clean  

### Fix C11: Load Inter + JetBrains Mono fonts

**Why**: `--font-display: "InterVariable", "Inter", ...` and `--font-mono: "JetBrains Mono Variable", "JetBrains Mono", ...` are defined in CSS, but neither font is actually loaded. The browser falls back to system defaults. Every typography-related DESIGN.md spec (ss03 'g', zero-width dot, tabular figures, font-weight hierarchy) is invisible. This is the single highest-impact visual fix.

**File**: `index.html` — insert before `</head>` (after line 8)

```diff
+     <link rel="preconnect" href="https://fonts.googleapis.com">
+     <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
+     <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
```

Note: Variable font weights (`InterVariable`) are available via the same Google Fonts URL — the `wght@400;500;600;700;800;900` range covers the variable axis. Adding `InterVariable` to the `--font-display` fallback order is already correct in `index.css`.

---

### Fix C18: Replace `text-[10px]` with `text-xs`

**Why**: Fixed `px` values prevent the browser from scaling text when the user changes their default font size setting. This breaks WCAG Success Criterion 1.4.4 (Resize text). `text-xs` = `0.75rem` = 12px at default 16px font size, but scales proportionally. The visual difference between 10px and 12px is ~0.5mm — imperceptible.

8 occurrences across 6 files. Each is a simple find-and-replace:

**File**: `src/components/BottomNav.tsx` — line 32

```diff
- <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
+ <span className="text-xs font-medium uppercase tracking-wider">{item.label}</span>
```

**File**: `src/components/MatchHeader.tsx` — line 17

```diff
- <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-semantic-red">LIVE</span>
+ <span className="text-xs font-bold uppercase tracking-[0.1em] text-semantic-red">LIVE</span>
```

**File**: `src/components/MatchHeader.tsx` — line 37

```diff
- <div className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-md text-accent text-[10px] font-bold uppercase tracking-widest">
+ <div className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-md text-accent text-xs font-bold uppercase tracking-widest">
```

**File**: `src/components/PlayerCard.tsx` — line 42

```diff
- <div className="absolute -top-2 -right-2 bg-accent text-text-inverse text-[10px] font-bold px-1.5 py-0.5 rounded-md border-2 border-canvas">
+ <div className="absolute -top-2 -right-2 bg-accent text-text-inverse text-xs font-bold px-1.5 py-0.5 rounded-md border-2 border-canvas">
```

**File**: `src/components/PlayerCard.tsx` — line 70

```diff
- <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center">
+ <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center">
```

**File**: `src/components/StandingsTable.tsx` — line 14

```diff
- <thead className="text-[10px] uppercase tracking-widest text-text-muted bg-surface-3">
+ <thead className="text-xs uppercase tracking-widest text-text-muted bg-surface-3">
```

**File**: `src/components/StatBadge.tsx` — line 34

```diff
- <div className="text-[10px] uppercase tracking-tight opacity-70 mt-1 font-medium">{label}</div>
+ <div className="text-xs uppercase tracking-tight opacity-70 mt-1 font-medium">{label}</div>
```

**File**: `src/pages/MatchPage.tsx` — line 114

```diff
- <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Joukkuevertailu</h4>
+ <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest">Joukkuevertailu</h4>
```

---

### Fix C13: Fix focus ring on search inputs

Note: Combined with C20 above — the same className string on both input elements already has the corrected version. But we must also remove the parent container's `focus-within:ring-1` to prevent double ring.

**File**: `src/pages/Home.tsx` — line 41

```diff
- <div className="relative flex items-center bg-surface-2 border border-border-hairline rounded-lg overflow-hidden focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all duration-200">
+ <div className="relative flex items-center bg-surface-2 border border-border-hairline rounded-lg overflow-hidden focus-within:border-accent transition-all duration-200">
```

**File**: `src/pages/MatchPage.tsx` — line 51

```diff
- <div className="relative flex items-center bg-surface-2 border border-border-hairline rounded-lg overflow-hidden focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all duration-200">
+ <div className="relative flex items-center bg-surface-2 border border-border-hairline rounded-lg overflow-hidden focus-within:border-accent transition-all duration-200">
```

---

### Round 2 — After applying

```bash
npm run build && echo "✅ Round 2 passes"
```

---

## Round 3: Type Safety

**Files**: `src/services/api.ts`, `src/types/api.ts`, `src/hooks/useMatchData.ts`  
**Effort**: 45 minutes  
**Build expected**: ⚠️ needs careful verification — the API envelope change alters caller interfaces  

### Fix C16: API envelope type — `fetchAPIData` unwrap

**Why**: Currently `fetchAPIData<T>` is called with the full response shape (e.g., `{ match: MatchDetails }`) and returns the full `data` object including `{ call: { status }, match: ... }`. Callers then manually extract `.match`. This means `T` in `fetchAPIData<T>` represents the envelope, not the payload. If the API shape changes, the type mismatch is silent. The runtime `call.status` check does validate, but the type system is lying.

The fix: `fetchAPIData` unwraps the envelope, so `T` genuinely represents the payload. This requires updating all 10 callers.

---

**Step 1**: No new type needed — the wrapper is already typed at each call site as `{ match: MatchDetails }` etc. But we need to tell TypeScript that the return has a `call` property. We cast after validation.

**In `src/services/api.ts`** — change lines 72-76:

**Before:**
```typescript
const data = await response.json();
if (data?.call?.status?.toLowerCase() !== "ok") {
    throw new Error(`API error for ${endpoint}: ${data?.call?.status || 'unknown'}`);
}
return data;
```

**After:**
```typescript
const data: { call?: { status?: string }; [key: string]: unknown } = await response.json();
if (data?.call?.status?.toLowerCase() !== "ok") {
    throw new Error(`API error for ${endpoint}: ${data?.call?.status || 'unknown'}`);
}
// Unwrap: find the first key that isn't 'call' or 'status'
for (const key of Object.keys(data)) {
    if (key !== 'call' && key !== 'status') {
        return data[key] as T;
    }
}
throw new Error(`No data payload in API response for ${endpoint}`);
```

---

**Step 2**: Update all callers. Each one previously typed the envelope and extracted the inner field. Now they call with just the inner type.

**In `src/services/api.ts`** — update each function:

```typescript
// Before:
export async function getMatchDetails(matchId: string): Promise<MatchDetails> {
    const data = await fetchAPIData<{ match: MatchDetails }>("getMatch", { match_id: matchId });
    if (!data.match) throw new Error(`Match data is invalid for match ID ${matchId}.`);
    return data.match;
}

// After:
export async function getMatchDetails(matchId: string): Promise<MatchDetails> {
    const data = await fetchAPIData<{ match: MatchDetails }>("getMatch", { match_id: matchId });
    return data?.match ?? (() => { throw new Error(`Match data is invalid for match ID ${matchId}.`); })();
}
```

Wait — this doesn't work because `fetchAPIData` now returns the unwrapped inner payload. The caller's generic `fetchAPIData<{ match: MatchDetails }>` would be wrong. Let me reconsider.

**Better approach**: Instead of auto-unwrapping (which changes the contract), we make the return type explicitly the envelope. Then callers remain unchanged:

**In `fetchAPIData`**:
```typescript
const data = await response.json();
if (data?.call?.status?.toLowerCase() !== "ok") {
    throw new Error(`API error for ${endpoint}: ${data?.call?.status || 'unknown'}`);
}
return data as T;  // T is the full envelope { call: ..., payload: ... }
```

But wait — the current code already returns `data` as-is (which is the envelope). The callers type it as `{ match: MatchDetails }` which is a subset of the envelope (they don't include `call` in the type). So they're already lying about the type.

**Simplest correct fix**: Define the envelope, and make `fetchAPIData` validate it:

```typescript
interface APIEnvelope {
    call: { status: string };
    [key: string]: unknown;
}

export async function fetchAPIData<T>(endpoint: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<T> {
    // ...rate limit, throttle, fetch with timeout...
    const data = await response.json();
    if (data?.call?.status?.toLowerCase() !== "ok") {
        throw new Error(`API error for ${endpoint}: ${data?.call?.status || 'unknown'}`);
    }
    // Find the first payload key (not 'call' or 'status')
    for (const key of Object.keys(data)) {
        if (key !== 'call' && key !== 'status') {
            return data[key] as T;
        }
    }
    throw new Error(`No data payload in API response for ${endpoint}`);
}
```

Then update callers to NOT include the envelope wrapper:

```typescript
// Before (current):
export async function getMatchDetails(matchId: string): Promise<MatchDetails> {
    const data = await fetchAPIData<{ match: MatchDetails }>("getMatch", { match_id: matchId });
    if (!data.match) throw new Error(`Match data is invalid for match ID ${matchId}.`);
    return data.match;
}

// After:
export async function getMatchDetails(matchId: string): Promise<MatchDetails> {
    const data = await fetchAPIData<MatchDetails>("getMatch", { match_id: matchId });
    if (!data) throw new Error(`Match data is invalid for match ID ${matchId}.`);
    return data;
}
```

But there's a problem: the API response for `getMatch` is `{ call: { status: "ok" }, match: { ...match fields... } }`. The unwrapping finds the `match` key and returns it. But what if the API response has extra keys? The unwrap picks the first non-call key, which happens to be `match`. This works but is fragile.

**Even better**: Keep the existing pattern but add proper typing. The callers are fine as-is — they type the full envelope and extract. The real issue is that `fetchAPIData`'s return type should be `Promise<T>` where `T` is the envelope, and the runtime validation checks `call.status`. This is already what happens.

**Actual minimal fix**: Just add the `APIEnvelope` type and use it in `fetchAPIData` for the intermediate variable:

```typescript
interface APIEnvelope {
    call: { status: string };
    [key: string]: unknown;
}

export async function fetchAPIData<T>(endpoint: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<T> {
    // ... existing code up to ...
    const data: APIEnvelope = await response.json();
    if (data?.call?.status?.toLowerCase() !== "ok") {
        throw new Error(`API error for ${endpoint}: ${data?.call?.status || 'unknown'}`);
    }
    return data as T;
}
```

This is the minimal correct change:
1. The `data` variable is typed as `APIEnvelope` (has `call.status` + unknown extra keys)
2. The generic `T` at each call site types the extra keys (e.g., `{ match: MatchDetails }`)
3. Runtime validation happens before returning
4. No callers need to change
5. The `as T` cast is isolated to one line inside `fetchAPIData` instead of in every caller

**Final answer for C16**: Add `APIEnvelope` type. Type `data` with it. Keep existing callers unchanged.

```diff
+ interface APIEnvelope {
+     call: { status: string };
+     [key: string]: unknown;
+ }

export async function fetchAPIData<T>(endpoint: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<T> {
     // ...rate limit, throttle...
     const response = await fetch(url, { headers: APP_CONFIG.API_HEADERS, signal: controller.signal });
     clearTimeout(timeoutId);
     // ...error check...
-    const data = await response.json();
+    const data: APIEnvelope = await response.json();
     if (data?.call?.status?.toLowerCase() !== "ok") {
         throw new Error(`API error for ${endpoint}: ${data?.call?.status || 'unknown'}`);
     }
-    return data;
+    return data as T;
 }
```

---

### Fix C07: AbortSignal in batchFetch

**Why**: When `useMatchData` aborts its controller (because `matchId` changed), `batchFetch` continues iterating through its batches, firing HTTP requests for each player. The `if (controller.signal.aborted) return` check after the batch prevents processing results, but the HTTP calls themselves already fired. For 22+ players × 4+ batches, this is 15+ unnecessary API calls per navigation.

**In `src/services/api.ts`** — lines 79-93:

```diff
 export async function batchFetch<T>(
     items: string[],
     fetchFn: (id: string) => Promise<T>,
     concurrency = 5,
+    signal?: AbortSignal,
 ): Promise<(T | undefined)[]> {
     const results: (T | undefined)[] = []
     for (let i = 0; i < items.length; i += concurrency) {
+        if (signal?.aborted) return results
         const batch = items.slice(i, i + concurrency)
         const settled = await Promise.allSettled(batch.map(id => fetchFn(id)))
         for (const r of settled) {
             results.push(r.status === 'fulfilled' ? r.value : undefined)
         }
     }
     return results
 }
```

**In `src/hooks/useMatchData.ts`** — line 46:

```diff
- const playerDataList = await batchFetch(playerIds, getPlayerData, 5);
+ const playerDataList = await batchFetch(playerIds, getPlayerData, 5, controller.signal);
```

---

### Fix C04: Remove `[key: string]: unknown` from PlayerAPIResponse

**Why**: `PlayerAPIResponse` has all 6 consumed fields explicitly typed. The index signature prevents TypeScript from doing excess property checking — it won't warn if you access `playerData.wrongField`. The other 5 interfaces (`Competition`, `Category`, `Season`, `DiscoveryMatch`, `ScoreEntry`) genuinely receive undocumented extra fields from the API.

**In `src/types/api.ts`** — line 24:

```diff
 export interface PlayerAPIResponse {
     birthyear: string;
     firstname: string;
     lastname: string;
     img_url?: string;
     matches: PlayerMatchEntry[];
-    [key: string]: unknown;
 }
```

For the other interfaces, add a documenting comment:

```typescript
export interface Competition {
    competition_id: string;
    competition_name: string;
    season_id?: string;
    season_name?: string;
    // [key: string]: unknown — API returns undocumented extra fields, keep index signature
    [key: string]: unknown;
}
```

---

### Round 3 — After applying

```bash
npm run build && echo "✅ Round 3 passes"
```

If build fails:
1. **Most likely**: The `APIEnvelope` type clashes with a caller that passes `T` as the inner type instead of the envelope. Check: `getMatchDetails`, `getGroupDetails`, `getTeamData`, `getPlayerData`, `getCompetitions`, `getCategories`, `getMatches`, `getScore`, `getSeasons` — all 9 should pass `{ field: Type }` as `T`.
2. **Second most likely**: `data as T` inside `fetchAPIData` — if `APIEnvelope` has `[key: string]: unknown` and `T` is `{ match: MatchDetails }`, the cast may need `as unknown as T` to bypass the index signature mismatch.

Potential fix for the cast:
```typescript
return data as unknown as T;
```

---

## Round 4: UI Polish

**Files**: `src/pages/MatchPage.tsx`, `src/index.css`  
**Effort**: 10 minutes  
**Build expected**: ✅ clean  

### Fix C09: Error + Loading mutual exclusion

**Why**: Edge case. When `fetchData` starts (calls `setData(null)`, `setLoading(true)`, `setError(null)`), React 18 batches these into one render. But if render was triggered between `setData(null)` and the rest (extremely unlikely in practice), both `error` (old value, not yet cleared) and `loading` (just set to true) would be truthy. `AnimatePresence mode="wait"` would show both.

**In `src/pages/MatchPage.tsx`** — lines 71-101:

```diff
- {error && (
+ {error && !loading && (
     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
         className="p-6 bg-semantic-red/10 border border-semantic-red/20 rounded-lg text-semantic-red text-center">
         {error}
     </motion.div>
 )}

- {loading && (
+ {loading && !error && (
     <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
         className="space-y-12">
         {/* skeleton content */}
     </motion.div>
 )}
```

---

### Fix C12: Add `--space-*` tokens

**Why**: DESIGN.md §5.1 defines a full 8px spacing grid with `--space-1` through `--space-9`. Tailwind v4's built-in spacing scale happens to match these values, so this is cosmetic — the app works without them. But adding them makes the token system self-documenting and ensures DESIGN.md compliance if Tailwind defaults ever change.

**In `src/index.css`** — add to the `@theme` block, after the radius section (after line 47):

```diff
     --radius-2xl: 20px;
     --radius-full: 9999px;
+
+    /* Spacing (8px grid) */
+    --space-1: 4px;
+    --space-2: 8px;
+    --space-3: 12px;
+    --space-4: 16px;
+    --space-5: 24px;
+    --space-6: 32px;
+    --space-7: 40px;
+    --space-8: 48px;
+    --space-9: 72px;
 }
```

---

### Round 4 — After applying

```bash
npm run build && echo "✅ Round 4 passes"
```

---

## Build Verification

Each round ends with `npm run build`. Run a final full verification:

```bash
npm run build 2>&1 | tail -5
# Expected output: "✓ built in X.XXs"

# Verify the fixes exist
grep -c 'grow' src/pages/Home.tsx           # should be ≥1 (not flex-grow)
grep -c 'viewport-fit=cover' index.html     # should be 1
grep -c 'lang="fi"' index.html              # should be 1
grep -c 'fonts.googleapis.com' index.html   # should be 1
grep -c 'text-xs' src/components/BottomNav.tsx  # should be ≥1
grep -c 'Promise.allSettled' src/services/api.ts # should be 1
grep -c 'signal?.aborted' src/services/api.ts   # should be 1
grep -c 'APIEnvelope' src/services/api.ts       # should be 1
```

---

## Full Command Sequence (copy-paste ready)

```bash
# Create branch
git checkout -b fix/all-remaining-issues

# ===== ROUND 1: Quick Wins =====
sed -i '' 's/lang="en"/lang="fi"/' index.html
sed -i '' 's|<meta name="viewport" content="width=device-width, initial-scale=1.0" />|<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />|' index.html
sed -i '' 's/flex-grow/grow/g' src/pages/Home.tsx src/pages/MatchPage.tsx
sed -i '' 's/focus:ring-0/focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-canvas/g' src/pages/Home.tsx src/pages/MatchPage.tsx
sed -i '' 's/focus-within:ring-1 focus-within:ring-accent//g' src/pages/Home.tsx src/pages/MatchPage.tsx
npm run build
git add -A && git commit -m "fix round 1: lang=fi, viewport-fit=cover, flex-grow→grow, focus rings"

# ===== ROUND 2: Typography + Accessibility =====
cat >> index.html << 'FONTS'
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
FONTS
sed -i '' 's/text-\[10px\]/text-xs/g' src/components/BottomNav.tsx src/components/MatchHeader.tsx src/components/PlayerCard.tsx src/components/StandingsTable.tsx src/components/StatBadge.tsx src/pages/MatchPage.tsx
npm run build
git add -A && git commit -m "fix round 2: load fonts, replace text-[10px] with text-xs"

# ===== ROUND 3: Type Safety =====
# Step 1: pass signal to batchFetch in useMatchData
sed -i '' 's/batchFetch(playerIds, getPlayerData, 5)/batchFetch(playerIds, getPlayerData, 5, controller.signal)/' src/hooks/useMatchData.ts
# Step 2: Remove index signature from PlayerAPIResponse
# (manual edit — too complex for sed)
# Step 3: Add APIEnvelope to api.ts
# (manual edit — too complex for sed)
npm run build
git add -A && git commit -m "fix round 3: batchFetch abort signal, API envelope type, remove index signatures"

# ===== ROUND 4: UI Polish =====
# Manual edits: error/loading guard in MatchPage.tsx, --space-* tokens in index.css
npm run build
git add -A && git commit -m "fix round 4: error/loading mutual exclusion, space tokens"

echo "=== ALL FIXES APPLIED ==="
```

---

## Appendix: All Issues Reference

| ID | Description | Severity | Effort | Round | Status |
|----|-------------|----------|--------|-------|--------|
| C20 | `flex-grow` → `grow` (Tailwind v4) | CRITICAL | 2 min | 1 | ❌ |
| C14 | Missing `viewport-fit=cover` | CRITICAL | 1 min | 1 | ❌ |
| C10 | `lang="en"` → `lang="fi"` | CRITICAL | 1 min | 1 | ❌ |
| C11 | Fonts Inter/JetBrains Mono not loaded | CRITICAL | 5 min | 2 | ❌ |
| C18 | `text-[10px]` prevents font scaling (×8) | CRITICAL | 10 min | 2 | ❌ |
| C13 | `focus:ring-0` removes focus indicator | WARNING | 5 min | 1+2 | ❌ |
| C16 | No API envelope type | WARNING | 30 min | 3 | ❌ |
| C07 | `batchFetch` no abort signal | WARNING | 15 min | 3 | ❌ |
| C04 | Index signatures weaken type safety | WARNING | 20 min | 3 | ❌ |
| C09 | Error+Loading mutual exclusion | WARNING | 5 min | 4 | ❌ |
| C12 | Missing `--space-*` tokens | INFO | 5 min | 4 | ❌ |
| C01 | `any[]` in PlayerAPIResponse.matches | CRITICAL | — | ✅ Fixed |
| C02 | Unsafe `as PlayerStats` cast | CRITICAL | — | ✅ Fixed |
| C03 | `Record<string, any>` params | CRITICAL | — | ✅ Fixed |
| C05 | `Promise.all` kills entire batch | CRITICAL | — | ✅ Fixed |
| C06 | No AbortController in useMatchData | CRITICAL | — | ✅ Fixed |
| C08 | Stale data visible on navigation | CRITICAL | — | ✅ Fixed |
| C15 | PastMatchDetail undefined → `"undefined"` | CRITICAL | — | ✅ Fixed |
| C17 | `data?.players.filter()` null crash | CRITICAL | — | ✅ Fixed |
| C19 | No useEffect cleanup on unmount | CRITICAL | — | ✅ Fixed |

---

*Generated by deepseek-v4-flash-free. Any model can execute any round independently — each round starts with `git checkout fix/all-remaining-issues && git log` to see which rounds are already applied. Build between rounds is required.*

---

## Review Comments

### Comment by: opencode/mimo-v2-5-free (2026-06-11)

**Overall**: Excellent plan. Well-structured, correct priorities, accurate diffs. 90%+ agreement.

**What I agree with**:
- ✅ C20 (`flex-grow` → `grow`) — Correct. Tailwind v4 removed this alias.
- ✅ C14 (`viewport-fit=cover`) — Correct. P0 fix.
- ✅ C10 (`lang="fi"`) — Correct. P0 fix.
- ✅ C11 (Font loading) — Correct. Single highest-impact visual fix.
- ✅ C18 (`text-[10px]` → `text-xs`) — Correct. WCAG compliance.
- ✅ C13 (Focus rings) — Correct. Accessibility fix.
- ✅ C07 (batchFetch abort signal) — Correct. Prevents wasted API calls.
- ✅ C12 (`--space-*` tokens) — Correct. Design system completion.
- ✅ C09 (Error/loading mutual exclusion) — Correct. Edge case fix.

**Disagreements**:

1. **C16 (API envelope type)** — The plan goes through 3 iterations trying to figure out the right approach (lines 240-381). My recommendation: **skip this entirely**. The current code works. `fetchAPIData` returns the envelope, callers extract `.match`/`.player`/etc. The type lie is harmless — the runtime `call.status` check catches malformed responses. This fix adds complexity for zero user-visible benefit. Mark as "accepted risk."

2. **C04 (Remove index signatures from PlayerAPIResponse)** — Agree on PlayerAPIResponse specifically. But the plan says "add documenting comment" to other interfaces. I'd say leave the index signatures alone — they exist for API flexibility. Remove only from `PlayerAPIResponse` since all 6 fields are explicitly typed.

3. **Missing fixes from my plan**:
   - **AbortError handling** (my Phase 4.1) — Your plan doesn't cover the raw DOMException "The user aborted a request" that users see on timeout. This is the most user-visible bug.
   - **abortRef cleanup on unmount** (my Phase 4.4) — Your plan doesn't cover the memory leak when component unmounts mid-fetch.
   - **Empty matchId validation** (my Phase 4.5) — Your plan doesn't cover `/match/` showing raw API error.
   - **Rate limit message localization** (my Phase 4.6) — Your plan doesn't cover mixed Finnish/English errors.
   - **PlayerCard image onError** (my Phase 5.4) — Your plan doesn't cover the broken image → placeholder flow.
   - **PlayerCard dots accessibility** (my Phase 5.5) — Your plan doesn't cover `role="button"` with no keyboard handler.
   - **Font-weight fixes** (my Phase 5.6-5.7) — Your plan doesn't cover `font-black` → `font-bold` or `font-medium` → `font-bold` on headers.
   - **Dead dependencies** (my Phase 6.1) — Your plan doesn't cover removing autoprefixer/postcss.
   - **Hardcoded match ID** (my Phase 6.3) — Your plan doesn't cover `/match/3760372` in BottomNav.

**Suggestions**:

1. **Combine Round 1+2 into one pass** — They're all HTML/CSS changes with zero risk. Save a build cycle.

2. **Add the missing fixes from my plan** — Especially the abort-related ones (Phase 4.1-4.4). These are the most impactful user-visible bugs.

3. **The `sed` commands in "Full Command Sequence" are dangerous** — `sed -i '' 's/focus:ring-0/focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-canvas/g'` will also replace `focus:ring-0` inside comments or unrelated strings. Use the Edit tool for precision.

4. **The `cat >> index.html` for fonts will break if run twice** — It appends without checking if fonts are already present. Add an idempotency check.

**My plan covers 35 findings, yours covers 11**. The difference: I did 2 rounds of 8 agents (16 review passes) vs your single-pass review. More agents = more findings.

*Generated by: opencode/mimo-v2-5-free*
