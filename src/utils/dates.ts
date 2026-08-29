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
