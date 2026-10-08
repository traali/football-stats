import type { StandingTeam } from '../types'

/** Points per match with a Finnish decimal comma, e.g. 1,33. */
export function formatPpm(v: unknown): string {
    if (v === null || v === undefined || v === '') return '–'
    const n = Number(v)
    return Number.isFinite(n) ? n.toFixed(2).replace('.', ',') : '–'
}

/** Taso's own order (current_standing). Never re-ranked by points. Rows without a position keep Taso's array order at the end. */
export function inTasoOrder(teams: StandingTeam[]): StandingTeam[] {
    return teams
        .map((t, i) => ({ t, i, pos: parseInt(String(t.current_standing), 10) }))
        .sort((a, b) => (Number.isFinite(a.pos) ? a.pos : 1e9) - (Number.isFinite(b.pos) ? b.pos : 1e9) || a.i - b.i)
        .map(x => x.t)
}
