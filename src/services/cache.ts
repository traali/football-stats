import { MATCH_STATUS } from '../types/matches'

const MEMORY_TTL_MS: Record<string, number> = {
    getMatch: 30 * 1000, // upcoming default; live skips; played uses PLAYED_MEMORY_TTL
    getGroup: 60 * 1000,
    getGroups: 60 * 1000,
    getTeam: 60 * 1000,
    getPlayer: 60 * 1000,
    getCompetitions: 5 * 60 * 1000,
    getCategories: 5 * 60 * 1000,
    getSeasons: 5 * 60 * 1000,
    getMatches: 30 * 1000,
}

const PLAYED_MEMORY_TTL_MS = 30 * 60 * 1000
const UPCOMING_MEMORY_TTL_MS = 30 * 1000

const PERSIST_TTL_MS: Record<string, number> = {
    getMatch: 7 * 24 * 60 * 60 * 1000,
    getGroup: 60 * 1000,
    getGroups: 60 * 1000,
    getTeam: 60 * 1000,
    getPlayer: 60 * 1000,
    getCompetitions: 24 * 60 * 60 * 1000,
    getCategories: 24 * 60 * 60 * 1000,
    getSeasons: 24 * 60 * 60 * 1000,
    getMatches: 30 * 1000,
}

const DEFAULT_TTL_MS = 30 * 1000
const MAX_MEMORY = 500
const MAX_PERSIST = 80
const PERSIST_KEY = 'fs.apiPersist.v1'

const LIVE_STATUSES = new Set(['live', 'started', 'playing', 'inplay', 'in_play', 'ongoing', '2', 'interrupted'])

export type MatchPhase = 'live' | 'upcoming' | 'played'

export function matchPhaseOf(value: unknown, explicit?: string): MatchPhase {
    const st = String(explicit || matchStatusOf(value) || '').toLowerCase().trim()
    if (LIVE_STATUSES.has(st) || st.includes('live') || st.includes('inplay')) return 'live'
    if (value && typeof value === 'object' && 'time' in value && String((value as { time?: string }).time || '').includes("'")) {
        return 'live'
    }
    if (st === MATCH_STATUS.PLAYED.toLowerCase() || st === 'played' || st === '1' || st === 'finished') return 'played'
    return 'upcoming'
}

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
    if (endpoint === 'getMatch') return matchPhaseOf(value, matchStatus) === 'played'
    if (endpoint === 'getTeam' || endpoint === 'getPlayer' || endpoint === 'getMatches' || endpoint === 'getGroup') {
        return false
    }
    return true
}

function memoryTtlMs(endpoint: string, value: unknown, matchStatus?: string): number {
    if (endpoint === 'getMatch') {
        const phase = matchPhaseOf(value, matchStatus)
        if (phase === 'live') return 0
        if (phase === 'played') return PLAYED_MEMORY_TTL_MS
        return UPCOMING_MEMORY_TTL_MS
    }
    return MEMORY_TTL_MS[endpoint] ?? DEFAULT_TTL_MS
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
    const ttl = memoryTtlMs(endpoint, value, matchStatus)
    if (ttl <= 0) return

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
        cache.set(key, { value: disk.value, expiresAt: Date.now() + memoryTtlMs(endpoint, disk.value) })
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
