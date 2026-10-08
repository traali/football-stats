import { todayISO } from '../utils/dates'
import type { ParsedTournamentUrl } from '../utils/tournamentUrl'

export interface SavedTournament {
    id: string
    title: string
    teamName: string
    category: string
    turnaus: string
    sarja: string
    teamId: string
    dateAdded: string
}

const STORAGE_KEY = 'football_stats_saved_tournaments'

/** Nothing is pre-filled: only tournaments the user saved themselves. Old widget-only entries are dropped. */
export function getSavedTournaments(): SavedTournament[] {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
        if (!Array.isArray(parsed)) return []
        return parsed
            .filter(t => t && typeof t === 'object' && t.turnaus && t.sarja && t.id !== 'vierumaki-2026')
            .map(t => ({
                id: String(t.id || `${t.turnaus}-${t.sarja}-${t.teamId || ''}`),
                title: String(t.title || t.turnaus),
                teamName: String(t.teamName || ''),
                category: String(t.category || t.sarja),
                turnaus: String(t.turnaus),
                sarja: String(t.sarja),
                teamId: /^\d+$/.test(String(t.teamId || '')) ? String(t.teamId) : '',
                dateAdded: String(t.dateAdded || ''),
            }))
    } catch {
        return []
    }
}

function write(list: SavedTournament[]) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) } catch { /* storage full / private */ }
}

export function tournamentPath(t: Pick<SavedTournament, 'turnaus' | 'sarja' | 'teamId'>): string {
    return `/turnaukset/${encodeURIComponent(t.turnaus)}/${encodeURIComponent(t.sarja)}${t.teamId ? `/${t.teamId}` : ''}`
}

export function saveTournament(p: Pick<ParsedTournamentUrl, 'turnaus' | 'sarja' | 'teamId'>, info?: { title?: string; teamName?: string; category?: string }): SavedTournament {
    const list = getSavedTournaments()
    const id = `${p.turnaus}-${p.sarja}-${p.teamId || ''}`
    const existing = list.find(t => t.id === id)
    const entry: SavedTournament = {
        id,
        title: info?.title || existing?.title || p.turnaus,
        teamName: info?.teamName || existing?.teamName || '',
        category: info?.category || existing?.category || p.sarja,
        turnaus: p.turnaus,
        sarja: p.sarja,
        teamId: p.teamId || '',
        dateAdded: existing?.dateAdded || todayISO(),
    }
    write([entry, ...list.filter(t => t.id !== id)])
    return entry
}

export function isTournamentSaved(p: Pick<SavedTournament, 'turnaus' | 'sarja' | 'teamId'>): boolean {
    const id = `${p.turnaus}-${p.sarja}-${p.teamId || ''}`
    return getSavedTournaments().some(t => t.id === id)
}

export function removeTournament(id: string): void {
    write(getSavedTournaments().filter(t => t.id !== id))
}
