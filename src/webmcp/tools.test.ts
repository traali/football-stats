import { describe, it, expect, vi } from 'vitest'
import m4208643 from '../test/fixtures/taso/getMatch_4208643.json'
import m4208631 from '../test/fixtures/taso/getMatch_4208631.json'
import m4208570 from '../test/fixtures/taso/getMatch_4208570.json'
import player from '../test/fixtures/taso/getPlayer_535740.json'
import teamMatches from '../test/fixtures/taso/getMatches_team_185085.json'

const api = vi.hoisted(() => ({
    getMatchDetails: vi.fn(),
    getPlayerData: vi.fn(),
    getTeamMatches: vi.fn(),
    getTeamProfile: vi.fn(),
    searchTaso: vi.fn(),
    APINotFoundError: class extends Error {},
    APIRateLimitError: class extends Error {},
    APITimeoutError: class extends Error {},
}))
vi.mock('../services/api', () => api)

import { matchTool, openPath, playerTool, teamTool } from './tools'

const DURING = new Date('2026-10-08T18:30:00+03:00')
const MORNING = new Date('2026-10-08T07:00:00+03:00')

describe('WebMCP tools follow the truth rules', () => {
    it('tonight\'s game: "vs" and Käynnissä, never Taso\'s placeholder 0–0', async () => {
        api.getMatchDetails.mockResolvedValue(m4208643.match)
        const text = await matchTool({ matchId: '4208643' }, DURING)
        expect(text).toContain(' vs ')
        expect(text).toContain('Käynnissä')
        expect(text).not.toMatch(/0–0/)
        expect(text).not.toMatch(/°C|katsojaa/)
        expect(text).toContain('https://tulospalvelu.palloliitto.fi/match/4208643')
    })

    it('a played game gives Taso\'s score and conditions', async () => {
        api.getMatchDetails.mockResolvedValue(m4208631.match)
        const text = await matchTool({ matchId: '4208631' })
        expect(text).toContain('2–3')
        expect(text).toContain('13 °C')
        expect(text).toContain('Pilvistä')
        expect(text).toContain('30 katsojaa')
    })

    it('a walkover says Luovutus', async () => {
        api.getMatchDetails.mockResolvedValue(m4208570.match)
        expect(await matchTool({ matchId: '4208570' })).toContain('Luovutus')
    })

    it('refuses invented ids', async () => {
        await expect(matchTool({ matchId: 'abc' })).rejects.toThrow(/numeric/)
        expect(() => openPath({ kind: 'team', id: 'PPJ' })).toThrow()
        expect(openPath({ kind: 'search', id: 'Laru sin' })).toBe('/haku?q=Laru%20sin')
    })

    it('player tool lists both 18:00 games as running at 18:30', async () => {
        api.getPlayerData.mockResolvedValue(player.player)
        const text = await playerTool({ playerId: '535740' }, DURING)
        const live = text.split('Tulevat:')[0]
        expect(live).toContain('match_id 4208643')
        expect(live).toContain('match_id 4321827')
        expect(text).not.toContain('match_id 2904676 ·')
    })

    it('team tool: tonight\'s game is upcoming in the morning, the 2022 Planned game nowhere upcoming', async () => {
        api.getTeamProfile.mockResolvedValue({ team_id: '185085', team_name: 'PPJ/Laru sin', club_name: 'Pallo-Pojat Juniorit' })
        api.getTeamMatches.mockResolvedValue(teamMatches.matches)
        const text = await teamTool({ teamId: '185085' }, MORNING)
        const upcoming = text.split('Tulevat:')[1].split('Viimeisimmät tulokset:')[0]
        expect(upcoming).toContain('match_id 4208643')
        expect(upcoming).not.toContain('2728599')
        expect(text).not.toMatch(/contact|@|puhelin/i)
    })
})
