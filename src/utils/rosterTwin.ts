/**
 * A team with no players in Taso (e.g. a Winterliiga entry) is usually the same
 * group of kids as a same-named team of the same club and birth year
 * ("PPJ/Laru Sininen" Winterliiga = "PPJ/Laru Sininen" futsal = "PPJ/Laru sin").
 * These helpers find that twin from the club's Taso team list. Never a guess:
 * same club, same birth year, and the name must match (exactly, or word by word
 * where one word is an abbreviation of the other).
 */

export interface TwinCandidate {
    team_id: string
    team_name: string
    sport_id?: string
    category_name?: string
    season?: string
    yob?: string
}

export type NameMatch = 'exact' | 'abbrev'

function words(name: string, clubAbbr?: string): string[] {
    const abbr = String(clubAbbr || '').trim().toLowerCase()
    return String(name || '')
        .toLowerCase()
        .split(/[\s/\-_.]+/)
        .map(w => w.trim())
        .filter(Boolean)
        .filter(w => !abbr || w !== abbr)
}

export function nameMatch(a: string, b: string, clubAbbr?: string): NameMatch | null {
    const wa = words(a, clubAbbr), wb = words(b, clubAbbr)
    if (!wa.length || wa.length !== wb.length) return null
    if (wa.join(' ') === wb.join(' ')) return 'exact'
    for (let i = 0; i < wa.length; i++) {
        const x = wa[i], y = wb[i]
        if (x === y) continue
        const [short, long] = x.length <= y.length ? [x, y] : [y, x]
        if (short.length < 3 || !long.startsWith(short)) return null
    }
    return 'abbrev'
}

/** Birth year Taso states for a team: its own birthyear, or "(2013)" in its primary category name. */
export function teamBirthYear(team: { birthyear?: unknown; primary_category?: unknown } | null | undefined): string | null {
    if (!team) return null
    const own = String(team.birthyear ?? '').trim()
    if (/^\d{4}$/.test(own)) return own
    const pc = team.primary_category as { category_name?: unknown } | undefined
    const m = /\((\d{4})\)/.exec(String(pc?.category_name ?? ''))
    return m ? m[1] : null
}

/** Ranked twins: exact name first, then the newest season. Only same birth year. */
export function rankTwins(target: { team_id: string; team_name: string; yob: string | null; clubAbbr?: string }, teams: TwinCandidate[]): (TwinCandidate & { match: NameMatch })[] {
    if (!target.yob) return []
    const out: (TwinCandidate & { match: NameMatch })[] = []
    for (const t of teams) {
        if (String(t.team_id) === String(target.team_id)) continue
        if (t.yob !== target.yob) continue
        const m = nameMatch(target.team_name, t.team_name, target.clubAbbr)
        if (m) out.push({ ...t, match: m })
    }
    const seasonKey = (s?: string) => String(s || '').slice(0, 4)
    return out.sort((a, b) =>
        (a.match === 'exact' ? 0 : 1) - (b.match === 'exact' ? 0 : 1)
        || seasonKey(b.season).localeCompare(seasonKey(a.season))
        || String(a.team_id).localeCompare(String(b.team_id)))
}

export function sportLabel(sport?: string): string {
    if (sport === 'futsal') return 'futsal'
    if (sport === 'football') return 'jalkapallo'
    return ''
}
