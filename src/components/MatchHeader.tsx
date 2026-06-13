import { MatchDetails, GroupDetails, TeamBasic } from '../types/api'
import { motion } from 'framer-motion'
import { Calendar, Clock, Users, Goal } from 'lucide-react'

function LiveBadge() {
    return (
        <motion.div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-semantic-red/10 border border-semantic-red/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <motion.span
                className="w-2 h-2 rounded-full bg-semantic-red"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-semantic-red">LIVE</span>
        </motion.div>
    )
}

export function MatchHeader({ match, group, teamA, teamB }: { match: MatchDetails; group: GroupDetails | null; teamA?: TeamBasic | null; teamB?: TeamBasic | null }) {
    const isLive = !!(match.time && match.time.includes("'"))
    const crestA = teamA?.img_url || teamA?.club_crest
    const crestB = teamB?.img_url || teamB?.club_crest

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-1 rounded-xl overflow-hidden border border-border-hairline"
        >
            <div className="p-6 md:p-8 flex flex-col items-center text-center space-y-6">
                {/* League Info */}
                <div className="flex flex-col items-center space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-md text-accent text-xs font-bold uppercase tracking-widest">
                            {match.competition_name}
                        </div>
                        {isLive && <LiveBadge />}
                    </div>
                    <h2 className="text-text-muted text-sm font-medium">{match.category_name} {group?.group_name && `• ${group.group_name}`}</h2>
                </div>

                {/* Scoreline */}
                <div className="flex items-center justify-center space-x-4 md:space-x-8 w-full">
                    <div className="flex-1 flex flex-col items-end space-y-2">
                        {crestA && <img src={crestA} alt={match.team_A_name} className="w-8 h-8 object-contain mb-1" />}
                        <h3 className="text-xl md:text-3xl font-bold text-text-primary text-right leading-tight">{match.team_A_name}</h3>
                    </div>

                    <div className="flex flex-col items-center shrink-0">
                        <div className="text-4xl md:text-6xl lg:text-7xl font-bold tabular-nums tracking-tighter text-text-primary font-mono leading-none">
                            {match.fs_A ?? '-'} <span className="text-accent opacity-80 mx-1">:</span> {match.fs_B ?? '-'}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col items-start space-y-2">
                        {crestB && <img src={crestB} alt={match.team_B_name} className="w-8 h-8 object-contain mb-1" />}
                        <h3 className="text-xl md:text-3xl font-bold text-text-primary text-left leading-tight">{match.team_B_name}</h3>
                    </div>
                </div>

                {/* Goal Scorers */}
                {match.goals && match.goals.length > 0 && (
                    <div className="w-full max-w-md space-y-2">
                        {[match.team_A_id, match.team_B_id].map((teamId) => {
                            const teamGoals = match.goals!.filter(g => g.team_id === teamId)
                            if (teamGoals.length === 0) return null
                            const teamName = teamId === match.team_A_id ? match.team_A_name : match.team_B_name
                            return (
                                <div key={teamId} className="space-y-1">
                                    <h4 className="text-xs font-bold text-text-primary">{teamName}</h4>
                                    <div className="space-y-0.5">
                                        {teamGoals.map((g, i) => (
                                            <div key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                                                <Goal className="w-3 h-3 text-accent shrink-0" />
                                                <span>{g.player_name}</span>
                                                <span className="text-text-muted text-xs">{g.time}</span>
                                                {g.description === 'rp' && (
                                                    <span className="text-xs text-semantic-amber font-medium">(rp)</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Kickoff */}
                <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-widest">
                        {match.status === 'Played' ? 'Alkamisaika' : 'Ottelu alkaa'}
                    </span>
                    <div className="flex items-center gap-2 text-text-primary">
                        <Calendar className="w-4 h-4 text-accent" />
                        <span className="text-base font-semibold">{match.date}</span>
                        {match.time && !isLive && (
                            <>
                                <Clock className="w-4 h-4 text-accent" />
                                <span className="text-base font-semibold">{match.time}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Bookings */}
                {match.bookings && match.bookings.length > 0 && (
                    <div className="w-full max-w-md space-y-2 pt-2 border-t border-border-hairline">
                        <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest">Kortit</h4>
                        <div className="grid grid-cols-2 gap-4">
                            {[match.team_A_id, match.team_B_id].map((teamId) => {
                                const teamBookings = match.bookings!.filter(b => b.team_id === teamId)
                                if (teamBookings.length === 0) return null
                                const teamName = teamId === match.team_A_id ? match.team_A_name : match.team_B_name
                                return (
                                    <div key={teamId} className="space-y-1">
                                        <h5 className="text-xs font-bold text-text-primary truncate">{teamName}</h5>
                                        <div className="space-y-0.5">
                                            {teamBookings.map((b, i) => (
                                                <div key={i} className="flex items-center gap-1.5 text-xs text-text-secondary">
                                                    <span className={b.code === 'red' ? 'text-semantic-red' : 'text-accent'}>
                                                        {b.code === 'red' ? '🟥' : '🟨'}
                                                    </span>
                                                    <span>{b.player_name}</span>
                                                    {b.time_min && <span className="text-text-muted">{b.time_min}'</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Referee */}
                {match.referee_1_name && (
                    <div className="flex items-center gap-1.5 text-text-muted text-sm">
                        <Users className="w-3.5 h-3.5 text-accent" />
                        Tuomari: {match.referee_1_name}
                    </div>
                )}
            </div>
        </motion.div>
    )
}
