export type RegionId = 'etela' | 'lansi' | 'ita' | 'pohjoinen'

export type AgeClass = 'P13' | 'T13' | string

export type LevelRank =
    | 'liiga'
    | 'ykkonen'
    | 'kakkonen'
    | 'kolmonen'
    | 'nelonen'
    | 'vitonen'
    | 'harraste'
    | 'unknown'

export type Format = '11v11' | '8v8' | '5v5' | '4v4'

export type SeasonHalf = 'spring' | 'autumn' | 'single'

export type ExceptionKind = 'none' | 'K' | 'Y' | 'Y_permit'

export type Verdict = 'ok' | 'warn' | 'block'

export interface RegionRuleSet {
    region: RegionId
    downFromHigherMax: Record<Format, number>
    dateGatesEnabled: boolean
    dateGateSpring: string
    dateGateAutumn: string
    lastThreeLowerBlockedAfterGate: boolean
    promotionPlayoffBlocksHigherAfterGate: boolean
    sameAgeClassOneLevelPerDay: boolean
    evLineupCountsAsPlayed: boolean
    overageDeclaredBlocksOtherYouth: boolean
}

export interface OfficialAppearance {
    playerId: string
    matchId: string
    date: string
    teamId: string
    clubId: string
    ageClass: AgeClass
    level: LevelRank
    format: Format
    official: boolean
    onLineup: boolean
    lineupConfirmed: boolean
    seasonHalf: SeasonHalf
}

export interface PlayerEligibilityContext {
    playerId: string
    clubId: string
    birthYear: number
    isAdultTargetAllowed?: boolean
    exceptions: {
        kind: ExceptionKind
        otherClubId?: string
        boundTeamId?: string
    }[]
    appearances: OfficialAppearance[]
}

export interface TargetMatch {
    matchId?: string
    date: string
    clubId: string
    teamId: string
    ageClass: AgeClass
    level: LevelRank
    format: Format
    isYouth?: boolean
    isPromotionPlayoff?: boolean
    isLastThreeOfHalf?: boolean
    seasonHalf: SeasonHalf
}

export interface EligibilityReason {
    code:
        | 'OK'
        | 'SAME_AGE_SAME_DAY'
        | 'DOWN_QUOTA'
        | 'DATE_GATE_LAST_THREE'
        | 'PROMOTION_PLAYOFF_GATE'
        | 'OVERAGE_LOCKED'
        | 'NO_DUAL_CLUB'
        | 'UNKNOWN_LEVEL'
        | 'NOT_OFFICIAL_SOURCE'
    messageFi: string
    ruleRef: string
}

export interface PlayerEligibilityResult {
    playerId: string
    verdict: Verdict
    countsTowardDownQuota: boolean
    lastOfficialHigher?: OfficialAppearance
    lastOfficialAny?: OfficialAppearance
    reasons: EligibilityReason[]
}

export interface SquadEligibilityResult {
    target: TargetMatch
    region: RegionId
    downQuotaUsed: number
    downQuotaMax: number
    exceptionUsed?: number
    players: PlayerEligibilityResult[]
    squadVerdict: Verdict
}
