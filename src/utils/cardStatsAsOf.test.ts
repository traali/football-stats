import { describe, it, expect } from 'vitest'
import { cardStatsAsOf } from './cardStatsAsOf'

const matches = [
    { match_id: '1', status: 'Played', season_id: '2026', date: '2026-05-01', category_name: 'P13 Nelonen', team_id: 'a', team_A_id: 'a', team_B_id: 'b', fs_A: '2', fs_B: '1', team_name: 'PPJ', player_goals: '0', player_warnings: '1' },
    { match_id: '2', status: 'Played', season_id: '2026', date: '2026-05-08', category_name: 'P13 Nelonen', team_id: 'a', team_A_id: 'a', team_B_id: 'c', fs_A: '0', fs_B: '0', team_name: 'PPJ', player_goals: '0', player_warnings: '0' },
    { match_id: '3', status: 'Played', season_id: '2026', date: '2026-08-20', category_name: 'P13 Kolmonen', team_id: 'a', team_A_id: 'd', team_B_id: 'a', fs_A: '3', fs_B: '1', team_name: 'PPJ', player_goals: '1', player_warnings: '0' },
]

describe('cardStatsAsOf', () => {
    it('counts W-D-L and warnings per level', () => {
        const s = cardStatsAsOf(matches, { seasonYear: '2026' })
        const nel = s.seriesThisYear.find(r => r.category.includes('Nelonen'))!
        expect(nel.wins).toBe(1)
        expect(nel.draws).toBe(1)
        expect(nel.losses).toBe(0)
        expect(nel.warnings).toBe(1)
        const kol = s.seriesThisYear.find(r => r.category.includes('Kolmonen'))!
        expect(kol.losses).toBe(1)
        expect(kol.goals).toBe(1)
    })
})
