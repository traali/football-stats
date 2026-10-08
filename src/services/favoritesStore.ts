import { normalizeTeamId } from './teamSelection'

export interface FavoriteTeam {
    id: string
    name: string
    category?: string
}

export interface FavoritePlayer {
    id: string
    name: string
    teamName?: string
    category?: string
    img_url?: string
    birthyear?: string
}

export interface FavoritesState {
    teams: FavoriteTeam[]
    players: FavoritePlayer[]
}

const TEAMS_KEY = 'favoriteTeams'
const PLAYERS_KEY = 'favoritePlayers'

function storage(): Storage | null {
    try { return typeof localStorage === 'undefined' ? null : localStorage } catch { return null }
}

export function parseTeams(raw: string | null): FavoriteTeam[] {
    if (!raw) return []
    try {
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        const out: FavoriteTeam[] = []
        for (const item of parsed) {
            if (typeof item === 'string') {
                const id = normalizeTeamId(item)
                if (id) out.push({ id, name: id })
            } else if (item && typeof item === 'object' && typeof item.id === 'string') {
                const id = normalizeTeamId(item.id)
                if (id) out.push({ id, name: String(item.name || id), category: item.category ? String(item.category) : undefined })
            }
        }
        return out.filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i)
    } catch {
        return []
    }
}

export function parsePlayers(raw: string | null): FavoritePlayer[] {
    if (!raw) return []
    try {
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        const out: FavoritePlayer[] = []
        for (const item of parsed) {
            if (item && typeof item === 'object' && /^\d+$/.test(String(item.id || ''))) {
                out.push({
                    id: String(item.id),
                    name: String(item.name || item.id),
                    teamName: item.teamName ? String(item.teamName) : undefined,
                    category: item.category ? String(item.category) : undefined,
                    img_url: item.img_url ? String(item.img_url) : undefined,
                    birthyear: item.birthyear ? String(item.birthyear) : undefined,
                })
            }
        }
        return out.filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i)
    } catch {
        return []
    }
}

function read(): FavoritesState {
    const s = storage()
    return { teams: parseTeams(s?.getItem(TEAMS_KEY) ?? null), players: parsePlayers(s?.getItem(PLAYERS_KEY) ?? null) }
}

let state: FavoritesState = read()
const listeners = new Set<() => void>()

function commit(next: FavoritesState) {
    state = next
    const s = storage()
    try {
        s?.setItem(TEAMS_KEY, JSON.stringify(next.teams))
        s?.setItem(PLAYERS_KEY, JSON.stringify(next.players))
    } catch { /* private mode / full storage: keep in memory */ }
    listeners.forEach(l => l())
}

if (typeof window !== 'undefined') {
    // Another tab changed favourites.
    window.addEventListener('storage', e => {
        if (e.key === TEAMS_KEY || e.key === PLAYERS_KEY) { state = read(); listeners.forEach(l => l()) }
    })
}

export const favoritesStore = {
    get: (): FavoritesState => state,
    subscribe(listener: () => void): () => void {
        listeners.add(listener)
        return () => { listeners.delete(listener) }
    },
    /** Re-read localStorage (tests, or after an external write). */
    reload() { state = read(); listeners.forEach(l => l()) },
    toggleTeam(teamId: string, name?: string, category?: string) {
        const id = normalizeTeamId(teamId)
        if (!id) return
        const exists = state.teams.some(t => t.id === id)
        commit({
            ...state,
            teams: exists ? state.teams.filter(t => t.id !== id) : [...state.teams, { id, name: name || id, category }],
        })
    },
    updateTeam(teamId: string, name: string, category?: string) {
        const id = normalizeTeamId(teamId)
        const i = state.teams.findIndex(t => t.id === id)
        if (i < 0 || (state.teams[i].name === name && state.teams[i].category === category)) return
        const teams = [...state.teams]
        teams[i] = { ...teams[i], name, category }
        commit({ ...state, teams })
    },
    togglePlayer(player: FavoritePlayer) {
        if (!/^\d+$/.test(player.id)) return
        const exists = state.players.some(p => p.id === player.id)
        commit({ ...state, players: exists ? state.players.filter(p => p.id !== player.id) : [...state.players, player] })
    },
    clearTeams() { commit({ ...state, teams: [] }) },
    clearPlayers() { commit({ ...state, players: [] }) },
}
