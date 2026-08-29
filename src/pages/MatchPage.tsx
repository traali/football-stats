import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search } from 'lucide-react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useMatchData } from '../hooks/useMatchData'
import { useMatchEligibility } from '../hooks/useMatchEligibility'
import { MatchHeader } from '../components/MatchHeader'
import { MatchLineups } from '../components/MatchLineups'
import { StandingsTable } from '../components/StandingsTable'
import { Button } from '../components/Button'
import { DualStatBar } from '../components/DualStatBar'
import { PreMatchComparison } from '../components/PreMatchComparison'
import { CommonOpponents } from '../components/CommonOpponents'
import { MatchHeaderSkeleton, PlayerCardSkeleton, StandingsTableSkeleton } from '../components/Skeleton'
import { resolveCrest } from '../utils/crest'
import { MATCH_STATUS } from '../types'

export function MatchPage() {
    const { matchId = '' } = useParams()
    const navigate = useNavigate()
    const [searchValue, setSearchValue] = useState(matchId)
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
    const [showStickyHeader, setShowStickyHeader] = useState(false)
    const { loading, error, data, fetchData } = useMatchData()
    const eligibility = useMatchEligibility(data?.match, data?.group, data?.teamA, data?.teamB)

    useEffect(() => {
        setSearchValue(matchId)
        if (matchId.trim()) fetchData(matchId.trim())
    }, [matchId, fetchData])

    useEffect(() => {
        const onScroll = () => setShowStickyHeader(window.scrollY > 280)
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        const trimmed = searchValue.trim()
        if (trimmed) navigate(`/match/${trimmed}`)
    }

    const teamAPlayers = data?.players?.filter(p => p.teamIdInMatch === data.match.team_A_id) ?? []
    const teamBPlayers = data?.players?.filter(p => p.teamIdInMatch === data.match.team_B_id) ?? []

    return (
        <div className="min-h-screen px-4 py-8 md:py-16">
            <AnimatePresence>
                {showStickyHeader && data && (
                    <motion.div
                        initial={{ y: -64, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -64, opacity: 0 }}
                        className="fixed top-0 left-0 right-0 z-50 bg-surface-1/95 backdrop-blur-xl border-b border-border-hairline h-14 flex items-center justify-center px-4"
                    >
                        <div className="max-w-3xl w-full flex items-center justify-between gap-2">
                            <button onClick={() => navigate(-1)} className="text-xs text-text-muted">← Takaisin</button>
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

            <div className="max-w-3xl mx-auto space-y-10">
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

                        {data.match.status !== MATCH_STATUS.PLAYED && data.group?.matches && (
                            <PreMatchComparison
                                teamAId={data.match.team_A_id}
                                teamBId={data.match.team_B_id}
                                teamAName={data.match.team_A_name}
                                teamBName={data.match.team_B_name}
                                matches={data.group.matches}
                            />
                        )}
                        {data.match.status !== MATCH_STATUS.PLAYED && data.group && (
                            <CommonOpponents
                                teamAId={data.match.team_A_id}
                                teamBId={data.match.team_B_id}
                                teamAName={data.match.team_A_name}
                                teamBName={data.match.team_B_name}
                                group={data.group}
                                upcomingMatch={data.match}
                            />
                        )}

                        <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-4">
                            <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest">Joukkuevertailu</h4>
                            <DualStatBar label="Maalit" valueA={Number(data.match.fs_A || 0)} valueB={Number(data.match.fs_B || 0)} />
                            <DualStatBar label="Pelaajat" valueA={teamAPlayers.length} valueB={teamBPlayers.length} />
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
