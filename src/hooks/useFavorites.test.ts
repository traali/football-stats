import { describe, it, expect, beforeEach } from 'vitest'

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

describe('favoritePlayers storage contract', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('serializes and parses favorite players in localStorage', () => {
        const players = [
            {
                id: '123',
                name: 'Testi Pelaaja',
                teamName: 'PPJ/Laru sin',
                category: 'P13 Kolmonen',
            },
        ]
        localStorage.setItem('favoritePlayers', JSON.stringify(players))
        const loaded = JSON.parse(localStorage.getItem('favoritePlayers') || '[]')
        expect(loaded).toHaveLength(1)
        expect(loaded[0].id).toBe('123')
        expect(loaded[0].name).toBe('Testi Pelaaja')
    })
})
