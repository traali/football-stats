import { MATCH_STATUS } from '../types'
import type { DiscoveryMatch, PlayerMatchEntry } from '../types'
import { getCurrentSeason, halfOf } from './dates'

export type CardGameResult = 'V' | 'T' | 'H' | 'DNP'

export interface CardGameBox {
    result: CardGameResult
    date: string
    matchId?: string
    opponent?: string
}

export interface CardSeriesRow {
    category: string
    half: 'kevät' | 'syksy' | ''
    teamId?: string
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
    results?: CardGameBox[]
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

function opponentOf(m: { team_id?: string; team_A_id?: string; team_A_name?: string; team_B_name?: string }): string {
    return m.team_id === m.team_A_id ? (m.team_B_name || '') : (m.team_A_name || '')
}

function isPlayedStatus(status?: string): boolean {
    return status === MATCH_STATUS.PLAYED || status === 'Played' || status === 'played' || status === '1'
}

/** Grey DNP boxes: team played, player did not. Newest first. */
export function mergeTeamGamesAsDnp(
    row: CardSeriesRow,
    teamMatches: Array<Pick<DiscoveryMatch, 'match_id' | 'date' | 'status' | 'team_A_id' | 'team_B_id' | 'team_A_name' | 'team_B_name' | 'fs_A' | 'fs_B'>>,
    playerMatchIds: Set<string>,
    seasonY: string,
): void {
    if (!row.teamId) return
    const extras: CardGameBox[] = []
    for (const tm of teamMatches) {
        if (!isPlayedStatus(tm.status)) continue
        if (seasonYear(undefined, tm.date) !== seasonY) continue
        if (halfOf(tm.date) !== row.half) continue
        if (tm.team_A_id !== row.teamId && tm.team_B_id !== row.teamId) continue
        if (playerMatchIds.has(tm.match_id)) continue
        extras.push({
            result: 'DNP',
            date: tm.date || '',
            matchId: tm.match_id,
            opponent: tm.team_A_id === row.teamId ? tm.team_B_name : tm.team_A_name,
        })
    }
    if (!extras.length) return
    row.results = [...(row.results || []), ...extras].sort((a, b) => b.date.localeCompare(a.date))
}

export function cardStatsAsOf(
    matches: PlayerMatchEntry[] | undefined,
    opts: {
        seasonYear: string
        seasonHalf?: 'kevät' | 'syksy' | 'all'
        preferredHalf?: 'kevät' | 'syksy'
        asOfDate?: string
        refDate?: string
        teamMatchesByTeamId?: Record<string, DiscoveryMatch[]>
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
    const playerMatchIds = new Set<string>()

    for (const m of matches || []) {
        const isPlayed = isPlayedStatus(m.status)
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
            if (m.match_id) playerMatchIds.add(m.match_id)
            out.gamesPlayedThisYear++
            out.goalsThisYear += goals
            out.warningsThisYear += warnings
            const category = m.category_name || 'Sarja'
            const teamName = m.team_name || (m.team_id === m.team_A_id ? m.team_A_name : m.team_B_name) || ''
            const teamId = m.team_id || ''
            const key = `${category}|${half}|${teamId || teamName}`
            const row = byKey.get(key) || {
                category, half, teamId, teamName, matches: 0, goals: 0, warnings: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0,
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
                const res: CardGameResult = pair.my > pair.opp ? 'V' : pair.my < pair.opp ? 'H' : 'T'
                if (res === 'V') row.wins++
                else if (res === 'H') row.losses++
                else row.draws++
                row.results = row.results || []
                row.results.push({ result: res, date: mDate, matchId: m.match_id, opponent: opponentOf(m) })
            }
            byKey.set(key, row)
        } else if (y === prev) {
            out.gamesPlayedLastSeason++
            out.goalsScoredLastSeason += goals
        }
    }

    const current = getCurrentSeason()
    const prefHalf = opts.preferredHalf
        || (opts.seasonHalf && opts.seasonHalf !== 'all' ? opts.seasonHalf : undefined)
        || current.half

    for (const row of byKey.values()) {
        if (opts.teamMatchesByTeamId && row.teamId) {
            mergeTeamGamesAsDnp(row, opts.teamMatchesByTeamId[row.teamId] || [], playerMatchIds, opts.seasonYear)
        } else if (row.results) {
            row.results.sort((a, b) => b.date.localeCompare(a.date))
        }
    }

    out.seriesThisYear = [...byKey.values()].sort((a, b) => {
        const aIsPref = a.half === prefHalf ? 1 : 0
        const bIsPref = b.half === prefHalf ? 1 : 0
        if (aIsPref !== bIsPref) return bIsPref - aIsPref
        const dateA = a.latestDate || ''
        const dateB = b.latestDate || ''
        if (dateA !== dateB) return dateB.localeCompare(dateA)
        return b.matches - a.matches || a.category.localeCompare(b.category)
    })
    return out
}
