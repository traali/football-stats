import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ListTree } from 'lucide-react'
import { getCategoryInfo } from '../services/api'
import { loadTournamentGroups } from '../services/tournament'
import { BackButton, ErrorState, PageLayout, TasoLink } from '../components'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { friendlyError } from '../utils/friendlyError'
import { tasoCategoryUrl } from '../utils/tasoLinks'

interface Row { group_id: string; group_name: string; teams_count: number; current?: boolean; notice?: string }

export function CategoryPage() {
    const { compId = '', catId = '' } = useParams()
    const [title, setTitle] = useState({ comp: '', cat: '' })
    const [groups, setGroups] = useState<Row[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [tick, setTick] = useState(0)
    useDocumentTitle(title.cat || catId)

    useEffect(() => {
        if (!compId || !catId) return
        const ctrl = new AbortController()
        setLoading(true)
        setError(null)
        // Leagues: getCategory lists the groups. Cups: fall back to the group-by-group loader.
        getCategoryInfo(compId, catId, ctrl.signal)
            .then(c => {
                if (c.groups.length === 0) throw new Error('no groups')
                return { comp: c.competition_name, cat: c.category_name, rows: c.groups }
            })
            .catch(async () => {
                const gs = await loadTournamentGroups(compId, catId, ctrl.signal)
                return {
                    comp: String(gs[0]?.competition_name || ''),
                    cat: String(gs[0]?.category_name || ''),
                    rows: gs.map(g => ({ group_id: String(g.group_id), group_name: String(g.group_name || g.group_id), teams_count: new Set((g.teams || []).map(t => t.team_id)).size })),
                }
            })
            .then(r => { if (!ctrl.signal.aborted) { setTitle({ comp: r.comp, cat: r.cat }); setGroups(r.rows) } })
            .catch(err => { if (!ctrl.signal.aborted) setError(friendlyError(err, 'Lohkoja')) })
            .finally(() => { if (!ctrl.signal.aborted) setLoading(false) })
        return () => ctrl.abort()
    }, [compId, catId, tick])

    if (loading) return <PageLayout><div className="animate-pulse bg-surface-1 rounded-xl h-12" /><div className="animate-pulse bg-surface-1 rounded-xl h-64" /></PageLayout>
    if (error) return <ErrorState message={error} onRetry={() => setTick(t => t + 1)} fallbackTo={`/competition/${compId}`} />

    const sorted = [...groups].sort((a, b) => Number(!!b.current) - Number(!!a.current))
    return (
        <PageLayout>
            <BackButton fallbackTo={`/competition/${compId}`} />
            <div>
                <h1 className="text-2xl font-bold text-text-primary">{title.cat || catId}</h1>
                {title.comp && <p className="text-text-muted text-sm">{title.comp}</p>}
                <TasoLink href={tasoCategoryUrl(compId, catId)} />
            </div>
            {sorted.length === 0 && <p className="text-text-muted text-sm text-center py-8">Ei lohkoja tulospalvelussa.</p>}
            <div className="space-y-2">
                {sorted.map(g => (
                    <Link key={g.group_id} to={`/group/${compId}/${catId}/${g.group_id}`}
                        className="bg-surface-1 border border-border-hairline rounded-xl px-4 py-3 min-h-[52px] flex items-center gap-3 hover:bg-surface-2 transition-colors">
                        <ListTree className="w-5 h-5 text-accent shrink-0" />
                        <span className="min-w-0">
                            <span className="block text-text-primary font-medium truncate">{g.group_name}{g.current ? ' · nyt' : ''}</span>
                            <span className="block text-text-muted text-xs">{g.teams_count} joukkuetta{g.notice ? ` · ${g.notice}` : ''}</span>
                        </span>
                    </Link>
                ))}
            </div>
        </PageLayout>
    )
}
