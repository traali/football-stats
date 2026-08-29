import { useEffect, useState } from 'react'
import { getGroupFull } from '../services/api'
import type { GroupResponse, TeamResponse } from '../types'

function seasonOf(g: Record<string, string>): string {
    return String(g.competition_season || g.season_id || '')
}

export function useTeamStandings(team: TeamResponse | null | undefined, teamId: string, year: string) {
    const [group, setGroup] = useState<GroupResponse | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!team?.groups?.length || !teamId || !year) {
            setGroup(null)
            return
        }
        const candidates = (team.groups as Array<Record<string, string>>).filter(g => seasonOf(g) === year && g.competition_id && g.category_id && g.group_id)
        const ranked = [...candidates].sort((a, b) => {
            const sa = /syksy/i.test(a.group_name || '') ? 1 : 0
            const sb = /syksy/i.test(b.group_name || '') ? 1 : 0
            return sb - sa
        })
        if (!ranked.length) {
            setGroup(null)
            return
        }
        let cancelled = false
        setLoading(true)
        ;(async () => {
            let picked: GroupResponse | null = null
            for (const g of ranked) {
                const full = await getGroupFull(g.competition_id, g.category_id, g.group_id)
                if (cancelled) return
                if (full?.teams?.some(t => String(t.team_id) === String(teamId))) {
                    picked = full
                    break
                }
                if (!picked && full?.teams?.length) picked = full
            }
            if (!cancelled) setGroup(picked)
        })().catch(() => { if (!cancelled) setGroup(null) }).finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [team, teamId, year])

    return { group, loading }
}
