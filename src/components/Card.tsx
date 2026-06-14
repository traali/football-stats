import { type ReactNode } from 'react'
import { cn } from '../utils/cn'

export function Card({ children, className, padding = true }: { children: ReactNode; className?: string; padding?: boolean }) {
    return (
        <div className={cn(
            'bg-surface-1 border border-border-hairline rounded-xl',
            padding && 'p-5',
            className,
        )}>
            {children}
        </div>
    )
}
