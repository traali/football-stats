import { describe, it, expect, vi, beforeEach } from 'vitest'
import g13 from '../test/fixtures/taso/getGroup_hc2026_B13-8_13.json'
import g17 from '../test/fixtures/taso/getGroup_hc2026_B13-8_17.json'
import type { GroupResponse } from '../types'

const api = vi.hoisted(() => ({
    getCategoryInfo: vi.fn(),
    getGroups: vi.fn(),
    getGroupFull: vi.fn(),
}))
vi.mock('./api', () => api)

import { groupHasTeam, isKnockoutGroup, isRealGroup, loadTournamentGroups, uniqueTeams } from './tournament'
import { tournamentScorers } from '../hooks/useTournamentData'

const group13 = g13.group as unknown as GroupResponse
const group17 = g17.group as unknown as GroupResponse
const empty = { competition_id: 'hc2026', category_id: 'B13-8', group_id: '19', group_name: '19', group_type: 'group_stage', teams: [], matches: [] } as unknown as GroupResponse

describe('Helsinki Cup groups', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('recognises group stage vs knockout and the empty shell after the last group', () => {
        expect(isKnockoutGroup(group13)).toBe(false)
        expect(isKnockoutGroup(group17)).toBe(true)
        expect(isRealGroup(group13)).toBe(true)
        expect(isRealGroup(empty)).toBe(false)
    })

    it('PPJ/Laru sin (185085) is in group M and in the B-final bracket', () => {
        expect(groupHasTeam(group13, '185085')).toBe(true)
        expect(groupHasTeam(group17, '185085')).toBe(true)
        expect(uniqueTeams(group13.teams).find(t => t.team_id === '185085')?.current_standing).toBe(4)
    })

    it('knockout team lists are de-duplicated and skip undecided slots', () => {
        const u = uniqueTeams(group17.teams)
        expect(new Set(u.map(t => t.team_id)).size).toBe(u.length)
        expect(u.some(t => t.team_id === '0')).toBe(false)
    })

    it('when getCategory and getGroups are refused, reads getGroup 1, 2, 3 … until an empty group', async () => {
        api.getCategoryInfo.mockRejectedValue(new Error("Tournament details aren't published"))
        api.getGroups.mockRejectedValue(new Error('Not allowed'))
        api.getGroupFull.mockImplementation(async (_c: string, _k: string, id: string) => {
            const n = Number(id)
            if (n === 13) return group13
            if (n === 17) return group17
            if (n <= 18) return { ...group13, group_id: id, group_name: `G${id}` }
            return empty
        })
        const groups = await loadTournamentGroups('hc2026', 'B13-8')
        expect(groups).toHaveLength(18)
        expect(groups.filter(isKnockoutGroup)).toHaveLength(1)
        expect(api.getGroupFull.mock.calls.length).toBeLessThanOrEqual(21)
    })

    it('uses getCategory group ids when Taso gives them (league ids are not 1..N)', async () => {
        api.getCategoryInfo.mockResolvedValue({ groups: [{ group_id: '4' }, { group_id: '5' }, { group_id: '1' }, { group_id: '2' }] })
        api.getGroupFull.mockImplementation(async (_c: string, _k: string, id: string) => ({ ...group13, group_id: id }))
        const groups = await loadTournamentGroups('etejp26', 'P133')
        expect(groups.map(g => g.group_id)).toEqual(['4', '5', '1', '2'])
        expect(api.getGroups).not.toHaveBeenCalled()
    })

    it('team scorers only count real goals from Taso player statistics', () => {
        const s = tournamentScorers([group13, group17], '185085')
        expect(s.every(p => p.goals > 0)).toBe(true)
    })
})
