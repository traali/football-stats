import { Users } from 'lucide-react'
import { PlayerCard } from './PlayerCard'
import { rosterToStats } from '../utils/rosterToStats'
import type { CardSeasonStats } from '../utils/cardStatsAsOf'

interface P {
    player_id: string
    first_name: string
    last_name: string
    img_url?: string
    birthyear?: string
    shirt_number?: string
    position_fi?: string
    matches?: number
    goals?: number
    assists?: number
    warnings?: number
}

export function TeamRoster({
    players, teamName, level, rosterYear, loading, error, lastSeasonById, cardStats,
}: {
    players: P[]
    teamName?: string
    level?: string
    rosterYear: string
    loading?: boolean
    error?: string | null
    lastSeasonById?: Record<string, { matches?: number; goals?: number }>
    cardStats?: Record<string, CardSeasonStats>
}) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-accent" />
                    {`Kokoonpano ${rosterYear}`}
                    <span className="text-text-muted font-normal text-xs">({players.length})</span>
                </span>
                {loading && <span className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />}
            </h3>
            {error && <p className="text-xs text-semantic-red">{error}</p>}
            {players.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-8">Ei pelaajatietoja</p>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {players.map(p => {
                        const extra = cardStats?.[p.player_id]
                        const base = rosterToStats(p, {
                            teamName,
                            level,
                            lastSeasonGames: extra?.gamesPlayedLastSeason ?? lastSeasonById?.[p.player_id]?.matches,
                            lastSeasonGoals: extra?.goalsScoredLastSeason ?? lastSeasonById?.[p.player_id]?.goals,
                        })
                        return (
                            <PlayerCard
                                key={p.player_id}
                                stats={extra ? { ...base, ...extra } : base}
                            />
                        )
                    })}
                </div>
            )}
        </div>
    )
}
