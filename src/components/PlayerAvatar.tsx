import { useState } from 'react'
import { User } from 'lucide-react'
import { cn } from '../utils/cn'

export function PlayerAvatar({ src, name, size = 'md', className }: { src?: string | null; name?: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
    const [imgError, setImgError] = useState(false)

    const sizes = { sm: 'w-7 h-7', md: 'w-9 h-9', lg: 'w-14 h-14' }
    const iconSizes = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-7 h-7' }
    const sizeClass = sizes[size]
    const iconClass = iconSizes[size]

    return (
        <div className={cn(
            sizeClass,
            'rounded-full bg-surface-3 flex items-center justify-center shrink-0 border border-border-hairline',
            className,
        )}>
            {src && !imgError ? (
                <img
                    src={src}
                    alt={name || ''}
                    className="w-full h-full rounded-full object-cover"
                    onError={() => setImgError(true)}
                />
            ) : (
                <User className={cn(iconClass, 'text-text-muted')} aria-label={name || 'Player avatar placeholder'} />
            )}
        </div>
    )
}
