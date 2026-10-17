import { describe, it, expect, vi, afterEach } from 'vitest'
import { tasoHash, tasoUrl, getMatchDetails } from './api'

afterEach(() => { vi.unstubAllGlobals() })

describe('Taso request signing', () => {
    // Hash Taso accepted for getMatch?match_id=4208631 on 2026-10-17 (seen in the x-url response header).
    it('matches the hash tulospalvelu sends for getMatch', async () => {
        expect(await tasoHash('getMatch', { match_id: '4208631' }))
            .toBe('72bc620417894b41f41cd5f82634bd140889c33f4896a1148b34fc3a081d3fa6')
    })

    it('puts hash last and signs raw values', async () => {
        const url = await tasoUrl('search', { text: 'PPJ Laru' })
        expect(url).toMatch(/^https:\/\/spl\.torneopal\.net\/taso\/rest\/search\?text=PPJ\+Laru&hash=[0-9a-f]{64}$/)
        expect(url.endsWith(await tasoHash('search', { text: 'PPJ Laru' }))).toBe(true)
    })

    it('every API call carries the hash', async () => {
        const fn = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async () =>
            new Response(JSON.stringify({ call: { status: 'ok' }, match: { match_id: '4208631', status: 'Played' } }), { status: 200 }))
        vi.stubGlobal('fetch', fn)
        await getMatchDetails('4208631')
        expect(String(fn.mock.calls[0][0])).toBe('https://spl.torneopal.net/taso/rest/getMatch?match_id=4208631&hash=72bc620417894b41f41cd5f82634bd140889c33f4896a1148b34fc3a081d3fa6')
    })
})
