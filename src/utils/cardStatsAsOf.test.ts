import { describe, it, expect } from 'vitest'
import { cardStatsAsOf } from './cardStatsAsOf'

const matches = [
    { match_id: '1', status: 'Played', season_id: '2026', date: '2026-05-01', category_name: 'P13 Nelonen', team_id: 'a', team_A_id: 'a', team_B_id: 'b', fs_A: '2', fs_B: '1', team_name: 'PPJ', player_goals: '0', player_warnings: '1' },
    { match_id: '2', status: 'Played', season_id: '2026', date: '2026-05-08', category_name: 'P13 Nelonen', team_id: 'a', team_A_id: 'a', team_B_id: 'c', fs_A: '0', fs_B: '0', team_name: 'PPJ', player_goals: '0', player_warnings: '0' },
    { match_id: '3', status: 'Played', season_id: '2026', date: '2026-08-20', category_name: 'P13 Kolmonen', team_id: 'a', team_A_id: 'd', team_B_id: 'a', fs_A: '3', fs_B: '1', team_name: 'PPJ', player_goals: '1', player_warnings: '0' },
]

describe('cardStatsAsOf', () => {
    it('counts W-D-L and warnings per level', () => {
        const s = cardStatsAsOf(matches, { seasonYear: '2026', refDate: '2026-08-25' })
        const nel = s.seriesThisYear.find(r => r.category.includes('Nelonen'))!
        expect(nel.wins).toBe(1)
        expect(nel.draws).toBe(1)
        expect(nel.losses).toBe(0)
        expect(nel.warnings).toBe(1)
        const kol = s.seriesThisYear.find(r => r.category.includes('Kolmonen'))!
        expect(kol.losses).toBe(1)
        expect(kol.goals).toBe(1)
        expect(s.gamesLast14Days).toBe(1) // match on 2026-08-20 is within 14 days of 2026-08-25
    })

    it('filters correctly by seasonHalf kevät vs syksy', () => {
        const springStats = cardStatsAsOf(matches, { seasonYear: '2026', seasonHalf: 'kevät' })
        expect(springStats.gamesPlayedThisYear).toBe(2)
        expect(springStats.goalsThisYear).toBe(0)
        expect(springStats.warningsThisYear).toBe(1)
        expect(springStats.seriesThisYear).toHaveLength(1)
        expect(springStats.seriesThisYear[0].half).toBe('kevät')

        const autumnStats = cardStatsAsOf(matches, { seasonYear: '2026', seasonHalf: 'syksy' })
        expect(autumnStats.gamesPlayedThisYear).toBe(1)
        expect(autumnStats.goalsThisYear).toBe(1)
        expect(autumnStats.warningsThisYear).toBe(0)
        expect(autumnStats.seriesThisYear).toHaveLength(1)
        expect(autumnStats.seriesThisYear[0].half).toBe('syksy')

        const allStats = cardStatsAsOf(matches, { seasonYear: '2026', seasonHalf: 'all' })
        expect(allStats.gamesPlayedThisYear).toBe(3)
        expect(allStats.goalsThisYear).toBe(1)
        expect(allStats.warningsThisYear).toBe(1)
        expect(allStats.seriesThisYear).toHaveLength(2)
    })

    it('sorts preferredHalf first and chronological order newest game first', () => {
        const s = cardStatsAsOf(matches, { seasonYear: '2026', preferredHalf: 'syksy' })
        expect(s.seriesThisYear).toHaveLength(2)
        // Kolmonen is syksy (2026-08-20) -> must be first!
        expect(s.seriesThisYear[0].category).toContain('Kolmonen')
        expect(s.seriesThisYear[0].half).toBe('syksy')
        // Nelonen is kevät (2026-05-08) -> must be second!
        expect(s.seriesThisYear[1].category).toContain('Nelonen')
        expect(s.seriesThisYear[1].half).toBe('kevät')

        // Check chronological results in Nelonen (newest first: match 2 on 05-08 was 0-0 'T', match 1 on 05-01 was 2-1 'V')
        const nel = s.seriesThisYear[1]
        expect(nel.results).toHaveLength(2)
        expect(nel.results![0]).toEqual({ result: 'T', date: '2026-05-08' })
        expect(nel.results![1]).toEqual({ result: 'V', date: '2026-05-01' })
    })
})
