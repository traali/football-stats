import { describe, it, expect } from 'vitest'
import group4 from '../test/fixtures/taso/getGroup_etejp26_P133_4.json'
import { formatPpm, inTasoOrder } from './standings'
import type { StandingTeam } from '../types'

const teams = group4.group.teams as unknown as StandingTeam[]

describe('standings', () => {
    it('Syksy 1 asks for points per match', () => {
        expect(String(group4.group.show_points_per_match)).toBe('1')
    })

    it('keeps Taso\'s order: PPJ/Laru sin (12 p in 9) above PPJ/Väiski sininen (13 p in 10)', () => {
        const shuffled = [...teams].reverse()
        const ordered = inTasoOrder(shuffled)
        expect(ordered.map(t => Number(t.current_standing))).toEqual(teams.map((_, i) => i + 1))
        const i15 = ordered.findIndex(t => t.team_id === '185085')
        const i16 = ordered.findIndex(t => t.team_id === '35185769')
        expect(i15).toBe(14)
        expect(i16).toBe(15)
        expect(Number(ordered[i15].points)).toBeLessThan(Number(ordered[i16].points))
    })

    it('formats P/O with two decimals and a comma', () => {
        const laru = teams.find(t => t.team_id === '185085')!
        expect(formatPpm(laru.points_per_match)).toBe('1,33')
        expect(formatPpm(teams.find(t => t.team_id === '35185769')!.points_per_match)).toBe('1,30')
        expect(formatPpm(0)).toBe('0,00')
        expect(formatPpm('')).toBe('–')
        expect(formatPpm(undefined)).toBe('–')
    })
})
