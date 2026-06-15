import { useState, useCallback } from 'react'

export interface FavoriteTeam {
    id: string
    name: string
    category?: string
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

export function useFavorites() {
    const [favorites, setFavorites] = useState<FavoriteTeam[]>(loadFavorites)

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

    return { favorites, toggle, isFavorite, clear, updateName }
}