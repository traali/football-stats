import { Link } from 'react-router-dom'
import { cn } from '../utils/cn'
import { formatDate, formatTime } from '../utils/dates'
import { WLD_CONFIG } from '../utils/wld'
import { displayScore, isForfeit, matchPhase, outcomeFor, penaltyScore, type MatchLike } from '../domain/matchState'
import { teamLabel, isPlaceholderTeam } from '../utils/teamLabel'
import { LiveBadge } from './LiveBadge'

export interface RowMatch extends MatchLike {
    match_id: string
    team_A_id?: string
    team_B_id?: string
    team_A_name?: string
    team_B_name?: string
    team_A_description?: string
    team_B_description?: string
    ps_A?: string
    ps_B?: string
}

function Pos({ n }: { n?: string | number }) {
    if (n === undefined || n === null || n === '') return null
    return <span className="text-text-muted font-mono text-[10px] shrink-0">#{n}</span>
}

function TeamName({ id, name, desc, mine }: { id?: string; name?: string; desc?: string; mine?: boolean }) {
    const label = teamLabel(id, name, desc)
    return (
        <span className={cn('truncate', isPlaceholderTeam(id) && 'italic text-text-muted', mine && 'text-accent font-semibold')}>
            {label}
        </span>
    )
}

/**
 * One row for any match list. Taps through to /match/:id.
 * Score only for results or a running game; otherwise "vs".
 */
export function MatchRow({ match: m, teamId, standings, subtitle, now, className }: {
    match: RowMatch
    /** Perspective team: shows V/T/H and highlights the team. */
    teamId?: string
    standings?: Record<string, string | number>
    subtitle?: string
    now?: Date
    className?: string
}) {
    const phase = matchPhase(m, now)
    const score = displayScore(m, now)
    const outcome = teamId ? outcomeFor(m, teamId) : null
    const forfeit = phase === 'result' && isForfeit(m)
    const wld = outcome ? WLD_CONFIG[outcome] : null
    const linkable = /^\d+$/.test(String(m.match_id || ''))
    const pens = phase === 'result' ? penaltyScore(m) : null

    const body = (
        <>
            <span className="w-16 shrink-0 text-xs text-text-muted leading-tight">
                <span className="block">{formatDate(m.date || undefined, 'with-year')}</span>
                {m.time && !String(m.time).includes("'") && <span className="block font-mono text-[10px]">{formatTime(m.time || undefined)}</span>}
            </span>
            <span className="flex-1 min-w-0">
                <span className="flex items-center gap-1.5 min-w-0">
                    <span className="flex-1 min-w-0 flex items-center justify-end gap-1 text-right">
                        <TeamName id={m.team_A_id} name={m.team_A_name} desc={m.team_A_description} mine={!!teamId && m.team_A_id === teamId} />
                        <Pos n={m.team_A_id ? standings?.[m.team_A_id] : undefined} />
                    </span>
                    <span className={cn('shrink-0 font-mono font-bold px-1.5 text-center min-w-[3.5ch]', score ? 'text-text-primary' : 'text-text-muted text-xs')}>
                        {score ? `${score.a}–${score.b}` : 'vs'}
                    </span>
                    <span className="flex-1 min-w-0 flex items-center gap-1">
                        <Pos n={m.team_B_id ? standings?.[m.team_B_id] : undefined} />
                        <TeamName id={m.team_B_id} name={m.team_B_name} desc={m.team_B_description} mine={!!teamId && m.team_B_id === teamId} />
                    </span>
                </span>
                {(subtitle || phase === 'live' || phase === 'awaiting' || forfeit || pens) && (
                    <span className="flex items-center justify-center gap-2 mt-1 text-[11px] text-text-muted">
                        {phase === 'live' && <LiveBadge />}
                        {phase === 'awaiting' && <LiveBadge awaiting />}
                        {forfeit && (
                            <span className="px-1.5 py-0.5 rounded bg-surface-3 border border-border-hairline text-[10px] font-bold uppercase tracking-wide text-text-secondary">Luovutus</span>
                        )}
                        {pens && <span className="font-mono">rp {pens.a}–{pens.b}</span>}
                        {subtitle && <span className="truncate">{subtitle}</span>}
                    </span>
                )}
            </span>
            <span className="w-6 shrink-0 text-right">
                {wld && (
                    <span className={cn('text-[10px] font-bold px-1 py-0.5 rounded leading-none', wld.bg, wld.color)} title={outcome === 'V' ? 'Voitto' : outcome === 'H' ? 'Häviö' : 'Tasapeli'}>
                        {outcome}
                    </span>
                )}
            </span>
        </>
    )

    const cls = cn(
        'flex items-center gap-2 py-2.5 px-3 rounded-lg border border-transparent text-sm min-h-[48px]',
        linkable && 'hover:bg-surface-2 hover:border-border-hairline active:scale-[0.99] transition-all',
        (phase === 'live') && 'bg-semantic-red/5 border-semantic-red/20',
        className,
    )
    if (!linkable) return <div className={cls}>{body}</div>
    return <Link to={`/match/${m.match_id}`} className={cls}>{body}</Link>
}
