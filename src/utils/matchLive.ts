import { helsinkiToMs, isLive, matchPhase, byKickoffAsc, byKickoffDesc, type MatchLike } from '../domain/matchState'

/** Kickoff as epoch ms, read as Europe/Helsinki wall time. */
export function parseKickoffMs(date?: string, time?: string): number | null {
    return helsinkiToMs(date, time && !time.includes("'") ? time : '00:00')
}

export function isMatchLive(m: MatchLike): boolean {
    return isLive(m)
}

/**
 * The match a family wants to see first: a game on now, else today's game that
 * finished within 4 hours, else the next upcoming one, else the latest result.
 * Stale fixtures from past years are never "next".
 */
export function pickHeroMatch<T extends MatchLike>(matches: T[], now: Date = new Date()): T | null {
    const phased = matches.map(m => ({ m, p: matchPhase(m, now) }))
    const onNow = phased.filter(x => x.p === 'live' || x.p === 'awaiting').map(x => x.m).sort(byKickoffAsc)
    if (onNow[0]) return onNow[0]
    const results = phased.filter(x => x.p === 'result').map(x => x.m).sort(byKickoffDesc)
    const latest = results[0]
    if (latest) {
        const kick = helsinkiToMs(latest.date, latest.time)
        if (kick !== null && now.getTime() - kick >= 0 && now.getTime() - kick < 4 * 60 * 60 * 1000) return latest
    }
    const upcoming = phased.filter(x => x.p === 'upcoming').map(x => x.m).sort(byKickoffAsc)
    return upcoming[0] || latest || null
}
