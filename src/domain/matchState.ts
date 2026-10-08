/**
 * One place that decides what a Taso match row may show.
 *
 * Truth rules (Arto's orders):
 * - A score is shown only for a result (Played / Forfeited) or a live game.
 * - Taso sends fs_A='0', fs_B='0' for unplayed fixtures in getMatch, and live_A='0' too.
 *   Those zeros are NOT a score.
 * - A Fixture whose date has passed and that never got a result is "stale" and is never upcoming.
 * - All clock logic runs on Europe/Helsinki wall time, whatever the phone's zone is.
 */

export const HELSINKI_TZ = 'Europe/Helsinki'

export type MatchPhase =
    /** Played or forfeited: Taso has a final result. */
    | 'result'
    /** In progress right now (Taso live status/clock, or inside the reserved slot). */
    | 'live'
    /** Kickoff and slot have passed today but Taso has no result yet. */
    | 'awaiting'
    /** Kickoff in the future (or today without a known time). */
    | 'upcoming'
    /** Old Fixture/Planned that never got a result. Hidden from upcoming lists. */
    | 'stale'

export interface MatchLike {
    status?: string | null
    date?: string | null
    time?: string | null
    time_end?: string | null
    playing_time_min?: string | number | null
    playing_time?: string | number | null
    fs_A?: string | number | null
    fs_B?: string | number | null
    live_A?: string | number | null
    live_B?: string | number | null
    live_time?: string | null
    live_time_mmss?: string | null
    live_period?: string | number | null
    live_timer_on?: string | number | null
    periods_played?: string | number | null
    walkover?: string | number | null
    forfeit_A?: string | null
    forfeit_B?: string | null
    winner_id?: string | null
}

const LIVE_STATUSES = new Set(['live', 'playing', 'inplay', 'in_play', 'ongoing', 'käynnissä', 'kesken'])
const DEFAULT_PLAYING_MIN = 90
/** Results are typed in after the whistle; keep the game visible as live a bit longer. */
const AFTER_WHISTLE_GRACE_MIN = 20

function str(v: unknown): string {
    return v === null || v === undefined ? '' : String(v).trim()
}

function tzOffsetMs(utcMs: number, timeZone = HELSINKI_TZ): number {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hourCycle: 'h23',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(new Date(utcMs))
    const get = (t: string) => Number(parts.find(p => p.type === t)?.value)
    const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'))
    return asUtc - Math.floor(utcMs / 1000) * 1000
}

/** Helsinki wall-clock date + time → epoch ms. Returns null when the date is missing or bad. */
export function helsinkiToMs(date?: string | null, time?: string | null): number | null {
    const d = str(date)
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d)
    if (!m) return null
    const t = str(time)
    const tm = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(t)
    const [h, mi, s] = tm ? [Number(tm[1]), Number(tm[2]), Number(tm[3] || 0)] : [0, 0, 0]
    const guess = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), h, mi, s)
    let ms = guess - tzOffsetMs(guess)
    // DST edge: recompute with the offset that applies at the corrected instant.
    ms = guess - tzOffsetMs(ms)
    return Number.isFinite(ms) ? ms : null
}

export function hasClockTime(time?: string | null): boolean {
    return /^\d{1,2}:\d{2}/.test(str(time))
}

export function helsinkiToday(now: Date = new Date()): string {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: HELSINKI_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

export function isForfeit(m: MatchLike): boolean {
    if (str(m.status).toLowerCase() === 'forfeited') return true
    if (Number(m.walkover) === 1) return true
    return !!(str(m.forfeit_A) || str(m.forfeit_B))
}

function numeric(v: unknown): boolean {
    return /^\d+$/.test(str(v))
}

/** Taso has a final result (Played, or a walkover/forfeit). */
export function isResult(m: MatchLike): boolean {
    return str(m.status).toLowerCase() === 'played' || isForfeit(m)
}

function hasFinalScore(m: MatchLike): boolean {
    return isResult(m) && numeric(m.fs_A) && numeric(m.fs_B)
}

function explicitLive(m: MatchLike): boolean {
    const st = str(m.status).toLowerCase()
    if (LIVE_STATUSES.has(st)) return true
    // Some feeds put the running minute in time, e.g. "23'".
    return str(m.time).includes("'")
}

/** Start and end of the slot in which the game is considered live. */
export function liveWindow(m: MatchLike): { start: number; end: number } | null {
    if (!hasClockTime(m.time)) return null
    const start = helsinkiToMs(m.date, m.time)
    if (start === null) return null
    let end: number | null = null
    if (hasClockTime(m.time_end)) {
        const e = helsinkiToMs(m.date, m.time_end)
        if (e !== null && e > start) end = e
    }
    if (end === null) {
        const mins = Number(str(m.playing_time_min) || str(m.playing_time)) || DEFAULT_PLAYING_MIN
        end = start + mins * 60_000
    }
    return { start, end: end + AFTER_WHISTLE_GRACE_MIN * 60_000 }
}

export function matchPhase(m: MatchLike, now: Date = new Date()): MatchPhase {
    if (isResult(m)) return 'result'
    if (explicitLive(m)) return 'live'
    const today = helsinkiToday(now)
    const date = str(m.date)
    const win = liveWindow(m)
    if (win) {
        const t = now.getTime()
        if (t < win.start) return 'upcoming'
        if (t <= win.end) return 'live'
        return date === today ? 'awaiting' : 'stale'
    }
    if (!date) return 'stale'
    if (date >= today) return 'upcoming'
    return 'stale'
}

export function isLive(m: MatchLike, now: Date = new Date()): boolean {
    return matchPhase(m, now) === 'live'
}

export function isUpcoming(m: MatchLike, now: Date = new Date()): boolean {
    return matchPhase(m, now) === 'upcoming'
}

/** Live/awaiting games stay on top of every list so they never vanish. */
export function isOnNow(m: MatchLike, now: Date = new Date()): boolean {
    const p = matchPhase(m, now)
    return p === 'live' || p === 'awaiting'
}

function hasLiveEvidence(m: MatchLike): boolean {
    if (Number(m.live_timer_on) === 1) return true
    if (str(m.live_period) && str(m.live_period) !== '0') return true
    if (Number(m.periods_played) > 0) return true
    const lt = str(m.live_time)
    if (lt && lt !== '00:00' && lt !== '0') return true
    const mmss = str(m.live_time_mmss)
    if (mmss && mmss !== '00:00') return true
    return false
}

export interface Score { a: number; b: number }

/**
 * The only score the UI may print. null → print "vs".
 * - result: fs_A/fs_B
 * - live: live_A/live_B only when Taso shows the game is actually running
 *   (a bare live_A='0' on a fixture is not a score).
 */
export function displayScore(m: MatchLike, now: Date = new Date()): Score | null {
    if (isResult(m)) return hasFinalScore(m) ? { a: Number(m.fs_A), b: Number(m.fs_B) } : null
    if (matchPhase(m, now) !== 'live') return null
    if (!numeric(m.live_A) || !numeric(m.live_B)) return null
    const a = Number(m.live_A)
    const b = Number(m.live_B)
    if (explicitLive(m) || hasLiveEvidence(m) || a + b > 0) return { a, b }
    return null
}

export type Outcome = 'V' | 'T' | 'H'

/** Win/draw/loss for one team from a final result. null when not a result. */
export function outcomeFor(m: MatchLike & { team_A_id?: string | null; team_B_id?: string | null }, teamId: string): Outcome | null {
    if (!hasFinalScore(m)) return null
    const isA = str(m.team_A_id) === String(teamId)
    const isB = str(m.team_B_id) === String(teamId)
    if (!isA && !isB) return null
    const my = Number(isA ? m.fs_A : m.fs_B)
    const opp = Number(isA ? m.fs_B : m.fs_A)
    return my > opp ? 'V' : my < opp ? 'H' : 'T'
}

export function phaseLabel(m: MatchLike, now: Date = new Date()): string {
    const p = matchPhase(m, now)
    if (p === 'result') return isForfeit(m) ? 'Luovutus' : 'Pelattu'
    if (p === 'live') return 'Käynnissä'
    if (p === 'awaiting') return 'Tulosta odotetaan'
    if (p === 'upcoming') return 'Tulossa'
    return 'Ei tulosta'
}

function kickoffKey(m: MatchLike): string {
    return `${str(m.date)} ${hasClockTime(m.time) ? str(m.time).padStart(8, '0') : '99:99'}`
}

export function byKickoffAsc<T extends MatchLike>(a: T, b: T): number {
    return kickoffKey(a).localeCompare(kickoffKey(b))
}

export function byKickoffDesc<T extends MatchLike>(a: T, b: T): number {
    return kickoffKey(b).localeCompare(kickoffKey(a))
}

export interface SplitMatches<T> {
    /** Live and awaiting-result games, earliest kickoff first. */
    onNow: T[]
    upcoming: T[]
    /** Played and forfeited, newest first. */
    results: T[]
}

export function splitMatches<T extends MatchLike>(matches: T[], now: Date = new Date()): SplitMatches<T> {
    const onNow: T[] = []
    const upcoming: T[] = []
    const results: T[] = []
    for (const m of matches) {
        const p = matchPhase(m, now)
        if (p === 'result') results.push(m)
        else if (p === 'live' || p === 'awaiting') onNow.push(m)
        else if (p === 'upcoming') upcoming.push(m)
    }
    onNow.sort(byKickoffAsc)
    upcoming.sort(byKickoffAsc)
    results.sort(byKickoffDesc)
    return { onNow, upcoming, results }
}

/** Penalty shoot-out result when Taso has one (ps_A/ps_B both filled). */
export function penaltyScore(m: { ps_A?: unknown; ps_B?: unknown }): { a: number; b: number } | null {
    const a = str(m.ps_A as string | undefined)
    const b = str(m.ps_B as string | undefined)
    if (!/^\d+$/.test(a) || !/^\d+$/.test(b)) return null
    return { a: Number(a), b: Number(b) }
}

export interface TeamRecord { played: number; won: number; tied: number; lost: number; goalsFor: number; goalsAgainst: number }

/** Played / W-D-L / goals for one team from results only (forfeits included, as Taso counts them). */
export function teamRecord(matches: (MatchLike & { team_A_id?: string | null; team_B_id?: string | null })[], teamId: string): TeamRecord {
    const r: TeamRecord = { played: 0, won: 0, tied: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 }
    for (const m of matches) {
        const o = outcomeFor(m, teamId)
        if (!o) continue
        const isA = str(m.team_A_id) === String(teamId)
        r.played++
        r.goalsFor += Number(isA ? m.fs_A : m.fs_B)
        r.goalsAgainst += Number(isA ? m.fs_B : m.fs_A)
        if (o === 'V') r.won++
        else if (o === 'H') r.lost++
        else r.tied++
    }
    return r
}
