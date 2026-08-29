import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import { PlayerStats } from '../types'
import { User, Shield, AlertTriangle, Target } from 'lucide-react'
import { StatBadge } from './StatBadge'
import { EligibilityChip } from './EligibilityChip'
import type { PlayerEligibilityResult } from '../domain/eligibility'

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
}

const LEVEL_FI: Record<string, string> = {
    liiga: 'Liiga',
    ykkonen: 'Ykkönen',
    kakkonen: 'Kakkonen',
    kolmonen: 'Kolmonen',
    nelonen: 'Nelonen',
    vitonen: 'Vitonen',
    harraste: 'Harraste',
}

export function PlayerCard({ stats, eligibility }: { stats: PlayerStats; eligibility?: PlayerEligibilityResult }) {
    const [imgError, setImgError] = useState(false)
    const series = stats.seriesThisYear || []
    const showTotals = stats.gamesPlayedThisYear > 0 || stats.goalsThisYear > 0 || stats.warningsThisYear > 0 || (stats.goalsInMatch || 0) > 0
    const lastHigher = eligibility?.lastOfficialHigher

    const inner = (
        <motion.div variants={cardVariants} className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-4 hover:border-accent/30">
            <div className="flex items-center space-x-4 min-w-0">
                <div className="relative shrink-0">
                    {!imgError && stats.img_url ? (
                        <img src={stats.img_url} alt={stats.name} className="w-16 h-16 rounded-xl object-cover border border-border-hairline" onError={() => setImgError(true)} />
                    ) : (
                        <div className="w-16 h-16 rounded-xl bg-surface-2 border border-border-hairline flex items-center justify-center">
                            <User className="w-8 h-8 text-text-muted" />
                        </div>
                    )}
                    {stats.isCaptainInMatch && (
                        <div className="absolute -top-2 -right-2 bg-accent text-text-inverse text-xs font-bold px-1.5 py-0.5 rounded-md border-2 border-canvas">C</div>
                    )}
                </div>
                <div className="min-w-0">
                    <h3 className="text-xl font-bold text-text-primary flex items-center flex-wrap gap-2">
                        {stats.name}
                        {stats.shirtNumber !== 'N/A' && <span className="text-accent text-sm font-mono font-medium">#{stats.shirtNumber}</span>}
                        <EligibilityChip result={eligibility} />
                    </h3>
                    {(stats.currentTeamName || stats.teamsThisYear) && (
                        <p className="text-text-primary text-sm mt-0.5">
                            {stats.currentTeamName}{stats.currentTeamName && stats.teamsThisYear ? ' · ' : ''}{stats.teamsThisYear}
                        </p>
                    )}
                    <p className="text-text-secondary text-sm">{[stats.birthYear, stats.position_fi || 'Pelaaja'].filter(Boolean).join(' · ')}</p>
                    {lastHigher && (
                        <p className="text-[11px] text-semantic-amber font-semibold mt-1.5">
                            Edellinen peli ylempänä: {LEVEL_FI[lastHigher.level] || lastHigher.level} {lastHigher.date}
                        </p>
                    )}
                </div>
            </div>

            {showTotals && (
                <div className="grid grid-cols-3 gap-2">
                    <StatBadge label="Ottelut" value={stats.gamesPlayedThisYear} icon={<Shield />} />
                    <StatBadge label="Maalit" value={stats.goalsThisYear} icon={<Target />} variant="success" />
                    <StatBadge label="Varoitukset" value={stats.warningsThisYear} icon={<AlertTriangle />} variant={stats.warningsThisYear > 0 ? 'warning' : 'default'} />
                </div>
            )}

            {series.length > 0 && (
                <div className="space-y-1">
                    {series.map(row => (
                        <div key={`${row.category}-${row.half}`} className="flex items-baseline justify-between gap-2 text-xs">
                            <span className="text-text-primary truncate">
                                {row.category}{row.half ? ` · ${row.half}` : ''}
                            </span>
                            <span className="text-text-muted shrink-0 font-mono">
                                {row.matches} ott · {row.goals} m{row.warnings ? ` · ${row.warnings} var` : ''}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    )

    if (!stats.playerId) return inner
    return <Link to={`/player/${stats.playerId}`} className="block">{inner}</Link>
}
