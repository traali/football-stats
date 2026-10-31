import type { StandingTeam } from '../types'
import type { RowMatch } from '../components/MatchRow'
import {
    playingMinutesFromInfo,
    type FudisGroup,
    type FudisGroupMatch,
    type FudisPlayoffMatch,
    type FudisTournament,
    type FudisMatchTeam,
} from './fudisturnaus'
import { HELSINKI_TZ } from '../domain/matchState'

const helsinkiParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: HELSINKI_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
})

export function helsinkiDateTime(isoUtc: string): { date: string; time: string } {
    const d = new Date(isoUtc)
    if (!Number.isFinite(d.getTime())) return { date: '', time: '' }
    const parts = Object.fromEntries(helsinkiParts.formatToParts(d).filter(p => p.type !== 'literal').map(p => [p.type, p.value]))
    return {
        date: `${parts.year}-${parts.month}-${parts.day}`,
        time: `${parts.hour}:${parts.minute}`,
    }
}

/** Non-numeric id so MatchRow does not link into the Taso match page. */
export function fudisMatchRowId(id: number | string): string {
    return `fudis-${id}`
}

function teamSide(t?: FudisMatchTeam | null, fallbackName?: string): { id: string; name: string } {
    if (t && t.id != null) return { id: String(t.id), name: String(t.name || fallbackName || '') }
    return { id: '', name: String(fallbackName || '') }
}

export function groupStageToRow(m: FudisGroupMatch, playingMin: number): RowMatch {
    const { date, time } = helsinkiDateTime(m.startTime)
    const home = teamSide(m.homeTeam)
    const away = teamSide(m.awayTeam)
    const done = m.homeGoals != null && m.awayGoals != null
    return {
        match_id: fudisMatchRowId(m.id),
        date: date || m.date || '',
        time,
        team_A_id: home.id,
        team_B_id: away.id,
        team_A_name: home.name,
        team_B_name: away.name,
        status: done ? 'Played' : 'Fixture',
        fs_A: done ? m.homeGoals : null,
        fs_B: done ? m.awayGoals : null,
        playing_time_min: String(playingMin),
    }
}

/** Resolve A3/B2-style playoff slots from group results when the API has not filled homeTeam yet. */
export function resolvePlayoffSides(
    d: FudisTournament,
    m: FudisPlayoffMatch,
): { home: { id: string; name: string }; away: { id: string; name: string }; label: string } {
    const title = String(m.title || '')
    const parsed = /^([A-Za-zÄÖÅäöå])(\d+)\s*[-–]\s*([A-Za-zÄÖÅäöå])(\d+)/.exec(title)
    const label = title
    if (m.homeTeam && m.awayTeam) {
        return { home: teamSide(m.homeTeam), away: teamSide(m.awayTeam), label }
    }
    const resolve = (originId: number | undefined, rank: number | undefined, letter: string) => {
        if (originId == null || rank == null) return { id: '', name: `${letter}${rank ?? ''}` }
        const g = d.groups.find(x => x.id === originId)
        if (!g) return { id: '', name: `${letter}${rank}` }
        const allDone = (d.groupStageMatches || [])
            .filter(gm => gm.groupId === originId)
            .every(gm => gm.homeGoals != null && gm.awayGoals != null)
        if (!allDone || !Array.isArray(g.results) || g.results.length === 0) {
            return { id: '', name: `${letter}${rank}` }
        }
        const row = g.results.find(r => r.ranking === rank)
        if (!row) return { id: '', name: `${letter}${rank}` }
        return { id: String(row.teamId), name: row.teamName }
    }
    if (parsed) {
        return {
            home: resolve(m.homeTeamOriginId, Number(parsed[2]), parsed[1]),
            away: resolve(m.awayTeamOriginId, Number(parsed[4]), parsed[3]),
            label,
        }
    }
    return {
        home: teamSide(m.homeTeam, 'Koti'),
        away: teamSide(m.awayTeam, 'Vieras'),
        label,
    }
}

export function playoffToRow(d: FudisTournament, m: FudisPlayoffMatch, playingMin: number): RowMatch & { playoffTitle: string } {
    const { date, time } = helsinkiDateTime(m.startTime)
    const sides = resolvePlayoffSides(d, m)
    const done = m.homeGoals != null && m.awayGoals != null
    return {
        match_id: fudisMatchRowId(m.id),
        date: date || m.date || '',
        time,
        team_A_id: sides.home.id,
        team_B_id: sides.away.id,
        team_A_name: sides.home.name,
        team_B_name: sides.away.name,
        status: done ? 'Played' : 'Fixture',
        fs_A: done ? m.homeGoals : null,
        fs_B: done ? m.awayGoals : null,
        playing_time_min: String(playingMin),
        playoffTitle: sides.label,
    }
}

/** Use the tables fudisturnaus already computed — never invent points. */
export function groupResultsToStanding(g: FudisGroup): StandingTeam[] {
    if (!Array.isArray(g.results)) return []
    return g.results.map(r => ({
        team_id: String(r.teamId),
        team_name: r.teamName,
        current_standing: r.ranking,
        matches_played: r.matches,
        matches_won: r.wins,
        matches_tied: r.draws,
        matches_lost: r.losses,
        goals_for: r.goalsFor,
        goals_against: r.goalsAgainst,
        goals_diff: r.goalsFor - r.goalsAgainst,
        points: r.points,
    }))
}

export function shortGroupName(name: string): string {
    const m = /^(Lohko\s+\S+)/i.exec(name.trim())
    return m ? m[1] : name
}

export function buildFudisView(d: FudisTournament) {
    const playingMin = playingMinutesFromInfo(d.info)
    const groupRows = (d.groupStageMatches || []).map(m => ({
        ...groupStageToRow(m, playingMin),
        groupId: m.groupId,
        groupName: m.group?.name || '',
        fieldName: m.field?.name || '',
        kind: 'group' as const,
    }))
    const playoffRows = (d.playoffMatches || []).map(m => {
        const row = playoffToRow(d, m, playingMin)
        return {
            ...row,
            groupId: 0,
            groupName: row.playoffTitle,
            fieldName: m.field?.name || '',
            kind: 'playoff' as const,
            originHome: m.homeTeamOriginId,
            originAway: m.awayTeamOriginId,
        }
    })
    const all = [...groupRows, ...playoffRows].sort((a, b) => {
        const ka = `${a.date} ${a.time || '99:99'}`
        const kb = `${b.date} ${b.time || '99:99'}`
        return ka.localeCompare(kb)
    })
    return { playingMin, all, groupRows, playoffRows }
}

export type FudisViewMatch = ReturnType<typeof buildFudisView>['all'][number]
