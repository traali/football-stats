import { describe, it, expect } from 'vitest'
import { helsinkiHHMM, liveFreshness, STALE_AFTER_MS } from './freshness'

const ms = (iso: string) => new Date(iso).getTime()

describe('live score freshness note', () => {
    it('prints Helsinki time HH.MM (UTC+3 in October)', () => {
        expect(helsinkiHHMM(ms('2026-10-17T11:31:05Z'))).toBe('14.31')
        expect(helsinkiHHMM(ms('2026-10-17T06:05:00Z'))).toBe('09.05')
    })
    it('Helsinki winter time (UTC+2)', () => {
        expect(helsinkiHHMM(ms('2026-12-05T16:00:00Z'))).toBe('18.00')
    })
    it('label from the last successful fetch, not stale within 3 min', () => {
        const f = liveFreshness(ms('2026-10-17T11:31:05Z'), ms('2026-10-17T11:34:00Z'))
        expect(f).toEqual({ label: '(päivitetty klo 14.31)', stale: false })
    })
    it('stale after more than 3 min', () => {
        const at = ms('2026-10-17T11:31:05Z')
        expect(liveFreshness(at, at + STALE_AFTER_MS)?.stale).toBe(false)
        expect(liveFreshness(at, at + STALE_AFTER_MS + 1000)?.stale).toBe(true)
    })
    it('unknown fetch time → no note', () => {
        expect(liveFreshness(undefined)).toBeNull()
        expect(liveFreshness(0)).toBeNull()
    })
})
