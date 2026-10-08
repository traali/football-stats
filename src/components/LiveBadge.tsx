import { cn } from '../utils/cn'

export function LiveBadge({ awaiting = false, className }: { awaiting?: boolean; className?: string }) {
    if (awaiting) {
        return (
            <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-semantic-amber/10 border border-semantic-amber/30 text-[10px] font-bold uppercase tracking-wide text-semantic-amber', className)}>
                Tulosta odotetaan
            </span>
        )
    }
    return (
        <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-semantic-red/10 border border-semantic-red/30 text-[10px] font-bold uppercase tracking-wide text-semantic-red', className)}>
            <span className="w-1.5 h-1.5 rounded-full bg-semantic-red animate-pulse" /> Käynnissä
        </span>
    )
}
