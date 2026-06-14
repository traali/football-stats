import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
    to?: string
    label?: string
    className?: string
}

export function BackButton({ to = '-1', label = 'Takaisin', className = '' }: BackButtonProps) {
    const navigate = useNavigate()
    const handleClick = () => {
        if (to === '-1') {
            navigate(-1)
        } else {
            navigate(to)
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