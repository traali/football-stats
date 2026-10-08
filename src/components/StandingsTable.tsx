import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../utils/cn'
import { WLD_CONFIG } from '../utils/wld'
import { byKickoffAsc, matchPhase, outcomeFor } from '../domain/matchState'
import { FormLegend } from './FormLegend'
import type { StandingTeam, MatchSummary } from '../types'
import { formatPpm as ppm, inTasoOrder } from '../utils/standings'


export function StandingsTable({ teams, matches = [], teamAId, teamBId, selectedTeam, onSelectTeam, compact, showPointsPerMatch }: {
    /** Taso ranks by points per match when teams have played unequal numbers of games. */
    showPointsPerMatch?: boolean
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

    const sorted = inTasoOrder(teams)

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
            const phase = matchPhase(m)
            const outcome = outcomeFor(m, activeTeamId)
            let result: 'win' | 'draw' | 'loss' | 'upcoming'
            if (outcome === 'V') result = 'win'
            else if (outcome === 'H') result = 'loss'
            else if (outcome === 'T') result = 'draw'
            else if (phase === 'upcoming' || phase === 'live' || phase === 'awaiting') result = 'upcoming'
            else continue
            const existing = map.get(opponentTeamId) || []
            existing.push({ result, matchId: m.match_id })
            map.set(opponentTeamId, existing)
        }
        return map
    }, [activeTeamId, matches])

    const resultConfig = {
        win: WLD_CONFIG.V,
        draw: WLD_CONFIG.T,
        loss: WLD_CONFIG.H,
        upcoming: { color: 'text-text-muted', bg: 'bg-surface-2', dot: 'bg-text-muted', label: '?' },
    }

    // Compute last 5 results per team
    const teamForm = useMemo(() => {
        const map = new Map<string, string[]>()
        for (const m of [...matches].sort(byKickoffAsc)) {
            for (const id of [m.team_A_id, m.team_B_id]) {
                const r = id ? outcomeFor(m, id) : null
                if (!r) continue
                const arr = map.get(id) || []
                arr.push(r)
                map.set(id, arr)
            }
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
                            <th className="w-10 px-3 py-3 font-bold">#</th>
                            <th className="px-3 py-3 font-bold">Joukkue</th>
                            <th className="w-10 px-2 py-3 font-bold text-center">O</th>
                            <th className="w-10 px-2 py-3 font-bold text-center">V</th>
                            <th className="w-10 px-2 py-3 font-bold text-center">T</th>
                            <th className="w-10 px-2 py-3 font-bold text-center">H</th>
                            <th className="w-12 px-3 py-3 font-bold text-center text-text-primary">P</th>
                            {showPointsPerMatch && <th className="w-14 px-2 py-3 font-bold text-center text-text-primary" title="Pisteitä per ottelu">P/O</th>}
                            {!compact && <th className="w-12 px-2 py-3 font-bold text-right">TM</th>}
                            {!compact && <th className="w-12 px-2 py-3 font-bold text-right">PM</th>}
                            <th className="w-28 px-3 py-3 font-bold text-center text-xs">Kunto</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-hairline">
                        {sorted.map((team) => {
                            const isMatchTeam = Boolean((teamAId && team.team_id === teamAId) || (teamBId && team.team_id === teamBId))
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
                                    <td className="w-10 px-3 py-3 font-bold text-text-muted font-mono text-sm">{team.current_standing}</td>
                                    <td className={cn('max-w-0 w-full px-3 py-3 font-medium text-sm', isMatchTeam && !isSelected ? 'text-accent' : 'text-text-secondary')}>
                                        <div className="flex items-center gap-2">
                                            {isMatchTeam && !isSelected && <span className="w-0.5 h-4 rounded-full bg-gradient-to-b from-bmw-cyan via-bmw-magenta to-bmw-amber shrink-0" />}
                                            <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
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
                                    <td className="w-10 px-2 py-3 text-center text-text-secondary font-mono text-sm">{team.matches_played}</td>
                                    <td className="w-10 px-2 py-3 text-center text-text-secondary font-mono text-sm">{team.matches_won}</td>
                                    <td className="w-10 px-2 py-3 text-center text-text-secondary font-mono text-sm">{team.matches_tied}</td>
                                    <td className="w-10 px-2 py-3 text-center text-text-secondary font-mono text-sm">{team.matches_lost}</td>
                                    <td className="w-12 px-3 py-3 text-center font-bold text-text-primary font-mono text-sm">{team.points}</td>
                                    {showPointsPerMatch && <td className="w-14 px-2 py-3 text-center font-bold text-text-primary font-mono text-sm">{ppm(team.points_per_match)}</td>}
                                    {!compact && <td className="w-12 px-2 py-3 text-right text-text-secondary font-mono text-sm">{team.goals_for}</td>}
                                    {!compact && <td className="w-12 px-2 py-3 text-right text-text-secondary font-mono text-sm">{team.goals_against}</td>}
                                    <td className="w-28 px-3 py-3 text-center">
                                        <div className="flex items-center justify-center gap-0.5">
                                            {(teamForm.get(team.team_id) || []).map((r, i) => (
                                                <span key={`${team.team_id}-form-${i}`} title={r === 'V' ? 'Voitto' : r === 'H' ? 'Häviö' : 'Tasapeli'} className={cn('w-2 h-2 rounded-full', r === 'V' ? 'bg-semantic-green' : r === 'H' ? 'bg-semantic-red' : 'bg-accent')} />
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            <div className="px-4 py-2.5 border-t border-border-hairline space-y-1 text-[11px] text-text-muted">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-semibold">Kunto (5 viimeisintä, uusin oikealla):</span>
                    <FormLegend />
                </div>
                {showPointsPerMatch && (
                    <p>Järjestys on Tulospalvelun: joukkueilla on eri määrä pelejä, joten sijoitus ratkeaa pisteistä per ottelu (P/O).</p>
                )}
            </div>
        </div>
    )
}