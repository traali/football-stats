import { Link } from 'react-router-dom'
import { Info, ChevronRight } from 'lucide-react'
import type { RosterTwin } from '../hooks/useRosterTwin'
import { sportLabel } from '../utils/rosterTwin'

/**
 * Players of the same-name, same-birth-year team, clearly labelled as borrowed:
 * no games, goals or minutes are shown or counted for this team.
 */
export function TwinRoster({ twin }: { twin: RosterTwin }) {
    const label = sportLabel(twin.team.sport_id)
    const players = [...twin.players].sort((a, b) =>
        String(a.last_name || '').localeCompare(String(b.last_name || ''), 'fi')
        || String(a.first_name || '').localeCompare(String(b.first_name || ''), 'fi'))
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
            <ul className="grid grid-cols-1 gap-1">
                {players.map(p => (
                    <li key={p.player_id}>
                        <Link to={`/player/${p.player_id}`}
                            className="flex items-center justify-between gap-3 min-h-[44px] px-3 rounded-lg bg-surface-1 border border-border-hairline hover:bg-surface-2">
                            <span className="flex items-center gap-3 min-w-0">
                                {p.shirt_number && <span className="text-xs font-mono font-bold text-accent w-7 shrink-0">#{p.shirt_number}</span>}
                                <span className="text-sm text-text-primary font-medium truncate">{[p.first_name, p.last_name].filter(Boolean).join(' ')}</span>
                            </span>
                            <span className="flex items-center gap-2 shrink-0">
                                {p.birthyear && /^\d{4}$/.test(p.birthyear) && <span className="text-xs text-text-muted">{p.birthyear}</span>}
                                <ChevronRight className="w-4 h-4 text-text-muted" />
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    )
}
