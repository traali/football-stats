import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Trophy, Calendar, Activity, Loader2 } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useMatchData } from './hooks/useMatchData'
import { MatchHeader } from './components/MatchHeader'
import { PlayerCard } from './components/PlayerCard'
import { StandingsTable } from './components/StandingsTable'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export default function App() {
    const [matchId, setMatchId] = useState('')
    const { loading, error, data, fetchData } = useMatchData()

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!matchId.trim()) return
        fetchData(matchId.trim())
    }

    const teamAPlayers = data?.players.filter(p => p.teamIdInMatch === data.match.team_A_id) || []
    const teamBPlayers = data?.players.filter(p => p.teamIdInMatch === data.match.team_B_id) || []

    return (
        <div className="min-h-screen px-4 py-8 md:py-16">
            <div className="max-w-6xl mx-auto space-y-12">
                {/* Header */}
                <header className="text-center space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-center space-x-3"
                    >
                        <div className="p-3 bg-blue-600/20 rounded-2xl border border-blue-500/30">
                            <Trophy className="w-8 h-8 text-blue-400" />
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-white via-blue-100 to-blue-400 bg-clip-text text-transparent">
                            Football Stats
                        </h1>
                    </motion.div>
                </header>

                {/* Search Section */}
                <section className="max-w-xl mx-auto">
                    <form onSubmit={handleSearch} className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
                        <div className="relative flex items-center bg-brand-dark/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden p-2">
                            <div className="pl-4 text-gray-500">
                                <Search className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                value={matchId}
                                onChange={(e) => setMatchId(e.target.value)}
                                placeholder="Match ID (esim. 3760372)"
                                className="flex-grow bg-transparent border-none focus:ring-0 text-white px-4 py-3 placeholder:text-gray-600 text-lg"
                            />
                            <button
                                disabled={loading}
                                className={cn(
                                    "bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]",
                                    loading && "animate-pulse"
                                )}
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Hae'}
                            </button>
                        </div>
                    </form>
                </section>

                {/* Main Content Area */}
                <main className="space-y-16">
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="p-6 bg-red-900/10 border border-red-500/20 rounded-3xl text-red-400 text-center glass"
                            >
                                {error}
                            </motion.div>
                        )}

                        {data ? (
                            <motion.div
                                key="results"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-12"
                            >
                                <MatchHeader match={data.match} group={data.group} />

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                    <div className="lg:col-span-2 space-y-12">
                                        {/* Team A */}
                                        <div className="space-y-6">
                                            <h2 className="text-3xl font-black text-white border-l-4 border-blue-500 pl-4">{data.match.team_A_name}</h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {teamAPlayers.map(player => (
                                                    <PlayerCard key={player.name + player.shirtNumber} stats={player} />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Team B */}
                                        <div className="space-y-6">
                                            <h2 className="text-3xl font-black text-white border-l-4 border-blue-500 pl-4">{data.match.team_B_name}</h2>
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
                                key="welcome"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="grid grid-cols-1 md:grid-cols-3 gap-6"
                            >
                                {[
                                    { icon: Calendar, title: 'Realiaikainen Data', desc: 'Nouda uusimmat ottelutilastot suoraan SPL API:sta.' },
                                    { icon: Activity, title: 'Pelaaja-analyysi', desc: 'Yksityiskohtaiset suoritukset, kortit ja maalit.' },
                                    { icon: Trophy, title: 'Sarjataulukot', desc: 'Näe joukkueesi sijoitus ja pistetilanne lohkossa.' },
                                ].map((feature, i) => (
                                    <div key={i} className="glass-card p-8 flex flex-col items-center text-center space-y-4">
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                            <feature.icon className="w-8 h-8 text-blue-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                                        <p className="text-gray-400">{feature.desc}</p>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>

            {/* Footer */}
            <footer className="mt-24 pt-8 border-t border-white/5 text-center text-gray-600 text-sm">
                <p>&copy; 2026 Pelaajatilastot. Data provided by Suomen Palloliitto.</p>
            </footer>
        </div>
    )
}
