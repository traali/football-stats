import { describe, it, expect, beforeEach } from 'vitest'
import { setCached, getCached, withCache } from './cache'
import { MATCH_STATUS } from '../types'

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

describe('persist cache', () => {
    beforeEach(() => localStorage.clear())

    it('serves played match from disk without fetch', async () => {
        setCached('getMatch', { match_id: '1' }, { match_id: '1', status: MATCH_STATUS.PLAYED, fs_A: '2' }, MATCH_STATUS.PLAYED)
        const calls = { n: 0 }
        const value = await withCache('getMatch', { match_id: '1' }, async () => {
            calls.n++
            return { match_id: '1', status: MATCH_STATUS.PLAYED, fs_A: '9' }
        })
        expect(value.fs_A).toBe('2')
        expect(calls.n).toBe(0)
    })

    it('does not persist fixtures, but keeps a short memory cache', () => {
        setCached('getMatch', { match_id: '2' }, { match_id: '2', status: MATCH_STATUS.FIXTURE }, MATCH_STATUS.FIXTURE)
        expect(getCached('getMatch', { match_id: '2' })).toEqual({ match_id: '2', status: MATCH_STATUS.FIXTURE })
        expect(localStorage.getItem('fs.apiPersist.v1') || '{}').not.toContain('"2"')
    })

    it('does not cache live matches at all', () => {
        setCached('getMatch', { match_id: '3' }, { match_id: '3', status: 'Live' }, 'Live')
        expect(getCached('getMatch', { match_id: '3' })).toBeUndefined()
    })

    it('does not persist team rosters (player changes on upcoming games)', () => {
        setCached('getTeam', { team_id: '9' }, { team_id: '9', players: [] })
        expect(getCached('getTeam', { team_id: '9' })).toBeTruthy()
        expect(localStorage.getItem('fs.apiPersist.v1') || '{}').not.toContain('team_id')
    })
})
