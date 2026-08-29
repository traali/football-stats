import { useEffect, useState } from 'react'
import { batchFetch, getPlayerData } from '../services/api'
import type { MatchDetails, GroupDetails, TeamResponse } from '../types'
import {
    ETELA_2026,
    appearancesFromPlayerMatches,
    evaluateSquad,
    parseAgeClass,
    parseFormat,
    parseLevel,
    parseSeasonHalf,
    type PlayerEligibilityResult,
    type SquadEligibilityResult,
} from '../domain/eligibility'

export function useMatchEligibility(
    match: MatchDetails | undefined,
    group: GroupDetails | null | undefined,
    teamA?: TeamResponse | null,
    teamB?: TeamResponse | null,
) {
    const [byTeam, setByTeam] = useState<Record<string, SquadEligibilityResult>>({})
    const [byPlayer, setByPlayer] = useState<Record<string, PlayerEligibilityResult>>({})
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!match?.lineups?.length) {
            setByTeam({}); setByPlayer({}); return
        }
        const ids = [...new Set(match.lineups.map(p => p.player_id).filter(Boolean))]
        if (ids.length === 0) return
        let cancelled = false
        setLoading(true)
        batchFetch(ids, getPlayerData, 4)
            .then(players => {
                if (cancelled) return
                const playerById = new Map(ids.map((id, i) => [id, players[i]]))
                const level = parseLevel(match.category_name, match.category_id)
                const ageClass = parseAgeClass(match.category_name, match.category_id)
                const format = parseFormat(match.category_id, match.category_name)
                const seasonHalf = parseSeasonHalf(group?.group_name, match.date)
                const nextByTeam: Record<string, SquadEligibilityResult> = {}
                const nextByPlayer: Record<string, PlayerEligibilityResult> = {}

                for (const teamId of [match.team_A_id, match.team_B_id]) {
                    const clubId = (teamId === match.team_A_id ? teamA?.club_id : teamB?.club_id) || teamId
                    const lineup = match.lineups.filter(p => p.team_id === teamId && p.player_id)
                    const ctxs = lineup.map(p => {
                        const raw = playerById.get(p.player_id)
                        const birthYear = raw?.birthyear ? parseInt(raw.birthyear, 10) : 0
                        const apps = appearancesFromPlayerMatches(
                            p.player_id,
                            clubId,
                            raw?.matches,
                            birthYear || undefined,
                        ).filter(a => a.matchId !== match.match_id && a.date <= match.date)
                        return {
                            playerId: p.player_id,
                            clubId,
                            birthYear,
                            exceptions: [] as { kind: 'none' }[],
                            appearances: apps,
                        }
                    })
                    const squad = evaluateSquad(ctxs, {
                        matchId: match.match_id,
                        date: match.date,
                        clubId,
                        teamId,
                        ageClass,
                        level,
                        format,
                        isYouth: true,
                        seasonHalf,
                    }, ETELA_2026)
                    nextByTeam[teamId] = squad
                    for (const r of squad.players) nextByPlayer[r.playerId] = r
                }
                setByTeam(nextByTeam)
                setByPlayer(nextByPlayer)
            })
            .catch(() => {
                if (!cancelled) { setByTeam({}); setByPlayer({}) }
            })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [match, group, teamA, teamB])

    return { byTeam, byPlayer, loading }
}
