import { Link } from 'react-router-dom'
import { Info } from 'lucide-react'
import { RosterCard } from './RosterCard'
import { usePlayerSplits } from '../hooks/usePlayerSplits'
import { APP_CONFIG } from '../config'
import type { RosterTwin } from '../hooks/useRosterTwin'
import { sportLabel } from '../utils/rosterTwin'

/**
 * Players of the same-name, same-birth-year team, clearly labelled as borrowed:
 * no games, goals or minutes are shown or counted for this team. Each card shows the
 * player's own Taso stats (all their registrations), never this team's results.
 */
export function TwinRoster({ twin, seasonYear = APP_CONFIG.CURRENT_YEAR }: { twin: RosterTwin; seasonYear?: string }) {
    const label = sportLabel(twin.team.sport_id)
    const players = [...twin.players].sort((a, b) =>
        String(a.last_name || '').localeCompare(String(b.last_name || ''), 'fi')
        || String(a.first_name || '').localeCompare(String(b.first_name || ''), 'fi'))
    const splits = usePlayerSplits(players.map(p => p.player_id), seasonYear)
    return (
        <div className="space-y-3" data-testid="twin-roster">
            <div className="bg-surface-2 border border-border-hairline rounded-lg p-3 text-sm text-text-secondary space-y-1">
                <p className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span>
                        Tähän sarjaan ei ole ilmoitettu pelaajia. Pelaajat joukkueesta{' '}
                        <Link to={`/team/${twin.team.team_id}`} className="inline-block text-accent font-semibold hover:underline py-3 -my-3">
                            {twin.team.team_name}{label ? ` (${label})` : ''}
                        </Link>{' '}– Palloliitto
                    </span>
                </p>
                <p className="text-xs text-text-muted pl-6">Pelaajien otteluita tai maaleja ei lasketa tämän joukkueen tilastoihin.</p>
            </div>
            <p className="text-[11px] text-text-muted">Korteissa pelaajan omat Palloliiton ottelut kaudella (kaikki hänen joukkueensa), ei tämän joukkueen otteluita.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                {players.map(p => <RosterCard key={p.player_id} player={p} split={splits[p.player_id]} />)}
            </div>
        </div>
    )
}
