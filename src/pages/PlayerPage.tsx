import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { User, TrendingDown, Calendar, ExternalLink } from 'lucide-react'
import { cn } from '../utils/cn'
import { formatDate } from '../utils/dates'
import { WLD_CONFIG } from '../utils/wld'
import { loadPlayer } from '../services/playerStore'
import { MATCH_STATUS } from '../types'
import type { PlayerAPIResponse } from '../types'
import { BackButton, PageLayout } from '../components'
import { buildSeriesFromMatches, currentTeams } from '../utils/playerSeries'

export function PlayerPage() {
    const { playerId } = useParams()
    const navigate = useNavigate()
    const [player, setPlayer] = useState<PlayerAPIResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
    const abortRef = useRef<AbortController | null>(null)

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
                if (!p) setError('Pelaajaa ei löytynyt')
                else setPlayer(p)
                setLoading(false)
            })
            .catch(e => {
                if (controller.signal.aborted) return
                setError(e.message)
                setLoading(false)
            })
        return () => { controller.abort() }
    }, [playerId])

    const safeMatches = useMemo(() => player?.matches ?? [], [player?.matches])
    const seasons = useMemo(() => buildSeriesFromMatches(safeMatches), [safeMatches])
    const teams = useMemo(() => currentTeams(player), [player])

    const pastMatches = useMemo(() => {
        const matches = safeMatches.filter(m => m.status === MATCH_STATUS.PLAYED)
        const filtered = selectedTeamId ? matches.filter(m => m.team_id === selectedTeamId) : matches
        return filtered.sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 40)
    }, [safeMatches, selectedTeamId])

    const upcomingMatches = useMemo(() => {
        const matches = safeMatches.filter(m => m.status === MATCH_STATUS.FIXTURE)
        const filtered = selectedTeamId ? matches.filter(m => m.team_id === selectedTeamId) : matches
        return filtered.slice(0, 8)
    }, [safeMatches, selectedTeamId])

    if (loading) return <div className="min-h-screen px-4 py-8"><div className="max-w-6xl mx-auto"><div className="animate-pulse bg-surface-1 rounded-xl h-64" /></div></div>
    if (error || !player) return <div className="min-h-screen px-4 py-8 text-center text-semantic-red">{error || 'Pelaajaa ei löytynyt'}</div>

    const playerName = `${player.first_name || ''} ${player.last_name || ''}`.trim() || 'Tuntematon pelaaja'
    const age = player.birthyear ? new Date().getFullYear() - parseInt(player.birthyear) : null
    const ageValid = age !== null && !isNaN(age) && age > 0 && age < 100

    return (
        <PageLayout>
            <BackButton className="mb-2" />
            <div className="bg-surface-1 border border-border-hairline rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-bmw-cyan via-bmw-magenta to-bmw-amber" />
                <div className="flex items-center gap-4">
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
                                        <p className="text-xs text-text-muted truncate">{row.categoryName}{row.competitionName ? ` · ${row.competitionName}` : ''}</p>
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
                    {pastMatches.map(m => {
                        const isA = m.team_id === m.team_A_id
                        const myTeamName = m.team_name || (isA ? m.team_A_name : m.team_B_name)
                        const oppName = isA ? m.team_B_name : m.team_A_name
                        const myScore = isA ? m.fs_A : m.fs_B
                        const oppScore = isA ? m.fs_B : m.fs_A
                        const wld = parseInt(myScore || '0', 10) > parseInt(oppScore || '0', 10) ? 'V' : parseInt(myScore || '0', 10) < parseInt(oppScore || '0', 10) ? 'H' : 'T'
                        return (
                            <div key={m.match_id} onClick={() => navigate(`/match/${m.match_id}`)} className="flex items-center gap-3 py-2 px-2.5 rounded-lg hover:bg-surface-2 cursor-pointer text-sm min-h-[44px]">
                                <span className={cn('w-2 h-2 rounded-full shrink-0', WLD_CONFIG[wld]?.dot || 'bg-accent')} />
                                <span className="text-text-muted text-xs w-10">{formatDate(m.date, 'short')}</span>
                                <div className="flex-1 min-w-0 truncate">{myTeamName} vs {oppName}</div>
                                <span className="font-mono font-bold text-sm">{m.fs_A && m.fs_B ? `${myScore}–${oppScore}` : '–'}</span>
                            </div>
                        )
                    })}
                    {upcomingMatches.map(m => {
                        const isA = m.team_id === m.team_A_id
                        return (
                            <div key={m.match_id} onClick={() => navigate(`/match/${m.match_id}`)} className="flex items-center gap-3 py-2 cursor-pointer text-sm">
                                <Calendar className="w-4 h-4 text-accent" />
                                <span className="text-text-muted text-xs w-10">{formatDate(m.date, 'short')}</span>
                                <span className="truncate">{m.team_name} vs {isA ? m.team_B_name : m.team_A_name}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </PageLayout>
    )
}
