import type { APIConfig } from './types/config'

// =============================================================================
// APP CONFIGURATION — Runtime constant
// =============================================================================

export const APP_CONFIG: APIConfig = {
    API_BASE_URL: "https://spl.torneopal.net/taso/rest/",
    API_HEADERS: {
        Accept: "json/4h7dznqdxwtp3hsfdyf5r793uahfxy7x",
        Referer: "https://tulospalvelu.palloliitto.fi/",
    },

    CURRENT_YEAR: "2026",
    PREVIOUS_YEAR: "2025",

    RATE_LIMIT: {
        MAX_CALLS_PER_MINUTE: 120,
        MAX_CALLS_PER_ENDPOINT: {
            getMatch: 30,
            getGroup: 20,
            getPlayer: 80,
            getCompetitions: 10,
            getCategories: 10,
            getMatches: 20,
            getSeasons: 10,
        },
        THROTTLE_DELAY: 100,
    },
}