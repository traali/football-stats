import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Shield, User, ChevronRight, Target } from 'lucide-react'
import { useFavorites } from '../hooks/useFavorites'
import { getTeamProfile, getPlayerData } from '../services/api'
import { getTeamCategory } from '../utils/dataProcessors'
import { APP_CONFIG } from '../config'
import { MATCH_STATUS } from '../types'
import type { TeamResponse, PlayerAPIResponse } from '../types'
import { PageLayout, BackButton } from '../components'
import { cn } from '../utils/cn'

export function FavoritesPage() {
    const navigate = useNavigate()
    const { favorites, clear, favoritePlayers, clearPlayers } = useFavorites()
    const [tab, setTab] = useState<'all' | 'teams' | 'players'>('all')
    const [teams, setTeams] = useState<Record<string, TeamResponse | null>>({})
    const [playerProfiles, setPlayerProfiles] = useState<Record<string, PlayerAPIResponse | null>>({})
    const [, setLoading] = useState(true)

    useEffect(() => {
        if (favorites.length === 0) { setLoading(false); return }
        let cancelled = false
        Promise.all(favorites.map(fav => getTeamProfile(fav.id).then(t => ({ fid: fav.id, t }))))
            .then(results => { if (!cancelled) { setTeams(Object.fromEntries(results.map(({ fid, t }) => [fid, t]))); setLoading(false) } })
            .catch(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [favorites])

    useEffect(() => {
        if (favoritePlayers.length === 0) return
        let cancelled = false
        Promise.all(favoritePlayers.map(p => getPlayerData(p.id).then(res => ({ pid: p.id, res }))))
            .then(results => {
                if (!cancelled) {
                    setPlayerProfiles(Object.fromEntries(results.map(({ pid, res }) => [pid, res])))
                }
            })
            .catch(() => {})
        return () => { cancelled = true }
    }, [favoritePlayers])

    const totalCount = favorites.length + favoritePlayers.length

    return (
        <PageLayout>
            <BackButton className="mb-2" />
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                    <Heart className="w-6 h-6 text-semantic-red fill-semantic-red" /> Suosikit
                </h1>
                {totalCount > 0 && (
                    <button
                        onClick={() => { clear(); clearPlayers() }}
                        className="text-xs text-text-muted hover:text-semantic-red transition-colors px-3 py-1.5 min-h-[44px] flex items-center"
                    >
                        Tyhjennä kaikki
                    </button>
                )}
            </div>

            {totalCount === 0 ? (
                <div className="text-center py-16 space-y-4">
                    <Heart className="w-12 h-12 text-text-muted mx-auto" />
                    <p className="text-text-muted">Ei suosikkeja vielä</p>
                    <p className="text-text-muted text-sm">
                        Lisää joukkueita tai pelaajia suosikeiksi painamalla sydänkuvaketta joukkue- tai pelaajasivulla.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Tabs if both exist */}
                    {favorites.length > 0 && favoritePlayers.length > 0 && (
                        <div className="flex bg-surface-2 p-1 rounded-xl border border-border-hairline">
                            <button
                                type="button"
                                onClick={() => setTab('all')}
                                className={cn(
                                    "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all min-h-[36px]",
                                    tab === 'all' ? "bg-surface-1 text-accent shadow-sm" : "text-text-muted hover:text-text-primary"
                                )}
                            >
                                Kaikki ({totalCount})
                            </button>
                            <button
                                type="button"
                                onClick={() => setTab('teams')}
                                className={cn(
                                    "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all min-h-[36px]",
                                    tab === 'teams' ? "bg-surface-1 text-accent shadow-sm" : "text-text-muted hover:text-text-primary"
                                )}
                            >
                                Joukkueet ({favorites.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setTab('players')}
                                className={cn(
                                    "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all min-h-[36px]",
                                    tab === 'players' ? "bg-surface-1 text-accent shadow-sm" : "text-text-muted hover:text-text-primary"
                                )}
                            >
                                Pelaajat ({favoritePlayers.length})
                            </button>
                        </div>
                    )}

                    {/* Favorite Players Section */}
                    {(tab === 'all' || tab === 'players') && favoritePlayers.length > 0 && (
                        <section className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                                    <User className="w-4 h-4 text-accent" /> Suosikkipelaajat ({favoritePlayers.length})
                                </h2>
                            </div>
                            <div className="space-y-2">
                                {favoritePlayers.map(p => {
                                    const profile = playerProfiles[p.id]
                                    const safeMatches = profile?.matches || []
                                    const thisYearMatches = safeMatches.filter(m => m.status === MATCH_STATUS.PLAYED && (m.date || '').startsWith(APP_CONFIG.CURRENT_YEAR))
                                    const upcomingMatches = safeMatches.filter(m => m.status === MATCH_STATUS.FIXTURE)
                                    const totalGoals = thisYearMatches.reduce((sum, m) => sum + (parseInt(String(m.player_goals || '0')) || 0), 0)

                                    return (
                                        <div
                                            key={p.id}
                                            onClick={() => navigate(`/player/${p.id}`)}
                                            className="bg-surface-1 border border-border-hairline rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-surface-2 transition-colors min-h-[52px]"
                                        >
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                <div className="w-11 h-11 rounded-full bg-surface-3 border border-border-hairline flex items-center justify-center shrink-0">
                                                    {p.img_url || profile?.img_url ? (
                                                        <img src={p.img_url || profile?.img_url} alt="" className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        <User className="w-6 h-6 text-text-muted" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-text-primary font-semibold text-sm truncate">{p.name}</p>
                                                    <p className="text-text-muted text-xs truncate mt-0.5">
                                                        {p.teamName || 'Pelaaja'} {p.category ? `· ${p.category}` : ''}
                                                    </p>
                                                    {profile && (
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[11px] font-mono text-accent font-medium">
                                                                {thisYearMatches.length} ottelua
                                                            </span>
                                                            {totalGoals > 0 && (
                                                                <span className="text-[11px] font-mono text-semantic-green font-medium flex items-center gap-0.5">
                                                                    <Target className="w-3 h-3" /> {totalGoals} m
                                                                </span>
                                                            )}
                                                            {upcomingMatches.length > 0 && (
                                                                <span className="text-[11px] font-mono text-text-secondary">
                                                                    · {upcomingMatches.length} tulossa
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-text-muted shrink-0 ml-2" />
                                        </div>
                                    )
                                })}
                            </div>
                        </section>
                    )}

                    {/* Favorite Teams Section */}
                    {(tab === 'all' || tab === 'teams') && favorites.length > 0 && (
                        <section className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-accent" /> Suosikkijoukkueet ({favorites.length})
                                </h2>
                            </div>
                            <div className="space-y-2">
                                {favorites.map(fav => {
                                    const team = teams[fav.id]
                                    return (
                                        <div
                                            key={fav.id}
                                            onClick={() => navigate(`/team/${fav.id}`)}
                                            className="bg-surface-1 border border-border-hairline rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-surface-2 transition-colors min-h-[52px]"
                                        >
                                            <Shield className="w-8 h-8 text-accent shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-text-primary font-medium truncate">
                                                    {team?.team_name || fav.name}
                                                </p>
                                                {(team ? getTeamCategory(team, APP_CONFIG.CURRENT_YEAR) : fav.category) && (
                                                    <p className="text-text-muted text-xs truncate mt-0.5">
                                                        {team ? getTeamCategory(team, APP_CONFIG.CURRENT_YEAR) : fav.category}
                                                    </p>
                                                )}
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-text-muted shrink-0" />
                                        </div>
                                    )
                                })}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </PageLayout>
    )
}