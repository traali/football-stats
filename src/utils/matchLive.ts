import { MATCH_STATUS } from '../types'

export function parseKickoffMs(date?: string, time?: string): number | null {
    if (!date) return null
    const clock = (time && !time.includes("'") ? time : '00:00:00').slice(0, 8)
    const iso = `${date}T${clock.length === 5 ? clock + ':00' : clock}`
    const ms = new Date(iso).getTime()
    return Number.isFinite(ms) ? ms : null
}

export function isMatchLive(m: {
    status?: string
    date?: string
    time?: string
    time_end?: string
    playing_time?: string
    playing_time_min?: string | number
}): boolean {
    const st = String(m.status || '').toLowerCase()
    if (st === 'played') return false
    if (st === 'live' || st === 'playing' || st === 'inplay' || st === 'in_play') return true
    if (String(m.time || '').includes("'")) return true
    if (st !== 'fixture' && st !== 'planned') return false
    const start = parseKickoffMs(m.date, m.time)
    if (start == null) return false
    const endFromField = parseKickoffMs(m.date, m.time_end)
    const durationMin = Number(m.playing_time_min || m.playing_time || 80)
    const end = endFromField ?? (start + (Number.isFinite(durationMin) ? durationMin : 80) * 60 * 1000 + 10 * 60 * 1000)
    const now = Date.now()
    return now >= start && now <= end
}

export function pickHeroMatch<T extends { status?: string; date?: string; time?: string }>(matches: T[], today: string): T | null {
    const live = matches.find(m => isMatchLive(m))
    if (live) return live
    const todayPlayed = matches
        .filter(m => m.date === today && m.status === MATCH_STATUS.PLAYED)
        .sort((a, b) => String(b.time || '').localeCompare(String(a.time || '')))
    if (todayPlayed[0]) {
        const kick = parseKickoffMs(todayPlayed[0].date, todayPlayed[0].time)
        if (kick && Date.now() - kick < 4 * 60 * 60 * 1000) return todayPlayed[0]
    }
    const upcoming = matches
        .filter(m => m.status === MATCH_STATUS.FIXTURE && m.date)
        .sort((a, b) => `${a.date}${a.time || ''}`.localeCompare(`${b.date}${b.time || ''}`))
    return upcoming[0] || todayPlayed[0] || null
}
