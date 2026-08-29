import type { Format, LevelRank, RegionRuleSet } from './types'

export const ETELA_2026: RegionRuleSet = {
    region: 'etela',
    downFromHigherMax: { '11v11': 4, '8v8': 4, '5v5': 4, '4v4': 4 },
    dateGatesEnabled: true,
    dateGateSpring: '05-31',
    dateGateAutumn: '09-02',
    lastThreeLowerBlockedAfterGate: true,
    promotionPlayoffBlocksHigherAfterGate: true,
    sameAgeClassOneLevelPerDay: true,
    evLineupCountsAsPlayed: true,
    overageDeclaredBlocksOtherYouth: true,
}

export const LANSI_2026: RegionRuleSet = {
    ...ETELA_2026,
    region: 'lansi',
    downFromHigherMax: { '11v11': 4, '8v8': 3, '5v5': 3, '4v4': 3 },
    dateGatesEnabled: false,
}

export const ITA_2026: RegionRuleSet = {
    ...ETELA_2026,
    region: 'ita',
    dateGatesEnabled: false,
}

export const POHJOINEN_2026: RegionRuleSet = {
    ...ETELA_2026,
    region: 'pohjoinen',
}

export const LEVEL_ORDER: LevelRank[] = [
    'liiga', 'ykkonen', 'kakkonen', 'kolmonen', 'nelonen', 'vitonen', 'harraste', 'unknown',
]

export function isHigherLevel(a: LevelRank, b: LevelRank): boolean {
    if (a === 'unknown' || b === 'unknown') return false
    return LEVEL_ORDER.indexOf(a) < LEVEL_ORDER.indexOf(b)
}

export function downQuotaMax(rules: RegionRuleSet, format: Format): number {
    return rules.downFromHigherMax[format] ?? 4
}
