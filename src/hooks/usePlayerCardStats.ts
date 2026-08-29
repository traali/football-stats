import { useEffect, useState } from 'react'
import { batchFetch, getPlayerData } from '../services/api'
import { cardStatsAsOf, type CardSeasonStats } from '../utils/cardStatsAsOf'

export function usePlayerCardStats(playerIds: string[], seasonYear: string) {
    const [byPlayer, setByPlayer] = useState<Record<string, CardSeasonStats>>({})
    const key = playerIds.slice().sort().join(',')

    useEffect(() => {
        const ids = key.split(',').filter(Boolean)
        if (!ids.length || !seasonYear) {
            setByPlayer({})
            return
        }
        let cancelled = false
        batchFetch(ids, getPlayerData, 4).then(players => {
            if (cancelled) return
            const next: Record<string, CardSeasonStats> = {}
            ids.forEach((id, i) => {
                next[id] = cardStatsAsOf(players[i]?.matches, { seasonYear })
            })
            setByPlayer(next)
        }).catch(() => { if (!cancelled) setByPlayer({}) })
        return () => { cancelled = true }
    }, [key, seasonYear])

    return byPlayer
}
