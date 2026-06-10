# Code Review: football-stats (code-1)

**Model**: `opencode/mimo-v2.5-free`
**Date**: 2026-06-10T19:14:35Z
**Commit**: `af4273d`
**Agent**: code-1

---

## CRITICAL: `any` type in `PlayerAPIResponse.matches`

- **File**: `src/types/api.ts:6`
- **Issue**: `matches: any[]` provides zero type safety for player match history data. Every consumer (`processPlayerMatchHistory`) operates on untyped data, silently accepting malformed shapes.
- **Suggestion**: Define a `PlayerMatch` interface (e.g. `{ season_id: string; status: string; player_goals: string; player_warnings: string; player_suspensions: string; team_name: string; team_id: string; team_A_name?: string; team_A_id?: string; team_B_name?: string; fs_A?: string; fs_B?: string; winner_id?: string; date: string; }`) and use `matches: PlayerMatch[]`.

## CRITICAL: `any` type in `fetchAPIData` params

- **File**: `src/services/api.ts:39`
- **Issue**: `params: Record<string, any>` allows passing non-stringifiable values (objects, arrays, booleans, numbers) to `URLSearchParams`, which will silently coerce them to `[object Object]` or `"true"`, producing wrong API queries.
- **Suggestion**: Change to `Record<string, string | number | boolean | undefined>` and convert values with `String(val)` before passing to `URLSearchParams`.

## CRITICAL: `any` type in `processPlayerMatchHistory` matches param

- **File**: `src/utils/dataProcessors.ts:19`
- **Issue**: `matches: any[]` forces all downstream field accesses (`match.player_goals`, `match.season_id`, etc.) to be unvalidated. A typo in any field name silently returns `undefined` → `NaN`.
- **Suggestion**: Accept `PlayerMatch[]` (the same type from finding #1). Add runtime validation or at minimum a typed parameter.

## CRITICAL: Unsafe `as PlayerStats` assertion

- **File**: `src/hooks/useMatchData.ts:55`
- **Issue**: The constructed object is cast with `as PlayerStats` without verifying all required fields are present. The `processedHistory` spread can include `undefined` fields if `processPlayerMatchHistory` returns incomplete data (e.g. `teamsThisYear` is always a string, but numeric fields default to 0). The `clubCrest`, `finland_raised`, `gamesPlayedThisYear`, `goalsThisYear`, `warningsThisYear`, `suspensionsThisYear`, `gamesPlayedLastSeason`, `goalsScoredLastSeason` fields are all guaranteed by the spread, but `playerData` fields (`birthyear`, `img_url`) could be undefined at runtime if API returns malformed data.
- **Suggestion**: Remove the `as` assertion. Either validate with a type guard or ensure the object literal satisfies the interface by providing explicit defaults for all optional fields.

## WARNING: Unused import `APP_CONFIG` in `dataProcessors.ts`

- **File**: `src/utils/dataProcessors.ts:1`
- **Issue**: `APP_CONFIG` is imported but never referenced anywhere in the file. The `currentSeasonId` and `previousSeasonId` are passed as parameters instead.
- **Suggestion**: Remove the unused import: `import { APP_CONFIG } from '../types/config';`

## WARNING: Duplicated `cn()` utility function

- **File**: `src/components/BottomNav.tsx:6`, `src/components/StatBadge.tsx:5`, `src/components/Skeleton.tsx:4`, `src/components/PlayerCard.tsx:8`, `src/components/Button.tsx:6`
- **Issue**: The `cn` function is copy-pasted identically in 5 separate component files. Any bug fix or enhancement must be applied in all 5 places.
- **Suggestion**: Extract to a shared utility file (e.g. `src/utils/cn.ts`) and import from there.

## WARNING: Hardcoded match ID in BottomNav

- **File**: `src/components/BottomNav.tsx:12`
- **Issue**: `{ to: '/match/3760372', label: 'Ottelu', icon: Search }` hardcodes a specific match ID. This is likely debug/test data left in production code.
- **Suggestion**: Either remove the "Ottelu" nav item entirely (the Home page already has a search form), or make it navigate to the last viewed match via state/localStorage, or simply link to `/match/` without an ID.

## WARNING: Missing `focus-visible` ring on `Link` in NotFound

- **File**: `src/pages/NotFound.tsx:9`
- **Issue**: The `<Link>` element lacks `focus-visible:ring-2 ring-accent/50` styling. Per AGENTS.md conventions: "Interactive elements: focus-visible:ring-2 ring-accent/50".
- **Suggestion**: Add `focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none` to the Link's className.

## WARNING: `fetchAPIData` URLSearchParams silently coerces non-string values

- **File**: `src/services/api.ts:48`
- **Issue**: `new URLSearchParams(params).toString()` will coerce numbers and booleans to strings, but if `params` contains an object or array value, it becomes `[object Object]`. The `Record<string, any>` type enables this.
- **Suggestion**: After changing the type (see CRITICAL #2), add explicit `String()` conversion: `Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))`.

## WARNING: PlayerCard image `onError` hides element permanently

- **File**: `src/components/PlayerCard.tsx:34`
- **Issue**: `onError={(e) => (e.currentTarget.style.display = 'none')}` permanently hides the image element in the DOM, even if the src changes on re-render. It also removes the space the image occupied, causing layout shift.
- **Suggestion**: Use React state (`const [imgError, setImgError] = useState(false)`) to conditionally render the fallback. This allows React to properly handle re-renders and avoids direct DOM manipulation.

## WARNING: `processPlayerMatchHistory` doesn't distinguish draw vs. fixture in `resultIndicator`

- **File**: `src/utils/dataProcessors.ts:61`
- **Issue**: `resultIndicator` is initialized to `'draw'` but for "Fixture" status matches (line 89-99), it's set to `'fixture'`. However, for "Played" matches where `winner_id` is missing/`"0"`/`"-"`, the result stays `'draw'` even if the scores indicate a win/loss (e.g. if `winner_id` is absent but `fs_A > fs_B`). This is a logic gap.
- **Suggestion**: When `winner_id` is not available, fall back to comparing `playerTeamScore` and `opponentScore` (after parseInt) to determine win/loss/draw.

## WARNING: `PlayerCard` key uses `name + shirtNumber` which may not be unique

- **File**: `src/pages/MatchPage.tsx:133,150`
- **Issue**: `key={player.name + player.shirtNumber}` can collide if two players share the same name and shirt number across different teams (unlikely but possible in data errors), or if a player appears in both team rosters in the data.
- **Suggestion**: Use `player.teamIdInMatch + player.shirtNumber` or include `player.birthYear` for better uniqueness.

## WARNING: `fetchAPIData` error handling catches but ignores JSON parse errors

- **File**: `src/services/api.ts:64`
- **Issue**: The `catch (e) { /* ignore */ }` silently swallows the error when `response.json()` fails on error responses. The `e` variable is unused and the empty catch block may trigger lint warnings.
- **Suggestion**: At minimum, add a comment or use `catch { /* non-JSON error response */ }` (ES2019 optional catch binding) to avoid unused variable warnings.

## INFO: `cn` utility inconsistency — no barrel export

- **File**: `src/utils/` (missing `cn.ts`)
- **Issue**: Five components each define their own `cn` function. There is no `src/utils/` barrel or `cn.ts` file despite the directory existing for `dataProcessors.ts`.
- **Suggestion**: Create `src/utils/cn.ts` with `export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }` and update all imports.

## INFO: `BottomNav` nav items should be configurable or dynamic

- **File**: `src/components/BottomNav.tsx:10-13`
- **Issue**: `navItems` is a module-level constant with hardcoded routes. The "Ottelu" link points to a specific match, not a generic route.
- **Suggestion**: Consider making the nav items configurable via props or context, or remove the hardcoded match link.

## INFO: `match.time` live detection is fragile

- **File**: `src/components/MatchHeader.tsx:23`
- **Issue**: `const isLive = !!(match.time && match.time.includes("'"))` assumes live matches have an apostrophe in the time field (e.g. `"45'"`). This is a convention-specific heuristic that may break if the API changes format.
- **Suggestion**: Consider using the `status` field from `DiscoveryMatch` or a dedicated `is_live` flag if the API provides one.

## INFO: No test files found

- **File**: (project-wide)
- **Issue**: No test files (`*.test.ts`, `*.test.tsx`, `*.spec.ts`) were found in the project. There is no test script in `package.json` either.
- **Suggestion**: Add unit tests for critical business logic in `processPlayerMatchHistory` and `dataProcessors.ts`, plus component tests for `PlayerCard` and `MatchHeader`.

## INFO: `StandingTeam` interface uses all string types for numeric fields

- **File**: `src/types/api.ts:73-85`
- **Issue**: Fields like `matches_played`, `matches_won`, `goals_for`, `points` are typed as `string` but represent numeric data. This requires `parseInt()` at every consumption site (e.g. `StandingsTable.tsx:5`).
- **Suggestion**: If the API always returns strings, keep as-is but document this. If the API can return numbers, use `string | number` and normalize at the API boundary.

## INFO: `motion.tr` may have limited animation support

- **File**: `src/components/StandingsTable.tsx:29`
- **Issue**: Framer Motion's `motion.tr` has limited animation capabilities compared to `motion.div`. The `className` switching between `"bg-accent-muted"` and `"hover:bg-surface-2"` won't animate smoothly — it snaps.
- **Suggestion**: If a transition effect is desired, use `motion.tr` with `layout` prop or switch to `motion.div` with `role="row"` for better animation support.

## INFO: `Main.tsx` uses non-null assertion on `getElementById`

- **File**: `src/main.tsx:6`
- **Issue**: `document.getElementById('root')!` uses a non-null assertion. If `index.html` doesn't have a `root` element, this crashes at runtime with an unhelpful error.
- **Suggestion**: Add a fallback: `const root = document.getElementById('root'); if (!root) throw new Error('Root element not found'); root.render(...)`.
