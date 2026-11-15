import type { PlayerMatchEntry } from '../types'

/**
 * Per-player stats split by competition type, built only from the player's own
 * Taso getPlayer `matches` (every registration: football, futsal, club tournaments).
 * A stat is left undefined when Taso does not record it, so the UI hides it instead of showing 0.
 */
export type CompKind = 'football' | 'winter' | 'futsal'

export interface SplitRow {
    games: number
    goals?: number
    assists?: number
    warnings?: number
    suspensions?: number
    minutes?: number
}

export interface PlayerSplit {
    football: SplitRow
    winter: SplitRow
    futsal: SplitRow
    total: SplitRow
    /** Season labels used for each row, e.g. "2026", "2026–27". */
    labels: Record<CompKind, string>
}

type M = PlayerMatchEntry & {
    sport_id?: string
    organiser?: string
    not_participated?: string
    player_stats_visibility?: string
    category_playing_time?: string
    playing_time_min?: string | number
}

/**
 * Classified from Taso's own fields: `sport_id` (futsal / football) and the competition.
 * Winterliiga is the KäPa-organised winter series (competition_id `kapa_*`, organiser `kapa`,
 * competition_name "Winterliiga …"); every other football competition counts as Jalkapallo.
 */
export function competitionKind(m: M): CompKind | null {
    const sport = String(m.sport_id || '')
    if (sport === 'futsal') return 'futsal'
    if (sport && sport !== 'football') return null
    const cid = String(m.competition_id || '')
    if (/^kapa_/i.test(cid) || String(m.organiser || '') === 'kapa' || /winterliiga/i.test(String(m.competition_name || ''))) return 'winter'
    return 'football'
}

/** Football season = calendar year; futsal and Winterliiga = 1.7.Y – 30.6.Y+1. */
export function seasonWindow(kind: CompKind, year: string): [string, string] {
    const y = parseInt(year, 10)
    if (kind === 'football') return [`${y}-01-01`, `${y}-12-31`]
    return [`${y}-07-01`, `${y + 1}-06-30`]
}

export function seasonLabel(kind: CompKind, year: string): string {
    if (kind === 'football') return year
    const y = parseInt(year, 10)
    return `${y}–${String(y + 1).slice(2)}`
}

const num = (v: unknown): number | undefined => {
    if (v === undefined || v === null || v === '') return undefined
    const n = Number(v)
    return Number.isFinite(n) ? n : undefined
}

function emptyAcc() {
    return { games: 0, goals: 0, goalsSeen: false, assists: 0, warnings: 0, warningsSeen: false, suspensions: 0, minutes: 0, minutesSeen: false }
}
type Acc = ReturnType<typeof emptyAcc>

function finish(a: Acc): SplitRow {
    const row: SplitRow = { games: a.games }
    if (a.games === 0) return row
    if (a.goalsSeen) row.goals = a.goals
    if (a.warningsSeen) row.warnings = a.warnings
    // Taso fills assists / reds / minutes with "0" even where nobody records them,
    // so a zero there is not data: show them only when something was recorded.
    if (a.assists > 0) row.assists = a.assists
    if (a.suspensions > 0) row.suspensions = a.suspensions
    if (a.minutesSeen && a.minutes > 0) row.minutes = a.minutes
    return row
}

export function playerSplit(matches: M[] | undefined, year: string): PlayerSplit {
    const acc: Record<CompKind, Acc> = { football: emptyAcc(), winter: emptyAcc(), futsal: emptyAcc() }
    const seen = new Set<string>()
    for (const m of matches || []) {
        if (String(m.status || '') !== 'Played') continue
        if (String(m.not_participated || '0') === '1') continue
        if (m.match_id) { if (seen.has(m.match_id)) continue; seen.add(m.match_id) }
        const kind = competitionKind(m)
        if (!kind || !m.date) continue
        const [from, to] = seasonWindow(kind, year)
        const d = m.date.slice(0, 10)
        if (d < from || d > to) continue
        const a = acc[kind]
        a.games++
        const visible = String(m.player_stats_visibility || 'all') !== 'none'
        const g = num(m.player_goals)
        if (visible && g !== undefined) { a.goals += g; a.goalsSeen = true }
        const w = num(m.player_warnings)
        if (visible && w !== undefined) { a.warnings += w; a.warningsSeen = true }
        a.assists += num(m.player_assists) || 0
        a.suspensions += num(m.player_suspensions) || 0
        if (String(m.category_playing_time || '0') === '1') {
            const mins = num(m.playing_time_min)
            if (mins !== undefined) { a.minutes += mins; a.minutesSeen = true }
        }
    }
    const football = finish(acc.football)
    const winter = finish(acc.winter)
    const futsal = finish(acc.futsal)
    const rows = [football, winter, futsal]
    const sumOf = (k: keyof SplitRow) => rows.some(r => r[k] !== undefined)
        ? rows.reduce((s, r) => s + (r[k] || 0), 0) : undefined
    const total: SplitRow = { games: football.games + winter.games + futsal.games }
    for (const k of ['goals', 'assists', 'warnings', 'suspensions', 'minutes'] as const) {
        const v = sumOf(k)
        if (v !== undefined) total[k] = v
    }
    return {
        football, winter, futsal, total,
        labels: { football: seasonLabel('football', year), winter: seasonLabel('winter', year), futsal: seasonLabel('futsal', year) },
    }
}
