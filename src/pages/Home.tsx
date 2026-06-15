import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Trophy, Heart, Shield, Activity, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components'
import { getCompetitions, getTeamProfile } from '../services/api'
import { useFavorites } from '../hooks/useFavorites'
import { getTeamCategory } from '../utils/dataProcessors'
import { APP_CONFIG } from '../config'
import type { Competition } from '../types'
import { PageLayout } from '../components'

const SPL_IDS = ['spl', 'spf', 'b_jun', 'c_jun', 'd_jun']

export function Home() {
    const [matchId, setMatchId] = useState('')
    const [comps, setComps] = useState<Competition[]>([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()
    const { favorites, updateName } = useFavorites()

    useEffect(() => {
        getCompetitions()
            .then(c => { setComps(c); setLoading(false) })
            .catch(() => setLoading(false))
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
                    .catch(() => {})
            )
        )

        return () => {
            cancelled = true
        }
    }, [favorites, updateName])

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        const trimmedMatchId = matchId.trim()
        if (!trimmedMatchId) return
        navigate(`/match/${trimmedMatchId}`)
    }

    const primaryComps = comps.filter(c => SPL_IDS.includes(c.competition_id))
    const otherComps = comps.filter(c => !SPL_IDS.includes(c.competition_id))

    return (
        <PageLayout>
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
                    <div className="flex items-center justify-center gap-3">
                        <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                            <Trophy className="w-8 h-8 text-accent" />
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-text-primary">Football Stats</h1>
                    </div>
                    <p className="text-text-secondary text-sm max-w-xl mx-auto">Suomen Palloliiton juniori- ja aikuissarjojen tilastot</p>
                </motion.div>

                <section className="max-w-xl mx-auto">
                    <form onSubmit={handleSubmit} className="relative group">
                        <div className="relative flex items-center bg-surface-2 border border-border-hairline rounded-lg overflow-hidden focus-within:border-accent transition-all duration-200">
                            <div className="pl-4 text-text-muted">
                                <Search className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                value={matchId}
                                onChange={(e) => setMatchId(e.target.value)}
                                placeholder="Match ID (esim. 3760372)"
                                className="grow bg-transparent border-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none text-text-primary px-4 py-3 placeholder:text-text-muted text-lg"
                            />
                            <Button type="submit" className="min-w-[100px]">
                                Hae
                            </Button>
                        </div>
                    </form>
                </section>

                {favorites.length > 0 && (
                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                            <Heart className="w-5 h-5 text-semantic-red fill-semantic-red" /> Suosikkijoukkueet
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {favorites.map(fav => (
                                <div
                                    key={fav.id}
                                    onClick={() => navigate(`/team/${fav.id}`)}
                                    className="bg-surface-1 border border-border-hairline rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-surface-2 transition-colors min-h-[52px]"
                                >
                                    <Shield className="w-6 h-6 text-accent shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-text-primary text-sm font-semibold truncate">{fav.name}</p>
                                        {fav.category && (
                                            <p className="text-text-muted text-xs truncate mt-0.5">{fav.category}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-accent" /> Turnaukset
                    </h2>
                    <div className="space-y-2">
                        <div
                            onClick={() => navigate('/turnaukset/hc2026/B13-8/185085')}
                            className="bg-surface-1 border border-border-hairline rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-surface-2 transition-colors"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-surface-2 border border-border-hairline flex items-center justify-center shrink-0">
                                    <Trophy className="w-5 h-5 text-accent" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-text-primary font-medium truncate">Helsinki Cup 2026</p>
                                    <p className="text-text-muted text-sm truncate">PPJ · B13 8v8 · Lohko M</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-text-muted shrink-0" />
                        </div>
                        <div
                            onClick={() => navigate('/turnaukset/hc2026/B13H/185086')}
                            className="bg-surface-1 border border-border-hairline rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-surface-2 transition-colors"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-surface-2 border border-border-hairline flex items-center justify-center shrink-0">
                                    <Trophy className="w-5 h-5 text-accent" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-text-primary font-medium truncate">Helsinki Cup 2026</p>
                                    <p className="text-text-muted text-sm truncate">PPJ/Laru oran · B13 Harjoitus · Lohko E</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-text-muted shrink-0" />
                        </div>
                    </div>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <Activity className="w-5 h-5 text-accent" /> Sarjat
                    </h2>
                    {loading && <div className="animate-pulse bg-surface-1 rounded-xl h-48" />}
                    {!loading && primaryComps.length === 0 && <p className="text-text-muted text-sm">Ei sarjatietoja</p>}
                    <div className="space-y-2">
                        {primaryComps.map(c => (
                            <div
                                key={c.competition_id}
                                onClick={() => navigate(`/competition/${c.competition_id}`)}
                                className="bg-surface-1 border border-border-hairline rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-surface-2 transition-colors"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <Trophy className="w-5 h-5 text-accent shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-text-primary font-medium truncate">{c.competition_name}</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-text-muted shrink-0" />
                            </div>
                        ))}
                    </div>
                    {otherComps.length > 0 && (
                        <details className="group">
                            <summary className="text-sm text-text-muted cursor-pointer hover:text-text-primary transition-colors list-none flex items-center gap-1 py-2">
                                <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                                Muut sarjat ({otherComps.length})
                            </summary>
                            <div className="space-y-2 mt-2">
                                {otherComps.map(c => (
                                    <div
                                        key={c.competition_id}
                                        onClick={() => navigate(`/competition/${c.competition_id}`)}
                                        className="bg-surface-1 border border-border-hairline rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-surface-2 transition-colors"
                                    >
                                        <span className="text-text-primary text-sm truncate">{c.competition_name}</span>
                                        <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
                                    </div>
                                ))}
                            </div>
                        </details>
                    )}
                </section>

                <footer className="pt-6 border-t border-border-hairline text-center text-text-muted text-sm">
                    <p>&copy; 2026 Pelaajatilastot. Data: Suomen Palloliitto.</p>
                </footer>
        </PageLayout>
    )
}