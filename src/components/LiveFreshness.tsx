import { cn } from '../utils/cn'
import { liveFreshness, STALE_NOTE } from '../utils/freshness'

/** "(päivitetty klo HH.MM)" for a live score; adds a gentle note when older than 3 min. Render only for live games. */
export function LiveFreshness({ fetchedAt, now, className }: { fetchedAt?: number | null; now?: Date; className?: string }) {
    const f = liveFreshness(fetchedAt, now ?? new Date())
    if (!f) return null
    return (
        <span className={cn('text-[10px] text-text-muted', className)} data-testid="live-freshness">
            {f.label}
            {f.stale && <span className="text-semantic-amber ml-1" data-testid="live-stale">{STALE_NOTE}</span>}
        </span>
    )
}
