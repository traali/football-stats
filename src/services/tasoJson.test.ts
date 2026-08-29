import { describe, it, expect } from 'vitest'
import { parseTasoPayload } from './api'

describe('parseTasoPayload', () => {
    it('parses clean JSON', () => {
        const data = parseTasoPayload('{"call":{"status":"ok"},"player":{"first_name":"A"}}') as { player: { first_name: string } }
        expect(data.player.first_name).toBe('A')
    })

    it('skips prepended PHP HTML', () => {
        const raw = '<br />\n<b>Warning</b>: something\n{"call":{"status":"ok"},"player":{"last_name":"Jantti"}}'
        const data = parseTasoPayload(raw) as { player: { last_name: string } }
        expect(data.player.last_name).toBe('Jantti')
    })
})
