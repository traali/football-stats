import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Layers } from 'lucide-react'
import { getCategories } from '../services/api'
import type { Category } from '../types'
import { BackButton, ErrorState, PageLayout } from '../components'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { friendlyError } from '../utils/friendlyError'
import { FEATURED } from '../config'

/** "Selaa": the competition's categories, filterable. */
export function CompetitionPage() {
    const { compId = '' } = useParams()
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [tick, setTick] = useState(0)
    const [filter, setFilter] = useState('')
    const title = compId === 'etejp26' ? 'Etelä Jalkapallo 2026' : compId
    useDocumentTitle(title)

    useEffect(() => {
        if (!compId) return
        let cancelled = false
        setLoading(true)
        setError(null)
        getCategories(compId)
            .then(c => { if (!cancelled) setCategories(c) })
            .catch(err => { if (!cancelled) setError(friendlyError(err, 'Sarjoja')) })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [compId, tick])

    const shown = useMemo(() => {
        const f = filter.trim().toLowerCase()
        return f ? categories.filter(c => `${c.category_name} ${c.category_id}`.toLowerCase().includes(f)) : categories
    }, [categories, filter])

    if (loading) return (
        <PageLayout>
            <div className="animate-pulse bg-surface-1 rounded-xl h-12" />
            <div className="animate-pulse bg-surface-1 rounded-xl h-64" />
        </PageLayout>
    )
    if (error) return <ErrorState message={error} onRetry={() => setTick(t => t + 1)} />

    return (
        <PageLayout>
            <BackButton fallbackTo="/" />
            <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
            <input type="search" value={filter} onChange={e => setFilter(e.target.value)} aria-label="Rajaa sarjoja"
                placeholder="Rajaa sarjoja, esim. P13"
                className="w-full min-h-[48px] bg-surface-1 border border-border-hairline rounded-xl px-4 text-base text-text-primary placeholder:text-text-muted" />
            {shown.length === 0 && <p className="text-text-muted text-sm text-center py-8">Ei sarjoja{filter ? ' tällä rajauksella' : ''}.</p>}
            <div className="space-y-2">
                {shown.map(cat => (
                    <Link key={cat.category_id} to={`/competition/${compId}/category/${cat.category_id}`}
                        className="bg-surface-1 border border-border-hairline rounded-xl px-4 min-h-[52px] flex items-center gap-3 hover:bg-surface-2 transition-colors">
                        <Layers className="w-5 h-5 text-accent shrink-0" />
                        <span className="text-text-primary font-medium truncate">{cat.category_name}</span>
                        {compId === FEATURED.competitionId && cat.category_id === FEATURED.categoryId && (
                            <span className="ml-auto text-[10px] font-bold uppercase text-accent shrink-0">{FEATURED.teamName}</span>
                        )}
                    </Link>
                ))}
            </div>
        </PageLayout>
    )
}
