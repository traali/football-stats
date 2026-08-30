import { describe, it, expect, beforeEach } from 'vitest'
import { rememberViewedMatch, getViewedMatch, listViewedMatches } from './viewedCache'
import { MATCH_STATUS } from '../types'
import type { MatchDetails } from '../types'

function played(id: string): MatchDetails {
    return {
        match_id: id,
        competition_id: 'etejp26',
        category_id: 'P133',
        group_id: '4',
        team_A_id: '1',
        team_B_id: '2',
        team_A_name: 'A',
        team_B_name: 'B',
        date: '2026-08-29',
        category_name: 'P13',
        competition_name: 'Etelä',
        status: MATCH_STATUS.PLAYED,
        fs_A: '2',
        fs_B: '3',
        lineups: [],
    }
}

const store = new Map<string, string>()
const mockStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, String(v)) },
    removeItem: (k: string) => { store.delete(k) },
    clear: () => { store.clear() },
    get length() { return store.size },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
}
Object.defineProperty(globalThis, 'localStorage', { value: mockStorage, configurable: true, writable: true })

describe('viewedCache', () => {
    beforeEach(() => localStorage.clear())

    it('stores played matches and returns newest first', () => {
        rememberViewedMatch(played('1'))
        rememberViewedMatch(played('2'))
        expect(listViewedMatches().map(x => x.match.match_id)).toEqual(['2', '1'])
        expect(getViewedMatch('1')?.fs_B).toBe('3')
    })

    it('ignores fixtures', () => {
        rememberViewedMatch({ ...played('9'), status: MATCH_STATUS.FIXTURE })
        expect(listViewedMatches()).toEqual([])
    })
})
