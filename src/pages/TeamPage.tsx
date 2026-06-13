import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, Users, Calendar, Shield, CalendarDays, User, TrendingUp } from 'lucide-react'
import { cn } from '../utils/cn'
import { getTeamProfile, getTeamMatches, getGroupFull, batchFetch } from '../services/api'
import { useFavorites } from '../hooks/useFavorites'
import type { TeamResponse, DiscoveryMatch } from '../types/api'
import { APP_CONFIG } from '../types/config'
import { StatBadge } from '../components/StatBadge'

export function TeamPage() {
    const { teamId } = useParams()
    const navigate = useNavigate()
    const { isFavorite, toggle } = useFavorites()
    const [team, setTeam] = useState<TeamResponse | null>(null)
    const [matches, setMatches] = useState<DiscoveryMatch[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [tab, setTab] = useState<'roster' | 'matches'>('matches')
    const [selectedYear, setSelectedYear] = useState<string>('all')

    // Historical players state
    const [historicalPlayersByYear, setHistoricalPlayersByYear] = useState<Record<string, { player_id: string; first_name: string; last_name: string; img_url?: string }[]>>({})
    const [loadingPlayers, setLoadingPlayers] = useState(false)
    const [teamTopScorers, setTeamTopScorers] = useState<Record<string, { player_id: string; first_name: string; last_name: string; goals: number; assists: number; img_url?: string }[]>>({})

    const fav = teamId ? isFavorite(teamId) : false

    useEffect(() => {
        if (!teamId) return
        setLoading(true)
        Promise.all([
            getTeamProfile(teamId),
            getTeamMatches(teamId),
        ])
            .then(([t, m]) => { setTeam(t); setMatches(m); setLoading(false) })
            .catch(e => { setError(e.message); setLoading(false) })
    }, [teamId])

    const players = team?.players || []

    const allowedYears = useMemo(() => {
        const currentYear = new Date().getFullYear()
        return [currentYear, currentYear - 1, currentYear - 2, currentYear - 3].map(String)
    }, [])

    const filteredMatches = useMemo(() => {
        return matches.filter(m => {
            if (!m.date) return false
            const y = m.date.slice(0, 4)
            return allowedYears.includes(y)
        })
    }, [matches, allowedYears])

    // Available years in the matches data
    const years = useMemo(() => {
        const yearsSet = new Set<string>()
        filteredMatches.forEach(m => {
            if (m.date) {
                const y = m.date.slice(0, 4)
                if (y && !isNaN(parseInt(y))) yearsSet.add(y)
            }
        })
        return [...yearsSet].sort((a, b) => b.localeCompare(a))
    }, [filteredMatches])

    // Extract relevant groups matching allowed years
    const relevantGroups = useMemo(() => {
        if (!team?.groups) return []
        return (team.groups as any[]).filter(g => {
            if (!g) return false
            const season = g.competition_season ? String(g.competition_season) : ''
            return season && allowedYears.includes(season)
        })
    }, [team?.groups, allowedYears])

    // Fetch players for all historical groups to compute roster transitions
    useEffect(() => {
        if (!teamId || relevantGroups.length === 0) return
        let active = true
        setLoadingPlayers(true)

        const fetchPlayers = async () => {
            try {
                const groupKeys = relevantGroups.map(g => `${g.competition_id}:${g.category_id}:${g.group_id}`)
                
                const results = await batchFetch(
                    groupKeys,
                    async (key, signal) => {
                        const [compId, catId, groupId] = key.split(':')
                        return getGroupFull(compId, catId, groupId, signal)
                    },
                    5
                )

                if (!active) return

                const playersBySeason: Record<string, Record<string, { player_id: string; first_name: string; last_name: string; img_url?: string }>> = {}
                const statsBySeason: Record<string, Record<string, { player_id: string; first_name: string; last_name: string; goals: number; assists: number; img_url?: string }>> = {}

                allowedYears.forEach(yr => {
                    playersBySeason[yr] = {}
                    statsBySeason[yr] = {}
                })

                results.forEach((groupData, idx) => {
                    if (!groupData) return
                    const groupMeta = relevantGroups[idx]
                    if (!groupMeta) return
                    const season = groupMeta.competition_season ? String(groupMeta.competition_season) : ''
                    if (!season || !playersBySeason[season]) return

                    const stats = groupData.player_statistics || []
                    stats.forEach(p => {
                        if (String(p.team_id) !== String(teamId) || !p.player_id) return
                        const pid = String(p.player_id)
                        // Roster info
                        playersBySeason[season][pid] = {
                            player_id: pid,
                            first_name: p.first_name || p.player_name?.split(' ')[1] || '',
                            last_name: p.last_name || p.player_name?.split(' ')[0] || '',
                            img_url: p.img_url
                        }
                        // Stats accumulation
                        const existing = statsBySeason[season][pid]
                        const g = parseInt(p.goals || '0')
                        const a = parseInt(p.assists || '0')
                        if (existing) {
                            existing.goals += g
                            existing.assists += a
                        } else {
                            statsBySeason[season][pid] = {
                                player_id: pid,
                                first_name: p.first_name || p.player_name?.split(' ')[1] || '',
                                last_name: p.last_name || p.player_name?.split(' ')[0] || '',
                                goals: g,
                                assists: a,
                                img_url: p.img_url
                            }
                        }
                    })
                })

                // Union current active squad with APP_CONFIG.CURRENT_YEAR
                if (team?.players) {
                    const curYrBucket = playersBySeason[APP_CONFIG.CURRENT_YEAR]
                    if (curYrBucket && Object.keys(curYrBucket).length === 0) {
                        team.players.forEach(p => {
                            if (p.player_id) {
                                curYrBucket[String(p.player_id)] = {
                                    player_id: String(p.player_id),
                                    first_name: p.first_name || '',
                                    last_name: p.last_name || '',
                                    img_url: p.img_url
                                }
                            }
                        })
                    }
                }

                const finalPlayers: Record<string, { player_id: string; first_name: string; last_name: string; img_url?: string }[]> = {}
                Object.entries(playersBySeason).forEach(([yr, map]) => {
                    finalPlayers[yr] = Object.values(map)
                })
                const finalScorers: Record<string, { player_id: string; first_name: string; last_name: string; goals: number; assists: number; img_url?: string }[]> = {}
                Object.entries(statsBySeason).forEach(([yr, map]) => {
                    finalScorers[yr] = Object.values(map).sort((a, b) => b.goals - a.goals || b.assists - a.assists)
                })

                setHistoricalPlayersByYear(finalPlayers)
                setTeamTopScorers(finalScorers)
            } catch (err) {
                console.error('Failed to fetch historical player data:', err)
            } finally {
                if (active) setLoadingPlayers(false)
            }
        }

        fetchPlayers()

        return () => {
            active = false
        }
    }, [relevantGroups, teamId, team?.players, allowedYears])

    // Calculate dynamic team statistics grouped by year/season
    const statsByYear = useMemo(() => {
        const map = new Map<string, {
            played: number;
            wins: number;
            draws: number;
            losses: number;
            goalsFor: number;
            goalsAgainst: number;
            diffStr: string;
            ppg: number;
            goalsScoredPerMatch: number;
            goalsConcededPerMatch: number;
        }>()

        const createEmptyStat = () => ({
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            diffStr: '0',
            ppg: 0,
            goalsScoredPerMatch: 0,
            goalsConcededPerMatch: 0
        })

        map.set('all', createEmptyStat())

        filteredMatches.forEach(m => {
            if (m.status !== 'Played' || !m.date) return
            const year = m.date.slice(0, 4)
            if (!year || isNaN(parseInt(year))) return

            let s = map.get(year)
            if (!s) {
                s = createEmptyStat()
                map.set(year, s)
            }

            s.played++
            const allStats = map.get('all')!
            allStats.played++

            const isA = m.team_A_id === teamId
            const myScore = parseInt(isA ? m.fs_A || '0' : m.fs_B || '0', 10)
            const oppScore = parseInt(isA ? m.fs_B || '0' : m.fs_A || '0', 10)
            if (!isNaN(myScore) && !isNaN(oppScore)) {
                s.goalsFor += myScore
                s.goalsAgainst += oppScore
                if (myScore > oppScore) s.wins++
                else if (myScore < oppScore) s.losses++
                else s.draws++

                allStats.goalsFor += myScore
                allStats.goalsAgainst += oppScore
                if (myScore > oppScore) allStats.wins++
                else if (myScore < oppScore) allStats.losses++
                else allStats.draws++
            }
        })

        for (const [_, s] of map.entries()) {
            if (s.played > 0) {
                s.ppg = (s.wins * 3 + s.draws) / s.played
                s.goalsScoredPerMatch = s.goalsFor / s.played
                s.goalsConcededPerMatch = s.goalsAgainst / s.played
            }
            const diff = s.goalsFor - s.goalsAgainst
            s.diffStr = diff > 0 ? `+${diff}` : `${diff}`
        }

        return map
    }, [filteredMatches, teamId])

    const displayStats = useMemo(() => {
        return statsByYear.get(selectedYear) || { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, diffStr: '0', ppg: 0, goalsScoredPerMatch: 0, goalsConcededPerMatch: 0 }
    }, [statsByYear, selectedYear])

    // Performance comparison vs previous season
    const performanceComparison = useMemo(() => {
        const currentYear = years[0] || APP_CONFIG.CURRENT_YEAR
        const targetYear = selectedYear === 'all' ? currentYear : selectedYear
        const prevYear = String(parseInt(targetYear) - 1)

        const currentStats = statsByYear.get(targetYear)
        const prevStats = statsByYear.get(prevYear)

        if (!currentStats || currentStats.played === 0) {
            return null
        }

        const currentPPG = currentStats.ppg
        const prevPPG = prevStats && prevStats.played > 0 ? prevStats.ppg : null

        let trend: 'better' | 'worse' | 'neutral' = 'neutral'
        let ppgDiffStr = ''

        if (prevPPG !== null) {
            const diff = currentPPG - prevPPG
            if (diff > 0.15) {
                trend = 'better'
            } else if (diff < -0.15) {
                trend = 'worse'
            } else {
                trend = 'neutral'
            }
            ppgDiffStr = diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)
        }

        return {
            targetYear,
            prevYear,
            currentPPG,
            prevPPG,
            trend,
            ppgDiff: prevPPG !== null ? currentPPG - prevPPG : null,
            ppgDiffStr,
            currentGoalsScored: currentStats.goalsScoredPerMatch,
            prevGoalsScored: prevStats && prevStats.played > 0 ? prevStats.goalsScoredPerMatch : null,
            currentGoalsConceded: currentStats.goalsConcededPerMatch,
            prevGoalsConceded: prevStats && prevStats.played > 0 ? prevStats.goalsConcededPerMatch : null,
        }
    }, [statsByYear, selectedYear, years])

    // Compute player transitions (new vs gone players)
    const playerTransitions = useMemo(() => {
        const currentYear = years[0] || APP_CONFIG.CURRENT_YEAR
        const targetYear = selectedYear === 'all' ? currentYear : selectedYear
        const prevYear = String(parseInt(targetYear) - 1)

        const targetPlayers = historicalPlayersByYear[targetYear] || []
        const prevPlayers = historicalPlayersByYear[prevYear] || []

        const targetIds = new Set(targetPlayers.map(p => p.player_id))
        const prevIds = new Set(prevPlayers.map(p => p.player_id))

        const newPlayers = targetPlayers.filter(p => !prevIds.has(p.player_id))
        const gonePlayers = prevPlayers.filter(p => !targetIds.has(p.player_id))

        return {
            targetYear,
            prevYear,
            // hasComparisonData = true only if we actually have loaded data for prevYear (non-empty array)
            hasComparisonData: prevPlayers.length > 0,
            newPlayers,
            gonePlayers
        }
    }, [historicalPlayersByYear, selectedYear, years])

    // Map category levels per year/season
    const categoriesByYear = useMemo(() => {
        const map = new Map<string, string[]>()
        
        const getCategoryName = (c: any): string | null => {
            if (!c) return null;
            const name = c.category_name;
            if (typeof name === 'string') return name;
            if (name && typeof name.fi === 'string') return name.fi;
            if (c.category_name_translations && typeof c.category_name_translations.fi === 'string') {
                return c.category_name_translations.fi;
            }
            return null;
        };

        if (team?.categories) {
            (team.categories as any[]).forEach(c => {
                if (!c) return
                const season = c.competition_season ? String(c.competition_season) : ''
                if (!season) return
                
                const name = getCategoryName(c)
                if (!name) return

                let list = map.get(season)
                if (!list) {
                    list = []
                    map.set(season, list)
                }
                if (!list.includes(name)) {
                    list.push(name)
                }
            })
        }

        if (team?.groups) {
            (team.groups as any[]).forEach(g => {
                if (!g) return
                const season = g.competition_season ? String(g.competition_season) : ''
                if (!season) return
                
                const name = getCategoryName(g)
                if (!name) return

                let list = map.get(season)
                if (!list) {
                    list = []
                    map.set(season, list)
                }
                if (!list.includes(name)) {
                    list.push(name)
                }
            })
        }

        return map
    }, [team?.categories, team?.groups])
    
    // Sort matches: past matches played date desc, upcoming fixtures date asc (filtered by year if applicable)
    const pastMatches = useMemo(() => {
        let filtered = filteredMatches.filter(m => m.date && new Date(m.date + 'T' + (m.time || '00:00:00')) < new Date())
        if (selectedYear !== 'all') {
            filtered = filtered.filter(m => m.date && m.date.startsWith(selectedYear))
        }
        return filtered.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    }, [filteredMatches, selectedYear])

    const upcoming = useMemo(() => {
        let filtered = filteredMatches.filter(m => m.status === 'Fixture')
        if (selectedYear !== 'all') {
            filtered = filtered.filter(m => m.date && m.date.startsWith(selectedYear))
        }
        return filtered.sort((a, b) => (a.date || '').localeCompare(a.date || '')).slice(0, 10)
    }, [filteredMatches, selectedYear])

    // Home/Away split stats
    const homeAwayStats = useMemo(() => {
        const home = { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 }
        const away = { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 }
        filteredMatches.forEach(m => {
            if (m.status !== 'Played' || !m.date) return
            const isA = m.team_A_id === teamId
            const myScore = parseInt(isA ? m.fs_A || '0' : m.fs_B || '0', 10)
            const oppScore = parseInt(isA ? m.fs_B || '0' : m.fs_A || '0', 10)
            if (isNaN(myScore) || isNaN(oppScore)) return
            const s = isA ? home : away
            s.played++
            s.goalsFor += myScore
            s.goalsAgainst += oppScore
            if (myScore > oppScore) s.wins++
            else if (myScore < oppScore) s.losses++
            else s.draws++
        })
        const ppg = (s: typeof home) => s.played > 0 ? ((s.wins * 3 + s.draws) / s.played).toFixed(2) : '-'
        return { home, away, homePPG: ppg(home), awayPPG: ppg(away) }
    }, [filteredMatches, teamId])

    // Last 5 matches form
    const last5Form = useMemo(() => {
        return pastMatches.slice(0, 5).map(m => {
            const isA = m.team_A_id === teamId
            const myScore = parseInt(isA ? m.fs_A || '0' : m.fs_B || '0', 10)
            const oppScore = parseInt(isA ? m.fs_B || '0' : m.fs_A || '0', 10)
            if (isNaN(myScore) || isNaN(oppScore)) return null
            return myScore > oppScore ? 'V' as const : myScore < oppScore ? 'H' as const : 'T' as const
        }).filter((r): r is 'V' | 'H' | 'T' => r !== null)
    }, [pastMatches, teamId])

    // WARNING FOR FUTURE DEVELOPERS & AI AGENTS:
    // ALL useMemo/useCallback/useState/useEffect hooks MUST be declared BEFORE
    // any conditional early returns (loading, error, etc.). React's Rules of Hooks
    // require hooks to always run in the same order. Placing a useMemo after an
    // early return causes React error #310 (different number of hooks rendered)
    // which crashes the page into the 404 errorElement. DO NOT move this below
    // the loading/error guards.
    // Top scorers/assisters for the selected year
    const currentScorers = useMemo(() => {
        const yr = selectedYear === 'all' ? (years[0] || APP_CONFIG.CURRENT_YEAR) : selectedYear
        return (teamTopScorers[yr] || []).filter(p => p.goals > 0 || p.assists > 0)
    }, [teamTopScorers, selectedYear, years])

    if (loading) return (
        <div className="min-h-screen px-4 py-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="animate-pulse bg-surface-1 rounded-xl h-64" />
                <div className="animate-pulse bg-surface-1 rounded-xl h-96" />
            </div>
        </div>
    )
    
    if (error || !teamId) return (
        <div className="min-h-screen px-4 py-8 text-center text-semantic-red">
            {error || 'Joukkuetta ei löytynyt'}
        </div>
    )

    // Render roster list of players as a card grid
    // Show historical roster for a selected year, or current squad for 'all'
    const rosterYear = selectedYear === 'all' ? (years[0] || APP_CONFIG.CURRENT_YEAR) : selectedYear
    type RosterEntry = { player_id: string; first_name: string; last_name: string; img_url?: string; birthyear?: string; shirt_number?: string }
    const rosterPlayers: RosterEntry[] =
        historicalPlayersByYear[rosterYear] && historicalPlayersByYear[rosterYear].length > 0
            ? historicalPlayersByYear[rosterYear]
            : players.filter(p => !!p.player_id).map(p => ({
                player_id: p.player_id!,
                first_name: p.first_name || '',
                last_name: p.last_name || '',
                img_url: p.img_url,
                birthyear: p.birthyear,
                shirt_number: p.shirt_number,
            }))

    const rosterContent = (
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-accent" />
                    {selectedYear === 'all' ? 'Nykyinen kokoonpano' : `Kokoonpano ${rosterYear}`}
                    <span className="text-text-muted font-normal text-xs">({rosterPlayers.length})</span>
                </span>
                {loadingPlayers && (
                    <span className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin shrink-0" />
                )}
            </h3>
            {rosterPlayers.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-8 bg-surface-1 border border-border-hairline rounded-xl">Ei pelaajatietoja</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                    {rosterPlayers.map(p => (
                        <div
                            key={p.player_id}
                            onClick={() => p.player_id && navigate(`/player/${p.player_id}`)}
                            className={`bg-surface-1 border border-border-hairline hover:border-accent/30 rounded-xl p-3.5 flex items-center justify-between hover:bg-surface-2 transition-all active:scale-[0.98] min-h-[56px] ${p.player_id ? 'cursor-pointer' : 'cursor-default opacity-60'}`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-full bg-surface-3 flex items-center justify-center shrink-0 border border-border-hairline">
                                    {p.img_url ? (
                                        <img src={p.img_url} alt="" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <User className="w-4 h-4 text-text-muted" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-text-primary font-semibold text-sm truncate">{p.first_name} {p.last_name}</p>
                                    {p.birthyear && <p className="text-text-muted text-xs font-mono mt-0.5">{p.birthyear}</p>}
                                </div>
                            </div>
                            {p.shirt_number && (
                                <span className="bg-accent/10 border border-accent/20 text-accent font-mono font-bold text-xs px-2 py-0.5 rounded shrink-0">
                                    #{p.shirt_number}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )

    // Render roster transitions (new vs gone players)
    const transitionsContent = (
        <div className="space-y-4">
            {/* New Players Bento Box */}
            <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-semantic-green" /> Uudet pelaajat
                        {loadingPlayers
                            ? <span className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                            : <span className="text-text-muted font-normal text-xs">({playerTransitions.newPlayers.length})</span>
                        }
                    </span>
                    <span className="text-[10px] text-text-muted font-mono font-normal">
                        Kausi {playerTransitions.targetYear} vs {playerTransitions.prevYear}
                    </span>
                </h3>
                
                {loadingPlayers ? (
                    <div className="flex items-center justify-center py-6">
                        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : playerTransitions.newPlayers.length === 0 ? (
                    <p className="text-text-muted text-xs text-center py-6 bg-surface-2 border border-border-hairline border-dashed rounded-lg">
                        Ei uusia pelaajia tällä kaudella
                    </p>
                ) : (
                    <div className="grid grid-cols-1 gap-2">
                        {playerTransitions.newPlayers.map(p => (
                            <div
                                key={p.player_id}
                                onClick={() => navigate(`/player/${p.player_id}`)}
                                className="bg-surface-2 border border-border-hairline hover:border-accent/30 rounded-lg p-2.5 flex items-center justify-between cursor-pointer hover:bg-surface-3 transition-all active:scale-[0.98] min-h-[44px]"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-7 h-7 rounded-full bg-surface-3 flex items-center justify-center shrink-0 border border-border-hairline">
                                        {p.img_url ? (
                                            <img src={p.img_url} alt="" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <User className="w-3.5 h-3.5 text-text-muted" />
                                        )}
                                    </div>
                                    <p className="text-text-primary font-semibold text-xs truncate">
                                        {p.first_name} {p.last_name}
                                    </p>
                                </div>
                                <span className="bg-semantic-green/10 border border-semantic-green/20 text-semantic-green text-[9px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 uppercase tracking-wide">
                                    Uusi
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Gone Players Bento Box */}
            <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-semantic-red" /> Lähteneet pelaajat
                        {loadingPlayers
                            ? <span className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                            : <span className="text-text-muted font-normal text-xs">({playerTransitions.gonePlayers.length})</span>
                        }
                    </span>
                    <span className="text-[10px] text-text-muted font-mono font-normal">
                        Kauden {playerTransitions.prevYear} jälkeen
                    </span>
                </h3>
                
                {loadingPlayers ? (
                    <div className="flex items-center justify-center py-6">
                        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : !playerTransitions.hasComparisonData ? (
                    <p className="text-text-muted text-xs text-center py-6 bg-surface-2 border border-border-hairline border-dashed rounded-lg">
                        Ei vertailutietoja edelliseltä kaudelta
                    </p>
                ) : playerTransitions.gonePlayers.length === 0 ? (
                    <p className="text-text-muted text-xs text-center py-6 bg-surface-2 border border-border-hairline border-dashed rounded-lg">
                        Ei lähteneitä pelaajia tällä kaudella
                    </p>
                ) : (
                    <div className="grid grid-cols-1 gap-2">
                        {playerTransitions.gonePlayers.map(p => (
                            <div
                                key={p.player_id}
                                onClick={() => navigate(`/player/${p.player_id}`)}
                                className="bg-surface-2 border border-border-hairline hover:border-accent/30 rounded-lg p-2.5 flex items-center justify-between cursor-pointer hover:bg-surface-3 transition-all active:scale-[0.98] min-h-[44px]"
                            >
                                <div className="flex items-center gap-2.5 min-w-0 opacity-60">
                                    <div className="w-7 h-7 rounded-full bg-surface-3 flex items-center justify-center shrink-0 border border-border-hairline">
                                        {p.img_url ? (
                                            <img src={p.img_url} alt="" className="w-full h-full rounded-full object-cover grayscale" />
                                        ) : (
                                            <User className="w-3.5 h-3.5 text-text-muted" />
                                        )}
                                    </div>
                                    <p className="text-text-primary font-semibold text-xs truncate">
                                        {p.first_name} {p.last_name}
                                    </p>
                                </div>
                                <span className="bg-semantic-red/10 border border-semantic-red/20 text-semantic-red text-[9px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 uppercase tracking-wide">
                                    Lähtenyt
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )

    // Render top scorers/assisters
    const scorersContent = currentScorers.length > 0 ? (
        <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" /> Parhaat maalintekijät
            </h3>
            <div className="space-y-1">
                {currentScorers.map((p, i) => (
                    <div
                        key={p.player_id}
                        onClick={() => navigate(`/player/${p.player_id}`)}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-2 border border-transparent hover:border-border-hairline cursor-pointer transition-all active:scale-[0.99] min-h-[44px]"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="text-text-muted text-xs font-mono w-5 shrink-0">{i + 1}.</span>
                            <span className="text-text-primary font-medium truncate text-sm">{p.first_name} {p.last_name}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-2">
                            <span className="text-accent font-bold font-mono text-sm">{p.goals} maalia</span>
                            {p.assists > 0 && <span className="text-text-muted text-xs font-mono">{p.assists} syöttöä</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    ) : null

    // Render matches list (upcoming + past)
    const matchesContent = (
        <div className="space-y-6">
            {upcoming.length > 0 && (
                <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-accent animate-pulse" /> Tulevat ottelut
                    </h3>
                    <div className="space-y-1">
                        {upcoming.map(m => (
                            <div
                                key={m.match_id}
                                onClick={() => navigate(`/match/${m.match_id}`)}
                                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-surface-2 border border-transparent hover:border-border-hairline cursor-pointer transition-all active:scale-[0.99] text-sm min-h-[44px]"
                            >
                                <span className="text-text-muted w-16 shrink-0">{m.date?.slice(5)}</span>
                                <span className="text-text-primary truncate text-right flex-1 pr-2">{m.team_A_name}</span>
                                <span className="text-text-muted mx-2 shrink-0 font-mono text-xs">vs</span>
                                <span className="text-text-primary truncate flex-1 pl-2">{m.team_B_name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {pastMatches.length > 0 && (
                <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-accent" /> Pelatut ottelut
                    </h3>
                    <div className="space-y-1">
                        {pastMatches.map(m => {
                            const isA = m.team_A_id === teamId
                            const myScore = isA ? m.fs_A : m.fs_B
                            const oppScore = isA ? m.fs_B : m.fs_A
                            const wld = myScore && oppScore ? (Number(myScore) > Number(oppScore) ? 'V' : Number(myScore) < Number(oppScore) ? 'H' : 'T') : null
                            return (
                                <div
                                    key={m.match_id}
                                    onClick={() => navigate(`/match/${m.match_id}`)}
                                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-surface-2 border border-transparent hover:border-border-hairline cursor-pointer transition-all active:scale-[0.99] text-sm min-h-[44px]"
                                >
                                    <span className="text-text-muted w-12 shrink-0 text-xs">{m.date?.slice(5)}</span>
                                    <span className="text-text-primary truncate flex-1 text-right pr-2">
                                        {isA ? m.team_B_name : m.team_A_name}
                                    </span>
                                    <span className="font-mono font-bold mx-2 shrink-0 flex items-center gap-1.5">
                                        <span className="text-text-primary">{m.fs_A ? `${myScore}–${oppScore}` : '–'}</span>
                                        {wld && (
                                            <span className={cn(
                                                'text-[10px] font-bold px-1 py-0.5 rounded leading-none',
                                                wld === 'V' ? 'bg-semantic-green/10 text-semantic-green border border-semantic-green/20' : 
                                                wld === 'H' ? 'bg-semantic-red/10 text-semantic-red border border-semantic-red/20' : 
                                                'bg-accent/10 text-accent border border-accent/20'
                                            )}>
                                                {wld}
                                            </span>
                                        )}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {pastMatches.length === 0 && upcoming.length === 0 && (
                <p className="text-text-muted text-sm text-center py-8 bg-surface-1 border border-border-hairline rounded-xl">Ei otteluita</p>
            )}
        </div>
    )

    return (
        <div className="min-h-screen px-4 py-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors text-sm mb-2">
                    <ArrowLeft className="w-4 h-4" /> Takaisin
                </button>

                {/* Team Info Header Card */}
                <div className="bg-surface-1 border border-border-hairline rounded-2xl p-6 relative overflow-hidden space-y-6">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-bmw-cyan via-bmw-magenta to-bmw-amber" />
                    
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <div className="flex items-center gap-3.5">
                                {team?.crest ? (
                                    <div className="w-14 h-14 rounded-full bg-surface-2 border border-border-hairline p-1 flex items-center justify-center shrink-0">
                                        <img src={team.crest} alt="" className="w-full h-full rounded-full object-contain" />
                                    </div>
                                ) : (
                                    <div className="w-14 h-14 rounded-full bg-surface-2 border border-border-hairline flex items-center justify-center shrink-0 text-text-muted">
                                        <Shield className="w-8 h-8" />
                                    </div>
                                )}
                                {team?.kit_1_front && (
                                    <div className="w-14 h-14 rounded-xl bg-surface-2 border border-border-hairline p-1 flex items-center justify-center shrink-0">
                                        <img src={team.kit_1_front} alt="Paita" className="w-full h-full object-contain rounded" />
                                    </div>
                                )}
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-accent">Joukkueprofiili</span>
                                    <h1 className="text-2xl font-bold text-text-primary truncate mt-0.5">{team?.team_name || teamId}</h1>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-secondary mt-1.5">
                                        {team?.birthyear && (
                                            <span className="flex items-center gap-1 font-medium bg-surface-2 px-2 py-0.5 rounded-md">
                                                <CalendarDays className="w-3.5 h-3.5 text-accent" />
                                                {team.birthyear}
                                            </span>
                                        )}
                                        {(() => {
                                            const getCategoryName = (c: any): string | null => {
                                                if (!c) return null;
                                                const name = c.category_name;
                                                if (typeof name === 'string') return name;
                                                if (name && typeof name.fi === 'string') return name.fi;
                                                if (c.category_name_translations && typeof c.category_name_translations.fi === 'string') {
                                                    return c.category_name_translations.fi;
                                                }
                                                return null;
                                            };
                                            const primaryCatName = getCategoryName(team?.primary_category);
                                            const categoryNames = new Set<string>();
                                            if (primaryCatName) {
                                                categoryNames.add(primaryCatName);
                                            }
                                            if (team?.categories) {
                                                // WARNING FOR FUTURE DEVELOPERS & AI AGENTS (e.g. DeepSeek):
                                                // DO NOT simplify this loop or remove the String()/existence checks.
                                                // 1. API responses can return numeric competition_id values. Calling `.includes()` directly on them throws a TypeError, crashing the page and causing React Router to render the 404 page.
                                                // 2. Tournament entries (e.g. Helsinki Cup "hc2026") might have an empty competition_season in the API, but they must still be treated as current because their competition_id contains "2026" or "26".
                                                team.categories.forEach(c => {
                                                    if (!c) return;
                                                    const season = c.competition_season ? String(c.competition_season) : '';
                                                    const compId = c.competition_id ? String(c.competition_id) : '';
                                                    const isCurrent = season === APP_CONFIG.CURRENT_YEAR || 
                                                        (compId && compId.includes(APP_CONFIG.CURRENT_YEAR)) ||
                                                        (compId && compId.includes(APP_CONFIG.CURRENT_YEAR.slice(2)));
                                                    if (isCurrent) {
                                                        const name = getCategoryName(c);
                                                        if (name) categoryNames.add(name);
                                                    }
                                                });
                                            }
                                            return Array.from(categoryNames).slice(0, 3).map((name, idx) => (
                                                <span key={idx} className="text-xs bg-surface-3 border border-border-hairline px-2 py-0.5 rounded-md text-text-primary font-medium">
                                                    {name}
                                                </span>
                                            ));
                                        })()}
                                        {team?.club_name && <span className="text-text-muted font-medium">{team.club_name}</span>}
                                    </div>
                                    {last5Form.length > 0 && (
                                        <div className="flex items-center gap-1.5 mt-1.5">
                                            <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Kunto:</span>
                                            {last5Form.map((r, i) => (
                                                <span key={i} className={cn('w-2.5 h-2.5 rounded-full', r === 'V' ? 'bg-semantic-green' : r === 'H' ? 'bg-semantic-red' : 'bg-accent')} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => teamId && toggle(teamId)}
                            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-surface-2 border border-border-hairline hover:border-accent/30 hover:bg-surface-3 transition-all cursor-pointer active:scale-95"
                            aria-label={fav ? 'Poista suosikeista' : 'Lisää suosikkeihin'}
                        >
                            <Heart className={cn('w-5 h-5 transition-colors', fav ? 'fill-semantic-red text-semantic-red' : 'text-text-muted')} />
                        </button>
                    </div>

                    {/* Calculated Stats Badges Grid */}
                    {statsByYear.get('all') && statsByYear.get('all')!.played > 0 && (
                        <div className="space-y-4 pt-4 border-t border-border-hairline">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-text-secondary">
                                    {selectedYear === 'all' ? 'Kausitilastot: Kaikki kaudet (Yhteensä)' : `Kausitilastot: Kausi ${selectedYear}`}
                                </span>
                                {years.length > 0 && (
                                    <div className="flex items-center gap-1.5 bg-surface-2 p-1 rounded-lg border border-border-hairline">
                                        <button
                                            onClick={() => setSelectedYear('all')}
                                            className={cn(
                                                "text-xs px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer active:scale-95",
                                                selectedYear === 'all' 
                                                    ? "bg-accent text-text-inverse shadow-sm" 
                                                    : "text-text-muted hover:text-text-primary"
                                            )}
                                        >
                                            Yhteensä
                                        </button>
                                        {years.map(y => (
                                            <button
                                                key={y}
                                                onClick={() => setSelectedYear(y)}
                                                className={cn(
                                                    "text-xs px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer active:scale-95",
                                                    selectedYear === y 
                                                        ? "bg-accent text-text-inverse shadow-sm" 
                                                        : "text-text-muted hover:text-text-primary"
                                                )}
                                            >
                                                {y}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                                <StatBadge label="Ottelut" value={displayStats.played} />
                                <StatBadge label="Voitot" value={displayStats.wins} variant="success" />
                                <StatBadge label="Tasapelit" value={displayStats.draws} variant="warning" />
                                <StatBadge label="Häviöt" value={displayStats.losses} variant="danger" />
                                <StatBadge label="Maaliero" value={displayStats.diffStr} variant={parseInt(displayStats.diffStr) > 0 ? 'success' : parseInt(displayStats.diffStr) < 0 ? 'danger' : 'default'} />
                                {displayStats.played > 0 && (
                                    <>
                                        <StatBadge label="Maalit/ottelu" value={Number(displayStats.goalsScoredPerMatch).toFixed(2)} variant="success" />
                                        <StatBadge label="Päästetyt/ottelu" value={Number(displayStats.goalsConcededPerMatch).toFixed(2)} variant="danger" />
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                            {/* Home/Away split */}
                            {(homeAwayStats.home.played > 0 || homeAwayStats.away.played > 0) && (
                                <div className="grid grid-cols-2 gap-2.5 pt-2">
                                    <div className="bg-surface-2 border border-border-hairline rounded-lg p-2.5 space-y-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Kotona</span>
                                        <div className="flex items-center gap-2 text-xs font-mono">
                                            <span className="text-semantic-green font-bold">{homeAwayStats.home.wins}V</span>
                                            <span className="text-accent">{homeAwayStats.home.draws}T</span>
                                            <span className="text-semantic-red">{homeAwayStats.home.losses}H</span>
                                            <span className="text-text-muted ml-auto">{homeAwayStats.homePPG} PPG</span>
                                        </div>
                                    </div>
                                    <div className="bg-surface-2 border border-border-hairline rounded-lg p-2.5 space-y-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Vieraissa</span>
                                        <div className="flex items-center gap-2 text-xs font-mono">
                                            <span className="text-semantic-green font-bold">{homeAwayStats.away.wins}V</span>
                                            <span className="text-accent">{homeAwayStats.away.draws}T</span>
                                            <span className="text-semantic-red">{homeAwayStats.away.losses}H</span>
                                            <span className="text-text-muted ml-auto">{homeAwayStats.awayPPG} PPG</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Season-over-Season Comparison Timeline */}
                    {years.length > 1 && (
                        <div className="mt-4 pt-4 border-t border-border-hairline space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-text-muted">
                                <span>Kausivertailu (Pisteet per ottelu & maaliero)</span>
                                {performanceComparison && performanceComparison.ppgDiff !== null && (
                                    <span className={cn(
                                        "font-bold uppercase tracking-[0.06em] px-1.5 py-0.5 rounded flex items-center gap-1 leading-none shrink-0",
                                        performanceComparison.trend === 'better' ? "bg-semantic-green/10 text-semantic-green border border-semantic-green/20" :
                                        performanceComparison.trend === 'worse' ? "bg-semantic-red/10 text-semantic-red border border-semantic-red/20" :
                                        "bg-accent/10 text-accent border border-accent/20"
                                    )}>
                                        {performanceComparison.trend === 'better' && "▲ Kunto nouseva"}
                                        {performanceComparison.trend === 'worse' && "▼ Kunto laskeva"}
                                        {performanceComparison.trend === 'neutral' && "► Tasainen kunto"}
                                        <span className="font-mono text-[10px]">({performanceComparison.ppgDiffStr} PPG vs {performanceComparison.prevYear})</span>
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {years.map(yr => {
                                    const yrStats = statsByYear.get(yr)
                                    if (!yrStats || yrStats.played === 0) return null
                                    const isActive = selectedYear === yr
                                    return (
                                        <div
                                            key={yr}
                                            onClick={() => setSelectedYear(yr)}
                                            className={cn(
                                                "p-3 rounded-xl border transition-all cursor-pointer select-none",
                                                isActive
                                                    ? "bg-accent/10 border-accent/40 text-accent font-bold"
                                                    : "bg-surface-2 border-border-hairline hover:border-accent/20 text-text-secondary hover:text-text-primary"
                                            )}
                                        >
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-bold">{yr}</span>
                                                <span className={cn(
                                                    "text-[10px] font-bold px-1 rounded leading-none shrink-0",
                                                    parseInt(yrStats.diffStr) > 0 ? "bg-semantic-green/10 text-semantic-green" :
                                                    parseInt(yrStats.diffStr) < 0 ? "bg-semantic-red/10 text-semantic-red" :
                                                    "bg-text-muted/10 text-text-muted"
                                                )}>
                                                    {yrStats.diffStr}
                                                </span>
                                            </div>
                                            
                                            {/* Category / Division Level */}
                                            {categoriesByYear.get(yr) && categoriesByYear.get(yr)!.length > 0 && (
                                                <div className="text-[10px] text-text-muted truncate mt-1 select-none font-medium" title={categoriesByYear.get(yr)!.join(', ')}>
                                                    {categoriesByYear.get(yr)!.join(' / ')}
                                                </div>
                                            )}

                                            <div className="mt-1.5 flex items-baseline justify-between">
                                                <span className="text-sm font-mono tracking-tight">{yrStats.ppg.toFixed(2)} PPG</span>
                                                <span className="text-[10px] text-text-muted">{yrStats.played} ottelua</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Tabbed Navigation & Contents */}
                <div className="lg:hidden space-y-6">
                    <div className="flex bg-surface-1 border border-border-hairline rounded-xl overflow-hidden p-1 gap-1">
                        <button
                            onClick={() => setTab('matches')}
                            className={cn(
                                'flex-1 py-3 text-sm font-semibold transition-all rounded-lg cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]',
                                tab === 'matches' ? 'bg-surface-3 text-text-primary ring-1 ring-border-hairline' : 'text-text-muted hover:text-text-secondary'
                            )}
                        >
                            <Calendar className="w-4 h-4" /> Ottelut
                        </button>
                        <button
                            onClick={() => setTab('roster')}
                            className={cn(
                                'flex-1 py-3 text-sm font-semibold transition-all rounded-lg cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]',
                                tab === 'roster' ? 'bg-surface-3 text-text-primary ring-1 ring-border-hairline' : 'text-text-muted hover:text-text-secondary'
                            )}
                        >
                            <Users className="w-4 h-4" /> Pelaajat
                        </button>
                    </div>
                    <div>
                        {tab === 'matches' ? matchesContent : (
                            <div className="space-y-6">
                                {rosterContent}
                                {scorersContent}
                                {transitionsContent}
                            </div>
                        )}
                    </div>
                </div>

                {/* Desktop Side-by-Side Bento Grid Layout */}
                <div className="hidden lg:grid grid-cols-3 gap-8 items-start">
                    {/* Left Column (1/3) - Roster */}
                    <div className="col-span-1 space-y-6">
                        {rosterContent}
                        {scorersContent}
                        {transitionsContent}
                    </div>

                    {/* Right Column (2/3) - Matches */}
                    <div className="col-span-2 space-y-6">
                        {matchesContent}
                    </div>
                </div>
            </div>
        </div>
    )
}