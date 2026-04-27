import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Trophy, Calendar, Activity } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function Home() {
    const [matchId, setMatchId] = useState('')
    const navigate = useNavigate()

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        const trimmedMatchId = matchId.trim()
        if (!trimmedMatchId) return
        navigate(`/match/${trimmedMatchId}`)
    }

    return (
        <div className="min-h-screen px-4 py-8 md:py-16">
            <div className="max-w-6xl mx-auto space-y-12">
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
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Phase 1 keeps the current match lookup intact and prepares the app for broader competition discovery.
                    </p>
                </header>

                <section className="max-w-xl mx-auto">
                    <form onSubmit={handleSubmit} className="relative group">
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
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-200 flex items-center justify-center min-w-[100px]"
                            >
                                Hae
                            </button>
                        </div>
                    </form>
                </section>

                <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { icon: Calendar, title: 'Realiaikainen Data', desc: 'Nouda uusimmat ottelutilastot suoraan SPL API:sta.' },
                        { icon: Activity, title: 'Pelaaja-analyysi', desc: 'Yksityiskohtaiset suoritukset, kortit ja maalit.' },
                        { icon: Trophy, title: 'Sarjataulukot', desc: 'Nykyinen ottelunäkymä on siirretty omalle reitilleen.' },
                    ].map((feature, i) => (
                        <div key={i} className="glass-card p-8 flex flex-col items-center text-center space-y-4">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                <feature.icon className="w-8 h-8 text-blue-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">{feature.title}</h2>
                            <p className="text-gray-400">{feature.desc}</p>
                        </div>
                    ))}
                </main>

                <footer className="pt-8 border-t border-white/5 text-center text-gray-600 text-sm">
                    <p>&copy; 2026 Pelaajatilastot. Data provided by Suomen Palloliitto.</p>
                </footer>
            </div>
        </div>
    )
}
