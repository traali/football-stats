import { Link } from 'react-router-dom'
import { Calendar, ChevronRight } from 'lucide-react'
import type { DiscoveryMatch } from '../types'
import { LiveBadge } from './LiveBadge'
import { VenueBlock } from './VenueBlock'
import { displayScore, hasClockTime, helsinkiToday, isForfeit } from '../domain/matchState'
import { friendlyDay, opponentOf, type HeroKind } from '../utils/favoriteHero'
import { formatTime } from '../utils/dates'
import { teamLabel } from '../utils/teamLabel'
import { venueOf } from '../utils/venue'
import { cn } from '../utils/cn'

const KIND_LABEL: Record<HeroKind, string | null> = {
    live: null,
    awaiting: null,
    next: 'Seuraava ottelu',
    latest: 'Viimeisin ottelu · ei tulevia otteluita',
}

/** One favourite team's game: live score or "vs", when, where, opponent, map + Parkkis. */
export function GameHero({ match, kind, teamId, teamName, now = new Date(), showTeam = true }: {
    match: DiscoveryMatch
    kind: HeroKind
    teamId: string
    teamName?: string
    now?: Date
    showTeam?: boolean
}) {
    const score = kind === 'next' ? null : displayScore(match, now)
    const forfeit = kind === 'latest' && isForfeit(match)
    const opp = opponentOf(match, teamId)
    const a = teamLabel(match.team_A_id, match.team_A_name, match.team_A_description as string | undefined)
    const b = teamLabel(match.team_B_id, match.team_B_name, match.team_B_description as string | undefined)
    const day = friendlyDay(match.date, helsinkiToday(now))
    const time = hasClockTime(match.time) ? `klo ${formatTime(match.time)}` : ''
    const label = KIND_LABEL[kind]
    return (
        <article data-testid="game-hero" data-kind={kind}
            className={cn('bg-surface-1 border rounded-2xl p-4 space-y-3', kind === 'live' ? 'border-semantic-red/40' : 'border-border-hairline')}>
            <Link to={`/match/${match.match_id}`} className="block space-y-1 -m-1 p-1 rounded-xl hover:bg-surface-2 transition-colors min-h-[44px]">
                <p className="text-[11px] font-bold uppercase tracking-widest text-accent flex flex-wrap items-center gap-x-2 gap-y-1">
                    {showTeam && teamName && <span className="truncate max-w-full">{teamName}</span>}
                    {kind === 'live' && <LiveBadge />}
                    {kind === 'awaiting' && <LiveBadge awaiting />}
                    {label && <span className="text-text-muted">{showTeam && teamName ? '· ' : ''}{label}{forfeit ? ' · luovutus' : ''}</span>}
                </p>
                <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-bold text-text-primary leading-snug min-w-0 break-words">{a} – {b}</p>
                    <ChevronRight className="w-5 h-5 text-text-muted shrink-0" />
                </div>
                <p className="font-mono text-3xl font-bold text-text-primary">{score ? `${score.a}–${score.b}` : 'vs'}</p>
                {opp?.name && <p className="text-sm text-text-secondary">Vastassa {opp.name}{opp.home ? ' · kotipeli' : ' · vieraspeli'}</p>}
                {(day || time) && (
                    <p className="text-sm text-text-primary font-semibold flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-accent shrink-0" />
                        {[day, time].filter(Boolean).join(' ')}
                    </p>
                )}
            </Link>
            {!forfeit && <VenueBlock venue={venueOf(match)} compact />}
        </article>
    )
}
