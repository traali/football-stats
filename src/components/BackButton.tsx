import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
    to?: string
    fallbackTo?: string
    label?: string
    className?: string
}

export function BackButton({ to = '-1', fallbackTo = '/', label = 'Takaisin', className = '' }: BackButtonProps) {
    const navigate = useNavigate()
    const handleClick = () => {
        if (to !== '-1') {
            navigate(to)
            return
        }
        const idx = (window.history.state as { idx?: number } | null)?.idx
        if (typeof idx === 'number' ? idx > 0 : window.history.length > 1) {
            navigate(-1)
        } else {
            navigate(fallbackTo)
        }
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`
                inline-flex items-center gap-2 px-3 py-2 -ml-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-2 active:bg-surface-3 transition-colors text-sm font-medium min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 ring-accent/50
                ${className}
            `}
            aria-label={label}
        >
            <ArrowLeft className="w-4 h-4 text-accent shrink-0" />
            <span>{label}</span>
        </button>
    )
}
