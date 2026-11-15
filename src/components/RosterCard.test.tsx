import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import simo from '../test/fixtures/taso/getPlayer-535740-2026-11-15.json'
import { RosterCard } from './RosterCard'
import { teamLineFor } from './TeamRoster'
import { playerSplit } from '../utils/playerSplit'

const split = playerSplit(simo.matches as unknown as Parameters<typeof playerSplit>[0], '2026')
const html = (el: React.ReactElement) => renderToStaticMarkup(<MemoryRouter>{el}</MemoryRouter>)

describe('RosterCard', () => {
    it('links to the player and shows the Jalkapallo / Winterliiga / Futsal / Yhteensä split', () => {
        const out = html(<RosterCard player={{ player_id: '535740', first_name: 'Simo', last_name: 'Oinonen', shirt_number: '55', birthyear: '2013' }}
            split={{ status: 'ok', split }} teamLine={teamLineFor({ matches: 10, goals: 1, warnings: 0 }, 'P13 Kolmonen')} />)
        expect(out).toContain('href="/player/535740"')
        expect(out).toContain('>#55<')
        for (const t of ['Jalkapallo', 'Winterliiga', 'Futsal', 'Yhteensä', 'Ei pelaajakohtaisia tilastoja', '>39<', '>34<', '>41<', '>35<']) expect(out).toContain(t)
        expect(out).toContain('Tässä joukkueessa (P13 Kolmonen): 10 ott · 1 m · 0 var')
        // assists / minutes are not recorded for youth: no columns
        expect(out).not.toContain('>Syö<')
        expect(out).not.toContain('>Min<')
    })

    it('borrowed card without team line and loading state', () => {
        const out = html(<RosterCard player={{ player_id: '1', first_name: 'A', last_name: 'B' }} split={{ status: 'loading' }} />)
        expect(out).not.toContain('Tässä joukkueessa')
        expect(out).toContain('Ladataan tilastoja')
    })

    it('team line is empty when the player has no games for this team', () => {
        expect(teamLineFor({ matches: 0, goals: 0 })).toBe('')
    })
})
