import { ExternalLink } from 'lucide-react'
import { tasoUrl, type TasoKind } from '../utils/tasoLinks'
import { cn } from '../utils/cn'

/** "Avaa tulospalvelussa" — the exact page in Palloliitto's own service. */
export function TasoLink({ kind, id, href, label = 'Avaa tulospalvelussa', className }: {
    kind?: TasoKind
    id?: string | number
    /** Use a ready Taso URL instead of kind + id. */
    href?: string
    label?: string
    className?: string
}) {
    const url = href || (kind && id ? tasoUrl(kind, id) : '')
    if (!url) return null
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn('inline-flex items-center gap-1.5 min-h-[44px] text-xs font-semibold text-accent hover:underline', className)}
        >
            <ExternalLink className="w-3.5 h-3.5" /> {label}
        </a>
    )
}
