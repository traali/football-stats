import { APP_CONFIG } from '../config'
import { withCache } from './cache'
import type {
    Category,
    Competition,
    DiscoveryMatch,
    GetMatchesParams,
    GroupDetails,
    MatchDetails,
    PlayerAPIResponse,
    ScoreEntry,
    Season,
    TeamBasic,
    TeamResponse,
    GroupResponse,
} from '../types'

// ---------------------------------------------------------------------------
// Typed error classes
// ---------------------------------------------------------------------------
// IMPORTANT: Use these classes (not plain Error) when throwing from this module
// so that pages can show the right message to the user:
//   APINotFoundError  → "Tietoja ei löydy"      (data doesn't exist)
//   APINetworkError   → "Yhteysvirhe"            (server/network problem, retry)
//   APITimeoutError   → "Yhteys aikakatkaistiin" (slow network, retry)
//   APIRateLimitError → "Liikaa pyyntöjä"        (too many calls, wait)
//
// DO NOT throw plain Error() for API failures — it makes it impossible for
// pages to distinguish "not found" from "network broken" from "rate limited".

export class APINotFoundError extends Error {
    readonly type = 'not_found' as const
    constructor(message: string) { super(message); this.name = 'APINotFoundError' }
}
export class APINetworkError extends Error {
    readonly type = 'network' as const
    constructor(message: string) { super(message); this.name = 'APINetworkError' }
}
export class APITimeoutError extends Error {
    readonly type = 'timeout' as const
    constructor(message: string) { super(message); this.name = 'APITimeoutError' }
}
export class APIRateLimitError extends Error {
    readonly type = 'rate_limit' as const
    constructor(message: string) { super(message); this.name = 'APIRateLimitError' }
}

// ---------------------------------------------------------------------------
// Rate limiter — queue-based (never throws immediately, waits up to MAX_WAIT)
// ---------------------------------------------------------------------------
const lastCallTimes: number[] = []
const endpointLastCalls: Record<string, number[]> = {}
const RATE_LIMIT_MAX_WAIT_MS = 5000

async function waitForRateLimit(endpoint?: string, signal?: AbortSignal): Promise<void> {
    const start = Date.now()

    while (true) {
        const now = Date.now()
        if (now - start > RATE_LIMIT_MAX_WAIT_MS) {
            throw new APIRateLimitError(
                'Palvelun käyttöraja täynnä. Yritä hetken päästä uudelleen.'
            )
        }
        if (signal?.aborted) throw new APITimeoutError('Pyyntö peruutettiin')

        // Slide the window
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

        // Blocked — wait 200ms and retry
        await new Promise<void>(resolve => setTimeout(resolve, 200))
    }
}

// ---------------------------------------------------------------------------
// Core fetch with retry + typed errors
// ---------------------------------------------------------------------------
const FETCH_TIMEOUT_MS = 10000
const RETRY_DELAYS_MS = [500, 1000, 2000]

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
    const url = `${APP_CONFIG.API_BASE_URL}${endpoint}?${new URLSearchParams(cleanParams)}`

    let lastError: Error = new APINetworkError('Tuntematon virhe')

    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
        if (signal?.aborted) throw new APITimeoutError('Pyyntö peruutettiin')

        // Wait between retries (not before first attempt)
        if (attempt > 0) {
            const delay = RETRY_DELAYS_MS[attempt - 1]
            await new Promise<void>((resolve, reject) => {
                const t = setTimeout(resolve, delay)
                signal?.addEventListener('abort', () => { clearTimeout(t); reject(new APITimeoutError('Pyyntö peruutettiin')) }, { once: true })
            })
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
        // Chain caller's signal into our per-request controller
        const onAbort = () => controller.abort()
        signal?.addEventListener('abort', onAbort, { once: true })

        try {
            const response = await fetch(url, {
                headers: APP_CONFIG.API_HEADERS,
                signal: controller.signal,
            })
            clearTimeout(timeoutId)
            signal?.removeEventListener('abort', onAbort)

            if (!response.ok) {
                if (response.status === 404) {
                    throw new APINotFoundError(`Tietoja ei löydy (${endpoint} 404)`)
                }
                // 4xx (not 404) → don't retry
                if (response.status >= 400 && response.status < 500) {
                    throw new APINetworkError(
                        `API-virhe ${endpoint}: ${response.status}`
                    )
                }
                // 5xx → retry
                lastError = new APINetworkError(`Palvelinvirhe ${endpoint}: ${response.status}`)
                continue
            }

            const data = await response.json()

            if (data?.call?.status?.toLowerCase() !== 'ok') {
                // API-level "not found" or error
                throw new APINotFoundError(
                    `Tietoja ei löydy (${endpoint}: ${data?.call?.status ?? 'unknown'})`
                )
            }

            return data as T

        } catch (err) {
            clearTimeout(timeoutId)
            signal?.removeEventListener('abort', onAbort)

            // Navigation-triggered abort (caller's signal) — don't retry, don't show error
            if (signal?.aborted) throw new APITimeoutError('Pyyntö peruutettiin')

            // Timeout (our internal 10 s controller fired)
            if (err instanceof DOMException && err.name === 'AbortError') {
                lastError = new APITimeoutError(
                    `Yhteys aikakatkaistiin (${endpoint}). Tarkista verkkoyhteys.`
                )
                continue // retry on timeout
            }

            // Typed errors we threw ourselves — propagate immediately (no retry)
            if (
                err instanceof APINotFoundError ||
                err instanceof APIRateLimitError ||
                err instanceof APITimeoutError
            ) throw err

            // Network-level errors (Failed to fetch, DNS failure etc.) — retry
            if (err instanceof TypeError) {
                lastError = new APINetworkError(
                    `Verkkovirhe (${endpoint}). Tarkista verkkoyhteys.`
                )
                continue
            }

            throw err
        }
    }

    throw lastError
}

// ---------------------------------------------------------------------------
// Batch fetcher — concurrency-limited, individual failures → undefined
// (unchanged behaviour, but with typed signal handling)
// ---------------------------------------------------------------------------
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
        for (const r of settled) {
            results.push(r.status === 'fulfilled' ? r.value : undefined)
        }
    }
    return results
}

// ---------------------------------------------------------------------------
// API functions — all integrated with cache
// ---------------------------------------------------------------------------

export async function getMatchDetails(matchId: string, signal?: AbortSignal): Promise<MatchDetails> {
    const params = { match_id: matchId }
    return withCache('getMatch', params, async () => {
        const data = await fetchAPIData<{ match: MatchDetails }>('getMatch', params, signal)
        if (!data.match) throw new APINotFoundError(`Ottelua ei löydy (ID: ${matchId})`)
        return data.match
    }, undefined) // matchStatus resolved inside cache.ts via the setCached call below
        .then(match => {
            // Re-cache with status so the cache layer can apply the played-only rule.
            // withCache already stored it without matchStatus — overwrite with correct status.
            // (This is a no-op if the match was already cached with the right status.)
            import('./cache').then(({ setCached }) => {
                setCached('getMatch', { match_id: matchId }, match, match.status)
            })
            return match
        })
}

export async function getGroupDetails(
    competitionId: string, categoryId: string, groupId: string, signal?: AbortSignal
): Promise<GroupDetails | null> {
    const params = { competition_id: competitionId, category_id: categoryId, group_id: groupId, matches: '1' }
    return withCache('getGroup', params, async () => {
        const data = await fetchAPIData<{ group: GroupDetails }>('getGroup', { ...params, matches: 1 }, signal)
        return data.group || null
    })
}

/** @deprecated Use getTeamProfile instead — same endpoint, richer return type */
export async function getTeamData(teamId: string, signal?: AbortSignal): Promise<TeamResponse | null> {
    if (!teamId) return null
    return getTeamProfile(teamId, signal)
}

export async function getTeamProfile(teamId: string, signal?: AbortSignal): Promise<TeamResponse | null> {
    if (!teamId) return null
    const params = { team_id: teamId }
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

export async function getScore(
    params: Pick<GetMatchesParams, 'competition_id' | 'category_id'> = {}
): Promise<ScoreEntry[]> {
    const p = params as Record<string, string | undefined>
    const strParams: Record<string, string> = {}
    for (const [k, v] of Object.entries(p)) {
        if (v !== undefined && v !== '') strParams[k] = v
    }
    return withCache('getScore', strParams, async () => {
        const data = await fetchAPIData<{ score?: ScoreEntry[] }>('getScore', p)
        return data.score || []
    })
}

export async function getGroups(
    competitionId: string, categoryId: string, signal?: AbortSignal
): Promise<GroupDetails[]> {
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

export async function getGroupFull(
    competitionId: string, categoryId: string, groupId: string, signal?: AbortSignal
): Promise<GroupResponse | null> {
    const params = { competition_id: competitionId, category_id: categoryId, group_id: groupId, matches: '1' }
    return withCache('getGroup', params, async () => {
        const data = await fetchAPIData<{ group: GroupResponse }>('getGroup', { ...params, matches: 1 }, signal)
        return data.group || null
    })
}
