import type { PlayerAPIResponse, PlayerMatchEntry } from '../types'

const KEY = 'fs.viewedPlayers.v1'
const MAX = 20

export interface ViewedPlayer {
    viewedAt: number
    playerId: string
    player: PlayerAPIResponse
}

function read(): ViewedPlayer[] {
    if (typeof localStorage === 'undefined') return []
    try {
        const raw = localStorage.getItem(KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw) as ViewedPlayer[]
        return Array.isArray(parsed) ? parsed.filter(x => x?.playerId && x.player) : []
    } catch {
        return []
    }
}

function write(list: ViewedPlayer[]) {
    if (typeof localStorage === 'undefined') return
    try {
        localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)))
    } catch {
        try {
            localStorage.setItem(KEY, JSON.stringify(list.slice(0, 8)))
        } catch { /* quota */ }
    }
}

function slimMatch(m: PlayerMatchEntry): PlayerMatchEntry {
    return {
        match_id: m.match_id,
        season_id: m.season_id,
        date: m.date,
        time: m.time,
        status: m.status,
        team_id: m.team_id,
        team_name: m.team_name,
        team_A_id: m.team_A_id,
        team_A_name: m.team_A_name,
        team_B_id: m.team_B_id,
        team_B_name: m.team_B_name,
        fs_A: m.fs_A,
        fs_B: m.fs_B,
        player_goals: m.player_goals,
        player_assists: m.player_assists,
        player_warnings: m.player_warnings,
        player_suspensions: m.player_suspensions,
        category_name: m.category_name,
        category_id: m.category_id,
        competition_name: m.competition_name,
    }
}

export function rememberViewedPlayer(playerId: string, player: PlayerAPIResponse) {
    if (!playerId || !player) return
    const slim: PlayerAPIResponse = {
        first_name: player.first_name,
        last_name: player.last_name,
        birthyear: player.birthyear,
        img_url: player.img_url,
        matches: (player.matches || []).map(slimMatch),
        teams: player.teams,
    }
    const rest = read().filter(x => x.playerId !== playerId)
    write([{ viewedAt: Date.now(), playerId, player: slim }, ...rest])
}

export function getViewedPlayer(playerId: string): PlayerAPIResponse | undefined {
    return read().find(x => x.playerId === playerId)?.player
}

export function listViewedPlayers(): ViewedPlayer[] {
    return read()
}
