import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { StandingTeam, MatchSummary } from '../types/api'

export function StandingsTable({ teams, matches = [], teamAId, teamBId, compact }: {
    teams: StandingTeam[]
    matches?: MatchSummary[]
    teamAId?: string
    teamBId?: string
    compact?: boolean
}) {
    const navigate = useNavigate()
    const [hoveredTeam, setHoveredTeam] = useState<string | null>(null)

    const sorted = [...teams].sort((a, b) => (parseInt(a.current_standing) || 999) - (parseInt(b.current_standing) || 999))

    return (
        <div className="bg-surface-1 border border-border-hairline rounded-xl relative">
            <div className="overflow-x-auto rounded-xl">
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
                            return (
                                <tr
                                    key={team.team_id}
                                    onClick={() => navigate(`/team/${team.team_id}`)}
                                    onMouseEnter={() => setHoveredTeam(team.team_id)}
                                    onMouseLeave={() => setHoveredTeam(null)}
                                    className={`cursor-pointer transition-colors relative ${isMatchTeam ? "bg-accent-muted" : "hover:bg-surface-2"}`}
                                >
                                    <td className="px-3 py-3 font-bold text-text-muted font-mono text-sm">{team.current_standing}</td>
                                    <td className={`px-3 py-3 font-medium text-sm ${isMatchTeam ? 'text-accent' : 'text-text-secondary'}`}>
                                        <div className="flex items-center gap-2">
                                            {isMatchTeam && <span className="w-0.5 h-4 rounded-full bg-gradient-to-b from-bmw-cyan via-bmw-magenta to-bmw-amber shrink-0" />}
                                            <span className="truncate">{team.team_name}</span>
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

            {/* Hover popup — overlay */}
            {hoveredTeam && matches.length > 0 && (
                <div className="absolute inset-x-0 top-[48px] z-50 px-2">
                    <OpponentPopup
                        teamId={hoveredTeam}
                        matches={matches}
                        teams={sorted}
                        onClose={() => setHoveredTeam(null)}
                    />
                </div>
            )}
        </div>
    )
}

function OpponentPopup({ teamId, matches, teams, onClose }: {
    teamId: string
    matches: MatchSummary[]
    teams: StandingTeam[]
    onClose: () => void
}) {
    const navigate = useNavigate()
    const past: Array<{ opponent: string; opponentId: string; result: 'win' | 'draw' | 'loss' }> = []
    const upcoming: Array<{ opponent: string; opponentId: string }> = []

    for (const m of matches) {
        if (m.team_A_id !== teamId && m.team_B_id !== teamId) continue
        const isA = m.team_A_id === teamId
        const opponent = isA ? m.team_B_name : m.team_A_name
        const opponentId = isA ? m.team_B_id : m.team_A_id
        const myScore = parseInt(isA ? m.fs_A : m.fs_B)
        const oppScore = parseInt(isA ? m.fs_B : m.fs_A)
        if (m.status === 'Played' && !isNaN(myScore) && !isNaN(oppScore)) {
            past.push({ opponent, opponentId, result: myScore > oppScore ? 'win' : myScore < oppScore ? 'loss' : 'draw' })
        } else if (m.status === 'Fixture') {
            upcoming.push({ opponent, opponentId })
        }
    }

    const team = teams.find(t => t.team_id === teamId)

    const resultColor = { win: 'text-semantic-green', draw: 'text-accent', loss: 'text-semantic-red' }
    const resultBg = { win: 'bg-semantic-green/10', draw: 'bg-accent/10', loss: 'bg-semantic-red/10' }
    const resultLabel = { win: 'V', draw: 'T', loss: 'H' }

    return (
        <div
            className="bg-surface-3 border border-border-hairline rounded-xl p-4 shadow-xl mx-2 mb-2 space-y-3 max-h-64 overflow-y-auto"
            onMouseEnter={() => {}} /* keep open when hovering popup */
            onMouseLeave={onClose}
            onClick={onClose}
        >
            {team && (
                <p className="text-sm font-bold text-text-primary truncate">{team.team_name}</p>
            )}

            {past.length > 0 && (
                <div>
                    <p className="text-xs uppercase tracking-wider text-text-muted mb-2">Pelatut</p>
                    <div className="flex flex-wrap gap-1.5">
                        {past.map((p, i) => (
                            <span
                                key={p.opponentId + i}
                                onClick={(e) => { e.stopPropagation(); navigate(`/team/${p.opponentId}`) }}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${resultColor[p.result]} ${resultBg[p.result]}`}
                            >
                                {p.opponent}
                                <span className="font-bold">{resultLabel[p.result]}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {upcoming.length > 0 && (
                <div>
                    <p className="text-xs uppercase tracking-wider text-text-muted mb-2">Tulevat</p>
                    <div className="flex flex-wrap gap-1.5">
                        {upcoming.map((p, i) => (
                            <span
                                key={p.opponentId + i}
                                onClick={(e) => { e.stopPropagation(); navigate(`/team/${p.opponentId}`) }}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity text-text-muted bg-surface-2"
                            >
                                {p.opponent}
                                <span className="text-xs">?</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {past.length === 0 && upcoming.length === 0 && (
                <p className="text-text-muted text-xs">Ei ottelutietoja</p>
            )}
        </div>
    )
}