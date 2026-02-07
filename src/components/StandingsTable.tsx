import { GroupDetails } from '../types/api'
import { motion } from 'framer-motion'

export function StandingsTable({ group, teamAId, teamBId }: { group: GroupDetails; teamAId: string; teamBId: string }) {
    const sortedTeams = [...group.teams].sort((a, b) => (parseInt(a.current_standing) || 999) - (parseInt(b.current_standing) || 999))

    return (
        <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-white/5 bg-white/5">
                <h3 className="text-lg font-bold text-white">Sarjataulukko</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-[10px] uppercase tracking-widest text-gray-500 bg-brand-black/50">
                        <tr>
                            <th className="px-6 py-4 font-medium">#</th>
                            <th className="px-6 py-4 font-medium">Joukkue</th>
                            <th className="px-4 py-4 font-medium text-center">O</th>
                            <th className="px-4 py-4 font-medium text-center">V</th>
                            <th className="px-4 py-4 font-medium text-center">T</th>
                            <th className="px-4 py-4 font-medium text-center">H</th>
                            <th className="px-4 py-4 font-medium text-center font-bold text-white">P</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {sortedTeams.map((team) => {
                            const isMatchTeam = team.team_id === teamAId || team.team_id === teamBId
                            return (
                                <motion.tr
                                    key={team.team_id}
                                    className={isMatchTeam ? "bg-blue-600/10" : "hover:bg-white/5"}
                                >
                                    <td className="px-6 py-4 font-bold text-gray-500">{team.current_standing}</td>
                                    <td className={`px-6 py-4 font-medium ${isMatchTeam ? 'text-blue-400' : 'text-gray-300'}`}>
                                        {team.team_name}
                                    </td>
                                    <td className="px-4 py-4 text-center text-gray-400">{team.matches_played}</td>
                                    <td className="px-4 py-4 text-center text-gray-400">{team.matches_won}</td>
                                    <td className="px-4 py-4 text-center text-gray-400">{team.matches_tied}</td>
                                    <td className="px-4 py-4 text-center text-gray-400">{team.matches_lost}</td>
                                    <td className="px-4 py-4 text-center font-bold text-white">{team.points}</td>
                                </motion.tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
