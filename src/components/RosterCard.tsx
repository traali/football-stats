import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { SplitState } from '../hooks/usePlayerSplits'
import type { CompKind, PlayerSplit, SplitRow } from '../utils/playerSplit'

export interface RosterCardPlayer {
    player_id: string
    first_name?: string
    last_name?: string
    shirt_number?: string
    birthyear?: string
    position_fi?: string
}

/** Columns shown only when at least one row on this card has the stat from Taso. */
const COLS: Array<{ key: keyof Omit<SplitRow, 'games'>; label: string; title: string }> = [
    { key: 'goals', label: 'M', title: 'Maalit' },
    { key: 'assists', label: 'Syö', title: 'Syötöt' },
    { key: 'warnings', label: 'Var', title: 'Varoitukset (keltaiset)' },
    { key: 'suspensions', label: 'Pun', title: 'Ulosajot (punaiset)' },
    { key: 'minutes', label: 'Min', title: 'Peliminuutit' },
]

const ROWS: Array<{ kind: CompKind; name: string; empty: string }> = [
    { kind: 'football', name: 'Jalkapallo', empty: 'Ei otteluita' },
    { kind: 'winter', name: 'Winterliiga', empty: 'Ei pelaajakohtaisia tilastoja' },
    { kind: 'futsal', name: 'Futsal', empty: 'Ei otteluita' },
]

export function SplitTable({ split }: { split: PlayerSplit }) {
    const rows = [split.football, split.winter, split.futsal]
    const cols = COLS.filter(c => rows.some(r => r[c.key] !== undefined))
    const grid = { gridTemplateColumns: `minmax(0,1fr) repeat(${cols.length + 1}, 2.25rem)` }
    return (
        <div className="text-xs" data-testid="split-table">
            <div className="grid gap-x-1 text-[10px] uppercase tracking-wider text-text-muted pb-0.5" style={grid}>
                <span />
                <span className="text-right" title="Ottelut">Ott</span>
                {cols.map(c => <span key={c.key} className="text-right" title={c.title}>{c.label}</span>)}
            </div>
            {ROWS.map(r => {
                const row = split[r.kind]
                if (row.games === 0) {
                    return (
                        <div key={r.kind} className="flex items-baseline justify-between gap-2 py-0.5 border-t border-border-hairline" data-kind={r.kind}>
                            <span className="text-text-secondary shrink-0">{r.name} <span className="text-text-muted">{split.labels[r.kind]}</span></span>
                            <span className="text-[10px] text-text-muted text-right min-w-0">{r.empty}</span>
                        </div>
                    )
                }
                return (
                    <div key={r.kind} className="grid gap-x-1 py-0.5 border-t border-border-hairline items-baseline" style={grid} data-kind={r.kind}>
                        <span className="text-text-secondary truncate">{r.name} <span className="text-text-muted">{split.labels[r.kind]}</span></span>
                        <span className="text-right font-mono text-text-primary">{row.games}</span>
                        {cols.map(c => <span key={c.key} className="text-right font-mono text-text-primary">{row[c.key] ?? ''}</span>)}
                    </div>
                )
            })}
            <div className="grid gap-x-1 py-0.5 border-t border-border-hairline font-semibold items-baseline" style={grid} data-kind="total">
                <span className="text-text-primary">Yhteensä</span>
                <span className="text-right font-mono text-text-primary">{split.total.games}</span>
                {cols.map(c => <span key={c.key} className="text-right font-mono text-text-primary">{split.total[c.key] ?? ''}</span>)}
            </div>
        </div>
    )
}

/**
 * Compact phone card: name, number, then the player's own Taso stats split by
 * Jalkapallo / Winterliiga / Futsal with a total. `teamLine` is this team's own series line
 * (from getGroup player_statistics); borrowed rosters pass none.
 */
export function RosterCard({ player, split, teamLine }: { player: RosterCardPlayer; split?: SplitState; teamLine?: string }) {
    const name = [player.first_name, player.last_name].filter(Boolean).join(' ')
    const meta = [/^\d{4}$/.test(String(player.birthyear || '')) ? player.birthyear : '', player.position_fi].filter(Boolean).join(' · ')
    return (
        <Link to={`/player/${player.player_id}`} data-testid="roster-card" data-player-id={player.player_id}
            className="block bg-surface-1 border border-border-hairline rounded-xl p-3 space-y-2 hover:border-accent/30 active:scale-[0.99]">
            <div className="flex items-center justify-between gap-2 min-h-[28px]">
                <span className="flex items-baseline gap-2 min-w-0">
                    {player.shirt_number && <span className="text-xs font-mono font-bold text-accent shrink-0">#{player.shirt_number}</span>}
                    <span className="text-sm font-bold text-text-primary truncate">{name}</span>
                    {meta && <span className="text-[11px] text-text-muted shrink-0">{meta}</span>}
                </span>
                <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
            </div>
            {teamLine && <p className="text-[11px] text-text-secondary" data-testid="team-line">{teamLine}</p>}
            {!split || split.status === 'loading' ? (
                <div className="h-16 rounded bg-surface-2 animate-pulse" aria-label="Ladataan tilastoja" />
            ) : split.status === 'error' ? (
                <p className="text-[11px] text-text-muted">Tilastoja ei saatu ladattua.</p>
            ) : (
                <SplitTable split={split.split} />
            )}
        </Link>
    )
}
