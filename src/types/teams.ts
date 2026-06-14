import type { PlayerStatsEntry } from './players'
import type { MatchSummary } from './matches'

export interface TeamBasic {
    team_id: string
    team_name: string
    img_url?: string
    club_crest?: string
}

export interface TeamRosterPlayer {
    player_id?: string
    first_name?: string
    last_name?: string
    shirt_number?: string
    birthyear?: string
    img_url?: string
}

export interface TeamResponse {
    team_id?: string
    team_name?: string
    club_name?: string
    club_id?: string
    crest?: string
    img_url?: string
    club_crest?: string
    birthyear?: string
    gender?: string
    home_venue_id?: string
    club_www?: string
    kit_1_front?: string
    primary_category?: Record<string, string>
    players?: TeamRosterPlayer[]
    categories?: Record<string, string>[]
    groups?: Record<string, string>[]
}

export interface StandingTeam {
    team_id: string
    team_name: string
    current_standing: string | number
    matches_played: string | number
    matches_won: string | number
    matches_tied: string | number
    matches_lost: string | number
    goals_for: string | number
    goals_against: string | number
    goals_diff: string | number
    points: string | number
}

export interface GroupDetails {
    group_id: string
    group_name: string
    category_name: string
    competition_name: string
    teams: StandingTeam[]
    matches: MatchSummary[]
}

export interface GroupResponse {
    competition_id?: string
    competition_name?: string
    category_id?: string
    category_name?: string
    group_id?: string
    group_name?: string
    teams?: StandingTeam[]
    matches?: MatchSummary[]
    player_statistics?: PlayerStatsEntry[]
    live_standings?: StandingTeam[]
    rounds?: Record<string, string>[]
}