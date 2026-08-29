import { Calendar } from 'lucide-react'
import type { DiscoveryMatch } from '../types'
import { Card, MatchRowPast, MatchRowFixture } from '.'
import { isUpcomingDate } from '../utils/dates'

export function TeamMatchList({ upcoming, pastMatches, teamId }: {
    upcoming: DiscoveryMatch[]
    pastMatches: DiscoveryMatch[]
    teamId: string
}) {
    const future = upcoming.filter(m => isUpcomingDate(m.date))
    return (
        <div className="space-y-6">
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
