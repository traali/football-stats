export type SeasonHalf = 'spring' | 'autumn' | 'single'

const SPRING_RE = /kevät|kevat/i
const AUTUMN_RE = /syksy|syys/i
const AUTUMN_PHASE_RE = /mitali|jatko|karsinta/i

/** Half of the season from Taso's own group name ("Kevät 1", "Syksy 1"). No invented calendar dates. */
export function parseSeasonHalf(groupName?: string): SeasonHalf {
    const name = groupName || ''
    if (SPRING_RE.test(name)) return 'spring'
    if (AUTUMN_RE.test(name) || AUTUMN_PHASE_RE.test(name)) return 'autumn'
    return 'single'
}
