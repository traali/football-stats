import { useState, useCallback } from 'react'

export interface FavoriteTeam {
    id: string
    name: string
    category?: string
}

export interface FavoritePlayer {
    id: string
    name: string
    teamName?: string
    category?: string
    img_url?: string
    birthyear?: string
}

function loadFavorites(): FavoriteTeam[] {
    try {
        const raw = localStorage.getItem('favoriteTeams')
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed.map((item: any) => {
            if (typeof item === 'string') {
                return { id: item, name: item }
            }
            if (item && typeof item === 'object' && typeof item.id === 'string') {
                return { id: item.id, name: item.name || item.id, category: item.category }
            }
            return null
        }).filter((item): item is FavoriteTeam => item !== null)
    } catch {
        return []
    }
}

function loadFavoritePlayers(): FavoritePlayer[] {
    try {
        const raw = localStorage.getItem('favoritePlayers')
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        const result: FavoritePlayer[] = []
        for (const item of parsed) {
            if (item && typeof item === 'object' && typeof item.id === 'string') {
                result.push({
                    id: item.id,
                    name: String(item.name || item.id),
                    teamName: item.teamName ? String(item.teamName) : undefined,
                    category: item.category ? String(item.category) : undefined,
                    img_url: item.img_url ? String(item.img_url) : undefined,
                    birthyear: item.birthyear ? String(item.birthyear) : undefined,
                })
            }
        }
        return result
    } catch {
        return []
    }
}

export function useFavorites() {
    const [favorites, setFavorites] = useState<FavoriteTeam[]>(loadFavorites)
    const [favoritePlayers, setFavoritePlayers] = useState<FavoritePlayer[]>(loadFavoritePlayers)

    const toggle = useCallback((teamId: string, teamName?: string, category?: string) => {
        setFavorites(prev => {
            const exists = prev.some(f => f.id === teamId)
            const next = exists
                ? prev.filter(f => f.id !== teamId)
                : [...prev, { id: teamId, name: teamName || teamId, category }]
            localStorage.setItem('favoriteTeams', JSON.stringify(next))
            return next
        })
    }, [])

    const isFavorite = useCallback((teamId: string) => favorites.some(f => f.id === teamId), [favorites])

    const clear = useCallback(() => {
        setFavorites([])
        localStorage.removeItem('favoriteTeams')
    }, [])

    const updateName = useCallback((teamId: string, teamName: string, category?: string) => {
        setFavorites(prev => {
            const index = prev.findIndex(f => f.id === teamId)
            if (index === -1 || (prev[index].name === teamName && prev[index].category === category)) return prev
            const next = [...prev]
            next[index] = { ...next[index], name: teamName, category }
            localStorage.setItem('favoriteTeams', JSON.stringify(next))
            return next
        })
    }, [])

    const togglePlayer = useCallback((player: { id: string; name: string; teamName?: string; category?: string; img_url?: string; birthyear?: string }) => {
        setFavoritePlayers(prev => {
            const exists = prev.some(p => p.id === player.id)
            const next = exists
                ? prev.filter(p => p.id !== player.id)
                : [...prev, player]
            localStorage.setItem('favoritePlayers', JSON.stringify(next))
            return next
        })
    }, [])

    const isFavoritePlayer = useCallback((playerId: string) => favoritePlayers.some(p => p.id === playerId), [favoritePlayers])

    const clearPlayers = useCallback(() => {
        setFavoritePlayers([])
        localStorage.removeItem('favoritePlayers')
    }, [])

    return {
        favorites,
        toggle,
        isFavorite,
        clear,
        updateName,
        favoritePlayers,
        togglePlayer,
        isFavoritePlayer,
        clearPlayers,
    }
}