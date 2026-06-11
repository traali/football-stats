import { forwardRef, type ReactNode, type ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'md' | 'dense'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant
    size?: ButtonSize
    loading?: boolean
    icon?: ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-accent text-text-inverse font-semibold hover:bg-accent/90',
    secondary: 'bg-transparent text-text-primary font-medium border border-border-strong hover:bg-surface-2',
    ghost: 'bg-transparent text-accent font-medium hover:bg-accent-muted',
    danger: 'bg-semantic-red/10 text-semantic-red border border-semantic-red/20 hover:bg-semantic-red/15',
}

const sizeStyles: Record<ButtonSize, string> = {
    md: 'h-11 px-5 py-2 text-sm',
    dense: 'h-10 px-5 py-1.5 text-sm',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', size = 'md', loading, icon, className, disabled, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center rounded-md transition-all duration-200',
                    'active:scale-[0.97]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
                    'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:scale-100',
                    variantStyles[variant],
                    sizeStyles[size],
                    className,
                )}
                disabled={disabled || loading}
                {...props}
            >
                {loading ? (
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                ) : icon ? (
                    <span className="mr-2">{icon}</span>
                ) : null}
                {children}
            </button>
        )
    },
)

Button.displayName = 'Button'
