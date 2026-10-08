const BASE = 'https://tulospalvelu.palloliitto.fi'

export type TasoKind = 'match' | 'team' | 'person'

/** Link to the same thing in Palloliitto's own results service. */
export function tasoUrl(kind: TasoKind, id: string | number): string {
    return `${BASE}/${kind}/${encodeURIComponent(String(id))}`
}

/** Category (and optional group) page, e.g. /category/B13-8!hc2026/group/13 */
export function tasoCategoryUrl(competitionId: string, categoryId: string, groupId?: string | number): string {
    const base = `${BASE}/category/${encodeURIComponent(categoryId)}!${encodeURIComponent(competitionId)}`
    return groupId ? `${base}/group/${encodeURIComponent(String(groupId))}` : base
}
