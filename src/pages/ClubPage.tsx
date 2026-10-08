import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Building2, Heart, Shield } from 'lucide-react'
import { BackButton, ErrorState, PageLayout } from '../components'
import { getClubInfo, type ClubInfo } from '../services/api'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useFavorites } from '../hooks/useFavorites'
import { friendlyError } from '../utils/friendlyError'
import { helsinkiToday } from '../domain/matchState'
import { cn } from '../utils/cn'

/** A club's teams in the current season. Only names and categories; no contact details. */
export function ClubPage() {
    const { clubId = '' } = useParams()
    const [club, setClub] = useState<ClubInfo | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [tick, setTick] = useState(0)
    const [filter, setFilter] = useState('')
    const fav = useFavorites()
    useDocumentTitle(club?.name || 'Seura')

    useEffect(() => {
        if (!/^\d+$/.test(clubId)) { setError('Seuran tunnus ei kelpaa.'); setLoading(false); return }
        const ctrl = new AbortController()
        setLoading(true)
        setError(null)
        getClubInfo(clubId, ctrl.signal)
            .then(c => { if (!ctrl.signal.aborted) { setClub(c); if (!c) setError('Seuraa ei löytynyt tulospalvelusta.') } })
            .catch(err => { if (!ctrl.signal.aborted) setError(friendlyError(err, 'Seuraa')) })
            .finally(() => { if (!ctrl.signal.aborted) setLoading(false) })
        return () => ctrl.abort()
    }, [clubId, tick])

    const year = helsinkiToday().slice(0, 4)
    const groups = useMemo(() => {
        const f = filter.trim().toLowerCase()
        const current = (club?.teams || []).filter(t => String(t.season || '').includes(year))
        const list = current.filter(t => !f || `${t.team_name} ${t.category_name || ''}`.toLowerCase().includes(f))
        const map = new Map<string, typeof list>()
        for (const t of list) {
            const key = t.sport_id === 'futsal' ? 'Futsal' : 'Jalkapallo'
            map.set(key, [...(map.get(key) || []), t])
        }
        for (const arr of map.values()) arr.sort((a, b) => (a.category_name || '').localeCompare(b.category_name || '', 'fi') || a.team_name.localeCompare(b.team_name, 'fi'))
        return [...map.entries()].sort((a, b) => (a[0] === 'Jalkapallo' ? -1 : b[0] === 'Jalkapallo' ? 1 : 0))
    }, [club, filter, year])

    if (loading) return <PageLayout><div className="animate-pulse bg-surface-1 rounded-xl h-64" /></PageLayout>
    if (error || !club) return <ErrorState message={error || 'Seuraa ei löytynyt.'} onRetry={() => setTick(t => t + 1)} fallbackTo="/haku" />

    return (
        <PageLayout>
            <BackButton fallbackTo="/haku" />
            <div className="bg-surface-1 border border-border-hairline rounded-2xl p-5 flex items-center gap-4">
                {club.crest ? <img src={club.crest} alt="" className="w-14 h-14 object-contain" /> : <Building2 className="w-10 h-10 text-accent" />}
                <div className="min-w-0">
                    <h1 className="text-xl font-bold text-text-primary">{club.name}</h1>
                    {club.city_name && <p className="text-sm text-text-secondary">{club.city_name}</p>}
                </div>
            </div>
            <input type="search" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Rajaa joukkueita, esim. P13"
                aria-label="Rajaa joukkueita"
                className="w-full min-h-[48px] bg-surface-1 border border-border-hairline rounded-xl px-4 text-base text-text-primary placeholder:text-text-muted" />
            {groups.length === 0 && <p className="text-sm text-text-secondary">Ei joukkueita kaudella {year}{filter ? ' tällä rajauksella' : ''}.</p>}
            {groups.map(([sport, teams]) => (
                <section key={sport} className="bg-surface-1 border border-border-hairline rounded-xl p-2">
                    <h2 className="text-[11px] font-bold uppercase tracking-wider text-text-muted px-2 py-1">{sport} {year} ({teams.length})</h2>
                    {teams.map(t => (
                        <div key={t.team_id} className="flex items-center">
                            <Link to={`/team/${t.team_id}`} className="flex-1 min-w-0 flex items-center gap-3 min-h-[52px] px-3 rounded-lg hover:bg-surface-2">
                                <Shield className="w-5 h-5 text-accent shrink-0" />
                                <span className="min-w-0">
                                    <span className="block text-sm font-semibold text-text-primary truncate">{t.team_name}</span>
                                    {t.category_name && <span className="block text-xs text-text-muted truncate">{t.category_name}</span>}
                                </span>
                            </Link>
                            <button type="button" aria-pressed={fav.isFavorite(t.team_id)} aria-label={fav.isFavorite(t.team_id) ? 'Poista suosikeista' : 'Lisää suosikiksi'}
                                onClick={() => fav.toggle(t.team_id, t.team_name, t.category_name)}
                                className="shrink-0 w-11 h-11 flex items-center justify-center rounded-lg hover:bg-surface-3">
                                <Heart className={cn('w-5 h-5', fav.isFavorite(t.team_id) ? 'text-semantic-red fill-semantic-red' : 'text-text-muted')} />
                            </button>
                        </div>
                    ))}
                </section>
            ))}
        </PageLayout>
    )
}
