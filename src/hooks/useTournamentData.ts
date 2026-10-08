import { useEffect, useMemo, useState } from 'react'
import { loadTournamentGroups, groupHasTeam, isKnockoutGroup, uniqueTeams } from '../services/tournament'
import { friendlyError } from '../utils/friendlyError'
import type { GroupResponse, MatchSummary, StandingTeam } from '../types'

export interface TournamentScorer {
    player_id: string
    player_name: string
    team_name?: string
    goals: number
}

/** Goals per player summed over the given groups (Taso player_statistics). Only scorers. */
export function tournamentScorers(groups: GroupResponse[], teamId?: string): TournamentScorer[] {
    const map = new Map<string, TournamentScorer>()
    for (const g of groups) {
        for (const p of g.player_statistics || []) {
            if (!p.player_id) continue
            if (teamId && String(p.team_id) !== teamId) continue
            const goals = Number(p.goals) || 0
            if (goals <= 0) continue
            const prev = map.get(p.player_id)
            if (prev) prev.goals += goals
            else map.set(p.player_id, {
                player_id: p.player_id,
                player_name: [p.first_name, p.last_name].filter(Boolean).join(' ') || String(p.player_name || ''),
                team_name: p.team_name,
                goals,
            })
        }
    }
    return [...map.values()].sort((a, b) => b.goals - a.goals || a.player_name.localeCompare(b.player_name, 'fi'))
}

export function useTournamentData({ turnaus, sarja, teamId }: { turnaus?: string; sarja?: string; teamId: string }) {
    const [groups, setGroups] = useState<GroupResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [tick, setTick] = useState(0)

    useEffect(() => {
        if (!turnaus || !sarja) return
        const ctrl = new AbortController()
        setLoading(true)
        setError(null)
        loadTournamentGroups(turnaus, sarja, ctrl.signal)
            .then(gs => {
                if (ctrl.signal.aborted) return
                setGroups(gs)
                if (gs.length === 0) setError('Tämän turnauksen otteluita ei löydy Palloliiton tulospalvelusta.')
            })
            .catch(err => { if (!ctrl.signal.aborted) setError(friendlyError(err, 'Turnausta')) })
            .finally(() => { if (!ctrl.signal.aborted) setLoading(false) })
        return () => ctrl.abort()
    }, [turnaus, sarja, tick])

    const derived = useMemo(() => {
        const stageGroups = groups.filter(g => !isKnockoutGroup(g))
        const knockoutGroups = groups.filter(isKnockoutGroup)
        const myGroups = teamId ? groups.filter(g => groupHasTeam(g, teamId)) : []
        const myStageGroup = myGroups.find(g => !isKnockoutGroup(g)) || null
        const myMatches: MatchSummary[] = myGroups.flatMap(g => (g.matches || []).filter(m => String(m.team_A_id) === teamId || String(m.team_B_id) === teamId))
        let teamName = ''
        for (const g of myGroups) {
            const t: StandingTeam | undefined = (g.teams || []).find(x => String(x.team_id) === teamId)
            if (t?.team_name) { teamName = t.team_name; break }
        }
        const first = groups[0]
        return {
            stageGroups,
            knockoutGroups,
            myGroups,
            myStageGroup,
            myMatches,
            myStanding: myStageGroup ? uniqueTeams(myStageGroup.teams).find(t => String(t.team_id) === teamId) : undefined,
            teamName,
            compName: String(first?.competition_name || ''),
            catName: String(first?.category_name || ''),
            scorers: tournamentScorers(teamId ? myGroups : groups, teamId || undefined).slice(0, 20),
        }
    }, [groups, teamId])

    return { loading, error, groups, reload: () => setTick(t => t + 1), ...derived }
}
