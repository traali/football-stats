import { describe, it, expect } from 'vitest'
import { cardStatsAsOf } from './cardStatsAsOf'

const matches = [
    { match_id: '1', status: 'Played', season_id: '2026', date: '2026-05-01', category_name: 'P13 Nelonen', team_id: 'a', team_A_id: 'a', team_B_id: 'b', team_A_name: 'PPJ', team_B_name: 'HJK', fs_A: '2', fs_B: '1', team_name: 'PPJ', player_goals: '0', player_warnings: '1' },
    { match_id: '2', status: 'Played', season_id: '2026', date: '2026-05-08', category_name: 'P13 Nelonen', team_id: 'a', team_A_id: 'a', team_B_id: 'c', team_A_name: 'PPJ', team_B_name: 'KäPa', fs_A: '0', fs_B: '0', team_name: 'PPJ', player_goals: '0', player_warnings: '0' },
    { match_id: '3', status: 'Played', season_id: '2026', date: '2026-08-20', category_name: 'P13 Kolmonen', team_id: 'a', team_A_id: 'd', team_B_id: 'a', team_A_name: 'EBK', team_B_name: 'PPJ', fs_A: '3', fs_B: '1', team_name: 'PPJ', player_goals: '1', player_warnings: '0' },
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
        expect(s.gamesLast14Days).toBe(1)
    })

    it('filters correctly by seasonHalf kevät vs syksy', () => {
        const springStats = cardStatsAsOf(matches, { seasonYear: '2026', seasonHalf: 'kevät' })
        expect(springStats.gamesPlayedThisYear).toBe(2)
        expect(springStats.seriesThisYear).toHaveLength(1)
        expect(springStats.seriesThisYear[0].half).toBe('kevät')

        const autumnStats = cardStatsAsOf(matches, { seasonYear: '2026', seasonHalf: 'syksy' })
        expect(autumnStats.gamesPlayedThisYear).toBe(1)
        expect(autumnStats.seriesThisYear[0].half).toBe('syksy')
    })

    it('puts current/preferred half first and games newest first', () => {
        const s = cardStatsAsOf(matches, { seasonYear: '2026', preferredHalf: 'syksy' })
        expect(s.seriesThisYear[0].half).toBe('syksy')
        expect(s.seriesThisYear[0].category).toContain('Kolmonen')
        expect(s.seriesThisYear[1].half).toBe('kevät')
        const nel = s.seriesThisYear[1]
        expect(nel.results![0].result).toBe('T')
        expect(nel.results![0].date).toBe('2026-05-08')
        expect(nel.results![1].result).toBe('V')
        expect(nel.results![1].date).toBe('2026-05-01')
    })

    it('adds grey DNP boxes for team games the player missed', () => {
        const teamMatches = [
            { match_id: '1', date: '2026-05-01', status: 'Played', team_A_id: 'a', team_B_id: 'b', team_A_name: 'PPJ', team_B_name: 'HJK' },
            { match_id: '2', date: '2026-05-08', status: 'Played', team_A_id: 'a', team_B_id: 'c', team_A_name: 'PPJ', team_B_name: 'KäPa' },
            { match_id: '9', date: '2026-05-15', status: 'Played', team_A_id: 'a', team_B_id: 'z', team_A_name: 'PPJ', team_B_name: 'Honka' },
            { match_id: '10', date: '2026-09-01', status: 'Fixture', team_A_id: 'a', team_B_id: 'z', team_A_name: 'PPJ', team_B_name: 'Honka' },
        ]
        const s = cardStatsAsOf(matches, {
            seasonYear: '2026',
            seasonHalf: 'kevät',
            teamMatchesByTeamId: { a: teamMatches },
        })
        const nel = s.seriesThisYear[0]
        const dnp = nel.results!.filter(r => r.result === 'DNP')
        expect(dnp).toHaveLength(1)
        expect(dnp[0].date).toBe('2026-05-15')
        expect(dnp[0].opponent).toBe('Honka')
        expect(nel.results![0].date).toBe('2026-05-15')
    })

    it('without preferredHalf, uses upcoming/latest from the match list', () => {
        const withFixture = [
            ...matches,
            { match_id: '4', status: 'Fixture', season_id: '2026', date: '2026-09-20', category_name: 'P13 Kolmonen', team_id: 'a', team_A_id: 'a', team_B_id: 'e', fs_A: '', fs_B: '', team_name: 'PPJ' },
        ]
        const s = cardStatsAsOf(withFixture, { seasonYear: '2026', refDate: '2026-09-12' })
        expect(s.seriesThisYear[0].half).toBe('syksy')
    })
})
