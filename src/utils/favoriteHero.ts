import { matchPhase, splitMatches, type MatchLike } from '../domain/matchState'

/**
 * Which game a favourite team's hero card shows, family matchday order:
 * 1. a game on right now (live, or kicked off and waiting for the result),
 * 2. otherwise the next game,
 * 3. otherwise the latest result, so the card is never empty when Taso has games.
 */
export type HeroKind = 'live' | 'awaiting' | 'next' | 'latest'

export interface TeamHero<T> {
    kind: HeroKind
    match: T
}

export interface TeamToday<T> {
    hero: TeamHero<T> | null
    /** Newest played/forfeited game, whatever the hero shows. */
    latestResult: T | null
    /** Other games on right now (a team can have two on a tournament day). */
    otherOnNow: T[]
}

type Row = MatchLike & { match_id?: string | number | null }

export function teamToday<T extends Row>(matches: T[], now: Date = new Date()): TeamToday<T> {
    const { onNow, upcoming, results } = splitMatches(matches, now)
    const latestResult = results[0] || null
    if (onNow[0]) {
        const kind: HeroKind = matchPhase(onNow[0], now) === 'awaiting' ? 'awaiting' : 'live'
        return { hero: { kind, match: onNow[0] }, latestResult, otherOnNow: onNow.slice(1) }
    }
    if (upcoming[0]) return { hero: { kind: 'next', match: upcoming[0] }, latestResult, otherOnNow: [] }
    if (latestResult) return { hero: { kind: 'latest', match: latestResult }, latestResult, otherOnNow: [] }
    return { hero: null, latestResult: null, otherOnNow: [] }
}


/** The other side of the game from teamId's point of view. */
export function opponentOf(m: { team_A_id?: unknown; team_B_id?: unknown; team_A_name?: unknown; team_B_name?: unknown }, teamId: string): { id: string; name: string; home: boolean } | null {
    const a = String(m.team_A_id ?? ''), b = String(m.team_B_id ?? '')
    if (a === String(teamId)) return { id: b, name: String(m.team_B_name ?? ''), home: true }
    if (b === String(teamId)) return { id: a, name: String(m.team_A_name ?? ''), home: false }
    return null
}

const DAYS = ['su', 'ma', 'ti', 'ke', 'to', 'pe', 'la']

/** "Tänään", "Huomenna", "Eilen" or "la 5.12." (year added when not this year), Helsinki dates. */
export function friendlyDay(date: string | null | undefined, today: string): string {
    const d = String(date || '')
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d)
    if (!m) return ''
    const t = /^(\d{4})-(\d{2})-(\d{2})$/.exec(today)
    const utc = (y: string, mo: string, da: string) => Date.UTC(Number(y), Number(mo) - 1, Number(da))
    const dayMs = utc(m[1], m[2], m[3])
    if (t) {
        const diff = Math.round((dayMs - utc(t[1], t[2], t[3])) / 86400000)
        if (diff === 0) return 'Tänään'
        if (diff === 1) return 'Huomenna'
        if (diff === -1) return 'Eilen'
    }
    const wd = DAYS[new Date(dayMs).getUTCDay()]
    const base = `${wd} ${Number(m[3])}.${Number(m[2])}.`
    return t && t[1] === m[1] ? base : `${base}${m[1]}`
}
