import { cn } from '../utils/cn'
import type { PlayerEligibilityResult } from '../domain/eligibility'

const STYLES = {
    ok: 'bg-semantic-green/15 text-semantic-green border-semantic-green/30',
    warn: 'bg-semantic-amber/15 text-semantic-amber border-semantic-amber/30',
    block: 'bg-semantic-red/15 text-semantic-red border-semantic-red/30',
} as const

export function EligibilityChip({ result }: { result?: PlayerEligibilityResult }) {
    if (!result || result.verdict === 'ok') return null
    const label = result.verdict === 'block' ? 'Estetty' : 'Tarkista'
    return (
        <span
            title={result.reasons[0]?.messageFi}
            className={cn(
                'inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border',
                STYLES[result.verdict],
            )}
        >
            {label}
        </span>
    )
}

export function SquadQuotaBar({
    used, max, exceptions, name,
}: {
    used: number
    max: number
    exceptions?: number
    name?: string
}) {
    const over = used > max
    return (
        <div className="flex flex-col items-end gap-0.5 shrink-0 text-right" title="KM 2026 §15 ylhäältä alas">
            {name && <span className="text-[10px] text-text-muted truncate max-w-[160px]">{name}</span>}
            <span className={cn('text-[11px] font-bold', over ? 'text-semantic-red' : 'text-text-primary')}>
                Ylhäältä {used}/{max}
            </span>
            {typeof exceptions === 'number' && exceptions > 0 && (
                <span className="text-[11px] font-semibold text-semantic-amber">
                    Poikkeuslupa {exceptions}
                </span>
            )}
            <div className="w-24 h-1 rounded-full bg-surface-3 overflow-hidden">
                <div className={cn('h-full', over ? 'bg-semantic-red' : 'bg-accent')} style={{ width: `${Math.min(100, max === 0 ? 0 : (used / max) * 100)}%` }} />
            </div>
        </div>
    )
}
