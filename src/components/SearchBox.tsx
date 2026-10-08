import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Search, Shield, User, Building2, X, RotateCw } from 'lucide-react'
import { searchTaso, type SearchResult } from '../services/api'
import { useFavorites } from '../hooks/useFavorites'
import { friendlyError } from '../utils/friendlyError'
import { cn } from '../utils/cn'

const PAGE = 15

function FavButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
    return (
        <button type="button" onClick={onClick} aria-pressed={active} aria-label={label} title={label}
            className="shrink-0 w-11 h-11 flex items-center justify-center rounded-lg hover:bg-surface-3">
            <Heart className={cn('w-5 h-5', active ? 'text-semantic-red fill-semantic-red' : 'text-text-muted')} />
        </button>
    )
}

/**
 * The front door: one box for teams, players and clubs (Taso search).
 * Results can be saved as favourites right here.
 */
export function SearchBox({ initialQuery = '', onQueryChange, autoFocus }: { initialQuery?: string; onQueryChange?: (q: string) => void; autoFocus?: boolean }) {
    const [q, setQ] = useState(initialQuery)
    const [results, setResults] = useState<SearchResult[] | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [tick, setTick] = useState(0)
    const [teamLimit, setTeamLimit] = useState(PAGE)
    const fav = useFavorites()
    const onChangeRef = useRef(onQueryChange)
    useEffect(() => { onChangeRef.current = onQueryChange }, [onQueryChange])

    useEffect(() => {
        const text = q.trim()
        onChangeRef.current?.(text)
        setTeamLimit(PAGE)
        if (text.length < 2) { setResults(null); setError(null); setLoading(false); return }
        const ctrl = new AbortController()
        setLoading(true)
        const t = setTimeout(() => {
            searchTaso(text, ctrl.signal)
                .then(r => { if (!ctrl.signal.aborted) { setResults(r); setError(null) } })
                .catch(err => { if (!ctrl.signal.aborted) setError(friendlyError(err, 'Hakutuloksia')) })
                .finally(() => { if (!ctrl.signal.aborted) setLoading(false) })
        }, 350)
        return () => { clearTimeout(t); ctrl.abort() }
    }, [q, tick])

    const teams = (results || []).filter(r => r.type === 'team')
    const players = (results || []).filter(r => r.type === 'player')
    const clubs = (results || []).filter(r => r.type === 'club')
    const digits = /^\d{5,9}$/.test(q.trim()) ? q.trim() : ''

    const row = 'flex items-center gap-3 min-h-[52px] px-3 rounded-lg hover:bg-surface-2'

    return (
        <div className="space-y-3" data-testid="search-box">
            <form role="search" onSubmit={e => e.preventDefault()} className="relative">
                <Search className="w-5 h-5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                    type="search"
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    autoFocus={autoFocus}
                    enterKeyHint="search"
                    aria-label="Hae joukkue, pelaaja tai seura"
                    placeholder="Hae joukkue, pelaaja tai seura"
                    className="w-full min-h-[52px] bg-surface-1 border border-border-hairline focus:border-accent rounded-xl pl-11 pr-11 text-base text-text-primary placeholder:text-text-muted outline-none"
                />
                {q && (
                    <button type="button" onClick={() => setQ('')} aria-label="Tyhjennä haku"
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-text-muted">
                        <X className="w-5 h-5" />
                    </button>
                )}
            </form>

            {!q && <p className="text-xs text-text-muted px-1">Pelaajan löydät koko nimellä, esim. ”Simo Oinonen”. Joukkueen ja seuran löydät nimen osalla, esim. ”Laru sin”.</p>}
            {loading && <p className="text-sm text-text-muted px-1" aria-live="polite">Haetaan…</p>}
            {error && !loading && (
                <div role="alert" className="flex items-center justify-between gap-3 bg-surface-1 border border-border-hairline rounded-xl p-3">
                    <p className="text-sm text-text-primary">Hups! {error}</p>
                    <button type="button" onClick={() => setTick(t => t + 1)} className="shrink-0 inline-flex items-center gap-1 min-h-[44px] px-3 rounded-lg bg-accent text-text-inverse text-sm font-semibold">
                        <RotateCw className="w-4 h-4" /> Uudelleen
                    </button>
                </div>
            )}

            {results && !loading && !error && (
                <div className="space-y-3" aria-live="polite">
                    {results.length === 0 && (
                        <p className="text-sm text-text-secondary px-1">
                            Ei osumia haulla ”{q.trim()}”. Pelaajaa haetaan koko nimellä (etunimi sukunimi).
                        </p>
                    )}

                    {players.length > 0 && (
                        <section className="bg-surface-1 border border-border-hairline rounded-xl p-2">
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-muted px-2 py-1">Pelaajat</h3>
                            {players.map(p => {
                                const club = p.data?.club_name_football || p.data?.club_name_futsal || ''
                                return (
                                    <div key={`p${p.id}`} className="flex items-center">
                                        <Link to={`/player/${p.id}`} className={cn(row, 'flex-1 min-w-0')}>
                                            <User className="w-5 h-5 text-accent shrink-0" />
                                            <span className="min-w-0">
                                                <span className="block text-sm font-semibold text-text-primary truncate">{p.text}</span>
                                                {club && <span className="block text-xs text-text-muted truncate">{club}</span>}
                                            </span>
                                        </Link>
                                        <FavButton active={fav.isFavoritePlayer(p.id)} label={fav.isFavoritePlayer(p.id) ? 'Poista suosikeista' : 'Lisää suosikiksi'}
                                            onClick={() => fav.togglePlayer({ id: p.id, name: p.text, teamName: club || undefined })} />
                                    </div>
                                )
                            })}
                        </section>
                    )}

                    {teams.length > 0 && (
                        <section className="bg-surface-1 border border-border-hairline rounded-xl p-2">
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-muted px-2 py-1">Joukkueet ({teams.length})</h3>
                            {teams.slice(0, teamLimit).map(t => {
                                const cat = t.data?.primary_category_name || ''
                                const name = t.text.trim()
                                return (
                                    <div key={`t${t.id}`} className="flex items-center">
                                        <Link to={`/team/${t.id}`} className={cn(row, 'flex-1 min-w-0')}>
                                            <Shield className="w-5 h-5 text-accent shrink-0" />
                                            <span className="min-w-0">
                                                <span className="block text-sm font-semibold text-text-primary truncate">{name}</span>
                                                {cat && <span className="block text-xs text-text-muted truncate">{cat}</span>}
                                            </span>
                                        </Link>
                                        <FavButton active={fav.isFavorite(t.id)} label={fav.isFavorite(t.id) ? 'Poista suosikeista' : 'Lisää suosikiksi'}
                                            onClick={() => fav.toggle(t.id, name, cat || undefined)} />
                                    </div>
                                )
                            })}
                            {teams.length > teamLimit && (
                                <button type="button" onClick={() => setTeamLimit(l => l + PAGE * 2)} className="w-full min-h-[44px] text-sm font-semibold text-accent">
                                    Näytä lisää joukkueita
                                </button>
                            )}
                        </section>
                    )}

                    {clubs.length > 0 && (
                        <section className="bg-surface-1 border border-border-hairline rounded-xl p-2">
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-muted px-2 py-1">Seurat</h3>
                            {clubs.map(c => (
                                <Link key={`c${c.id}`} to={`/club/${c.id}`} className={row}>
                                    <Building2 className="w-5 h-5 text-accent shrink-0" />
                                    <span className="min-w-0">
                                        <span className="block text-sm font-semibold text-text-primary truncate">{c.text}</span>
                                        {c.data?.city_name && <span className="block text-xs text-text-muted truncate">{c.data.city_name}</span>}
                                    </span>
                                </Link>
                            ))}
                        </section>
                    )}
                </div>
            )}

            {digits && (
                <Link to={`/match/${digits}`} className="block text-xs text-text-muted hover:text-accent px-1 min-h-[44px] leading-[44px]">
                    Avaa ottelu tunnuksella {digits} →
                </Link>
            )}
        </div>
    )
}
