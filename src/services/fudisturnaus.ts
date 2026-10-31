/**
 * Read-only client for fudisturnaus.com public tournament JSON.
 * Upstream has no browser CORS; we go through pelipaiva-edge /api/fudis/<slug>
 * (same pattern the existing public/turnaus.html uses).
 */

export const FUDIS_EDGE = 'https://pelipaiva-edge.sakkoja.workers.dev/api/fudis/'
export const FUDIS_SITE = 'https://www.fudisturnaus.com'

/** Default half length when the info text does not say otherwise (Roof LKV: 1×30). */
export const FUDIS_DEFAULT_PLAYING_MIN = 30

export interface FudisClub {
    id?: number
    name?: string
    logoUrl?: string
}

export interface FudisTeam {
    id: number
    name: string
    clubId: number
    groupId?: number
    ageGroupId?: number
}

export interface FudisField {
    id: number
    name: string
}

export interface FudisGroupResult {
    ranking: number
    teamName: string
    teamId: number
    clubId: number
    matches: number
    wins: number
    draws: number
    losses: number
    goalsFor: number
    goalsAgainst: number
    points: number
    lot?: unknown
}

export interface FudisGroup {
    id: number
    name: string
    ageGroupId?: number
    ageGroup?: { name?: string }
    results: FudisGroupResult[]
}

export interface FudisMatchTeam {
    id: number
    name: string
    clubId?: number
}

export interface FudisGroupMatch {
    id: number
    ageGroupId?: number
    groupId: number
    fieldId?: number
    startTime: string
    date: string
    day?: number
    homeGoals: number | null
    awayGoals: number | null
    penalties?: boolean
    type?: string
    ageGroup?: { name?: string }
    group?: { ageGroupId?: number; name?: string }
    field?: { name?: string }
    homeTeam: FudisMatchTeam
    awayTeam: FudisMatchTeam
    refereeId?: number | null
}

export interface FudisPlayoffMatch {
    id: number
    ageGroupId?: number
    fieldId?: number
    title: string
    startTime: string
    date: string
    day?: number
    homeGoals: number | null
    awayGoals: number | null
    penalties?: boolean
    homeTeamOriginId?: number
    awayTeamOriginId?: number
    type?: string
    ageGroup?: { name?: string }
    field?: { name?: string }
    homeTeam?: FudisMatchTeam
    awayTeam?: FudisMatchTeam
    refereeId?: number | null
}

export interface FudisTournament {
    id: number
    name: string
    startDate: string
    endDate: string
    days?: number
    location?: string
    address?: string
    calculateGroupTables: boolean
    visibility?: number
    cancelled?: boolean
    slug: string
    info?: string
    club?: { logoUrl?: string; name?: string }
    dates?: string[]
    groupStageMatches: FudisGroupMatch[]
    playoffMatches: FudisPlayoffMatch[]
    ageGroups?: { id: number; name: string; hideGroupTables?: boolean }[]
    groups: FudisGroup[]
    playoffGroups?: unknown[]
    teams: FudisTeam[]
    clubs?: FudisClub[]
    fields?: FudisField[]
}

export function fudisturnausPageUrl(slug: string, clubId?: string | number | null): string {
    const q = clubId != null && String(clubId) !== '' ? `?clubId=${clubId}` : ''
    return `${FUDIS_SITE}/t/${encodeURIComponent(slug)}${q}`
}

export function isFudisSlug(slug: string): boolean {
    return /^[A-Za-z0-9-]{8,200}$/.test(slug)
}

/** Parse "Peliaika: 1x30 minuuttia" / "2x20" style lines from tournament info. */
export function playingMinutesFromInfo(info?: string | null): number {
    const text = String(info || '')
    const m = /peliaika\s*:\s*(\d+)\s*[x×]\s*(\d+)/i.exec(text)
    if (m) return Number(m[1]) * Number(m[2])
    const one = /peliaika\s*:\s*(\d+)\s*min/i.exec(text)
    if (one) return Number(one[1])
    return FUDIS_DEFAULT_PLAYING_MIN
}

export async function fetchFudisTournament(slug: string, signal?: AbortSignal): Promise<FudisTournament> {
    if (!isFudisSlug(slug)) throw new Error('Turnauksen tunniste ei kelpaa.')
    const res = await fetch(`${FUDIS_EDGE}${encodeURIComponent(slug)}`, {
        signal,
        cache: 'no-store',
        headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`Turnauksen lataus epäonnistui (${res.status}).`)
    const data = (await res.json()) as FudisTournament
    if (!data || typeof data !== 'object' || !data.slug) throw new Error('Turnausvastausta ei voitu lukea.')
    return data
}
