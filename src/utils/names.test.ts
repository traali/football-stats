import { describe, it, expect } from 'vitest'
import { parsePlayerName, seasonMatchesYear } from './names'

describe('parsePlayerName', () => {
    it('prefers structured fields', () => {
        expect(parsePlayerName({ first_name: 'Simo', last_name: 'Oinonen', player_name: 'Oinonen Simo' }))
            .toEqual({ first_name: 'Simo', last_name: 'Oinonen' })
    })

    it('parses TASO Sukunimi Etunimi', () => {
        expect(parsePlayerName({ player_name: 'Oinonen Simo' }))
            .toEqual({ first_name: 'Simo', last_name: 'Oinonen' })
    })

    it('parses Last, First', () => {
        expect(parsePlayerName({ player_name: 'Oinonen, Simo' }))
            .toEqual({ first_name: 'Simo', last_name: 'Oinonen' })
    })
})

describe('seasonMatchesYear', () => {
    it('matches calendar year', () => {
        expect(seasonMatchesYear('2026', '2026')).toBe(true)
        expect(seasonMatchesYear('2025', '2026')).toBe(false)
    })

    it('matches hyphenated winter season', () => {
        expect(seasonMatchesYear('2025-26', '2025')).toBe(true)
        expect(seasonMatchesYear('2026-27', '2026')).toBe(true)
    })

    it('falls back to date when season_id missing', () => {
        expect(seasonMatchesYear(undefined, '2026', '2026-08-30')).toBe(true)
        expect(seasonMatchesYear('', '2026', '2025-08-30')).toBe(false)
    })
})
