/**
 * Cross-Repo Contract Adapter for football-stats
 * Canonical Contracts v1.0.0
 */

export const CONTRACT_VERSION = '1.0.0' as const

export type SupportedSport = 'football' | 'volleyball' | 'floorball' | 'basketball' | 'weather' | 'other'

export interface MatchdayContextContract {
    eventId: string
    sport: SupportedSport
    startTime: string
    warmupTime?: string
    homeTeam: string
    awayTeam: string
    venueName: string
    coordinates?: {
        latitude: number
        longitude: number
    }
    association?: 'palloliitto' | 'salibandy' | 'basket' | 'torneopal' | 'fmi' | 'other'
    externalId?: string
}

export interface SportStatsContract {
    sport: SupportedSport
    matchOrTeamId: string
    recentForm?: string[]
    standingsSummary?: {
        rank: number
        totalTeams: number
        points: number
        playedMatches: number
    }
    headToHead?: {
        wins: number
        draws: number
        losses: number
        lastResult?: string
    }
    headToHeadSummary: {
        matchesPlayed: number
        homeWins: number
        awayWins: number
        draws: number
    }
    recentFormDetails?: {
        home: Array<'W' | 'D' | 'L'>
        away: Array<'W' | 'D' | 'L'>
    }
    recentFormStrings: {
        home: string[]
        away: string[]
    }
    keyMetrics?: Record<string, string | number>
    deepLinkUrl: string
}

export interface CrossRepoQueryContract {
    theme?: string
    embed?: boolean
    parentOrigin?: string
    targetId?: string
}

/**
 * Builds SportStatsContract compliant payload for football fixtures.
 */
export function buildMatchStatsContract(data: {
    homeTeam: string
    awayTeam: string
    leagueName?: string
    matchId?: string
}): SportStatsContract {
    const id = data.matchId || `${data.homeTeam}-${data.awayTeam}`
    const numeric = !!data.matchId && /^\d+$/.test(data.matchId)
    const deepLinkUrl = numeric
        ? `https://football-stats-agk.pages.dev/#/match/${encodeURIComponent(data.matchId!)}`
        : `https://football-stats-agk.pages.dev/#/search?q=${encodeURIComponent(`${data.homeTeam} ${data.awayTeam}`)}`
    return {
        sport: 'football',
        matchOrTeamId: id,
        recentForm: [],
        recentFormStrings: {
            home: [],
            away: [],
        },
        headToHeadSummary: {
            matchesPlayed: 0,
            homeWins: 0,
            awayWins: 0,
            draws: 0,
        },
        deepLinkUrl,
    }
}
