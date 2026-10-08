import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { TrendingUp, Calendar, Radio } from 'lucide-react'
import { getGroupFull } from '../services/api'
import { StandingsTable, BackButton, PageLayout, Card } from '../components'
import { MatchRow } from '../components/MatchRow'
import { ErrorState } from '../components/ErrorState'
import { splitMatches } from '../domain/matchState'
import { friendlyError } from '../utils/friendlyError'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type { GroupResponse, PlayerStatsEntry } from '../types'

export function GroupPage() {
    const { compId, catId, groupId } = useParams()
    const navigate = useNavigate()
    const [group, setGroup] = useState<GroupResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
    const [tick, setTick] = useState(0)
    const [showAllResults, setShowAllResults] = useState(false)
    useDocumentTitle(group ? `${group.category_name || ''} ${group.group_name || ''}`.trim() : 'Sarjataulukko')

    useEffect(() => {
        if (!compId || !catId || !groupId) return
        let cancelled = false
        setLoading(true)
        setError(null)
        getGroupFull(compId, catId, groupId)
            .then(g => { if (!cancelled) { setGroup(g); setLoading(false) } })
            .catch(e => { if (!cancelled) { setError(friendlyError(e, 'Sarjataulukkoa')); setLoading(false) } })
        return () => { cancelled = true }
    }, [compId, catId, groupId, tick])

    const split = useMemo(() => splitMatches(group?.matches || []), [group])

    if (loading) return <div className="min-h-screen px-4 py-8"><div className="max-w-6xl mx-auto space-y-6"><div className="animate-pulse bg-surface-1 rounded-xl h-96" /></div></div>
    if (error || !group) return <ErrorState message={error || 'Lohkoa ei löytynyt.'} onRetry={() => setTick(t => t + 1)} />

    const topScorers: PlayerStatsEntry[] = (group.player_statistics || [])
        .filter(p => parseInt(p.goals || '0') > 0)
        .sort((a, b) => (parseInt(b.goals || '0') || 0) - (parseInt(a.goals || '0') || 0))
        .slice(0, 20)

    const results = showAllResults ? split.results : split.results.slice(0, 15)

    return (
        <PageLayout>
            <BackButton className="mb-2" />

            <div>
                <h1 className="text-2xl font-bold text-text-primary">{group.group_name || 'Lohko'}</h1>
                <p className="text-text-muted text-sm">{group.competition_name} / {group.category_name}</p>
            </div>

            {split.onNow.length > 0 && (
                <Card className="space-y-3 border-semantic-red/30">
                    <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <Radio className="w-5 h-5 text-semantic-red" /> Nyt käynnissä
                    </h2>
                    <div className="space-y-1">
                        {split.onNow.map(m => <MatchRow key={m.match_id} match={m} />)}
                    </div>
                </Card>
            )}

            <div className="space-y-3">
                <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-accent" /> Sarjataulukko
                </h2>
                <StandingsTable
                    teams={group.teams || []}
                    matches={group.matches || []}
                    selectedTeam={selectedTeam}
                    onSelectTeam={setSelectedTeam}
                    showPointsPerMatch={Number(group.show_points_per_match) === 1}
                />
            </div>

            {split.upcoming.length > 0 && (
                <Card className="space-y-3">
                    <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-accent" /> Tulevat ottelut
                    </h2>
                    <div className="space-y-1">
                        {split.upcoming.slice(0, 10).map(m => <MatchRow key={m.match_id} match={m} />)}
                    </div>
                </Card>
            )}

            {split.results.length > 0 && (
                <Card className="space-y-3">
                    <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-accent" /> Tulokset ({split.results.length})
                    </h2>
                    <div className="space-y-1">
                        {results.map(m => <MatchRow key={m.match_id} match={m} />)}
                    </div>
                    {split.results.length > results.length && (
                        <button
                            type="button"
                            onClick={() => setShowAllResults(true)}
                            className="w-full min-h-[44px] text-sm font-semibold text-accent rounded-lg bg-surface-2 border border-border-hairline"
                        >
                            Näytä kaikki {split.results.length} tulosta
                        </button>
                    )}
                </Card>
            )}

            {topScorers.length > 0 && (
                <Card className="space-y-3">
                    <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-accent" /> Maalintekijät
                    </h2>
                    <div className="space-y-1">
                        {topScorers.map((p, i) => (
                            <div
                                key={p.player_id || i}
                                onClick={() => p.player_id && navigate(`/player/${p.player_id}`)}
                                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-2 border border-transparent hover:border-border-hairline cursor-pointer transition-all active:scale-[0.99] min-h-[44px]"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-text-muted text-xs font-mono w-5 shrink-0">{i + 1}.</span>
                                    <span className="text-text-primary font-medium truncate text-sm">{p.player_name}</span>
                                    <span
                                        onClick={e => { e.stopPropagation(); if (p.team_id) navigate(`/team/${p.team_id}`) }}
                                        className="text-text-muted text-xs truncate cursor-pointer hover:text-accent shrink-0"
                                    >
                                        ({p.team_name})
                                    </span>
                                </div>
                                <span className="text-accent font-bold font-mono text-sm shrink-0 ml-2">{p.goals}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </PageLayout>
    )
}
