import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Trophy, Heart, Shield, ChevronRight, Search, User, Trash2, Hash } from 'lucide-react'
import { Button, MatchRow, PageLayout, SearchBox } from '../components'
import { GameHero } from '../components/GameHero'
import { getTeamMatches, getTeamProfile, teamMatchesFetchedAt } from '../services/api'
import { listViewedMatches, type ViewedMatch } from '../services/viewedCache'
import { useFavorites } from '../hooks/useFavorites'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { needsQuietRefresh, useMinuteClock, useQuietRefresh } from '../hooks/useQuietRefresh'
import { getTeamCategory } from '../utils/dataProcessors'
import { APP_CONFIG, APP_NAME } from '../config'
import type { DiscoveryMatch } from '../types'
import { teamToday } from '../utils/favoriteHero'
import { helsinkiToday, matchPhase, byKickoffAsc } from '../domain/matchState'
import { getSavedTournaments, removeTournament, saveTournament, tournamentPath, type SavedTournament } from '../services/tournamentStorage'
import { getLastSelectedTeamId, normalizeTeamId, setLastSelectedTeamId, sortFavoritesByLastSelected } from '../services/teamSelection'
import { parseTournamentUrl } from '../utils/tournamentUrl'

const MAX_TODAY_TEAMS = 6

interface TeamGames { ms: DiscoveryMatch[]; ok: boolean }

export function Home() {
    const [matchId, setMatchId] = useState('')
    const [tournamentUrlInput, setTournamentUrlInput] = useState('')
    const [tournamentError, setTournamentError] = useState<string | null>(null)
    const [savedTournaments, setSavedTournaments] = useState<SavedTournament[]>(() => getSavedTournaments())
    const [games, setGames] = useState<Record<string, TeamGames>>({})
    const [loaded, setLoaded] = useState(false)
    const [viewed] = useState<ViewedMatch[]>(() => listViewedMatches().slice(0, 8))
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { favorites, updateName, favoritePlayers } = useFavorites()
    useDocumentTitle('')
    const orderedFavorites = useMemo(
        () => sortFavoritesByLastSelected(favorites, getLastSelectedTeamId()),
        [favorites],
    )

    // Only the family's own saved teams: no sample team on the front page.
    const todayTeamKey = useMemo(
        () => [...new Set(orderedFavorites.map(f => f.id))].slice(0, MAX_TODAY_TEAMS).join(','),
        [orderedFavorites],
    )
    // Last good getMatches per team: a failed quiet refresh never empties the list.
    const lastGood = useRef(new Map<string, DiscoveryMatch[]>())
    const loadToday = useCallback((signal: AbortSignal, silent: boolean) => {
        const ids = todayTeamKey.split(',').filter(Boolean)
        if (ids.length === 0) { setGames({}); setLoaded(true); return Promise.resolve() }
        return Promise.all(ids.map(id => getTeamMatches(id, signal)
            .then(ms => { lastGood.current.set(id, ms); return { id, ms, ok: true } })
            .catch(() => ({ id, ms: lastGood.current.get(id) || [] as DiscoveryMatch[], ok: lastGood.current.has(id) }))))
            .then(rows => {
                if (signal.aborted) return
                if (silent && rows.every(r => !r.ok)) return
                const next: Record<string, TeamGames> = {}
                for (const r of rows) next[r.id] = { ms: r.ms, ok: r.ok }
                setGames(next)
                setLoaded(true)
            })
    }, [todayTeamKey])
    useEffect(() => {
        const ctrl = new AbortController()
        loadToday(ctrl.signal, false)
        return () => ctrl.abort()
    }, [loadToday])

    const now = useMinuteClock()
    const heroes = useMemo(() => orderedFavorites.slice(0, MAX_TODAY_TEAMS).map(fav => {
        const g = games[fav.id]
        return { fav, ok: g?.ok ?? false, known: Boolean(g), today: g ? teamToday(g.ms, now) : null }
    }), [orderedFavorites, games, now])
    const heroIds = useMemo(() => new Set(heroes.flatMap(h => h.today?.hero ? [String(h.today.hero.match.match_id)] : [])), [heroes])

    // Today's other games for the saved teams (Helsinki date), not already in a hero card.
    const todayMatches = useMemo(() => {
        const today = helsinkiToday(now)
        const seen = new Set<string>(heroIds)
        const out: { teamId: string; match: DiscoveryMatch; fetchedAt?: number }[] = []
        for (const [id, g] of Object.entries(games)) {
            for (const m of g.ms) {
                if (m.date !== today || seen.has(String(m.match_id))) continue
                if (matchPhase(m, now) === 'stale') continue
                seen.add(String(m.match_id))
                out.push({ teamId: id, match: m, fetchedAt: teamMatchesFetchedAt(id) })
            }
        }
        return out.sort((a, b) => byKickoffAsc(a.match, b.match))
    }, [games, heroIds, now])

    // Quiet refresh while a listed game is on or kicks off within 15 min (no spinner, keeps last good data).
    const refreshActive = useMemo(
        () => needsQuietRefresh([...todayMatches.map(t => t.match), ...heroes.flatMap(h => h.today?.hero ? [h.today.hero.match] : [])], now),
        [todayMatches, heroes, now],
    )
    const refreshCtrl = useRef<AbortController | null>(null)
    useEffect(() => () => refreshCtrl.current?.abort(), [])
    const quietRefresh = useCallback(() => {
        refreshCtrl.current?.abort()
        const ctrl = new AbortController()
        refreshCtrl.current = ctrl
        loadToday(ctrl.signal, true).catch(() => { /* keep what is shown */ })
    }, [loadToday])
    useQuietRefresh(refreshActive, quietRefresh)

    useEffect(() => {
        const teamFromUrl = normalizeTeamId(searchParams.get('team'))
        if (!teamFromUrl) return
        setLastSelectedTeamId(teamFromUrl)
        navigate(`/team/${teamFromUrl}`, { replace: true })
    }, [navigate, searchParams])

    // Older favourites were saved with only an id: fill in the real name once.
    useEffect(() => {
        const legacy = favorites.filter(f => f.name === f.id || !f.category)
        if (legacy.length === 0) return
        let cancelled = false
        legacy.forEach(f => {
            getTeamProfile(f.id)
                .then(profile => {
                    if (profile && !cancelled) updateName(f.id, profile.team_name || f.id, getTeamCategory(profile, APP_CONFIG.CURRENT_YEAR))
                })
                .catch(() => { /* keep the saved name */ })
        })
        return () => { cancelled = true }
    }, [favorites, updateName])

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault()
        const trimmed = matchId.trim()
        if (!/^\d+$/.test(trimmed)) return
        navigate(`/match/${trimmed}`)
    }

    const handleImportTournament = (e: React.FormEvent) => {
        e.preventDefault()
        setTournamentError(null)
        const parsed = parseTournamentUrl(tournamentUrlInput.trim())
        if (!parsed) {
            setTournamentError('Linkki ei kelpaa. Liitä Palloliiton tulospalvelun, Torneopalin tai fudisturnaus.com-turnauksen linkki.')
            return
        }
        const saved = saveTournament(parsed)
        setSavedTournaments(getSavedTournaments())
        setTournamentUrlInput('')
        if (parsed.kind === 'fudis') {
            navigate(tournamentPath(saved))
        } else {
            navigate(`${tournamentPath(saved)}${parsed.groupId ? `?lohko=${parsed.groupId}` : ''}`)
        }
    }

    return (
        <PageLayout>
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-text-primary">{APP_NAME}</h1>
                <p className="text-text-secondary text-sm">Omien joukkueiden pelit, tulokset ja sarjataulukot suoraan Palloliiton tulospalvelusta.</p>
            </div>

            <section aria-label="Omat pelit" className="space-y-3" data-testid="my-games">
                {orderedFavorites.length === 0 ? (
                    <div className="bg-surface-1 border border-accent/30 rounded-2xl p-4 space-y-3" data-testid="no-favorites">
                        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                            <Heart className="w-5 h-5 text-semantic-red" /> Tallenna oma joukkue
                        </h2>
                        <p className="text-sm text-text-secondary">
                            Hae joukkue alta ja paina sydäntä. Sen jälkeen etusivu näyttää heti oman joukkueen seuraavan pelin tai käynnissä olevan pelin tuloksen, pelipaikan kartan ja pysäköinnin.
                        </p>
                        <Link to="/haku" className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-lg bg-accent text-text-inverse font-bold text-sm">
                            <Search className="w-4 h-4" /> Hae joukkue
                        </Link>
                    </div>
                ) : heroes.map(({ fav, ok, known, today }) => {
                    if (!known && !loaded) return <div key={fav.id} className="animate-pulse bg-surface-1 rounded-2xl h-64" />
                    if (today?.hero) {
                        return (
                            <div key={fav.id} onClickCapture={() => setLastSelectedTeamId(fav.id)}>
                                <GameHero match={today.hero.match} kind={today.hero.kind} teamId={fav.id} teamName={fav.name} now={now} />
                            </div>
                        )
                    }
                    return (
                        <Link key={fav.id} to={`/team/${fav.id}`} onClick={() => setLastSelectedTeamId(fav.id)}
                            className="bg-surface-1 border border-border-hairline rounded-2xl p-4 min-h-[52px] flex items-center justify-between gap-3 hover:bg-surface-2">
                            <span className="min-w-0">
                                <span className="block text-[11px] font-bold uppercase tracking-widest text-accent truncate">{fav.name}</span>
                                <span className="block text-sm text-text-secondary mt-1">
                                    {ok ? 'Tulospalvelussa ei ole joukkueelle otteluita.' : 'Otteluita ei saatu ladattua juuri nyt.'}
                                </span>
                            </span>
                            <ChevronRight className="w-5 h-5 text-text-muted shrink-0" />
                        </Link>
                    )
                })}
            </section>

            <section aria-label="Haku">
                <SearchBox />
            </section>

            {todayMatches.length > 0 && (
                <section className="bg-surface-1 border border-border-hairline rounded-xl p-3 space-y-1" data-testid="today-section">
                    <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider px-1">Muut pelit tänään</h2>
                    {todayMatches.map(({ teamId, match, fetchedAt }) => (
                        <MatchRow key={match.match_id} match={match} teamId={teamId} subtitle={String(match.category_name || '')} now={now} fetchedAt={fetchedAt} />
                    ))}
                </section>
            )}

            {(orderedFavorites.length > 0 || favoritePlayers.length > 0) && (
                <section className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                            <Heart className="w-4 h-4 text-semantic-red fill-semantic-red" /> Suosikit
                        </h2>
                        <Link to="/favorites" className="text-xs text-text-muted hover:text-accent min-h-[44px] leading-[44px]">
                            Kaikki ({favorites.length + favoritePlayers.length})
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {orderedFavorites.map(fav => (
                            <Link key={`t${fav.id}`} to={`/team/${fav.id}`} onClick={() => setLastSelectedTeamId(fav.id)}
                                className="bg-surface-1 border border-border-hairline rounded-xl p-3 flex items-center gap-3 hover:bg-surface-2 min-h-[52px]">
                                <Shield className="w-5 h-5 text-accent shrink-0" />
                                <span className="min-w-0">
                                    <span className="block text-text-primary text-sm font-semibold truncate">{fav.name}</span>
                                    {fav.category && <span className="block text-text-muted text-xs truncate">{fav.category}</span>}
                                </span>
                            </Link>
                        ))}
                        {favoritePlayers.map(p => (
                            <Link key={`p${p.id}`} to={`/player/${p.id}`}
                                className="bg-surface-1 border border-border-hairline rounded-xl p-3 flex items-center gap-3 hover:bg-surface-2 min-h-[52px]">
                                {p.img_url ? <img src={p.img_url} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" /> : <User className="w-5 h-5 text-accent shrink-0" />}
                                <span className="min-w-0">
                                    <span className="block text-text-primary text-sm font-semibold truncate">{p.name}</span>
                                    <span className="block text-text-muted text-xs truncate">{p.teamName || 'Pelaaja'}</span>
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {viewed.length > 0 && (
                <section className="bg-surface-1 border border-border-hairline rounded-xl p-3 space-y-1">
                    <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider px-1">Viimeksi avatut ottelut</h2>
                    {viewed.map(({ match }) => <MatchRow key={match.match_id} match={match} />)}
                </section>
            )}

            {savedTournaments.length > 0 && (
                <section className="space-y-2">
                    <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-accent" /> Tallennetut turnaukset
                    </h2>
                    {savedTournaments.map(t => (
                        <div key={t.id} className="bg-surface-1 border border-border-hairline rounded-xl flex items-center">
                            <Link to={tournamentPath(t)} className="flex-1 min-w-0 p-4 min-h-[52px] hover:bg-surface-2 rounded-l-xl">
                                <span className="block text-text-primary font-semibold text-sm truncate">{t.title}</span>
                                <span className="block text-text-muted text-xs mt-0.5 truncate">{[t.teamName, t.category].filter(Boolean).join(' · ')}</span>
                            </Link>
                            <button type="button" aria-label={`Poista ${t.title}`}
                                onClick={() => { removeTournament(t.id); setSavedTournaments(getSavedTournaments()) }}
                                className="shrink-0 w-12 h-12 flex items-center justify-center text-text-muted hover:text-semantic-red">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </section>
            )}

            <details className="bg-surface-1 border border-border-hairline rounded-xl px-4 py-1">
                <summary className="cursor-pointer text-sm font-semibold text-text-primary flex items-center gap-2 min-h-[44px]">
                    <Trophy className="w-4 h-4 text-accent" /> Lisää turnaus linkillä
                </summary>
                <form onSubmit={handleImportTournament} className="mt-1 mb-3 space-y-2">
                    <p className="text-xs text-text-secondary">
                        Liitä Palloliiton tulospalvelun, Torneopalin tai fudisturnaus.com-turnauksen linkki.
                    </p>
                    <div className="flex gap-2">
                        <input type="url" inputMode="url" value={tournamentUrlInput}
                            onChange={e => { setTournamentUrlInput(e.target.value); setTournamentError(null) }}
                            aria-label="Turnauksen linkki"
                            placeholder="https://www.fudisturnaus.com/t/… tai tulospalvelu…"
                            className="flex-1 min-w-0 bg-surface-2 border border-border-hairline rounded-lg px-3 py-2 text-text-primary text-sm" />
                        <Button type="submit">Lisää</Button>
                    </div>
                    {tournamentError && <p className="text-xs text-semantic-red font-medium">{tournamentError}</p>}
                </form>
            </details>

            <details className="bg-surface-1 border border-border-hairline rounded-xl px-4 py-1">
                <summary className="cursor-pointer text-sm font-semibold text-text-secondary flex items-center gap-2 min-h-[44px]"><Hash className="w-4 h-4 text-accent" /> Avaa ottelu tunnuksella</summary>
                <form onSubmit={handleSubmit} className="mt-1 mb-3 flex gap-2">
                    <input type="text" inputMode="numeric" pattern="[0-9]*" value={matchId} onChange={e => setMatchId(e.target.value)}
                        aria-label="Ottelun tunnus" placeholder="esim. 4208631"
                        className="flex-1 min-w-0 bg-surface-2 border border-border-hairline rounded-lg px-3 py-2 text-text-primary text-sm" />
                    <Button type="submit">Avaa</Button>
                </form>
            </details>
        </PageLayout>
    )
}
