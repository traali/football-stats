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
            onClick={handleClick}
            className={`
                flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors text-sm
                ${className}
            `}
        >
            <ArrowLeft className="w-4 h-4" />
            {label}
        </button>
    )
}
