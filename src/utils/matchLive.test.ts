import { describe, it, expect } from 'vitest'
import { isMatchLive, parseKickoffMs } from './matchLive'

describe('isMatchLive', () => {
    it('treats apostrophe clock as live', () => {
        expect(isMatchLive({ status: 'Fixture', date: '2026-08-29', time: "23'" })).toBe(true)
    })
    it('does not treat finished Played as live', () => {
        expect(isMatchLive({ status: 'Played', date: '2026-08-29', time: '15:00:00' })).toBe(false)
    })
    it('parses kickoff', () => {
        expect(parseKickoffMs('2026-08-29', '15:00:00')).toBe(new Date('2026-08-29T15:00:00').getTime())
    })
})
