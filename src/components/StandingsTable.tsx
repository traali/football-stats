import { useMemo, useState, Fragment } from 'react'
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

    const opponentResults = useMemo(() => {
        type Result = { result: 'win' | 'draw' | 'loss' | 'upcoming'; matchId: string }
        const map = new Map<string, Result[]>()
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
            existing.push({ result, matchId: m.match_id })
            map.set(opponentTeamId, existing)
        }
        return map
    }, [selectedTeam, matches])

    const resultConfig = {
        win: { color: 'text-semantic-green', bg: 'bg-semantic-green/8', dot: 'bg-semantic-green', label: 'V' },
        draw: { color: 'text-accent', bg: 'bg-accent/8', dot: 'bg-accent', label: 'T' },
        loss: { color: 'text-semantic-red', bg: 'bg-semantic-red/8', dot: 'bg-semantic-red', label: 'H' },
        upcoming: { color: 'text-text-muted', bg: 'bg-surface-2', dot: 'bg-text-muted', label: '?' },
    }

    const getTeamPlayedMatches = (teamId: string) => {
        const past: Array<{
            opponentName: string
            matchId: string
            result: 'win' | 'draw' | 'loss'
        }> = []

        for (const m of matches) {
            if (m.team_A_id !== teamId && m.team_B_id !== teamId) continue
            if (m.status !== 'Played') continue

            const isA = m.team_A_id === teamId
            const opponentName = isA ? m.team_B_name : m.team_A_name
            const myScore = parseInt(isA ? m.fs_A : m.fs_B)
            const oppScore = parseInt(isA ? m.fs_B : m.fs_A)

            if (!isNaN(myScore) && !isNaN(oppScore)) {
                past.push({
                    opponentName,
                    matchId: m.match_id,
                    result: myScore > oppScore ? 'win' : myScore < oppScore ? 'loss' : 'draw',
                })
            }
        }
        return past
    }

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
                            {(['win', 'draw', 'loss', 'upcoming'] as const).map(k => (
                                <span key={k} className="inline-flex items-center gap-0.5">
                                    <span className={cn('w-2 h-2 rounded-full', resultConfig[k].dot)} />
                                    {' '}{resultConfig[k].label}
                                </span>
                            ))}
                        </span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onSelectTeam?.(null) }} className="text-text-muted hover:text-text-primary transition-colors px-2 py-1">
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
                            const isHovered = hoveredTeam === team.team_id
                            const isExpanded = isHovered || isSelected
                            const results = opponentResults.get(team.team_id) || []
                            const primaryResult = results[0]

                            const playedMatches = getTeamPlayedMatches(team.team_id)

                            return (
                                <Fragment key={team.team_id}>
                                    <tr
                                        onClick={() => onSelectTeam?.(isSelected ? null : team.team_id)}
                                        onMouseEnter={() => setHoveredTeam(team.team_id)}
                                        onMouseLeave={() => setHoveredTeam(null)}
                                        className={cn(
                                            'cursor-pointer transition-colors relative',
                                            isSelected && 'bg-surface-3 ring-1 ring-inset ring-accent/30',
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
                                    </tr>

                                    {isExpanded && playedMatches.length > 0 && (
                                        <tr
                                            onMouseEnter={() => setHoveredTeam(team.team_id)}
                                            onMouseLeave={() => setHoveredTeam(null)}
                                            className={cn(
                                                '!border-t-0 transition-colors',
                                                isSelected ? 'bg-surface-3/60' : 'bg-surface-2/60'
                                            )}
                                        >
                                            <td colSpan={compact ? 7 : 9} className="px-4 py-3 border-b border-border-hairline">
                                                <div className="space-y-2">
                                                    <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                                                        Pelatut
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {playedMatches.map((m, idx) => {
                                                            const badgeColor = m.result === 'win'
                                                                ? 'text-semantic-green bg-semantic-green/10 border-semantic-green/20 hover:bg-semantic-green/20'
                                                                : m.result === 'loss'
                                                                ? 'text-semantic-red bg-semantic-red/10 border-semantic-red/20 hover:bg-semantic-red/20'
                                                                : 'text-accent bg-accent-muted border-accent/20 hover:bg-accent-glow';
                                                            const label = m.result === 'win' ? 'V' : m.result === 'loss' ? 'H' : 'T';

                                                            return (
                                                                <button
                                                                    key={m.matchId + '-' + idx}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        navigate(`/match/${m.matchId}`);
                                                                    }}
                                                                    className={cn(
                                                                        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer",
                                                                        badgeColor,
                                                                        "focus-visible:ring-2 focus-visible:outline-none ring-accent/50"
                                                                    )}
                                                                >
                                                                    <span className="truncate max-w-[120px] sm:max-w-[160px]">{m.opponentName}</span>
                                                                    <span className="font-bold shrink-0">{label}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}