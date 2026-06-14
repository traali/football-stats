import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trophy, Users, Shield, Calendar, MapPin, ChevronDown, ChevronRight, User, TrendingUp } from 'lucide-react'
import { cn } from '../utils/cn'
import { getGroups, getGroupFull, getTeamProfile, batchFetch } from '../services/api'
import type { StandingTeam, TeamRosterPlayer, PlayerStatsEntry } from '../types/api'

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

const days = ['Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La']

function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'T12:00:00')
    return `${days[d.getDay()]} ${parseInt(dateStr.slice(8, 10))}.${parseInt(dateStr.slice(5, 7))}.`
}

function formatTime(time: string) {
    return time?.slice(0, 5) || ''
}

export function TurnauksetPage() {
    const { turnaus, sarja, teamId } = useParams()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [groupId, setGroupId] = useState('')
    const [groupName, setGroupName] = useState('')
    const [compName, setCompName] = useState('')
    const [catName, setCatName] = useState('')
    const [standings, setStandings] = useState<StandingTeam[]>([])
    const [matches, setMatches] = useState<MatchWithVenue[]>([])

    const [teamName, setTeamName] = useState('')
    const [teamCrest, setTeamCrest] = useState('')
    const [players, setPlayers] = useState<TeamRosterPlayer[]>([])

    const [playerStats, setPlayerStats] = useState<PlayerStatsEntry[]>([])

    const [playoffs, setPlayoffs] = useState<PlayoffInfo[]>([])
    const [expandedPlayoff, setExpandedPlayoff] = useState<string | null>(null)

    useEffect(() => {
        if (!turnaus || !sarja || !teamId) return
        let cancelled = false

        const fetchData = async () => {
            try {
                const groups = await getGroups(turnaus, sarja)
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
                    getGroupFull(turnaus, sarja, found.group_id),
                    getTeamProfile(teamId),
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

                const playoffIds = ['16', '17', '18']
                const playoffLabels = [
                    { id: '16', name: 'A-fin', label: 'Sijoille 1.–2. (mestaruus)' },
                    { id: '17', name: 'B-fin', label: 'Sijoille 3.–4.' },
                    { id: '18', name: 'C-fin', label: 'Sijoille 5.–6.' },
                ]

                const playoffResults = await batchFetch(
                    playoffIds,
                    (id, signal) => getGroupFull(turnaus!, sarja!, id, signal),
                    3,
                )

                if (cancelled) return

                const parsedPlayoffs = playoffLabels.map((p, i) => ({
                    ...p,
                    matches: (playoffResults[i]?.matches || []) as MatchWithVenue[],
                }))
                setPlayoffs(parsedPlayoffs)
            } catch (err) {
                if (!cancelled) setError((err as Error).message)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        fetchData()
        return () => { cancelled = true }
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
        return [...standings].sort((a, b) => parseInt(a.current_standing) - parseInt(b.current_standing))
    }, [standings])

    const topScorers = useMemo(() => {
        return playerStats
            .filter(p => String(p.team_id) === teamId)
            .sort((a, b) => (parseInt(b.goals || '0') || 0) - (parseInt(a.goals || '0') || 0))
            .slice(0, 20)
    }, [playerStats, teamId])

    const playerStatsMap = useMemo(() => {
        const map = new Map<string, PlayerStatsEntry[]>()
        for (const s of playerStats) {
            if (!s.player_id) continue
            const pid = String(s.player_id)
            if (!map.has(pid)) map.set(pid, [])
            map.get(pid)!.push(s)
        }
        return map
    }, [playerStats])

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
        <div className="min-h-screen px-4 py-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors text-sm">
                    <ArrowLeft className="w-4 h-4" /> Takaisin
                </button>

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
                                const isFixture = m.status === 'Fixture' || (!m.fs_A && !m.fs_B)
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
                                                {m.venue_name && (
                                                    <p className="text-[10px] text-text-muted/60 flex items-center gap-1 mt-0.5 truncate">
                                                        <MapPin className="w-2.5 h-2.5 shrink-0" />
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
                                            p.id === '16' ? 'bg-semantic-green' : p.id === '17' ? 'bg-accent' : 'bg-text-muted'
                                        )} />
                                        <span className="text-sm font-bold text-text-primary">{p.name}</span>
                                        <span className="text-xs text-text-muted">{p.label}</span>
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
                                                    .map(m => {
                                                        const involvesM = m.team_A_name?.includes('M/') || m.team_B_name?.includes('M/')
                                                        return (
                                                            <div
                                                                key={m.match_id}
                                                                onClick={() => navigate(`/match/${m.match_id}`)}
                                                                className="flex items-center justify-between py-2.5 px-4 hover:bg-surface-2 cursor-pointer transition-all min-h-[44px]"
                                                            >
                                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                                    <div className="text-center shrink-0 w-14">
                                                                        <p className="text-[10px] text-text-muted font-mono">{formatDate(m.date)}</p>
                                                                        <p className="text-[9px] text-text-muted/60 font-mono">{formatTime(m.time)}</p>
                                                                    </div>
                                                                    <div className="min-w-0 flex-1 space-y-0.5">
                                                                        <p className={cn(
                                                                            "text-xs font-mono truncate",
                                                                            involvesM ? "text-text-primary font-semibold" : "text-text-muted/80"
                                                                        )}>
                                                                            {m.team_A_name}
                                                                        </p>
                                                                        <p className="text-[10px] text-text-muted/40 text-center leading-none">vs</p>
                                                                        <p className={cn(
                                                                            "text-xs font-mono truncate",
                                                                            involvesM ? "text-text-primary font-semibold" : "text-text-muted/80"
                                                                        )}>
                                                                            {m.team_B_name}
                                                                        </p>
                                                                        {m.venue_name && (
                                                                            <p className="text-[9px] text-text-muted/50 flex items-center gap-1 mt-0.5 truncate">
                                                                                <MapPin className="w-2 h-2 shrink-0" />
                                                                                {m.venue_name}{m.venue_location_name ? ` · ${m.venue_location_name}` : ''}
                                                                            </p>
                                                                        )}
                                                                        {m.referee_1_name && (
                                                                            <p className="text-[9px] text-text-muted/40 flex items-center gap-1 mt-0.5 truncate">
                                                                                <Users className="w-2 h-2 shrink-0" />
                                                                                {m.referee_1_name}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                 </div>
                                                             </div>
                                                        )
                                                    })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <p className="text-xs text-text-muted/60 pt-1">
                        Lohkosta M: Sijat 1.–2. → A-fin, 3.–4. → B-fin, 5.–6. → C-fin ·
                        M/I = Lohko M, sija 1
                    </p>
                </div>

                {topScorers.length > 0 && (
                    <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
                        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-accent" />
                            Maalintekijät
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

                <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4 text-accent" />
                        Kokoonpano ({players.length})
                    </h3>

                    {players.length === 0 ? (
                        <p className="text-text-muted text-sm text-center py-4">Ei pelaajatietoja</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                            {players.map(p => {
                                const pid = p.player_id || ''
                                const pStats = playerStatsMap.get(pid)
                                return (
                                    <div
                                        key={pid}
                                        onClick={() => pid && navigate(`/player/${pid}`)}
                                        className="bg-surface-2 border border-border-hairline hover:border-accent/30 rounded-xl p-4 hover:bg-surface-3 transition-all active:scale-[0.98] cursor-pointer space-y-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-surface-3 flex items-center justify-center shrink-0 border border-border-hairline">
                                                {p.img_url ? (
                                                    <img src={p.img_url} alt="" className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    <User className="w-5 h-5 text-text-muted" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-text-primary font-bold text-sm truncate">
                                                    {p.first_name} {p.last_name}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {p.birthyear && (
                                                        <span className="text-text-muted text-xs font-mono">{p.birthyear}</span>
                                                    )}
                                                    {p.shirt_number && (
                                                        <span className="bg-accent/10 border border-accent/20 text-accent font-mono font-bold text-[10px] px-1.5 py-0.5 rounded">
                                                            #{p.shirt_number}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {pStats && pStats.length > 0 && (
                                            <div className="pt-3 border-t border-border-hairline space-y-1.5">
                                                {pStats.map((s, i) => (
                                                    <div key={i} className="flex items-center justify-between text-xs">
                                                        <span className="text-text-secondary font-medium truncate mr-2">
                                                            {s.team_name || ''} ({catName || sarja})
                                                        </span>
                                                        <div className="flex items-center gap-2.5 shrink-0">
                                                            <span className="text-text-muted font-mono">O: {s.matches || 0}</span>
                                                            <span className="text-text-muted font-mono">M: {s.goals || 0}</span>
                                                            {s.assists && parseInt(s.assists) > 0 && (
                                                                <span className="text-text-muted font-mono">S: {s.assists}</span>
                                                            )}
                                                            {s.warnings && parseInt(s.warnings) > 0 && (
                                                                <span className="text-accent font-mono">V: {s.warnings}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
