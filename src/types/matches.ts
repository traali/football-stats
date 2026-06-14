import type { PlayerLineupInfo } from './players'

export interface MatchGoal {
    event_id?: string
    team_id?: string
    player_id?: string
    player_name?: string
    player_shirt_number?: string
    time?: string
    time_min?: string
    score_A?: number
    score_B?: number
    description?: string
}

export interface MatchBooking {
    event_id?: string
    code?: string
    team_id?: string
    player_id?: string
    player_name?: string
    shirt_number?: string
    time?: string
    time_min?: string
}

export interface MatchDetails {
    match_id: string
    competition_id: string
    category_id: string
    group_id: string
    team_A_id: string
    team_B_id: string
    team_A_name: string
    team_B_name: string
    fs_A?: string
    fs_B?: string
    hts_A?: string
    hts_B?: string
    status?: string
    date: string
    time?: string
    category_name: string
    competition_name: string
    referee_1_name?: string
    referee_1_id?: string
    lineups: PlayerLineupInfo[]
    goals?: MatchGoal[]
    bookings?: MatchBooking[]
    venue_name?: string
    weather?: string
    attendance?: string
}

export interface MatchSummary {
    match_id: string
    date: string
    time: string
    team_A_id: string
    team_B_id: string
    team_A_name: string
    team_B_name: string
    fs_A: string
    fs_B: string
    winner_id: string
    status: string
    referee_1_id?: string
}

export interface DiscoveryMatch {
    match_id: string
    competition_id?: string
    category_id?: string
    group_id?: string
    date: string
    time?: string
    team_A_id: string
    team_B_id: string
    team_A_name: string
    team_B_name: string
    fs_A?: string
    fs_B?: string
    status?: string
    winner_id?: string
    [key: string]: unknown
}

export interface ScoreEntry {
    match_id?: string
    competition_id?: string
    category_id?: string
    team_A_name?: string
    team_B_name?: string
    fs_A?: string
    fs_B?: string
    status?: string
    [key: string]: unknown
}

export interface GetMatchesParams {
    competition_id?: string
    category_id?: string
    group_id?: string
    team_id?: string
    date_from?: string
    date_to?: string
    limit?: number
    offset?: number
}

export interface PastMatchDetail {
    date: string
    opponentName: string
    playerTeamScore?: string
    opponentScore?: string
    resultIndicator: 'win' | 'loss' | 'draw' | 'fixture'
    status: string
    playerTeamNameInPastMatch: string
}