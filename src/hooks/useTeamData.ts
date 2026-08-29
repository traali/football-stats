import { useEffect, useState, useMemo, useRef } from 'react'
import { getTeamProfile, getTeamMatches, getGroupFull, batchFetch } from '../services/api'
import { useFavorites } from './useFavorites'
import { MATCH_STATUS } from '../types'
import type { TeamResponse, DiscoveryMatch } from '../types'
import { APP_CONFIG } from '../config'
import { parsePlayerName } from '../utils/names'

interface PlayerEntry {
    player_id: string; first_name: string; last_name: string; img_url?: string; birthyear?: string; shirt_number?: string
    position_fi?: string; matches?: number; goals?: number; assists?: number; warnings?: number
}

interface ScorerEntry {
    player_id: string; first_name: string; last_name: string; goals: number; assists: number; img_url?: string
    matches?: number; warnings?: number
}

interface YearStats {
    played: number; wins: number; draws: number; losses: number
    goalsFor: number; goalsAgainst: number; diffStr: string
    ppg: number; goalsScoredPerMatch: number; goalsConcededPerMatch: number
}

interface PerformanceComparison {
    targetYear: string; prevYear: string; currentPPG: number; prevPPG: number | null
    trend: 'better' | 'worse' | 'neutral'; ppgDiff: number | null; ppgDiffStr: string
    currentGoalsScored: number; prevGoalsScored: number | null
    currentGoalsConceded: number; prevGoalsConceded: number | null
}

interface PlayerTransitions {
    targetYear: string; prevYear: string; hasComparisonData: boolean
    newPlayers: PlayerEntry[]; gonePlayers: PlayerEntry[]
}

export function useTeamData(teamId: string | undefined) {
    const { isFavorite, toggle } = useFavorites()
    const [team, setTeam] = useState<TeamResponse | null>(null)
    const [matches, setMatches] = useState<DiscoveryMatch[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [tab, setTab] = useState<'roster' | 'matches'>('matches')
    const [selectedYear, setSelectedYear] = useState<string>('all')
    const [historicalPlayersByYear, setHistoricalPlayersByYear] = useState<Record<string, PlayerEntry[]>>({})
    const [loadingPlayers, setLoadingPlayers] = useState(false)
    const [historyError, setHistoryError] = useState<string | null>(null)
    const [teamTopScorers, setTeamTopScorers] = useState<Record<string, ScorerEntry[]>>({})

    const fav = teamId ? isFavorite(teamId) : false
    const abortRef = useRef<AbortController | null>(null)

    useEffect(() => {
        if (!teamId) return
        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller
        setLoading(true)
        Promise.all([
            getTeamProfile(teamId, controller.signal),
            getTeamMatches(teamId, controller.signal),
        ])
            .then(([t, m]) => {
                if (controller.signal.aborted) return
                setTeam(t); setMatches(m); setLoading(false)
            })
            .catch(e => {
                if (controller.signal.aborted) return
                setError(e.message); setLoading(false)
            })
        return () => { controller.abort() }
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

    const relevantGroups = useMemo(() => {
        if (!team?.groups) return []
        interface GroupLike {
            competition_season?: string | number
            competition_id?: string
            category_id?: string
            group_id?: string
        }
        return (team.groups as GroupLike[]).filter(g => {
            if (!g) return false
            const season = g.competition_season ? String(g.competition_season) : ''
            return season && allowedYears.includes(season)
        })
    }, [team, allowedYears])

    const historyAbortRef = useRef<AbortController | null>(null)

    useEffect(() => {
        if (!teamId || relevantGroups.length === 0) return
        historyAbortRef.current?.abort()
        const controller = new AbortController()
        historyAbortRef.current = controller
        setLoadingPlayers(true)
        setHistoryError(null)

        const fetchPlayers = async () => {
            try {
                const groupKeys = relevantGroups.map(g => `${g.competition_id}:${g.category_id}:${g.group_id}`)
                const results = await batchFetch(groupKeys, async (key, signal) => {
                    const [compId, catId, groupId] = key.split(':')
                    return getGroupFull(compId, catId, groupId, signal)
                }, 5, controller.signal)

                if (controller.signal.aborted) return

                const playersBySeason: Record<string, Record<string, PlayerEntry>> = {}
                const statsBySeason: Record<string, Record<string, ScorerEntry>> = {}
                allowedYears.forEach(yr => { playersBySeason[yr] = {}; statsBySeason[yr] = {} })

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
                        const parsed = parsePlayerName(p as { first_name?: string; last_name?: string; player_name?: string })
                        const g = parseInt(String(p.goals || '0'), 10) || 0
                        const a = parseInt(String(p.assists || '0'), 10) || 0
                        const w = parseInt(String(p.warnings || '0'), 10) || 0
                        const mcount = parseInt(String((p as { matches?: string; matches_played?: string }).matches || (p as { matches_played?: string }).matches_played || '0'), 10) || 0
                        const prevP = playersBySeason[season][pid]
                        playersBySeason[season][pid] = {
                            player_id: pid,
                            first_name: parsed.first_name,
                            last_name: parsed.last_name,
                            img_url: p.img_url || prevP?.img_url,
                            matches: (prevP?.matches || 0) + mcount,
                            goals: (prevP?.goals || 0) + g,
                            assists: (prevP?.assists || 0) + a,
                            warnings: (prevP?.warnings || 0) + w,
                        }
                        const existing = statsBySeason[season][pid]
                        if (existing) {
                            existing.goals += g
                            existing.assists += a
                            existing.matches = (existing.matches || 0) + mcount
                            existing.warnings = (existing.warnings || 0) + w
                        } else {
                            statsBySeason[season][pid] = {
                                player_id: pid, first_name: parsed.first_name, last_name: parsed.last_name,
                                goals: g, assists: a, img_url: p.img_url, matches: mcount, warnings: w,
                            }
                        }
                    })
                })

                if (team?.players) {
                    const curYrBucket = playersBySeason[APP_CONFIG.CURRENT_YEAR]
                    if (curYrBucket && Object.keys(curYrBucket).length === 0) {
                        team.players.forEach(p => {
                            if (p.player_id) {
                                curYrBucket[String(p.player_id)] = {
                                    player_id: String(p.player_id),
                                    first_name: p.first_name || '',
                                    last_name: p.last_name || '',
                                    img_url: p.img_url,
                                }
                            }
                        })
                    }
                }

                const finalPlayers: Record<string, PlayerEntry[]> = {}
                Object.entries(playersBySeason).forEach(([yr, map]) => { finalPlayers[yr] = Object.values(map) })
                const finalScorers: Record<string, ScorerEntry[]> = {}
                Object.entries(statsBySeason).forEach(([yr, map]) => {
                    finalScorers[yr] = Object.values(map).sort((a, b) => b.goals - a.goals || b.assists - a.assists)
                })
                setHistoricalPlayersByYear(finalPlayers)
                setTeamTopScorers(finalScorers)
            } catch (err) {
                if (controller.signal.aborted) return
                setHistoryError(err instanceof Error ? err.message : 'Virhe ladattaessa historiatietoja')
            } finally {
                if (!controller.signal.aborted) setLoadingPlayers(false)
            }
        }
        fetchPlayers()
        return () => { controller.abort() }
    }, [relevantGroups, teamId, team?.players, allowedYears])

    const statsByYear = useMemo(() => {
        const map = new Map<string, YearStats>()
        const empty = (): YearStats => ({ played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, diffStr: '0', ppg: 0, goalsScoredPerMatch: 0, goalsConcededPerMatch: 0 })
        map.set('all', empty())
        filteredMatches.forEach(m => {
            if (m.status !== MATCH_STATUS.PLAYED || !m.date) return
            const year = m.date.slice(0, 4)
            if (!year || isNaN(parseInt(year))) return
            let s = map.get(year)
            if (!s) { s = empty(); map.set(year, s) }
            s.played++
            const allStats = map.get('all')!
            allStats.played++
            const isA = m.team_A_id === teamId
            const myScore = parseInt(isA ? m.fs_A || '0' : m.fs_B || '0', 10)
            const oppScore = parseInt(isA ? m.fs_B || '0' : m.fs_A || '0', 10)
            if (!isNaN(myScore) && !isNaN(oppScore)) {
                s.goalsFor += myScore; s.goalsAgainst += oppScore
                allStats.goalsFor += myScore; allStats.goalsAgainst += oppScore
                if (myScore > oppScore) { s.wins++; allStats.wins++ }
                else if (myScore < oppScore) { s.losses++; allStats.losses++ }
                else { s.draws++; allStats.draws++ }
            }
        })
        for (const s of map.values()) {
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

    const displayStats = useMemo(() => statsByYear.get(selectedYear) || emptyYear(), [statsByYear, selectedYear])

    const performanceComparison = useMemo((): PerformanceComparison | null => {
        const currentYear = years[0] || APP_CONFIG.CURRENT_YEAR
        const targetYear = selectedYear === 'all' ? currentYear : selectedYear
        const prevYear = String(parseInt(targetYear) - 1)
        const currentStats = statsByYear.get(targetYear)
        const prevStats = statsByYear.get(prevYear)
        if (!currentStats || currentStats.played === 0) return null
        const currentPPG = currentStats.ppg
        const prevPPG = prevStats && prevStats.played > 0 ? prevStats.ppg : null
        let trend: 'better' | 'worse' | 'neutral' = 'neutral'
        let ppgDiffStr = ''
        if (prevPPG !== null) {
            const diff = currentPPG - prevPPG
            trend = diff > 0.15 ? 'better' : diff < -0.15 ? 'worse' : 'neutral'
            ppgDiffStr = diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)
        }
        return {
            targetYear, prevYear, currentPPG, prevPPG, trend, ppgDiff: prevPPG !== null ? currentPPG - prevPPG : null, ppgDiffStr,
            currentGoalsScored: currentStats.goalsScoredPerMatch,
            prevGoalsScored: prevStats && prevStats.played > 0 ? prevStats.goalsScoredPerMatch : null,
            currentGoalsConceded: currentStats.goalsConcededPerMatch,
            prevGoalsConceded: prevStats && prevStats.played > 0 ? prevStats.goalsConcededPerMatch : null,
        }
    }, [statsByYear, selectedYear, years])

    const playerTransitions = useMemo((): PlayerTransitions => {
        const currentYear = years[0] || APP_CONFIG.CURRENT_YEAR
        const targetYear = selectedYear === 'all' ? currentYear : selectedYear
        const prevYear = String(parseInt(targetYear) - 1)
        const targetPlayers = historicalPlayersByYear[targetYear] || []
        const prevPlayers = historicalPlayersByYear[prevYear] || []
        const targetIds = new Set(targetPlayers.map(p => p.player_id))
        const prevIds = new Set(prevPlayers.map(p => p.player_id))
        return {
            targetYear, prevYear, hasComparisonData: prevPlayers.length > 0,
            newPlayers: targetPlayers.filter(p => !prevIds.has(p.player_id)),
            gonePlayers: prevPlayers.filter(p => !targetIds.has(p.player_id)),
        }
    }, [historicalPlayersByYear, selectedYear, years])

    const categoriesByYear = useMemo(() => {
        const map = new Map<string, string[]>()
        const nameOf = (c: { category_name?: string | { fi?: string }; category_name_translations?: { fi?: string } }) => {
            const name = c.category_name
            if (typeof name === 'string') return name
            if (name && typeof name === 'object' && typeof name.fi === 'string') return name.fi
            return c.category_name_translations?.fi || null
        }
        const add = (season: string, name: string | null) => {
            if (!season || !name) return
            const list = map.get(season) || []
            if (!list.includes(name)) list.push(name)
            map.set(season, list)
        }
        for (const c of (team?.categories || []) as Array<{ competition_season?: string; category_name?: string }>) {
            add(c.competition_season ? String(c.competition_season) : '', nameOf(c))
        }
        for (const g of (team?.groups || []) as Array<{ competition_season?: string; category_name?: string }>) {
            add(g.competition_season ? String(g.competition_season) : '', nameOf(g))
        }
        return map
    }, [team])

    const pastMatches = useMemo(() => {
        let filtered = filteredMatches.filter(m => m.status === MATCH_STATUS.PLAYED)
        if (selectedYear !== 'all') filtered = filtered.filter(m => m.date && m.date.startsWith(selectedYear))
        return filtered.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    }, [filteredMatches, selectedYear])

    const upcoming = useMemo(() => {
        let filtered = filteredMatches.filter(m => m.status === MATCH_STATUS.FIXTURE)
        if (selectedYear !== 'all') filtered = filtered.filter(m => m.date && m.date.startsWith(selectedYear))
        return filtered.sort((a, b) => (a.date || '').localeCompare(b.date || '')).slice(0, 10)
    }, [filteredMatches, selectedYear])

    const homeAwayStats = useMemo(() => {
        const home = { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 }
        const away = { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 }
        filteredMatches.forEach(m => {
            if (m.status !== MATCH_STATUS.PLAYED || !m.date) return
            const isA = m.team_A_id === teamId
            const myScore = parseInt(isA ? m.fs_A || '0' : m.fs_B || '0', 10)
            const oppScore = parseInt(isA ? m.fs_B || '0' : m.fs_A || '0', 10)
            if (isNaN(myScore) || isNaN(oppScore)) return
            const s = isA ? home : away
            s.played++; s.goalsFor += myScore; s.goalsAgainst += oppScore
            if (myScore > oppScore) s.wins++
            else if (myScore < oppScore) s.losses++
            else s.draws++
        })
        const ppg = (s: typeof home) => s.played > 0 ? ((s.wins * 3 + s.draws) / s.played).toFixed(2) : '-'
        return { home, away, homePPG: ppg(home), awayPPG: ppg(away) }
    }, [filteredMatches, teamId])

    const last5Form = useMemo(() => pastMatches.slice(0, 5).map(m => {
        const isA = m.team_A_id === teamId
        const myScore = parseInt(isA ? m.fs_A || '0' : m.fs_B || '0', 10)
        const oppScore = parseInt(isA ? m.fs_B || '0' : m.fs_A || '0', 10)
        if (isNaN(myScore) || isNaN(oppScore)) return null
        return myScore > oppScore ? 'V' as const : myScore < oppScore ? 'H' as const : 'T' as const
    }).filter((r): r is 'V' | 'H' | 'T' => r !== null), [pastMatches, teamId])

    const currentScorers = useMemo(() => {
        const yr = selectedYear === 'all' ? (years[0] || APP_CONFIG.CURRENT_YEAR) : selectedYear
        return (teamTopScorers[yr] || []).filter(p => p.goals > 0 || p.assists > 0)
    }, [teamTopScorers, selectedYear, years])

    const rosterYear = selectedYear === 'all' ? (years[0] || APP_CONFIG.CURRENT_YEAR) : selectedYear
    const rosterPlayers: PlayerEntry[] = (() => {
        const base = historicalPlayersByYear[rosterYear]?.length
            ? historicalPlayersByYear[rosterYear]
            : players.filter(p => !!p.player_id).map(p => ({
                player_id: p.player_id!,
                first_name: p.first_name || '',
                last_name: p.last_name || '',
                img_url: p.img_url,
                birthyear: p.birthyear,
                shirt_number: p.shirt_number,
            }))
        const byId = Object.fromEntries(players.filter(p => p.player_id).map(p => [String(p.player_id), p]))
        const scorers = Object.fromEntries((teamTopScorers[rosterYear] || []).map(s => [s.player_id, s]))
        return base.map(p => {
            const tp = byId[p.player_id]
            const sc = scorers[p.player_id]
            return {
                ...p,
                birthyear: p.birthyear || tp?.birthyear,
                shirt_number: p.shirt_number || tp?.shirt_number,
                img_url: p.img_url || tp?.img_url,
                matches: p.matches ?? sc?.matches,
                goals: p.goals ?? sc?.goals,
                assists: p.assists ?? sc?.assists,
                warnings: p.warnings ?? sc?.warnings,
            }
        }).sort((a, b) => (b.goals || 0) - (a.goals || 0) || (b.matches || 0) - (a.matches || 0))
    })()

    return {
        team, matches, loading, error, tab, setTab, selectedYear, setSelectedYear,
        players, allowedYears, years, statsByYear, displayStats, performanceComparison,
        playerTransitions, categoriesByYear, pastMatches, upcoming, homeAwayStats, last5Form,
        currentScorers, rosterPlayers, rosterYear, loadingPlayers, historyError,
        historicalPlayersByYear, teamTopScorers, fav, isFavorite, toggle,
        filteredMatches, relevantGroups,
    }
}

function emptyYear() {
    return { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, diffStr: '0', ppg: 0, goalsScoredPerMatch: 0, goalsConcededPerMatch: 0 }
}
