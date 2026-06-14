// =============================================================================
// APP CONFIGURATION — Type definitions only
// Runtime config lives in src/config.ts
// =============================================================================

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