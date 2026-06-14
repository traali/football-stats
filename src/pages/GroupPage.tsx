import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { TrendingUp, Calendar } from 'lucide-react'
import { getGroupFull } from '../services/api'
import { StandingsTable, BackButton, PageLayout, Card, MatchRowSymmetric, MatchRowFixture } from '../components'
import type { GroupResponse, PlayerStatsEntry } from '../types'

export function GroupPage() {
    const { compId, catId, groupId } = useParams()
    const navigate = useNavigate()
    const [group, setGroup] = useState<GroupResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null)

    useEffect(() => {
        if (!compId || !catId || !groupId) return
        setLoading(true)
        getGroupFull(compId, catId, groupId)
            .then(g => { setGroup(g); setLoading(false) })
            .catch(e => { setError(e.message); setLoading(false) })
    }, [compId, catId, groupId])

    if (loading) return <div className="min-h-screen px-4 py-8"><div className="max-w-6xl mx-auto space-y-6"><div className="animate-pulse bg-surface-1 rounded-xl h-96" /></div></div>
    if (error || !group) return <div className="min-h-screen px-4 py-8 text-center text-semantic-red">{error || 'Ryhmää ei löytynyt'}</div>

    const topScorers: PlayerStatsEntry[] = (group.player_statistics || [])
        .filter(p => parseInt(p.goals || '0') > 0)
        .sort((a, b) => (parseInt(b.goals || '0') || 0) - (parseInt(a.goals || '0') || 0))
        .slice(0, 20)

    const matches = group.matches || []
    const pastMatches = matches.filter(m => m.status === 'Played').slice(-10)
    const upcomingMatches = matches.filter(m => m.status === 'Fixture').slice(0, 5)

    return (
        <PageLayout>
            <BackButton className="mb-2" />

                <div>
                    <h1 className="text-2xl font-bold text-text-primary">{group.group_name || 'Ryhmä'}</h1>
                    <p className="text-text-muted text-sm">{group.competition_name} / {group.category_name}</p>
                </div>

                <div className="space-y-3">
                    <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-accent" /> Sarjataulukko
                    </h2>
                    <StandingsTable teams={group.teams || []} matches={group.matches || []} selectedTeam={selectedTeam} onSelectTeam={setSelectedTeam} />
                </div>

                {topScorers.length > 0 && (
                    <Card className="space-y-3">
                        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-accent" /> Maalintekijät
                        </h2>
                        <div className="space-y-1">
                            {topScorers.map((p, i) => (
                                <div
                                    key={p.player_id || i}
                                    onClick={() => p.player_id && navigate(`/player/${p.player_id}`)}
                                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-2 border border-transparent hover:border-border-hairline cursor-pointer transition-all active:scale-[0.99] min-h-[44px]"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="text-text-muted text-xs font-mono w-5 shrink-0">{i + 1}.</span>
                                        <span className="text-text-primary font-medium truncate text-sm">{p.player_name}</span>
                                        <span
                                            onClick={e => { e.stopPropagation(); navigate(`/team/${p.team_id}`) }}
                                            className="text-text-muted text-xs truncate cursor-pointer hover:text-accent shrink-0"
                                        >
                                            ({p.team_name})
                                        </span>
                                    </div>
                                    <span className="text-accent font-bold font-mono text-sm shrink-0 ml-2">{p.goals}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {pastMatches.length > 0 && (
                    <Card className="space-y-3">
                        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-accent" /> Viimeisimmät ottelut
                        </h2>
                        <div className="space-y-1">
                            {[...pastMatches].reverse().map((m) => (
                                <MatchRowSymmetric
                                    key={m.match_id}
                                    matchId={m.match_id}
                                    date={m.date}
                                    teamAName={m.team_A_name}
                                    teamBName={m.team_B_name}
                                    scoreA={m.fs_A}
                                    scoreB={m.fs_B}
                                    winnerId={m.winner_id}
                                />
                            ))}
                        </div>
                    </Card>
                )}

                {upcomingMatches.length > 0 && (
                    <Card className="space-y-3">
                        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-accent" /> Tulevat ottelut
                        </h2>
                        <div className="space-y-1">
                            {upcomingMatches.map((m) => (
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
        </PageLayout>
    )
}