import type { SeasonHalf } from './types'

const SPRING_RE = /kevät|kevat/i
const AUTUMN_RE = /syksy|syys/i
const AUTUMN_PHASE_RE = /mitali|jatko|karsinta/i

export interface SeasonCalendar {
    springEnd: string
    autumnStart: string
}

export const ETELA_2026_CALENDAR: SeasonCalendar = {
    springEnd: '2026-06-28',
    autumnStart: '2026-08-03',
}

export function parseSeasonHalf(
    groupName?: string,
    date?: string,
    calendar: SeasonCalendar = ETELA_2026_CALENDAR,
): SeasonHalf {
    const name = groupName || ''
    if (SPRING_RE.test(name)) return 'spring'
    if (AUTUMN_RE.test(name) || AUTUMN_PHASE_RE.test(name)) return 'autumn'
    if (date) {
        if (date <= calendar.springEnd) return 'spring'
        if (date >= calendar.autumnStart) return 'autumn'
    }
    return 'single'
}
