import { getPlayerData } from './api'
import { getViewedPlayer, rememberViewedPlayer } from './viewedPlayers'
import type { PlayerAPIResponse } from '../types'

export async function loadPlayer(playerId: string, signal?: AbortSignal): Promise<PlayerAPIResponse> {
    try {
        const player = await getPlayerData(playerId, signal)
        if (player) rememberViewedPlayer(playerId, player)
        return player
    } catch (err) {
        const local = getViewedPlayer(playerId)
        if (local) return local
        throw err
    }
}
