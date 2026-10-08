import type { MatchDetails, GroupDetails, TeamResponse } from '../types'
import { matchFacts, isOwnGoal } from '../utils/matchFacts'
import { motion } from 'framer-motion'
import { Calendar, Clock, Users, Timer, CloudSun, Thermometer, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../utils/cn'
import { resolveCrest } from '../utils/crest'
import { formatDate, formatTime } from '../utils/dates'
import { displayScore, hasClockTime, isForfeit, matchPhase } from '../domain/matchState'
import { isPlaceholderTeam, teamLabel } from '../utils/teamLabel'
import { LiveBadge } from './LiveBadge'
import { TasoLink } from './TasoLink'

const filled = (v: unknown): string => (v === null || v === undefined ? '' : String(v).trim())

function TeamSide({ id, name, desc, crest, align }: { id: string; name: string; desc?: string; crest?: string | null; align: 'left' | 'right' }) {
    const label = teamLabel(id, name, desc)
    const inner = (
        <>
            {crest && <img src={crest} alt="" className="w-8 h-8 object-contain mb-1" />}
            <h3 className={cn('text-xl md:text-3xl font-bold leading-tight', align === 'right' ? 'text-right' : 'text-left', isPlaceholderTeam(id) ? 'italic text-text-muted' : 'text-text-primary')}>{label}</h3>
        </>
    )
    const cls = cn('flex-1 flex flex-col space-y-2 rounded-xl p-1', align === 'right' ? 'items-end' : 'items-start')
    if (isPlaceholderTeam(id)) return <div className={cls}>{inner}</div>
    return <Link to={`/team/${id}`} className={cn(cls, 'hover:opacity-80 transition-opacity')}>{inner}</Link>
}

export function MatchHeader({ match, group, teamA, teamB, now }: { match: MatchDetails; group: GroupDetails | null; teamA?: TeamResponse | null; teamB?: TeamResponse | null; now?: Date }) {
    const phase = matchPhase(match, now)
    const score = displayScore(match, now)
    const forfeit = phase === 'result' && isForfeit(match)
    const crestA = resolveCrest(teamA || {})
    const crestB = resolveCrest(teamB || {})
    const clock = String(match.time || '').includes("'") ? match.time : null
    const facts = matchFacts(match)
    const showFacts = !!(facts.weather || facts.temperature || facts.attendance)
    const htReal = phase === 'result' && !forfeit && /^\d+$/.test(filled(match.hts_A)) && /^\d+$/.test(filled(match.hts_B))
    const statusText = phase === 'live' ? 'Käynnissä'
        : phase === 'awaiting' ? 'Peliaika on ohi – tulosta odotetaan Tulospalvelusta'
        : phase === 'result' ? (forfeit ? 'Luovutusvoitto (ottelua ei pelattu)' : 'Päättynyt')
        : phase === 'stale' ? 'Tulosta ei ole merkitty Tulospalveluun'
        : 'Ottelu alkaa'

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-1 rounded-xl overflow-hidden border border-border-hairline"
        >
            <div className="p-6 md:p-8 flex flex-col items-center text-center space-y-6">
                <div className="flex flex-col items-center space-y-2">
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                        <div className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-md text-accent text-xs font-bold uppercase tracking-widest">
                            {match.competition_name}
                        </div>
                        {phase === 'live' && <LiveBadge />}
                        {phase === 'awaiting' && <LiveBadge awaiting />}
                        {forfeit && <span className="px-2 py-1 rounded-md bg-surface-3 border border-border-hairline text-xs font-bold uppercase tracking-widest text-text-secondary">Luovutus</span>}
                    </div>
                    <h2 className="text-text-muted text-sm font-medium">{match.category_name} {group?.group_name && `• ${group.group_name}`}</h2>
                </div>

                <div className="flex items-center justify-center space-x-4 md:space-x-8 w-full">
                    <TeamSide id={match.team_A_id} name={match.team_A_name} desc={match.team_A_description} crest={crestA} align="right" />
                    <div className="flex flex-col items-center shrink-0">
                        <div className="text-4xl md:text-6xl font-bold tabular-nums tracking-tighter text-text-primary font-mono leading-none" data-testid="match-score">
                            {score ? (
                                <>{score.a} <span className="text-accent opacity-80 mx-1">:</span> {score.b}</>
                            ) : (
                                <span className="text-text-muted">vs</span>
                            )}
                        </div>
                        {phase === 'live' && clock && <div className="text-xs font-mono text-semantic-red mt-1">{clock}</div>}
                        {htReal && (
                            <div className="flex items-center gap-1.5 text-xs text-text-muted font-mono mt-1">
                                <Timer className="w-3 h-3" />
                                <span>Puoliaika {match.hts_A}–{match.hts_B}</span>
                            </div>
                        )}
                    </div>
                    <TeamSide id={match.team_B_id} name={match.team_B_name} desc={match.team_B_description} crest={crestB} align="left" />
                </div>

                {match.goals && match.goals.length > 0 && (
                    <div className="w-full max-w-md space-y-2">
                        <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest">Maalit</h4>
                        <div className="relative space-y-1 pl-6 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border-hairline">
                            {[...match.goals].sort((a, b) => parseInt(a.time_min || '0') - parseInt(b.time_min || '0')).map((g, i) => {
                                const isA = g.team_id === match.team_A_id
                                const own = isOwnGoal(g, match)
                                return (
                                    <div key={g.event_id || i} className="flex items-center gap-2.5 text-sm min-h-[32px]">
                                        <div className={cn('w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 -ml-6', isA ? 'bg-bmw-cyan/20' : 'bg-bmw-magenta/20')}>
                                            <div className={cn('w-1.5 h-1.5 rounded-full', isA ? 'bg-bmw-cyan' : 'bg-bmw-magenta')} />
                                        </div>
                                        <span className="text-text-muted text-xs font-mono w-8 shrink-0">{g.time_min ? `${g.time_min}'` : ''}</span>
                                        {g.player_id && !own ? (
                                            <Link to={`/player/${g.player_id}`} className="text-text-primary font-medium truncate hover:text-accent">{g.player_name}</Link>
                                        ) : (
                                            <span className="text-text-primary font-medium truncate">{own ? `${g.player_name || ''} (oma maali)`.trim() : (g.player_name || 'Maali')}</span>
                                        )}
                                        <span className="text-text-muted text-xs font-mono ml-auto shrink-0">{g.score_A != null && g.score_B != null ? `${g.score_A}–${g.score_B}` : ''}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {match.bookings && match.bookings.length > 0 && (
                    <div className="w-full max-w-md space-y-2">
                        <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest">Varoitukset</h4>
                        {match.bookings.map((b, i) => (
                            <div key={b.event_id || i} className="flex items-center gap-2 text-sm">
                                <span className="text-text-muted text-xs font-mono w-8">{b.time_min ? `${b.time_min}'` : ''}</span>
                                <span className="text-text-primary truncate">🟨 {b.player_name}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex flex-col items-center gap-1">
                    <span className={cn('text-xs font-bold uppercase tracking-widest', phase === 'live' ? 'text-semantic-red' : 'text-text-muted')}>
                        {statusText}
                    </span>
                    <div className="flex items-center gap-2 text-text-primary flex-wrap justify-center">
                        <Calendar className="w-4 h-4 text-accent" />
                        <span className="text-base font-semibold">{formatDate(match.date)}{match.date ? match.date.slice(0, 4) : ''}</span>
                        {hasClockTime(match.time) && (
                            <>
                                <Clock className="w-4 h-4 text-accent" />
                                <span className="text-base font-semibold">klo {formatTime(match.time)}</span>
                            </>
                        )}
                    </div>
                    {match.venue_name && !forfeit && (
                        <span className="text-xs text-text-muted flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {match.venue_name}{match.venue_city_name ? `, ${match.venue_city_name}` : ''}
                        </span>
                    )}
                    {showFacts && (
                        <p className="text-xs text-text-muted flex items-center gap-2 mt-1 flex-wrap justify-center" data-testid="match-facts">
                            {facts.weather && <span className="inline-flex items-center gap-1"><CloudSun className="w-3.5 h-3.5 text-accent" />{facts.weather}</span>}
                            {facts.temperature && <span className="inline-flex items-center gap-1"><Thermometer className="w-3.5 h-3.5 text-accent" />{facts.temperature}</span>}
                            {facts.attendance && <span>{facts.attendance}</span>}
                            <span className="opacity-70">(Tulospalvelu)</span>
                        </p>
                    )}
                </div>

                {match.referee_1_name && (
                    <div className="flex items-center gap-1.5 text-text-muted text-sm">
                        <Users className="w-3.5 h-3.5 text-accent" />
                        Tuomari: {match.referee_1_name}
                    </div>
                )}
                <TasoLink kind="match" id={match.match_id} />
            </div>
        </motion.div>
    )
}
