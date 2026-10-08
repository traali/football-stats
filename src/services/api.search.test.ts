import { describe, it, expect, vi, afterEach } from 'vitest'
import simo from '../test/fixtures/taso/search_simo_oinonen.json'
import ppj from '../test/fixtures/taso/search_ppj_first12.json'
import club52 from '../test/fixtures/taso/getClub_52_trimmed.json'
import { getClubInfo, searchTaso } from './api'

function stubFetch(body: unknown) {
    const fn = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async () => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fn)
    return fn
}

afterEach(() => { vi.unstubAllGlobals() })

describe('searchTaso', () => {
    it('finds Simo Oinonen as a player by full name', async () => {
        const fetchMock = stubFetch(simo)
        const r = await searchTaso('Simo Oinonen')
        expect(r).toEqual([expect.objectContaining({ type: 'player', id: '535740', text: 'Simo Oinonen' })])
        expect(String(fetchMock.mock.calls[0][0])).toContain('search?text=Simo+Oinonen')
    })

    it('returns teams and clubs for a club prefix', async () => {
        stubFetch(ppj)
        const r = await searchTaso('PPJ')
        expect(r.length).toBe(ppj.results.length)
        expect(r.every(x => ['team', 'club', 'player'].includes(x.type))).toBe(true)
    })

    it('does not call Taso for one letter', async () => {
        const fetchMock = stubFetch(ppj)
        expect(await searchTaso('P')).toEqual([])
        expect(fetchMock).not.toHaveBeenCalled()
    })
})

describe('getClubInfo', () => {
    it('keeps only active teams and drops every contact field', async () => {
        stubFetch(club52)
        const c = await getClubInfo('52')
        expect(c?.name).toBe('Pallo-Pojat Juniorit')
        expect(c?.teams.map(t => t.team_id).sort()).toEqual(['184923', '185085', '35230232'])
        const json = JSON.stringify(c)
        expect(json).not.toMatch(/contact|MASKED|email|phone|officials|example\.invalid/i)
    })
})
