import { APP_CONFIG } from '../types/config';

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
    if (endpoint && APP_CONFIG.RATE_LIMIT.MAX_CALLS_PER_ENDPOINT[endpoint]) {
        if (!endpointLastCalls[endpoint]) endpointLastCalls[endpoint] = [];
        while (endpointLastCalls[endpoint].length > 0 && endpointLastCalls[endpoint][0] < oneMinuteAgo) {
            endpointLastCalls[endpoint].shift();
        }
        if (endpointLastCalls[endpoint].length >= APP_CONFIG.RATE_LIMIT.MAX_CALLS_PER_ENDPOINT[endpoint]) {
            return false;
        }
    }

    lastCallTimes.push(now);
    if (endpoint) endpointLastCalls[endpoint].push(now);
    return true;
}

export async function fetchAPIData<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    if (!checkRateLimit(endpoint)) {
        throw new Error(`Rate limit exceeded for ${endpoint}. Please try again in a moment.`);
    }

    if (APP_CONFIG.RATE_LIMIT.THROTTLE_DELAY > 0) {
        await new Promise(resolve => setTimeout(resolve, APP_CONFIG.RATE_LIMIT.THROTTLE_DELAY));
    }

    const queryParams = new URLSearchParams(params).toString();
    const url = `${APP_CONFIG.API_BASE_URL}${endpoint}?${queryParams}`;

    const response = await fetch(url, { headers: APP_CONFIG.API_HEADERS });

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
    if (data.call && data.call.status.toLowerCase() !== "ok") {
        throw new Error(`API error for ${endpoint}: ${data.call.status}`);
    }
    return data;
}

export async function getMatchDetails(matchId: string) {
    const data = await fetchAPIData<{ match: any }>("getMatch", { match_id: matchId });
    if (!data.match) throw new Error(`Match data is invalid for match ID ${matchId}.`);
    return data.match;
}

export async function getGroupDetails(competitionId: string, categoryId: string, groupId: string) {
    const data = await fetchAPIData<{ group: any }>("getGroup", {
        competition_id: competitionId,
        category_id: categoryId,
        group_id: groupId,
        matches: 1,
    });
    return data.group || null;
}

export async function getTeamData(teamId: string) {
    if (!teamId) return null;
    const data = await fetchAPIData<{ team: any }>("getTeam", { team_id: teamId });
    return data;
}

export async function getPlayerData(playerId: string) {
    const data = await fetchAPIData<{ player: any }>("getPlayer", { player_id: playerId });
    return data.player;
}
