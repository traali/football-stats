import { useEffect, useMemo, useState } from 'react'
import { Calendar } from 'lucide-react'
import type { DiscoveryMatch, TeamResponse } from '../types'
import { Card, MatchRowPast, MatchRowFixture } from '.'
import { isUpcomingDate } from '../utils/dates'
import { TeamStandingsBlock } from './TeamStandingsBlock'
import { useTeamStandings } from '../hooks/useTeamStandings'
import { getTeamProfile } from '../services/api'
import { APP_CONFIG } from '../config'

export function TeamMatchList({ upcoming, pastMatches, teamId, team, year }: {
    upcoming: DiscoveryMatch[]
    pastMatches: DiscoveryMatch[]
    teamId: string
    team?: TeamResponse | null
    year?: string
}) {
    const [resolved, setResolved] = useState<TeamResponse | null>(team || null)
    useEffect(() => {
        if (team) { setResolved(team); return }
        let cancelled = false
        getTeamProfile(teamId).then(t => { if (!cancelled) setResolved(t) }).catch(() => {})
        return () => { cancelled = true }
    }, [team, teamId])

    const tableYear = year || APP_CONFIG.CURRENT_YEAR
    const { group } = useTeamStandings(resolved, teamId, tableYear)
    const pos = useMemo(() => {
        const map: Record<string, string | number> = {}
        for (const t of group?.teams || []) {
            if (t.team_id) map[String(t.team_id)] = t.current_standing
        }
        return map
    }, [group])

    const future = upcoming.filter(m => isUpcomingDate(m.date))
    return (
        <div className="space-y-6">
            <TeamStandingsBlock team={resolved} teamId={teamId} year={tableYear} />

            {future.length > 0 && (
                <Card className="space-y-3">
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-accent animate-pulse" /> Tulevat ottelut
                    </h3>
                    <div className="space-y-1">
                        {future.map(m => (
                            <MatchRowFixture
                                key={m.match_id}
                                matchId={m.match_id}
                                date={m.date}
                                teamAName={m.team_A_name}
                                teamBName={m.team_B_name}
                                standingA={pos[m.team_A_id]}
                                standingB={pos[m.team_B_id]}
                            />
                        ))}
                    </div>
                </Card>
            )}

            {pastMatches.length > 0 && (
                <Card className="space-y-3">
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-accent" /> Pelatut ottelut
                    </h3>
                    <div className="space-y-1">
                        {pastMatches.map(m => {
                            const isA = m.team_A_id === teamId
                            const myScore = isA ? m.fs_A : m.fs_B
                            const oppScore = isA ? m.fs_B : m.fs_A
                            const oppId = isA ? m.team_B_id : m.team_A_id
                            const wld: 'V' | 'H' | 'T' | undefined = m.fs_A && m.fs_B
                                ? (Number(isA ? m.fs_A : m.fs_B) > Number(isA ? m.fs_B : m.fs_A) ? 'V' : Number(isA ? m.fs_A : m.fs_B) < Number(isA ? m.fs_B : m.fs_A) ? 'H' : 'T')
                                : undefined
                            return (
                                <MatchRowPast
                                    key={m.match_id}
                                    matchId={m.match_id}
                                    date={m.date}
                                    opponentName={isA ? m.team_B_name : m.team_A_name}
                                    myScore={myScore}
                                    oppScore={oppScore}
                                    resultIndicator={wld}
                                    opponentStanding={pos[oppId]}
                                />
                            )
                        })}
                    </div>
                </Card>
            )}

            {pastMatches.length === 0 && future.length === 0 && (
                <Card className="py-8 text-center">
                    <p className="text-text-muted text-sm">Ei otteluita</p>
                </Card>
            )}
        </div>
    )
}
