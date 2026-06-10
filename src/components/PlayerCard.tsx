import { motion, type Variants } from 'framer-motion'
import { PlayerStats } from '../types/api'
import { User, Shield, AlertTriangle, Target, Activity, Calendar } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { clsx, type ClassValue } from 'clsx'
import { StatBadge } from './StatBadge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
}

export function PlayerCard({ stats }: { stats: PlayerStats }) {
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
                        {stats.img_url ? (
                            <img
                                src={stats.img_url}
                                alt={stats.name}
                                className="w-16 h-16 rounded-xl object-cover border border-border-hairline"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-xl bg-surface-2 border border-border-hairline flex items-center justify-center">
                                <User className="w-8 h-8 text-text-muted" aria-label="Player avatar placeholder" />
                            </div>
                        )}
                        {stats.isCaptainInMatch && (
                            <div className="absolute -top-2 -right-2 bg-accent text-text-inverse text-[10px] font-bold px-1.5 py-0.5 rounded-md border-2 border-canvas">
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

            {/* Form / Last Matches */}
            {hasHistory && (
                <div className="space-y-3 pt-4 border-t border-border-hairline">
                    <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center">
                        <Activity className="w-3 h-3 mr-2" /> Viimeisimmät ottelut
                    </h4>
                    <div className="flex gap-2">
                        {stats.pastMatchesDetails.slice(0, 8).map((match, i) => (
                            <div
                                key={i}
                                role="button"
                                tabIndex={0}
                                title={`${match.date}: vs ${match.opponentName} (${match.playerTeamScore}-${match.opponentScore})`}
                                className={cn(
                                    "w-2.5 h-2.5 rounded-full shrink-0 min-w-[10px] min-h-[10px]",
                                    match.resultIndicator === 'win' ? "bg-semantic-green" :
                                        match.resultIndicator === 'loss' ? "bg-semantic-red" :
                                            match.resultIndicator === 'fixture' ? "bg-semantic-gray" : "bg-semantic-amber"
                                )}
                            />
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    )
}


