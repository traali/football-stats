import { Link } from 'react-router-dom'

export function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="glass-card p-10 text-center max-w-lg space-y-4">
                <h1 className="text-4xl font-bold text-white">404</h1>
                <p className="text-gray-400">Sivua ei löytynyt.</p>
                <Link to="/" className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500 transition-colors">
                    Takaisin etusivulle
                </Link>
            </div>
        </div>
    )
}
