import { describe, it, expect } from 'vitest'
import fixture7127 from '../test/fixtures/fudis/7127-roof-2026-10-25.json'
import { buildFudisView, groupResultsToStanding, helsinkiDateTime, resolvePlayoffSides, shortGroupName } from './fudisMap'
import { playingMinutesFromInfo, type FudisTournament } from './fudisturnaus'

const d = fixture7127 as unknown as FudisTournament

describe('playingMinutesFromInfo', () => {
    it('parses 1x30 from Roof LKV info', () => {
        expect(playingMinutesFromInfo(d.info)).toBe(30)
    })
    it('parses 2x20 and falls back to 30', () => {
        expect(playingMinutesFromInfo('Peliaika: 2x20 minuuttia')).toBe(40)
        expect(playingMinutesFromInfo('')).toBe(30)
    })
})

describe('buildFudisView', () => {
    it('maps finished group + playoff rows without inventing scores', () => {
        const v = buildFudisView(d)
        expect(v.playingMin).toBe(30)
        expect(v.groupRows).toHaveLength(20)
        expect(v.playoffRows).toHaveLength(4)
        expect(v.all.every(m => String(m.match_id).startsWith('fudis-'))).toBe(true)
        const played = v.groupRows.filter(m => m.status === 'Played')
        expect(played.length).toBeGreaterThan(0)
        expect(played.every(m => m.fs_A != null && m.fs_B != null)).toBe(true)
        const open = v.groupRows.filter(m => m.status === 'Fixture')
        expect(open.every(m => m.fs_A == null && m.fs_B == null)).toBe(true)
    })

    it('exposes Helsinki kickoff for a known match', () => {
        const first = d.groupStageMatches[0]
        const { date, time } = helsinkiDateTime(first.startTime)
        expect(date).toMatch(/^2026-10-25$/)
        expect(time).toMatch(/^\d{2}:\d{2}$/)
    })

    it('builds standings from API results only', () => {
        const g = d.groups[0]
        const rows = groupResultsToStanding(g)
        expect(rows[0].current_standing).toBe(1)
        expect(rows.map(r => r.team_name)).toEqual(g.results.map(r => r.teamName))
        expect(rows[0].points).toBe(g.results[0].points)
    })

    it('shortens lohko names', () => {
        expect(shortGroupName('Lohko A – P2013')).toBe('Lohko A')
    })
})

describe('resolvePlayoffSides', () => {
    it('resolves A1-B2 style titles from finished group tables', () => {
        const m = d.playoffMatches.find(x => /A\d/.test(x.title || '')) || d.playoffMatches[0]
        const sides = resolvePlayoffSides(d, m)
        expect(sides.home.name).toBeTruthy()
        expect(sides.away.name).toBeTruthy()
    })
})
