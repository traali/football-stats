import { cn } from '../utils/cn'
import type { PlayerEligibilityResult } from '../domain/eligibility'

const STYLES = {
    ok: 'bg-semantic-green/15 text-semantic-green border-semantic-green/30',
    warn: 'bg-semantic-amber/15 text-semantic-amber border-semantic-amber/30',
    block: 'bg-semantic-red/15 text-semantic-red border-semantic-red/30',
} as const

export function EligibilityChip({ result }: { result?: PlayerEligibilityResult }) {
    if (!result) return null
    const label = result.verdict === 'block'
        ? 'Estetty'
        : result.countsTowardDownQuota
            ? 'Ylhäältä'
            : result.verdict === 'warn'
                ? 'Tarkista'
                : 'OK'
    const hint = result.reasons[0]?.messageFi
    return (
        <span
            title={hint}
            className={cn(
                'inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border',
                STYLES[result.verdict],
            )}
        >
            {label}
        </span>
    )
}

export function SquadQuotaBar({ used, max, name }: { used: number; max: number; name?: string }) {
    const over = used > max
    return (
        <div className="flex flex-col items-end gap-0.5 shrink-0" title="KM 2026 §15 ylhäältä alas">
            <span className={cn(
                'text-[10px] font-bold uppercase tracking-wider',
                over ? 'text-semantic-red' : 'text-text-muted',
            )}>
                {name ? `${name} · ` : ''}Ylhäältä alas {used}/{max}
            </span>
            <div className="w-24 h-1 rounded-full bg-surface-3 overflow-hidden">
                <div
                    className={cn('h-full', over ? 'bg-semantic-red' : 'bg-accent')}
                    style={{ width: `${Math.min(100, max === 0 ? 0 : (used / max) * 100)}%` }}
                />
            </div>
        </div>
    )
}
