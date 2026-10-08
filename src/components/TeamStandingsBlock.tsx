import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
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
    const groupLink = group.competition_id && group.category_id && group.group_id
        ? `/group/${group.competition_id}/${group.category_id}/${group.group_id}`
        : null
    return (
        <div className="space-y-2">
            {title && (
                groupLink ? (
                    <Link to={groupLink} className="flex items-center justify-between min-h-[44px] text-xs font-bold text-text-muted uppercase tracking-widest hover:text-accent">
                        <span>Sarjataulukko · {title}</span>
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                ) : (
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">Sarjataulukko · {title}</h3>
                )
            )}
            <StandingsTable
                teams={group.teams}
                matches={group.matches || []}
                teamAId={teamId}
                compact
                showPointsPerMatch={Number(group.show_points_per_match) === 1}
            />
        </div>
    )
}
