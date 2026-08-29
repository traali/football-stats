import { useEffect, useState } from 'react'
import { batchFetch, getPlayerData } from '../services/api'
import { MATCH_STATUS } from '../types'
import type { MatchDetails } from '../types'
import { cardStatsAsOf, type CardSeasonStats } from '../utils/cardStatsAsOf'

export function useMatchCardStats(match: MatchDetails | undefined) {
    const [byPlayer, setByPlayer] = useState<Record<string, CardSeasonStats>>({})

    useEffect(() => {
        if (!match?.lineups?.length) {
            setByPlayer({})
            return
        }
        const ids = [...new Set(match.lineups.map(p => p.player_id).filter(Boolean))]
        if (!ids.length) return
        let cancelled = false
        const seasonYear = (match.date || '').slice(0, 4)
        const asOfDate = match.status === MATCH_STATUS.PLAYED ? match.date : undefined
        batchFetch(ids, getPlayerData, 4).then(players => {
            if (cancelled) return
            const next: Record<string, CardSeasonStats> = {}
            ids.forEach((id, i) => {
                next[id] = cardStatsAsOf(players[i]?.matches, { seasonYear, asOfDate })
            })
            setByPlayer(next)
        }).catch(() => { if (!cancelled) setByPlayer({}) })
        return () => { cancelled = true }
    }, [match])

    return byPlayer
}
