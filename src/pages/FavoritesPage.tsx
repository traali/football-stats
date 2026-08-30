import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Shield } from 'lucide-react'
import { useFavorites } from '../hooks/useFavorites'
import { getTeamProfile } from '../services/api'
import { getTeamCategory } from '../utils/dataProcessors'
import { APP_CONFIG } from '../config'
import type { TeamResponse } from '../types'
import { PageLayout, BackButton } from '../components'

export function FavoritesPage() {
    const navigate = useNavigate()
    const { favorites, clear } = useFavorites()
    const [teams, setTeams] = useState<Record<string, TeamResponse | null>>({})
    const [, setLoading] = useState(true)

    useEffect(() => {
        if (favorites.length === 0) { setLoading(false); return }
        let cancelled = false
        Promise.all(favorites.map(fav => getTeamProfile(fav.id).then(t => ({ fid: fav.id, t }))))
            .then(results => { if (!cancelled) { setTeams(Object.fromEntries(results.map(({ fid, t }) => [fid, t]))); setLoading(false) } })
            .catch(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [favorites])

    return (
        <PageLayout>
            <BackButton className="mb-2" />
            <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <Heart className="w-6 h-6 text-semantic-red fill-semantic-red" /> Suosikit
                    </h1>
                    {favorites.length > 0 && (
                        <button
                            onClick={clear}
                            className="text-sm text-text-muted hover:text-semantic-red transition-colors px-3 py-1.5"
                        >
                            Tyhjennä
                        </button>
                    )}
                </div>

                {favorites.length === 0 && (
                    <div className="text-center py-16 space-y-4">
                        <Heart className="w-12 h-12 text-text-muted mx-auto" />
                        <p className="text-text-muted">Ei suosikkijoukkueita</p>
                        <p className="text-text-muted text-sm">Lisää joukkueita suosikeiksi joukkuenäkymästä</p>
                    </div>
                )}

                <div className="space-y-2">
                    {favorites.map(fav => {
                        const team = teams[fav.id]
                        return (
                            <div
                                key={fav.id}
                                onClick={() => navigate(`/team/${fav.id}`)}
                                className="bg-surface-1 border border-border-hairline rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-surface-2 transition-colors"
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
                            </div>
                        )
                    })}
                </div>
        </PageLayout>
    )
}