import { StandingsTable } from './StandingsTable'
import { useTeamStandings } from '../hooks/useTeamStandings'
import type { TeamResponse } from '../types'

export function TeamStandingsBlock({ team, teamId, year }: {
    team: TeamResponse | null
    teamId: string
    year: string
}) {
    const { group, loading } = useTeamStandings(team, teamId, year)
    if (loading && !group) {
        return <div className="h-40 rounded-xl bg-surface-1 border border-border-hairline animate-pulse" />
    }
    if (!group?.teams?.length) return null
    const title = [group.category_name, group.group_name].filter(Boolean).join(' · ')
    return (
        <div className="space-y-2">
            {title && (
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">{title}</h3>
            )}
            <StandingsTable
                teams={group.teams}
                matches={group.matches || []}
                teamAId={teamId}
                compact
            />
        </div>
    )
}
