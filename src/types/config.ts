// =============================================================================
// APP CONFIGURATION
// =============================================================================
// This is the single place to change API settings, rate limits, and year config.
// Search for "HOW TO CHANGE" comments for quick guidance on each setting.
// =============================================================================

export interface APIConfig {
    API_BASE_URL: string;
    CURRENT_YEAR: string;
    PREVIOUS_YEAR: string;
    API_HEADERS: Record<string, string>;
    RATE_LIMIT: {
        /**
         * Maximum total API calls across ALL endpoints per 60-second sliding window.
         * This is a client-side guard only — it does NOT reflect any server-side limit.
         * When hit: the rate limiter queues the request and retries for up to 5 seconds
         * before throwing APIRateLimitError.
         *
         * HOW TO CHANGE: Raise if users report "Palvelun käyttöraja täynnä" errors
         * during normal use. Lower if the API server starts returning 429s.
         * Typical safe range: 30–120.
         */
        MAX_CALLS_PER_MINUTE: number;

        /**
         * Per-endpoint caps within the same 60-second window.
         * These exist to prevent a single heavy page (e.g. MatchPage with 22 players)
         * from consuming the entire global budget.
         *
         * HOW TO CHANGE: Add or edit the endpoint name (must match the API path exactly,
         * e.g. "getMatch", "getPlayer"). Set to a high number (e.g. 999) to effectively
         * disable the per-endpoint cap for that endpoint.
         * Omitting an endpoint = no per-endpoint cap (only global cap applies).
         *
         * WATCH OUT: getMatch cap affects how many different match searches a user can
         * do per minute. Too low = rate limit error after a few searches.
         */
        MAX_CALLS_PER_ENDPOINT: Record<string, number>;

        /**
         * Fixed delay in milliseconds added before every API request.
         * Acts as a minimum spacing between calls to be polite to the API server.
         *
         * HOW TO CHANGE: Set to 0 to remove throttle (fastest, but hammers the API).
         * Raise (e.g. 200–500ms) if the server seems overwhelmed.
         * This delay applies inside batchFetch too, so a batch of 10 items takes
         * at minimum 10 × THROTTLE_DELAY ms regardless of network speed.
         */
        THROTTLE_DELAY: number;
    };
}

export const APP_CONFIG: APIConfig = {
    // -------------------------------------------------------------------------
    // API connection
    // HOW TO CHANGE: Update API_BASE_URL if the API moves to a new domain.
    // API_HEADERS must include the Accept token and Referer — the server rejects
    // requests missing these headers with a non-OK response.
    // -------------------------------------------------------------------------
    API_BASE_URL: "https://spl.torneopal.net/taso/rest/",
    API_HEADERS: {
        Accept: "json/4h7dznqdxwtp3hsfdyf5r793uahfxy7x",
        Referer: "https://tulospalvelu.palloliitto.fi/",
    },

    // -------------------------------------------------------------------------
    // Season years
    // HOW TO CHANGE: Update CURRENT_YEAR each January when the new season starts.
    // PREVIOUS_YEAR = CURRENT_YEAR - 1. Both are used for year-filtering in
    // TeamPage stats and the PlayerPage season comparison.
    // -------------------------------------------------------------------------
    CURRENT_YEAR: "2026",
    PREVIOUS_YEAR: "2025",

    // -------------------------------------------------------------------------
    // Rate limiting
    // See interface comments above for what each setting does.
    // -------------------------------------------------------------------------
    RATE_LIMIT: {
        // Global cap: max requests per 60-second window across all endpoints.
        // Raised from 60 → 120 because MatchPage alone can fire 26 requests.
        MAX_CALLS_PER_MINUTE: 120,

        // Per-endpoint caps. Omitted endpoints have no per-endpoint cap.
        // HOW TO CHANGE: Raise any value if users hit "käyttöraja täynnä" errors.
        // Set to a large number (e.g. 999) to disable a cap without removing it.
        MAX_CALLS_PER_ENDPOINT: {
            // MatchPage: 1 getMatch per search. User can search many matches.
            // Old value was 5 — too low, broke after 5 searches/min. Raised to 30.
            getMatch: 30,

            // getGroup fetches standings + match list. 1-2 calls per GroupPage visit.
            getGroup: 20,

            // getPlayer is called for every player in a match lineup (up to 22).
            // batchFetch with concurrency=5 spreads the calls but we need headroom.
            getPlayer: 80,

            // Discovery/list endpoints — rarely called more than a few times.
            getCompetitions: 10,
            getCategories: 10,
            getMatches: 20,
            getScore: 10,
            getSeasons: 10,
        },

        // Delay between each API call. 100ms = polite but not slow.
        // HOW TO CHANGE: Lower to 0 for max speed (not recommended in production).
        // Raise to 200+ if the server shows signs of throttling (slow responses).
        THROTTLE_DELAY: 100,
    },
};
