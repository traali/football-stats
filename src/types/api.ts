export interface MatchDetails {
    match_id: string;
    competition_id: string;
    category_id: string;
    group_id: string;
    team_A_id: string;
    team_B_id: string;
    team_A_name: string;
    team_B_name: string;
    fs_A?: string;
    fs_B?: string;
    date: string;
    time?: string;
    category_name: string;
    competition_name: string;
    referee_1_name?: string;
    referee_1_id?: string;
    lineups: PlayerLineupInfo[];
}

export interface Competition {
    competition_id: string;
    competition_name: string;
    season_id?: string;
    season_name?: string;
    [key: string]: unknown;
}

export interface Category {
    category_id: string;
    category_name: string;
    competition_id?: string;
    [key: string]: unknown;
}

export interface Season {
    season_id: string;
    season_name: string;
    competition_id?: string;
    [key: string]: unknown;
}

export interface PlayerLineupInfo {
    player_id: string;
    player_name: string;
    shirt_number: string;
    team_id: string;
    captain?: string;
    team_name?: string;
}

export interface GroupDetails {
    group_id: string;
    group_name: string;
    category_name: string;
    competition_name: string;
    teams: StandingTeam[];
    matches: MatchSummary[];
}

export interface StandingTeam {
    team_id: string;
    team_name: string;
    current_standing: string;
    matches_played: string;
    matches_won: string;
    matches_tied: string;
    matches_lost: string;
    goals_for: string;
    goals_against: string;
    goals_diff: string;
    points: string;
}

export interface MatchSummary {
    match_id: string;
    date: string;
    time: string;
    team_A_id: string;
    team_B_id: string;
    team_A_name: string;
    team_B_name: string;
    fs_A: string;
    fs_B: string;
    winner_id: string;
    status: string;
    referee_1_id?: string;
}

export interface DiscoveryMatch {
    match_id: string;
    competition_id?: string;
    category_id?: string;
    group_id?: string;
    date: string;
    time?: string;
    team_A_id: string;
    team_B_id: string;
    team_A_name: string;
    team_B_name: string;
    fs_A?: string;
    fs_B?: string;
    status?: string;
    winner_id?: string;
    [key: string]: unknown;
}

export interface ScoreEntry {
    match_id?: string;
    competition_id?: string;
    category_id?: string;
    team_A_name?: string;
    team_B_name?: string;
    fs_A?: string;
    fs_B?: string;
    status?: string;
    [key: string]: unknown;
}

export interface GetMatchesParams {
    competition_id?: string;
    category_id?: string;
    group_id?: string;
    team_id?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
}

export interface PlayerStats {
    name: string;
    shirtNumber: string;
    birthYear: string;
    img_url?: string;
    clubCrest?: string;
    teamIdInMatch: string;
    teamsThisYear: string;
    gamesPlayedThisYear: number;
    goalsThisYear: number;
    warningsThisYear: number;
    suspensionsThisYear: number;
    gamesPlayedLastSeason: number;
    goalsScoredLastSeason: number;
    goalsByTeamThisYear: Record<string, number>;
    gamesByTeamThisYear: Record<string, number>;
    goalsForThisSpecificTeamInSeason: number;
    pastMatchesDetails: any[];
    isCaptainInMatch?: boolean;
    position_fi?: string;
    height?: string;
    weight?: string;
    finland_raised?: boolean | string;
}
