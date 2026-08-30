import { APP_CONFIG } from '../config'
import { withCache, setCached } from './cache'
import { getViewedMatch, rememberViewedMatch } from './viewedCache'
import type {
    Category,
    Competition,
    DiscoveryMatch,
    GetMatchesParams,
    GroupDetails,
    MatchDetails,
    PlayerAPIResponse,
    Season,
    TeamResponse,
    GroupResponse,
} from '../types'

export class APINotFoundError extends Error {
    readonly type = 'not_found' as const
    constructor(message: string) { super(message); this.name = 'APINotFoundError' }
}
export class APIHttpError extends Error {
    readonly type = 'network' as const
    constructor(message: string) { super(message); this.name = 'APIHttpError' }
}
export class APITimeoutError extends Error {
    readonly type = 'timeout' as const
    constructor(message: string) { super(message); this.name = 'APITimeoutError' }
}
export class APIRateLimitError extends Error {
    readonly type = 'rate_limit' as const
    constructor(message: string) { super(message); this.name = 'APIRateLimitError' }
}

const lastCallTimes: number[] = []
const endpointLastCalls: Record<string, number[]> = {}
const RATE_LIMIT_MAX_WAIT_MS = 5000

async function waitForRateLimit(endpoint?: string, signal?: AbortSignal): Promise<void> {
    const start = Date.now()
    while (true) {
        const now = Date.now()
        if (now - start > RATE_LIMIT_MAX_WAIT_MS) {
            throw new APIRateLimitError('Palvelun käyttöraja täynnä. Yritä hetken päästä uudelleen.')
        }
        if (signal?.aborted) throw new APITimeoutError('Pyyntö peruutettiin')
        const oneMinuteAgo = now - 60000
        while (lastCallTimes.length > 0 && lastCallTimes[0] < oneMinuteAgo) lastCallTimes.shift()
        if (endpoint) {
            if (!endpointLastCalls[endpoint]) endpointLastCalls[endpoint] = []
            while (endpointLastCalls[endpoint].length > 0 && endpointLastCalls[endpoint][0] < oneMinuteAgo) {
                endpointLastCalls[endpoint].shift()
            }
        }
        const globalOk = lastCallTimes.length < APP_CONFIG.RATE_LIMIT.MAX_CALLS_PER_MINUTE
        const endpointOk = !endpoint
            || !APP_CONFIG.RATE_LIMIT.MAX_CALLS_PER_ENDPOINT[endpoint]
            || endpointLastCalls[endpoint].length < APP_CONFIG.RATE_LIMIT.MAX_CALLS_PER_ENDPOINT[endpoint]
        if (globalOk && endpointOk) {
            lastCallTimes.push(now)
            if (endpoint) endpointLastCalls[endpoint].push(now)
            return
        }
        await new Promise<void>(resolve => setTimeout(resolve, 200))
    }
}

const FETCH_TIMEOUT_MS = 10000
const RETRY_DELAYS_MS = [500, 1000, 2000]

function requestUrl(endpoint: string, cleanParams: Record<string, string>): string {
    const qs = new URLSearchParams(cleanParams)
    const proxy = String(import.meta.env.VITE_TASO_PROXY || '').replace(/\/$/, '')
    if (proxy) return `${proxy}/${endpoint}?${qs}`
    return `${APP_CONFIG.API_BASE_URL}${endpoint}?${qs}`
}

function requestHeaders(): Record<string, string> {
    if (import.meta.env.VITE_TASO_PROXY) return { Accept: 'application/json' }
    return APP_CONFIG.API_HEADERS
}

export function parseTasoPayload(raw: string): unknown {
    const start = raw.indexOf('{')
    if (start < 0) throw new APIHttpError('Palvelin palautti virheellisen vastauksen')
    const slice = raw.slice(start)
    try {
        return JSON.parse(slice)
    } catch {
        const end = slice.lastIndexOf('}')
        if (end > 0) {
            try { return JSON.parse(slice.slice(0, end + 1)) } catch { /* fall through */ }
        }
        throw new APIHttpError('Palvelin palautti virheellisen vastauksen')
    }
}

export async function fetchAPIData<T>(
    endpoint: string,
    params: Record<string, string | number | boolean | undefined> = {},
    signal?: AbortSignal,
): Promise<T> {
    await waitForRateLimit(endpoint, signal)
    if (APP_CONFIG.RATE_LIMIT.THROTTLE_DELAY > 0) {
        await new Promise(resolve => setTimeout(resolve, APP_CONFIG.RATE_LIMIT.THROTTLE_DELAY))
    }
    const cleanParams: Record<string, string> = {}
    for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== '') cleanParams[k] = String(v)
    }
    const url = requestUrl(endpoint, cleanParams)
    const headers = requestHeaders()
    let lastError: Error = new APIHttpError('Tuntematon virhe')
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
        if (signal?.aborted) throw new APITimeoutError('Pyyntö peruutettiin')
        if (attempt > 0) {
            const delay = RETRY_DELAYS_MS[attempt - 1]
            await new Promise<void>((resolve, reject) => {
                const t = setTimeout(resolve, delay)
                signal?.addEventListener('abort', () => { clearTimeout(t); reject(new APITimeoutError('Pyyntö peruutettiin')) }, { once: true })
            })
        }
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
        const onAbort = () => controller.abort()
        signal?.addEventListener('abort', onAbort, { once: true })
        try {
            const response = await fetch(url, { headers, signal: controller.signal })
            clearTimeout(timeoutId)
            signal?.removeEventListener('abort', onAbort)
            if (!response.ok) {
                if (response.status === 404) throw new APINotFoundError(`Tietoja ei löydy (${endpoint} 404)`)
                if (response.status >= 400 && response.status < 500) throw new APIHttpError(`API-virhe ${endpoint}: ${response.status}`)
                lastError = new APIHttpError(`Palvelinvirhe ${endpoint}: ${response.status}`)
                continue
            }
            const raw = await response.text()
            const data = parseTasoPayload(raw) as { call?: { status?: string } }
            if (data?.call?.status?.toLowerCase() !== 'ok') {
                throw new APINotFoundError(`Tietoja ei löydy (${endpoint}: ${data?.call?.status ?? 'unknown'})`)
            }
            return data as T
        } catch (err) {
            clearTimeout(timeoutId)
            signal?.removeEventListener('abort', onAbort)
            if (signal?.aborted) throw new APITimeoutError('Pyyntö peruutettiin')
            if (err instanceof DOMException && err.name === 'AbortError') {
                lastError = new APITimeoutError(`Yhteys aikakatkaistiin (${endpoint}). Tarkista verkkoyhteys.`)
                continue
            }
            if (err instanceof APINotFoundError || err instanceof APIRateLimitError || err instanceof APITimeoutError) throw err
            if (err instanceof TypeError) {
                lastError = new APIHttpError(`Verkkovirhe (${endpoint}). Tarkista verkkoyhteys.`)
                continue
            }
            throw err
        }
    }
    throw lastError
}

export async function batchFetch<T>(
    items: string[],
    fetchFn: (id: string, signal?: AbortSignal) => Promise<T>,
    concurrency = 5,
    signal?: AbortSignal,
): Promise<(T | undefined)[]> {
    const results: (T | undefined)[] = []
    for (let i = 0; i < items.length; i += concurrency) {
        if (signal?.aborted) return results
        const batch = items.slice(i, i + concurrency)
        const settled = await Promise.allSettled(batch.map(id => fetchFn(id, signal)))
        for (const r of settled) results.push(r.status === 'fulfilled' ? r.value : undefined)
    }
    return results
}

export async function getMatchDetails(matchId: string, signal?: AbortSignal): Promise<MatchDetails> {
    const params = { match_id: matchId }
    try {
        const match = await withCache('getMatch', params, async () => {
            const data = await fetchAPIData<{ match: MatchDetails }>('getMatch', params, signal)
            if (!data.match) throw new APINotFoundError(`Ottelua ei löydy (ID: ${matchId})`)
            setCached('getMatch', params, data.match, data.match.status)
            return data.match
        })
        rememberViewedMatch(match)
        return match
    } catch (err) {
        const local = getViewedMatch(matchId)
        if (local) return local
        throw err
    }
}

export async function getGroupDetails(competitionId: string, categoryId: string, groupId: string, signal?: AbortSignal): Promise<GroupDetails | null> {
    const params = { competition_id: competitionId, category_id: categoryId, group_id: groupId, matches: '1' }
    return withCache('getGroup', params, async () => {
        const data = await fetchAPIData<{ group: GroupDetails }>('getGroup', { ...params, matches: 1 }, signal)
        return data.group || null
    })
}

export async function getTeamProfile(teamId: string, signal?: AbortSignal, extra?: { competition_id?: string; category_id?: string }): Promise<TeamResponse | null> {
    if (!teamId) return null
    const params = {
        team_id: teamId,
        ...(extra?.competition_id ? { competition_id: extra.competition_id } : {}),
        ...(extra?.category_id ? { category_id: extra.category_id } : {}),
    }
    return withCache('getTeam', params, async () => {
        const data = await fetchAPIData<{ team: TeamResponse }>('getTeam', params, signal)
        return data.team || null
    })
}

export async function getPlayerData(playerId: string, signal?: AbortSignal): Promise<PlayerAPIResponse> {
    const params = { player_id: playerId }
    return withCache('getPlayer', params, async () => {
        const data = await fetchAPIData<{ player: PlayerAPIResponse }>('getPlayer', params, signal)
        return data.player
    })
}

export async function getCompetitions(): Promise<Competition[]> {
    return withCache('getCompetitions', {}, async () => {
        const data = await fetchAPIData<{ competitions?: Competition[] }>('getCompetitions', {})
        return data.competitions || []
    })
}

export async function getCategories(competitionId: string): Promise<Category[]> {
    const params = { competition_id: competitionId }
    return withCache('getCategories', params, async () => {
        const data = await fetchAPIData<{ categories?: Category[] }>('getCategories', params)
        return data.categories || []
    })
}

export async function getMatches(params: GetMatchesParams = {}): Promise<DiscoveryMatch[]> {
    const p = params as Record<string, string | number | boolean | undefined>
    const strParams: Record<string, string> = {}
    for (const [k, v] of Object.entries(p)) {
        if (v !== undefined && v !== '') strParams[k] = String(v)
    }
    return withCache('getMatches', strParams, async () => {
        const data = await fetchAPIData<{ matches?: DiscoveryMatch[] }>('getMatches', p)
        return data.matches || []
    })
}

export async function getGroups(competitionId: string, categoryId: string, signal?: AbortSignal): Promise<GroupDetails[]> {
    const params = { competition_id: competitionId, category_id: categoryId }
    return withCache('getGroups', params, async () => {
        const data = await fetchAPIData<{ groups?: GroupDetails[] }>('getGroups', params, signal)
        return data.groups || []
    })
}

export async function getSeasons(competitionId: string): Promise<Season[]> {
    const params = { competition_id: competitionId }
    return withCache('getSeasons', params, async () => {
        const data = await fetchAPIData<{ seasons?: Season[] }>('getSeasons', params)
        return data.seasons || []
    })
}

export async function getTeamMatches(teamId: string, signal?: AbortSignal): Promise<DiscoveryMatch[]> {
    const params = { team_id: teamId }
    return withCache('getMatches', params, async () => {
        const data = await fetchAPIData<{ matches?: DiscoveryMatch[] }>('getMatches', params, signal)
        return data.matches || []
    })
}

export async function getGroupFull(competitionId: string, categoryId: string, groupId: string, signal?: AbortSignal): Promise<GroupResponse | null> {
    const params = { competition_id: competitionId, category_id: categoryId, group_id: groupId, matches: '1' }
    return withCache('getGroup', params, async () => {
        const data = await fetchAPIData<{ group: GroupResponse }>('getGroup', { ...params, matches: 1 }, signal)
        return data.group || null
    })
}
