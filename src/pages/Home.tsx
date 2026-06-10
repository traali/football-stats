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
                        <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                            <Trophy className="w-8 h-8 text-accent" />
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-text-primary">
                            Football Stats
                        </h1>
                    </motion.div>
                    <p className="text-text-secondary max-w-2xl mx-auto">
                        Phase 1 keeps the current match lookup intact and prepares the app for broader competition discovery.
                    </p>
                </header>

                <section className="max-w-xl mx-auto">
                    <form onSubmit={handleSubmit} className="relative group">
                        <div className="relative flex items-center bg-surface-2 border border-border-hairline rounded-lg overflow-hidden focus-within:border-accent transition-colors duration-200">
                            <div className="pl-4 text-text-muted">
                                <Search className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                value={matchId}
                                onChange={(e) => setMatchId(e.target.value)}
                                placeholder="Match ID (esim. 3760372)"
                                className="flex-grow bg-transparent border-none focus:ring-0 text-text-primary px-4 py-3 placeholder:text-text-muted text-lg"
                            />
                            <button
                                type="submit"
                                className="bg-accent hover:bg-accent/90 text-text-inverse font-semibold px-8 py-3 rounded-md transition-all duration-200 flex items-center justify-center min-w-[100px] active:scale-[0.97]"
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
                        <div key={i} className="bg-surface-1 border border-border-hairline rounded-lg p-8 flex flex-col items-center text-center space-y-4">
                            <div className="p-4 bg-surface-2 rounded-lg border border-border-hairline">
                                <feature.icon className="w-8 h-8 text-accent" />
                            </div>
                            <h2 className="text-xl font-bold text-text-primary">{feature.title}</h2>
                            <p className="text-text-secondary">{feature.desc}</p>
                        </div>
                    ))}
                </main>

                <footer className="pt-8 border-t border-border-hairline text-center text-text-muted text-sm">
                    <p>&copy; 2026 Pelaajatilastot. Data provided by Suomen Palloliitto.</p>
                </footer>
            </div>
        </div>
    )
}
