import { isResult } from '../domain/matchState'
import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import type { MatchDetails, PlayerLineupInfo } from '../types'
import { cn } from '../utils/cn'

function nameOf(p: PlayerLineupInfo): string {
    const first = (p.first_name || '').trim()
    const last = (p.last_name || '').trim()
    return first && last ? `${first} ${last}` : (p.player_name || '').trim()
}

function TeamLineup({ title, players, goalsBy, yellowsBy }: {
    title: string
    players: PlayerLineupInfo[]
    goalsBy: Map<string, number>
    yellowsBy: Map<string, number>
}) {
    const sorted = [...players].sort((a, b) => (parseInt(a.shirt_number || '999', 10) || 999) - (parseInt(b.shirt_number || '999', 10) || 999))
    return (
        <div className="bg-surface-1 border border-border-hairline rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" /> {title}
                <span className="text-text-muted font-normal text-xs">({players.length})</span>
            </h3>
            {sorted.length === 0 ? (
                <p className="text-xs text-text-muted py-2">Kokoonpanoa ei ole vielä Tulospalvelussa.</p>
            ) : (
                <ul className="divide-y divide-border-hairline/50">
                    {sorted.map(p => {
                        const goals = goalsBy.get(p.player_id) || 0
                        const yellows = yellowsBy.get(p.player_id) || 0
                        const pos = (p.position_fi || p.position || '').trim()
                        const row = (
                            <>
                                <span className="w-8 shrink-0 text-right font-mono text-xs text-accent">{p.shirt_number ? `#${p.shirt_number}` : ''}</span>
                                <span className="flex-1 min-w-0 truncate text-sm text-text-primary">{nameOf(p)}</span>
                                {p.captain === '1' || p.captain === 'C' ? <span className="text-[10px] font-bold px-1 rounded bg-accent text-text-inverse">C</span> : null}
                                {/^mv$|maalivahti/i.test(pos) && <span className="text-[10px] font-bold px-1 rounded bg-surface-3 text-text-secondary">MV</span>}
                                {goals > 0 && <span className="text-[11px] font-bold text-semantic-green">⚽{goals > 1 ? ` ${goals}` : ''}</span>}
                                {yellows > 0 && <span className="text-[11px]" title="Varoitus">🟨{yellows > 1 ? ` ${yellows}` : ''}</span>}
                            </>
                        )
                        return (
                            <li key={p.player_id || nameOf(p)}>
                                {p.player_id ? (
                                    <Link to={`/player/${p.player_id}`} className={cn('flex items-center gap-2 min-h-[44px] px-1 rounded hover:bg-surface-2')}>{row}</Link>
                                ) : (
                                    <div className="flex items-center gap-2 min-h-[44px] px-1">{row}</div>
                                )}
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}

/** Lineups exactly as Taso lists them for this match. No season numbers mixed in. */
export function MatchLineups({ match }: { match: MatchDetails }) {
    const lineups = match.lineups || []
    const goalsBy = new Map<string, number>()
    for (const g of match.goals || []) {
        if (!g.player_id) continue
        const own = lineups.find(p => p.player_id === g.player_id)
        if (own && g.team_id && own.team_id !== g.team_id) continue // own goal: not credited to the player
        goalsBy.set(g.player_id, (goalsBy.get(g.player_id) || 0) + 1)
    }
    const yellowsBy = new Map<string, number>()
    for (const b of match.bookings || []) {
        if (!b.player_id) continue
        yellowsBy.set(b.player_id, (yellowsBy.get(b.player_id) || 0) + 1)
    }
    const a = lineups.filter(p => p.team_id === match.team_A_id)
    const b = lineups.filter(p => p.team_id === match.team_B_id)
    if (!a.length && !b.length) return null
    const played = isResult(match)
    return (
        <section className="space-y-3">
            <h2 className="text-lg font-bold text-text-primary">{played ? 'Kokoonpanot' : 'Ilmoitetut pelaajat'}</h2>
            {!played && <p className="text-xs text-text-muted -mt-2">Joukkueiden tulospalveluun ilmoittamat pelaajat. Lista voi vielä muuttua.</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TeamLineup title={match.team_A_name} players={a} goalsBy={goalsBy} yellowsBy={yellowsBy} />
                <TeamLineup title={match.team_B_name} players={b} goalsBy={goalsBy} yellowsBy={yellowsBy} />
            </div>
        </section>
    )
}
