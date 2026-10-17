import { useEffect, useRef, useState } from 'react'
import { helsinkiToMs, hasClockTime, matchPhase, type MatchLike } from '../domain/matchState'

export const QUIET_REFRESH_MS = 60_000
/** Start polling this long before a listed kickoff. */
export const SOON_MS = 15 * 60_000

/**
 * True while at least one match is on now (Taso live/half-time, or inside its slot)
 * or kicks off within the next 15 minutes. Finished, stale and later games never poll.
 */
export function needsQuietRefresh(matches: MatchLike[], now: Date = new Date()): boolean {
    const t = now.getTime()
    return matches.some(m => {
        const p = matchPhase(m, now)
        if (p === 'live') return true
        if (p !== 'upcoming' || !hasClockTime(m.time)) return false
        const kick = helsinkiToMs(m.date, m.time)
        return kick !== null && kick - t <= SOON_MS
    })
}

function visible(): boolean {
    return typeof document === 'undefined' || document.visibilityState !== 'hidden'
}

/**
 * Calls refresh() every intervalMs while `active` and the tab is visible.
 * Hidden tab: no calls. Back to visible: one call right away, then the interval again.
 * refresh() must be silent (no spinner, keep the last good data on failure).
 */
export function useQuietRefresh(active: boolean, refresh: () => void, intervalMs: number = QUIET_REFRESH_MS): void {
    const fn = useRef(refresh)
    useEffect(() => { fn.current = refresh }, [refresh])

    useEffect(() => {
        if (!active) return
        let timer: ReturnType<typeof setInterval> | null = null
        const start = () => { if (!timer) timer = setInterval(() => { if (visible()) fn.current() }, intervalMs) }
        const stop = () => { if (timer) { clearInterval(timer); timer = null } }
        const onVis = () => {
            if (visible()) { fn.current(); start() } else stop()
        }
        if (visible()) start()
        document.addEventListener('visibilitychange', onVis)
        return () => { stop(); document.removeEventListener('visibilitychange', onVis) }
    }, [active, intervalMs])
}

/**
 * Re-renders once a minute so phase checks (e.g. "kicks off within 15 min") move on
 * with the clock without a reload. Returns the current time.
 */
export function useMinuteClock(): Date {
    const [now, setNow] = useState(() => new Date())
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 60_000)
        return () => clearInterval(t)
    }, [])
    return now
}
