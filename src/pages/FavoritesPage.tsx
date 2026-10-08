import { Link } from 'react-router-dom'
import { Heart, Shield, User, Search } from 'lucide-react'
import { useFavorites } from '../hooks/useFavorites'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { PageLayout, BackButton } from '../components'
import { setLastSelectedTeamId } from '../services/teamSelection'

/** Favourites live on this phone only (localStorage). Nothing is fetched here. */
export function FavoritesPage() {
    const { favorites, favoritePlayers, toggle, togglePlayer, clear, clearPlayers } = useFavorites()
    useDocumentTitle('Suosikit')
    const total = favorites.length + favoritePlayers.length

    const row = 'flex-1 min-w-0 flex items-center gap-3 min-h-[56px] px-3 rounded-lg hover:bg-surface-2'
    const unfav = 'shrink-0 w-11 h-11 flex items-center justify-center rounded-lg hover:bg-surface-3'

    return (
        <PageLayout>
            <BackButton fallbackTo="/" />
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                    <Heart className="w-6 h-6 text-semantic-red fill-semantic-red" /> Suosikit
                </h1>
                {total > 1 && (
                    <button type="button"
                        onClick={() => { if (window.confirm('Poistetaanko kaikki suosikit tästä puhelimesta?')) { clear(); clearPlayers() } }}
                        className="text-xs text-text-muted hover:text-semantic-red px-3 min-h-[44px]">
                        Tyhjennä kaikki
                    </button>
                )}
            </div>
            <p className="text-xs text-text-muted">Suosikit tallentuvat vain tähän laitteeseen.</p>

            {total === 0 && (
                <div className="bg-surface-1 border border-border-hairline rounded-xl p-6 text-center space-y-3">
                    <p className="text-text-primary font-semibold">Ei vielä suosikkeja</p>
                    <p className="text-sm text-text-secondary">Hae joukkue tai pelaaja ja paina sydäntä.</p>
                    <Link to="/haku" className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-lg bg-accent text-text-inverse font-semibold text-sm">
                        <Search className="w-4 h-4" /> Hae
                    </Link>
                </div>
            )}

            {favorites.length > 0 && (
                <section className="bg-surface-1 border border-border-hairline rounded-xl p-2">
                    <h2 className="text-[11px] font-bold uppercase tracking-wider text-text-muted px-2 py-1">Joukkueet ({favorites.length})</h2>
                    {favorites.map(f => (
                        <div key={f.id} className="flex items-center">
                            <Link to={`/team/${f.id}`} onClick={() => setLastSelectedTeamId(f.id)} className={row}>
                                <Shield className="w-5 h-5 text-accent shrink-0" />
                                <span className="min-w-0">
                                    <span className="block text-sm font-semibold text-text-primary truncate">{f.name}</span>
                                    {f.category && <span className="block text-xs text-text-muted truncate">{f.category}</span>}
                                </span>
                            </Link>
                            <button type="button" className={unfav} aria-label={`Poista ${f.name} suosikeista`} onClick={() => toggle(f.id)}>
                                <Heart className="w-5 h-5 text-semantic-red fill-semantic-red" />
                            </button>
                        </div>
                    ))}
                </section>
            )}

            {favoritePlayers.length > 0 && (
                <section className="bg-surface-1 border border-border-hairline rounded-xl p-2">
                    <h2 className="text-[11px] font-bold uppercase tracking-wider text-text-muted px-2 py-1">Pelaajat ({favoritePlayers.length})</h2>
                    {favoritePlayers.map(p => (
                        <div key={p.id} className="flex items-center">
                            <Link to={`/player/${p.id}`} className={row}>
                                {p.img_url ? <img src={p.img_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" /> : <User className="w-5 h-5 text-accent shrink-0" />}
                                <span className="min-w-0">
                                    <span className="block text-sm font-semibold text-text-primary truncate">{p.name}</span>
                                    {(p.teamName || p.category) && <span className="block text-xs text-text-muted truncate">{[p.teamName, p.category].filter(Boolean).join(' · ')}</span>}
                                </span>
                            </Link>
                            <button type="button" className={unfav} aria-label={`Poista ${p.name} suosikeista`} onClick={() => togglePlayer(p)}>
                                <Heart className="w-5 h-5 text-semantic-red fill-semantic-red" />
                            </button>
                        </div>
                    ))}
                </section>
            )}
        </PageLayout>
    )
}
