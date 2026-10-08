export interface ParsedTournamentUrl {
    /** Taso competition id, e.g. hc2026 */
    turnaus: string
    /** Taso category id, e.g. B13-8 */
    sarja: string
    /** Taso team id or '' */
    teamId: string
    /** Taso group id or '' */
    groupId: string
    host: string
    rawUrl: string
}

/**
 * Understands links that point at Taso data:
 *  - tulospalvelu.palloliitto.fi/category/B13-8!hc2026[/group/13][/...]
 *  - *.torneopal.fi/...?turnaus=hc2026&sarja=B13-8&joukkue=185085 (or competition/class/teamid)
 *  - this app's own #/turnaukset/hc2026/B13-8/185085 links
 */
export function parseTournamentUrl(input: string): ParsedTournamentUrl | null {
    if (!input || typeof input !== 'string') return null
    const raw = input.trim()
    let trimmed = raw
    if (!/^https?:\/\//i.test(trimmed)) trimmed = 'https://' + trimmed

    let url: URL
    try {
        url = new URL(trimmed)
    } catch {
        return null
    }
    const host = url.hostname.toLowerCase()

    const own = /#\/turnaukset\/([^/?#]+)\/([^/?#]+)(?:\/(\d+))?/.exec(url.hash ? url.hash : '')
    if (own) {
        return { turnaus: decodeURIComponent(own[1]), sarja: decodeURIComponent(own[2]), teamId: own[3] || '', groupId: '', host, rawUrl: raw }
    }

    if (host === 'tulospalvelu.palloliitto.fi') {
        const m = /\/category\/([^/!]+)!([^/]+)(?:\/group\/(\d+))?/.exec(decodeURIComponent(url.pathname))
        if (!m) return null
        return { turnaus: m[2], sarja: m[1], teamId: url.searchParams.get('team') || '', groupId: m[3] || '', host, rawUrl: raw }
    }

    if (!host.endsWith('torneopal.fi') && !host.endsWith('torneopal.net')) return null
    const turnaus = url.searchParams.get('turnaus') || url.searchParams.get('competition') || ''
    const sarja = url.searchParams.get('sarja') || url.searchParams.get('class') || url.searchParams.get('category') || ''
    const teamId = url.searchParams.get('joukkue') || url.searchParams.get('teamid') || url.searchParams.get('team') || ''
    const groupId = url.searchParams.get('lohko') || url.searchParams.get('group') || ''
    if (!turnaus || !sarja) return null
    return { turnaus, sarja, teamId: /^\d+$/.test(teamId) ? teamId : '', groupId: /^\d+$/.test(groupId) ? groupId : '', host, rawUrl: raw }
}
