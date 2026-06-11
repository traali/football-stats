import { useState, useCallback } from 'react'

function loadFavorites(): string[] {
    try {
        const raw = localStorage.getItem('favoriteTeams')
        return raw ? JSON.parse(raw) : []
    } catch {
        return []
    }
}

export function useFavorites() {
    const [favorites, setFavorites] = useState<string[]>(loadFavorites)

    const toggle = useCallback((teamId: string) => {
        setFavorites(prev => {
            const next = prev.includes(teamId)
                ? prev.filter(id => id !== teamId)
                : [...prev, teamId]
            localStorage.setItem('favoriteTeams', JSON.stringify(next))
            return next
        })
    }, [])

    const isFavorite = useCallback((teamId: string) => favorites.includes(teamId), [favorites])

    const clear = useCallback(() => {
        setFavorites([])
        localStorage.removeItem('favoriteTeams')
    }, [])

    return { favorites, toggle, isFavorite, clear }
}