import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import { PlayerStats } from '../types'
import { User } from 'lucide-react'
import { EligibilityChip } from './EligibilityChip'
import type { PlayerEligibilityResult } from '../domain/eligibility'

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
}

export function PlayerCard({ stats, eligibility }: { stats: PlayerStats; eligibility?: PlayerEligibilityResult }) {
    const [imgError, setImgError] = useState(false)
    const pos = stats.position_fi === 'MV' || stats.position_fi === 'mv' ? 'MV' : stats.position_fi
    const body = (
        <motion.div variants={cardVariants} className="bg-surface-1 border border-border-hairline rounded-xl p-4 space-y-2 hover:border-accent/30">
            <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                    {!imgError && stats.img_url ? (
                        <img src={stats.img_url} alt="" className="w-12 h-12 rounded-lg object-cover border border-border-hairline" onError={() => setImgError(true)} />
                    ) : (
                        <div className="w-12 h-12 rounded-lg bg-surface-2 border border-border-hairline flex items-center justify-center">
                            <User className="w-6 h-6 text-text-muted" />
                        </div>
                    )}
                    {stats.isCaptainInMatch && (
                        <div className="absolute -top-1 -right-1 bg-accent text-text-inverse text-[9px] font-bold px-1 rounded">C</div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-bold text-text-primary truncate">
                            {stats.shirtNumber && stats.shirtNumber !== 'N/A' && (
                                <span className="text-accent font-mono text-sm mr-1.5">#{stats.shirtNumber}</span>
                            )}
                            {stats.name}
                        </h3>
                        <EligibilityChip result={eligibility} />
                    </div>
                    {(stats.currentTeamName || stats.teamsThisYear) && (
                        <p className="text-xs text-text-primary mt-0.5 leading-snug">
                            {stats.currentTeamName}
                            {stats.currentTeamName && stats.teamsThisYear ? ' · ' : ''}
                            {stats.teamsThisYear}
                        </p>
                    )}
                    <p className="text-text-secondary text-xs mt-0.5 flex flex-wrap gap-x-2">
                        {stats.birthYear && <span>{stats.birthYear}</span>}
                        {pos && <span>{pos}</span>}
                        {stats.overage && <span className="text-semantic-amber font-semibold">Y</span>}
                        {stats.goalsInMatch ? <span className="text-semantic-green font-semibold">{stats.goalsInMatch} maali{stats.goalsInMatch > 1 ? 'a' : ''}</span> : null}
                    </p>
                    {eligibility?.countsTowardDownQuota && eligibility.lastOfficialHigher && (
                        <p className="text-[11px] text-text-muted mt-1">
                            Viimeisin ylempi: {eligibility.lastOfficialHigher.level} {eligibility.lastOfficialHigher.date}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    )
    if (!stats.playerId) return body
    return <Link to={`/player/${stats.playerId}`} className="block">{body}</Link>
}
