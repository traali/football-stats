import { getCategoryInfo, getGroupFull, getGroups } from './api'
import type { GroupResponse, StandingTeam } from '../types'

const MAX_GROUPS = 40
const BATCH = 3
const TTL_MS = 5 * 60 * 1000
const cache = new Map<string, { at: number; groups: GroupResponse[] }>()

/** A group exists when Taso gives it teams or matches; past the last group Taso answers with an empty shell. */
export function isRealGroup(g: GroupResponse | null | undefined): g is GroupResponse {
    return !!g && ((g.teams?.length ?? 0) > 0 || (g.matches?.length ?? 0) > 0)
}

export function isKnockoutGroup(g: Pick<GroupResponse, 'group_type'>): boolean {
    return String(g.group_type || '').toLowerCase().startsWith('knockout')
}

/** Knockout groups list a team once per game; keep the first row of each team. */
export function uniqueTeams(teams: StandingTeam[] | undefined): StandingTeam[] {
    const seen = new Set<string>()
    const out: StandingTeam[] = []
    for (const t of teams || []) {
        const id = String(t.team_id || '')
        if (!id || id === '0' || seen.has(id)) continue
        seen.add(id)
        out.push(t)
    }
    return out
}

export function groupHasTeam(g: GroupResponse, teamId: string): boolean {
    if (!teamId) return false
    if ((g.teams || []).some(t => String(t.team_id) === teamId)) return true
    return (g.matches || []).some(m => String(m.team_A_id) === teamId || String(m.team_B_id) === teamId)
}

/**
 * All groups of a tournament category, with matches.
 * Group ids come from getCategory (leagues; ids are not always 1..N), else getGroups.
 * Cups like hc2026 refuse both ("not published" / "Not allowed"), so then this asks
 * getGroup 1, 2, 3 … until Taso returns an empty group.
 */
export async function loadTournamentGroups(competitionId: string, categoryId: string, signal?: AbortSignal): Promise<GroupResponse[]> {
    const key = `${competitionId}|${categoryId}`
    const hit = cache.get(key)
    if (hit && Date.now() - hit.at < TTL_MS) return hit.groups

    let ids: string[] = await getCategoryInfo(competitionId, categoryId, signal)
        .then(cat => cat.groups.map(g => g.group_id))
        .catch(() => [] as string[])
    if (ids.length === 0) {
        ids = await getGroups(competitionId, categoryId, signal)
            .then(list => list.map(g => String(g.group_id)).filter(Boolean))
            .catch(() => [] as string[])
    }

    const groups: GroupResponse[] = []
    if (ids.length > 0) {
        for (let i = 0; i < ids.length; i += BATCH) {
            const batch = await Promise.all(ids.slice(i, i + BATCH).map(id => getGroupFull(competitionId, categoryId, id, signal).catch(() => null)))
            batch.forEach(g => { if (isRealGroup(g)) groups.push(g) })
        }
    } else {
        let done = false
        for (let start = 1; start <= MAX_GROUPS && !done; start += BATCH) {
            const nums = Array.from({ length: BATCH }, (_, k) => start + k).filter(n => n <= MAX_GROUPS)
            const batch = await Promise.all(nums.map(n => getGroupFull(competitionId, categoryId, String(n), signal).catch(() => null)))
            for (const g of batch) {
                if (!isRealGroup(g)) { done = true; break }
                groups.push(g)
            }
        }
    }

    if (groups.length > 0) cache.set(key, { at: Date.now(), groups })
    return groups
}
