import type { PlayerLineupInfo } from './players'

export const MATCH_STATUS = {
    PLAYED: 'Played',
    FIXTURE: 'Fixture',
    FORFEITED: 'Forfeited',
    PLANNED: 'Planned',
} as const;

export type MatchStatus = typeof MATCH_STATUS[keyof typeof MATCH_STATUS];

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
    group_name?: string
    referee_1_name?: string
    referee_1_id?: string
    referee_1_player_id?: string
    playing_time?: string
    period_count?: string
    venue_city_name?: string
    venue_id?: string
    lineups: PlayerLineupInfo[]
    goals?: MatchGoal[]
    bookings?: MatchBooking[]
    venue_name?: string
    weather?: string
    temperature?: string
    attendance?: string
    venue_lat?: string
    venue_lon?: string
    time_end?: string
    playing_time_min?: string
    live_A?: string
    live_B?: string
    live_time?: string
    live_time_mmss?: string
    live_period?: string
    live_timer_on?: string | number
    periods_played?: string | number
    walkover?: string | number
    forfeit_A?: string
    forfeit_B?: string
    winner_id?: string
    team_A_description?: string
    team_B_description?: string
    events?: MatchEvent[]
}

export interface MatchEvent {
    event_id?: string
    code?: string
    code_fi?: string
    team_id?: string
    player_id?: string
    player_name?: string
    time_min?: string
    description?: string
}

export interface MatchSummary {
    match_id: string
    date: string
    time?: string
    team_A_id: string
    team_B_id: string
    team_A_name: string
    team_B_name: string
    fs_A?: string | number | null
    fs_B?: string | number | null
    winner_id?: string | null
    status: string
    referee_1_id?: string
    time_end?: string
    playing_time_min?: string
    live_A?: string
    live_B?: string
    live_time?: string
    walkover?: string | number
    forfeit_A?: string
    forfeit_B?: string
    team_A_description?: string
    team_B_description?: string
    venue_name?: string
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

export interface GetMatchesParams {
    competition_id?: string
    category_id?: string
    group_id?: string
    team_id?: string
    referee_id?: string
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
