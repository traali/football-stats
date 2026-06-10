import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Loader2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMatchData } from '../hooks/useMatchData'
import { MatchHeader } from '../components/MatchHeader'
import { PlayerCard } from '../components/PlayerCard'
import { StandingsTable } from '../components/StandingsTable'

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

    const teamAPlayers = data?.players.filter(p => p.teamIdInMatch === data.match.team_A_id) || []
    const teamBPlayers = data?.players.filter(p => p.teamIdInMatch === data.match.team_B_id) || []

    return (
        <div className="min-h-screen px-4 py-8 md:py-16">
            <div className="max-w-6xl mx-auto space-y-12">
                <header className="text-center space-y-4">
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-text-primary">Match View</h1>
                    <p className="text-text-secondary">Current single-match experience, now on its own route.</p>
                </header>

                <section className="max-w-xl mx-auto">
                    <form onSubmit={handleSearch} className="relative group">
                        <div className="relative flex items-center bg-surface-2 border border-border-hairline rounded-lg overflow-hidden focus-within:border-accent transition-colors duration-200">
                            <div className="pl-4 text-text-muted">
                                <Search className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                placeholder="Match ID (esim. 3760372)"
                                className="flex-grow bg-transparent border-none focus:ring-0 text-text-primary px-4 py-3 placeholder:text-text-muted text-lg"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-accent hover:bg-accent/90 text-text-inverse font-semibold px-8 py-3 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px] active:scale-[0.97]"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Hae'}
                            </button>
                        </div>
                    </form>
                </section>

                <main className="space-y-16">
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="p-6 bg-semantic-red/10 border border-semantic-red/20 rounded-lg text-semantic-red text-center"
                            >
                                {error}
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
                                <MatchHeader match={data.match} group={data.group} />

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                    <div className="lg:col-span-2 space-y-12">
                                        <div className="space-y-6">
                                            <div className="flex items-center">
                                                <div className="w-1 h-8 mr-4 rounded-full bg-gradient-to-b from-bmw-cyan via-bmw-magenta to-bmw-amber shrink-0" />
                                                <h2 className="text-3xl font-black text-text-primary">{data.match.team_A_name}</h2>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {teamAPlayers.map(player => (
                                                    <PlayerCard key={player.name + player.shirtNumber} stats={player} />
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex items-center">
                                                <div className="w-1 h-8 mr-4 rounded-full bg-gradient-to-b from-bmw-cyan via-bmw-magenta to-bmw-amber shrink-0" />
                                                <h2 className="text-3xl font-black text-text-primary">{data.match.team_B_name}</h2>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {teamBPlayers.map(player => (
                                                    <PlayerCard key={player.name + player.shirtNumber} stats={player} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <aside className="space-y-8">
                                        {data.group && (
                                            <StandingsTable
                                                group={data.group}
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
                                className="bg-surface-1 border border-border-hairline rounded-lg p-8 text-center text-text-secondary"
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
