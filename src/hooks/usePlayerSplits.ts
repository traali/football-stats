import { useEffect, useState } from 'react'
import { fetchAPIData } from '../services/api'
import type { PlayerAPIResponse } from '../types'
import { playerSplit, type PlayerSplit } from '../utils/playerSplit'

export type SplitState = { status: 'loading' } | { status: 'ok'; split: PlayerSplit } | { status: 'error' }

const CONCURRENCY = 4
const TTL_MS = 10 * 60 * 1000
const STORE_KEY = 'fs.playerSplit.v1'
/** Small computed summaries only; the raw getPlayer payloads (100+ games each) are not persisted. */
const mem = new Map<string, { at: number; split: PlayerSplit }>()

function readStore(): Record<string, { at: number; split: PlayerSplit }> {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}') } catch { return {} }
}
function cached(key: string): PlayerSplit | undefined {
    const hit = mem.get(key) || readStore()[key]
    if (!hit || Date.now() - hit.at > TTL_MS) return undefined
    mem.set(key, hit)
    return hit.split
}
function remember(key: string, split: PlayerSplit) {
    const row = { at: Date.now(), split }
    mem.set(key, row)
    try {
        const all = readStore()
        all[key] = row
        const kept = Object.entries(all).filter(([, v]) => Date.now() - v.at < TTL_MS).slice(-200)
        localStorage.setItem(STORE_KEY, JSON.stringify(Object.fromEntries(kept)))
    } catch { /* quota or no storage */ }
}

const inFlight = new Map<string, Promise<PlayerSplit>>()
async function loadSplit(playerId: string, year: string, signal: AbortSignal): Promise<PlayerSplit> {
    const key = `${playerId}|${year}`
    const hit = cached(key)
    if (hit) return hit
    const running = inFlight.get(key)
    if (running) return running
    const p = fetchAPIData<{ player: PlayerAPIResponse }>('getPlayer', { player_id: playerId }, signal)
        .then(d => {
            const split = playerSplit(d.player?.matches as Parameters<typeof playerSplit>[0], year)
            remember(key, split)
            return split
        })
        .finally(() => inFlight.delete(key))
    inFlight.set(key, p)
    return p
}

/**
 * One getPlayer per roster player (Taso has no roster call with futsal + Winterliiga per player),
 * at most 4 at a time, cached 10 min, each card filled in as its answer arrives.
 */
export function usePlayerSplits(playerIds: string[], year: string): Record<string, SplitState> {
    const key = `${year}|${playerIds.join(',')}`
    const [state, setState] = useState<{ key: string; byId: Record<string, SplitState> }>({ key: '', byId: {} })

    useEffect(() => {
        const ids = key.split('|')[1].split(',').filter(Boolean)
        if (!ids.length || !year) return
        const ctrl = new AbortController()
        const initial: Record<string, SplitState> = {}
        for (const id of ids) {
            const hit = cached(`${id}|${year}`)
            initial[id] = hit ? { status: 'ok', split: hit } : { status: 'loading' }
        }
        setState({ key, byId: initial })
        const queue = ids.filter(id => initial[id].status === 'loading')
        const worker = async () => {
            while (queue.length && !ctrl.signal.aborted) {
                const id = queue.shift()!
                let next: SplitState
                try { next = { status: 'ok', split: await loadSplit(id, year, ctrl.signal) } } catch { next = { status: 'error' } }
                if (ctrl.signal.aborted) return
                setState(s => s.key === key ? { key, byId: { ...s.byId, [id]: next } } : s)
            }
        }
        for (let i = 0; i < Math.min(CONCURRENCY, queue.length); i++) void worker()
        return () => ctrl.abort()
    }, [key, year])

    return state.key === key ? state.byId : {}
}
