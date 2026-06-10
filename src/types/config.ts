export interface APIConfig {
    API_BASE_URL: string;
    CURRENT_YEAR: string;
    PREVIOUS_YEAR: string;
    API_HEADERS: Record<string, string>;
    NO_PLAYER_IMAGE_URL: string;
    DEFAULT_CREST_URL: string;
    PLACEHOLDER_CREST_URL: string;
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
    NO_PLAYER_IMAGE_URL: "https://www.palloliitto.fi/sites/all/themes/palloliitto/images/no-player-image.png",
    DEFAULT_CREST_URL: "https://cdn.torneopal.net/logo/palloliitto/x.png",
    PLACEHOLDER_CREST_URL: "https://placehold.co/40x40/e2e8f0/64748b?text=LOGO",
    RATE_LIMIT: {
        MAX_CALLS_PER_MINUTE: 60,
        MAX_CALLS_PER_ENDPOINT: {
            getMatch: 5,
            getGroup: 3,
            getTeam: 5,
            getPlayer: 50,
        },
        THROTTLE_DELAY: 100,
    },
};
