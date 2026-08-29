import { useEffect, useState } from 'react'
import { batchFetch, getMatchDetails } from '../services/api'
import { MATCH_STATUS } from '../types'
import type { MatchDetails, MatchSummary } from '../types'

export interface GoalMoment {
    date: string
    matchId: string
    opponent: string
    minute: string
    scorer: string
    scored: boolean
    score: string
}

export function useSeasonGoalTimeline(teamId: string | undefined, matches: MatchSummary[] | undefined) {
    const [moments, setMoments] = useState<GoalMoment[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!teamId || !matches?.length) {
            setMoments([])
            return
        }
        const played = matches.filter(m =>
            m.status === MATCH_STATUS.PLAYED &&
            (m.team_A_id === teamId || m.team_B_id === teamId) &&
            m.match_id,
        )
        if (!played.length) {
            setMoments([])
            return
        }
        let cancelled = false
        setLoading(true)
        batchFetch(played.map(m => m.match_id), getMatchDetails, 4)
            .then(details => {
                if (cancelled) return
                const out: GoalMoment[] = []
                details.forEach((d, i) => {
                    if (!d) return
                    const summary = played[i]
                    const opp = summary.team_A_id === teamId ? summary.team_B_name : summary.team_A_name
                    for (const g of d.goals || []) {
                        const scored = g.team_id === teamId
                        out.push({
                            date: d.date || summary.date,
                            matchId: d.match_id || summary.match_id,
                            opponent: opp,
                            minute: g.time_min || g.time || '',
                            scorer: g.player_name || '',
                            scored,
                            score: g.score_A != null && g.score_B != null ? `${g.score_A}–${g.score_B}` : '',
                        })
                    }
                })
                out.sort((a, b) => (a.date + a.minute).localeCompare(b.date + b.minute))
                setMoments(out)
            })
            .catch(() => { if (!cancelled) setMoments([]) })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [teamId, matches])

    return { moments, loading }
}
