import type {
    EligibilityReason,
    OfficialAppearance,
    PlayerEligibilityContext,
    PlayerEligibilityResult,
    RegionRuleSet,
    SquadEligibilityResult,
    TargetMatch,
    Verdict,
} from './types'
import { downQuotaMax, isHigherLevel } from './rules'

function reason(code: EligibilityReason['code'], messageFi: string, ruleRef: string): EligibilityReason {
    return { code, messageFi, ruleRef }
}

function lastOf(list: OfficialAppearance[]): OfficialAppearance | undefined {
    return [...list].sort((a, b) => a.date.localeCompare(b.date)).at(-1)
}

export function lastOfficialForHalf(
    appearances: OfficialAppearance[],
    seasonHalf: TargetMatch['seasonHalf'],
    teamId?: string,
): OfficialAppearance | undefined {
    const pool = appearances.filter(a =>
        a.official &&
        a.onLineup &&
        a.lineupConfirmed &&
        (seasonHalf === 'single' || a.seasonHalf === seasonHalf || a.seasonHalf === 'single') &&
        (!teamId || a.teamId === teamId),
    )
    return lastOf(pool)
}

export function evaluatePlayer(
    ctx: PlayerEligibilityContext,
    target: TargetMatch,
    rules: RegionRuleSet,
): PlayerEligibilityResult {
    const reasons: EligibilityReason[] = []
    let verdict: Verdict = 'ok'
    let countsTowardDownQuota = false

    const sameHalfApps = ctx.appearances.filter(a =>
        a.official &&
        a.onLineup &&
        (target.seasonHalf === 'single' || a.seasonHalf === target.seasonHalf || a.seasonHalf === 'single'),
    )
    const confirmed = sameHalfApps.filter(a => a.lineupConfirmed)
    const lastAny = lastOf(confirmed)
    const lastHigher = lastOf(confirmed.filter(a => isHigherLevel(a.level, target.level) && a.ageClass === target.ageClass))

    const y = ctx.exceptions.find(e => e.kind === 'Y' || e.kind === 'Y_permit')
    if (y && rules.overageDeclaredBlocksOtherYouth && target.isYouth !== false && y.boundTeamId && y.boundTeamId !== target.teamId) {
        return {
            playerId: ctx.playerId,
            verdict: 'block',
            countsTowardDownQuota: false,
            lastOfficialHigher: lastHigher,
            lastOfficialAny: lastAny,
            reasons: [reason('OVERAGE_LOCKED', 'Y-ilmoitus lukitsee pelaajan merkittyyn nuorten joukkueeseen', 'KM 15 / poikkeusluvat 2.1.1')],
        }
    }

    const hasK = ctx.exceptions.some(e => e.kind === 'K')
    if (target.clubId !== ctx.clubId && !hasK) {
        return {
            playerId: ctx.playerId,
            verdict: 'block',
            countsTowardDownQuota: false,
            lastOfficialHigher: lastHigher,
            lastOfficialAny: lastAny,
            reasons: [reason('NO_DUAL_CLUB', 'Toisen seuran ottelu vaatii kaksoisedustuksen (K)', 'KM 15')],
        }
    }

    if (rules.sameAgeClassOneLevelPerDay) {
        const sameDayOtherLevel = confirmed.find(a =>
            a.date === target.date &&
            a.ageClass === target.ageClass &&
            a.level !== target.level,
        )
        if (sameDayOtherLevel) {
            return {
                playerId: ctx.playerId,
                verdict: 'block',
                countsTowardDownQuota: false,
                lastOfficialHigher: lastHigher,
                lastOfficialAny: lastAny,
                reasons: [reason('SAME_AGE_SAME_DAY', 'Saman ikäluokan eri tasoilla vain yksi ottelu per päivä', 'KM 15.2')],
            }
        }
    }

    if (target.level === 'unknown') {
        verdict = 'warn'
        reasons.push(reason('UNKNOWN_LEVEL', 'Sarjatasoa ei tunnistettu — tarkista manuaalisesti', 'app'))
    }

    const unconfirmedHigher = sameHalfApps.find(a =>
        isHigherLevel(a.level, target.level) && a.ageClass === target.ageClass && !a.lineupConfirmed,
    )
    if (unconfirmedHigher && !lastHigher) {
        verdict = verdict === 'block' ? 'block' : 'warn'
        reasons.push(reason('NOT_OFFICIAL_SOURCE', 'Ylemmän tason lineup puuttuu — vahvista TASOsta', 'app'))
    }

    if (lastHigher) {
        countsTowardDownQuota = true
        reasons.push(reason('OK', `Viimeisin ylempi: ${lastHigher.level} ${lastHigher.date}`, 'KM 15.2'))
    }

    const gateDate = target.seasonHalf === 'autumn' ? `${target.date.slice(0, 4)}-${rules.dateGateAutumn}` : `${target.date.slice(0, 4)}-${rules.dateGateSpring}`
    const playedHigherAfterGate = confirmed.some(a =>
        a.ageClass === target.ageClass &&
        isHigherLevel(a.level, target.level) &&
        a.date > gateDate,
    )

    if (rules.dateGatesEnabled && rules.lastThreeLowerBlockedAfterGate && target.isLastThreeOfHalf && playedHigherAfterGate) {
        return {
            playerId: ctx.playerId,
            verdict: 'block',
            countsTowardDownQuota,
            lastOfficialHigher: lastHigher,
            lastOfficialAny: lastAny,
            reasons: [reason('DATE_GATE_LAST_THREE', 'Ylempi peli 31.5./2.9. jälkeen estää alemman tason 3 viimeistä ottelua', 'KM 15.3')],
        }
    }

    if (rules.dateGatesEnabled && rules.promotionPlayoffBlocksHigherAfterGate && target.isPromotionPlayoff && playedHigherAfterGate) {
        return {
            playerId: ctx.playerId,
            verdict: 'block',
            countsTowardDownQuota,
            lastOfficialHigher: lastHigher,
            lastOfficialAny: lastAny,
            reasons: [reason('PROMOTION_PLAYOFF_GATE', 'Nousukarsintaan ei pelaajia, jotka pelanneet ylempänä gaten jälkeen', 'KM 15.3')],
        }
    }

    if (reasons.length === 0) {
        reasons.push(reason('OK', 'Ei estettä tämän datan perusteella', 'KM 15'))
    }

    return {
        playerId: ctx.playerId,
        verdict,
        countsTowardDownQuota,
        lastOfficialHigher: lastHigher,
        lastOfficialAny: lastAny,
        reasons,
    }
}

export function evaluateSquad(
    players: PlayerEligibilityContext[],
    target: TargetMatch,
    rules: RegionRuleSet,
): SquadEligibilityResult {
    const results = players.map(p => evaluatePlayer(p, target, rules))
    const max = downQuotaMax(rules, target.format)
    const quotaIdx = results
        .map((r, i) => ({ r, i }))
        .filter(x => x.r.countsTowardDownQuota)
    const used = quotaIdx.length

    if (used > max) {
        quotaIdx.slice(max).forEach(x => {
            x.r.verdict = 'block'
            x.r.reasons = [
                reason('DOWN_QUOTA', `Ylhäältä alas -kiintiö täynnä (${used}/${max})`, 'KM 15.2'),
                ...x.r.reasons,
            ]
        })
    }

    const squadVerdict: Verdict = results.some(r => r.verdict === 'block')
        ? 'block'
        : results.some(r => r.verdict === 'warn')
            ? 'warn'
            : 'ok'

    return {
        target,
        region: rules.region,
        downQuotaUsed: used,
        downQuotaMax: max,
        players: results,
        squadVerdict,
    }
}
