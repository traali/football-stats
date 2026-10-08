import { describe, it, expect } from 'vitest'
import { parseTournamentUrl } from './tournamentUrl'

describe('parseTournamentUrl', () => {
    it('parses a Palloliitto tulospalvelu category link', () => {
        const r = parseTournamentUrl('https://tulospalvelu.palloliitto.fi/category/B13-8!hc2026/group/13/results')
        expect(r).toMatchObject({ turnaus: 'hc2026', sarja: 'B13-8', groupId: '13', teamId: '' })
    })

    it('parses a category link without a group', () => {
        expect(parseTournamentUrl('tulospalvelu.palloliitto.fi/category/T14!sc2026/tables')).toMatchObject({ turnaus: 'sc2026', sarja: 'T14', groupId: '' })
    })

    it('parses Torneopal query links (turnaus/sarja/joukkue and aliases)', () => {
        expect(parseTournamentUrl('https://vierumaki-turnaus5-2026.torneopal.fi/taso/joukkue.php?joukkue=201313&turnaus=lime_0016&sarja=P13H#'))
            .toMatchObject({ turnaus: 'lime_0016', sarja: 'P13H', teamId: '201313' })
        expect(parseTournamentUrl('https://helsinkicup.torneopal.fi/taso/joukkue.php?competition=hc2026&class=B13-8&teamid=185085'))
            .toMatchObject({ turnaus: 'hc2026', sarja: 'B13-8', teamId: '185085' })
    })

    it('parses this app\'s own tournament link', () => {
        expect(parseTournamentUrl('https://traali.github.io/football-stats/#/turnaukset/hc2026/B13-8/185085'))
            .toMatchObject({ turnaus: 'hc2026', sarja: 'B13-8', teamId: '185085' })
    })

    it('rejects other sites and links without a competition', () => {
        expect(parseTournamentUrl('https://google.com')).toBeNull()
        expect(parseTournamentUrl('')).toBeNull()
        expect(parseTournamentUrl('https://x.torneopal.fi/taso/')).toBeNull()
        expect(parseTournamentUrl('https://tulospalvelu.palloliitto.fi/match/4208631')).toBeNull()
    })
})
