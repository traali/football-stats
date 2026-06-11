import { APP_CONFIG } from '../types/config';
import type { PastMatchDetail, PlayerMatchEntry } from '../types/api';

interface ProcessedStats {
    gamesPlayedThisYear: number;
    goalsThisYear: number;
    warningsThisYear: number;
    suspensionsThisYear: number;
    goalsByTeamThisYear: Record<string, number>;
    warningsByTeamThisYear: Record<string, number>;
    gamesByTeamThisYear: Record<string, number>;
    goalsForThisSpecificTeamInSeason: number;
    pastMatchesDetails: PastMatchDetail[];
    gamesPlayedLastSeason: number;
    goalsScoredLastSeason: number;
    teamsThisYear: string;
}

export function processPlayerMatchHistory(
    matches: PlayerMatchEntry[],
    currentSeasonId: string,
    previousSeasonId: string,
    teamNameForContext: string
): ProcessedStats {
    const stats = {
        gamesPlayedThisYear: 0,
        goalsThisYear: 0,
        warningsThisYear: 0,
        suspensionsThisYear: 0,
        goalsByTeamThisYear: {} as Record<string, number>,
        warningsByTeamThisYear: {} as Record<string, number>,
        gamesByTeamThisYear: {} as Record<string, number>,
        goalsForThisSpecificTeamInSeason: 0,
        pastMatchesDetails: [] as PastMatchDetail[],
        gamesPlayedLastSeason: 0,
        goalsScoredLastSeason: 0,
    };

    if (!matches) return { ...stats, teamsThisYear: "" };

    matches.forEach((match) => {
        const goals = parseInt(match.player_goals ?? "") || 0;
        const warnings = parseInt(match.player_warnings ?? "") || 0;
        const suspensions = parseInt(match.player_suspensions ?? "") || 0;
        const teamName = match.team_name || "Tuntematon joukkue";

        if (match.season_id === currentSeasonId) {
            if (match.status === "Played") {
                stats.gamesPlayedThisYear++;
                stats.goalsThisYear += goals;
                stats.warningsThisYear += warnings;
                stats.suspensionsThisYear += suspensions;

                stats.goalsByTeamThisYear[teamName] = (stats.goalsByTeamThisYear[teamName] || 0) + goals;
                stats.warningsByTeamThisYear[teamName] = (stats.warningsByTeamThisYear[teamName] || 0) + warnings;
                stats.gamesByTeamThisYear[teamName] = (stats.gamesByTeamThisYear[teamName] || 0) + 1;

                if (teamName === teamNameForContext) {
                    stats.goalsForThisSpecificTeamInSeason += goals;

                    let opponentName = "";
                    let playerTeamScore = "";
                    let opponentScore = "";
                    let resultIndicator: 'win' | 'loss' | 'draw' | 'fixture' = 'draw';

                    if (match.team_A_name === teamNameForContext || match.team_A_id === match.team_id) {
                        opponentName = match.team_B_name || "Tuntematon";
                        playerTeamScore = match.fs_A ?? "";
                        opponentScore = match.fs_B ?? "";
                    } else {
                        opponentName = match.team_A_name || "Tuntematon";
                        playerTeamScore = match.fs_B ?? "";
                        opponentScore = match.fs_A ?? "";
                    }

                    if (match.winner_id === match.team_id) {
                        resultIndicator = 'win';
                    } else if (match.winner_id && match.winner_id !== "0" && match.winner_id !== "-") {
                        resultIndicator = 'loss';
                    }

                    stats.pastMatchesDetails.push({
                        date: match.date ?? "",
                        opponentName,
                        playerTeamScore,
                        opponentScore,
                        resultIndicator,
                        status: match.status ?? "",
                        playerTeamNameInPastMatch: teamName
                    });
                }
            } else if (match.status === "Fixture") {
                if (teamName === teamNameForContext) {
                    const isTeamA = match.team_A_name === teamNameForContext || match.team_A_id === match.team_id;
                    let opponentName = isTeamA ? match.team_B_name : match.team_A_name;
                    stats.pastMatchesDetails.push({
                        date: match.date ?? "",
                        opponentName: opponentName || "Tuntematon",
                        resultIndicator: 'fixture',
                        status: match.status ?? "",
                        playerTeamNameInPastMatch: teamName
                    });
                }
            }
        } else if (match.season_id === previousSeasonId) {
            if (match.status === "Played") {
                stats.gamesPlayedLastSeason++;
                stats.goalsScoredLastSeason += goals;
            }
        }
    });

    const teamsThisYear = Object.keys(stats.gamesByTeamThisYear).join(", ");

    return { ...stats, teamsThisYear };
}

export type { ProcessedStats };