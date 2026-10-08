import type { MatchDetails, MatchGoal } from '../types'

function filled(v: unknown): string {
    const s = v === null || v === undefined ? '' : String(v).trim()
    return s
}

/** Taso's own match facts. Each one only when Taso actually filled it in. */
export function matchFacts(match: MatchDetails): { weather?: string; temperature?: string; attendance?: string } {
    const weather = filled(match.weather)
    const temperature = filled(match.temperature)
    const attendance = filled(match.attendance)
    return {
        weather: weather || undefined,
        temperature: /^-?\d+([.,]\d+)?$/.test(temperature) ? `${temperature.replace('.', ',')} °C` : undefined,
        // Taso sends attendance '0' when nobody reported it.
        attendance: /^\d+$/.test(attendance) && Number(attendance) > 0 ? `${attendance} katsojaa` : undefined,
    }
}

export function isOwnGoal(g: MatchGoal, match: MatchDetails): boolean {
    if (/oma\s*maali|own\s*goal|^om$/i.test(filled(g.description))) return true
    if (!g.player_id || !g.team_id) return false
    const p = (match.lineups || []).find(l => l.player_id === g.player_id)
    return !!p && !!p.team_id && p.team_id !== g.team_id
}
