import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Trophy, Users, Shield, Calendar, MapPin, ChevronDown, ChevronRight, TrendingUp } from 'lucide-react'
import { cn } from '../utils/cn'
import { formatDate, formatTime } from '../utils/dates'
import { getGroups, getGroupFull, getTeamProfile, getPlayerData, batchFetch } from '../services/api'
import { MATCH_STATUS } from '../types'
import type { StandingTeam, TeamRosterPlayer, PlayerStatsEntry, GroupDetails, PlayerStats } from '../types'
import { BackButton, PageLayout, PlayerCard, PlayerCardSkeleton } from '../components'
import { processPlayerMatchHistory } from '../utils/dataProcessors'
import { APP_CONFIG } from '../config'

interface MatchWithVenue {
    match_id: string
    date: string
    time: string
    team_A_id: string
    team_B_id: string
    team_A_name: string
    team_B_name: string
    fs_A: string
    fs_B: string
    winner_id: string
    status: string
    venue_name?: string
    venue_location_name?: string
    referee_1_name?: string
    [key: string]: unknown
}

interface PlayoffInfo {
    id: string
    name: string
    label: string
    matches: MatchWithVenue[]
}

interface TournamentPlayerStats extends PlayerStats {
    player_id: string
}

export function TurnauksetPage() {
    const { turnaus, sarja, teamId } = useParams()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [, setGroupId] = useState('')
    const [groupName, setGroupName] = useState('')
    const [compName, setCompName] = useState('')
    const [catName, setCatName] = useState('')
    const [standings, setStandings] = useState<StandingTeam[]>([])
    const [matches, setMatches] = useState<MatchWithVenue[]>([])

    const [teamName, setTeamName] = useState('')
    const [teamCrest, setTeamCrest] = useState('')
    const [players, setPlayers] = useState<TeamRosterPlayer[]>([])
    const [processedPlayers, setProcessedPlayers] = useState<TournamentPlayerStats[]>([])
    const [loadingPlayers, setLoadingPlayers] = useState(false)

    const [playerStats, setPlayerStats] = useState<PlayerStatsEntry[]>([])

    const [playoffs, setPlayoffs] = useState<PlayoffInfo[]>([])
    const [expandedPlayoff, setExpandedPlayoff] = useState<string | null>(null)
    const [allGroups, setAllGroups] = useState<GroupDetails[]>([])

    useEffect(() => {
        if (!turnaus || !sarja || !teamId) return
        let cancelled = false
        const controller = new AbortController()

        const fetchData = async () => {
            try {
                const groups = await getGroups(turnaus, sarja)
                setAllGroups(groups)
                const found = groups.find(g =>
                    g.teams?.some(t => String(t.team_id) === teamId)
                )
                if (!found) throw new Error('Joukkuetta ei löydy tästä turnauksesta')

                setGroupId(found.group_id)
                setGroupName(found.group_name || '')
                setCompName(found.competition_name || '')
                setCatName(found.category_name || '')
                setStandings(found.teams || [])

                const [groupData, teamData] = await Promise.all([
                    getGroupFull(turnaus, sarja, found.group_id, controller.signal),
                    getTeamProfile(teamId, controller.signal),
                ])

                if (cancelled) return

                if (groupData?.matches) {
                    setMatches(groupData.matches as MatchWithVenue[])
                }
                if (groupData?.player_statistics) {
                    setPlayerStats(groupData.player_statistics)
                }
                if (teamData) {
                    setTeamName(teamData.team_name || '')
                    setTeamCrest(teamData.crest || '')
                    setPlayers(teamData.players || [])
                }

                const playoffGroups = groups.filter(g => !g.teams?.length && g.group_id !== found.group_id)
                if (playoffGroups.length > 0) {
                    const playoffLabels = playoffGroups.map(g => ({
                        id: g.group_id,
                        name: g.group_name || `Lohko ${g.group_id}`,
                        label: g.group_name || '',
                    }))
                    const playoffResults = await batchFetch(
                        playoffLabels.map(p => p.id),
                        (id, signal) => getGroupFull(turnaus!, sarja!, id, signal),
                        3,
                        controller.signal
                    )
                    if (cancelled) return
                    const parsedPlayoffs = playoffLabels.map((p, i) => ({
                        ...p,
                        matches: (playoffResults[i]?.matches || []) as MatchWithVenue[],
                    }))
                    setPlayoffs(parsedPlayoffs)
                }

                // Page load completes first
                setLoading(false)

                // Background batch-fetch detailed player profiles
                if (teamData?.players && teamData.players.length > 0) {
                    setLoadingPlayers(true)
                    const playerIds = teamData.players.map(p => p.player_id).filter((id): id is string => !!id)
                    const playerDataList = await batchFetch(playerIds, getPlayerData, 5, controller.signal)
                    
                    if (cancelled) return

                    const processed: TournamentPlayerStats[] = []
                    for (let idx = 0; idx < teamData.players.length; idx++) {
                        const rosterPlayer = teamData.players[idx]
                        const pData = playerDataList[idx]
                        if (!pData) continue

                        const processedHistory = processPlayerMatchHistory(
                            pData.matches,
                            APP_CONFIG.CURRENT_YEAR,
                            APP_CONFIG.PREVIOUS_YEAR,
                            teamData.team_name || ''
                        )

                        processed.push({
                            player_id: rosterPlayer.player_id || '',
                            name: `${rosterPlayer.first_name || ''} ${rosterPlayer.last_name || ''}`.trim(),
                            shirtNumber: rosterPlayer.shirt_number || 'N/A',
                            birthYear: rosterPlayer.birthyear || pData.birthyear || '',
                            img_url: rosterPlayer.img_url || pData.img_url,
                            ...processedHistory,
                            isCaptainInMatch: false,
                            teamIdInMatch: teamId,
                        })
                    }
                    setProcessedPlayers(processed)
                    setLoadingPlayers(false)
                }
            } catch (err) {
                if (!cancelled) {
                    setError((err as Error).message)
                    setLoading(false)
                }
            }
        }

        fetchData()
        return () => {
            cancelled = true
            controller.abort()
        }
    }, [turnaus, sarja, teamId])

    const teamMatches = useMemo(() => {
        return matches
            .filter(m => m.team_A_id === teamId || m.team_B_id === teamId)
            .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    }, [matches, teamId])

    const myStanding = useMemo(() => {
        return standings.find(s => String(s.team_id) === teamId)
    }, [standings, teamId])

    const sortedStandings = useMemo(() => {
        return [...standings].sort((a, b) => parseInt(String(a.current_standing)) - parseInt(String(b.current_standing)))
    }, [standings])

    const topScorers = useMemo(() => {
        return playerStats
            .filter(p => String(p.team_id) === teamId)
            .sort((a, b) => (parseInt(b.goals || '0') || 0) - (parseInt(a.goals || '0') || 0))
            .slice(0, 20)
    }, [playerStats, teamId])

    const rosterScorers = useMemo(() => {
        return processedPlayers
            .filter(p => p.goalsForThisSpecificTeamInSeason > 0)
            .sort((a, b) => b.goalsForThisSpecificTeamInSeason - a.goalsForThisSpecificTeamInSeason)
            .slice(0, 15)
    }, [processedPlayers])


    const groupLinkMap = useMemo(() => {
        const map = new Map<string, { teamId: string; teamName: string }>()
        for (const g of allGroups) {
            const letter = g.group_name?.replace(/^Lohko\s+/i, '').trim()
            if (!letter || letter.length > 2 || !g.teams?.length) continue
            map.set(letter.toUpperCase(), {
                teamId: String(g.teams[0].team_id),
                teamName: g.teams[0].team_name || '',
            })
        }
        return map
    }, [allGroups])

    const renderPlayoffTeamName = (name: string) => {
        const m = name.match(/^([A-Z])\/(I{1,3})$/i)
        if (m) {
            const letter = m[1].toUpperCase()
            const info = groupLinkMap.get(letter)
            if (info) {
                return (
                    <a
                        href={`#/turnaukset/${turnaus!}/${sarja!}/${info.teamId}`}
                        onClick={e => { e.stopPropagation(); e.preventDefault(); navigate(`/turnaukset/${turnaus!}/${sarja!}/${info.teamId}`) }}
                        className="text-accent hover:text-accent/80 underline underline-offset-2 decoration-accent/30 transition-colors"
                    >
                        {name}
                    </a>
                )
            }
        }
        return <span>{name}</span>
    }

    if (!turnaus || !sarja || !teamId) return (
        <div className="min-h-screen px-4 py-8 text-center text-semantic-red">
            Virheellinen osoite
        </div>
    )

    if (loading) return (
        <div className="min-h-screen px-4 py-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="animate-pulse bg-surface-1 rounded-xl h-48" />
                <div className="animate-pulse bg-surface-1 rounded-xl h-64" />
                <div className="animate-pulse bg-surface-1 rounded-xl h-64" />
            </div>
        </div>
    )

    if (error) return (
        <div className="min-h-screen px-4 py-8 text-center text-semantic-red">
            {error}
        </div>
    )

    return (
        <PageLayout>
            <BackButton />

                <div className="bg-surface-1 border border-border-hairline rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-accent to-accent/50" />

                    <div className="flex items-center gap-4">
                        {teamCrest ? (
                            <div className="w-14 h-14 rounded-full bg-surface-2 border border-border-hairline p-1 flex items-center justify-center shrink-0">
                                <img src={teamCrest} alt="" className="w-full h-full rounded-full object-contain" />
                            </div>
                        ) : (
                            <div className="w-14 h-14 rounded-full bg-surface-2 border border-border-hairline flex items-center justify-center shrink-0 text-text-muted">
                                <Shield className="w-8 h-8" />
                            </div>
                        )}
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-accent">Turnaus</span>
                            <h1 className="text-xl font-bold text-text-primary">{teamName || teamId}</h1>
                            <p className="text-sm text-text-secondary mt-1">{compName || turnaus} · {catName || sarja}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="bg-surface-2 border border-border-hairline px-2.5 py-1 rounded-lg text-xs font-semibold text-text-primary">
                                    {groupName} · Sija {myStanding?.current_standing || '–'}
                                </span>
                                <span className="bg-surface-2 border border-border-hairline px-2.5 py-1 rounded-lg text-xs font-medium text-text-muted">
                                    {myStanding?.matches_played || 0} ottelua
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-accent" />
                        Sarjataulukko · {groupName}
                    </h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-text-muted text-xs uppercase tracking-wider border-b border-border-hairline">
                                    <th className="text-left py-2 pr-2 font-semibold w-8">#</th>
                                    <th className="text-left py-2 pr-2 font-semibold">Joukkue</th>
                                    <th className="text-center py-2 px-1.5 font-semibold">O</th>
                                    <th className="text-center py-2 px-1.5 font-semibold">V</th>
                                    <th className="text-center py-2 px-1.5 font-semibold">T</th>
                                    <th className="text-center py-2 px-1.5 font-semibold">H</th>
                                    <th className="text-center py-2 px-1.5 font-semibold">TM</th>
                                    <th className="text-center py-2 px-1.5 font-semibold">PM</th>
                                    <th className="text-center py-2 px-1.5 font-semibold">ME</th>
                                    <th className="text-center py-2 pl-1.5 font-semibold">P</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedStandings.map(s => {
                                    const isPPJ = String(s.team_id) === teamId
                                    return (
                                        <tr
                                            key={s.team_id}
                                            onClick={() => !isPPJ && navigate(`/turnaukset/${turnaus}/${sarja}/${s.team_id}`)}
                                            className={cn(
                                                "border-b border-border-hairline/50 transition-colors",
                                                isPPJ ? "bg-accent/5" : "hover:bg-surface-2 cursor-pointer"
                                            )}
                                        >
                                            <td className="py-2.5 pr-2 font-mono text-text-muted text-xs">{s.current_standing}</td>
                                            <td className={cn("py-2.5 pr-2 font-semibold text-text-primary text-sm", isPPJ && "text-accent")}>
                                                {s.team_name}
                                            </td>
                                            <td className="text-center py-2.5 px-1.5 font-mono text-text-secondary text-xs">{s.matches_played}</td>
                                            <td className="text-center py-2.5 px-1.5 font-mono text-semantic-green text-xs">{s.matches_won}</td>
                                            <td className="text-center py-2.5 px-1.5 font-mono text-accent text-xs">{s.matches_tied}</td>
                                            <td className="text-center py-2.5 px-1.5 font-mono text-semantic-red text-xs">{s.matches_lost}</td>
                                            <td className="text-center py-2.5 px-1.5 font-mono text-text-secondary text-xs">{s.goals_for}</td>
                                            <td className="text-center py-2.5 px-1.5 font-mono text-text-secondary text-xs">{s.goals_against}</td>
                                            <td className="text-center py-2.5 px-1.5 font-mono text-text-secondary text-xs">{s.goals_diff}</td>
                                            <td className="text-center py-2.5 pl-1.5 font-mono font-bold text-accent">{s.points}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-accent" />
                        PPJ:n ottelut ({teamMatches.length})
                    </h3>

                    {teamMatches.length === 0 ? (
                        <p className="text-text-muted text-sm text-center py-4">Ei otteluita</p>
                    ) : (
                        <div className="space-y-0 divide-y divide-border-hairline/50">
                            {teamMatches.map(m => {
                                const isHome = m.team_A_id === teamId
                                const opponent = isHome ? m.team_B_name : m.team_A_name
                                const ppjScore = isHome ? m.fs_A : m.fs_B
                                const oppScore = isHome ? m.fs_B : m.fs_A
                                const isFixture = m.status === MATCH_STATUS.FIXTURE || (!m.fs_A && !m.fs_B)
                                return (
                                    <div
                                        key={m.match_id}
                                        onClick={() => navigate(`/match/${m.match_id}`)}
                                        className="flex items-center justify-between py-3 px-2 -mx-2 rounded-lg hover:bg-surface-2 cursor-pointer transition-all active:scale-[0.99] min-h-[52px]"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="text-center shrink-0 w-14">
                                                <p className="text-xs text-text-muted font-mono">{formatDate(m.date)}</p>
                                                <p className="text-[10px] text-text-muted/60 font-mono">{formatTime(m.time)}</p>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1 text-sm">
                                                    {isHome ? (
                                                        <>
                                                            <span className="text-accent font-semibold">{teamName}</span>
                                                            <span className="text-text-muted mx-1">vs</span>
                                                            <span className="text-text-primary truncate">{opponent}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="text-text-primary truncate">{opponent}</span>
                                                            <span className="text-text-muted mx-1">vs</span>
                                                            <span className="text-accent font-semibold">{teamName}</span>
                                                        </>
                                                    )}
                                                </div>
                                                {(m.venue_name || m.venue_location_name) && (
                                                    <p className="text-xs text-text-muted/70 flex items-center gap-1 mt-0.5 truncate">
                                                        <MapPin className="w-3 h-3 shrink-0" />
                                                        {m.venue_name}{m.venue_location_name ? ` · ${m.venue_location_name}` : ''}
                                                    </p>
                                                )}
                                                {m.referee_1_name && (
                                                    <p className="text-[10px] text-text-muted/50 flex items-center gap-1 mt-0.5 truncate">
                                                        <Users className="w-2.5 h-2.5 shrink-0" />
                                                        Tuomari: {m.referee_1_name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 ml-3">
                                            {isFixture ? (
                                                <span className="text-text-muted font-mono text-sm font-bold min-w-[4ch] text-right">–</span>
                                            ) : (
                                                <span className="text-text-primary font-mono text-sm font-bold min-w-[4ch] text-right">
                                                    {ppjScore}–{oppScore}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-accent" />
                        Jatko-ottelut
                    </h3>

                    <div className="space-y-2">
                        {playoffs.map(p => (
                            <div key={p.id} className="border border-border-hairline rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setExpandedPlayoff(expandedPlayoff === p.id ? null : p.id)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-surface-2 transition-colors min-h-[48px] cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-3 h-3 rounded-full shrink-0",
                                            p.matches.length > 0 ? 'bg-accent' : 'bg-text-muted'
                                        )} />
                                        <span className="text-sm font-bold text-text-primary">{p.name}</span>
                                        {p.label && <span className="text-xs text-text-muted">{p.label}</span>}
                                    </div>
                                    {expandedPlayoff === p.id ? (
                                        <ChevronDown className="w-4 h-4 text-text-muted" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4 text-text-muted" />
                                    )}
                                </button>

                                {expandedPlayoff === p.id && (
                                    <div className="border-t border-border-hairline">
                                        {p.matches.length === 0 ? (
                                            <p className="text-text-muted text-sm text-center py-4">Ei otteluita</p>
                                        ) : (
                                            <div className="divide-y divide-border-hairline/50">
                                                {[...p.matches]
                                                    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
                                                    .map(m => (
                                                        <div
                                                            key={m.match_id}
                                                            onClick={() => navigate(`/match/${m.match_id}`)}
                                                            className="flex items-center justify-between py-2.5 px-4 hover:bg-surface-2 cursor-pointer transition-all min-h-[44px]"
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                                <div className="text-center shrink-0 w-14">
                                                                    <p className="text-xs text-text-muted font-mono">{formatDate(m.date)}</p>
                                                                    <p className="text-[11px] text-text-muted/70 font-mono">{formatTime(m.time)}</p>
                                                                </div>
                                                                <div className="min-w-0 flex-1 space-y-0.5">
                                                                    <p className="text-xs font-mono truncate">
                                                                        {renderPlayoffTeamName(m.team_A_name || '—')}
                                                                    </p>
                                                                    <p className="text-[10px] text-text-muted/40 text-center leading-none">vs</p>
                                                                    <p className="text-xs font-mono truncate">
                                                                        {renderPlayoffTeamName(m.team_B_name || '—')}
                                                                    </p>
                                                                    {(m.venue_name || m.venue_location_name) && (
                                                                        <p className="text-xs text-text-muted/70 flex items-center gap-1 mt-1 truncate">
                                                                            <MapPin className="w-3 h-3 shrink-0" />
                                                                            {m.venue_name}{m.venue_location_name ? ` · ${m.venue_location_name}` : ''}
                                                                        </p>
                                                                    )}
                                                                    {m.referee_1_name && (
                                                                        <p className="text-[10px] text-text-muted/50 flex items-center gap-1 mt-0.5 truncate">
                                                                            <Users className="w-2.5 h-2.5 shrink-0" />
                                                                            {m.referee_1_name}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                             </div>
                                                          </div>
                                                     )
                                                    )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {playoffs.filter(p => p.matches.length > 0).length > 0 && (
                        <p className="text-xs text-text-muted/60 pt-1">
                            Esim. {groupName}/I = {groupName}-lohkon 1. sija · Roomalaiset numerot viittaavat lohkon sijoitukseen
                        </p>
                    )}
                </div>

                {topScorers.length > 0 && (
                    <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
                        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-accent" />
                            Maalintekijät (Turnaus)
                        </h3>
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
                                        {p.team_name && (
                                            <span className="text-text-muted text-xs truncate shrink-0">({p.team_name})</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0 ml-2">
                                        <span className="text-accent font-bold font-mono text-sm">{p.goals || 0} maalia</span>
                                        {(p.assists && parseInt(p.assists) > 0) && (
                                            <span className="text-text-muted text-xs font-mono">{p.assists} syöttöä</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {topScorers.length === 0 && rosterScorers.length > 0 && (
                    <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
                        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-accent" />
                            Parhaat maalintekijät (Kausi {APP_CONFIG.CURRENT_YEAR})
                        </h3>
                        <div className="space-y-1">
                            {rosterScorers.map((p, i) => (
                                <div
                                    key={p.player_id || i}
                                    onClick={() => p.player_id && navigate(`/player/${p.player_id}`)}
                                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-2 border border-transparent hover:border-border-hairline cursor-pointer transition-all active:scale-[0.99] min-h-[44px]"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="text-text-muted text-xs font-mono w-5 shrink-0">{i + 1}.</span>
                                        <span className="text-text-primary font-medium truncate text-sm">{p.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0 ml-2">
                                        <span className="text-accent font-bold font-mono text-sm">{p.goalsForThisSpecificTeamInSeason || 0} maalia</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4 text-accent" />
                        Kokoonpano ({players.length})
                    </h3>

                    {loadingPlayers ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {Array.from({ length: players.length || 6 }).map((_, i) => (
                                <PlayerCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : processedPlayers.length === 0 ? (
                        <p className="text-text-muted text-sm text-center py-4">Ei pelaajatietoja</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {processedPlayers.map(player => (
                                <PlayerCard key={player.name + player.shirtNumber} stats={player} />
                            ))}
                        </div>
                    )}
                </div>
        </PageLayout>
    )
}
