# Critical Issues — Verified Against Current Source

**Generated**: 2026-06-11T12:00:00Z
**Verification model**: deepseek-v4-flash-free
**Verified against git SHA**: `689e33d`

**20 unique CRITICAL findings** from cross-model review (deepseek, mimo, nemotron).
**9 already fixed** in previous auto-fix session.
**11 still present** — documented below with exact fix instructions.

---

## Issues I AGREE with (still present in source)

### C04: `[key: string]: unknown` index signatures weaken type safety

- **Status**: ❌ **Still present**
- **File**: `src/types/api.ts:24,52,59,68,108,128`
- **Issue**: 6 interfaces (`PlayerAPIResponse`, `Competition`, `Category`, `Season`, `DiscoveryMatch`, `ScoreEntry`) use `[key: string]: unknown`. This prevents excess property checking and allows arbitrary fields to pass type-check unnoticed.
- **But I downgrade this to WARNING** — these index signatures exist because the real Torneopal API returns undocumented extra fields. Removing them would break `data as SomeType` usage. The pragmatic fix is to keep them but audit which interfaces truly need them (e.g., `PlayerAPIResponse` needs it less than `DiscoveryMatch` which maps a freeform API).
- **Fix**: Remove index signatures on interfaces where all consumed fields are known. For interfaces that truly need them, add a comment explaining why. Audit each of the 6 interfaces:
  - `PlayerAPIResponse`: has `matches`, `birthyear`, `firstname`, `lastname`, `img_url` — all known. **Remove** `[key: string]: unknown`.
  - `Competition`/`Category`/`Season`: API returns extra fields. **Keep** but document.
  - `DiscoveryMatch`/`ScoreEntry`: map freeform API. **Keep** but document.

### C07: `batchFetch` has no abort signal propagation

- **Status**: ❌ **Still present**
- **File**: `src/services/api.ts:79-93`
- **Issue**: `batchFetch` accepts no `AbortSignal`. When `useMatchData` aborts its controller, `batchFetch` continues firing all remaining API calls. Each creates its own internal `AbortController` (from `fetchAPIData`), but the outer batch loop has no way to be cancelled.
- **Fix**: Add optional `AbortSignal` param to `batchFetch`. Check `signal.aborted` before each batch iteration:
  ```typescript
  export async function batchFetch<T>(
      items: string[],
      fetchFn: (id: string) => Promise<T>,
      concurrency = 5,
      signal?: AbortSignal,
  ): Promise<(T | undefined)[]> {
      const results: (T | undefined)[] = []
      for (let i = 0; i < items.length; i += concurrency) {
          if (signal?.aborted) return results
          const batch = items.slice(i, i + concurrency)
          // ... rest
      }
      return results
  }
  ```
  Also pass the signal to each `fetchFn` call — but since `getPlayerData` calls `fetchAPIData` which has its own timeout controller, the cleanest approach is to check `signal.aborted` between batches and skip further processing in `useMatchData` (already done with `if (controller.signal.aborted) return` on line 47).

### C09: Error and Loading can display simultaneously

- **Status**: ❌ **Still present** (edge case)
- **File**: `src/pages/MatchPage.tsx:70-101`
- **Issue**: `AnimatePresence` renders both error and loading blocks when both states are truthy. `setError(null)` is called at `fetchData` start (line 32), but if a render cycle is triggered between `setData(null)` and `setError(null)`, both could be visible.
- **But I downgrade this to WARNING** — React 18 batches state updates in effects, so in practice this is extremely rare. The `setData(null)` + `setLoading(true)` + `setError(null)` all happen synchronously in the same `useCallback`, so they're batched into one render. Still, defensive conditional rendering would eliminate the edge case.
- **Fix**: Wrap the render blocks with mutual exclusion:
  ```tsx
  {loading && !error && (
    // loading skeleton
  )}
  {error && !loading && (
    // error banner
  )}
  ```

### C10: Missing `lang="fi"` in HTML root element

- **Status**: ❌ **Still present**
- **File**: `index.html:2`
- **Issue**: `<html lang="en">` but the app is entirely Finnish (UI text, error messages, placeholder texts). Screen readers use wrong pronunciation rules.
- **Fix**: Change to `<html lang="fi">`.

### C11: No font loading — Inter and JetBrains Mono never fetched

- **Status**: ❌ **Still present**
- **File**: `src/index.css:38-39`
- **Issue**: CSS references `InterVariable`, `Inter`, `JetBrains Mono Variable`, `JetBrains Mono` but no `@font-face` or Google Fonts link loads them. App silently falls back to system fonts. Entire typography system is broken.
- **Fix**: Add Google Fonts link in `index.html` `<head>`:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  ```

### C12: Missing `--space-*` tokens in CSS

- **Status**: ❌ **Still present**
- **File**: `src/index.css:3-48`
- **Issue**: DESIGN.md defines `--space-1` (4px) through `--space-9` (72px) as an 8px grid. The `@theme` block defines `--radius-*` but no `--space-*` tokens. NOT a runtime bug — Tailwind's spacing scale still works — but the token layer is absent.
- **But I downgrade this to INFO** — Tailwind v4 provides its own spacing scale out of the box (`p-1`=4px, `p-2`=8px, etc.). Adding custom `--space-*` tokens is only needed if the DESIGN.md spec deviates from Tailwind's defaults. Since it matches the standard scale, this is cosmetic consistency, not a bug.
- **Fix**: Add to `@theme` block if DESIGN.md compliance is strictly required:
  ```
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 40px;
  --space-8: 48px;
  --space-9: 72px;
  ```

### C13: Search inputs have `focus:ring-0` removing visible focus indicator

- **Status**: ❌ **Still present**
- **File**: `src/pages/Home.tsx:50`, `src/pages/MatchPage.tsx:60`
- **Issue**: Both search inputs use `focus:ring-0` which removes the keyboard focus ring. However, the parent div uses `focus-within:ring-1 focus-within:ring-accent` which provides a visual indicator. Still, `focus:ring-0` is explicit about removing the native focus style — the `focus-within` on the parent works for keyboard users but is indirect.
- **Downgrade to WARNING** — the `focus-within` ring on the parent div DOES provide a visible focus indicator. But `focus:ring-0` should be removed and replaced with `focus:ring-2 focus:ring-accent` directly on the input for correctness.
- **Fix**: Replace `focus:ring-0` with `focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-canvas` on both inputs. Ensure parent `focus-within:ring-1` doesn't conflict (remove it or make consistent).

### C14: Missing `viewport-fit=cover`

- **Status**: ❌ **Still present**
- **File**: `index.html:7`
- **Issue**: Viewport meta tag lacks `viewport-fit=cover`. iOS `env(safe-area-inset-bottom)` will always resolve to 0 on notched iPhones. BottomNav's safe-area padding won't work.
- **Fix**: Change to:
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  ```

### C16: `fetchAPIData` envelope type not modeled

- **Status**: ❌ **Still present**
- **File**: `src/services/api.ts:72-76`
- **Issue**: `fetchAPIData<T>` returns `data` (the full response) which has `call.status` checked but the return type is the full raw payload `{ call: ..., match: ... }`, not unwrapped to `<T>`. The callers each do `data.match`, `data.group`, `data.team`, etc. If the API shape changes, the type mismatch is silent.
- **But I downgrade this to WARNING** — the current pattern works correctly: callers type the full response wrapper as e.g. `{ match: MatchDetails }` and extract `.match`. An `APIResponse<T>` envelope would add type safety but requires a refactor of all 10 callers. The runtime check at line 73 already catches non-ok statuses.
- **Fix**: Define and use an envelope type:
  ```typescript
  interface APIResponse<T> {
      call: { status: string; };
      [key: string]: T | unknown;
  }
  ```
  Change return to unwrap: `return data as T` (but only after the `call.status` check passes).

### C18: `text-[10px]` prevents user font scaling (8 instances)

- **Status**: ❌ **Still present**
- **File**: BottomNav.tsx:32, MatchHeader.tsx:17+37, PlayerCard.tsx:42+70, StandingsTable.tsx:14, StatBadge.tsx:34, MatchPage.tsx:114
- **Issue**: 8 instances of `text-[10px]` across 6 components. Fixed `px` values override browser font-size settings, breaking zoom for users with visual impairments.
- **Fix**: Replace ALL `text-[10px]` with `text-xs` (0.75rem = 12px at default font-size). If the design genuinely needs 10px (unlikely for accessibility), use `text-[0.625rem]` which scales with user font settings.

### C20: `flex-grow` class removed in Tailwind v4

- **Status**: ❌ **Still present**
- **File**: `src/pages/Home.tsx:50`, `src/pages/MatchPage.tsx:60`
- **Issue**: `flex-grow` was an alias for `grow` in Tailwind v3 but was removed in v4. Both search inputs silently lose their grow behavior — they won't fill available space in the flex container.
- **Fix**: Replace `flex-grow` with `grow` in both files.

---

## Issues Already Fixed ✅

### C01: `any[]` → `PlayerMatchEntry[]`
- **Fixed in**: `src/types/api.ts:1-16` (new `PlayerMatchEntry` interface)
- **Fixed in**: `src/types/api.ts:23` (`matches: PlayerMatchEntry[]`)
- **Fixed in**: `src/utils/dataProcessors.ts:19` (param typed)
- **Verified**: ✅ Current source has `PlayerMatchEntry` interface with all 12 consumed fields typed. No more `any[]` leak.

### C02: Unsafe `as PlayerStats` cast removed
- **Fixed in**: `src/hooks/useMatchData.ts:49-72` (for-loop with proper object construction)
- **Verified**: ✅ `PlayerStats` object is constructed inline, no cast. `clubCrest` and `finland_raised` fields removed from interface.

### C03: `Record<string, any>` → strict union type
- **Fixed in**: `src/services/api.ts:39`
- **Verified**: ✅ `Record<string, string | number | boolean | undefined>` with `String()` conversion at line 50.

### C05: `Promise.all` → `Promise.allSettled`
- **Fixed in**: `src/services/api.ts:87-90`
- **Verified**: ✅ `Promise.allSettled` with `r.status === 'fulfilled'` check. Failed fetches push `undefined`.

### C06: AbortController added to useMatchData
- **Fixed in**: `src/hooks/useMatchData.ts:18,26-28,35,42,47`
- **Verified**: ✅ `abortRef` ref, `controller` created and stored, `controller.signal.aborted` checked after each async step.

### C08: `setData(null)` called before fetch
- **Fixed in**: `src/hooks/useMatchData.ts:30`
- **Verified**: ✅ `setData(null)` called at line 30, before `setLoading(true)` at line 31. Old data cleared instantly.

### C15: `PastMatchDetail` optional fields + fallbacks
- **Fixed in**: `src/types/api.ts:149-150` (optional `playerTeamScore`/`opponentScore`)
- **Fixed in**: `src/utils/dataProcessors.ts:65-66,69-70` (fallback `?? ""`)
- **Verified**: ✅ Fields are optional. `undefined` produces `""` not `"undefined"`.

### C17: `data?.players?.filter(...)` with null guard
- **Fixed in**: `src/pages/MatchPage.tsx:33-34`
- **Verified**: ✅ Uses `data?.players?.filter(...) ?? []` — safe against null data and null players.

### C19: `useEffect` cleanup with `mountedRef`
- **Fixed in**: `src/hooks/useMatchData.ts:19,21-23`
- **Verified**: ✅ `mountedRef` initialized to `true`, set to `false` on unmount. Checked before each `setData` call.

---

## Fix Priority Order

| Priority | Issue | Effort | Impact | Fixed? |
|----------|-------|--------|--------|--------|
| P0 | C11: Fonts not loaded | 5 min | Typography system broken | ❌ |
| P0 | C20: `flex-grow` → `grow` | 2 min | Layout broken on search inputs | ❌ |
| P0 | C14: Missing `viewport-fit=cover` | 1 min | safe-area broken on iOS | ❌ |
| P0 | C10: `lang="fi"` missing | 1 min | Screen reader misdirection | ❌ |
| P1 | C18: `text-[10px]` → `text-xs` | 10 min | Accessibility zoom broken | ❌ |
| P1 | C13: `focus:ring-0` on inputs | 5 min | Focus indicator indirect | ❌ |
| P2 | C16: API envelope type | 30 min | Type safety on API responses | ❌ |
| P2 | C07: batchFetch abort signal | 15 min | Excess API calls on abort | ❌ |
| P3 | C09: Error+Loading mutual exclusion | 5 min | Rare visual glitch | ❌ |
| P3 | C04: Remove index signatures | 20 min | Type safety (edge case) | ❌ |
| P4 | C12: `--space-*` tokens | 5 min | Cosmetic consistency | ❌ |

Total: 10 still unfixed (5 genuine CRITICALs, 3 WARNINGs, 2 INFOs)
