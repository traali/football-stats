import { GroupDetails } from '../types/api'
import { motion } from 'framer-motion'

export function StandingsTable({ group, teamAId, teamBId }: { group: GroupDetails; teamAId: string; teamBId: string }) {
    const sortedTeams = [...group.teams].sort((a, b) => (parseInt(a.current_standing) || 999) - (parseInt(b.current_standing) || 999))

    return (
        <div className="bg-surface-1 border border-border-hairline rounded-xl overflow-hidden">
            <div className="p-5 border-b border-border-hairline bg-surface-2">
                <h3 className="text-lg font-bold text-text-primary">Sarjataulukko</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-[10px] uppercase tracking-widest text-text-muted bg-surface-3">
                        <tr>
                            <th className="px-5 py-3 font-bold">#</th>
                            <th className="px-5 py-3 font-bold">Joukkue</th>
                            <th className="px-3 py-3 font-bold text-center">O</th>
                            <th className="px-3 py-3 font-bold text-center">V</th>
                            <th className="px-3 py-3 font-bold text-center">T</th>
                            <th className="px-3 py-3 font-bold text-center">H</th>
                            <th className="px-3 py-3 font-medium text-center font-bold text-text-primary">P</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-hairline">
                        {sortedTeams.map((team) => {
                            const isMatchTeam = team.team_id === teamAId || team.team_id === teamBId
                            return (
                                <motion.tr
                                    key={team.team_id}
                                    className={isMatchTeam ? "bg-accent-muted" : "hover:bg-surface-2"}
                                >
                                    <td className="px-5 py-3 font-bold text-text-muted font-mono">{team.current_standing}</td>
                                    <td className={`px-5 py-3 font-medium ${isMatchTeam ? 'text-accent' : 'text-text-secondary'}`}>
                                        {isMatchTeam ? (
                                            <span className="flex items-center gap-2">
                                                <span className="w-0.5 h-4 rounded-full bg-gradient-to-b from-bmw-cyan via-bmw-magenta to-bmw-amber shrink-0" />
                                                {team.team_name}
                                            </span>
                                        ) : team.team_name}
                                    </td>
                                    <td className="px-3 py-3 text-center text-text-secondary font-mono">{team.matches_played}</td>
                                    <td className="px-3 py-3 text-center text-text-secondary font-mono">{team.matches_won}</td>
                                    <td className="px-3 py-3 text-center text-text-secondary font-mono">{team.matches_tied}</td>
                                    <td className="px-3 py-3 text-center text-text-secondary font-mono">{team.matches_lost}</td>
                                    <td className="px-3 py-3 text-center font-bold text-text-primary font-mono">{team.points}</td>
                                </motion.tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
