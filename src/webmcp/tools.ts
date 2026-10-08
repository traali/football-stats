/**
 * WebMCP tool logic. Same truth rules as the UI: a score only when Taso has one,
 * "vs" otherwise, forfeits say "Luovutus", nothing invented, no contact details.
 */
import { getMatchDetails, getPlayerData, getTeamMatches, getTeamProfile, searchTaso } from '../services/api'
import { displayScore, isForfeit, matchPhase, phaseLabel, splitMatches, type MatchLike } from '../domain/matchState'
import { matchFacts } from '../utils/matchFacts'
import { mergePlayerMatches } from '../utils/playerMatches'
import { teamLabel } from '../utils/teamLabel'
import { tasoUrl } from '../utils/tasoLinks'
import { friendlyError } from '../utils/friendlyError'

interface LineMatch extends MatchLike {
    match_id: string
    team_A_id?: string
    team_B_id?: string
    team_A_name?: string
    team_B_name?: string
    team_A_description?: string
    team_B_description?: string
    category_name?: string
}

export function appUrl(path: string): string {
    if (typeof window === 'undefined') return `#${path}`
    return `${window.location.origin}${window.location.pathname}#${path}`
}

/** One line per match, e.g. "2026-10-08 18:00 · PPJ/Laru sin vs LePa · Käynnissä". */
export function matchLine(m: LineMatch, now: Date = new Date()): string {
    const score = displayScore(m, now)
    const a = teamLabel(m.team_A_id, m.team_A_name, m.team_A_description)
    const b = teamLabel(m.team_B_id, m.team_B_name, m.team_B_description)
    const mid = score ? `${score.a}–${score.b}` : 'vs'
    const time = m.time && !String(m.time).includes("'") ? ` ${String(m.time).slice(0, 5)}` : ''
    return `${m.date || '?'}${time} · ${a} ${mid} ${b} · ${phaseLabel(m, now)} · match_id ${m.match_id}`
}

export async function searchTool(args: { query?: string }): Promise<string> {
    const q = String(args.query || '').trim()
    if (q.length < 2) throw new Error('query needs at least 2 characters. Players are found by full name (first last).')
    const results = await searchTaso(q)
    if (results.length === 0) return `No results for "${q}" in Palloliitto's results service. Players need the full name (first last).`
    const lines = results.slice(0, 25).map(r => {
        if (r.type === 'team') return `team ${r.id}: ${r.text.trim()}${r.data?.primary_category_name ? ` (${r.data.primary_category_name})` : ''} · ${appUrl(`/team/${r.id}`)}`
        if (r.type === 'player') return `player ${r.id}: ${r.text}${r.data?.club_name_football ? ` (${r.data.club_name_football})` : ''} · ${appUrl(`/player/${r.id}`)}`
        return `club ${r.id}: ${r.text}${r.data?.city_name ? ` (${r.data.city_name})` : ''} · ${appUrl(`/club/${r.id}`)}`
    })
    return [`${results.length} results for "${q}"${results.length > 25 ? ' (first 25 shown)' : ''}:`, ...lines].join('\n')
}

export async function matchTool(args: { matchId?: string }, now: Date = new Date()): Promise<string> {
    const id = String(args.matchId || '').trim()
    if (!/^\d+$/.test(id)) throw new Error('matchId must be a numeric Taso match id. Do not invent ids.')
    let m
    try {
        m = await getMatchDetails(id)
    } catch (err) {
        throw new Error(friendlyError(err, 'Ottelua'), { cause: err })
    }
    const phase = matchPhase(m, now)
    const lines = [matchLine(m as LineMatch, now)]
    if (phase === 'result' && isForfeit(m)) lines.push('Luovutus (walkover): the result was decided without playing.')
    if (m.category_name || m.group_name) lines.push(`Sarja: ${[m.competition_name, m.category_name, m.group_name].filter(Boolean).join(' · ')}`)
    if (m.venue_name && !(phase === 'result' && isForfeit(m))) lines.push(`Kenttä: ${m.venue_name}${m.venue_city_name ? `, ${m.venue_city_name}` : ''}`)
    const f = matchFacts(m)
    const facts = [f.temperature, f.weather, f.attendance].filter(Boolean)
    if (facts.length > 0) lines.push(`Olosuhteet (tulospalvelu): ${facts.join(', ')}`)
    lines.push(`Tulospalvelu: ${tasoUrl('match', id)}`, `App: ${appUrl(`/match/${id}`)}`)
    return lines.join('\n')
}

export async function teamTool(args: { teamId?: string }, now: Date = new Date()): Promise<string> {
    const id = String(args.teamId || '').trim()
    if (!/^\d+$/.test(id)) throw new Error('teamId must be a numeric Taso team id. Use search_football first.')
    let team, matches
    try {
        [team, matches] = await Promise.all([getTeamProfile(id), getTeamMatches(id)])
    } catch (err) {
        throw new Error(friendlyError(err, 'Joukkuetta'), { cause: err })
    }
    if (!team) throw new Error('Joukkuetta ei löytynyt tulospalvelusta.')
    const split = splitMatches(matches as LineMatch[], now)
    const lines = [`${team.team_name || id}${team.club_name ? ` · ${team.club_name}` : ''}${team.primary_category?.category_name ? ` · ${team.primary_category.category_name}` : ''}`]
    if (split.onNow.length) lines.push('Nyt käynnissä:', ...split.onNow.map(m => `- ${matchLine(m, now)}`))
    lines.push(split.upcoming.length ? 'Tulevat:' : 'Tulevat: ei tulevia otteluita tulospalvelussa.', ...split.upcoming.slice(0, 5).map(m => `- ${matchLine(m, now)}`))
    if (split.results.length) lines.push('Viimeisimmät tulokset:', ...split.results.slice(0, 5).map(m => `- ${matchLine(m, now)}`))
    lines.push(`Tulospalvelu: ${tasoUrl('team', id)}`, `App: ${appUrl(`/team/${id}`)}`)
    return lines.join('\n')
}

export async function playerTool(args: { playerId?: string }, now: Date = new Date()): Promise<string> {
    const id = String(args.playerId || '').trim()
    if (!/^\d+$/.test(id)) throw new Error('playerId must be a numeric Taso player id. Use search_football with the full name first.')
    let p
    try {
        p = await getPlayerData(id)
    } catch (err) {
        throw new Error(friendlyError(err, 'Pelaajaa'), { cause: err })
    }
    const all = mergePlayerMatches(p) as unknown as LineMatch[]
    const split = splitMatches(all, now)
    const name = [p.first_name, p.last_name].filter(Boolean).join(' ') || id
    const teams = (p.teams || []).map(t => `${t.team_name || t.team_id}${t.shirt_number ? ` #${t.shirt_number}` : ''}`).join(', ')
    const lines = [`${name}${p.club_name ? ` · ${p.club_name}` : ''}`]
    if (teams) lines.push(`Joukkueet: ${teams}`)
    if (split.onNow.length) lines.push('Nyt käynnissä:', ...split.onNow.map(m => `- ${matchLine(m, now)}`))
    if (split.upcoming.length) lines.push('Tulevat:', ...split.upcoming.slice(0, 5).map(m => `- ${matchLine(m, now)}`))
    if (split.results.length) lines.push('Viimeisimmät tulokset:', ...split.results.slice(0, 5).map(m => `- ${matchLine(m, now)}`))
    lines.push(`Tulospalvelu: ${tasoUrl('person', id)}`, `App: ${appUrl(`/player/${id}`)}`)
    return lines.join('\n')
}

const OPEN_KINDS = ['match', 'team', 'player', 'club', 'search', 'favorites', 'home'] as const

export function openPath(args: { kind?: string; id?: string }): string {
    const kind = String(args.kind || '').trim()
    const id = String(args.id || '').trim()
    if (!(OPEN_KINDS as readonly string[]).includes(kind)) throw new Error(`kind must be one of: ${OPEN_KINDS.join(', ')}`)
    if (kind === 'home') return '/'
    if (kind === 'favorites') return '/favorites'
    if (kind === 'search') return id ? `/haku?q=${encodeURIComponent(id)}` : '/haku'
    if (!/^\d+$/.test(id)) throw new Error(`${kind} needs a numeric id.`)
    return `/${kind}/${id}`
}
