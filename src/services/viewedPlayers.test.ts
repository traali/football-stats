import { describe, it, expect, beforeEach } from 'vitest'
import { rememberViewedPlayer, getViewedPlayer, listViewedPlayers } from './viewedPlayers'

describe('viewedPlayers', () => {
    beforeEach(() => localStorage.clear())
    it('stores and returns slim player', () => {
        rememberViewedPlayer('1', {
            first_name: 'Simo',
            last_name: 'Oinonen',
            birthyear: '2013',
            matches: [{ match_id: '9', status: 'Played', player_goals: '1', team_name: 'PPJ/Laru sin' }],
        })
        expect(getViewedPlayer('1')?.last_name).toBe('Oinonen')
        expect(listViewedPlayers()).toHaveLength(1)
    })
})
