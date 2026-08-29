import type { APIConfig } from './types/config'

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

export const APP_NAME = 'Pelaajatilastot'

export const FEATURED = {
    teamId: '185085',
    teamName: 'PPJ/Laru sin',
    competitionId: 'etejp26',
    categoryId: 'P133',
    groupId: '4',
    calendarNote: 'Vierumäki 4.–6.9.2026',
}
