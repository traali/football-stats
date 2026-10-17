/** A live score older than this gets the "may be out of date" note. */
export const STALE_AFTER_MS = 3 * 60_000

/** "14.31" in Europe/Helsinki, whatever the phone's zone is. */
export function helsinkiHHMM(ms: number): string {
    const parts = new Intl.DateTimeFormat('fi-FI', { timeZone: 'Europe/Helsinki', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(ms))
    const h = parts.find(p => p.type === 'hour')?.value ?? '00'
    const m = parts.find(p => p.type === 'minute')?.value ?? '00'
    return `${h.padStart(2, '0')}.${m.padStart(2, '0')}`
}

export interface Freshness { label: string; stale: boolean }

/** null when we do not know when the data was fetched: then nothing is shown. */
export function liveFreshness(fetchedAt: number | undefined | null, now: Date | number = Date.now()): Freshness | null {
    if (!fetchedAt || !Number.isFinite(fetchedAt)) return null
    const t = typeof now === 'number' ? now : now.getTime()
    return { label: `(päivitetty klo ${helsinkiHHMM(fetchedAt)})`, stale: t - fetchedAt > STALE_AFTER_MS }
}

export const STALE_NOTE = 'Tulos voi olla vanhentunut.'
