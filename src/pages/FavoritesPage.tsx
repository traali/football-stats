import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Shield } from 'lucide-react'
import { useFavorites } from '../hooks/useFavorites'
import { getTeamProfile } from '../services/api'
import type { TeamResponse } from '../types/api'

export function FavoritesPage() {
    const navigate = useNavigate()
    const { favorites, clear } = useFavorites()
    const [teams, setTeams] = useState<Record<string, TeamResponse | null>>({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (favorites.length === 0) { setLoading(false); return }
        let cancelled = false
        Promise.all(favorites.map(fid => getTeamProfile(fid).then(t => ({ fid, t }))))
            .then(results => { if (!cancelled) { setTeams(Object.fromEntries(results.map(({ fid, t }) => [fid, t]))); setLoading(false) } })
            .catch(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [favorites])

    return (
        <div className="min-h-screen px-4 py-6">
            <div className="max-w-6xl mx-auto space-y-6">
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
                    {favorites.map(fid => {
                        const team = teams[fid]
                        return (
                            <div
                                key={fid}
                                onClick={() => navigate(`/team/${fid}`)}
                                className="bg-surface-1 border border-border-hairline rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-surface-2 transition-colors"
                            >
                                <Shield className="w-8 h-8 text-accent shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-text-primary font-medium truncate">
                                        {team?.team_name || fid}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}