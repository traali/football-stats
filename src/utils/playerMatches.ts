import type { PlayerAPIResponse, PlayerMatchEntry } from '../types'
import { isResult } from '../domain/matchState'

/**
 * Taso splits a player's games: played (and some stale fixtures) in `matches`,
 * the next ones in `upcoming`. Merge them so tonight's games are not lost.
 */
export function mergePlayerMatches(player: Pick<PlayerAPIResponse, 'matches' | 'upcoming'> | null | undefined): PlayerMatchEntry[] {
    const byId = new Map<string, PlayerMatchEntry>()
    const add = (m: PlayerMatchEntry) => {
        const id = String(m.match_id || '')
        if (!id) return
        const prev = byId.get(id)
        if (!prev || (!isResult(prev) && isResult(m))) byId.set(id, m)
    }
    for (const m of player?.matches || []) add(m)
    for (const m of player?.upcoming || []) add(m)
    return [...byId.values()]
}

/** Which side the player's team is on. Taso sends team_id '0' in `upcoming`. */
export function playerSideTeamId(m: PlayerMatchEntry, myTeamIds: Set<string>): string | undefined {
    const tid = String(m.team_id || '')
    if (tid && tid !== '0' && (tid === m.team_A_id || tid === m.team_B_id)) return tid
    if (m.team_A_id && myTeamIds.has(String(m.team_A_id))) return String(m.team_A_id)
    if (m.team_B_id && myTeamIds.has(String(m.team_B_id))) return String(m.team_B_id)
    return undefined
}
