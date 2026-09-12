import { useEffect, useState } from 'react'
import { batchFetch, getPlayerData } from '../services/api'
import { cardStatsAsOf, type CardSeasonStats } from '../utils/cardStatsAsOf'
import { resolveActiveSeason } from '../utils/dates'

export function usePlayerCardStats(
    playerIds: string[],
    seasonYear: string,
    seasonHalf: 'all' | 'kevät' | 'syksy' = 'all',
) {
    const [byPlayer, setByPlayer] = useState<Record<string, CardSeasonStats>>({})
    const idsKey = playerIds.slice().sort().join(',')

    useEffect(() => {
        const ids = idsKey.split(',').filter(Boolean)
        if (!ids.length || !seasonYear) {
            setByPlayer({})
            return
        }
        let cancelled = false
        batchFetch(ids, getPlayerData, 4).then(players => {
            if (cancelled) return
            const next: Record<string, CardSeasonStats> = {}
            ids.forEach((id, i) => {
                const inferred = resolveActiveSeason(players[i]?.matches)
                const preferredHalf = seasonHalf === 'all' ? inferred.half : seasonHalf
                next[id] = cardStatsAsOf(players[i]?.matches, { seasonYear, seasonHalf, preferredHalf })
            })
            setByPlayer(next)
        }).catch(() => { if (!cancelled) setByPlayer({}) })
        return () => { cancelled = true }
    }, [idsKey, seasonYear, seasonHalf])

    return byPlayer
}