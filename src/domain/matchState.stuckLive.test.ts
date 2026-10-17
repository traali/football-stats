import { describe, it, expect } from 'vitest'
import rows from '../test/fixtures/taso/getMatches_stuck_live_35118072.json'
import { displayScore, matchPhase, splitMatches, type MatchLike } from './matchState'
import { needsQuietRefresh } from '../hooks/useQuietRefresh'

const at = (hhmm: string) => new Date(`2026-10-17T${hhmm}:00+03:00`)
const row = (id: string) => rows.matches.find(m => m.match_id === id) as MatchLike

describe('old games Taso left on status Live (SISU/Valkoinen, real rows)', () => {
    it('a 2025 Live row is not on now and shows no score', () => {
        expect(matchPhase(row('3891605'), at('14:28'))).toBe('stale')
        expect(matchPhase(row('3891623'), at('14:28'))).toBe('stale')
        expect(displayScore(row('3891605'), at('14:28'))).toBeNull()
        expect(splitMatches([row('3891605'), row('3891623')], at('14:28')).onNow).toHaveLength(0)
    })
    it('they do not keep the quiet refresh running', () => {
        expect(needsQuietRefresh([row('3891605'), row('3891623')], at('14:28'))).toBe(false)
    })
    it("today's live game is still live", () => {
        expect(matchPhase(row('4313454'), at('14:35'))).toBe('live')
    })
})
