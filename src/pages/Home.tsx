import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Trophy, Heart, Shield, ChevronRight, Calendar, MapPin, User, Trash2 } from 'lucide-react'
import { Button, LiveBadge, MatchRow, PageLayout, SearchBox } from '../components'
import { getTeamMatches, getTeamProfile } from '../services/api'
import { listViewedMatches, type ViewedMatch } from '../services/viewedCache'
import { useFavorites } from '../hooks/useFavorites'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { getTeamCategory } from '../utils/dataProcessors'
import { APP_CONFIG, APP_NAME, FEATURED } from '../config'
import type { DiscoveryMatch } from '../types'
import { formatDate, formatTime } from '../utils/dates'
import { pickHeroMatch } from '../utils/matchLive'
import { displayScore, helsinkiToday, isForfeit, matchPhase, byKickoffAsc } from '../domain/matchState'
import { teamLabel } from '../utils/teamLabel'
import { getSavedTournaments, removeTournament, saveTournament, tournamentPath, type SavedTournament } from '../services/tournamentStorage'
import { getLastSelectedTeamId, normalizeTeamId, setLastSelectedTeamId, sortFavoritesByLastSelected } from '../services/teamSelection'
import { parseTournamentUrl } from '../utils/tournamentUrl'

const MAX_TODAY_TEAMS = 6

function HeroCard({ match, teamName }: { match: DiscoveryMatch; teamName: string }) {
    const navigate = useNavigate()
    const phase = matchPhase(match)
    const score = displayScore(match)
    const forfeit = phase === 'result' && isForfeit(match)
    const label = phase === 'live' ? null
        : phase === 'awaiting' ? null
            : phase === 'result' ? (forfeit ? 'Viimeisin ottelu · Luovutus' : 'Viimeisin ottelu')
                : 'Seuraava ottelu'
    const venue = String(match.venue_name || match.venue || match.venue_city_name || '')
    return (
        <button type="button" onClick={() => navigate(`/match/${match.match_id}`)} data-testid="hero-match"
            className="w-full h-full text-left bg-surface-1 border border-border-hairline rounded-2xl p-4 hover:bg-surface-2 transition-colors">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2 text-accent flex items-center gap-2">
                {teamName}
                {phase === 'live' && <LiveBadge />}
                {phase === 'awaiting' && <LiveBadge awaiting />}
                {label && <span className="text-text-muted">· {label}</span>}
            </p>
            <p className="text-lg font-bold text-text-primary">
                {teamLabel(match.team_A_id, match.team_A_name, match.team_A_description as string | undefined)} – {teamLabel(match.team_B_id, match.team_B_name, match.team_B_description as string | undefined)}
            </p>
            <p className="font-mono text-2xl font-bold mt-1">{score ? `${score.a}–${score.b}` : 'vs'}</p>
            <p className="text-sm text-text-secondary mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(match.date, 'with-year')} {formatTime(match.time)}
                </span>
                {venue && !forfeit && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{venue}</span>}
            </p>
        </button>
    )
}

export function Home() {
    const [matchId, setMatchId] = useState('')
    const [tournamentUrlInput, setTournamentUrlInput] = useState('')
    const [tournamentError, setTournamentError] = useState<string | null>(null)
    const [savedTournaments, setSavedTournaments] = useState<SavedTournament[]>(() => getSavedTournaments())
    const [hero, setHero] = useState<DiscoveryMatch | null>(null)
    const [heroFailed, setHeroFailed] = useState(false)
    const [todayMatches, setTodayMatches] = useState<{ teamId: string; teamName: string; match: DiscoveryMatch }[]>([])
    const [viewed] = useState<ViewedMatch[]>(() => listViewedMatches().slice(0, 8))
    const [loadingHero, setLoadingHero] = useState(true)
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { favorites, updateName, favoritePlayers } = useFavorites()
    useDocumentTitle('')
    const orderedFavorites = useMemo(
        () => sortFavoritesByLastSelected(favorites, getLastSelectedTeamId()),
        [favorites],
    )

    // Featured team's hero game + today's games (Helsinki date) for the featured and favourite teams.
    const todayTeamKey = useMemo(() => {
        const ids = [FEATURED.teamId, ...orderedFavorites.map(f => f.id)]
        return [...new Set(ids)].slice(0, MAX_TODAY_TEAMS).join(',')
    }, [orderedFavorites])
    useEffect(() => {
        const ctrl = new AbortController()
        const ids = todayTeamKey.split(',').filter(Boolean)
        const today = helsinkiToday()
        Promise.all(ids.map(id => getTeamMatches(id, ctrl.signal).then(ms => ({ id, ms, ok: true })).catch(() => ({ id, ms: [] as DiscoveryMatch[], ok: false }))))
            .then(rows => {
                if (ctrl.signal.aborted) return
                const featured = rows.find(r => r.id === FEATURED.teamId)
                setHero(featured?.ok ? pickHeroMatch(featured.ms) : null)
                setHeroFailed(!featured?.ok)
                setLoadingHero(false)
                const seen = new Set<string>()
                const out: { teamId: string; teamName: string; match: DiscoveryMatch }[] = []
                for (const { id, ms } of rows) {
                    for (const m of ms) {
                        if (m.date !== today || seen.has(m.match_id)) continue
                        if (matchPhase(m) === 'stale') continue
                        seen.add(m.match_id)
                        const name = String(m.team_A_id) === id ? m.team_A_name : m.team_B_name
                        out.push({ teamId: id, teamName: name, match: m })
                    }
                }
                out.sort((a, b) => byKickoffAsc(a.match, b.match))
                setTodayMatches(out)
            })
        return () => ctrl.abort()
    }, [todayTeamKey])

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
            setTournamentError('Linkki ei kelpaa. Liitä tulospalvelu.palloliitto.fi-sarjan linkki tai Torneopal-linkki, jossa on turnaus ja sarja.')
            return
        }
        saveTournament(parsed)
        setSavedTournaments(getSavedTournaments())
        setTournamentUrlInput('')
        navigate(`${tournamentPath(parsed)}${parsed.groupId ? `?lohko=${parsed.groupId}` : ''}`)
    }

    return (
        <PageLayout>
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-text-primary">{APP_NAME}</h1>
                <p className="text-text-secondary text-sm">Ottelut, tulokset ja sarjataulukot suoraan Palloliiton tulospalvelusta.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 md:items-start">
                <section aria-label="Haku">
                    <SearchBox />
                </section>
                <section aria-label="Esittelyjoukkue" className="space-y-2">
                    {loadingHero && <div className="animate-pulse bg-surface-1 rounded-2xl h-36" />}
                    {hero && <HeroCard match={hero} teamName={FEATURED.teamName} />}
                    {!loadingHero && !hero && heroFailed && (
                        <p className="text-sm text-text-secondary bg-surface-1 border border-border-hairline rounded-2xl p-4">Otteluita ei saatu ladattua juuri nyt.</p>
                    )}
                    <Link to={`/team/${FEATURED.teamId}`}
                        className="w-full bg-surface-1 border border-border-hairline rounded-xl px-4 min-h-[52px] flex items-center justify-between hover:bg-surface-2 transition-colors">
                        <span className="flex items-center gap-3 min-w-0">
                            <Shield className="w-5 h-5 text-accent shrink-0" />
                            <span className="text-text-primary font-semibold truncate">{FEATURED.teamName} · joukkueen sivu</span>
                        </span>
                        <ChevronRight className="w-5 h-5 text-text-muted shrink-0" />
                    </Link>
                </section>
            </div>

            {todayMatches.length > 0 && (
                <section className="bg-surface-1 border border-border-hairline rounded-xl p-3 space-y-1" data-testid="today-section">
                    <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider px-1">Tänään</h2>
                    {todayMatches.map(({ teamId, match }) => (
                        <MatchRow key={match.match_id} match={match} teamId={teamId} subtitle={String(match.category_name || '')} />
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

            <details className="bg-surface-1 border border-border-hairline rounded-xl p-4">
                <summary className="cursor-pointer text-sm font-semibold text-text-primary flex items-center gap-2 min-h-[28px]">
                    <Trophy className="w-4 h-4 text-accent" /> Lisää turnaus linkillä
                </summary>
                <form onSubmit={handleImportTournament} className="mt-3 space-y-2">
                    <p className="text-xs text-text-secondary">
                        Liitä turnauksen sarjan linkki Palloliiton tulospalvelusta, esim. tulospalvelu.palloliitto.fi/category/B13-8!hc2026.
                    </p>
                    <div className="flex gap-2">
                        <input type="url" inputMode="url" value={tournamentUrlInput}
                            onChange={e => { setTournamentUrlInput(e.target.value); setTournamentError(null) }}
                            aria-label="Turnauksen linkki"
                            placeholder="https://tulospalvelu.palloliitto.fi/category/…"
                            className="flex-1 min-w-0 bg-surface-2 border border-border-hairline rounded-lg px-3 py-2 text-text-primary text-sm" />
                        <Button type="submit">Lisää</Button>
                    </div>
                    {tournamentError && <p className="text-xs text-semantic-red font-medium">{tournamentError}</p>}
                </form>
            </details>

            <details className="bg-surface-1 border border-border-hairline rounded-xl p-4">
                <summary className="cursor-pointer text-sm font-semibold text-text-secondary min-h-[28px]">Avaa ottelu tunnuksella</summary>
                <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
                    <input type="text" inputMode="numeric" pattern="[0-9]*" value={matchId} onChange={e => setMatchId(e.target.value)}
                        aria-label="Ottelun tunnus" placeholder="esim. 4208631"
                        className="flex-1 min-w-0 bg-surface-2 border border-border-hairline rounded-lg px-3 py-2 text-text-primary text-sm" />
                    <Button type="submit">Avaa</Button>
                </form>
            </details>
        </PageLayout>
    )
}
