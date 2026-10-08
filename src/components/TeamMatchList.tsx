import { useEffect, useMemo, useState } from 'react'
import { Calendar, Radio } from 'lucide-react'
import type { DiscoveryMatch, TeamResponse } from '../types'
import { Card } from './Card'
import { MatchRow } from './MatchRow'
import { TeamStandingsBlock } from './TeamStandingsBlock'
import { useTeamStandings } from '../hooks/useTeamStandings'
import { getTeamProfile } from '../services/api'
import { APP_CONFIG } from '../config'

function subtitleOf(m: DiscoveryMatch): string | undefined {
    const bits = [m.category_name, m.group_name].filter(Boolean) as string[]
    return bits.length ? bits.join(' · ') : undefined
}

export function TeamMatchList({ onNow, upcoming, pastMatches, teamId, team, year, pastLabel }: {
    onNow: DiscoveryMatch[]
    upcoming: DiscoveryMatch[]
    pastMatches: DiscoveryMatch[]
    teamId: string
    team?: TeamResponse | null
    year?: string
    pastLabel?: string
}) {
    const [resolved, setResolved] = useState<TeamResponse | null>(team || null)
    useEffect(() => {
        if (team) { setResolved(team); return }
        let cancelled = false
        getTeamProfile(teamId).then(t => { if (!cancelled) setResolved(t) }).catch(() => { /* table is optional */ })
        return () => { cancelled = true }
    }, [team, teamId])

    const tableYear = year || APP_CONFIG.CURRENT_YEAR
    const { group } = useTeamStandings(resolved, teamId, tableYear)
    const pos = useMemo(() => {
        const map: Record<string, string | number> = {}
        for (const t of group?.teams || []) {
            if (t.team_id) map[String(t.team_id)] = t.current_standing
        }
        return map
    }, [group])

    return (
        <div className="space-y-6">
            {onNow.length > 0 && (
                <Card className="space-y-3 border-semantic-red/30">
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                        <Radio className="w-4 h-4 text-semantic-red" /> Nyt käynnissä
                    </h3>
                    <div className="space-y-1">
                        {onNow.map(m => (
                            <MatchRow key={m.match_id} match={m} teamId={teamId} standings={pos} subtitle={subtitleOf(m)} />
                        ))}
                    </div>
                </Card>
            )}

            {upcoming.length > 0 && (
                <Card className="space-y-3">
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-accent" /> Tulevat ottelut
                    </h3>
                    <div className="space-y-1">
                        {upcoming.map(m => (
                            <MatchRow key={m.match_id} match={m} teamId={teamId} standings={pos} subtitle={subtitleOf(m)} />
                        ))}
                    </div>
                </Card>
            )}

            <TeamStandingsBlock team={resolved} teamId={teamId} year={tableYear} />

            {pastMatches.length > 0 && (
                <Card className="space-y-3">
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-accent" /> Pelatut ottelut{pastLabel ? ` · ${pastLabel}` : ''}
                    </h3>
                    <div className="space-y-1">
                        {pastMatches.map(m => (
                            <MatchRow key={m.match_id} match={m} teamId={teamId} standings={pos} subtitle={subtitleOf(m)} />
                        ))}
                    </div>
                </Card>
            )}

            {pastMatches.length === 0 && upcoming.length === 0 && onNow.length === 0 && (
                <Card className="py-8 text-center">
                    <p className="text-text-muted text-sm">Ei otteluita tällä rajauksella.</p>
                </Card>
            )}
        </div>
    )
}
