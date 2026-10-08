import { Users } from 'lucide-react'
import { PlayerCard } from './PlayerCard'
import { rosterToStats } from '../utils/rosterToStats'

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
    players, teamName, level, rosterYear, rosterHalf, loading, error, lastSeasonById,
}: {
    players: P[]
    teamName?: string
    level?: string
    rosterYear: string
    rosterHalf?: 'all' | 'kevät' | 'syksy'
    loading?: boolean
    error?: string | null
    lastSeasonById?: Record<string, { matches?: number; goals?: number }>
}) {
    const halfLabel = rosterHalf && rosterHalf !== 'all'
        ? (rosterHalf === 'kevät' ? 'Kevät ' : 'Syksy ')
        : ''

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-accent" />
                    {`Pelaajat ${halfLabel}${rosterYear}`}
                    <span className="text-text-muted font-normal text-xs">({players.length})</span>
                </span>
                {loading && <span className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />}
            </h3>
            {error && <p className="text-xs text-semantic-red">Pelaajatilastoja ei saatu ladattua. Päivitä sivu hetken päästä.</p>}
            {players.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-8">Ei pelaajatietoja</p>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {players.map(p => {
                        const base = rosterToStats(p, {
                            teamName,
                            level,
                            lastSeasonGames: lastSeasonById?.[p.player_id]?.matches,
                            lastSeasonGoals: lastSeasonById?.[p.player_id]?.goals,
                        })
                        return <PlayerCard key={p.player_id} stats={base} />
                    })}
                </div>
            )}
        </div>
    )
}
