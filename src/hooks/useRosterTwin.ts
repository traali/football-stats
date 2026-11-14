import { useEffect, useState } from 'react'
import { getClubInfo, getTeamProfile } from '../services/api'
import type { TeamResponse, TeamRosterPlayer } from '../types'
import { rankTwins, teamBirthYear, type NameMatch, type TwinCandidate } from '../utils/rosterTwin'

export interface RosterTwin {
    team: TwinCandidate & { match: NameMatch }
    players: (TeamRosterPlayer & { player_id: string })[]
}

const MAX_TRIES = 4

/**
 * When `enabled` (the team's own Taso roster is empty), find the same club's
 * same-name, same-birth-year team that has players. Null when there is none.
 */
export function useRosterTwin(team: TeamResponse | null | undefined, teamId: string, enabled: boolean) {
    const [state, setState] = useState<{ key: string; loading: boolean; twin: RosterTwin | null }>({ key: '', loading: false, twin: null })
    const clubId = String(team?.club_id || '')
    const yob = teamBirthYear(team as { birthyear?: unknown; primary_category?: unknown } | null)
    const key = enabled && clubId && yob && team?.team_name ? `${teamId}|${clubId}|${yob}` : ''

    useEffect(() => {
        if (!key || !team?.team_name) return
        let cancelled = false
        setState({ key, loading: true, twin: null })
        const ctrl = new AbortController()
        ;(async () => {
            const club = await getClubInfo(clubId, ctrl.signal)
            const ranked = rankTwins({
                team_id: teamId,
                team_name: String(team.team_name),
                yob,
                clubAbbr: String((team as { club_abbrevation?: string }).club_abbrevation || ''),
                sport_id: String((team as { sport_id?: string }).sport_id || ''),
            }, club?.teams || [])
            for (const cand of ranked.slice(0, MAX_TRIES)) {
                const prof = await getTeamProfile(cand.team_id, ctrl.signal).catch(() => null)
                if (cancelled) return
                const players = (prof?.players || []).filter((p): p is TeamRosterPlayer & { player_id: string } => /^\d+$/.test(String(p.player_id || '')))
                if (players.length > 0) {
                    setState({ key, loading: false, twin: { team: cand, players } })
                    return
                }
            }
            if (!cancelled) setState({ key, loading: false, twin: null })
        })().catch(() => { if (!cancelled) setState({ key, loading: false, twin: null }) })
        return () => { cancelled = true; ctrl.abort() }
    }, [key, clubId, teamId, team, yob])

    if (!key) return { loading: false, twin: null }
    if (state.key !== key) return { loading: true, twin: null }
    return { loading: state.loading, twin: state.twin }
}
