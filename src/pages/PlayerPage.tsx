import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { User, TrendingDown, Calendar, ExternalLink, Heart, Radio } from 'lucide-react'
import { cn } from '../utils/cn'
import { getCurrentSeason, halfOf, formatSeasonLabel, resolveActiveSeason } from '../utils/dates'
import { loadPlayer } from '../services/playerStore'
import { splitMatches } from '../domain/matchState'
import { mergePlayerMatches, playerSideTeamId } from '../utils/playerMatches'
import { MatchRow } from '../components/MatchRow'
import { ErrorState } from '../components/ErrorState'
import { TasoLink } from '../components/TasoLink'
import { friendlyError } from '../utils/friendlyError'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type { PlayerAPIResponse } from '../types'
import { BackButton, PageLayout } from '../components'
import { buildSeriesFromMatches, currentTeams } from '../utils/playerSeries'
import { useFavorites } from '../hooks/useFavorites'

function byTeamFilter(teamId: string | null) {
    return (m: { team_A_id?: string; team_B_id?: string }) => !teamId || m.team_A_id === teamId || m.team_B_id === teamId
}

export function PlayerPage() {
    const { playerId } = useParams()
    const navigate = useNavigate()
    const { isFavoritePlayer, togglePlayer } = useFavorites()
    const [player, setPlayer] = useState<PlayerAPIResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
    const currentSeason = useMemo(() => getCurrentSeason(), [])
    const [selectedYear, setSelectedYear] = useState<string>(currentSeason.year)
    const [selectedHalf, setSelectedHalf] = useState<'all' | 'kevät' | 'syksy'>(currentSeason.half)
    const seasonTouched = useRef(false)
    const abortRef = useRef<AbortController | null>(null)
    const [tick, setTick] = useState(0)
    useDocumentTitle(player ? `${player.first_name || ''} ${player.last_name || ''}`.trim() : 'Pelaaja')

    useEffect(() => {
        if (!playerId) {
            setError('Pelaajan tunnus puuttuu')
            setLoading(false)
            return
        }
        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller
        setLoading(true)
        setError(null)
        loadPlayer(playerId, controller.signal)
            .then(p => {
                if (controller.signal.aborted) return
                if (!p) setError('Pelaajaa ei löytynyt.')
                else setPlayer(p)
                setLoading(false)
            })
            .catch(e => {
                if (controller.signal.aborted) return
                setError(friendlyError(e, 'Pelaajan tietoja'))
                setLoading(false)
            })
        return () => { controller.abort() }
    }, [playerId, tick])

    const safeMatches = useMemo(() => player?.matches ?? [], [player?.matches])
    const availableYears = useMemo(() => {
        const set = new Set<string>()
        safeMatches.forEach(m => {
            const yr = m.season_id || (m.date ? m.date.slice(0, 4) : '')
            if (yr && /^\d{4}$/.test(yr)) set.add(yr)
        })
        return [...set].sort((a, b) => b.localeCompare(a))
    }, [safeMatches])

    useEffect(() => {
        if (seasonTouched.current || !player) return
        const s = resolveActiveSeason(mergePlayerMatches(player))
        setSelectedYear(s.year)
        setSelectedHalf(s.half)
    }, [player])

    useEffect(() => {
        if (seasonTouched.current) return
        if (availableYears.length > 0 && selectedYear !== 'all' && !availableYears.includes(selectedYear)) {
            setSelectedYear(availableYears[0])
        }
    }, [availableYears, selectedYear])

    const seasons = useMemo(() => buildSeriesFromMatches(safeMatches, {
        seasonId: selectedYear,
        half: selectedHalf,
    }), [safeMatches, selectedYear, selectedHalf])
    const teams = useMemo(() => currentTeams(player), [player])

    const allMatches = useMemo(() => mergePlayerMatches(player), [player])
    const myTeamIds = useMemo(() => new Set((player?.teams || []).map(t => String(t.team_id))), [player])
    const split = useMemo(() => splitMatches(allMatches), [allMatches])
    const byTeam = (m: { team_A_id?: string; team_B_id?: string; team_id?: string }) =>
        !selectedTeamId || m.team_A_id === selectedTeamId || m.team_B_id === selectedTeamId

    const pastMatches = useMemo(() => {
        let matches = split.results.filter(byTeamFilter(selectedTeamId))
        if (selectedYear !== 'all') matches = matches.filter(m => (m.season_id === selectedYear || (m.date && m.date.startsWith(selectedYear))))
        if (selectedYear !== 'all' && selectedHalf !== 'all') matches = matches.filter(m => halfOf(m.date) === selectedHalf)
        return matches.slice(0, 40)
    }, [split, selectedTeamId, selectedYear, selectedHalf])

    // Live and upcoming games are "now": every team, never hidden by season chips, no stale fixtures.
    const onNowMatches = split.onNow.filter(byTeam)
    const upcomingMatches = split.upcoming.filter(byTeam).slice(0, 8)

    if (loading) return <div className="min-h-screen px-4 py-8"><div className="max-w-6xl mx-auto"><div className="animate-pulse bg-surface-1 rounded-xl h-64" /></div></div>
    if (error || !player) return <ErrorState message={error || 'Pelaajaa ei löytynyt.'} onRetry={() => setTick(t => t + 1)} />

    const playerName = `${player.first_name || ''} ${player.last_name || ''}`.trim() || 'Tuntematon pelaaja'
    const age = player.birthyear ? Number(getCurrentSeason().year) - parseInt(player.birthyear) : null
    const ageValid = age !== null && !isNaN(age) && age > 0 && age < 100
    const isFav = playerId ? isFavoritePlayer(playerId) : false

    const handleToggleFavorite = () => {
        if (!playerId || !player) return
        const primaryTeam = teams[0]
        togglePlayer({
            id: playerId,
            name: playerName,
            teamName: primaryTeam?.teamName,
            category: primaryTeam?.level,
            img_url: player.img_url,
            birthyear: player.birthyear,
        })
    }

    return (
        <PageLayout>
            <BackButton className="mb-2" />
            <div className="bg-surface-1 border border-border-hairline rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-bmw-cyan via-bmw-magenta to-bmw-amber" />
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-14 h-14 rounded-full bg-surface-3 border border-border-hairline flex items-center justify-center shrink-0">
                            {player.img_url ? <img src={player.img_url} alt="" className="w-full h-full rounded-full object-cover" /> : <User className="w-7 h-7 text-text-muted" />}
                        </div>
                        <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-accent">Pelaajaprofiili</span>
                            <h1 className="text-2xl font-bold text-text-primary truncate mt-0.5">{playerName}</h1>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-text-secondary mt-1.5">
                                {ageValid && <span className="font-medium bg-surface-2 px-2 py-0.5 rounded-md">{age} v ({player.birthyear})</span>}
                                {teams.slice(0, 3).map(t => (
                                    <span key={t.teamId} className="text-xs bg-surface-3 border border-border-hairline px-2 py-0.5 rounded-md text-text-primary">{t.teamName} · {t.level}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleToggleFavorite}
                        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-surface-2 border border-border-hairline hover:border-accent/30 hover:bg-surface-3 transition-all cursor-pointer active:scale-95 shrink-0"
                        aria-label={isFav ? 'Poista suosikeista' : 'Lisää suosikkeihin'}
                    >
                        <Heart className={cn('w-5 h-5 transition-colors', isFav ? 'fill-semantic-red text-semantic-red' : 'text-text-muted')} />
                    </button>
                </div>
            </div>
            {playerId && <TasoLink kind="person" id={playerId} />}
            {(onNowMatches.length > 0 || upcomingMatches.length > 0) && (
                <div className="space-y-4">
                    {onNowMatches.length > 0 && (
                        <div className="bg-surface-1 border border-semantic-red/30 rounded-xl p-5 space-y-3">
                            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                                <Radio className="w-4 h-4 text-semantic-red" /> Nyt käynnissä
                            </h2>
                            <div className="space-y-1">
                                {onNowMatches.map(m => (
                                    <MatchRow key={m.match_id} match={{ ...m, match_id: String(m.match_id) }} teamId={playerSideTeamId(m, myTeamIds)} subtitle={[m.category_name, m.venue_name].filter(Boolean).join(' · ')} />
                                ))}
                            </div>
                        </div>
                    )}
                    {upcomingMatches.length > 0 && (
                        <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
                            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-accent" /> Tulevat ottelut
                            </h2>
                            <div className="space-y-1">
                                {upcomingMatches.map(m => (
                                    <MatchRow key={m.match_id} match={{ ...m, match_id: String(m.match_id) }} teamId={playerSideTeamId(m, myTeamIds)} subtitle={[m.category_name, m.venue_name].filter(Boolean).join(' · ')} />
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            )}
            <div className="space-y-4 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-text-secondary">
                        Kausitilastot: {formatSeasonLabel(selectedYear, selectedHalf)}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                        {availableYears.length > 0 && (
                            <div className="flex items-center gap-1.5 bg-surface-2 p-1 rounded-lg border border-border-hairline">
                                <button
                                    onClick={() => { seasonTouched.current = true; setSelectedYear('all') }}
                                    className={cn(
                                        "text-xs px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer active:scale-95",
                                        selectedYear === 'all'
                                            ? "bg-accent text-text-inverse shadow-sm"
                                            : "text-text-muted hover:text-text-primary"
                                    )}
                                >
                                    Yhteensä
                                </button>
                                {availableYears.map((y: string) => (
                                    <button
                                        key={y}
                                        onClick={() => { seasonTouched.current = true; setSelectedYear(y) }}
                                        className={cn(
                                            "text-xs px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer active:scale-95",
                                            selectedYear === y
                                                ? "bg-accent text-text-inverse shadow-sm"
                                                : "text-text-muted hover:text-text-primary"
                                        )}
                                    >
                                        {y}
                                    </button>
                                ))}
                            </div>
                        )}

                        {selectedYear !== 'all' && (
                            <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-lg border border-border-hairline">
                                <button
                                    onClick={() => { seasonTouched.current = true; setSelectedHalf('syksy') }}
                                    className={cn(
                                        "text-xs px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer active:scale-95",
                                        selectedHalf === 'syksy'
                                            ? "bg-accent text-text-inverse shadow-sm"
                                            : "text-text-muted hover:text-text-primary"
                                    )}
                                >
                                    Syksy {selectedYear}
                                </button>
                                <button
                                    onClick={() => { seasonTouched.current = true; setSelectedHalf('kevät') }}
                                    className={cn(
                                        "text-xs px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer active:scale-95",
                                        selectedHalf === 'kevät'
                                            ? "bg-accent text-text-inverse shadow-sm"
                                            : "text-text-muted hover:text-text-primary"
                                    )}
                                >
                                    Kevät {selectedYear}
                                </button>
                                <button
                                    onClick={() => { seasonTouched.current = true; setSelectedHalf('all') }}
                                    className={cn(
                                        "text-xs px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer active:scale-95",
                                        selectedHalf === 'all'
                                            ? "bg-accent text-text-inverse shadow-sm"
                                            : "text-text-muted hover:text-text-primary"
                                    )}
                                >
                                    Koko {selectedYear}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-1 space-y-6">
                    {teams.length > 0 && (
                        <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Joukkueet</h2>
                                {selectedTeamId && <button onClick={() => setSelectedTeamId(null)} className="text-xs text-text-muted">Tyhjennä</button>}
                            </div>
                            {teams.map(t => (
                                <div key={t.teamId} onClick={() => setSelectedTeamId(selectedTeamId === t.teamId ? null : t.teamId)}
                                    className={cn('flex items-center justify-between p-3 rounded-xl border cursor-pointer min-h-[44px]', selectedTeamId === t.teamId ? 'bg-accent-muted border-accent/30' : 'border-border-hairline hover:bg-surface-2')}>
                                    <div className="min-w-0">
                                        <p className="text-text-primary font-bold text-sm truncate">{t.teamName}</p>
                                        <p className="text-text-muted text-xs mt-0.5 truncate">{t.level}</p>
                                    </div>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/team/${t.teamId}`) }} className="p-2 text-text-muted hover:text-accent">
                                        <ExternalLink className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    {seasons.map(s => (
                        <div key={s.seasonId} className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
                            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                                <TrendingDown className="w-4 h-4 text-accent" /> Kausi {s.seasonId}
                            </h2>
                            <p className="text-xs text-text-muted">{s.matches} ott. · {s.goals} maalia · {s.wins}V {s.draws}T {s.losses}H</p>
                            <div className="space-y-2">
                                {s.series.map(row => (
                                    <button key={row.key} type="button" onClick={() => setSelectedTeamId(row.teamId)}
                                        className="w-full text-left p-3 rounded-lg border border-border-hairline hover:bg-surface-2">
                                        <p className="text-sm font-semibold text-text-primary truncate">{row.teamName}</p>
                                        <p className="text-xs text-text-muted truncate">{row.categoryName}{row.half ? ` · ${row.half}` : ''}{row.competitionName ? ` · ${row.competitionName}` : ''}</p>
                                        <p className="text-xs text-text-secondary mt-1">
                                            {row.matches} ott. · {row.goals} maalia
                                            {row.assists ? ` · ${row.assists} syöttöä` : ''}
                                            {row.warnings ? ` · ${row.warnings} var.` : ''}
                                            {' · '}{row.wins}V {row.draws}T {row.losses}H
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                                <TrendingDown className="w-4 h-4 text-accent" /> Pelatut ottelut
                            </h2>
                            <span className="text-xs text-text-muted">{pastMatches.length} ottelua</span>
                        </div>
                        <div className="space-y-2">
                            {pastMatches.map(m => {
                                const side = playerSideTeamId(m, myTeamIds)
                                const goals = parseInt(m.player_goals || '0', 10) || 0
                                const warnings = parseInt(m.player_warnings || '0', 10) || 0
                                const subtitle = [
                                    goals > 0 ? `⚽ ${goals} ${goals === 1 ? 'maali' : 'maalia'}` : '',
                                    warnings > 0 ? `🟨${warnings > 1 ? ` ${warnings}` : ''}` : '',
                                    m.category_name || '',
                                ].filter(Boolean).join(' · ')
                                return <MatchRow key={m.match_id} match={{ ...m, match_id: String(m.match_id || '') }} teamId={side} subtitle={subtitle} />
                            })}
                            {pastMatches.length === 0 && (
                                <p className="text-xs text-text-muted py-4 text-center">Ei pelattuja otteluita valitulle rajaukselle.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    )
}
