import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, Users, Calendar, Shield } from 'lucide-react'
import { cn } from '../utils/cn'
import { getTeamProfile, getTeamMatches } from '../services/api'
import { useFavorites } from '../hooks/useFavorites'
import type { TeamResponse, DiscoveryMatch } from '../types/api'

export function TeamPage() {
    const { teamId } = useParams()
    const navigate = useNavigate()
    const { isFavorite, toggle } = useFavorites()
    const [team, setTeam] = useState<TeamResponse | null>(null)
    const [matches, setMatches] = useState<DiscoveryMatch[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [tab, setTab] = useState<'roster' | 'matches'>('matches')

    const fav = teamId ? isFavorite(teamId) : false

    useEffect(() => {
        if (!teamId) return
        setLoading(true)
        Promise.all([
            getTeamProfile(teamId),
            getTeamMatches(teamId),
        ])
            .then(([t, m]) => { setTeam(t); setMatches(m); setLoading(false) })
            .catch(e => { setError(e.message); setLoading(false) })
    }, [teamId])

    if (loading) return <div className="min-h-screen px-4 py-8"><div className="max-w-6xl mx-auto space-y-6"><div className="animate-pulse bg-surface-1 rounded-xl h-64" /><div className="animate-pulse bg-surface-1 rounded-xl h-96" /></div></div>
    if (error || !teamId) return <div className="min-h-screen px-4 py-8 text-center text-semantic-red">{error || 'Joukkuetta ei löytynyt'}</div>

    const players = team?.players || []
    const pastMatches = matches.filter(m => m.date && new Date(m.date + 'T' + (m.time || '00:00:00')) < new Date()).sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    const upcoming = matches.filter(m => m.status === 'Fixture').slice(0, 10)

    return (
        <div className="min-h-screen px-4 py-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors text-sm mb-2">
                    <ArrowLeft className="w-4 h-4" /> Takaisin
                </button>

                <div className="bg-surface-1 border border-border-hairline rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                                {team?.crest && (
                                    <img src={team.crest} alt="" className="w-10 h-10 rounded-full object-contain bg-surface-2" />
                                )}
                                {!team?.crest && <Shield className="w-10 h-10 text-text-muted" />}
                                <h1 className="text-xl font-bold text-text-primary truncate">{team?.team_name || teamId}</h1>
                            </div>
                        </div>
                        <button
                            onClick={() => teamId && toggle(teamId)}
                            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-surface-2 transition-colors focus-visible:ring-2 ring-accent/50"
                            aria-label={fav ? 'Poista suosikeista' : 'Lisää suosikkeihin'}
                        >
                            <Heart className={cn('w-6 h-6 transition-colors', fav ? 'fill-semantic-red text-semantic-red' : 'text-text-muted')} />
                        </button>
                    </div>
                </div>

                <div className="flex bg-surface-1 border border-border-hairline rounded-xl overflow-hidden">
                    <button
                        onClick={() => setTab('matches')}
                        className={cn('flex-1 py-3 text-sm font-medium transition-colors', tab === 'matches' ? 'bg-surface-3 text-text-primary' : 'text-text-muted hover:text-text-secondary')}
                    ><Calendar className="w-4 h-4 inline mr-1.5" />Ottelut</button>
                    <button
                        onClick={() => setTab('roster')}
                        className={cn('flex-1 py-3 text-sm font-medium transition-colors', tab === 'roster' ? 'bg-surface-3 text-text-primary' : 'text-text-muted hover:text-text-secondary')}
                    ><Users className="w-4 h-4 inline mr-1.5" />Pelaajat</button>
                </div>

                {tab === 'matches' && (
                    <div className="space-y-4">
                        {upcoming.length > 0 && (
                            <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
                                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Tulevat ottelut</h3>
                                {upcoming.map(m => (
                                    <div key={m.match_id} onClick={() => navigate(`/match/${m.match_id}`)} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-surface-2 cursor-pointer transition-colors text-sm">
                                        <span className="text-text-muted w-16 shrink-0">{m.date?.slice(5)}</span>
                                        <span className="text-text-primary truncate text-right flex-1">{m.team_A_name}</span>
                                        <span className="text-text-muted mx-2 shrink-0">vs</span>
                                        <span className="text-text-primary truncate flex-1">{m.team_B_name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {pastMatches.length > 0 && (
                            <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
                                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Pelatut ottelut</h3>
                                {pastMatches.map(m => {
                                    const isA = m.team_A_id === teamId
                                    const myScore = isA ? m.fs_A : m.fs_B
                                    const oppScore = isA ? m.fs_B : m.fs_A
                                    const wld = myScore && oppScore ? (Number(myScore) > Number(oppScore) ? 'V' : Number(myScore) < Number(oppScore) ? 'H' : 'T') : null
                                    return (
                                        <div key={m.match_id} onClick={() => navigate(`/match/${m.match_id}`)} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-surface-2 cursor-pointer transition-colors text-sm">
                                            <span className="text-text-muted w-12 shrink-0 text-xs">{m.date?.slice(5)}</span>
                                            <span className="text-text-primary truncate flex-1 text-right">{isA ? m.team_B_name : m.team_A_name}</span>
                                            <span className="font-mono font-bold mx-2 shrink-0 flex items-center gap-1">
                                                {m.fs_A ? `${myScore}–${oppScore}` : '–'}
                                                {wld && <span className={cn('text-xs', wld === 'V' ? 'text-semantic-green' : wld === 'H' ? 'text-semantic-red' : 'text-accent')}>{wld}</span>}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                        {pastMatches.length === 0 && upcoming.length === 0 && (
                            <p className="text-text-muted text-sm text-center py-8">Ei otteluita</p>
                        )}
                    </div>
                )}

                {tab === 'roster' && (
                    <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-2">
                        {players.length === 0 && <p className="text-text-muted text-sm text-center py-4">Ei pelaajatietoja</p>}
                        {players.map(p => (
                            <div
                                key={p.player_id}
                                onClick={() => navigate(`/player/${p.player_id}`)}
                                className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-surface-2 cursor-pointer transition-colors"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    {p.shirt_number && <span className="text-text-muted text-xs font-mono w-6 shrink-0">#{p.shirt_number}</span>}
                                    <span className="text-text-primary font-medium truncate text-sm">{p.first_name} {p.last_name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}