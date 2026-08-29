import { MATCH_STATUS } from '../types'
import type { PlayerMatchEntry } from '../types'

export interface CardSeasonStats {
    gamesPlayedThisYear: number
    goalsThisYear: number
    warningsThisYear: number
    gamesPlayedLastSeason: number
    goalsScoredLastSeason: number
}

function seasonYear(seasonId?: string, date?: string): string {
    if (seasonId && /^\d{4}/.test(seasonId)) return seasonId.slice(0, 4)
    if (date && /^\d{4}/.test(date)) return date.slice(0, 4)
    return ''
}

/** Past match: stats up to asOfDate inclusive. Upcoming / player page: asOfDate omitted = all played. */
export function cardStatsAsOf(
    matches: PlayerMatchEntry[] | undefined,
    opts: { seasonYear: string; asOfDate?: string },
): CardSeasonStats {
    const out: CardSeasonStats = {
        gamesPlayedThisYear: 0,
        goalsThisYear: 0,
        warningsThisYear: 0,
        gamesPlayedLastSeason: 0,
        goalsScoredLastSeason: 0,
    }
    const prev = opts.seasonYear ? String(parseInt(opts.seasonYear, 10) - 1) : ''
    for (const m of matches || []) {
        if (m.status !== MATCH_STATUS.PLAYED) continue
        if (opts.asOfDate && (m.date || '') > opts.asOfDate) continue
        const y = seasonYear(m.season_id, m.date)
        const goals = parseInt(m.player_goals || '0', 10) || 0
        const warnings = parseInt(m.player_warnings || '0', 10) || 0
        if (y === opts.seasonYear) {
            out.gamesPlayedThisYear++
            out.goalsThisYear += goals
            out.warningsThisYear += warnings
        } else if (y === prev) {
            out.gamesPlayedLastSeason++
            out.goalsScoredLastSeason += goals
        }
    }
    return out
}
