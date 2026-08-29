import { motion, type Variants } from 'framer-motion'
import { PlayerCard } from './PlayerCard'
import { SquadQuotaBar } from './EligibilityChip'
import type { PlayerStats } from '../types'
import type { PlayerEligibilityResult, SquadEligibilityResult } from '../domain/eligibility'

const stagger: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.04 } },
}

function TeamLineup({
    name, players, squad, byPlayer,
}: {
    name: string
    players: PlayerStats[]
    squad?: SquadEligibilityResult
    byPlayer: Record<string, PlayerEligibilityResult>
}) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center min-w-0">
                    <div className="w-1 h-8 mr-4 rounded-full bg-accent shrink-0" />
                    <h2 className="text-2xl font-bold text-text-primary truncate">{name}</h2>
                </div>
                {squad && <SquadQuotaBar used={squad.downQuotaUsed} max={squad.downQuotaMax} />}
            </div>
            <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-5" variants={stagger} initial="hidden" animate="visible">
                {players.map(player => (
                    <PlayerCard
                        key={player.playerId || player.name + player.shirtNumber}
                        stats={player}
                        eligibility={player.playerId ? byPlayer[player.playerId] : undefined}
                    />
                ))}
            </motion.div>
        </div>
    )
}

export function MatchLineups({
    teamAName, teamBName, teamAPlayers, teamBPlayers, teamAId, teamBId, byTeam, byPlayer,
}: {
    teamAName: string
    teamBName: string
    teamAPlayers: PlayerStats[]
    teamBPlayers: PlayerStats[]
    teamAId: string
    teamBId: string
    byTeam: Record<string, SquadEligibilityResult>
    byPlayer: Record<string, PlayerEligibilityResult>
}) {
    return (
        <div className="space-y-12">
            <TeamLineup name={teamAName} players={teamAPlayers} squad={byTeam[teamAId]} byPlayer={byPlayer} />
            <TeamLineup name={teamBName} players={teamBPlayers} squad={byTeam[teamBId]} byPlayer={byPlayer} />
        </div>
    )
}
