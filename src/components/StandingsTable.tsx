import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../utils/cn'
import type { StandingTeam, MatchSummary } from '../types/api'

export function StandingsTable({ teams, matches = [], teamAId, teamBId, selectedTeam, onSelectTeam, compact }: {
    teams: StandingTeam[]
    matches?: MatchSummary[]
    teamAId?: string
    teamBId?: string
    selectedTeam?: string | null
    onSelectTeam?: (teamId: string | null) => void
    compact?: boolean
}) {
    const navigate = useNavigate()
    const [hoveredTeam, setHoveredTeam] = useState<string | null>(null)

    const sorted = [...teams].sort((a, b) => (parseInt(a.current_standing) || 999) - (parseInt(b.current_standing) || 999))

    const activeTeamId = hoveredTeam || selectedTeam

    const opponentResults = useMemo(() => {
        type Result = { result: 'win' | 'draw' | 'loss' | 'upcoming'; matchId: string }
        const map = new Map<string, Result[]>()
        if (!activeTeamId || matches.length === 0) return map
        for (const m of matches) {
            if (m.team_A_id !== activeTeamId && m.team_B_id !== activeTeamId) continue
            const isA = m.team_A_id === activeTeamId
            const opponentTeamId = isA ? m.team_B_id : m.team_A_id
            if (!opponentTeamId) continue
            const myScore = parseInt(isA ? m.fs_A : m.fs_B)
            const oppScore = parseInt(isA ? m.fs_B : m.fs_A)
            let result: 'win' | 'draw' | 'loss' | 'upcoming'
            if (m.status === 'Fixture') {
                result = 'upcoming'
            } else if (isNaN(myScore) || isNaN(oppScore)) {
                continue
            } else if (myScore > oppScore) {
                result = 'win'
            } else if (myScore < oppScore) {
                result = 'loss'
            } else {
                result = 'draw'
            }
            const existing = map.get(opponentTeamId) || []
            existing.push({ result, matchId: m.match_id })
            map.set(opponentTeamId, existing)
        }
        return map
    }, [activeTeamId, matches])

    const resultConfig = {
        win: { color: 'text-semantic-green', bg: 'bg-semantic-green/8', dot: 'bg-semantic-green', label: 'V' },
        draw: { color: 'text-accent', bg: 'bg-accent/8', dot: 'bg-accent', label: 'T' },
        loss: { color: 'text-semantic-red', bg: 'bg-semantic-red/8', dot: 'bg-semantic-red', label: 'H' },
        upcoming: { color: 'text-text-muted', bg: 'bg-surface-2', dot: 'bg-text-muted', label: '?' },
    }

    // Compute last 5 results per team
    const teamForm = useMemo(() => {
        const map = new Map<string, string[]>()
        for (const m of matches) {
            if (m.status !== 'Played') continue
            const myScoreA = parseInt(m.fs_A)
            const oppScoreA = parseInt(m.fs_B)
            if (isNaN(myScoreA) || isNaN(oppScoreA)) continue

            const aResult = myScoreA > oppScoreA ? 'V' : myScoreA < oppScoreA ? 'H' : 'T'
            const arrA = map.get(m.team_A_id) || []
            arrA.push(aResult)
            map.set(m.team_A_id, arrA)

            const bResult = oppScoreA > myScoreA ? 'V' : oppScoreA < myScoreA ? 'H' : 'T'
            const arrB = map.get(m.team_B_id) || []
            arrB.push(bResult)
            map.set(m.team_B_id, arrB)
        }
        const result = new Map<string, string[]>()
        for (const [id, arr] of map) {
            result.set(id, arr.slice(-5))
        }
        return result
    }, [matches])

    return (
        <div className="bg-surface-1 border border-border-hairline rounded-xl overflow-hidden">
            {selectedTeam && (
                <div className="px-4 py-2.5 bg-surface-3 border-b border-border-hairline flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                        <span className="text-text-primary font-semibold">
                            {teams.find(t => t.team_id === selectedTeam)?.team_name || selectedTeam}
                        </span>
                        <span className="text-text-muted">vastustajat:</span>
                        <span className="flex items-center gap-2">
                            {(['win', 'draw', 'loss', 'upcoming'] as const).map(k => (
                                <span key={k} className="inline-flex items-center gap-1">
                                    <span className={cn('w-2 h-2 rounded-full', resultConfig[k].dot)} />
                                    <span className="text-text-secondary font-mono">{resultConfig[k].label}</span>
                                </span>
                            ))}
                        </span>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onSelectTeam?.(null) }}
                        className="bg-surface-2 border border-border-hairline hover:border-accent/30 text-text-secondary hover:text-text-primary active:scale-[0.97] transition-all rounded-md px-2.5 py-1 text-xs font-semibold cursor-pointer"
                    >
                        Tyhjennä
                    </button>
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-[10px] font-bold uppercase tracking-[0.08em] text-text-muted bg-surface-3">
                        <tr>
                            <th className="px-3 py-3 font-bold">#</th>
                            <th className="px-3 py-3 font-bold">Joukkue</th>
                            <th className="px-2 py-3 font-bold text-center">O</th>
                            <th className="px-2 py-3 font-bold text-center">V</th>
                            <th className="px-2 py-3 font-bold text-center">T</th>
                            <th className="px-2 py-3 font-bold text-center">H</th>
                            <th className="px-3 py-3 font-bold text-center text-text-primary">P</th>
                            {!compact && <th className="px-2 py-3 font-bold text-right">TM</th>}
                            {!compact && <th className="px-2 py-3 font-bold text-right">PM</th>}
                            <th className="px-3 py-3 font-bold text-center text-xs">Kunto</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-hairline">
                        {sorted.map((team) => {
                            const isMatchTeam = teamAId && teamBId && (team.team_id === teamAId || team.team_id === teamBId)
                            const isSelected = team.team_id === selectedTeam
                            const isHovered = hoveredTeam === team.team_id
                            const results = opponentResults.get(team.team_id) || []
                            const primaryResult = results[0]

                            return (
                                <tr
                                    key={team.team_id}
                                    onClick={() => onSelectTeam?.(isSelected ? null : team.team_id)}
                                    onMouseEnter={() => setHoveredTeam(team.team_id)}
                                    onMouseLeave={() => setHoveredTeam(null)}
                                    className={cn(
                                        'cursor-pointer transition-colors relative border-l-2 border-transparent',
                                        isSelected && 'bg-surface-3 ring-1 ring-inset ring-accent/30 border-l-accent',
                                        isHovered && !isSelected && 'bg-surface-2',
                                        !isSelected && !isHovered && primaryResult && resultConfig[primaryResult.result].bg,
                                        !isSelected && !isHovered && !primaryResult && isMatchTeam && 'bg-accent-muted',
                                        !isSelected && !isHovered && !primaryResult && !isMatchTeam && 'hover:bg-surface-2',
                                    )}
                                >
                                    <td className="px-3 py-3 font-bold text-text-muted font-mono text-sm">{team.current_standing}</td>
                                    <td className={cn('px-3 py-3 font-medium text-sm', isMatchTeam && !isSelected ? 'text-accent' : 'text-text-secondary')}>
                                        <div className="flex items-center gap-2">
                                            {isMatchTeam && !isSelected && <span className="w-0.5 h-4 rounded-full bg-gradient-to-b from-bmw-cyan via-bmw-magenta to-bmw-amber shrink-0" />}
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                {primaryResult && (
                                                    <span
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/match/${primaryResult.matchId}`) }}
                                                        className={cn('w-2.5 h-2.5 rounded-full shrink-0 cursor-pointer hover:scale-125 transition-transform', resultConfig[primaryResult.result].dot)}
                                                        title={primaryResult.result === 'upcoming' ? 'Tuleva ottelu' : 'Siirry otteluun'}
                                                    />
                                                )}
                                                <span
                                                    className="truncate hover:text-accent"
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/team/${team.team_id}`) }}
                                                >
                                                    {team.team_name}
                                                </span>
                                            </div>
                                            {primaryResult && (
                                                <span
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/match/${primaryResult.matchId}`) }}
                                                    className={cn('text-xs font-bold shrink-0 cursor-pointer hover:opacity-70 transition-opacity', resultConfig[primaryResult.result].color)}
                                                >
                                                    {resultConfig[primaryResult.result].label}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-2 py-3 text-center text-text-secondary font-mono text-sm">{team.matches_played}</td>
                                    <td className="px-2 py-3 text-center text-text-secondary font-mono text-sm">{team.matches_won}</td>
                                    <td className="px-2 py-3 text-center text-text-secondary font-mono text-sm">{team.matches_tied}</td>
                                    <td className="px-2 py-3 text-center text-text-secondary font-mono text-sm">{team.matches_lost}</td>
                                    <td className="px-3 py-3 text-center font-bold text-text-primary font-mono text-sm">{team.points}</td>
                                    {!compact && <td className="px-2 py-3 text-right text-text-secondary font-mono text-sm">{team.goals_for}</td>}
                                    {!compact && <td className="px-2 py-3 text-right text-text-secondary font-mono text-sm">{team.goals_against}</td>}
                                    <td className="px-3 py-3 text-center">
                                        <div className="flex items-center justify-center gap-0.5">
                                            {(teamForm.get(team.team_id) || []).map((r, i) => (
                                                <span key={i} className={cn('w-2 h-2 rounded-full', r === 'V' ? 'bg-semantic-green' : r === 'H' ? 'bg-semantic-red' : 'bg-accent')} />
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}