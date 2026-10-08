import { useCallback, useSyncExternalStore } from 'react'
import { favoritesStore, type FavoritePlayer } from '../services/favoritesStore'
import { normalizeTeamId } from '../services/teamSelection'

export type { FavoriteTeam, FavoritePlayer } from '../services/favoritesStore'

/** Favourite teams and players, saved on this phone (localStorage) and shared by every screen. */
export function useFavorites() {
    const state = useSyncExternalStore(favoritesStore.subscribe, favoritesStore.get, favoritesStore.get)
    const isFavorite = useCallback((teamId: string) => {
        const id = normalizeTeamId(teamId)
        return !!id && state.teams.some(f => f.id === id)
    }, [state])
    const isFavoritePlayer = useCallback((playerId: string) => state.players.some(p => p.id === playerId), [state])
    return {
        favorites: state.teams,
        favoritePlayers: state.players,
        toggle: favoritesStore.toggleTeam,
        updateName: favoritesStore.updateTeam,
        clear: favoritesStore.clearTeams,
        togglePlayer: (p: FavoritePlayer) => favoritesStore.togglePlayer(p),
        clearPlayers: favoritesStore.clearPlayers,
        isFavorite,
        isFavoritePlayer,
    }
}
