const ALLOWED = new Set([
    'getMatch', 'getGroup', 'getGroups', 'getTeam', 'getPlayer',
    'getMatches', 'getCompetitions', 'getCategories', 'getSeasons',
])

const PLAYED = new Set(['Played', 'played', '1'])

function cors(res: Response): Response {
    const h = new Headers(res.headers)
    h.set('Access-Control-Allow-Origin', '*')
    h.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    h.set('Access-Control-Allow-Headers', 'Accept, Content-Type')
    return new Response(res.body, { status: res.status, headers: h })
}

function jsonStatus(raw: string): { played: boolean } {
    const start = raw.indexOf('{')
    if (start < 0) return { played: false }
    try {
        const data = JSON.parse(raw.slice(start)) as { match?: { status?: string } }
        return { played: PLAYED.has(String(data.match?.status || '')) }
    } catch {
        return { played: false }
    }
}

export default {
    async fetch(req: Request, env: { TASO_BASE: string; TASO_REFERER: string; TASO_ACCEPT?: string }): Promise<Response> {
        if (req.method === 'OPTIONS') {
            return cors(new Response(null, { status: 204 }))
        }
        if (req.method !== 'GET') {
            return cors(new Response('method', { status: 405 }))
        }

        const url = new URL(req.url)
        const parts = url.pathname.split('/').filter(Boolean)
        const endpoint = parts[parts.length - 1]
        if (!endpoint || !ALLOWED.has(endpoint)) {
            return cors(new Response('endpoint', { status: 400 }))
        }

        const taso = new URL(`${env.TASO_BASE}${endpoint}`)
        url.searchParams.forEach((v, k) => taso.searchParams.set(k, v))

        const cache = caches.default
        const cacheKey = new Request(taso.toString(), { method: 'GET' })
        if (endpoint === 'getMatch') {
            const hit = await cache.match(cacheKey)
            if (hit) return cors(hit)
        }

        const accept = env.TASO_ACCEPT || 'json/4h7dznqdxwtp3hsfdyf5r793uahfxy7x'
        const upstream = await fetch(taso.toString(), {
            headers: { Accept: accept, Referer: env.TASO_REFERER },
        })
        const raw = await upstream.text()
        const played = endpoint === 'getMatch' && jsonStatus(raw).played
        const ttl = played ? 'public, max-age=31536000, immutable' : 'public, max-age=120, stale-while-revalidate=600'

        const out = new Response(raw, {
            status: upstream.status,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Cache-Control': ttl,
                'X-Taso-Cache': played ? 'store-played' : 'short',
            },
        })
        if (played && upstream.ok) {
            await cache.put(cacheKey, out.clone())
        }
        return cors(out)
    },
}
