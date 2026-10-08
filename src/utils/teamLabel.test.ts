import { describe, it, expect } from 'vitest'
import placeholders from '../test/fixtures/taso/getMatches_placeholders_2026-10-31.json'
import ko from '../test/fixtures/taso/getGroup_hc2026_B13-8_17.json'
import { isPlaceholderTeam, teamLabel } from './teamLabel'

describe('teamLabel (bracket slots without a team)', () => {
    it('turns Taso slot codes into plain Finnish, never a made-up team', () => {
        expect(teamLabel('', 'v345983')).toBe('Ottelun 345983 voittaja')
        expect(teamLabel('', 'h345983')).toBe('Ottelun 345983 häviäjä')
        expect(teamLabel('0', '', 'C/III')).toBe('Lohkon C 3.')
        expect(teamLabel('', '', '')).toBe('Ratkeaa myöhemmin')
    })

    it('real teams keep their Taso name', () => {
        expect(teamLabel('185085', 'PPJ/Laru sin', 'M/IV')).toBe('PPJ/Laru sin')
        expect(isPlaceholderTeam('185085')).toBe(false)
    })

    it('labels every placeholder in the real 2026-10-31 fixtures', () => {
        for (const m of placeholders.matches) {
            for (const side of ['A', 'B'] as const) {
                const id = m[`team_${side}_id` as const]
                const label = teamLabel(id, m[`team_${side}_name` as const], (m as unknown as Record<string, string>)[`team_${side}_description`])
                expect(label.length).toBeGreaterThan(0)
                if (isPlaceholderTeam(id)) expect(label).not.toMatch(/^[vh]\d+$/i)
            }
        }
    })

    it('Helsinki Cup final slot written out by Taso is printed as is', () => {
        const final = ko.group.matches.find(m => m.match_id === '4252075')
        if (final) {
            expect(teamLabel(final.team_B_id, final.team_B_name, final.team_B_description)).toBe(final.team_B_name)
        }
        expect(teamLabel('', 'Voittaja ottelusta GrIFK/1 - PKKU (7710)', 'v7710')).toBe('Voittaja ottelusta GrIFK/1 - PKKU (7710)')
    })
})
