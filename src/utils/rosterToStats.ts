import type { PlayerStats } from '../types'

export interface RosterSource {
    player_id: string
    first_name: string
    last_name: string
    img_url?: string
    birthyear?: string
    shirt_number?: string
    position_fi?: string
    matches?: number
    goals?: number
    assists?: number
    warnings?: number
}

export function rosterToStats(
    p: RosterSource,
    extras: { teamName?: string; level?: string; lastSeasonGames?: number; lastSeasonGoals?: number },
): PlayerStats {
    return {
        playerId: p.player_id,
        name: `${p.first_name} ${p.last_name}`.trim(),
        shirtNumber: p.shirt_number || 'N/A',
        birthYear: p.birthyear || '',
        img_url: p.img_url,
        currentTeamName: extras.teamName,
        position_fi: p.position_fi,
        gamesPlayedThisYear: p.matches || 0,
        goalsThisYear: p.goals || 0,
        warningsThisYear: p.warnings || 0,
        suspensionsThisYear: 0,
        goalsByTeamThisYear: {},
        warningsByTeamThisYear: {},
        gamesByTeamThisYear: {},
        goalsForThisSpecificTeamInSeason: p.goals || 0,
        gamesPlayedLastSeason: extras.lastSeasonGames || 0,
        goalsScoredLastSeason: extras.lastSeasonGoals || 0,
        teamsThisYear: extras.level || '',
    }
}
