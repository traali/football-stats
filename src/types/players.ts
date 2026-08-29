export interface PlayerLineupInfo {
    player_id: string
    player_name: string
    first_name?: string
    last_name?: string
    shirt_number: string
    team_id: string
    captain?: string
    team_name?: string
    position?: string
    position_fi?: string
    height?: string
    weight?: string
    birthyear?: string
    img_url?: string
    goals?: string | number
    warnings?: string | number
    suspensions?: string | number
    overage?: string | number
}

export interface PlayerStatsEntry {
    player_id?: string
    player_name?: string
    first_name?: string
    last_name?: string
    team_id?: string
    team_name?: string
    img_url?: string
    crest?: string
    club_id?: string
    standing?: string
    matches?: string
    goals?: string
    assists?: string
    warnings?: string
    suspensions?: string
    playing_time?: string
    shots_on_target?: string
    shots_total?: string
    fouls?: string
}

export interface PlayerMatchEntry {
    match_id?: string
    season_id?: string
    date?: string
    time?: string
    status?: string
    team_id?: string
    team_name?: string
    team_A_id?: string
    team_A_name?: string
    team_B_id?: string
    team_B_name?: string
    fs_A?: string
    fs_B?: string
    winner_id?: string
    player_goals?: string
    player_warnings?: string
    player_suspensions?: string
    category_id?: string
    category_name?: string
}

export interface PlayerAPIResponse {
    birthyear: string
    first_name: string
    last_name: string
    img_url?: string
    matches: PlayerMatchEntry[]
    [key: string]: unknown
}

import type { PastMatchDetail } from './matches'

export interface PlayerStats {
    playerId?: string
    name: string
    shirtNumber: string
    birthYear: string
    pastMatchesDetails?: PastMatchDetail[]
    currentTeamName?: string
    currentTeamId?: string
    currentShirtNumber?: string
    img_url?: string
    position_fi?: string
    gamesPlayedThisYear: number
    goalsThisYear: number
    warningsThisYear: number
    suspensionsThisYear: number
    goalsByTeamThisYear: Record<string, number>
    warningsByTeamThisYear: Record<string, number>
    gamesByTeamThisYear: Record<string, number>
    goalsForThisSpecificTeamInSeason: number
    gamesPlayedLastSeason: number
    goalsScoredLastSeason: number
    teamsThisYear: string
    isCaptainInMatch?: boolean
    teamIdInMatch?: string
    height?: string
    weight?: string
    goalsInMatch?: number
    overage?: boolean
}
