import { MATCH_STATUS } from '../types'
import type { MatchDetails } from '../types'

const KEY = 'fs.viewedMatches.v1'
const MAX = 15

export interface ViewedMatch {
    viewedAt: number
    match: MatchDetails
}

function read(): ViewedMatch[] {
    if (typeof localStorage === 'undefined') return []
    try {
        const raw = localStorage.getItem(KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw) as ViewedMatch[]
        return Array.isArray(parsed) ? parsed.filter(x => x?.match?.match_id) : []
    } catch {
        return []
    }
}

function write(list: ViewedMatch[]) {
    if (typeof localStorage === 'undefined') return
    try {
        localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)))
    } catch {
        /* quota */
    }
}

export function rememberViewedMatch(match: MatchDetails) {
    if (!match?.match_id) return
    if (match.status !== MATCH_STATUS.PLAYED) return
    const slim: MatchDetails = {
        ...match,
        lineups: (match.lineups || []).map(p => ({
            player_id: p.player_id,
            player_name: p.player_name,
            first_name: p.first_name,
            last_name: p.last_name,
            shirt_number: p.shirt_number,
            team_id: p.team_id,
            captain: p.captain,
            position_fi: p.position_fi,
            position: p.position,
            birthyear: p.birthyear,
            img_url: p.img_url,
            goals: p.goals,
            warnings: p.warnings,
            overage: p.overage,
        })),
    }
    const rest = read().filter(x => x.match.match_id !== match.match_id)
    write([{ viewedAt: Date.now(), match: slim }, ...rest])
}

export function getViewedMatch(matchId: string): MatchDetails | undefined {
    return read().find(x => x.match.match_id === matchId)?.match
}

export function listViewedMatches(): ViewedMatch[] {
    return read()
}
