/**
 * Session-scoped in-memory cache for API responses.
 *
 * Rules:
 * - Cache is keyed by endpoint + sorted params string.
 * - Each entry has a TTL after which it is considered stale and re-fetched.
 * - In-flight requests are stored as Promises so parallel callers for the
 *   same key get the same Promise (deduplication — no double-fetching).
 * - Match data (getMatch) is ONLY cached when match.status === 'Played'.
 *   Fixtures and live games are never cached so scores stay real-time.
 * - Cache is NOT persisted (resets on page reload) — we want fresh data
 *   each session but instant re-navigation within a session.
 *
 * DO NOT add localStorage persistence here: API data changes during the day.
 */

const TTL_MS: Record<string, number> = {
    getMatch: 10 * 60 * 1000,       // 10 min — but only for finished matches
    getGroup: 5 * 60 * 1000,        // 5 min — standings change during match days
    getGroups: 5 * 60 * 1000,
    getTeam: 10 * 60 * 1000,        // 10 min — rosters rarely change
    getPlayer: 10 * 60 * 1000,
    getCompetitions: 15 * 60 * 1000,
    getCategories: 15 * 60 * 1000,

    getSeasons: 15 * 60 * 1000,
    getMatches: 5 * 60 * 1000,
}

const DEFAULT_TTL_MS = 5 * 60 * 1000
const MAX_CACHE_SIZE = 500

interface CacheEntry<T> {
    value: T
    expiresAt: number
}

// Stores resolved values
const cache = new Map<string, CacheEntry<unknown>>()
// Stores in-flight promises to deduplicate concurrent requests
const inFlight = new Map<string, Promise<unknown>>()

function makeCacheKey(endpoint: string, params: Record<string, string>): string {
    const sorted = Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('&')
    return `${endpoint}?${sorted}`
}

/**
 * Try to get a cached value. Returns undefined if missing or stale.
 */
export function getCached<T>(endpoint: string, params: Record<string, string>): T | undefined {
    const key = makeCacheKey(endpoint, params)
    const entry = cache.get(key) as CacheEntry<T> | undefined
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
        cache.delete(key)
        return undefined
    }
    return entry.value
}

/**
 * Store a value in the cache.
 * For 'getMatch', only cache when matchStatus === 'Played'.
 * Pass matchStatus = undefined for all other endpoints.
 */
export function setCached<T>(
    endpoint: string,
    params: Record<string, string>,
    value: T,
    matchStatus?: string,
): void {
    // Match cache rule: never cache fixtures or live games
    if (endpoint === 'getMatch' && matchStatus !== 'Played') return

    const ttl = TTL_MS[endpoint] ?? DEFAULT_TTL_MS
    const key = makeCacheKey(endpoint, params)

    if (cache.size >= MAX_CACHE_SIZE) {
        const oldest = cache.keys().next().value
        if (oldest !== undefined) cache.delete(oldest)
    }

    cache.set(key, { value, expiresAt: Date.now() + ttl })
}

/**
 * Wrap a fetch function with cache + in-flight deduplication.
 * The fetchFn receives the cache key and should return a fresh value.
 *
 * Usage:
 *   const data = await withCache('getTeam', { team_id: '123' }, () => actualFetch())
 */
export async function withCache<T>(
    endpoint: string,
    params: Record<string, string>,
    fetchFn: () => Promise<T>,
    matchStatus?: string,
): Promise<T> {
    const key = makeCacheKey(endpoint, params)

    // 1. Serve from cache if fresh
    const cached = getCached<T>(endpoint, params)
    if (cached !== undefined) return cached

    // 2. Deduplicate: if same request is already in-flight, wait for it
    if (inFlight.has(key)) {
        return inFlight.get(key) as Promise<T>
    }

    // 3. Kick off real fetch, store in inFlight map
    const promise = fetchFn().then(value => {
        setCached(endpoint, params, value, matchStatus)
        inFlight.delete(key)
        return value
    }).catch(err => {
        inFlight.delete(key)
        throw err
    })

    inFlight.set(key, promise)
    return promise
}

/** Manually invalidate a specific cache entry (e.g. after a user action). */
export function invalidateCache(endpoint: string, params: Record<string, string>): void {
    cache.delete(makeCacheKey(endpoint, params))
}


