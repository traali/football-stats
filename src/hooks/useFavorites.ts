import { useState, useCallback, useEffect } from 'react'
import { normalizeTeamId } from '../services/teamSelection'

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
        return parsed.map((item: unknown) => {
            if (typeof item === 'string') {
                const id = normalizeTeamId(item)
                return id ? { id, name: id } : null
            }
            if (item && typeof item === 'object' && 'id' in item && typeof (item as { id: unknown }).id === 'string') {
                const obj = item as { id: string; name?: string; category?: string };
                const id = normalizeTeamId(obj.id)
                return id ? { id, name: obj.name || id, category: obj.category } : null
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

    useEffect(() => {
        try {
            localStorage.setItem('favoriteTeams', JSON.stringify(favorites))
        } catch {
            // Safe fallback for quota or private browsing
        }
    }, [favorites])

    useEffect(() => {
        try {
            localStorage.setItem('favoritePlayers', JSON.stringify(favoritePlayers))
        } catch {
            // Safe fallback for quota or private browsing
        }
    }, [favoritePlayers])

    const toggle = useCallback((teamId: string, teamName?: string, category?: string) => {
        const normalizedId = normalizeTeamId(teamId)
        if (!normalizedId) return
        setFavorites(prev => {
            const exists = prev.some(f => f.id === normalizedId)
            return exists
                ? prev.filter(f => f.id !== normalizedId)
                : [...prev, { id: normalizedId, name: teamName || normalizedId, category }]
        })
    }, [])

    const isFavorite = useCallback((teamId: string) => {
        const normalizedId = normalizeTeamId(teamId)
        if (!normalizedId) return false
        return favorites.some(f => f.id === normalizedId)
    }, [favorites])

    const clear = useCallback(() => {
        setFavorites([])
    }, [])

    const updateName = useCallback((teamId: string, teamName: string, category?: string) => {
        const normalizedId = normalizeTeamId(teamId)
        if (!normalizedId) return
        setFavorites(prev => {
            const index = prev.findIndex(f => f.id === normalizedId)
            if (index === -1 || (prev[index].name === teamName && prev[index].category === category)) return prev
            const next = [...prev]
            next[index] = { ...next[index], name: teamName, category }
            return next
        })
    }, [])

    const togglePlayer = useCallback((player: { id: string; name: string; teamName?: string; category?: string; img_url?: string; birthyear?: string }) => {
        setFavoritePlayers(prev => {
            const exists = prev.some(p => p.id === player.id)
            return exists
                ? prev.filter(p => p.id !== player.id)
                : [...prev, player]
        })
    }, [])

    const isFavoritePlayer = useCallback((playerId: string) => favoritePlayers.some(p => p.id === playerId), [favoritePlayers])

    const clearPlayers = useCallback(() => {
        setFavoritePlayers([])
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