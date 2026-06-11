import { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { PlayerStats } from '../types/api'
import { User, Shield, AlertTriangle, Target, Activity, Calendar } from 'lucide-react'
import { cn } from '../utils/cn'
import { StatBadge } from './StatBadge'

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
}

export function PlayerCard({ stats }: { stats: PlayerStats }) {
    const [imgError, setImgError] = useState(false);
    const hasHistory = stats.pastMatchesDetails && stats.pastMatchesDetails.length > 0;

    return (
        <motion.div
            variants={cardVariants}
            className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-5"
        >
            {/* Player Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        {!imgError && stats.img_url ? (
                            <img
                                src={stats.img_url}
                                alt={stats.name}
                                className="w-16 h-16 rounded-xl object-cover border border-border-hairline"
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-xl bg-surface-2 border border-border-hairline flex items-center justify-center">
                                <User className="w-8 h-8 text-text-muted" aria-label="Player avatar placeholder" />
                            </div>
                        )}
                        {stats.isCaptainInMatch && (
                            <div className="absolute -top-2 -right-2 bg-accent text-text-inverse text-xs font-bold px-1.5 py-0.5 rounded-md border-2 border-canvas">
                                C
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-text-primary flex items-center">
                            {stats.name}
                            {stats.shirtNumber !== "N/A" && (
                                <span className="ml-2 text-accent text-sm font-mono font-medium">#{stats.shirtNumber}</span>
                            )}
                        </h3>
                        <p className="text-text-secondary text-sm">{stats.birthYear} • {stats.position_fi || 'Pelaaja'}</p>
                    </div>
                </div>
            </div>

            {/* Primary Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatBadge label="Ottelut" value={stats.gamesPlayedThisYear} icon={<Shield />} />
                <StatBadge label="Maalit" value={stats.goalsThisYear} icon={<Target />} variant="success" />
                <StatBadge label="Varoitukset" value={stats.warningsThisYear} icon={<AlertTriangle />} variant="warning" />
                <StatBadge label={`Kausi ${new Date().getFullYear() - 1}`} value={`${stats.gamesPlayedLastSeason} (${stats.goalsScoredLastSeason})`} icon={<Calendar />} />
            </div>

            {/* Teams This Year */}
            {stats.gamesPlayedThisYear > 0 && (
                <div className="pt-3 border-t border-border-hairline space-y-2">
                    <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest">Joukkueet tänä vuonna</h4>
                    <div className="space-y-1.5">
                        {Object.entries(stats.gamesByTeamThisYear).map(([team, games]) => {
                            const goals = stats.goalsByTeamThisYear[team] || 0
                            const warnings = stats.warningsByTeamThisYear[team] || 0
                            return (
                                <div key={team} className="flex items-center justify-between text-sm">
                                    <span className="text-text-primary font-medium truncate mr-2">{team}</span>
                                    <span className="text-text-secondary shrink-0">
                                        {games} ott. / {goals} maalia{warnings > 0 ? ` / ${warnings} var.` : ''}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Last Matches */}
            {hasHistory && (
                <div className="space-y-3 pt-4 border-t border-border-hairline">
                    <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center">
                        <Activity className="w-3 h-3 mr-2" /> Viimeisimmät ottelut
                    </h4>
                    <div className="space-y-1.5">
                        {stats.pastMatchesDetails.slice(0, 8).map((m, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                                <span className={cn(
                                    "w-2 h-2 rounded-full shrink-0",
                                    m.resultIndicator === 'win' ? "bg-semantic-green" :
                                        m.resultIndicator === 'loss' ? "bg-semantic-red" :
                                            m.resultIndicator === 'fixture' ? "bg-semantic-gray" : "bg-semantic-amber"
                                )} />
                                <span className="text-text-muted text-xs shrink-0">{m.date?.slice(5)}</span>
                                <span className="text-text-primary font-medium truncate">{m.playerTeamNameInPastMatch}</span>
                                <span className="text-text-secondary shrink-0">vs</span>
                                <span className="text-text-secondary truncate">{m.opponentName}</span>
                                {m.playerTeamScore !== undefined && (
                                    <span className="text-text-primary font-mono text-xs shrink-0">
                                        {m.playerTeamScore}-{m.opponentScore}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    )
}


