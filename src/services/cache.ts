import { MATCH_STATUS } from '../types/matches'

const MEMORY_TTL_MS: Record<string, number> = {
    getMatch: 30 * 60 * 1000,
    getGroup: 15 * 60 * 1000,
    getGroups: 15 * 60 * 1000,
    getTeam: 30 * 60 * 1000,
    getPlayer: 30 * 60 * 1000,
    getCompetitions: 60 * 60 * 1000,
    getCategories: 60 * 60 * 1000,
    getSeasons: 60 * 60 * 1000,
    getMatches: 10 * 60 * 1000,
}

const PERSIST_TTL_MS: Record<string, number> = {
    getMatch: 7 * 24 * 60 * 60 * 1000,
    getGroup: 30 * 60 * 1000,
    getGroups: 30 * 60 * 1000,
    getTeam: 12 * 60 * 60 * 1000,
    getPlayer: 12 * 60 * 60 * 1000,
    getCompetitions: 24 * 60 * 60 * 1000,
    getCategories: 24 * 60 * 60 * 1000,
    getSeasons: 24 * 60 * 60 * 1000,
    getMatches: 15 * 60 * 1000,
}

const DEFAULT_TTL_MS = 10 * 60 * 1000
const MAX_MEMORY = 500
const MAX_PERSIST = 80
const PERSIST_KEY = 'fs.apiPersist.v1'

interface CacheEntry<T> {
    value: T
    expiresAt: number
}

interface PersistFile {
    [key: string]: { value: unknown; expiresAt: number; savedAt: number }
}

const cache = new Map<string, CacheEntry<unknown>>()
const inFlight = new Map<string, Promise<unknown>>()

export function makeCacheKey(endpoint: string, params: Record<string, string>): string {
    const sorted = Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('&')
    return `${endpoint}?${sorted}`
}

function matchStatusOf(value: unknown): string | undefined {
    if (value && typeof value === 'object' && 'status' in value) {
        return String((value as { status?: string }).status || '')
    }
    return undefined
}

function allowPersist(endpoint: string, value: unknown, matchStatus?: string): boolean {
    if (endpoint === 'getMatch') {
        const st = matchStatus || matchStatusOf(value)
        return st === MATCH_STATUS.PLAYED
    }
    return true
}

function readPersist(): PersistFile {
    if (typeof localStorage === 'undefined') return {}
    try {
        const raw = localStorage.getItem(PERSIST_KEY)
        return raw ? JSON.parse(raw) as PersistFile : {}
    } catch {
        return {}
    }
}

function writePersist(file: PersistFile) {
    if (typeof localStorage === 'undefined') return
    const entries = Object.entries(file).sort((a, b) => b[1].savedAt - a[1].savedAt).slice(0, MAX_PERSIST)
    try {
        localStorage.setItem(PERSIST_KEY, JSON.stringify(Object.fromEntries(entries)))
    } catch {
        try {
            localStorage.setItem(PERSIST_KEY, JSON.stringify(Object.fromEntries(entries.slice(0, 20))))
        } catch { /* quota */ }
    }
}

function getPersisted<T>(key: string): CacheEntry<T> | undefined {
    const row = readPersist()[key]
    if (!row) return undefined
    return { value: row.value as T, expiresAt: row.expiresAt }
}

function setPersisted<T>(key: string, endpoint: string, value: T) {
    const ttl = PERSIST_TTL_MS[endpoint] ?? DEFAULT_TTL_MS
    const file = readPersist()
    file[key] = { value, expiresAt: Date.now() + ttl, savedAt: Date.now() }
    writePersist(file)
}

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

export function setCached<T>(
    endpoint: string,
    params: Record<string, string>,
    value: T,
    matchStatus?: string,
): void {
    if (!allowPersist(endpoint, value, matchStatus) && endpoint === 'getMatch') return

    const ttl = MEMORY_TTL_MS[endpoint] ?? DEFAULT_TTL_MS
    const key = makeCacheKey(endpoint, params)
    if (cache.size >= MAX_MEMORY) {
        const oldest = cache.keys().next().value
        if (oldest !== undefined) cache.delete(oldest)
    }
    cache.set(key, { value, expiresAt: Date.now() + ttl })
    if (allowPersist(endpoint, value, matchStatus)) setPersisted(key, endpoint, value)
}

export async function withCache<T>(
    endpoint: string,
    params: Record<string, string>,
    fetchFn: () => Promise<T>,
    matchStatus?: string,
): Promise<T> {
    const key = makeCacheKey(endpoint, params)

    const mem = getCached<T>(endpoint, params)
    if (mem !== undefined) return mem

    const disk = getPersisted<T>(key)
    if (disk) {
        cache.set(key, { value: disk.value, expiresAt: Date.now() + (MEMORY_TTL_MS[endpoint] ?? DEFAULT_TTL_MS) })
        if (Date.now() < disk.expiresAt) return disk.value
        if (inFlight.has(key)) return disk.value
        const bg = fetchFn().then(value => {
            setCached(endpoint, params, value, matchStatus || matchStatusOf(value))
            inFlight.delete(key)
            return value
        }).catch(() => {
            inFlight.delete(key)
            return disk.value
        })
        inFlight.set(key, bg)
        return disk.value
    }

    if (inFlight.has(key)) return inFlight.get(key) as Promise<T>

    const promise = fetchFn().then(value => {
        setCached(endpoint, params, value, matchStatus || matchStatusOf(value))
        inFlight.delete(key)
        return value
    }).catch(err => {
        inFlight.delete(key)
        throw err
    })
    inFlight.set(key, promise)
    return promise as Promise<T>
}

export function invalidateCache(endpoint: string, params: Record<string, string>): void {
    const key = makeCacheKey(endpoint, params)
    cache.delete(key)
    const file = readPersist()
    delete file[key]
    writePersist(file)
}
