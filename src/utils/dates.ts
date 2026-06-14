export function formatDate(dateStr: string | undefined, format: 'short' | 'day-month' = 'day-month'): string {
    if (!dateStr) return ''
    const d = new Date(dateStr + 'T12:00:00')
    if (format === 'short') {
        return `${dateStr.slice(5, 7)}.${dateStr.slice(8, 10)}`
    }
    const days = ['Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La']
    return `${days[d.getDay()]} ${parseInt(dateStr.slice(8, 10))}.${parseInt(dateStr.slice(5, 7))}.`
}

export function formatTime(time: string | undefined): string {
    return time?.slice(0, 5) || ''
}

export function formatDayName(dateStr: string): string {
    const days = ['Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La']
    const d = new Date(dateStr + 'T12:00:00')
    return days[d.getDay()]
}