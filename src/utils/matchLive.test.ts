import { describe, it, expect } from 'vitest'
import { isMatchLive, parseKickoffMs } from './matchLive'

describe('isMatchLive', () => {
    it('treats apostrophe clock as live', () => {
        expect(isMatchLive({ status: 'Fixture', date: '2026-08-29', time: "23'" })).toBe(true)
    })
    it('does not treat finished Played as live', () => {
        expect(isMatchLive({ status: 'Played', date: '2026-08-29', time: '15:00:00' })).toBe(false)
    })
    it('parses kickoff as Helsinki time (UTC+3 in summer)', () => {
        expect(parseKickoffMs('2026-08-29', '15:00:00')).toBe(Date.parse('2026-08-29T12:00:00Z'))
    })
})
