import { useEffect, useState } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Search } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMatchData } from '../hooks/useMatchData'
import { MatchHeader } from '../components/MatchHeader'
import { PlayerCard } from '../components/PlayerCard'
import { StandingsTable } from '../components/StandingsTable'
import { Button } from '../components/Button'
import { DualStatBar } from '../components/DualStatBar'
import { MatchHeaderSkeleton, PlayerCardSkeleton, StandingsTableSkeleton } from '../components/Skeleton'

export function MatchPage() {
    const { matchId = '' } = useParams()
    const navigate = useNavigate()
    const [searchValue, setSearchValue] = useState(matchId)
    const { loading, error, data, fetchData } = useMatchData()

    useEffect(() => {
        setSearchValue(matchId)
        if (matchId.trim()) {
            fetchData(matchId.trim())
        }
    }, [matchId, fetchData])

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        const trimmedMatchId = searchValue.trim()
        if (!trimmedMatchId) return
        navigate(`/match/${trimmedMatchId}`)
    }

    const teamAPlayers = data?.players?.filter(p => p.teamIdInMatch === data.match.team_A_id) ?? []
    const teamBPlayers = data?.players?.filter(p => p.teamIdInMatch === data.match.team_B_id) ?? []

    const staggerContainer: Variants = {
        hidden: {},
        visible: { transition: { staggerChildren: 0.04 } },
    }

    return (
        <div className="min-h-screen px-4 py-8 md:py-16">
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

                                <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-4">
                                    <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest">Joukkuevertailu</h4>
                                    <DualStatBar label="Maalit" valueA={Number(data.match.fs_A || 0)} valueB={Number(data.match.fs_B || 0)} />
                                    <DualStatBar label="Pelaajat" valueA={teamAPlayers.length} valueB={teamBPlayers.length} />
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
                                                teamAId={data.match.team_A_id}
                                                teamBId={data.match.team_B_id}
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
