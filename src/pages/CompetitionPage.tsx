import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layers } from 'lucide-react'
import { getCategories, getSeasons } from '../services/api'
import type { Category, Season } from '../types'
import { BackButton, PageLayout, Button } from '../components'

export function CompetitionPage() {
    const { compId } = useParams()
    const navigate = useNavigate()
    const [categories, setCategories] = useState<Category[]>([])
    const [seasons, setSeasons] = useState<Season[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [tick, setTick] = useState(0)

    useEffect(() => {
        if (!compId) return
        setLoading(true)
        setError(null)
        Promise.all([getCategories(compId), getSeasons(compId)])
            .then(([c, s]) => { setCategories(c); setSeasons(s); setLoading(false) })
            .catch(() => {
                setError('Sarjoja ei voitu ladata. Tarkista yhteys ja yritä uudelleen.')
                setLoading(false)
            })
    }, [compId, tick])

    if (loading) return (
        <PageLayout>
            <div className="animate-pulse bg-surface-1 rounded-xl h-12" />
            <div className="animate-pulse bg-surface-1 rounded-xl h-64" />
        </PageLayout>
    )

    if (error) return (
        <PageLayout>
            <BackButton to="/" label="Etusivu" className="mb-2" />
            <p className="text-center text-semantic-red">{error}</p>
            <div className="flex justify-center">
                <Button onClick={() => setTick(t => t + 1)}>Yritä uudelleen</Button>
            </div>
        </PageLayout>
    )

    return (
        <PageLayout>
            <BackButton to="/" label="Etusivu" className="mb-2" />
            <h1 className="text-2xl font-bold text-text-primary">
                {compId === 'etejp26' ? 'Etelä Jalkapallo 2026' : compId}
            </h1>
            {seasons.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {seasons.map(s => (
                        <span key={s.season_id} className="text-xs bg-surface-2 text-text-muted px-2.5 py-1 rounded-full">{s.season_name}</span>
                    ))}
                </div>
            )}
            {categories.length === 0 && <p className="text-text-muted text-sm text-center py-8">Ei sarjatasoja</p>}
            <div className="space-y-2">
                {categories.map(cat => (
                    <div
                        key={cat.category_id}
                        onClick={() => navigate(`/competition/${compId}/category/${cat.category_id}`)}
                        className="bg-surface-1 border border-border-hairline rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-surface-2 transition-colors"
                    >
                        <Layers className="w-5 h-5 text-accent shrink-0" />
                        <p className="text-text-primary font-medium truncate">{cat.category_name}</p>
                    </div>
                ))}
            </div>
        </PageLayout>
    )
}
