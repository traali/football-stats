import { describe, it, expect } from 'vitest'
import { cardStatsAsOf } from './cardStatsAsOf'

const matches = [
    { match_id: '1', status: 'Played', season_id: '2025', date: '2025-05-01', player_goals: '2' },
    { match_id: '2', status: 'Played', season_id: '2025', date: '2025-09-01', player_goals: '1' },
    { match_id: '3', status: 'Played', season_id: '2026', date: '2026-05-01', player_goals: '3' },
    { match_id: '4', status: 'Played', season_id: '2026', date: '2026-08-20', player_goals: '1' },
    { match_id: '5', status: 'Fixture', season_id: '2026', date: '2026-09-01', player_goals: '0' },
]

describe('cardStatsAsOf', () => {
    it('past 2025 match only counts up to that date', () => {
        const s = cardStatsAsOf(matches, { seasonYear: '2025', asOfDate: '2025-05-01' })
        expect(s.gamesPlayedThisYear).toBe(1)
        expect(s.goalsThisYear).toBe(2)
        expect(s.gamesPlayedLastSeason).toBe(0)
    })
    it('upcoming uses all played in that season', () => {
        const s = cardStatsAsOf(matches, { seasonYear: '2026' })
        expect(s.gamesPlayedThisYear).toBe(2)
        expect(s.goalsThisYear).toBe(4)
        expect(s.gamesPlayedLastSeason).toBe(2)
        expect(s.goalsScoredLastSeason).toBe(3)
    })
})
