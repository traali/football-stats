import { useEffect, useState } from 'react'
import { batchFetch, getPlayerData } from '../services/api'
import { MATCH_STATUS } from '../types'
import type { MatchDetails } from '../types'
import { cardStatsAsOf, type CardSeasonStats } from '../utils/cardStatsAsOf'

export function useMatchCardStats(match: MatchDetails | undefined) {
    const [byPlayer, setByPlayer] = useState<Record<string, CardSeasonStats>>({})
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!match?.lineups?.length) {
            setByPlayer({})
            setLoading(false)
            return
        }
        const ids = [...new Set(match.lineups.map(p => p.player_id).filter(Boolean))]
        if (!ids.length) {
            setByPlayer({})
            setLoading(false)
            return
        }
        let cancelled = false
        setLoading(true)
        const seasonYear = (match.date || '').slice(0, 4)
        const asOfDate = match.status === MATCH_STATUS.PLAYED ? match.date : undefined
        batchFetch(ids, getPlayerData, 4).then(players => {
            if (cancelled) return
            const next: Record<string, CardSeasonStats> = {}
            ids.forEach((id, i) => {
                next[id] = cardStatsAsOf(players[i]?.matches, { seasonYear, asOfDate })
            })
            setByPlayer(next)
        }).catch(() => { if (!cancelled) setByPlayer({}) }).finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [match])

    return { byPlayer, loading }
}
