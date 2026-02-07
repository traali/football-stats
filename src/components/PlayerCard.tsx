import { motion } from 'framer-motion'
import { PlayerStats } from '../types/api'
import { User, Shield, AlertTriangle, Target, Activity, Calendar } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { clsx, type ClassValue } from 'clsx'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function PlayerCard({ stats }: { stats: PlayerStats }) {
    const hasHistory = stats.pastMatchesDetails && stats.pastMatchesDetails.length > 0;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 space-y-6"
        >
            {/* Player Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        {stats.img_url ? (
                            <img
                                src={stats.img_url}
                                alt={stats.name}
                                className="w-16 h-16 rounded-2xl object-cover border border-white/10"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <User className="w-8 h-8 text-gray-500" />
                            </div>
                        )}
                        {stats.isCaptainInMatch && (
                            <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-brand-black">
                                C
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center">
                            {stats.name}
                            {stats.shirtNumber !== "N/A" && (
                                <span className="ml-2 text-blue-400 text-sm font-medium">#{stats.shirtNumber}</span>
                            )}
                        </h3>
                        <p className="text-gray-400 text-sm">{stats.birthYear} • {stats.position_fi || 'Pelaaja'}</p>
                    </div>
                </div>
            </div>

            {/* Primary Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatItem label="Ottelut" value={stats.gamesPlayedThisYear} icon={Shield} />
                <StatItem label="Maalit" value={stats.goalsThisYear} icon={Target} variant="primary" />
                <StatItem label="Varoitukset" value={stats.warningsThisYear} icon={AlertTriangle} variant="warning" />
                <StatItem label="Kausi 2024" value={`${stats.gamesPlayedLastSeason} (${stats.goalsScoredLastSeason})`} icon={Calendar} />
            </div>

            {/* Form / Last Matches */}
            {hasHistory && (
                <div className="space-y-3 pt-4 border-t border-white/5">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center">
                        <Activity className="w-3 h-3 mr-2" /> Viimeisimmät ottelut
                    </h4>
                    <div className="flex gap-2">
                        {stats.pastMatchesDetails.slice(0, 8).map((match, i) => (
                            <div
                                key={i}
                                title={`${match.date}: vs ${match.opponentName} (${match.playerTeamScore}-${match.opponentScore})`}
                                className={cn(
                                    "w-2.5 h-2.5 rounded-full shrink-0",
                                    match.resultIndicator === 'win' ? "bg-green-500" :
                                        match.resultIndicator === 'loss' ? "bg-red-500" :
                                            match.resultIndicator === 'fixture' ? "bg-gray-700" : "bg-yellow-500"
                                )}
                            />
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    )
}

function StatItem({ label, value, icon: Icon, variant = 'default' }: any) {
    const variants = {
        default: "text-blue-400 bg-blue-400/5 border-blue-400/10",
        primary: "text-emerald-400 bg-emerald-400/5 border-emerald-400/10",
        warning: "text-yellow-400 bg-yellow-400/5 border-yellow-400/10",
        danger: "text-red-400 bg-red-400/5 border-red-400/10"
    }

    return (
        <div className={cn("p-3 rounded-xl border flex flex-col items-center justify-center text-center", variants[variant as keyof typeof variants])}>
            <Icon className="w-4 h-4 mb-1 opacity-60" />
            <div className="text-lg font-bold text-white leading-none">{value}</div>
            <div className="text-[10px] uppercase tracking-tighter opacity-70 mt-1">{label}</div>
        </div>
    )
}
