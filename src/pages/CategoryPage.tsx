import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ListTree } from 'lucide-react'
import { getGroups } from '../services/api'
import type { GroupDetails } from '../types/api'

export function CategoryPage() {
    const { compId, catId } = useParams()
    const navigate = useNavigate()
    const [groups, setGroups] = useState<GroupDetails[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!compId || !catId) return
        setLoading(true)
        getGroups(compId, catId)
            .then(g => { setGroups(g); setLoading(false) })
            .catch(e => { setError(e.message); setLoading(false) })
    }, [compId, catId])

    if (loading) return <div className="min-h-screen px-4 py-8"><div className="max-w-6xl mx-auto space-y-4"><div className="animate-pulse bg-surface-1 rounded-xl h-12" /><div className="animate-pulse bg-surface-1 rounded-xl h-64" /></div></div>
    if (error) return <div className="min-h-screen px-4 py-8 text-center text-semantic-red">{error}</div>

    return (
        <div className="min-h-screen px-4 py-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <button onClick={() => navigate(`/competition/${compId}`)} className="flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors text-sm mb-2">
                    <ArrowLeft className="w-4 h-4" /> Takaisin
                </button>

                {groups.length > 0 && (
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">{groups[0].competition_name}</h1>
                        <p className="text-text-muted text-sm">{groups[0].category_name}</p>
                    </div>
                )}

                {groups.length === 0 && <p className="text-text-muted text-sm text-center py-8">Ei lohkoja</p>}
                <div className="space-y-2">
                    {groups.map(g => (
                        <div
                            key={g.group_id}
                            onClick={() => navigate(`/group/${compId}/${catId}/${g.group_id}`)}
                            className="bg-surface-1 border border-border-hairline rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-surface-2 transition-colors"
                        >
                            <ListTree className="w-5 h-5 text-accent shrink-0" />
                            <div className="min-w-0">
                                <p className="text-text-primary font-medium truncate">{g.group_name}</p>
                                <p className="text-text-muted text-xs">{g.teams?.length || 0} joukkuetta</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}