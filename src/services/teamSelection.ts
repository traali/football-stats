import type { FavoriteTeam } from '../hooks/useFavorites'

const LAST_SELECTED_TEAM_KEY = 'football_stats_last_selected_team'

export function normalizeTeamId(value: string | null | undefined): string | null {
    if (!value) return null
    const trimmed = value.trim()
    if (!/^\d+$/.test(trimmed)) return null
    return trimmed
}

export function setLastSelectedTeamId(teamId: string) {
    const normalized = normalizeTeamId(teamId)
    if (!normalized || typeof localStorage === 'undefined') return
    try {
        localStorage.setItem(LAST_SELECTED_TEAM_KEY, normalized)
    } catch {
        // Ignore private mode/quota failures
    }
}

export function getLastSelectedTeamId(): string | null {
    if (typeof localStorage === 'undefined') return null
    try {
        return normalizeTeamId(localStorage.getItem(LAST_SELECTED_TEAM_KEY))
    } catch {
        return null
    }
}

export function sortFavoritesByLastSelected(favorites: FavoriteTeam[], selectedTeamId: string | null): FavoriteTeam[] {
    if (!selectedTeamId) return favorites
    const selectedIndex = favorites.findIndex(f => f.id === selectedTeamId)
    if (selectedIndex <= 0) return favorites
    return [favorites[selectedIndex], ...favorites.slice(0, selectedIndex), ...favorites.slice(selectedIndex + 1)]
}
