import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, TrendingUp, Calendar } from 'lucide-react'
import { cn } from '../utils/cn'
import { getGroupFull } from '../services/api'
import { StandingsTable } from '../components/StandingsTable'
import type { GroupResponse, PlayerStatsEntry } from '../types/api'

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
        <div className="min-h-screen px-4 py-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors text-sm mb-2">
                    <ArrowLeft className="w-4 h-4" /> Takaisin
                </button>

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
                    <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
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
                    </div>
                )}

                {pastMatches.length > 0 && (
                    <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
                        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-accent" /> Viimeisimmät ottelut
                        </h2>
                        <div className="space-y-1">
                            {[...pastMatches].reverse().map((m) => {
                                const wld = m.winner_id && m.winner_id !== '0' && m.winner_id !== '-'
                                    ? (m.winner_id === m.team_A_id ? 'V' : m.winner_id === m.team_B_id ? 'H' : null)
                                    : (m.fs_A && m.fs_B ? 'T' : null)
                                const wldColor = wld === 'V' ? 'text-semantic-green' : wld === 'H' ? 'text-semantic-red' : 'text-accent'
                                return (
                                    <div
                                        key={m.match_id}
                                        onClick={() => navigate(`/match/${m.match_id}`)}
                                        className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-surface-2 border border-transparent hover:border-border-hairline cursor-pointer transition-all active:scale-[0.99] text-sm min-h-[44px]"
                                    >
                                        <span className="text-text-muted text-xs w-12 shrink-0">{m.date?.slice(5)}</span>
                                        <span className="text-text-primary truncate text-right min-w-0 flex-1">{m.team_A_name}</span>
                                        <span className="font-mono font-bold text-text-primary mx-2 shrink-0 flex items-center gap-1">
                                            {m.fs_A}–{m.fs_B}
                                            {wld && <span className={cn('text-xs font-bold', wldColor)}>{wld}</span>}
                                        </span>
                                        <span className="text-text-primary truncate min-w-0 flex-1">{m.team_B_name}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {upcomingMatches.length > 0 && (
                    <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
                        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-accent" /> Tulevat ottelut
                        </h2>
                        <div className="space-y-1">
                            {upcomingMatches.map((m) => (
                                <div
                                    key={m.match_id}
                                    onClick={() => navigate(`/match/${m.match_id}`)}
                                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-surface-2 border border-transparent hover:border-border-hairline cursor-pointer transition-all active:scale-[0.99] text-sm min-h-[44px]"
                                >
                                    <span className="text-text-muted text-xs w-12 shrink-0">{m.date?.slice(5)}</span>
                                    <span className="text-text-primary truncate text-right min-w-0 flex-1">{m.team_A_name}</span>
                                    <span className="font-mono font-bold text-text-muted mx-2 shrink-0">vs</span>
                                    <span className="text-text-primary truncate min-w-0 flex-1">{m.team_B_name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}