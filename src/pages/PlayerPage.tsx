import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, TrendingDown, Calendar, ExternalLink } from 'lucide-react'
import { cn } from '../utils/cn'
import { getPlayerData } from '../services/api'
import type { PlayerAPIResponse } from '../types/api'

interface SeasonStats {
    seasonName: string
    matches: number
    goals: number
    wins: number
    draws: number
    losses: number
}

function buildSeasonStats(matches?: PlayerAPIResponse['matches'] | null): SeasonStats[] {
    const bySeason = new Map<string, SeasonStats>()
    for (const m of matches || []) {
        if (m.status !== 'Played') continue
        const sid = m.season_id || 'unknown'
        let s = bySeason.get(sid)
        if (!s) {
            s = { seasonName: sid, matches: 0, goals: 0, wins: 0, draws: 0, losses: 0 }
            bySeason.set(sid, s)
        }
        s.matches++
        s.goals += parseInt(m.player_goals || '0') || 0
        const isA = m.team_id === m.team_A_id
        const myScore = isA ? parseInt(m.fs_A || '0', 10) : parseInt(m.fs_B || '0', 10)
        const oppScore = isA ? parseInt(m.fs_B || '0', 10) : parseInt(m.fs_A || '0', 10)
        if (myScore > oppScore) s.wins++
        else if (myScore < oppScore) s.losses++
        else s.draws++
    }
    return [...bySeason.entries()]
        .map(([seasonId, stats]) => ({ ...stats, seasonName: seasonId }))
        .sort((a, b) => b.seasonName.localeCompare(a.seasonName))
}

export function PlayerPage() {
    const { playerId } = useParams()
    const navigate = useNavigate()
    const [player, setPlayer] = useState<PlayerAPIResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [expanded, setExpanded] = useState<{ season: string; stat: string } | null>(null)
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

    useEffect(() => {
        if (!playerId) return
        setLoading(true)
        getPlayerData(playerId)
            .then(p => { setPlayer(p); setLoading(false) })
            .catch(e => { setError(e.message); setLoading(false) })
    }, [playerId])

    const seasons = useMemo(() => buildSeasonStats(player?.matches), [player?.matches])

    if (loading) return <div className="min-h-screen px-4 py-8"><div className="max-w-6xl mx-auto space-y-6"><div className="animate-pulse bg-surface-1 rounded-xl h-64" /></div></div>
    if (error || !player) return <div className="min-h-screen px-4 py-8 text-center text-semantic-red">{error || 'Pelaajaa ei löytynyt'}</div>

    const stats = (player as Record<string, unknown>).player_statistics as Array<Record<string, string>> | undefined
    const teamKeys = stats ? [...new Set(stats.map(s => s.team_id).filter(Boolean))] : []

    const playerName = `${player.first_name || ''} ${player.last_name || ''}`.trim()
    const age = player.birthyear ? new Date().getFullYear() - parseInt(player.birthyear) : null
    const ageValid = age !== null && !isNaN(age)

    const groupLevels = stats
        ? [...new Set(stats.map(s => [s.competition_name, s.category_name, s.group_name].filter(Boolean).join(' / ')).filter(Boolean))]
        : []

    const pastMatches = useMemo(() => {
        const matches = (player?.matches || []).filter(m => m.status === 'Played')
        const filtered = selectedTeamId ? matches.filter(m => m.team_id === selectedTeamId) : matches
        return filtered
            .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
            .slice(0, 30)
    }, [player?.matches, selectedTeamId])

    const upcomingMatches = useMemo(() => {
        const matches = (player?.matches || []).filter(m => m.status === 'Fixture')
        const filtered = selectedTeamId ? matches.filter(m => m.team_id === selectedTeamId) : matches
        return filtered.slice(0, 5)
    }, [player?.matches, selectedTeamId])

    return (
        <div className="min-h-screen px-4 py-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors text-sm mb-2">
                    <ArrowLeft className="w-4 h-4" /> Takaisin
                </button>

                <div className="bg-surface-1 border border-border-hairline rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-bmw-cyan via-bmw-magenta to-bmw-amber" />
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-surface-3 border border-border-hairline flex items-center justify-center shrink-0">
                            {player.img_url ? (
                                <img src={player.img_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <User className="w-7 h-7 text-text-muted" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-accent">Pelaajaprofiili</span>
                            <h1 className="text-2xl font-bold text-text-primary truncate mt-0.5">{playerName}</h1>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-text-secondary mt-1.5">
                                {ageValid && (
                                    <span className="flex items-center gap-1 font-medium bg-surface-2 px-2 py-0.5 rounded-md">
                                        {age} v ({player.birthyear})
                                    </span>
                                )}
                                {groupLevels.slice(0, 3).map((g, i) => (
                                    <span key={i} className="text-xs bg-surface-3 border border-border-hairline px-2 py-0.5 rounded-md font-medium text-text-primary">{g}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Left Column - Info & Seasons (1/3) */}
                    <div className="lg:col-span-1 space-y-6">
                        {teamKeys.length > 0 && (
                            <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Joukkueet tänä vuonna</h2>
                                    {selectedTeamId && (
                                        <button
                                            onClick={() => setSelectedTeamId(null)}
                                            className="text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                                        >
                                            Tyhjennä
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    {teamKeys.map(tid => {
                                        const teamStats = stats!.filter(s => s.team_id === tid)
                                        const teamName = teamStats[0]?.team_name || tid
                                        const games = teamStats.reduce((sum, s) => sum + (parseInt(s.matches || '0') || 0), 0)
                                        const goals = teamStats.reduce((sum, s) => sum + (parseInt(s.goals || '0') || 0), 0)
                                        const warnings = teamStats.reduce((sum, s) => sum + (parseInt(s.warnings || '0') || 0), 0)
                                        const isSelected = selectedTeamId === tid

                                        const statsParts = [`${games} ott.`, `${goals} maalia`]
                                        if (warnings > 0) {
                                            statsParts.push(`${warnings} var.`)
                                        }
                                        const statsText = statsParts.join(' / ')

                                        return (
                                            <div
                                                key={tid}
                                                onClick={() => setSelectedTeamId(isSelected ? null : tid)}
                                                className={cn(
                                                    "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none active:scale-[0.99]",
                                                    isSelected
                                                        ? "bg-accent-muted border-accent/30 ring-1 ring-accent/30"
                                                        : "bg-surface-1 border-border-hairline hover:bg-surface-2"
                                                )}
                                                style={{ minHeight: '44px' }}
                                            >
                                                <div className="min-w-0 flex-1 pr-2">
                                                    <p className="text-text-primary font-bold text-sm truncate">{teamName}</p>
                                                    <p className="text-text-muted text-xs mt-0.5">{statsText}</p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        navigate(`/team/${tid}`)
                                                    }}
                                                    className="p-2 -mr-1 rounded-lg text-text-muted hover:text-accent hover:bg-surface-3 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:outline-none ring-accent/50"
                                                    title="Siirry joukkuesivulle"
                                                    style={{ minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {seasons.length > 1 && (
                            <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
                                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                                    <TrendingDown className="w-4 h-4 text-accent" /> Kausivertailu
                                </h2>
                                {seasons.map(s => {
                                    const seasonMatches = (player.matches || []).filter(m =>
                                        m.season_id === s.seasonName && m.status === 'Played'
                                    )
                                    const statFilters: Record<string, (m: typeof seasonMatches[0]) => boolean> = {
                                        O: () => true,
                                        V: m => {
                                            const isA = m.team_id === m.team_A_id
                                            const myScore = isA ? parseInt(m.fs_A || '0', 10) : parseInt(m.fs_B || '0', 10)
                                            const oppScore = isA ? parseInt(m.fs_B || '0', 10) : parseInt(m.fs_A || '0', 10)
                                            return myScore > oppScore
                                        },
                                        T: m => {
                                            const isA = m.team_id === m.team_A_id
                                            const myScore = isA ? parseInt(m.fs_A || '0', 10) : parseInt(m.fs_B || '0', 10)
                                            const oppScore = isA ? parseInt(m.fs_B || '0', 10) : parseInt(m.fs_A || '0', 10)
                                            return myScore === oppScore
                                        },
                                        H: m => {
                                            const isA = m.team_id === m.team_A_id
                                            const myScore = isA ? parseInt(m.fs_A || '0', 10) : parseInt(m.fs_B || '0', 10)
                                            const oppScore = isA ? parseInt(m.fs_B || '0', 10) : parseInt(m.fs_A || '0', 10)
                                            return myScore < oppScore
                                        },
                                        maalia: m => parseInt(m.player_goals || '0') > 0,
                                    }
                                    const statLabels: Record<string, { label: string; count: number; color: string; bg: string }> = {
                                        O: { label: 'O', count: s.matches, color: 'text-text-primary', bg: 'bg-surface-3' },
                                        V: { label: 'V', count: s.wins, color: 'text-semantic-green', bg: 'bg-semantic-green/15' },
                                        T: { label: 'T', count: s.draws, color: 'text-accent', bg: 'bg-accent/15' },
                                        H: { label: 'H', count: s.losses, color: 'text-semantic-red', bg: 'bg-semantic-red/15' },
                                        maalia: { label: 'maalia', count: s.goals, color: 'text-accent font-bold', bg: 'bg-accent/15' },
                                    }
                                    return (
                                        <div key={s.seasonName} className="space-y-1">
                                            <p className="text-text-primary text-sm font-medium">{s.seasonName}</p>
                                            <div className="flex items-center gap-2 text-xs flex-wrap">
                                                {Object.entries(statLabels).map(([key, st]) => {
                                                    const isExpanded = expanded?.season === s.seasonName && expanded?.stat === key
                                                    return (
                                                        <button
                                                            key={key}
                                                            onClick={() => setExpanded(isExpanded ? null : { season: s.seasonName, stat: key })}
                                                            className={cn(
                                                                'px-2.5 py-1 rounded-lg transition-colors font-medium cursor-pointer active:scale-95',
                                                                isExpanded ? 'ring-1 ring-accent/50' : 'hover:brightness-110',
                                                                st.bg, st.color,
                                                            )}
                                                        >
                                                            {st.count} {st.label}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                            {expanded?.season === s.seasonName && (
                                                <div className="space-y-1 pt-2">
                                                    {seasonMatches.filter(statFilters[expanded.stat] || statFilters.O).map(m => {
                                                        const isA = m.team_id === m.team_A_id
                                                        const oppName = isA ? m.team_B_name : m.team_A_name
                                                        const myScore = isA ? parseInt(m.fs_A || '0', 10) : parseInt(m.fs_B || '0', 10)
                                                        const oppScore = isA ? parseInt(m.fs_B || '0', 10) : parseInt(m.fs_A || '0', 10)
                                                        const wld = myScore > oppScore ? 'V' : myScore < oppScore ? 'H' : 'T'
                                                        const wldColor = wld === 'V' ? 'text-semantic-green' : wld === 'H' ? 'text-semantic-red' : 'text-accent'
                                                        return (
                                                            <div
                                                                key={m.match_id}
                                                                onClick={() => navigate(`/match/${m.match_id}`)}
                                                                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-2 border border-transparent hover:border-border-hairline cursor-pointer transition-all active:scale-[0.99] min-h-[40px] text-xs"
                                                            >
                                                                <span className="text-text-muted w-10 shrink-0">{m.date?.slice(5)}</span>
                                                                <span className="text-text-primary truncate text-right flex-1 pr-2">{oppName}</span>
                                                                <span className="font-mono font-bold shrink-0 flex items-center gap-1">
                                                                    {m.fs_A ? `${myScore}–${oppScore}` : '–'}
                                                                    {wld && <span className={cn('text-xs font-bold', wldColor)}>{wld}</span>}
                                                                </span>
                                                            </div>
                                                        )
                                                    })}
                                                    {seasonMatches.filter(statFilters[expanded.stat] || statFilters.O).length === 0 && (
                                                        <p className="text-text-muted text-xs py-2">Ei otteluita</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Column - Logs (2/3) */}
                    <div className="lg:col-span-2 space-y-6">
                        {pastMatches.length > 0 && (
                            <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                                        <TrendingDown className="w-4 h-4 text-accent" /> Viimeisimmät ottelut
                                    </h2>
                                    {selectedTeamId && (
                                        <span className="text-xs text-accent bg-accent-muted px-2 py-0.5 rounded-full border border-accent/20">
                                            Suodatettu
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    {pastMatches.map(m => {
                                        const isA = m.team_id === m.team_A_id
                                        const myTeamName = m.team_name || (isA ? m.team_A_name : m.team_B_name)
                                        const oppName = isA ? m.team_B_name : m.team_A_name
                                        const myScore = isA ? m.fs_A : m.fs_B
                                        const oppScore = isA ? m.fs_B : m.fs_A
                                        const wld = (() => {
                                            const myScoreVal = parseInt(myScore || '0', 10)
                                            const oppScoreVal = parseInt(oppScore || '0', 10)
                                            return myScoreVal > oppScoreVal ? 'V' : myScoreVal < oppScoreVal ? 'H' : 'T'
                                        })()
                                        const wldBg = wld === 'V' ? 'bg-semantic-green' : wld === 'H' ? 'bg-semantic-red' : 'bg-accent'

                                        return (
                                            <div
                                                key={m.match_id}
                                                onClick={() => navigate(`/match/${m.match_id}`)}
                                                className="flex items-center gap-3 py-2 px-2.5 rounded-lg hover:bg-surface-2 cursor-pointer transition-all active:scale-[0.99] text-sm border border-transparent hover:border-border-hairline"
                                                style={{ minHeight: '44px' }}
                                            >
                                                <span className={cn('w-2 h-2 rounded-full shrink-0', wldBg)} />
                                                <span className="text-text-muted text-xs shrink-0 w-10">{m.date?.slice(5)}</span>
                                                <div className="flex-1 min-w-0 flex items-center gap-1.5 text-xs sm:text-sm">
                                                    <span className="text-text-primary font-semibold truncate shrink-0 max-w-[100px] sm:max-w-[150px]">
                                                        {myTeamName}
                                                    </span>
                                                    <span className="text-text-muted text-xs shrink-0">vs</span>
                                                    <span className="text-text-secondary truncate">
                                                        {oppName}
                                                    </span>
                                                </div>
                                                <div className="shrink-0 flex items-center gap-2">
                                                    <span className="font-mono font-bold text-text-primary text-sm">
                                                        {m.fs_A && m.fs_B ? `${myScore}–${oppScore}` : '–'}
                                                    </span>
                                                    {Number(m.player_goals || 0) > 0 && (
                                                        <span className="text-[10px] font-bold text-text-inverse bg-accent px-1.5 py-0.5 rounded leading-none shrink-0">
                                                            MAALI
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {upcomingMatches.length > 0 && (
                            <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
                                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-accent" /> Tulevat ottelut
                                </h2>
                                <div className="space-y-1">
                                    {upcomingMatches.map(m => {
                                        const isA = m.team_id === m.team_A_id
                                        const oppName = isA ? m.team_B_name : m.team_A_name
                                        return (
                                            <div
                                                key={m.match_id}
                                                onClick={() => navigate(`/match/${m.match_id}`)}
                                                className="flex items-center gap-3 py-2 px-2.5 rounded-lg hover:bg-surface-2 cursor-pointer transition-all active:scale-[0.99] text-sm border border-transparent hover:border-border-hairline"
                                                style={{ minHeight: '44px' }}
                                            >
                                                <span className="w-2 h-2 rounded-full bg-text-muted shrink-0" />
                                                <span className="text-text-muted text-xs shrink-0 w-10">{m.date?.slice(5)}</span>
                                                <div className="flex-1 min-w-0 flex items-center gap-1.5 text-xs sm:text-sm">
                                                    <span className="text-text-primary font-semibold truncate shrink-0 max-w-[100px] sm:max-w-[150px]">
                                                        {m.team_name}
                                                    </span>
                                                    <span className="text-text-muted text-xs shrink-0">vs</span>
                                                    <span className="text-text-secondary truncate">
                                                        {oppName}
                                                    </span>
                                                </div>
                                                <span className="text-text-muted text-xs font-mono shrink-0">
                                                    {m.time || '–'}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}