import { describe, it, expect } from 'vitest'
import snap from '../test/fixtures/taso/getMatch_live_states_2026-10-17.json'
import { displayScore, matchPhase, phaseLabel, splitMatches, type MatchLike } from './matchState'

const byId = (id: string) => snap.matches.find(m => m.match_id === id) as MatchLike
const at = (hhmm: string) => new Date(`2026-10-17T${hhmm}:00+03:00`)

describe('Taso status Live before kickoff (real snapshots 2026-10-17)', () => {
    it('card opened, clock never started: upcoming and no 0–0 before 13:50', () => {
        const m = byId('4313216')
        expect(matchPhase(m, at('13:48'))).toBe('upcoming')
        expect(phaseLabel(m, at('13:48'))).toBe('Tulossa')
        expect(displayScore(m, at('13:48'))).toBeNull()
    })

    it('stays on the list (upcoming) before kickoff and goes live at kickoff', () => {
        const m = byId('4313216')
        expect(splitMatches([m], at('13:48')).upcoming).toHaveLength(1)
        expect(matchPhase(m, at('13:50'))).toBe('live')
        expect(splitMatches([m], at('13:51')).onNow).toHaveLength(1)
    })

    it('clock started early (13:46:34): live with the running 0–0', () => {
        const m = byId('4313452')
        expect(matchPhase(m, at('13:48'))).toBe('live')
        expect(displayScore(m, at('13:48'))).toEqual({ a: 0, b: 0 })
    })

    it('running game shows Taso live score', () => {
        expect(displayScore(byId('4312783'), at('13:48'))).toEqual({ a: 7, b: 2 })
    })
})

import rows from '../test/fixtures/taso/getMatches_live_rows_2026-10-17.json'
const row = (id: string) => rows.matches.find(m => m.match_id === id) as MatchLike

describe('getMatches rows during live games (live_A empty, score in fs_A)', () => {
    it('shows the running score from fs_A/fs_B', () => {
        expect(displayScore(row('4312783'), at('13:50'))).toEqual({ a: 7, b: 2 })
    })
    it('clock started early: 0–0 is a real running score', () => {
        expect(displayScore(row('4313452'), at('13:50'))).toEqual({ a: 0, b: 0 })
    })
    it('clock not started: no 0–0 before kickoff, still listed', () => {
        expect(displayScore(row('4313216'), at('13:48'))).toBeNull()
        expect(splitMatches([row('4313216')], at('13:48')).upcoming).toHaveLength(1)
        expect(displayScore(row('4313216'), at('13:51'))).toBeNull()
        expect(splitMatches([row('4313216')], at('13:51')).onNow).toHaveLength(1)
    })
})
