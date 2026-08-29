import { MATCH_STATUS } from '../types'
import type { PlayerAPIResponse, PlayerMatchEntry } from '../types'

export interface SeriesRow {
    key: string
    seasonId: string
    teamId: string
    teamName: string
    categoryName: string
    competitionName: string
    matches: number
    goals: number
    assists: number
    warnings: number
    suspensions: number
    wins: number
    draws: number
    losses: number
}

export interface SeasonBlock {
    seasonId: string
    matches: number
    goals: number
    wins: number
    draws: number
    losses: number
    series: SeriesRow[]
}

function wld(m: PlayerMatchEntry): 'V' | 'T' | 'H' {
    const isA = m.team_id === m.team_A_id
    const my = parseInt((isA ? m.fs_A : m.fs_B) || '0', 10)
    const opp = parseInt((isA ? m.fs_B : m.fs_A) || '0', 10)
    return my > opp ? 'V' : my < opp ? 'H' : 'T'
}

export function buildSeriesFromMatches(matches: PlayerMatchEntry[] | undefined): SeasonBlock[] {
    const byKey = new Map<string, SeriesRow>()
    for (const m of matches || []) {
        if (m.status !== MATCH_STATUS.PLAYED) continue
        const seasonId = m.season_id || 'unknown'
        const teamId = m.team_id || ''
        const categoryName = m.category_name || ''
        const key = `${seasonId}|${teamId}|${categoryName}`
        let row = byKey.get(key)
        if (!row) {
            row = {
                key,
                seasonId,
                teamId,
                teamName: m.team_name || (m.team_id === m.team_A_id ? m.team_A_name : m.team_B_name) || teamId,
                categoryName,
                competitionName: m.competition_name || '',
                matches: 0,
                goals: 0,
                assists: 0,
                warnings: 0,
                suspensions: 0,
                wins: 0,
                draws: 0,
                losses: 0,
            }
            byKey.set(key, row)
        }
        row.matches++
        row.goals += parseInt(m.player_goals || '0', 10) || 0
        row.assists += parseInt((m as { player_assists?: string }).player_assists || '0', 10) || 0
        row.warnings += parseInt(m.player_warnings || '0', 10) || 0
        row.suspensions += parseInt(m.player_suspensions || '0', 10) || 0
        const r = wld(m)
        if (r === 'V') row.wins++
        else if (r === 'H') row.losses++
        else row.draws++
    }
    const bySeason = new Map<string, SeasonBlock>()
    for (const row of byKey.values()) {
        let s = bySeason.get(row.seasonId)
        if (!s) {
            s = { seasonId: row.seasonId, matches: 0, goals: 0, wins: 0, draws: 0, losses: 0, series: [] }
            bySeason.set(row.seasonId, s)
        }
        s.series.push(row)
        s.matches += row.matches
        s.goals += row.goals
        s.wins += row.wins
        s.draws += row.draws
        s.losses += row.losses
    }
    for (const s of bySeason.values()) {
        s.series.sort((a, b) => b.matches - a.matches || a.categoryName.localeCompare(b.categoryName))
    }
    return [...bySeason.values()].sort((a, b) => b.seasonId.localeCompare(a.seasonId))
}

export function currentTeams(player: PlayerAPIResponse | null): Array<{ teamId: string; teamName: string; level: string }> {
    const teams = (player as { teams?: Array<{ team_id: string; team_name: string; primary_category?: { category_name?: string; competition_name?: string } }> })?.teams || []
    return teams.map(t => ({
        teamId: t.team_id,
        teamName: t.team_name,
        level: [t.primary_category?.category_name, t.primary_category?.competition_name].filter(Boolean).join(' · '),
    }))
}
