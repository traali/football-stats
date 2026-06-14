import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom'

/**
 * Route-level error boundary that distinguishes between:
 *  - Routing 404 (user navigated to a URL with no matching route)
 *  - Data/render crash (a component threw a JS error during render)
 *
 * Previously both cases showed <NotFound> which rendered "404 Sivua ei löytynyt"
 * for any error — including React render crashes, hooks violations, null-pointer
 * errors, etc. This made debugging impossible and misled users.
 *
 * DO NOT replace this with <NotFound /> in routes.tsx. The errorElement at the
 * router root must use this component to give accurate error information.
 */
export function ErrorBoundaryPage() {
    const error = useRouteError()

    const is404 = isRouteErrorResponse(error) && error.status === 404

    if (is404) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="bg-surface-1 border border-border-hairline rounded-xl p-10 max-w-sm w-full text-center space-y-4">
                    <p className="text-6xl font-black text-text-primary">404</p>
                    <p className="text-text-secondary text-sm">Sivua ei löytynyt.</p>
                    <Link
                        to="/"
                        className="inline-block mt-2 px-5 py-2.5 rounded-lg bg-accent text-canvas text-sm font-bold hover:bg-accent/90 transition-colors"
                    >
                        Takaisin etusivulle
                    </Link>
                </div>
            </div>
        )
    }

    // JS render crash / unexpected error — show details so bugs can be reported
    const message = error instanceof Error
        ? error.message
        : typeof error === 'string'
            ? error
            : 'Tuntematon virhe'

    const stack = error instanceof Error ? error.stack : undefined

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="bg-surface-1 border border-border-hairline rounded-xl p-8 max-w-lg w-full space-y-4">
                <p className="text-2xl font-bold text-semantic-red">Sivulla tapahtui virhe</p>
                <p className="text-text-secondary text-sm">
                    Sovelluksessa tapahtui odottamaton virhe. Päivitä sivu tai palaa etusivulle.
                </p>
                <p className="font-mono text-xs text-semantic-red/80 bg-surface-2 rounded-lg px-3 py-2 break-all">
                    {message}
                </p>
                {stack && (
                    <details className="text-xs text-text-muted">
                        <summary className="cursor-pointer hover:text-text-primary transition-colors">
                            Tekninen tiedot (kehittäjille)
                        </summary>
                        <pre className="mt-2 overflow-auto max-h-48 bg-surface-2 rounded-lg p-3 text-[10px] leading-relaxed whitespace-pre-wrap">
                            {stack}
                        </pre>
                    </details>
                )}
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={() => window.location.reload()}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-surface-2 border border-border-hairline text-text-primary text-sm font-medium hover:bg-surface-3 transition-colors"
                    >
                        Päivitä sivu
                    </button>
                    <Link
                        to="/"
                        className="flex-1 px-4 py-2.5 rounded-lg bg-accent text-canvas text-sm font-bold text-center hover:bg-accent/90 transition-colors"
                    >
                        Etusivu
                    </Link>
                </div>
            </div>
        </div>
    )
}
