import { describe, it, expect } from 'vitest'
import { cardStatsAsOf } from './cardStatsAsOf'

const matches = [
    { match_id: '1', status: 'Played', season_id: '2025', date: '2025-05-01', category_name: 'P12 Nelonen', player_goals: '2', player_warnings: '1' },
    { match_id: '2', status: 'Played', season_id: '2025', date: '2025-09-01', category_name: 'P12 Kolmonen', player_goals: '1', player_warnings: '0' },
    { match_id: '3', status: 'Played', season_id: '2026', date: '2026-05-01', category_name: 'P13 Nelonen', player_goals: '3', player_warnings: '0' },
    { match_id: '4', status: 'Played', season_id: '2026', date: '2026-08-20', category_name: 'P13 Kolmonen', player_goals: '1', player_warnings: '1' },
]

describe('cardStatsAsOf', () => {
    it('splits current year by level and half', () => {
        const s = cardStatsAsOf(matches, { seasonYear: '2026' })
        expect(s.gamesPlayedThisYear).toBe(2)
        expect(s.goalsThisYear).toBe(4)
        expect(s.warningsThisYear).toBe(1)
        expect(s.seriesThisYear).toEqual([
            { category: 'P13 Kolmonen', half: 'syksy', matches: 1, goals: 1, warnings: 1 },
            { category: 'P13 Nelonen', half: 'kevät', matches: 1, goals: 3, warnings: 0 },
        ])
    })
})
