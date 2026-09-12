export function formatDate(dateStr: string | undefined, format: 'short' | 'day-month' | 'with-year' = 'day-month'): string {
    if (!dateStr) return ''
    const d = new Date(dateStr + 'T12:00:00')
    const day = parseInt(dateStr.slice(8, 10), 10)
    const month = parseInt(dateStr.slice(5, 7), 10)
    const year = dateStr.slice(0, 4)
    if (format === 'short') {
        return `${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`
    }
    if (format === 'with-year') {
        return `${day}.${month}.${year}`
    }
    const days = ['Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La']
    return `${days[d.getDay()]} ${day}.${month}.`
}

export function formatTime(time: string | undefined): string {
    return time?.slice(0, 5) || ''
}

export function formatDayName(dateStr: string): string {
    const days = ['Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La']
    const d = new Date(dateStr + 'T12:00:00')
    return days[d.getDay()]
}

export function todayISO(now = new Date()): string {
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

/** Taso sometimes leaves old games as Fixture. Upcoming lists must drop those. */
export function isUpcomingDate(date?: string, now = new Date()): boolean {
    return !!date && date >= todayISO(now)
}

export function halfOf(date?: string): 'kevät' | 'syksy' | '' {
    if (!date || date.length < 7) return ''
    const month = parseInt(date.slice(5, 7), 10)
    if (!month) return ''
    return month <= 6 ? 'kevät' : 'syksy'
}

export function getCurrentSeason(now = new Date()): { year: string; half: 'kevät' | 'syksy' } {
    const year = String(now.getFullYear())
    const month = now.getMonth() + 1
    const half = month <= 6 ? 'kevät' : 'syksy'
    return { year, half }
}

const LIVE_RE = /live|playing|ongoing|käynnissä|kesken/i
const PLAYED_RE = /played|pelattu|^1$/i

export type SeasonPointer = { year: string; half: 'kevät' | 'syksy' }

type DatedMatch = { date?: string; status?: string; season_id?: string }

function pointerOf(m: DatedMatch): SeasonPointer {
    const year = (m.season_id && /^\d{4}/.test(m.season_id) ? m.season_id.slice(0, 4) : (m.date || '').slice(0, 4))
    const half = halfOf(m.date) || 'syksy'
    return { year: year || getCurrentSeason().year, half }
}

/**
 * Torneopal-backed default: the season that is ongoing now (live / today / upcoming fixture),
 * else the latest played season. Calendar is only a last-ditch fallback when there is no data.
 */
export function resolveActiveSeason(matches: DatedMatch[] | undefined, now = new Date()): SeasonPointer {
    const today = todayISO(now)
    const rows = (matches || []).filter(m => m.date && m.date.length >= 10)

    const live = rows.filter(m => LIVE_RE.test(m.status || '') || m.date === today)
    if (live.length) {
        live.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        return pointerOf(live[0])
    }

    const upcoming = rows.filter(m => (m.date || '') >= today && !PLAYED_RE.test(m.status || ''))
    if (upcoming.length) {
        upcoming.sort((a, b) => (a.date || '').localeCompare(b.date || ''))
        return pointerOf(upcoming[0])
    }

    const played = rows
        .filter(m => PLAYED_RE.test(m.status || '') || !m.status)
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    if (played.length) return pointerOf(played[0])

    if (rows.length) {
        const latest = [...rows].sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0]
        return pointerOf(latest)
    }

    return getCurrentSeason(now)
}

export function formatSeasonLabel(year: string, half?: 'all' | 'kevät' | 'syksy'): string {
    if (year === 'all') return 'Kaikki kaudet (Yhteensä)'
    if (!half || half === 'all') return `Kausi ${year}`
    const capitalized = half.charAt(0).toUpperCase() + half.slice(1)
    return `${capitalized} ${year}`
}
