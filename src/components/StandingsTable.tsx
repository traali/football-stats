import { useMemo } from 'react'
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

    const sorted = [...teams].sort((a, b) => (parseInt(a.current_standing) || 999) - (parseInt(b.current_standing) || 999))

    const opponentResults = useMemo(() => {
        const map = new Map<string, { result: 'win' | 'draw' | 'loss' | 'upcoming'; opponentTeamId: string }[]>()
        if (!selectedTeam || matches.length === 0) return map
        for (const m of matches) {
            if (m.team_A_id !== selectedTeam && m.team_B_id !== selectedTeam) continue
            const isA = m.team_A_id === selectedTeam
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
            existing.push({ result, opponentTeamId })
            map.set(opponentTeamId, existing)
        }
        return map
    }, [selectedTeam, matches])

    const resultColor = { win: 'text-semantic-green', draw: 'text-accent', loss: 'text-semantic-red', upcoming: 'text-text-muted' }
    const resultBg = { win: 'bg-semantic-green/8', draw: 'bg-accent/8', loss: 'bg-semantic-red/8', upcoming: 'bg-surface-2' }
    const resultLabel = { win: 'V', draw: 'T', loss: 'H', upcoming: '?' }

    return (
        <div className="bg-surface-1 border border-border-hairline rounded-xl overflow-hidden">
            {selectedTeam && (
                <div className="px-4 py-2 bg-surface-3 border-b border-border-hairline flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                        <span className="text-text-primary font-medium">
                            {teams.find(t => t.team_id === selectedTeam)?.team_name || selectedTeam}
                        </span>
                        <span className="text-text-muted">vastustajat:</span>
                        <span className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-semantic-green" /> V</span>
                            <span className="inline-flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-accent" /> T</span>
                            <span className="inline-flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-semantic-red" /> H</span>
                            <span className="inline-flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-text-muted" /> ?</span>
                        </span>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onSelectTeam?.(null) }}
                        className="text-text-muted hover:text-text-primary transition-colors px-2 py-1"
                    >
                        Tyhjennä
                    </button>
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase tracking-widest text-text-muted bg-surface-3">
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
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-hairline">
                        {sorted.map((team) => {
                            const isMatchTeam = teamAId && teamBId && (team.team_id === teamAId || team.team_id === teamBId)
                            const isSelected = team.team_id === selectedTeam
                            const results = opponentResults.get(team.team_id) || []
                            const primaryResult = results[0]?.result

                            return (
                                <tr
                                    key={team.team_id}
                                    onClick={() => onSelectTeam?.(isSelected ? null : team.team_id)}
                                    className={cn(
                                        'cursor-pointer transition-colors',
                                        isSelected && 'bg-surface-3 ring-1 ring-inset ring-accent/30',
                                        !isSelected && primaryResult && resultBg[primaryResult],
                                        !isSelected && !primaryResult && isMatchTeam && 'bg-accent-muted',
                                        !isSelected && !primaryResult && !isMatchTeam && 'hover:bg-surface-2',
                                    )}
                                >
                                    <td className="px-3 py-3 font-bold text-text-muted font-mono text-sm">{team.current_standing}</td>
                                    <td className={cn('px-3 py-3 font-medium text-sm', isMatchTeam && !isSelected ? 'text-accent' : 'text-text-secondary')}>
                                        <div className="flex items-center gap-2">
                                            {isMatchTeam && !isSelected && <span className="w-0.5 h-4 rounded-full bg-gradient-to-b from-bmw-cyan via-bmw-magenta to-bmw-amber shrink-0" />}
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                {primaryResult && (
                                                    <span className={cn('w-2 h-2 rounded-full shrink-0', resultColor[primaryResult].replace('text-', 'bg-'))} />
                                                )}
                                                <span
                                                    className="truncate hover:text-accent"
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/team/${team.team_id}`) }}
                                                >
                                                    {team.team_name}
                                                </span>
                                            </div>
                                            {primaryResult && results.length > 0 && (
                                                <span className={cn('text-xs font-bold shrink-0', resultColor[primaryResult])}>
                                                    {resultLabel[primaryResult]}
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
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}