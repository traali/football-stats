/**
 * TASO player_name is typically "Sukunimi Etunimi".
 * Prefer structured first_name / last_name when present.
 */
export function parsePlayerName(input: {
    first_name?: string
    last_name?: string
    player_name?: string
}): { first_name: string; last_name: string } {
    const first = (input.first_name || '').trim()
    const last = (input.last_name || '').trim()
    if (first || last) return { first_name: first, last_name: last }

    const raw = (input.player_name || '').trim()
    if (!raw) return { first_name: '', last_name: '' }

    if (raw.includes(',')) {
        const [a, ...rest] = raw.split(',')
        return { last_name: a.trim(), first_name: rest.join(',').trim() }
    }

    const parts = raw.split(/\s+/).filter(Boolean)
    if (parts.length === 1) return { first_name: '', last_name: parts[0] }
    return {
        last_name: parts[0],
        first_name: parts.slice(1).join(' '),
    }
}

export function seasonMatchesYear(
    seasonId: string | undefined | null,
    year: string,
    date?: string,
): boolean {
    if (seasonId) {
        const s = String(seasonId)
        if (s === year) return true
        if (s.startsWith(year)) return true
        if (s.includes(year)) return true
        return false
    }
    return Boolean(date && date.startsWith(year))
}
