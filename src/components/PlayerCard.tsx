import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import { PlayerStats } from '../types'
import { User, Shield, AlertTriangle, Target, Activity } from 'lucide-react'
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

function WdlDots({ wins = 0, draws = 0, losses = 0 }: { wins?: number; draws?: number; losses?: number }) {
    const dots: Array<'V' | 'T' | 'H'> = [
        ...Array.from({ length: wins }, () => 'V' as const),
        ...Array.from({ length: draws }, () => 'T' as const),
        ...Array.from({ length: losses }, () => 'H' as const),
    ]
    if (!dots.length) return null
    return (
        <span className="inline-flex items-center gap-0.5 shrink-0" aria-label={`${wins}V ${draws}T ${losses}H`}>
            {dots.map((d, i) => (
                <span
                    key={`${d}-${i}`}
                    className={
                        d === 'V' ? 'w-1.5 h-1.5 rounded-full bg-semantic-green' :
                        d === 'H' ? 'w-1.5 h-1.5 rounded-full bg-semantic-red' :
                        'w-1.5 h-1.5 rounded-full bg-text-muted'
                    }
                />
            ))}
        </span>
    )
}

function gdLabel(gf?: number, ga?: number): string {
    if (gf == null || ga == null) return ''
    const d = gf - ga
    const sign = d > 0 ? '+' : ''
    return `${gf}–${ga} (${sign}${d})`
}

export function PlayerCard({ stats, eligibility }: { stats: PlayerStats; eligibility?: PlayerEligibilityResult }) {
    const [imgError, setImgError] = useState(false)
    const series = stats.seriesThisYear || []
    const showTotals = stats.gamesPlayedThisYear > 0 || stats.goalsThisYear > 0 || stats.warningsThisYear > 0 || (stats.goalsInMatch || 0) > 0 || (stats.gamesLast14Days || 0) > 0
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <StatBadge label="Ottelut" value={stats.gamesPlayedThisYear} icon={<Shield />} />
                    <StatBadge label="Maalit" value={stats.goalsThisYear} icon={<Target />} variant="success" />
                    <StatBadge label="Varoitukset" value={stats.warningsThisYear} icon={<AlertTriangle />} variant={stats.warningsThisYear > 0 ? 'warning' : 'default'} />
                    <StatBadge
                        label="14 vrk"
                        value={stats.gamesLast14Days ?? 0}
                        icon={<Activity />}
                        variant={(stats.gamesLast14Days ?? 0) >= 3 ? 'warning' : (stats.gamesLast14Days ?? 0) > 0 ? 'info' : 'default'}
                    />
                </div>
            )}

            {series.length > 0 && (
                <div className="space-y-1.5">
                    {series.map(row => (
                        <div key={`${row.category}-${row.half}-${row.teamName || ''}`} className="space-y-0.5">
                            <div className="flex items-baseline justify-between gap-2 text-xs">
                                <span className="text-text-primary truncate">
                                    {row.category}{row.half ? ` · ${row.half}` : ''}{row.teamName ? ` · ${row.teamName}` : ''}
                                </span>
                                <span className="text-text-muted shrink-0 font-mono">
                                    {row.goals} m · {row.warnings ?? 0} var · {gdLabel(row.gf, row.ga)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <WdlDots wins={row.wins} draws={row.draws} losses={row.losses} />
                                <span className="text-[10px] text-text-muted font-mono">
                                    {row.wins ?? 0}V {row.draws ?? 0}T {row.losses ?? 0}H · {row.matches} ott
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    )

    if (!stats.playerId) return inner
    return <Link to={`/player/${stats.playerId}`} className="block">{inner}</Link>
}
