import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Trophy, Heart, Shield, ChevronRight, Calendar, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components'
import { getTeamMatches, getTeamProfile } from '../services/api'
import { useFavorites } from '../hooks/useFavorites'
import { getTeamCategory } from '../utils/dataProcessors'
import { APP_CONFIG, APP_NAME, FEATURED } from '../config'
import type { DiscoveryMatch } from '../types'
import { MATCH_STATUS } from '../types'
import { PageLayout } from '../components'
import { formatDate, formatTime } from '../utils/dates'

export function Home() {
    const [matchId, setMatchId] = useState('')
    const [next, setNext] = useState<DiscoveryMatch | null>(null)
    const [loadingNext, setLoadingNext] = useState(true)
    const navigate = useNavigate()
    const { favorites, updateName } = useFavorites()

    useEffect(() => {
        const ctrl = new AbortController()
        getTeamMatches(FEATURED.teamId, ctrl.signal)
            .then(matches => {
                const upcoming = matches
                    .filter(m => m.status === MATCH_STATUS.FIXTURE && m.date)
                    .sort((a, b) => `${a.date}${a.time || ''}`.localeCompare(`${b.date}${b.time || ''}`))
                setNext(upcoming[0] || null)
            })
            .catch(() => setNext(null))
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

    const venue = next ? String(next.venue_name || next.venue || next.venue_city_name || '') : ''

    return (
        <PageLayout>
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-text-primary">{APP_NAME}</h1>
                <p className="text-text-secondary text-sm">PPJ/Laru sin · P13 Kolmonen · Etelä</p>
            </motion.div>

            <section>
                {loadingNext && <div className="animate-pulse bg-surface-1 rounded-xl h-28" />}
                {next && (
                    <button type="button" onClick={() => navigate(`/match/${next.match_id}`)}
                        className="w-full text-left bg-surface-1 border border-border-hairline rounded-2xl p-4 hover:bg-surface-2 transition-colors">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-2">Seuraava ottelu</p>
                        <p className="text-lg font-bold text-text-primary">{next.team_A_name} – {next.team_B_name}</p>
                        <p className="text-sm text-text-secondary mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(next.date, 'with-year')} {formatTime(next.time)}
                            </span>
                            {venue && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />{venue}
                                </span>
                            )}
                        </p>
                    </button>
                )}
                {!loadingNext && !next && (
                    <p className="text-text-muted text-sm">Ei merkittyä seuraavaa ottelua.</p>
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
                    <div onClick={() => navigate('/turnaukset/hc2026/B13H/185086')}
                        className="bg-surface-1 border border-border-hairline rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-surface-2">
                        <div>
                            <p className="text-text-primary font-medium">Helsinki Cup 2026</p>
                            <p className="text-text-muted text-sm">PPJ/Laru oran · B13 Harjoitus · Lohko E</p>
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
