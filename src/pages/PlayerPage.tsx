import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, TrendingDown, Calendar } from 'lucide-react'
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

    const pastMatches = (player.matches || [])
        .filter(m => m.status === 'Played')
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        .slice(0, 30)

    const upcomingMatches = (player.matches || [])
        .filter(m => m.status === 'Fixture')
        .slice(0, 5)

    return (
        <div className="min-h-screen px-4 py-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors text-sm mb-2">
                    <ArrowLeft className="w-4 h-4" /> Takaisin
                </button>

                <div className="bg-surface-1 border border-border-hairline rounded-xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-surface-3 flex items-center justify-center shrink-0">
                            <User className="w-6 h-6 text-text-muted" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl font-bold text-text-primary truncate">{playerName}</h1>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-muted mt-1">
                                {ageValid && (
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5 text-accent" />
                                        {age} v ({player.birthyear})
                                    </span>
                                )}
                                {groupLevels.slice(0, 3).map((g, i) => (
                                    <span key={i} className="text-xs bg-surface-2 px-2 py-0.5 rounded-full">{g}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {teamKeys.length > 0 && (
                    <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
                        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Joukkueet tänä vuonna</h2>
                        {teamKeys.map(tid => {
                            const teamStats = stats!.filter(s => s.team_id === tid)
                            const teamName = teamStats[0]?.team_name || tid
                            const games = teamStats.reduce((sum, s) => sum + (parseInt(s.matches || '0') || 0), 0)
                            const goals = teamStats.reduce((sum, s) => sum + (parseInt(s.goals || '0') || 0), 0)
                            const warnings = teamStats.reduce((sum, s) => sum + (parseInt(s.warnings || '0') || 0), 0)
                            return (
                                <div
                                    key={tid}
                                    className="flex items-center justify-between py-1.5"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p
                                            onClick={() => navigate(`/team/${tid}`)}
                                            className="text-text-primary font-medium text-sm truncate cursor-pointer hover:text-accent"
                                        >{teamName}</p>
                                        <p className="text-text-muted text-xs">{games} ottelua, {goals} maalia, {warnings} varoitusta</p>
                                    </div>
                                </div>
                            )
                        })}
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
                                                        'px-2.5 py-1 rounded-lg transition-colors font-medium',
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
                                        <div className="space-y-0.5 pt-1">
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
                                                        className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-surface-2 cursor-pointer transition-colors text-xs"
                                                    >
                                                        <span className="text-text-muted w-10 shrink-0">{m.date?.slice(5)}</span>
                                                        <span className="text-text-primary truncate text-right flex-1">{oppName}</span>
                                                        <span className="font-mono font-bold mx-1.5 shrink-0 flex items-center gap-1">
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

                {pastMatches.length > 0 && (
                    <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
                        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Viimeisimmät ottelut</h2>
                        {pastMatches.map(m => {
                            const isA = m.team_id === m.team_A_id
                            const oppName = isA ? m.team_B_name : m.team_A_name
                            const myScore = isA ? m.fs_A : m.fs_B
                            const oppScore = isA ? m.fs_B : m.fs_A
                            const wld = (() => {
                                const myScoreVal = parseInt(myScore || '0', 10)
                                const oppScoreVal = parseInt(oppScore || '0', 10)
                                return myScoreVal > oppScoreVal ? 'V' : myScoreVal < oppScoreVal ? 'H' : 'T'
                            })()
                            const wldColor = wld === 'V' ? 'text-semantic-green' : wld === 'H' ? 'text-semantic-red' : 'text-accent'
                            return (
                                <div
                                    key={m.match_id}
                                    onClick={() => navigate(`/match/${m.match_id}`)}
                                    className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-surface-2 cursor-pointer transition-colors text-sm"
                                >
                                    <span className="text-text-muted w-12 shrink-0 text-xs">{m.date?.slice(5)}</span>
                                    <span className="text-text-primary truncate text-right flex-1">{oppName}</span>
                                    <span className="font-mono font-bold mx-2 shrink-0 flex items-center gap-1">
                                        {m.fs_A ? `${myScore}–${oppScore}` : '–'}
                                        {wld && <span className={cn('text-xs font-bold', wldColor)}>{wld}</span>}
                                        {Number(m.player_goals || 0) > 0 && <span className="text-accent text-xs">MAALI</span>}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                )}

                {upcomingMatches.length > 0 && (
                    <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
                        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Tulevat ottelut</h2>
                        {upcomingMatches.map(m => (
                            <div key={m.match_id} onClick={() => navigate(`/match/${m.match_id}`)} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-surface-2 cursor-pointer transition-colors text-sm">
                                <span className="text-text-muted">{m.date} {m.time}</span>
                                <span className="text-text-primary truncate ml-2">{m.team_name} vs {m.team_A_id === m.team_id ? m.team_B_name : m.team_A_name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}