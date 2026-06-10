export interface APIConfig {
    API_BASE_URL: string;
    CURRENT_YEAR: string;
    PREVIOUS_YEAR: string;
    API_HEADERS: Record<string, string>;
    RATE_LIMIT: {
        MAX_CALLS_PER_MINUTE: number;
        MAX_CALLS_PER_ENDPOINT: Record<string, number>;
        THROTTLE_DELAY: number;
    };
}

export const APP_CONFIG: APIConfig = {
    API_BASE_URL: "https://spl.torneopal.net/taso/rest/",
    CURRENT_YEAR: "2026",
    PREVIOUS_YEAR: "2025",
    API_HEADERS: {
        Accept: "json/4h7dznqdxwtp3hsfdyf5r793uahfxy7x",
        Referer: "https://tulospalvelu.palloliitto.fi/",
    },
    RATE_LIMIT: {
        MAX_CALLS_PER_MINUTE: 60,
        MAX_CALLS_PER_ENDPOINT: {
            getMatch: 5,
            getGroup: 3,
            getPlayer: 50,
            getCompetitions: 3,
            getCategories: 3,
            getMatches: 5,
            getScore: 3,
            getSeasons: 3,
        },
        THROTTLE_DELAY: 100,
    },
};
