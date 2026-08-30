import { describe, it, expect } from 'vitest'
import { parseTournamentUrl } from './tournamentUrl'

describe('parseTournamentUrl', () => {
    it('parses full Torneopal team URL', () => {
        const url = 'https://vierumaki-turnaus5-2026.torneopal.fi/taso/joukkue.php?joukkue=201313&turnaus=lime_0016&sarja=P13H#'
        const result = parseTournamentUrl(url)
        expect(result).not.toBeNull()
        expect(result?.host).toBe('vierumaki-turnaus5-2026.torneopal.fi')
        expect(result?.turnaus).toBe('lime_0016')
        expect(result?.sarja).toBe('P13H')
        expect(result?.teamId).toBe('201313')
    })

    it('parses URL without https:// prefix', () => {
        const url = 'vierumaki-turnaus5-2026.torneopal.fi/taso/joukkue.php?joukkue=201313&turnaus=lime_0016&sarja=P13H'
        const result = parseTournamentUrl(url)
        expect(result).not.toBeNull()
        expect(result?.host).toBe('vierumaki-turnaus5-2026.torneopal.fi')
        expect(result?.turnaus).toBe('lime_0016')
        expect(result?.teamId).toBe('201313')
    })

    it('handles alias query param names (competition, class, teamid)', () => {
        const url = 'https://helsinkicup.torneopal.fi/taso/joukkue.php?competition=hc2026&class=B13-8&teamid=185085'
        const result = parseTournamentUrl(url)
        expect(result).not.toBeNull()
        expect(result?.turnaus).toBe('hc2026')
        expect(result?.sarja).toBe('B13-8')
        expect(result?.teamId).toBe('185085')
    })

    it('rejects non-torneopal URLs', () => {
        expect(parseTournamentUrl('https://google.com')).toBeNull()
        expect(parseTournamentUrl('')).toBeNull()
    })
})
