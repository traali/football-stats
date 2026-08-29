import { MATCH_STATUS } from '../types'
import type { PlayerMatchEntry } from '../types'

export interface CardSeriesRow {
    category: string
    half: 'kevät' | 'syksy' | ''
    matches: number
    goals: number
    warnings: number
}

export interface CardSeasonStats {
    gamesPlayedThisYear: number
    goalsThisYear: number
    warningsThisYear: number
    gamesPlayedLastSeason: number
    goalsScoredLastSeason: number
    seriesThisYear: CardSeriesRow[]
}

function seasonYear(seasonId?: string, date?: string): string {
    if (seasonId && /^\d{4}/.test(seasonId)) return seasonId.slice(0, 4)
    if (date && /^\d{4}/.test(date)) return date.slice(0, 4)
    return ''
}

function halfOf(date?: string): 'kevät' | 'syksy' | '' {
    if (!date || date.length < 7) return ''
    const month = parseInt(date.slice(5, 7), 10)
    if (!month) return ''
    return month <= 6 ? 'kevät' : 'syksy'
}

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
        seriesThisYear: [],
    }
    const prev = opts.seasonYear ? String(parseInt(opts.seasonYear, 10) - 1) : ''
    const byKey = new Map<string, CardSeriesRow>()
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
            const half = halfOf(m.date)
            const category = m.category_name || 'Sarja'
            const key = `${category}|${half}`
            const row = byKey.get(key) || { category, half, matches: 0, goals: 0, warnings: 0 }
            row.matches++
            row.goals += goals
            row.warnings += warnings
            byKey.set(key, row)
        } else if (y === prev) {
            out.gamesPlayedLastSeason++
            out.goalsScoredLastSeason += goals
        }
    }
    out.seriesThisYear = [...byKey.values()].sort((a, b) => b.matches - a.matches || a.category.localeCompare(b.category))
    return out
}
