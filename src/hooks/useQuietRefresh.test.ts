import { describe, it, expect } from 'vitest'
import live from '../test/fixtures/taso/getMatches_live_rows_2026-10-17.json'
import brk from '../test/fixtures/taso/getMatches_break_rows_2026-10-17.json'
import { needsQuietRefresh } from './useQuietRefresh'
import type { MatchLike } from '../domain/matchState'

const at = (hhmm: string) => new Date(`2026-10-17T${hhmm}:00+03:00`)
const row = (id: string) => [...live.matches, ...brk.matches].find(m => m.match_id === id) as MatchLike

describe('needsQuietRefresh (real Taso rows 2026-10-17)', () => {
    it('polls while a listed game is live or at half-time', () => {
        expect(needsQuietRefresh([row('4312783')], at('13:50'))).toBe(true)
        expect(needsQuietRefresh([row('4336888')], at('13:53'))).toBe(true)
    })
    it('polls from 15 min before kickoff, not earlier', () => {
        // 4313216: kickoff 13:50, Taso card opened early, clock not started → upcoming before 13:50
        expect(needsQuietRefresh([row('4313216')], at('13:30'))).toBe(false)
        expect(needsQuietRefresh([row('4313216')], at('13:36'))).toBe(true)
    })
    it('stops once the game is finished', () => {
        const played = { ...row('4312783'), status: 'Played' }
        expect(needsQuietRefresh([played], at('13:50'))).toBe(false)
    })
    it('nothing listed → no polling', () => {
        expect(needsQuietRefresh([], at('13:50'))).toBe(false)
    })
})
