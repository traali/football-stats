import { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { PlayerStats } from '../types'
import { User, Shield, AlertTriangle, Target, Calendar } from 'lucide-react'
import { StatBadge } from './StatBadge'
import { EligibilityChip } from './EligibilityChip'
import type { PlayerEligibilityResult } from '../domain/eligibility'

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
}

export function PlayerCard({ stats, eligibility }: { stats: PlayerStats; eligibility?: PlayerEligibilityResult }) {
    const [imgError, setImgError] = useState(false)

    return (
        <motion.div
            variants={cardVariants}
            className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-5"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-4 min-w-0">
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
                    <div className="min-w-0">
                        <h3 className="text-xl font-bold text-text-primary flex items-center flex-wrap gap-2">
                            {stats.name}
                            {stats.shirtNumber !== 'N/A' && (
                                <span className="text-accent text-sm font-mono font-medium">#{stats.shirtNumber}</span>
                            )}
                            <EligibilityChip result={eligibility} />
                        </h3>
                        <p className="text-text-secondary text-sm">{stats.birthYear} • {stats.position_fi || 'Pelaaja'}</p>
                        {eligibility?.countsTowardDownQuota && eligibility.lastOfficialHigher && (
                            <p className="text-[11px] text-text-muted mt-1">
                                Viimeisin ylempi: {eligibility.lastOfficialHigher.level} {eligibility.lastOfficialHigher.date}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {(stats.gamesPlayedThisYear > 0 || stats.goalsThisYear > 0) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatBadge label="Ottelut" value={stats.gamesPlayedThisYear} icon={<Shield />} />
                    <StatBadge label="Maalit" value={stats.goalsThisYear} icon={<Target />} variant="success" />
                    <StatBadge label="Varoitukset" value={stats.warningsThisYear} icon={<AlertTriangle />} variant="warning" />
                    <StatBadge label={`Kausi ${new Date().getFullYear() - 1}`} value={`${stats.gamesPlayedLastSeason} (${stats.goalsScoredLastSeason})`} icon={<Calendar />} />
                </div>
            )}
        </motion.div>
    )
}
