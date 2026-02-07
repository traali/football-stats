import { MatchDetails, GroupDetails } from '../types/api'
import { motion } from 'framer-motion'
import { Calendar, Users } from 'lucide-react'

export function MatchHeader({ match, group }: { match: MatchDetails; group: GroupDetails | null }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-dark rounded-3xl overflow-hidden border border-white/10"
        >
            <div className="p-8 md:p-12 flex flex-col items-center text-center space-y-8">
                {/* League Info */}
                <div className="flex flex-col items-center space-y-2">
                    <div className="px-4 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-bold uppercase tracking-widest">
                        {match.competition_name}
                    </div>
                    <h2 className="text-gray-400 text-sm font-medium">{match.category_name} {group?.group_name && `• ${group.group_name}`}</h2>
                </div>

                {/* Scoreline */}
                <div className="flex items-center justify-center space-x-6 md:space-x-12 w-full">
                    <div className="flex-1 flex flex-col items-end space-y-4">
                        <h3 className="text-2xl md:text-4xl font-black text-white text-right">{match.team_A_name}</h3>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="text-5xl md:text-7xl font-black tabular-nums tracking-tighter text-white">
                            {match.fs_A ?? '-'} <span className="text-blue-500 opacity-50">:</span> {match.fs_B ?? '-'}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col items-start space-y-4">
                        <h3 className="text-2xl md:text-4xl font-black text-white text-left">{match.team_B_name}</h3>
                    </div>
                </div>

                {/* Match Meta */}
                <div className="flex flex-wrap items-center justify-center gap-6 text-gray-400 text-sm">
                    <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                        {match.date} {match.time && `• ${match.time}`}
                    </div>
                    {match.referee_1_name && (
                        <div className="flex items-center">
                            <Users className="w-4 h-4 mr-2 text-blue-500" />
                            Tuomari: {match.referee_1_name}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
