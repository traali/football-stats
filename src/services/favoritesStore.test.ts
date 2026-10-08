import { describe, it, expect, beforeEach } from 'vitest'

const store = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
    value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => { store.set(k, String(v)) },
        removeItem: (k: string) => { store.delete(k) },
        clear: () => store.clear(),
    },
    configurable: true,
})

const { favoritesStore, parseTeams, parsePlayers } = await import('./favoritesStore')

describe('favourites (localStorage)', () => {
    beforeEach(() => { store.clear(); favoritesStore.reload() })

    it('saves teams and players and tells every listener', () => {
        let calls = 0
        const off = favoritesStore.subscribe(() => { calls++ })
        favoritesStore.toggleTeam('185085', 'PPJ/Laru sin', 'P13 Kolmonen')
        favoritesStore.togglePlayer({ id: '535740', name: 'Simo Oinonen', teamName: 'Pallo-Pojat Juniorit' })
        off()
        expect(calls).toBe(2)
        expect(JSON.parse(store.get('favoriteTeams')!)).toEqual([{ id: '185085', name: 'PPJ/Laru sin', category: 'P13 Kolmonen' }])
        expect(JSON.parse(store.get('favoritePlayers')!)[0]).toMatchObject({ id: '535740', name: 'Simo Oinonen' })
    })

    it('toggling again removes', () => {
        favoritesStore.toggleTeam('185085', 'PPJ/Laru sin')
        favoritesStore.toggleTeam('185085')
        expect(favoritesStore.get().teams).toEqual([])
    })

    it('reads the old formats and drops junk', () => {
        expect(parseTeams('["185085", {"id":"185083","name":"PPJ/Laru mus"}, 5, null]').map(t => t.id)).toEqual(['185085', '185083'])
        expect(parseTeams('not json')).toEqual([])
        expect(parsePlayers('[{"id":"535740","name":"Simo"},{"id":"abc"}]').map(p => p.id)).toEqual(['535740'])
    })
})
