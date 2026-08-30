export interface ParsedTournamentUrl {
    host: string
    turnaus: string
    sarja: string
    teamId: string
    rawUrl: string
}

export function parseTournamentUrl(input: string): ParsedTournamentUrl | null {
    if (!input || typeof input !== 'string') return null
    let trimmed = input.trim()
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        trimmed = 'https://' + trimmed
    }

    try {
        const url = new URL(trimmed)
        const host = url.hostname.toLowerCase()
        if (!host.includes('torneopal')) {
            return null
        }

        const turnaus = url.searchParams.get('turnaus') || url.searchParams.get('competition') || ''
        const sarja = url.searchParams.get('sarja') || url.searchParams.get('class') || url.searchParams.get('category') || ''
        const teamId = url.searchParams.get('joukkue') || url.searchParams.get('teamid') || url.searchParams.get('team') || ''

        return {
            host,
            turnaus,
            sarja,
            teamId,
            rawUrl: input.trim(),
        }
    } catch {
        return null
    }
}
