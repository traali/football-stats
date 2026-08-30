import { parseTournamentUrl } from '../utils/tournamentUrl'

export interface SavedTournament {
    id: string
    title: string
    teamName: string
    category: string
    url: string
    turnaus: string
    sarja: string
    teamId: string
    host: string
    dateAdded: string
}

const STORAGE_KEY = 'football_stats_saved_tournaments'

export const DEFAULT_TOURNAMENTS: SavedTournament[] = [
    {
        id: 'vierumaki-2026',
        title: 'Vierumäki-turnaus 5.–6.9.2026',
        teamName: 'PPJ/Laru Sininen',
        category: 'P13 Haaste (2013)',
        url: 'https://vierumaki-turnaus5-2026.torneopal.fi/taso/joukkue.php?joukkue=201313&turnaus=lime_0016&sarja=P13H',
        turnaus: 'lime_0016',
        sarja: 'P13H',
        teamId: '201313',
        host: 'vierumaki-turnaus5-2026.torneopal.fi',
        dateAdded: '2026-08-30',
    },
]

export function getSavedTournaments(): SavedTournament[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return DEFAULT_TOURNAMENTS
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
            const hasVierumaki = parsed.some(t => t.turnaus === 'lime_0016' || t.id === 'vierumaki-2026')
            if (!hasVierumaki) {
                return [...DEFAULT_TOURNAMENTS, ...parsed]
            }
            return parsed
        }
        return DEFAULT_TOURNAMENTS
    } catch {
        return DEFAULT_TOURNAMENTS
    }
}

export function saveTournamentFromUrl(inputUrl: string, customTitle?: string): SavedTournament | null {
    const parsed = parseTournamentUrl(inputUrl)
    if (!parsed) return null

    const existing = getSavedTournaments()
    const id = `${parsed.host}-${parsed.turnaus}-${parsed.sarja}-${parsed.teamId}`
    const already = existing.find(t => t.id === id || (t.turnaus === parsed.turnaus && t.teamId === parsed.teamId))
    if (already) return already

    const newTournament: SavedTournament = {
        id,
        title: customTitle || `${parsed.turnaus.toUpperCase()} Turnaus`,
        teamName: parsed.teamId ? `Joukkue #${parsed.teamId}` : 'Joukkue',
        category: parsed.sarja || 'Sarja',
        url: parsed.rawUrl,
        turnaus: parsed.turnaus,
        sarja: parsed.sarja,
        teamId: parsed.teamId,
        host: parsed.host,
        dateAdded: new Date().toISOString().slice(0, 10),
    }

    const updated = [newTournament, ...existing]
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch {
        // storage error ignore
    }
    return newTournament
}
