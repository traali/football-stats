import type { PlayerMatchEntry } from '../../types'
import { MATCH_STATUS } from '../../types'
import type { OfficialAppearance } from './types'
import { parseAgeClass, parseFormat, parseLevel } from './parseLevel'
import { parseSeasonHalf } from './seasonHalf'

export function appearancesFromPlayerMatches(
    playerId: string,
    clubId: string,
    matches: PlayerMatchEntry[] | undefined,
    birthYear?: number,
): OfficialAppearance[] {
    if (!matches?.length) return []
    return matches
        .filter(m => m.date && m.status === MATCH_STATUS.PLAYED)
        .map(m => {
            const level = parseLevel(m.category_name, m.category_id)
            return {
                playerId,
                matchId: String(m.match_id || ''),
                date: m.date!,
                teamId: String(m.team_id || ''),
                clubId,
                ageClass: parseAgeClass(m.category_name, m.category_id, birthYear),
                level,
                format: parseFormat(m.category_id, m.category_name),
                official: true,
                onLineup: true,
                lineupConfirmed: true,
                seasonHalf: parseSeasonHalf(m.category_name, m.date),
            }
        })
}
