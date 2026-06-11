import { type ReactNode } from 'react'
import { cn } from '../utils/cn'

type BadgeVariant = 'default' | 'info' | 'success' | 'warning' | 'danger'

interface StatBadgeProps {
    label: string
    value: string | number
    icon?: ReactNode
    variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, string> = {
    default: 'text-text-secondary bg-surface-3 border-border-hairline',
    info: 'text-semantic-blue bg-semantic-blue/5 border-semantic-blue/10',
    success: 'text-semantic-green bg-semantic-green/5 border-semantic-green/10',
    warning: 'text-semantic-amber bg-semantic-amber/5 border-semantic-amber/10',
    danger: 'text-semantic-red bg-semantic-red/5 border-semantic-red/10',
}

export function StatBadge({ label, value, icon, variant = 'default' }: StatBadgeProps) {
    return (
        <div className={cn(
            'p-3 rounded-md border flex flex-col items-center justify-center text-center',
            variantStyles[variant],
        )}>
            {icon && <div className="mb-1 opacity-60 [&>svg]:w-4 [&>svg]:h-4">{icon}</div>}
            <div className="text-lg font-bold text-text-primary leading-none font-mono tabular-nums">{value}</div>
            <div className="text-xs uppercase tracking-tight opacity-70 mt-1 font-medium">{label}</div>
        </div>
    )
}
