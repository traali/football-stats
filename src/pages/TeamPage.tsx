import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, Users, Calendar, Shield, CalendarDays, User } from 'lucide-react'
import { cn } from '../utils/cn'
import { getTeamProfile, getTeamMatches } from '../services/api'
import { useFavorites } from '../hooks/useFavorites'
import type { TeamResponse, DiscoveryMatch } from '../types/api'
import { APP_CONFIG } from '../types/config'
import { StatBadge } from '../components/StatBadge'

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

    const players = team?.players || []
    
    // Sort matches: past matches played date desc, upcoming fixtures date asc
    const pastMatches = useMemo(() => {
        return matches
            .filter(m => m.date && new Date(m.date + 'T' + (m.time || '00:00:00')) < new Date())
            .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    }, [matches])

    const upcoming = useMemo(() => {
        return matches
            .filter(m => m.status === 'Fixture')
            .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
            .slice(0, 10)
    }, [matches])

    // Calculate dynamic team statistics
    const stats = useMemo(() => {
        const played = matches.filter(m => m.status === 'Played')
        let wins = 0
        let draws = 0
        let losses = 0
        let goalsFor = 0
        let goalsAgainst = 0

        played.forEach(m => {
            const isA = m.team_A_id === teamId
            const myScore = parseInt(isA ? m.fs_A || '0' : m.fs_B || '0', 10)
            const oppScore = parseInt(isA ? m.fs_B || '0' : m.fs_A || '0', 10)
            if (!isNaN(myScore) && !isNaN(oppScore)) {
                goalsFor += myScore
                goalsAgainst += oppScore
                if (myScore > oppScore) wins++
                else if (myScore < oppScore) losses++
                else draws++
            }
        })

        const diff = goalsFor - goalsAgainst
        const diffStr = diff > 0 ? `+${diff}` : `${diff}`

        return {
            played: played.length,
            wins,
            draws,
            losses,
            diffStr,
        }
    }, [matches, teamId])

    if (loading) return (
        <div className="min-h-screen px-4 py-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="animate-pulse bg-surface-1 rounded-xl h-64" />
                <div className="animate-pulse bg-surface-1 rounded-xl h-96" />
            </div>
        </div>
    )
    
    if (error || !teamId) return (
        <div className="min-h-screen px-4 py-8 text-center text-semantic-red">
            {error || 'Joukkuetta ei löytynyt'}
        </div>
    )

    // Render roster list of players as a card grid
    const rosterContent = (
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" /> Joukkueen kokoonpano ({players.length})
            </h3>
            {players.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-8 bg-surface-1 border border-border-hairline rounded-xl">Ei pelaajatietoja</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                    {players.map(p => (
                        <div
                            key={p.player_id}
                            onClick={() => navigate(`/player/${p.player_id}`)}
                            className="bg-surface-1 border border-border-hairline hover:border-accent/30 rounded-xl p-3.5 flex items-center justify-between cursor-pointer hover:bg-surface-2 transition-all active:scale-[0.98] min-h-[56px]"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-full bg-surface-3 flex items-center justify-center shrink-0 border border-border-hairline">
                                    {p.img_url ? (
                                        <img src={p.img_url} alt="" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <User className="w-4 h-4 text-text-muted" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-text-primary font-semibold text-sm truncate">{p.first_name} {p.last_name}</p>
                                    {p.birthyear && <p className="text-text-muted text-xs font-mono mt-0.5">{p.birthyear}</p>}
                                </div>
                            </div>
                            {p.shirt_number && (
                                <span className="bg-accent/10 border border-accent/20 text-accent font-mono font-bold text-xs px-2 py-0.5 rounded shrink-0">
                                    #{p.shirt_number}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )

    // Render matches list (upcoming + past)
    const matchesContent = (
        <div className="space-y-6">
            {upcoming.length > 0 && (
                <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-accent animate-pulse" /> Tulevat ottelut
                    </h3>
                    <div className="space-y-1">
                        {upcoming.map(m => (
                            <div
                                key={m.match_id}
                                onClick={() => navigate(`/match/${m.match_id}`)}
                                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-surface-2 border border-transparent hover:border-border-hairline cursor-pointer transition-all active:scale-[0.99] text-sm min-h-[44px]"
                            >
                                <span className="text-text-muted w-16 shrink-0">{m.date?.slice(5)}</span>
                                <span className="text-text-primary truncate text-right flex-1 pr-2">{m.team_A_name}</span>
                                <span className="text-text-muted mx-2 shrink-0 font-mono text-xs">vs</span>
                                <span className="text-text-primary truncate flex-1 pl-2">{m.team_B_name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {pastMatches.length > 0 && (
                <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-accent" /> Pelatut ottelut
                    </h3>
                    <div className="space-y-1">
                        {pastMatches.map(m => {
                            const isA = m.team_A_id === teamId
                            const myScore = isA ? m.fs_A : m.fs_B
                            const oppScore = isA ? m.fs_B : m.fs_A
                            const wld = myScore && oppScore ? (Number(myScore) > Number(oppScore) ? 'V' : Number(myScore) < Number(oppScore) ? 'H' : 'T') : null
                            return (
                                <div
                                    key={m.match_id}
                                    onClick={() => navigate(`/match/${m.match_id}`)}
                                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-surface-2 border border-transparent hover:border-border-hairline cursor-pointer transition-all active:scale-[0.99] text-sm min-h-[44px]"
                                >
                                    <span className="text-text-muted w-12 shrink-0 text-xs">{m.date?.slice(5)}</span>
                                    <span className="text-text-primary truncate flex-1 text-right pr-2">
                                        {isA ? m.team_B_name : m.team_A_name}
                                    </span>
                                    <span className="font-mono font-bold mx-2 shrink-0 flex items-center gap-1.5">
                                        <span className="text-text-primary">{m.fs_A ? `${myScore}–${oppScore}` : '–'}</span>
                                        {wld && (
                                            <span className={cn(
                                                'text-[10px] font-bold px-1 py-0.5 rounded leading-none',
                                                wld === 'V' ? 'bg-semantic-green/10 text-semantic-green border border-semantic-green/20' : 
                                                wld === 'H' ? 'bg-semantic-red/10 text-semantic-red border border-semantic-red/20' : 
                                                'bg-accent/10 text-accent border border-accent/20'
                                            )}>
                                                {wld}
                                            </span>
                                        )}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {pastMatches.length === 0 && upcoming.length === 0 && (
                <p className="text-text-muted text-sm text-center py-8 bg-surface-1 border border-border-hairline rounded-xl">Ei otteluita</p>
            )}
        </div>
    )

    return (
        <div className="min-h-screen px-4 py-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors text-sm mb-2">
                    <ArrowLeft className="w-4 h-4" /> Takaisin
                </button>

                {/* Team Info Header Card */}
                <div className="bg-surface-1 border border-border-hairline rounded-2xl p-6 relative overflow-hidden space-y-6">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-bmw-cyan via-bmw-magenta to-bmw-amber" />
                    
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <div className="flex items-center gap-3.5">
                                {team?.crest ? (
                                    <div className="w-14 h-14 rounded-full bg-surface-2 border border-border-hairline p-1 flex items-center justify-center shrink-0">
                                        <img src={team.crest} alt="" className="w-full h-full rounded-full object-contain" />
                                    </div>
                                ) : (
                                    <div className="w-14 h-14 rounded-full bg-surface-2 border border-border-hairline flex items-center justify-center shrink-0 text-text-muted">
                                        <Shield className="w-8 h-8" />
                                    </div>
                                )}
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-accent">Joukkueprofiili</span>
                                    <h1 className="text-2xl font-bold text-text-primary truncate mt-0.5">{team?.team_name || teamId}</h1>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-secondary mt-1.5">
                                        {team?.birthyear && (
                                            <span className="flex items-center gap-1 font-medium bg-surface-2 px-2 py-0.5 rounded-md">
                                                <CalendarDays className="w-3.5 h-3.5 text-accent" />
                                                {team.birthyear}
                                            </span>
                                        )}
                                        {(() => {
                                            const getCategoryName = (c: any): string | null => {
                                                if (!c) return null;
                                                const name = c.category_name;
                                                if (typeof name === 'string') return name;
                                                if (name && typeof name.fi === 'string') return name.fi;
                                                if (c.category_name_translations && typeof c.category_name_translations.fi === 'string') {
                                                    return c.category_name_translations.fi;
                                                }
                                                return null;
                                            };
                                            const primaryCatName = getCategoryName(team?.primary_category);
                                            const categoryNames = new Set<string>();
                                            if (primaryCatName) {
                                                categoryNames.add(primaryCatName);
                                            }
                                            if (team?.categories) {
                                                team.categories.forEach(c => {
                                                    const isCurrent = c.competition_season === APP_CONFIG.CURRENT_YEAR || 
                                                        c.competition_id?.includes(APP_CONFIG.CURRENT_YEAR) ||
                                                        c.competition_id?.includes(APP_CONFIG.CURRENT_YEAR.slice(2));
                                                    if (isCurrent) {
                                                        const name = getCategoryName(c);
                                                        if (name) categoryNames.add(name);
                                                    }
                                                });
                                            }
                                            return Array.from(categoryNames).slice(0, 3).map((name, idx) => (
                                                <span key={idx} className="text-xs bg-surface-3 border border-border-hairline px-2 py-0.5 rounded-md text-text-primary font-medium">
                                                    {name}
                                                </span>
                                            ));
                                        })()}
                                        {team?.club_name && <span className="text-text-muted font-medium">{team.club_name}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => teamId && toggle(teamId)}
                            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-surface-2 border border-border-hairline hover:border-accent/30 hover:bg-surface-3 transition-all cursor-pointer active:scale-95"
                            aria-label={fav ? 'Poista suosikeista' : 'Lisää suosikkeihin'}
                        >
                            <Heart className={cn('w-5 h-5 transition-colors', fav ? 'fill-semantic-red text-semantic-red' : 'text-text-muted')} />
                        </button>
                    </div>

                    {/* Calculated Stats Badges Grid */}
                    {stats.played > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-4 border-t border-border-hairline">
                            <StatBadge label="Ottelut" value={stats.played} />
                            <StatBadge label="Voitot" value={stats.wins} variant="success" />
                            <StatBadge label="Tasapelit" value={stats.draws} variant="warning" />
                            <StatBadge label="Häviöt" value={stats.losses} variant="danger" />
                            <StatBadge label="Maaliero" value={stats.diffStr} variant={parseInt(stats.diffStr) > 0 ? 'success' : parseInt(stats.diffStr) < 0 ? 'danger' : 'default'} />
                        </div>
                    )}
                </div>

                {/* Mobile Tabbed Navigation & Contents */}
                <div className="lg:hidden space-y-6">
                    <div className="flex bg-surface-1 border border-border-hairline rounded-xl overflow-hidden p-1 gap-1">
                        <button
                            onClick={() => setTab('matches')}
                            className={cn(
                                'flex-1 py-3 text-sm font-semibold transition-all rounded-lg cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]',
                                tab === 'matches' ? 'bg-surface-3 text-text-primary ring-1 ring-border-hairline' : 'text-text-muted hover:text-text-secondary'
                            )}
                        >
                            <Calendar className="w-4 h-4" /> Ottelut
                        </button>
                        <button
                            onClick={() => setTab('roster')}
                            className={cn(
                                'flex-1 py-3 text-sm font-semibold transition-all rounded-lg cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]',
                                tab === 'roster' ? 'bg-surface-3 text-text-primary ring-1 ring-border-hairline' : 'text-text-muted hover:text-text-secondary'
                            )}
                        >
                            <Users className="w-4 h-4" /> Pelaajat
                        </button>
                    </div>
                    <div>
                        {tab === 'matches' ? matchesContent : rosterContent}
                    </div>
                </div>

                {/* Desktop Side-by-Side Bento Grid Layout */}
                <div className="hidden lg:grid grid-cols-3 gap-8 items-start">
                    {/* Left Column (1/3) - Roster */}
                    <div className="col-span-1 space-y-6">
                        {rosterContent}
                    </div>

                    {/* Right Column (2/3) - Matches */}
                    <div className="col-span-2 space-y-6">
                        {matchesContent}
                    </div>
                </div>
            </div>
        </div>
    )
}