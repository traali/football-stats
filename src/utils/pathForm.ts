/**
 * Path-form links (/match/4208631?x=1) → hash route (#/match/4208631?x=1).
 *
 * Other apps and agents link to `/match/<id>`, `/team/<id>`, `/player/<id>`, but this app
 * uses a hash router. index.html runs this before the bundle (vite.config.ts inlines it),
 * so it must stay self-contained: no imports, no helpers, plain string methods only.
 *
 * Returns the URL to replace the current one with, or null when nothing needs to move.
 */
export function pathFormTarget(pathname: string, search: string, hash: string, base: string): string | null {
    const root = base.charAt(base.length - 1) === '/' ? base : base + '/'
    let rest = pathname.indexOf(root) === 0 ? pathname.slice(root.length) : pathname.replace(/^\/+/, '')
    rest = rest.replace(/\/+$/, '')
    if (!rest || rest === 'index.html' || rest === '404.html') return null
    // Already a hash route (e.g. /match/1#/match/1): keep the hash, drop the path.
    if (hash.indexOf('#/') === 0) return root + hash
    return root + '#/' + rest + search
}
