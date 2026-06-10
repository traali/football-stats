import { Link } from 'react-router-dom'

export function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="bg-surface-1 border border-border-hairline rounded-xl p-10 text-center max-w-lg space-y-4">
                <h1 className="text-4xl font-bold text-text-primary">404</h1>
                <p className="text-text-secondary">Sivua ei löytynyt.</p>
                <Link to="/" className="inline-flex items-center justify-center rounded-md bg-accent px-5 py-3 font-semibold text-text-inverse hover:bg-accent/90 transition-colors active:scale-[0.97]">
                    Takaisin etusivulle
                </Link>
            </div>
        </div>
    )
}
