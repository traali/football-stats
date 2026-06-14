import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layers } from 'lucide-react'
import { getCategories, getSeasons } from '../services/api'
import type { Category, Season } from '../types'
import { BackButton, PageLayout } from '../components'

export function CompetitionPage() {
    const { compId } = useParams()
    const navigate = useNavigate()
    const [categories, setCategories] = useState<Category[]>([])
    const [seasons, setSeasons] = useState<Season[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!compId) return
        setLoading(true)
        Promise.all([getCategories(compId), getSeasons(compId)])
            .then(([c, s]) => { setCategories(c); setSeasons(s); setLoading(false) })
            .catch(e => { setError(e.message); setLoading(false) })
    }, [compId])

    if (loading) return <div className="min-h-screen px-4 py-8"><div className="max-w-6xl mx-auto space-y-4"><div className="animate-pulse bg-surface-1 rounded-xl h-12" /><div className="animate-pulse bg-surface-1 rounded-xl h-64" /></div></div>
    if (error) return <div className="min-h-screen px-4 py-8 text-center text-semantic-red">{error}</div>

    return (
        <PageLayout>
            <BackButton to="/" label="Etusivu" className="mb-2" />

                <h1 className="text-2xl font-bold text-text-primary capitalize">{compId}</h1>

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
                            <div className="min-w-0">
                                <p className="text-text-primary font-medium truncate">{cat.category_name}</p>
                            </div>
                        </div>
                    ))}
                </div>
        </PageLayout>
    )
}