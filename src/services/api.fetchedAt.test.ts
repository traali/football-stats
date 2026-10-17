import { describe, it, expect, vi, afterEach } from 'vitest'
import { getTeamMatches, teamMatchesFetchedAt, getMatchDetails, matchFetchedAt } from './api'

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })

describe('fetchedAt is the time of the last successful Taso answer', () => {
    it('set on a successful getMatches, unchanged by a failed refresh', async () => {
        vi.useFakeTimers({ toFake: ['Date'] })
        vi.setSystemTime(new Date('2026-10-17T11:31:00Z'))
        vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ call: { status: 'ok' }, matches: [{ match_id: '1' }] }), { status: 200 })))
        await getTeamMatches('999001')
        const first = teamMatchesFetchedAt('999001')
        expect(first).toBe(new Date('2026-10-17T11:31:00Z').getTime())
        // 5 min later Taso answers 500 → keep the old time
        vi.setSystemTime(new Date('2026-10-17T11:36:00Z'))
        vi.stubGlobal('fetch', vi.fn(async () => new Response('x', { status: 500 })))
        await expect(getTeamMatches('999001')).rejects.toBeTruthy()
        expect(teamMatchesFetchedAt('999001')).toBe(first)
    }, 20000)

    it('set on a successful getMatch', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ call: { status: 'ok' }, match: { match_id: '999002', status: 'Live' } }), { status: 200 })))
        const before = Date.now()
        await getMatchDetails('999002')
        expect(matchFetchedAt('999002')).toBeGreaterThanOrEqual(before)
    })
})
