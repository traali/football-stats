import { APP_CONFIG } from '../types/config';
import type { Category, Competition, DiscoveryMatch, GetMatchesParams, GroupDetails, MatchDetails, PlayerAPIResponse, ScoreEntry, Season, TeamBasic } from '../types/api';

// Simple rate limiter implementation
const lastCallTimes: number[] = [];
const endpointLastCalls: Record<string, number[]> = {};

function checkRateLimit(endpoint?: string): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Global limit
    while (lastCallTimes.length > 0 && lastCallTimes[0] < oneMinuteAgo) {
        lastCallTimes.shift();
    }
    if (lastCallTimes.length >= APP_CONFIG.RATE_LIMIT.MAX_CALLS_PER_MINUTE) {
        return false;
    }

    // Endpoint limit
    if (endpoint) {
        if (!endpointLastCalls[endpoint]) endpointLastCalls[endpoint] = [];
        while (endpointLastCalls[endpoint].length > 0 && endpointLastCalls[endpoint][0] < oneMinuteAgo) {
            endpointLastCalls[endpoint].shift();
        }
        if (APP_CONFIG.RATE_LIMIT.MAX_CALLS_PER_ENDPOINT[endpoint] &&
            endpointLastCalls[endpoint].length >= APP_CONFIG.RATE_LIMIT.MAX_CALLS_PER_ENDPOINT[endpoint]) {
            return false;
        }
        endpointLastCalls[endpoint].push(now);
    }

    lastCallTimes.push(now);
    return true;
}

const FETCH_TIMEOUT = 10000

export async function fetchAPIData<T>(endpoint: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<T> {
    if (!checkRateLimit(endpoint)) {
        throw new Error(`Rate limit exceeded for ${endpoint}. Please try again in a moment.`);
    }

    if (APP_CONFIG.RATE_LIMIT.THROTTLE_DELAY > 0) {
        await new Promise(resolve => setTimeout(resolve, APP_CONFIG.RATE_LIMIT.THROTTLE_DELAY));
    }

    const cleanParams: Record<string, string> = {}
    for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== '') cleanParams[k] = String(v)
    }
    const queryParams = new URLSearchParams(cleanParams).toString();
    const url = `${APP_CONFIG.API_BASE_URL}${endpoint}?${queryParams}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(url, { headers: APP_CONFIG.API_HEADERS, signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
        let errorText = `API call to ${endpoint} failed. Status: ${response.status}`;
        try {
            const errorData = await response.json();
            if (errorData && (errorData.error || errorData.message)) {
                errorText += ` - ${errorData.error?.message || errorData.message}`;
            }
        } catch (e) { /* ignore */ }
        throw new Error(errorText);
    }

    const data = await response.json();
    if (data?.call?.status?.toLowerCase() !== "ok") {
        throw new Error(`API error for ${endpoint}: ${data?.call?.status || 'unknown'}`);
    }
    return data;
}

export async function batchFetch<T>(
    items: string[],
    fetchFn: (id: string) => Promise<T>,
    concurrency = 5,
): Promise<(T | undefined)[]> {
    const results: (T | undefined)[] = []
    for (let i = 0; i < items.length; i += concurrency) {
        const batch = items.slice(i, i + concurrency)
        const settled = await Promise.allSettled(batch.map(id => fetchFn(id)))
        for (const r of settled) {
            results.push(r.status === 'fulfilled' ? r.value : undefined)
        }
    }
    return results
}

export async function getMatchDetails(matchId: string): Promise<MatchDetails> {
    const data = await fetchAPIData<{ match: MatchDetails }>("getMatch", { match_id: matchId });
    if (!data.match) throw new Error(`Match data is invalid for match ID ${matchId}.`);
    return data.match;
}

export async function getGroupDetails(competitionId: string, categoryId: string, groupId: string): Promise<GroupDetails | null> {
    const data = await fetchAPIData<{ group: GroupDetails }>("getGroup", {
        competition_id: competitionId,
        category_id: categoryId,
        group_id: groupId,
        matches: 1,
    });
    return data.group || null;
}

export async function getTeamData(teamId: string): Promise<TeamBasic | null> {
    if (!teamId) return null;
    const data = await fetchAPIData<{ team: TeamBasic }>("getTeam", { team_id: teamId });
    return data.team;
}

export async function getPlayerData(playerId: string): Promise<PlayerAPIResponse> {
    const data = await fetchAPIData<{ player: PlayerAPIResponse }>("getPlayer", { player_id: playerId });
    return data.player;
}

export async function getCompetitions(): Promise<Competition[]> {
    const data = await fetchAPIData<{ competitions?: Competition[] }>("getCompetitions", {});
    return data.competitions || [];
}

export async function getCategories(competitionId: string): Promise<Category[]> {
    const data = await fetchAPIData<{ categories?: Category[] }>("getCategories", {
        competition_id: competitionId,
    });
    return data.categories || [];
}

export async function getMatches(params: GetMatchesParams = {}): Promise<DiscoveryMatch[]> {
    const data = await fetchAPIData<{ matches?: DiscoveryMatch[] }>("getMatches", params as Record<string, string | number | boolean | undefined>);
    return data.matches || [];
}

export async function getScore(params: Pick<GetMatchesParams, 'competition_id' | 'category_id'> = {}): Promise<ScoreEntry[]> {
    const data = await fetchAPIData<{ score?: ScoreEntry[] }>("getScore", params as Record<string, string | number | boolean | undefined>);
    return data.score || [];
}

export async function getSeasons(competitionId: string): Promise<Season[]> {
    const data = await fetchAPIData<{ seasons?: Season[] }>("getSeasons", {
        competition_id: competitionId,
    });
    return data.seasons || [];
}
