import { useEffect, useState } from 'react'
import { batchFetch, getMatchDetails } from '../services/api'
import { MATCH_STATUS } from '../types'
import type { MatchSummary } from '../types'

export interface GoalMoment {
    date: string
    matchId: string
    opponent: string
    minute: string
    scorer: string
    scored: boolean
    score: string
}

export interface PlayedLineup {
    date: string
    matchId: string
    opponent: string
    score: string
    won: boolean | null
    names: string[]
}

export function useSeasonGoalTimeline(teamId: string | undefined, matches: MatchSummary[] | undefined, enabled = true) {
    const [moments, setMoments] = useState<GoalMoment[]>([])
    const [lineups, setLineups] = useState<PlayedLineup[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!enabled || !teamId || !matches?.length) {
            if (!enabled) {
                setMoments([])
                setLineups([])
                setLoading(false)
            }
            return
        }
        const played = matches.filter(m =>
            m.status === MATCH_STATUS.PLAYED &&
            (m.team_A_id === teamId || m.team_B_id === teamId) &&
            m.match_id,
        )
        if (!played.length) {
            setMoments([])
            setLineups([])
            return
        }
        let cancelled = false
        setLoading(true)
        batchFetch(played.map(m => m.match_id), getMatchDetails, 4)
            .then(details => {
                if (cancelled) return
                const out: GoalMoment[] = []
                const lus: PlayedLineup[] = []
                details.forEach((d, i) => {
                    if (!d) return
                    const summary = played[i]
                    const isA = summary.team_A_id === teamId
                    const opp = isA ? summary.team_B_name : summary.team_A_name
                    const my = Number(isA ? d.fs_A ?? summary.fs_A : d.fs_B ?? summary.fs_B)
                    const their = Number(isA ? d.fs_B ?? summary.fs_B : d.fs_A ?? summary.fs_A)
                    const won = Number.isNaN(my) || Number.isNaN(their) ? null : my > their
                    const names = (d.lineups || [])
                        .filter((p: { team_id?: string }) => String(p.team_id) === String(teamId))
                        .map((p: { first_name?: string; last_name?: string; shirt_number?: string }) => {
                            const n = `${p.first_name || ''} ${p.last_name || ''}`.trim()
                            return p.shirt_number ? `#${p.shirt_number} ${n}` : n
                        })
                        .filter(Boolean)
                    lus.push({
                        date: d.date || summary.date,
                        matchId: d.match_id || summary.match_id,
                        opponent: opp,
                        score: `${my}–${their}`,
                        won,
                        names,
                    })
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
                lus.sort((a, b) => a.date.localeCompare(b.date))
                setMoments(out)
                setLineups(lus)
            })
            .catch(() => { if (!cancelled) { setMoments([]); setLineups([]) } })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [teamId, matches, enabled])

    return { moments, lineups, loading }
}
