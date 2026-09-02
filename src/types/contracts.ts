/**
 * Cross-Repo Contract Adapter for football-stats
 * Canonical Contracts v1.0.0
 */

export const CONTRACT_VERSION = '1.0.0' as const

export type SupportedSport = 'football' | 'volleyball' | 'floorball' | 'basketball' | 'other'

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
    association?: 'palloliitto' | 'salibandy' | 'basket' | 'torneopal' | 'other'
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
    return {
        sport: 'football',
        matchOrTeamId: id,
        recentForm: ['W', 'W', 'D', 'W', 'L'],
        recentFormStrings: {
            home: ['W', 'W', 'D'],
            away: ['W', 'L', 'W'],
        },
        headToHeadSummary: {
            matchesPlayed: 4,
            homeWins: 2,
            awayWins: 1,
            draws: 1,
        },
        standingsSummary: {
            rank: 1,
            totalTeams: 12,
            points: 28,
            playedMatches: 10,
        },
        deepLinkUrl: `https://football-stats.pages.dev/match/${encodeURIComponent(id)}?theme=night-captain`,
    }
}
