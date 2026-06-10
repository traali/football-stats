## CRITICAL: `PlayerAPIResponse.matches` typed as `any[]`
- **File**: `src/types/api.ts` :6
- **Issue**: The `matches` field is `any[]`, discarding all type safety. Downstream in `src/utils/dataProcessors.ts:39-106` the code accesses `match.player_goals`, `match.player_warnings`, `match.season_id`, `match.team_name`, `match.team_id`, `match.team_A_name`, `match.team_B_name`, `match.team_A_id`, `match.fs_A`, `match.fs_B`, `match.winner_id`, `match.date`, `match.status`, `match.match_id` — none of which are validated by the compiler.
- **Suggestion**: Define `PlayerMatchEntry` with all consumed fields and replace `any[]` with `PlayerMatchEntry[]`.

## WARNING: `MatchSummary` required fields the API may omit/null
- **File**: `src/types/api.ts` :95-96
- **Issue**: `fs_A`, `fs_B` are required `string` but the Torneopal API can omit them or return `null` for unplayed matches. Same for `winner_id` (line 97: required, but null for draws/unplayed) and `status` (line 98: required).
- **Suggestion**: Change to `fs_A?: string`, `fs_B?: string`, `winner_id?: string`, `status?: string`.

## WARNING: `StandingTeam` all fields required — fragile for zero-game teams
- **File**: `src/types/api.ts` :73-85
- **Issue**: A newly created group may have teams with zero matches; the API could omit `matches_played`, `goals_for`, `goals_diff`, `points`, etc. or return them as null. All fields are typed as required `string`.
- **Suggestion**: Make numeric-derived fields optional (`matches_played?: string`, `goals_for?: string`, `goals_against?: string`, `goals_diff?: string`, `points?: string`).

## WARNING: `string?` fields may receive `null` from API, not `undefined`
- **File**: `src/types/api.ts` :19-20, 22, 53-62, 82
- **Issue**: Fields like `fs_A?: string`, `time?: string`, `captain?: string`, `position_fi?: string` are typed `string | undefined`. If the Torneopal API returns explicit JSON `null` (which it commonly does), TypeScript considers the type satisfied but the runtime value is `null`, not `undefined`. This can cause bugs in comparisons like `lineupInfo.captain === "1"` (null ≠ "1", safe here) or template expressions.
- **Suggestion**: Use `fs_A?: string | null` pattern, or add a runtime coercion layer (e.g. `?? undefined`) at the API boundary.

## INFO: `[key: string]: unknown` index signature usage
- **File**: `src/types/api.ts` :7, 35, 42, 49, 117, 129
- **Issue**: `PlayerAPIResponse`, `Competition`, `Category`, `Season`, `DiscoveryMatch`, `ScoreEntry` all include `[key: string]: unknown`. While this correctly allows unknown API fields, it also silently masks any misspelled property access (the return type is `unknown`, so you get a `unknown` value rather than a type error). On `PlayerAPIResponse` specifically, it hides the `any[]` on `matches` because the index signature makes the type "wider" without narrowing the known field.
- **Suggestion**: Consider removing the index signature where all known fields are already captured; otherwise keep it but be aware it weakens type checking on known-key access. At minimum, combine with a proper type for `matches`.

## INFO: No envelope type for `call` wrapper
- **File**: `src/services/api.ts` :69-71
- **Issue**: `fetchAPIData` reads `data.call.status` and validates it, but the `call` wrapper is not represented in any TypeScript type. The generic `T` only captures the inner data payload.
- **Suggestion**: Define `interface ApiEnvelope<T> { call: { status: string }; data?: T }` or similar, and type the parse step, so callers know the envelope shape is handled.

## INFO: `ScoreEntry` all fields optional — overly loose
- **File**: `src/types/api.ts` :120-130
- **Issue**: Every field in `ScoreEntry` is optional. If the API consistently returns `match_id`, `fs_A`, `fs_B`, these should be required.
- **Suggestion**: Check real API output — likely `match_id`, `fs_A`, `fs_B`, `status` are always present; make required where guaranteed.
