import { Link } from 'react-router-dom'
import { ChevronRight, ListOrdered, Radio, History } from 'lucide-react'
import type { DiscoveryMatch, TeamResponse } from '../types'
import { GameHero } from './GameHero'
import { MatchRow } from './MatchRow'
import { useTeamStandings } from '../hooks/useTeamStandings'
import { teamToday } from '../utils/favoriteHero'
import { APP_CONFIG } from '../config'

function n(v: unknown): number | null {
    const x = Number(v)
    return v === '' || v === null || v === undefined || !Number.isFinite(x) ? null : x
}

/** Team page top: game on now / next game, table position, latest result. */
export function TeamTodayBlock({ teamId, team, matches, now, fetchedAt }: {
    teamId: string
    team: TeamResponse | null
    matches: DiscoveryMatch[]
    now: Date
    fetchedAt?: number
}) {
    const today = teamToday(matches, now)
    const { group } = useTeamStandings(team, teamId, APP_CONFIG.CURRENT_YEAR)
    const row = group?.teams?.find(t => String(t.team_id) === String(teamId))
    const pos = n(row?.current_standing)
    const played = n(row?.matches_played)
    const points = n(row?.points)
    const groupLink = group?.competition_id && group?.category_id && group?.group_id
        ? `/group/${group.competition_id}/${group.category_id}/${group.group_id}` : null
    const groupTitle = [group?.category_name, group?.group_name].filter(Boolean).join(' · ')
    const showLatest = today.latestResult && today.hero?.match.match_id !== today.latestResult.match_id

    if (!today.hero && !row) return null
    return (
        <section className="space-y-3" aria-label="Tänään" data-testid="team-today">
            {today.hero && <GameHero match={today.hero.match} kind={today.hero.kind} teamId={teamId} now={now} showTeam={false} />}
            {today.otherOnNow.length > 0 && (
                <div className="bg-surface-1 border border-semantic-red/30 rounded-xl p-3 space-y-1" data-testid="team-on-now">
                    <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider px-1 flex items-center gap-2"><Radio className="w-4 h-4 text-semantic-red" /> Myös käynnissä</h2>
                    {today.otherOnNow.map(m => <MatchRow key={m.match_id} match={m} teamId={teamId} now={now} fetchedAt={fetchedAt} subtitle={[m.category_name, m.venue_name].filter(Boolean).map(String).join(' · ')} />)}
                </div>
            )}
            {row && pos !== null && pos > 0 && (() => {
                const body = (
                    <>
                        <span className="min-w-0">
                            <span className="block text-[11px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-1.5"><ListOrdered className="w-4 h-4 text-accent" /> Sarjataulukko</span>
                            <span className="block text-lg font-bold text-text-primary mt-0.5">
                                {pos}. sija{group?.teams?.length ? <span className="text-text-muted font-normal text-sm"> / {group.teams.length}</span> : null}
                                {played !== null && played > 0 && points !== null && <span className="text-text-secondary font-semibold text-sm"> · {points} p · {played} ott.</span>}
                            </span>
                            {played === 0 && <span className="block text-xs text-text-muted">Ei vielä pelattuja sarjaotteluita.</span>}
                            {groupTitle && <span className="block text-xs text-text-muted truncate">{groupTitle}</span>}
                        </span>
                        {groupLink && <ChevronRight className="w-5 h-5 text-text-muted shrink-0" />}
                    </>
                )
                const cls = 'bg-surface-1 border border-border-hairline rounded-xl p-4 min-h-[52px] flex items-center justify-between gap-3'
                return groupLink
                    ? <Link to={groupLink} className={`${cls} hover:bg-surface-2`} data-testid="team-position">{body}</Link>
                    : <div className={cls} data-testid="team-position">{body}</div>
            })()}
            {showLatest && today.latestResult && (
                <div className="bg-surface-1 border border-border-hairline rounded-xl p-3 space-y-1" data-testid="team-latest">
                    <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider px-1 flex items-center gap-2"><History className="w-4 h-4 text-accent" /> Viimeisin tulos</h2>
                    <MatchRow match={today.latestResult} teamId={teamId} now={now} subtitle={[today.latestResult.category_name, today.latestResult.venue_name].filter(Boolean).map(String).join(' · ')} />
                </div>
            )}
        </section>
    )
}
