export interface PlayerMatchEntry {
    match_id?: string;
    season_id?: string;
    date?: string;
    time?: string;
    status?: string;
    team_id?: string;
    team_name?: string;
    team_A_id?: string;
    team_A_name?: string;
    team_B_id?: string;
    team_B_name?: string;
    fs_A?: string;
    fs_B?: string;
    winner_id?: string;
    player_goals?: string;
    player_warnings?: string;
    player_suspensions?: string;
}

export interface PlayerAPIResponse {
    birthyear: string;
    first_name: string;
    last_name: string;
    img_url?: string;
    matches: PlayerMatchEntry[];
    [key: string]: unknown;
}

export interface MatchGoal {
    event_id?: string;
    team_id?: string;
    player_id?: string;
    player_name?: string;
    player_shirt_number?: string;
    time?: string;
    time_min?: string;
    score_A?: number;
    score_B?: number;
    description?: string;
}

export interface MatchBooking {
    event_id?: string;
    code?: string;
    team_id?: string;
    player_id?: string;
    player_name?: string;
    shirt_number?: string;
    time?: string;
    time_min?: string;
}

export interface PlayerStatsEntry {
    player_id?: string;
    player_name?: string;
    first_name?: string;
    last_name?: string;
    team_id?: string;
    team_name?: string;
    img_url?: string;
    crest?: string;
    club_id?: string;
    standing?: string;
    matches?: string;
    goals?: string;
    assists?: string;
    warnings?: string;
    suspensions?: string;
    playing_time?: string;
    shots_on_target?: string;
    shots_total?: string;
    fouls?: string;
}

export interface TeamRosterPlayer {
    player_id?: string;
    first_name?: string;
    last_name?: string;
    shirt_number?: string;
    birthyear?: string;
    img_url?: string;
}

export interface TeamResponse {
    team_id?: string;
    team_name?: string;
    club_name?: string;
    club_id?: string;
    crest?: string;
    birthyear?: string;
    gender?: string;
    home_venue_id?: string;
    club_www?: string;
    kit_1_front?: string;
    primary_category?: Record<string, string>;
    players?: TeamRosterPlayer[];
    categories?: Record<string, string>[];
    groups?: Record<string, string>[];
}

export interface GroupResponse {
    competition_id?: string;
    competition_name?: string;
    category_id?: string;
    category_name?: string;
    group_id?: string;
    group_name?: string;
    teams?: StandingTeam[];
    matches?: MatchSummary[];
    player_statistics?: PlayerStatsEntry[];
    live_standings?: StandingTeam[];
    rounds?: Record<string, string>[];
}

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
    goals?: MatchGoal[];
    bookings?: MatchBooking[];
    venue_name?: string;
    weather?: string;
    attendance?: string;
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
    position_fi?: string;
    height?: string;
    weight?: string;
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

export interface TeamBasic {
    team_id: string;
    team_name: string;
    img_url?: string;
    club_crest?: string;
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

export interface PastMatchDetail {
    date: string;
    opponentName: string;
    playerTeamScore?: string;
    opponentScore?: string;
    resultIndicator: 'win' | 'loss' | 'draw' | 'fixture';
    status: string;
    playerTeamNameInPastMatch: string;
}

export interface PlayerStats {
    name: string;
    shirtNumber: string;
    birthYear: string;
    img_url?: string;
    teamIdInMatch: string;
    teamsThisYear: string;
    gamesPlayedThisYear: number;
    goalsThisYear: number;
    warningsThisYear: number;
    suspensionsThisYear: number;
    gamesPlayedLastSeason: number;
    goalsScoredLastSeason: number;
    goalsByTeamThisYear: Record<string, number>;
    warningsByTeamThisYear: Record<string, number>;
    gamesByTeamThisYear: Record<string, number>;
    goalsForThisSpecificTeamInSeason: number;
    pastMatchesDetails: PastMatchDetail[];
    isCaptainInMatch?: boolean;
    position_fi?: string;
    height?: string;
    weight?: string;
}
