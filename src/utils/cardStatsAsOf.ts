import { MATCH_STATUS } from '../types'
import type { PlayerMatchEntry } from '../types'
import { halfOf } from './dates'

export interface CardSeriesRow {
    category: string
    half: 'kevät' | 'syksy' | ''
    teamName: string
    matches: number
    goals: number
    warnings: number
    wins: number
    draws: number
    losses: number
    gf: number
    ga: number
    latestDate?: string
    results?: Array<{ result: 'V' | 'T' | 'H'; date: string }>
}

export interface CardSeasonStats {
    gamesPlayedThisYear: number
    goalsThisYear: number
    warningsThisYear: number
    gamesPlayedLastSeason: number
    goalsScoredLastSeason: number
    gamesLast14Days: number
    seriesThisYear: CardSeriesRow[]
}

function seasonYear(seasonId?: string, date?: string): string {
    if (seasonId && /^\d{4}/.test(seasonId)) return seasonId.slice(0, 4)
    if (date && /^\d{4}/.test(date)) return date.slice(0, 4)
    return ''
}

function scorePair(m: PlayerMatchEntry): { my: number; opp: number } | null {
    const isA = m.team_id === m.team_A_id
    const my = parseInt((isA ? m.fs_A : m.fs_B) || '', 10)
    const opp = parseInt((isA ? m.fs_B : m.fs_A) || '', 10)
    if (Number.isNaN(my) || Number.isNaN(opp)) return null
    return { my, opp }
}

export function cardStatsAsOf(
    matches: PlayerMatchEntry[] | undefined,
    opts: {
        seasonYear: string
        seasonHalf?: 'kevät' | 'syksy' | 'all'
        preferredHalf?: 'kevät' | 'syksy'
        asOfDate?: string
        refDate?: string
    },
): CardSeasonStats {
    const out: CardSeasonStats = {
        gamesPlayedThisYear: 0,
        goalsThisYear: 0,
        warningsThisYear: 0,
        gamesPlayedLastSeason: 0,
        goalsScoredLastSeason: 0,
        gamesLast14Days: 0,
        seriesThisYear: [],
    }
    const refDate = opts.refDate || new Date().toISOString().slice(0, 10)
    const refTime = new Date(refDate).getTime()
    const fourteenDaysAgo = new Date(refTime - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const prev = opts.seasonYear ? String(parseInt(opts.seasonYear, 10) - 1) : ''
    const byKey = new Map<string, CardSeriesRow>()
    for (const m of matches || []) {
        const isPlayed = m.status === MATCH_STATUS.PLAYED || m.status === 'Played' || m.status === 'played' || m.status === '1'
        if (!isPlayed) continue

        if (m.date && m.date >= fourteenDaysAgo && m.date <= refDate) {
            out.gamesLast14Days++
        }

        if (opts.asOfDate && (m.date || '') > opts.asOfDate) continue
        const y = seasonYear(m.season_id, m.date)
        const goals = parseInt(m.player_goals || '0', 10) || 0
        const warnings = parseInt(m.player_warnings || '0', 10) || 0
        if (y === opts.seasonYear) {
            const half = halfOf(m.date)
            if (opts.seasonHalf && opts.seasonHalf !== 'all' && half !== opts.seasonHalf) {
                continue
            }
            out.gamesPlayedThisYear++
            out.goalsThisYear += goals
            out.warningsThisYear += warnings
            const category = m.category_name || 'Sarja'
            const teamName = m.team_name || (m.team_id === m.team_A_id ? m.team_A_name : m.team_B_name) || ''
            const key = `${category}|${half}|${teamName}`
            const row = byKey.get(key) || {
                category, half, teamName, matches: 0, goals: 0, warnings: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0,
            }
            row.matches++
            row.goals += goals
            row.warnings += warnings
            const mDate = m.date || ''
            if (mDate && (!row.latestDate || mDate > row.latestDate)) {
                row.latestDate = mDate
            }
            const pair = scorePair(m)
            if (pair) {
                row.gf += pair.my
                row.ga += pair.opp
                const res: 'V' | 'T' | 'H' = pair.my > pair.opp ? 'V' : pair.my < pair.opp ? 'H' : 'T'
                if (res === 'V') row.wins++
                else if (res === 'H') row.losses++
                else row.draws++
                row.results = row.results || []
                row.results.push({ result: res, date: mDate })
            }
            byKey.set(key, row)
        } else if (y === prev) {
            out.gamesPlayedLastSeason++
            out.goalsScoredLastSeason += goals
        }
    }

    for (const row of byKey.values()) {
        if (row.results) {
            row.results.sort((a, b) => b.date.localeCompare(a.date))
        }
    }

    const prefHalf = opts.preferredHalf || (opts.seasonHalf && opts.seasonHalf !== 'all' ? opts.seasonHalf : undefined)

    out.seriesThisYear = [...byKey.values()].sort((a, b) => {
        if (prefHalf) {
            const aIsPref = a.half === prefHalf ? 1 : 0
            const bIsPref = b.half === prefHalf ? 1 : 0
            if (aIsPref !== bIsPref) {
                return bIsPref - aIsPref
            }
        }
        const dateA = a.latestDate || ''
        const dateB = b.latestDate || ''
        if (dateA !== dateB) {
            return dateB.localeCompare(dateA)
        }
        return b.matches - a.matches || a.category.localeCompare(b.category)
    })
    return out
}
