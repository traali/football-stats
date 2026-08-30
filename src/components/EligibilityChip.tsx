import { AlertTriangle } from 'lucide-react'
import { cn } from '../utils/cn'
import type { PlayerEligibilityResult } from '../domain/eligibility'

const STYLES = {
    ok: 'bg-semantic-green/15 text-semantic-green border-semantic-green/30',
    warn: 'bg-semantic-amber/15 text-semantic-amber border-semantic-amber/30',
    block: 'bg-semantic-red/15 text-semantic-red border-semantic-red/30',
} as const

export function EligibilityChip({ result }: { result?: PlayerEligibilityResult }) {
    if (!result || result.verdict === 'ok') return null
    const label = result.verdict === 'block' ? 'Ylempi taso' : 'Tarkista'
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
    used, max, exceptions, yellows, name,
}: {
    used: number
    max: number
    exceptions?: number
    yellows?: number
    name?: string
}) {
    const over = used > max
    return (
        <div className="flex flex-col items-end gap-1.5 shrink-0 text-right" title="KM 2026 §15 kokoonpanotilastot ja pelioikeus">
            {name && <span className="text-[10px] text-text-muted truncate max-w-[160px]">{name}</span>}
            <div className="flex items-center gap-2 flex-wrap justify-end">
                {typeof yellows === 'number' && yellows > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-semantic-amber bg-semantic-amber/10 border border-semantic-amber/25 px-2 py-0.5 rounded-md">
                        <span className="w-2 h-2.5 bg-semantic-amber rounded-[1px] inline-block shadow-sm" />
                        <span>{yellows} {yellows === 1 ? 'varoitus' : 'varoitusta'}</span>
                    </span>
                )}
                <span className={cn(
                    'inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md border',
                    over ? 'bg-semantic-red/15 text-semantic-red border-semantic-red/40 shadow-sm' : 'bg-surface-2 text-text-primary border-border-hairline'
                )}>
                    {over && <AlertTriangle className="w-3.5 h-3.5 text-semantic-red shrink-0" />}
                    <span>{over ? `Ylhäältä ${used}/${max} (Kiintiö ylittynyt!)` : `Ylhäältä ${used}/${max}`}</span>
                    {typeof exceptions === 'number' && exceptions > 0 && (
                        <span className="ml-1 text-semantic-amber font-semibold">
                            · {exceptions} {exceptions === 1 ? 'poikkeuslupa' : 'poikkeuslupaa'}
                        </span>
                    )}
                </span>
            </div>
            <div className="w-32 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                <div className={cn('h-full transition-all', over ? 'bg-semantic-red' : 'bg-accent')} style={{ width: `${Math.min(100, max === 0 ? 0 : (used / max) * 100)}%` }} />
            </div>
        </div>
    )
}
