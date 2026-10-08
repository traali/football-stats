const ROMAN: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8 }

/** True when Taso has not decided this bracket slot yet (no team id). */
export function isPlaceholderTeam(teamId?: string | null): boolean {
    const id = String(teamId ?? '').trim()
    return !id || id === '0'
}

/**
 * Name to print for a team slot. Real teams print their Taso name.
 * Undecided bracket slots print Taso's own slot code in plain Finnish, never an invented team.
 */
export function teamLabel(teamId?: string | null, name?: string | null, description?: string | null): string {
    const n = String(name ?? '').trim()
    if (!isPlaceholderTeam(teamId)) return n || 'Joukkue'
    const isCode = (v: string) => /^[vh]\d+$/i.test(v) || /^[A-Z]{1,3}\/[IVX]+$/i.test(v)
    // Taso sometimes writes the slot out in words ("Voittaja ottelusta GrIFK/1 - PKKU (7710)"): print that as is.
    if (n && !isCode(n)) return n
    const code = (String(description ?? '').trim() || n)
    let m = /^v(\d+)$/i.exec(code)
    if (m) return `Ottelun ${m[1]} voittaja`
    m = /^h(\d+)$/i.exec(code)
    if (m) return `Ottelun ${m[1]} häviäjä`
    m = /^([A-Z]{1,3})\/(I{1,3}|IV|V|VI{0,3})$/i.exec(code)
    if (m && ROMAN[m[2].toUpperCase()]) return `Lohkon ${m[1].toUpperCase()} ${ROMAN[m[2].toUpperCase()]}.`
    if (n) return n
    return 'Ratkeaa myöhemmin'
}
