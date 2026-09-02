import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search } from 'lucide-react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useMatchData } from '../hooks/useMatchData'
import { useMatchEligibility } from '../hooks/useMatchEligibility'
import { useMatchCardStats } from '../hooks/useMatchCardStats'
import { MatchHeader } from '../components/MatchHeader'
import { MatchLineups } from '../components/MatchLineups'
import { StandingsTable } from '../components/StandingsTable'
import { Button } from '../components/Button'
import { BackButton } from '../components/BackButton'
import { DualStatBar } from '../components/DualStatBar'
import { CommonOpponents } from '../components/CommonOpponents'
import { MatchPreviewExport } from '../components/MatchPreviewExport'
import { MatchHeaderSkeleton, PlayerCardSkeleton, StandingsTableSkeleton } from '../components/Skeleton'
import { resolveCrest } from '../utils/crest'
import { MATCH_STATUS } from '../types'
import type { PlayerStats } from '../types'

export function MatchPage() {
    const { matchId = '' } = useParams()
    const navigate = useNavigate()
    const [searchValue, setSearchValue] = useState(matchId)
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
    const [showStickyHeader, setShowStickyHeader] = useState(false)
    const { loading, error, data, fetchData } = useMatchData()
    const eligibility = useMatchEligibility(data?.match, data?.group, data?.teamA, data?.teamB)
    const { byPlayer: cardStats, loading: cardStatsLoading } = useMatchCardStats(data?.match)

    useEffect(() => {
        if (matchId) {
            fetchData(matchId)
            setSearchValue(matchId)
        }
    }, [matchId, fetchData])

    useEffect(() => {
        const handleScroll = () => {
            setShowStickyHeader(window.scrollY > 140)
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchValue.trim()) {
            navigate(`/match/${searchValue.trim()}`)
        }
    }

    const withAsOf = (p: PlayerStats): PlayerStats => {
        const extra = p.playerId ? cardStats[p.playerId] : undefined
        if (!extra) return p
        return { ...p, ...extra }
    }
    const teamAPlayers = (data?.players?.filter(p => p.teamIdInMatch === data.match.team_A_id) ?? []).map(withAsOf)
    const teamBPlayers = (data?.players?.filter(p => p.teamIdInMatch === data.match.team_B_id) ?? []).map(withAsOf)

    const teamAStanding = data?.group?.teams?.find(t => t.team_id === data?.match?.team_A_id)
    const teamBStanding = data?.group?.teams?.find(t => t.team_id === data?.match?.team_B_id)
    const teamAGoalsFor = teamAStanding ? parseInt(String(teamAStanding.goals_for || '0'), 10) : 0
    const teamBGoalsFor = teamBStanding ? parseInt(String(teamBStanding.goals_for || '0'), 10) : 0
    const teamAGoalsAgainst = teamAStanding ? parseInt(String(teamAStanding.goals_against || '0'), 10) : 0
    const teamBGoalsAgainst = teamBStanding ? parseInt(String(teamBStanding.goals_against || '0'), 10) : 0

    const teamARosterGoals = teamAPlayers.reduce((sum, p) => sum + (p.goalsForThisSpecificTeamInSeason || p.goalsThisYear || 0), 0)
    const teamBRosterGoals = teamBPlayers.reduce((sum, p) => sum + (p.goalsForThisSpecificTeamInSeason || p.goalsThisYear || 0), 0)

    const teamAYellows = teamAPlayers.reduce((sum, p) => sum + (p.warningsThisYear || 0), 0)
    const teamBYellows = teamBPlayers.reduce((sum, p) => sum + (p.warningsThisYear || 0), 0)

    const played = data?.match.status === MATCH_STATUS.PLAYED

    return (
        <div className="min-h-screen px-4 py-4 md:py-8">
            <AnimatePresence>
                {showStickyHeader && data && (
                    <motion.div
                        initial={{ y: -64, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -64, opacity: 0 }}
                        className="fixed top-0 left-0 right-0 z-50 bg-surface-1/95 backdrop-blur-xl border-b border-border-hairline pt-[env(safe-area-inset-top,0px)] h-[calc(3.5rem+env(safe-area-inset-top,0px))] flex items-center justify-center px-4"
                    >
                        <div className="max-w-3xl w-full flex items-center justify-between gap-2">
                            <button onClick={() => navigate(-1)} className="text-xs text-text-muted hover:text-text-primary px-2 py-1">← Takaisin</button>
                            <div className="flex items-center gap-3">
                                <Link to={`/team/${data.match.team_A_id}`} className="text-xs font-bold truncate max-w-[120px]">{data.match.team_A_name}</Link>
                                <span className="font-mono font-bold">{data.match.fs_A ?? '-'} : {data.match.fs_B ?? '-'}</span>
                                <Link to={`/team/${data.match.team_B_id}`} className="text-xs font-bold truncate max-w-[120px]">{data.match.team_B_name}</Link>
                            </div>
                            {resolveCrest(data.teamA || {}) ? <span /> : <span />}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-3xl mx-auto space-y-6">
                <BackButton className="mb-2" />
                {!matchId && (
                    <section>
                        <form onSubmit={handleSearch} className="flex items-center bg-surface-2 border border-border-hairline rounded-lg overflow-hidden">
                            <div className="pl-4 text-text-muted"><Search className="w-5 h-5" /></div>
                            <input
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                placeholder="Ottelun tunnus"
                                className="grow bg-transparent border-none text-text-primary px-4 py-3"
                            />
                            <Button type="submit" loading={loading}>Hae</Button>
                        </form>
                    </section>
                )}

                {error && !loading && (
                    <div className="p-6 bg-semantic-red/10 border border-semantic-red/20 rounded-lg text-semantic-red text-center">{error}</div>
                )}
                {loading && !error && (
                    <div className="space-y-8">
                        <MatchHeaderSkeleton />
                        <PlayerCardSkeleton />
                        <StandingsTableSkeleton />
                    </div>
                )}

                {data && (
                    <div className="space-y-10">
                        <MatchHeader match={data.match} group={data.group} teamA={data.teamA} teamB={data.teamB} />

                        <MatchPreviewExport
                            match={data.match}
                            group={data.group}
                            teamAPlayers={teamAPlayers}
                            teamBPlayers={teamBPlayers}
                            byTeam={eligibility.byTeam}
                            byPlayer={eligibility.byPlayer}
                            statsReady={!cardStatsLoading}
                        />

                        {!played && data.group && (
                            <CommonOpponents
                                teamAId={data.match.team_A_id}
                                teamBId={data.match.team_B_id}
                                teamAName={data.match.team_A_name}
                                teamBName={data.match.team_B_name}
                                group={data.group}
                                _upcomingMatch={data.match}
                            />
                        )}

                        <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest">Joukkuevertailu</h4>
                                <div className="flex items-center gap-3 text-xs">
                                    <span className="text-accent font-bold truncate max-w-[130px] text-right">{data.match.team_A_name}</span>
                                    <span className="text-text-muted">vs</span>
                                    <span className="text-semantic-blue font-bold truncate max-w-[130px] text-left">{data.match.team_B_name}</span>
                                </div>
                            </div>
                            <div className="space-y-3 pt-1">
                                {played && (
                                    <DualStatBar label="Ottelun maalit" valueA={Number(data.match.fs_A || 0)} valueB={Number(data.match.fs_B || 0)} />
                                )}
                                <DualStatBar label="Kokoonpanon pelaajat" valueA={teamAPlayers.length} valueB={teamBPlayers.length} />
                                {(teamAStanding || teamBStanding) && (
                                    <>
                                        <DualStatBar label="Tehdyt maalit (sarja)" valueA={teamAGoalsFor} valueB={teamBGoalsFor} />
                                        <DualStatBar label="Päästetyt maalit (sarja)" valueA={teamAGoalsAgainst} valueB={teamBGoalsAgainst} />
                                    </>
                                )}
                                {(teamARosterGoals > 0 || teamBRosterGoals > 0) && (
                                    <DualStatBar label="Kokoonpanon kausimaalit" valueA={teamARosterGoals} valueB={teamBRosterGoals} />
                                )}
                                {(teamAYellows > 0 || teamBYellows > 0) && (
                                    <DualStatBar label="Kokoonpanon varoitukset" valueA={teamAYellows} valueB={teamBYellows} />
                                )}
                            </div>
                        </div>

                        <MatchLineups
                            teamAName={data.match.team_A_name}
                            teamBName={data.match.team_B_name}
                            teamAPlayers={teamAPlayers}
                            teamBPlayers={teamBPlayers}
                            teamAId={data.match.team_A_id}
                            teamBId={data.match.team_B_id}
                            byTeam={eligibility.byTeam}
                            byPlayer={eligibility.byPlayer}
                        />
                        {eligibility.loading && (
                            <p className="text-xs text-text-muted">Lasketaan pelioikeutta…</p>
                        )}
                        <p className="text-[11px] text-text-muted">
                            Pelioikeus: KM 2026 §15, Etelä. Päätöstuki, ei korvaa TASOa.
                        </p>

                        {data.group?.teams && (
                            <StandingsTable
                                teams={data.group.teams}
                                matches={data.group.matches || []}
                                teamAId={data.match.team_A_id}
                                teamBId={data.match.team_B_id}
                                selectedTeam={selectedTeam}
                                onSelectTeam={setSelectedTeam}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
