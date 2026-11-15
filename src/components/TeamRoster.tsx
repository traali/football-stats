import { Users } from 'lucide-react'
import { RosterCard } from './RosterCard'
import { usePlayerSplits } from '../hooks/usePlayerSplits'

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

/** "P13 Kolmonen: 10 ott · 1 m · 0 var" from this team's own group statistics; empty when none. */
export function teamLineFor(p: Pick<P, 'matches' | 'goals' | 'warnings'>, level?: string): string {
    if (!p.matches) return ''
    const parts = [`${p.matches} ott`]
    if (p.goals !== undefined) parts.push(`${p.goals} m`)
    if (p.warnings !== undefined) parts.push(`${p.warnings} var`)
    return `Tässä joukkueessa${level ? ` (${level})` : ''}: ${parts.join(' · ')}`
}

export function TeamRoster({
    players, level, rosterYear, rosterHalf, loading, error, emptyFallback,
}: {
    players: P[]
    teamName?: string
    level?: string
    rosterYear: string
    rosterHalf?: 'all' | 'kevät' | 'syksy'
    loading?: boolean
    error?: string | null
    lastSeasonById?: Record<string, { matches?: number; goals?: number }>
    /** Shown instead of "Ei pelaajatietoja" when the roster is empty (e.g. a same-name twin team). */
    emptyFallback?: React.ReactNode
}) {
    const halfLabel = rosterHalf && rosterHalf !== 'all'
        ? (rosterHalf === 'kevät' ? 'Kevät ' : 'Syksy ')
        : ''
    const splits = usePlayerSplits(players.map(p => p.player_id), rosterYear)

    return (
        <div className="space-y-3">
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
                emptyFallback || <p className="text-text-muted text-sm text-center py-8">Ei pelaajatietoja</p>
            ) : (
                <>
                    <p className="text-[11px] text-text-muted">Pelaajan kaikki Palloliiton ottelut kaudella, kaikki joukkueet. Ott = ottelut, M = maalit, Var = varoitukset.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                        {players.map(p => (
                            <RosterCard key={p.player_id} player={p} split={splits[p.player_id]} teamLine={teamLineFor(p, level)} />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
