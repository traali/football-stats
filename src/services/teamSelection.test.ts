import { beforeEach, describe, expect, it } from 'vitest'
import { getLastSelectedTeamId, normalizeTeamId, setLastSelectedTeamId, sortFavoritesByLastSelected } from './teamSelection'
import type { FavoriteTeam } from '../hooks/useFavorites'

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

describe('teamSelection', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('normalizes only numeric team ids', () => {
        expect(normalizeTeamId(' 12345 ')).toBe('12345')
        expect(normalizeTeamId('abc')).toBeNull()
        expect(normalizeTeamId('12-34')).toBeNull()
    })

    it('persists and restores last selected team id', () => {
        setLastSelectedTeamId('99001')
        expect(getLastSelectedTeamId()).toBe('99001')
    })

    it('moves selected favorite to first position', () => {
        const favorites: FavoriteTeam[] = [
            { id: '1', name: 'A' },
            { id: '2', name: 'B' },
            { id: '3', name: 'C' },
        ]
        expect(sortFavoritesByLastSelected(favorites, '3').map(f => f.id)).toEqual(['3', '1', '2'])
    })
})
