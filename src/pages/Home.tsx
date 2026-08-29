import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Trophy, Heart, Shield, ChevronRight, Calendar, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components'
import { getTeamMatches, getTeamProfile } from '../services/api'
import { listViewedMatches, type ViewedMatch } from '../services/viewedCache'
import { useFavorites } from '../hooks/useFavorites'
import { getTeamCategory } from '../utils/dataProcessors'
import { APP_CONFIG, APP_NAME, FEATURED } from '../config'
import type { DiscoveryMatch } from '../types'
import { MATCH_STATUS } from '../types'
import { PageLayout } from '../components'
import { formatDate, formatTime } from '../utils/dates'
import { isMatchLive, pickHeroMatch } from '../utils/matchLive'

export function Home() {
    const [matchId, setMatchId] = useState('')
    const [hero, setHero] = useState<DiscoveryMatch | null>(null)
    const [viewed, setViewed] = useState<ViewedMatch[]>([])
    const [loadingNext, setLoadingNext] = useState(true)
    const navigate = useNavigate()
    const { favorites, updateName } = useFavorites()

    useEffect(() => {
        setViewed(listViewedMatches().slice(0, 8))
        const ctrl = new AbortController()
        getTeamMatches(FEATURED.teamId, ctrl.signal)
            .then(matches => {
                const today = new Date().toISOString().slice(0, 10)
                setHero(pickHeroMatch(matches, today))
            })
            .catch(() => setHero(null))
            .finally(() => setLoadingNext(false))
        return () => ctrl.abort()
    }, [])

    useEffect(() => {
        if (favorites.length === 0) return
        let cancelled = false
        const legacyFavorites = favorites.filter(f => f.name === f.id || !f.category)
        if (legacyFavorites.length === 0) return
        Promise.all(
            legacyFavorites.map(f =>
                getTeamProfile(f.id)
                    .then(profile => {
                        if (profile && !cancelled) {
                            const category = getTeamCategory(profile, APP_CONFIG.CURRENT_YEAR)
                            updateName(f.id, profile.team_name || f.id, category)
                        }
                    })
                    .catch(() => {}),
            ),
        )
        return () => { cancelled = true }
    }, [favorites, updateName])

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        const trimmed = matchId.trim()
        if (!trimmed) return
        navigate(`/match/${trimmed}`)
    }

    const venue = hero ? String(hero.venue_name || hero.venue || hero.venue_city_name || '') : ''
    const live = hero ? isMatchLive(hero) : false
    const justPlayed = hero?.status === MATCH_STATUS.PLAYED
    const label = live ? 'Käynnissä' : justPlayed ? 'Viimeisin ottelu' : 'Seuraava ottelu'
    const score = justPlayed || live
        ? `${hero?.fs_A ?? hero?.live_A ?? '-'} – ${hero?.fs_B ?? hero?.live_B ?? '-'}`
        : null

    return (
        <PageLayout>
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-text-primary">{APP_NAME}</h1>
                <p className="text-text-secondary text-sm">PPJ/Laru sin · P13 Kolmonen · Etelä</p>
            </motion.div>

            <section>
                {loadingNext && <div className="animate-pulse bg-surface-1 rounded-xl h-28" />}
                {hero && (
                    <button type="button" onClick={() => navigate(`/match/${hero.match_id}`)}
                        className="w-full text-left bg-surface-1 border border-border-hairline rounded-2xl p-4 hover:bg-surface-2 transition-colors">
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${live ? 'text-semantic-red' : 'text-accent'}`}>{label}</p>
                        <p className="text-lg font-bold text-text-primary">{hero.team_A_name} – {hero.team_B_name}</p>
                        {score && <p className="font-mono text-xl font-bold mt-1">{score}</p>}
                        <p className="text-sm text-text-secondary mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(hero.date, 'with-year')} {live && String(hero.time || '').includes("'") ? hero.time : formatTime(hero.time)}
                            </span>
                            {venue && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{venue}</span>}
                        </p>
                    </button>
                )}
            </section>

            <section>
                <button type="button" onClick={() => navigate(`/team/${FEATURED.teamId}`)}
                    className="w-full bg-surface-1 border border-border-hairline rounded-xl p-4 flex items-center justify-between hover:bg-surface-2 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                        <Shield className="w-6 h-6 text-accent shrink-0" />
                        <div className="min-w-0 text-left">
                            <p className="text-text-primary font-semibold truncate">{FEATURED.teamName}</p>
                            <p className="text-text-muted text-xs">Joukkue · Syksy 1 · {FEATURED.calendarNote}</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-text-muted shrink-0" />
                </button>
            </section>

            {viewed.length > 0 && (
                <section className="space-y-2">
                    <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Avatut ottelut</h2>
                    {viewed.map(({ match }) => (
                        <button key={match.match_id} type="button" onClick={() => navigate(`/match/${match.match_id}`)}
                            className="w-full text-left bg-surface-1 border border-border-hairline rounded-xl px-3 py-2.5 flex items-center justify-between hover:bg-surface-2">
                            <span className="text-xs text-text-muted w-20 shrink-0">{formatDate(match.date, 'with-year')}</span>
                            <span className="text-sm text-text-primary truncate flex-1 px-2">{match.team_A_name} – {match.team_B_name}</span>
                            <span className="font-mono text-xs shrink-0">{match.fs_A}–{match.fs_B}</span>
                        </button>
                    ))}
                </section>
            )}

            {favorites.length > 0 && (
                <section className="space-y-3">
                    <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                        <Heart className="w-4 h-4 text-semantic-red fill-semantic-red" /> Suosikit
                    </h2>
                    <div className="grid grid-cols-2 gap-2">
                        {favorites.map(fav => (
                            <div key={fav.id} onClick={() => navigate(`/team/${fav.id}`)}
                                className="bg-surface-1 border border-border-hairline rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-surface-2 min-h-[52px]">
                                <Shield className="w-5 h-5 text-accent shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-text-primary text-sm font-semibold truncate">{fav.name}</p>
                                    {fav.category && <p className="text-text-muted text-xs truncate">{fav.category}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section className="space-y-3">
                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-accent" /> Cupit
                </h2>
                <div className="space-y-2">
                    <div onClick={() => navigate('/turnaukset/hc2026/B13-8/185085')}
                        className="bg-surface-1 border border-border-hairline rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-surface-2">
                        <div>
                            <p className="text-text-primary font-medium">Helsinki Cup 2026</p>
                            <p className="text-text-muted text-sm">PPJ · B13 8v8 · Lohko M</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-text-muted" />
                    </div>
                </div>
            </section>

            <details className="bg-surface-1 border border-border-hairline rounded-xl p-4">
                <summary className="cursor-pointer text-sm font-semibold text-text-primary flex items-center gap-2">
                    <Search className="w-4 h-4 text-accent" /> Hae ottelu tunnuksella
                </summary>
                <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
                    <input type="text" value={matchId} onChange={(e) => setMatchId(e.target.value)}
                        placeholder="Ottelun tunnus"
                        className="flex-1 bg-surface-2 border border-border-hairline rounded-lg px-3 py-2 text-text-primary text-sm" />
                    <Button type="submit">Avaa</Button>
                </form>
            </details>
        </PageLayout>
    )
}
