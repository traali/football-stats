import { describe, it, expect } from 'vitest'
import { evaluatePlayer, evaluateSquad } from './evaluate'
import { ETELA_2026, LANSI_2026 } from './rules'
import { parseLevel, parseAgeClass, parseFormat } from './parseLevel'
import { parseSeasonHalf } from './seasonHalf'
import type { OfficialAppearance, PlayerEligibilityContext, TargetMatch } from './types'

function app(partial: Partial<OfficialAppearance>): OfficialAppearance {
    return {
        playerId: 'p1',
        matchId: 'm1',
        date: '2026-08-28',
        teamId: 'higher',
        clubId: 'clubA',
        ageClass: 'P13',
        level: 'liiga',
        format: '11v11',
        official: true,
        onLineup: true,
        lineupConfirmed: true,
        seasonHalf: 'autumn',
        ...partial,
    }
}

function ctx(partial: Partial<PlayerEligibilityContext> = {}): PlayerEligibilityContext {
    return {
        playerId: 'p1',
        clubId: 'clubA',
        birthYear: 2013,
        exceptions: [],
        appearances: [],
        ...partial,
    }
}

const kakkonenSat: TargetMatch = {
    date: '2026-08-29',
    clubId: 'clubA',
    teamId: 'kakkonen',
    ageClass: 'P13',
    level: 'kakkonen',
    format: '8v8',
    isYouth: true,
    seasonHalf: 'autumn',
}

describe('parseLevel / age / format', () => {
    it('maps Etela P13 names', () => {
        expect(parseLevel('P13 Liiga Etela', 'P13LE')).toBe('liiga')
        expect(parseLevel('P13 Ykkonen', 'P131')).toBe('ykkonen')
        expect(parseLevel('P13 Kakkonen', 'P132')).toBe('kakkonen')
        expect(parseAgeClass('P13 Kakkonen', 'P132')).toBe('P13')
        expect(parseFormat('P132', 'P13 Kakkonen')).toBe('8v8')
        expect(parseFormat('P13LE', 'P13 Liiga Etela')).toBe('11v11')
    })
})

describe('parseSeasonHalf T14-T16', () => {
    it('T14 Kevat 1 -> spring', () => {
        expect(parseSeasonHalf('Kevat 1')).toBe('spring')
        expect(parseSeasonHalf('Kevät 1')).toBe('spring')
    })
    it('T15 Syksy 2 -> autumn', () => {
        expect(parseSeasonHalf('Syksy 2')).toBe('autumn')
    })
    it('T16 Mitalisarja -> autumn', () => {
        expect(parseSeasonHalf('Mitalisarja')).toBe('autumn')
    })
})

describe('evaluatePlayer / evaluateSquad', () => {
    it('T1 Liiga eilen, Kakkonen tanaan -> SAME_AGE_SAME_DAY', () => {
        const r = evaluatePlayer(ctx({
            appearances: [app({ date: '2026-08-29', level: 'liiga' })],
        }), { ...kakkonenSat, date: '2026-08-29' }, ETELA_2026)
        expect(r.verdict).toBe('block')
        expect(r.reasons[0].code).toBe('SAME_AGE_SAME_DAY')
    })

    it('T2 Liiga eilen, Kakkonen huomenna, quota-flag', () => {
        const r = evaluatePlayer(ctx({
            appearances: [app({ date: '2026-08-28', level: 'liiga' })],
        }), kakkonenSat, ETELA_2026)
        expect(r.verdict).toBe('ok')
        expect(r.countsTowardDownQuota).toBe(true)
    })

    it('T3 5. quota-pelaaja -> squad BLOCK', () => {
        const squad = Array.from({ length: 5 }, (_, i) => ctx({
            playerId: `p${i}`,
            appearances: [app({ playerId: `p${i}`, date: '2026-08-28' })],
        }))
        const r = evaluateSquad(squad, kakkonenSat, ETELA_2026)
        expect(r.downQuotaUsed).toBe(5)
        expect(r.downQuotaMax).toBe(4)
        expect(r.squadVerdict).toBe('block')
        expect(r.players.filter(p => p.reasons.some(x => x.code === 'DOWN_QUOTA'))).toHaveLength(1)
    })

    it('T4 P13 + P14 sama paiva OK', () => {
        const r = evaluatePlayer(ctx({
            appearances: [app({ date: '2026-08-29', ageClass: 'P14', level: 'liiga' })],
        }), { ...kakkonenSat, date: '2026-08-29' }, ETELA_2026)
        expect(r.verdict).toBe('ok')
        expect(r.reasons[0].code).not.toBe('SAME_AGE_SAME_DAY')
    })

    it('T5 Y-pelaaja toiseen P13-joukkueeseen BLOCK', () => {
        const r = evaluatePlayer(ctx({
            exceptions: [{ kind: 'Y', boundTeamId: 'own' }],
        }), kakkonenSat, ETELA_2026)
        expect(r.verdict).toBe('block')
        expect(r.reasons[0].code).toBe('OVERAGE_LOCKED')
    })

    it('T6 Y-pelaaja aikuisiin OK', () => {
        const r = evaluatePlayer(ctx({
            exceptions: [{ kind: 'Y', boundTeamId: 'own' }],
        }), { ...kakkonenSat, isYouth: false, ageClass: 'Aikuiset', level: 'kolmonen' }, ETELA_2026)
        expect(r.reasons[0].code).not.toBe('OVERAGE_LOCKED')
    })

    it('T7 date gate last three etela BLOCK', () => {
        const r = evaluatePlayer(ctx({
            appearances: [app({ date: '2026-06-02', level: 'liiga', seasonHalf: 'spring' })],
        }), {
            ...kakkonenSat,
            date: '2026-06-20',
            seasonHalf: 'spring',
            isLastThreeOfHalf: true,
        }, ETELA_2026)
        expect(r.verdict).toBe('block')
        expect(r.reasons[0].code).toBe('DATE_GATE_LAST_THREE')
    })

    it('T8 Lansi dateGates pois', () => {
        const r = evaluatePlayer(ctx({
            appearances: [app({ date: '2026-06-02', level: 'liiga', seasonHalf: 'spring' })],
        }), {
            ...kakkonenSat,
            date: '2026-06-20',
            seasonHalf: 'spring',
            isLastThreeOfHalf: true,
        }, LANSI_2026)
        expect(r.reasons.some(x => x.code === 'DATE_GATE_LAST_THREE')).toBe(false)
    })

    it('T9/T17 kevat Liiga ei siirra syksyn Kakkonen-kiintioon', () => {
        const r = evaluatePlayer(ctx({
            appearances: [app({ date: '2026-05-10', seasonHalf: 'spring', level: 'liiga' })],
        }), kakkonenSat, ETELA_2026)
        expect(r.countsTowardDownQuota).toBe(false)
    })

    it('T10 lineup puuttuu -> WARN, ei quotaa', () => {
        const r = evaluatePlayer(ctx({
            appearances: [app({ lineupConfirmed: false, onLineup: false })],
        }), kakkonenSat, ETELA_2026)
        expect(r.verdict).toBe('warn')
        expect(r.countsTowardDownQuota).toBe(false)
        expect(r.reasons.some(x => x.code === 'NOT_OFFICIAL_SOURCE')).toBe(true)
    })

    it('T11 Etela 8v8 max 4, Lansi 8v8 max 3', () => {
        const four = Array.from({ length: 4 }, (_, i) => ctx({
            playerId: `p${i}`,
            appearances: [app({ playerId: `p${i}` })],
        }))
        expect(evaluateSquad(four, kakkonenSat, ETELA_2026).squadVerdict).toBe('ok')
        expect(evaluateSquad(four, kakkonenSat, LANSI_2026).squadVerdict).toBe('block')
        expect(evaluateSquad(four, kakkonenSat, LANSI_2026).downQuotaMax).toBe(3)
    })

    it('T12 nousukarsinta + ylempi 3.9. jalkeen BLOCK', () => {
        const r = evaluatePlayer(ctx({
            appearances: [app({ date: '2026-09-05', level: 'liiga' })],
        }), { ...kakkonenSat, date: '2026-09-20', isPromotionPlayoff: true }, ETELA_2026)
        expect(r.verdict).toBe('block')
        expect(r.reasons[0].code).toBe('PROMOTION_PLAYOFF_GATE')
    })

    it('T13 EV-vaihtopenkki = pelasi', () => {
        const r = evaluatePlayer(ctx({
            appearances: [app({ onLineup: true, lineupConfirmed: true })],
        }), kakkonenSat, ETELA_2026)
        expect(r.countsTowardDownQuota).toBe(true)
    })
})
