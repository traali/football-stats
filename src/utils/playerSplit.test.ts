import { describe, it, expect } from 'vitest'
import simo from '../test/fixtures/taso/getPlayer-535740-2026-11-15.json'
import { competitionKind, playerSplit } from './playerSplit'

const matches = simo.matches as unknown as Parameters<typeof playerSplit>[0]

describe('playerSplit (real Taso getPlayer 535740, 2026-11-15)', () => {
    it('splits 2026 by sport / competition from Taso fields', () => {
        const s = playerSplit(matches, '2026')
        // 39 played outdoor football games in 2026 across all his PPJ/Laru teams, 34 goals, 1 warning
        expect(s.football).toEqual({ games: 39, goals: 34, warnings: 1 })
        // futsal 2026–27 (etefs2627, PPJ/Laru Sininen 35230232): 2 games, 1 goal
        expect(s.futsal).toEqual({ games: 2, goals: 1, warnings: 0 })
        // Winterliiga teams have no registered roster: nothing credited
        expect(s.winter).toEqual({ games: 0 })
        expect(s.total).toEqual({ games: 41, goals: 35, warnings: 1 })
        expect(s.labels).toEqual({ football: '2026', winter: '2026–27', futsal: '2026–27' })
    })

    it('uses the 1.7.–30.6. season for futsal', () => {
        expect(playerSplit(matches, '2025').futsal).toMatchObject({ games: 9, goals: 20 })
    })

    it('never shows assists, reds or minutes Taso does not record (all "0" for youth)', () => {
        const s = playerSplit(matches, '2026')
        for (const r of [s.football, s.futsal, s.total]) {
            expect(r).not.toHaveProperty('assists')
            expect(r).not.toHaveProperty('suspensions')
            expect(r).not.toHaveProperty('minutes')
        }
    })

    it('skips fixtures and non-participations, counts minutes only where the category tracks them', () => {
        const s = playerSplit([
            { match_id: '1', status: 'Fixture', date: '2026-11-20', sport_id: 'football', competition_id: 'etejp26', player_goals: '0' },
            { match_id: '2', status: 'Played', date: '2026-05-01', sport_id: 'football', competition_id: 'etejp26', player_goals: '2', not_participated: '1' },
            { match_id: '3', status: 'Played', date: '2026-05-02', sport_id: 'football', competition_id: 'x', player_goals: '1', category_playing_time: '1', playing_time_min: '55', player_assists: '1' },
            { match_id: '3', status: 'Played', date: '2026-05-02', sport_id: 'football', competition_id: 'x', player_goals: '1' },
            { match_id: '4', status: 'Played', date: '2026-11-21', sport_id: 'football', competition_id: 'kapa_0025', competition_name: 'Winterliiga 2026–2027', player_goals: '3' },
        ] as Parameters<typeof playerSplit>[0], '2026')
        expect(s.football).toEqual({ games: 1, goals: 1, assists: 1, minutes: 55 })
        expect(s.winter).toEqual({ games: 1, goals: 3 })
        expect(s.total).toEqual({ games: 2, goals: 4, assists: 1, minutes: 55 })
    })

    it('classifies competitions', () => {
        expect(competitionKind({ sport_id: 'futsal', competition_id: 'etefs2627' })).toBe('futsal')
        expect(competitionKind({ sport_id: 'football', competition_id: 'kapa_0025' })).toBe('winter')
        expect(competitionKind({ sport_id: 'football', competition_id: 'etejp26' })).toBe('football')
        expect(competitionKind({ sport_id: 'floorball', competition_id: 'x' })).toBeNull()
    })
})
