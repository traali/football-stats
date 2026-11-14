import { describe, it, expect } from 'vitest'
import { opponentOf, teamToday } from './favoriteHero'

const at = (iso: string) => new Date(iso)
const base = { team_A_id: '185085', team_A_name: 'PPJ/Laru sin', team_B_id: '999', team_B_name: 'KelA' }
const played = { ...base, match_id: 'p1', status: 'Played', date: '2026-11-07', time: '10:00:00', fs_A: '2', fs_B: '3' }
const older = { ...base, match_id: 'p0', status: 'Played', date: '2026-10-31', time: '10:00:00', fs_A: '1', fs_B: '0' }
const next = { ...base, match_id: 'n1', status: 'Fixture', date: '2026-12-05', time: '17:00:00', fs_A: '0', fs_B: '0' }
const later = { ...base, match_id: 'n2', status: 'Fixture', date: '2026-12-12', time: '17:00:00' }
const live = { ...base, match_id: 'l1', status: 'Live', date: '2026-11-14', time: '09:00:00', live_timer_on: '1', fs_A: '1', fs_B: '0' }

describe('teamToday (home + team hero)', () => {
    it('a running game wins over the next one', () => {
        const t = teamToday([played, next, live], at('2026-11-14T09:20:00+02:00'))
        expect(t.hero?.kind).toBe('live')
        expect(t.hero?.match.match_id).toBe('l1')
        expect(t.latestResult?.match_id).toBe('p1')
    })
    it('otherwise the earliest upcoming game', () => {
        const t = teamToday([later, played, next, older], at('2026-11-14T12:00:00+02:00'))
        expect(t.hero).toEqual({ kind: 'next', match: next })
        expect(t.latestResult?.match_id).toBe('p1')
    })
    it('season over: falls back to the latest result, labelled as such', () => {
        const t = teamToday([older, played], at('2026-11-14T12:00:00+02:00'))
        expect(t.hero).toEqual({ kind: 'latest', match: played })
    })
    it('no games: no hero, nothing invented', () => {
        expect(teamToday([], at('2026-11-14T12:00:00+02:00'))).toEqual({ hero: null, latestResult: null, otherOnNow: [] })
    })
    it('old fixture that never got a result is not "next"', () => {
        const stale = { ...base, match_id: 's1', status: 'Fixture', date: '2026-09-01', time: '10:00:00' }
        expect(teamToday([stale], at('2026-11-14T12:00:00+02:00')).hero).toBeNull()
    })
})

describe('opponentOf', () => {
    it('home and away', () => {
        expect(opponentOf(base, '185085')).toEqual({ id: '999', name: 'KelA', home: true })
        expect(opponentOf(base, '999')).toEqual({ id: '185085', name: 'PPJ/Laru sin', home: false })
        expect(opponentOf(base, '1')).toBeNull()
    })
})

import { friendlyDay } from './favoriteHero'
describe('friendlyDay', () => {
    it('relative words around today', () => {
        expect(friendlyDay('2026-11-14', '2026-11-14')).toBe('Tänään')
        expect(friendlyDay('2026-11-15', '2026-11-14')).toBe('Huomenna')
        expect(friendlyDay('2026-11-13', '2026-11-14')).toBe('Eilen')
    })
    it('weekday + date, year only when not this year', () => {
        expect(friendlyDay('2026-12-05', '2026-11-14')).toBe('la 5.12.')
        expect(friendlyDay('2027-01-09', '2026-11-14')).toBe('la 9.1.2027')
        expect(friendlyDay('', '2026-11-14')).toBe('')
    })
})
