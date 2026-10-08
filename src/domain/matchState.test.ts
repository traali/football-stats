import { describe, it, expect } from 'vitest'
import teamMatches from '../test/fixtures/taso/getMatches_team_185085.json'
import group4 from '../test/fixtures/taso/getGroup_etejp26_P133_4.json'
import match4208643 from '../test/fixtures/taso/getMatch_4208643.json'
import match4208631 from '../test/fixtures/taso/getMatch_4208631.json'
import match4208570 from '../test/fixtures/taso/getMatch_4208570.json'
import player535740 from '../test/fixtures/taso/getPlayer_535740.json'
import {
    displayScore, helsinkiToMs, isForfeit, matchPhase, outcomeFor, phaseLabel, splitMatches, teamRecord, type MatchLike,
} from './matchState'
import { pickHeroMatch } from '../utils/matchLive'
import { mergePlayerMatches } from '../utils/playerMatches'
import { matchFacts } from '../utils/matchFacts'
import type { MatchDetails, PlayerAPIResponse } from '../types'

// Fixtures were captured on 2026-10-08 ~07:00 Helsinki. Tonight's games start 18:00 Helsinki (15:00 UTC).
const MORNING = new Date('2026-10-08T07:00:00+03:00')
const DURING = new Date('2026-10-08T18:30:00+03:00')
const AFTER = new Date('2026-10-08T19:45:00+03:00')
const TOMORROW = new Date('2026-10-09T09:00:00+03:00')

const list = teamMatches.matches as unknown as (MatchLike & { match_id: string; team_A_id: string; team_B_id: string })[]
const groupMatches = group4.group.matches as unknown as (MatchLike & { match_id: string; team_A_id: string; team_B_id: string })[]
const byId = (id: string) => list.find(m => m.match_id === id)!

describe('Helsinki time', () => {
    it('reads Taso times as Helsinki wall clock whatever the phone time zone is', () => {
        expect(helsinkiToMs('2026-10-08', '18:00:00')).toBe(Date.parse('2026-10-08T15:00:00Z'))
        // Winter time (UTC+2) after the last Sunday of October.
        expect(helsinkiToMs('2026-11-10', '18:00:00')).toBe(Date.parse('2026-11-10T16:00:00Z'))
    })
})

describe('team 185085 match list (real Taso data)', () => {
    it('has 124 games: 122 results, tonight\'s Fixture and one old Planned game', () => {
        expect(list).toHaveLength(124)
        const split = splitMatches(list, MORNING)
        expect(split.results).toHaveLength(122)
        expect(split.upcoming.map(m => m.match_id)).toEqual(['4208643'])
        expect(split.onNow).toHaveLength(0)
    })

    it('never lists the 2022 Planned game (no date in the future) as upcoming', () => {
        const planned = byId('2728599')
        expect(planned.status).toBe('Planned')
        expect(matchPhase(planned, MORNING)).toBe('stale')
    })

    it('shows tonight\'s game as live during 18:00–19:10 (+grace) without inventing a score', () => {
        const m = byId('4208643')
        expect(matchPhase(m, DURING)).toBe('live')
        expect(phaseLabel(m, DURING)).toBe('Käynnissä')
        expect(displayScore(m, DURING)).toBeNull()
        expect(splitMatches(list, DURING).onNow.map(x => x.match_id)).toEqual(['4208643'])
    })

    it('keeps it visible as "Tulosta odotetaan" after the slot, and never upcoming the next day', () => {
        const m = byId('4208643')
        expect(matchPhase(m, AFTER)).toBe('awaiting')
        expect(phaseLabel(m, AFTER)).toBe('Tulosta odotetaan')
        expect(matchPhase(m, TOMORROW)).toBe('stale')
        expect(splitMatches(list, TOMORROW).upcoming).toHaveLength(0)
    })

    it('hero: next game in the morning, the running game in the evening', () => {
        expect(pickHeroMatch(list, MORNING)?.match_id).toBe('4208643')
        expect(pickHeroMatch(list, DURING)?.match_id).toBe('4208643')
    })

    it('autumn 2026 record matches Taso\'s table row (9 played, 4-0-5, 22-38)', () => {
        const autumn = list.filter(m => (m as { group_id?: string; competition_id?: string }).competition_id === 'etejp26' && (m as { group_id?: string }).group_id === '4')
        expect(teamRecord(autumn, '185085')).toEqual({ played: 9, won: 4, tied: 0, lost: 5, goalsFor: 22, goalsAgainst: 38 })
    })
})

describe('getMatch details', () => {
    it('4208643 before kickoff: Taso\'s fs 0/0 and live 0/0 are not a score', () => {
        const m = match4208643.match as unknown as MatchDetails
        expect(m.fs_A).toBe('0')
        expect(displayScore(m, MORNING)).toBeNull()
        expect(matchPhase(m, MORNING)).toBe('upcoming')
        expect(displayScore(m, DURING)).toBeNull()
        expect(matchFacts(m)).toEqual({ weather: undefined, temperature: undefined, attendance: undefined })
    })

    it('4208631 is a 2–3 result with Taso\'s own conditions', () => {
        const m = match4208631.match as unknown as MatchDetails
        expect(displayScore(m)).toEqual({ a: 2, b: 3 })
        expect(matchFacts(m)).toEqual({ weather: 'Pilvistä', temperature: '13 °C', attendance: '30 katsojaa' })
    })

    it('4208570 is a forfeit even though getMatch says Played', () => {
        const m = match4208570.match as unknown as MatchDetails
        expect(m.status).toBe('Played')
        expect(isForfeit(m)).toBe(true)
        expect(phaseLabel(m)).toBe('Luovutus')
        expect(displayScore(m)).toEqual({ a: 0, b: 3 })
    })
})

describe('Syksy 1 group (forfeits, standings)', () => {
    it('Forfeited games are results, never upcoming', () => {
        const forfeits = groupMatches.filter(m => m.status === 'Forfeited')
        expect(forfeits.map(m => m.match_id).sort()).toEqual(['4208570', '4208588', '4208616'])
        for (const m of forfeits) {
            expect(matchPhase(m, MORNING)).toBe('result')
            expect(phaseLabel(m, MORNING)).toBe('Luovutus')
        }
        const split = splitMatches(groupMatches, MORNING)
        expect(split.results).toHaveLength(109)
        expect(split.upcoming.some(m => m.status === 'Forfeited')).toBe(false)
    })

    it('counting results the app\'s way reproduces every row of Taso\'s table', () => {
        for (const t of group4.group.teams) {
            const r = teamRecord(groupMatches, t.team_id)
            expect({ id: t.team_id, ...r }).toEqual({
                id: t.team_id,
                played: Number(t.matches_played), won: Number(t.matches_won), tied: Number(t.matches_tied), lost: Number(t.matches_lost),
                goalsFor: Number(t.goals_for), goalsAgainst: Number(t.goals_against),
            })
        }
    })

    it('LePa/keltainen gets the walkover win', () => {
        expect(outcomeFor(groupMatches.find(m => m.match_id === '4208570')!, '35139221')).toBe('V')
    })
})

describe('player 535740', () => {
    const player = player535740.player as unknown as PlayerAPIResponse
    it('tonight\'s two 18:00 games come from `upcoming` and both show as live at 18:30', () => {
        const all = mergePlayerMatches(player)
        const split = splitMatches(all, DURING)
        expect(split.onNow.map(m => m.match_id).sort()).toEqual(['4208643', '4321827'])
        expect(split.upcoming.map(m => m.match_id)).toContain('4321829')
    })

    it('the stale 2023 Fixture 2904676 is never upcoming', () => {
        const all = mergePlayerMatches(player)
        const stale = all.find(m => m.match_id === '2904676')!
        expect(stale.status).toBe('Fixture')
        expect(matchPhase(stale, MORNING)).toBe('stale')
        expect(splitMatches(all, MORNING).upcoming.map(m => m.match_id)).not.toContain('2904676')
    })
})
