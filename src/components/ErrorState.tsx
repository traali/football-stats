import { RotateCw } from 'lucide-react'
import { BackButton } from './BackButton'

export function ErrorState({ message, onRetry, fallbackTo = '/' }: { message: string; onRetry?: () => void; fallbackTo?: string }) {
    return (
        <div className="min-h-[50vh] px-4 py-8 max-w-xl mx-auto space-y-4">
            <BackButton fallbackTo={fallbackTo} />
            <div role="alert" className="bg-surface-1 border border-border-hairline rounded-xl p-6 text-center space-y-4">
                <p className="text-text-primary font-semibold">Hups! {message}</p>
                {onRetry && (
                    <button
                        type="button"
                        onClick={onRetry}
                        className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-lg bg-accent text-text-inverse font-semibold text-sm active:scale-95"
                    >
                        <RotateCw className="w-4 h-4" /> Yritä uudelleen
                    </button>
                )}
            </div>
        </div>
    )
}
