export interface RosterPlayer {
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

export function mergeRoster(
    historical: RosterPlayer[],
    teamPlayers: Array<{ player_id?: string; first_name?: string; last_name?: string; img_url?: string; birthyear?: string; shirt_number?: string }>,
    scorers: Array<{ player_id: string; matches?: number; goals?: number; assists?: number; warnings?: number }>,
): RosterPlayer[] {
    const base: RosterPlayer[] = historical.length
        ? historical
        : teamPlayers.filter(p => !!p.player_id).map(p => ({
            player_id: p.player_id!,
            first_name: p.first_name || '',
            last_name: p.last_name || '',
            img_url: p.img_url,
            birthyear: p.birthyear,
            shirt_number: p.shirt_number,
        }))
    const byId = Object.fromEntries(teamPlayers.filter(p => p.player_id).map(p => [String(p.player_id), p]))
    const scorerMap = Object.fromEntries(scorers.map(s => [s.player_id, s]))
    return base.map(p => {
        const tp = byId[p.player_id]
        const sc = scorerMap[p.player_id]
        const row: RosterPlayer = {
            ...p,
            birthyear: p.birthyear || tp?.birthyear,
            shirt_number: p.shirt_number || tp?.shirt_number,
            img_url: p.img_url || tp?.img_url,
            matches: p.matches ?? sc?.matches,
            goals: p.goals ?? sc?.goals,
            assists: p.assists ?? sc?.assists,
            warnings: p.warnings ?? sc?.warnings,
        }
        return row
    }).sort((a, b) => (b.goals || 0) - (a.goals || 0) || (b.matches || 0) - (a.matches || 0))
}
