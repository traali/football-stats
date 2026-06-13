import { useEffect, useState } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Search } from 'lucide-react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useMatchData } from '../hooks/useMatchData'
import { MatchHeader } from '../components/MatchHeader'
import { PlayerCard } from '../components/PlayerCard'
import { StandingsTable } from '../components/StandingsTable'
import { Button } from '../components/Button'
import { DualStatBar } from '../components/DualStatBar'
import { PreMatchComparison } from '../components/PreMatchComparison'
import { CommonOpponents } from '../components/CommonOpponents'
import { MatchHeaderSkeleton, PlayerCardSkeleton, StandingsTableSkeleton } from '../components/Skeleton'

export function MatchPage() {
    const { matchId = '' } = useParams()
    const navigate = useNavigate()
    const [searchValue, setSearchValue] = useState(matchId)
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
    const [showStickyHeader, setShowStickyHeader] = useState(false)
    const { loading, error, data, fetchData } = useMatchData()

    useEffect(() => {
        setSearchValue(matchId)
        if (matchId.trim()) {
            fetchData(matchId.trim())
        }
    }, [matchId, fetchData])

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 280) {
                setShowStickyHeader(true)
            } else {
                setShowStickyHeader(false)
            }
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        const trimmedMatchId = searchValue.trim()
        if (!trimmedMatchId) return
        navigate(`/match/${trimmedMatchId}`)
    }

    const teamAPlayers = data?.players?.filter(p => p.teamIdInMatch === data.match.team_A_id) ?? []
    const teamBPlayers = data?.players?.filter(p => p.teamIdInMatch === data.match.team_B_id) ?? []

    const teamAStanding = data?.group?.teams?.find(t => t.team_id === data?.match?.team_A_id)
    const teamBStanding = data?.group?.teams?.find(t => t.team_id === data?.match?.team_B_id)
    const teamATotalGoals = teamAStanding ? parseInt(teamAStanding.goals_for || '0', 10) : 0
    const teamBTotalGoals = teamBStanding ? parseInt(teamBStanding.goals_for || '0', 10) : 0

    const teamARosterGoals = teamAPlayers.reduce((sum, p) => sum + (p.goalsForThisSpecificTeamInSeason || 0), 0)
    const teamBRosterGoals = teamBPlayers.reduce((sum, p) => sum + (p.goalsForThisSpecificTeamInSeason || 0), 0)

    const staggerContainer: Variants = {
        hidden: {},
        visible: { transition: { staggerChildren: 0.04 } },
    }

    return (
        <div className="min-h-screen px-4 py-8 md:py-16">
            {/* Sticky Score Bar */}
            <AnimatePresence>
                {showStickyHeader && data && (
                    <motion.div
                        initial={{ y: -64, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -64, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed top-0 left-0 right-0 z-50 bg-surface-1/95 backdrop-blur-xl border-b border-border-hairline h-14 flex items-center justify-center px-4"
                    >
                        <div className="max-w-6xl w-full flex items-center justify-between">
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors min-h-[36px]"
                            >
                                <span className="font-semibold">&larr; Takaisin</span>
                            </button>
                            
                            <div className="flex items-center gap-3 md:gap-6">
                                <Link
                                    to={`/team/${data.match.team_A_id}`}
                                    className="flex items-center gap-2 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 ring-accent/50 rounded-lg p-0.5"
                                >
                                    <span className="text-xs md:text-sm font-bold text-text-primary truncate max-w-[120px] md:max-w-[180px] text-right hover:text-accent transition-colors">
                                        {data.match.team_A_name}
                                    </span>
                                    {(data.teamA?.img_url || data.teamA?.club_crest) && (
                                        <img src={data.teamA.img_url || data.teamA.club_crest} alt="" className="w-6 h-6 object-contain shrink-0" />
                                    )}
                                </Link>
                                
                                <div className="bg-surface-3 px-3 py-1 rounded-md border border-border-hairline font-mono font-bold text-sm md:text-base tabular-nums flex items-center gap-1 shrink-0">
                                    <span>{data.match.fs_A ?? '-'}</span>
                                    <span className="text-accent">:</span>
                                    <span>{data.match.fs_B ?? '-'}</span>
                                </div>
                                
                                <Link
                                    to={`/team/${data.match.team_B_id}`}
                                    className="flex items-center gap-2 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 ring-accent/50 rounded-lg p-0.5"
                                >
                                    {(data.teamB?.img_url || data.teamB?.club_crest) && (
                                        <img src={data.teamB.img_url || data.teamB.club_crest} alt="" className="w-6 h-6 object-contain shrink-0" />
                                    )}
                                    <span className="text-xs md:text-sm font-bold text-text-primary truncate max-w-[120px] md:max-w-[180px] hover:text-accent transition-colors">
                                        {data.match.team_B_name}
                                    </span>
                                </Link>
                            </div>
                            
                            <div className="w-14 flex justify-end">
                                {data.match.time && data.match.time.includes("'") && (
                                    <span className="flex items-center gap-1 bg-semantic-red/10 border border-semantic-red/20 px-2 py-0.5 rounded text-[10px] font-bold text-semantic-red">
                                        <span className="w-1.5 h-1.5 rounded-full bg-semantic-red animate-pulse" />
                                        LIVE
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-6xl mx-auto space-y-12">
                <header className="text-center space-y-4">
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-text-primary">Match View</h1>
                    <p className="text-text-secondary">Current single-match experience, now on its own route.</p>
                </header>

                <section className="max-w-xl mx-auto">
                    <form onSubmit={handleSearch} className="relative group">
                        <div className="relative flex items-center bg-surface-2 border border-border-hairline rounded-lg overflow-hidden focus-within:border-accent transition-all duration-200">
                            <div className="pl-4 text-text-muted">
                                <Search className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                placeholder="Match ID (esim. 3760372)"
                                className="grow bg-transparent border-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none text-text-primary px-4 py-3 placeholder:text-text-muted text-lg"
                            />
                            <Button type="submit" variant="primary" loading={loading} className="min-w-[100px]">
                                Hae
                            </Button>
                        </div>
                    </form>
                </section>

                <main className="space-y-16">
                    <AnimatePresence mode="wait">
                        {error && !loading && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="p-6 bg-semantic-red/10 border border-semantic-red/20 rounded-lg text-semantic-red text-center"
                            >
                                {error}
                            </motion.div>
                        )}

                        {loading && !error && (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-12"
                            >
                                <MatchHeaderSkeleton />
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                    <div className="lg:col-span-2 space-y-8">
                                        <PlayerCardSkeleton />
                                        <PlayerCardSkeleton />
                                    </div>
                                    <aside>
                                        <StandingsTableSkeleton />
                                    </aside>
                                </div>
                            </motion.div>
                        )}

                        {data ? (
                            <motion.div
                                key={data.match.match_id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-12"
                            >
                                <MatchHeader match={data.match} group={data.group} teamA={data.teamA} teamB={data.teamB} />

                                {data.match.status !== 'Played' && data.group?.matches && (
                                    <PreMatchComparison
                                        teamAId={data.match.team_A_id}
                                        teamBId={data.match.team_B_id}
                                        teamAName={data.match.team_A_name}
                                        teamBName={data.match.team_B_name}
                                        matches={data.group.matches}
                                    />
                                )}

                                {data.match.status !== 'Played' && data.group && (
                                    <CommonOpponents
                                        teamAId={data.match.team_A_id}
                                        teamBId={data.match.team_B_id}
                                        teamAName={data.match.team_A_name}
                                        teamBName={data.match.team_B_name}
                                        group={data.group}
                                        upcomingMatch={data.match}
                                    />
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-4">
                                        <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest">Joukkuevertailu (Ottelu)</h4>
                                        <DualStatBar label="Maalit" valueA={Number(data.match.fs_A || 0)} valueB={Number(data.match.fs_B || 0)} />
                                        <DualStatBar label="Pelaajat" valueA={teamAPlayers.length} valueB={teamBPlayers.length} />
                                    </div>
                                    <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-4">
                                        <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest">Maalitilastot</h4>
                                        <DualStatBar label="Kauden maalit yhteensä" valueA={teamATotalGoals} valueB={teamBTotalGoals} />
                                        <DualStatBar label="Kokoonpanon maalit" valueA={teamARosterGoals} valueB={teamBRosterGoals} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                    <div className="lg:col-span-2 space-y-12">
                                        <div className="space-y-6">
                                            <div className="flex items-center">
                                                <div className="w-1 h-8 mr-4 rounded-full bg-gradient-to-b from-bmw-cyan via-bmw-magenta to-bmw-amber shrink-0" />
                                                <h2 className="text-3xl font-bold text-text-primary">{data.match.team_A_name}</h2>
                                            </div>
                                            <motion.div
                                                className="grid grid-cols-1 md:grid-cols-2 gap-5"
                                                variants={staggerContainer}
                                                initial="hidden"
                                                animate="visible"
                                            >
                                                {teamAPlayers.map(player => (
                                                    <PlayerCard key={player.name + player.shirtNumber} stats={player} />
                                                ))}
                                            </motion.div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex items-center">
                                                <div className="w-1 h-8 mr-4 rounded-full bg-gradient-to-b from-bmw-cyan via-bmw-magenta to-bmw-amber shrink-0" />
                                                <h2 className="text-3xl font-bold text-text-primary">{data.match.team_B_name}</h2>
                                            </div>
                                            <motion.div
                                                className="grid grid-cols-1 md:grid-cols-2 gap-5"
                                                variants={staggerContainer}
                                                initial="hidden"
                                                animate="visible"
                                            >
                                                {teamBPlayers.map(player => (
                                                    <PlayerCard key={player.name + player.shirtNumber} stats={player} />
                                                ))}
                                            </motion.div>
                                        </div>
                                    </div>

                                    <aside className="space-y-8">
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
                                    </aside>
                                </div>
                            </motion.div>
                        ) : !loading && !error && (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-surface-1 border border-border-hairline rounded-xl p-8 text-center text-text-secondary"
                            >
                                Syötä ottelun ID avataksesi ottelusivun.
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    )
}
