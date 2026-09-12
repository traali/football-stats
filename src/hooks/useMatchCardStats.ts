import { useEffect, useState } from 'react'
import { batchFetch, getPlayerData, getTeamMatches } from '../services/api'
import { MATCH_STATUS } from '../types'
import type { MatchDetails } from '../types'
import { cardStatsAsOf, type CardSeasonStats } from '../utils/cardStatsAsOf'
import { getCurrentSeason, halfOf, resolveActiveSeason } from '../utils/dates'

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
        const current = getCurrentSeason()
        const seasonYear = (match.date || '').slice(0, 4) || current.year
        const preferredHalf = halfOf(match.date) || current.half
        const asOfDate = match.status === MATCH_STATUS.PLAYED ? match.date : undefined

        batchFetch(ids, getPlayerData, 4).then(async players => {
            if (cancelled) return
            const teamIds = new Set<string>()
            if (match.team_A_id) teamIds.add(match.team_A_id)
            if (match.team_B_id) teamIds.add(match.team_B_id)
            for (const p of players) {
                for (const m of p?.matches || []) {
                    const y = (m.season_id || m.date || '').slice(0, 4)
                    if (y === seasonYear && m.team_id) teamIds.add(m.team_id)
                }
            }
            const teamIdList = [...teamIds].slice(0, 8)
            const teamRows = await batchFetch(teamIdList, getTeamMatches, 3)
            if (cancelled) return
            const teamMatchesByTeamId: Record<string, NonNullable<typeof teamRows[number]>> = {}
            teamIdList.forEach((tid, i) => {
                teamMatchesByTeamId[tid] = teamRows[i] || []
            })
            const next: Record<string, CardSeasonStats> = {}
            ids.forEach((id, i) => {
                const ms = players[i]?.matches
                const inYear = (ms || []).filter(m => (m.season_id || m.date || '').startsWith(seasonYear))
                const inferred = resolveActiveSeason(inYear.length ? inYear : ms)
                next[id] = cardStatsAsOf(ms, {
                    seasonYear,
                    preferredHalf: inferred.half || preferredHalf,
                    asOfDate,
                    teamMatchesByTeamId,
                })
            })
            setByPlayer(next)
        }).catch(() => { if (!cancelled) setByPlayer({}) }).finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [match])

    return { byPlayer, loading }
}
