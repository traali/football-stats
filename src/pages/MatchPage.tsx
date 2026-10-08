import { useEffect, useState } from 'react'
import { Search, Share2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMatchData } from '../hooks/useMatchData'
import { MatchHeader } from '../components/MatchHeader'
import { MatchLineups } from '../components/MatchLineups'
import { StandingsTable } from '../components/StandingsTable'
import { Button } from '../components/Button'
import { BackButton } from '../components/BackButton'
import { DualStatBar } from '../components/DualStatBar'
import { CommonOpponents } from '../components/CommonOpponents'
import { ErrorState } from '../components/ErrorState'
import { MatchHeaderSkeleton, StandingsTableSkeleton } from '../components/Skeleton'
import { displayScore, hasClockTime, isForfeit, isResult, matchPhase } from '../domain/matchState'
import { formatDate, formatTime } from '../utils/dates'
import { getLastSelectedTeamId } from '../services/teamSelection'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type { MatchDetails } from '../types'
import { tasoUrl } from '../utils/tasoLinks'

function shareText(m: MatchDetails): string {
    const score = displayScore(m)
    const head = score ? `${m.team_A_name} ${score.a}–${score.b} ${m.team_B_name}` : `${m.team_A_name} vs ${m.team_B_name}`
    const when = [formatDate(m.date, 'with-year'), hasClockTime(m.time) ? `klo ${formatTime(m.time)}` : ''].filter(Boolean).join(' ')
    const lines = [`⚽ ${head}`, [when, m.venue_name].filter(Boolean).join(' · '), m.category_name, tasoUrl('match', m.match_id)]
    return lines.filter(Boolean).join('\n')
}

export function MatchPage() {
    const { matchId = '' } = useParams()
    const navigate = useNavigate()
    const [searchValue, setSearchValue] = useState(matchId)
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
    const { loading, error, data, fetchData } = useMatchData()
    useDocumentTitle(data ? `${data.match.team_A_name} – ${data.match.team_B_name}` : matchId ? 'Ottelu' : 'Hae ottelu')

    useEffect(() => {
        if (matchId) {
            fetchData(matchId)
            setSearchValue(matchId)
        }
    }, [matchId, fetchData])

    // Live game: refresh every 60 s while the page is open.
    const phase = data ? matchPhase(data.match) : null
    useEffect(() => {
        if (!matchId || (phase !== 'live' && phase !== 'awaiting')) return
        const t = setInterval(() => fetchData(matchId, { silent: true }), 60_000)
        return () => clearInterval(t)
    }, [matchId, phase, fetchData])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        const v = searchValue.trim()
        if (v) navigate(`/match/${v}`)
    }

    const last = getLastSelectedTeamId()
    const fallback = data && last && (data.match.team_A_id === last || data.match.team_B_id === last)
        ? `/team/${last}`
        : data?.match.team_A_id ? `/team/${data.match.team_A_id}` : '/'

    if (error && !loading) {
        return <ErrorState message={error} onRetry={matchId ? () => fetchData(matchId) : undefined} fallbackTo={fallback} />
    }

    const share = () => {
        if (!data) return
        const text = shareText(data.match)
        if (typeof navigator !== 'undefined' && navigator.share) {
            navigator.share({ text }).catch(() => { /* user closed the share sheet */ })
        } else {
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
        }
    }

    const teamAStanding = data?.group?.teams?.find(t => t.team_id === data.match.team_A_id)
    const teamBStanding = data?.group?.teams?.find(t => t.team_id === data.match.team_B_id)
    const num = (v: unknown) => parseInt(String(v ?? '0'), 10) || 0

    return (
        <div className="min-h-screen px-4 py-4 md:py-8">
            <div className="max-w-3xl mx-auto space-y-6">
                <BackButton className="mb-2" fallbackTo={fallback} />
                {!matchId && (
                    <section className="space-y-2">
                        <h1 className="text-xl font-bold text-text-primary">Hae ottelu numerolla</h1>
                        <p className="text-xs text-text-muted">Ottelun numero löytyy Tulospalvelun osoitteesta (…/match/<b>4208643</b>). Joukkueen tai pelaajan löydät helpommin haulla etusivulta.</p>
                        <form onSubmit={handleSearch} className="flex items-center bg-surface-2 border border-border-hairline rounded-lg overflow-hidden">
                            <div className="pl-4 text-text-muted"><Search className="w-5 h-5" /></div>
                            <input
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                inputMode="numeric"
                                placeholder="Ottelun numero"
                                className="grow bg-transparent border-none text-text-primary px-4 py-3"
                            />
                            <Button type="submit" loading={loading}>Hae</Button>
                        </form>
                    </section>
                )}

                {loading && !data && (
                    <div className="space-y-8">
                        <MatchHeaderSkeleton />
                        <StandingsTableSkeleton />
                    </div>
                )}

                {data && (
                    <div className="space-y-8">
                        <MatchHeader match={data.match} group={data.group} teamA={data.teamA} teamB={data.teamB} />

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={share}
                                className="text-xs font-bold px-3 min-h-[44px] rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/30 inline-flex items-center gap-1.5"
                            >
                                <Share2 className="w-4 h-4" /> Jaa ottelu
                            </button>
                        </div>

                        {!isResult(data.match) && data.group && (
                            <CommonOpponents
                                teamAId={data.match.team_A_id}
                                teamBId={data.match.team_B_id}
                                teamAName={data.match.team_A_name}
                                teamBName={data.match.team_B_name}
                                group={data.group}
                            />
                        )}

                        {(teamAStanding || teamBStanding) && (
                            <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
                                <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                                    <h3 className="font-bold text-text-muted uppercase tracking-widest">Sarjatilanne nyt</h3>
                                    <span className="text-text-muted">{data.group?.group_name}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-accent font-bold truncate max-w-[45%]">{data.match.team_A_name}</span>
                                    <span className="text-semantic-blue font-bold truncate max-w-[45%] text-right">{data.match.team_B_name}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm font-mono">
                                    <span>{teamAStanding ? `${teamAStanding.current_standing}. sija` : '–'}</span>
                                    <span className="text-[10px] uppercase tracking-wider text-text-muted font-sans">Sijoitus</span>
                                    <span>{teamBStanding ? `${teamBStanding.current_standing}. sija` : '–'}</span>
                                </div>
                                <DualStatBar label="Pisteet" valueA={num(teamAStanding?.points)} valueB={num(teamBStanding?.points)} />
                                <DualStatBar label="Tehdyt maalit" valueA={num(teamAStanding?.goals_for)} valueB={num(teamBStanding?.goals_for)} />
                                <DualStatBar label="Päästetyt maalit" valueA={num(teamAStanding?.goals_against)} valueB={num(teamBStanding?.goals_against)} />
                                <p className="text-[11px] text-text-muted">Luvut ovat Tulospalvelun sarjataulukosta.</p>
                            </div>
                        )}

                        {!isForfeit(data.match) && <MatchLineups match={data.match} />}

                        {data.group?.teams && data.group.teams.length > 0 && (
                            <section className="space-y-2">
                                <h2 className="text-lg font-bold text-text-primary">Sarjataulukko</h2>
                                <StandingsTable
                                    teams={data.group.teams}
                                    matches={data.group.matches || []}
                                    teamAId={data.match.team_A_id}
                                    teamBId={data.match.team_B_id}
                                    selectedTeam={selectedTeam}
                                    onSelectTeam={setSelectedTeam}
                                    showPointsPerMatch={Number(data.group.show_points_per_match) === 1}
                                />
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
