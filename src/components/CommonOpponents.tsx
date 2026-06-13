import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, ChevronDown, ChevronUp, Users, Goal, Calendar, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '../utils/cn'
import { getMatchDetails } from '../services/api'
import type { MatchDetails, GroupDetails, MatchSummary, PlayerLineupInfo } from '../types/api'

interface CommonOpponentData {
    opponentId: string;
    opponentName: string;
    matchA: MatchSummary;
    matchB: MatchSummary;
}

interface CommonOpponentsProps {
    teamAId: string;
    teamBId: string;
    teamAName: string;
    teamBName: string;
    group: GroupDetails | null;
    upcomingMatch: MatchDetails;
}

export function CommonOpponents({ teamAId, teamBId, teamAName, teamBId: _, teamAName: __, group, upcomingMatch }: CommonOpponentsProps) {
    const [expandedOpponent, setExpandedOpponent] = useState<string | null>(null)
    const [loadingMatches, setLoadingMatches] = useState<Record<string, boolean>>({})
    const [matchDetails, setMatchDetails] = useState<Record<string, { detailsA: MatchDetails; detailsB: MatchDetails }>>({})
    const [activeTab, setActiveTab] = useState<'past' | 'upcoming'>('past')

    if (!group || !group.matches) return null

    // Extract played matches against common opponents
    const playedMatches = group.matches.filter(m => m.status === 'Played')
    
    // Find all opponents played by Team A
    const opponentsA = new Map<string, MatchSummary>()
    playedMatches.forEach(m => {
        if (m.team_A_id === teamAId) {
            opponentsA.set(m.team_B_id, m)
        } else if (m.team_B_id === teamAId) {
            opponentsA.set(m.team_A_id, m)
        }
    })

    // Identify common opponents also played by Team B
    const commonOpponents: CommonOpponentData[] = []
    playedMatches.forEach(m => {
        const isTeamA = m.team_A_id === teamBId
        const isTeamB = m.team_B_id === teamBId
        if (isTeamA || isTeamB) {
            const oppId = isTeamA ? m.team_B_id : m.team_A_id
            const oppName = isTeamA ? m.team_B_name : m.team_A_name
            if (opponentsA.has(oppId)) {
                // To avoid duplicates, check if we already added it
                if (!commonOpponents.some(co => co.opponentId === oppId)) {
                    commonOpponents.push({
                        opponentId: oppId,
                        opponentName: oppName,
                        matchA: opponentsA.get(oppId)!,
                        matchB: m
                    })
                }
            }
        }
    })

    if (commonOpponents.length === 0) {
        return (
            <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 text-center text-text-muted text-sm">
                Ei yhteisiä vastustajia tällä kaudella.
            </div>
        )
    }

    const handleToggle = async (opponentId: string, matchIdA: string, matchIdB: string) => {
        if (expandedOpponent === opponentId) {
            setExpandedOpponent(null)
            return
        }

        setExpandedOpponent(opponentId)

        // Load details if not already loaded
        if (!matchDetails[opponentId]) {
            setLoadingMatches(prev => ({ ...prev, [opponentId]: true }))
            try {
                const [detailsA, detailsB] = await Promise.all([
                    getMatchDetails(matchIdA),
                    getMatchDetails(matchIdB)
                ])
                setMatchDetails(prev => ({
                    ...prev,
                    [opponentId]: { detailsA, detailsB }
                }))
            } catch (err) {
                console.error("Failed to load common opponent rosters", err)
            } finally {
                setLoadingMatches(prev => ({ ...prev, [opponentId]: false }))
            }
        }
    }

    const renderRosterList = (players: PlayerLineupInfo[], teamName: string) => {
        if (!players || players.length === 0) {
            return <p className="text-text-muted text-xs text-center py-4">Ei kokoonpanotietoja saatavilla</p>
        }
        
        return (
            <div className="space-y-1">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 text-center border-b border-border-hairline pb-1 truncate max-w-full">{teamName}</p>
                {players.map((p, idx) => (
                    <div key={p.player_id || idx} className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-surface-3 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                            {p.shirt_number && (
                                <span className="text-accent font-mono font-bold w-5 text-right shrink-0">#{p.shirt_number}</span>
                            )}
                            <span className="text-text-primary truncate font-medium">{p.player_name}</span>
                            {p.captain === "1" && (
                                <span className="text-[10px] bg-accent/20 text-accent font-bold px-1 rounded font-mono shrink-0">C</span>
                            )}
                        </div>
                        {p.position_fi && (
                            <span className="text-[10px] text-text-muted bg-surface-2 px-1 py-0.5 rounded capitalize shrink-0 ml-1">
                                {p.position_fi}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        )
    }

    const formatResult = (m: MatchSummary, targetTeamId: string) => {
        const isA = m.team_A_id === targetTeamId
        const myScore = isA ? m.fs_A : m.fs_B
        const oppScore = isA ? m.fs_B : m.fs_A
        const oppName = isA ? m.team_B_name : m.team_A_name
        
        if (myScore === undefined || oppScore === undefined || myScore === null || oppScore === null) {
            return {
                text: `vs ${oppName}`,
                outcome: 'fixture',
                badgeClass: 'bg-surface-2 text-text-muted'
            }
        }

        const scoreA = Number(myScore)
        const scoreB = Number(oppScore)
        
        let outcome: 'win' | 'loss' | 'draw' = 'draw'
        let badgeClass = 'bg-accent/10 border border-accent/20 text-accent'
        let outcomeLabel = 'T'

        if (scoreA > scoreB) {
            outcome = 'win'
            badgeClass = 'bg-semantic-green/10 border border-semantic-green/20 text-semantic-green'
            outcomeLabel = 'V'
        } else if (scoreA < scoreB) {
            outcome = 'loss'
            badgeClass = 'bg-semantic-red/10 border border-semantic-red/20 text-semantic-red'
            outcomeLabel = 'H'
        }

        return {
            text: `${myScore}–${oppScore} vs ${oppName}`,
            outcome,
            outcomeLabel,
            badgeClass
        }
    }

    return (
        <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                <h3 className="text-base font-bold text-text-primary uppercase tracking-wider">Vertailu yhteisiä vastustajia vastaan</h3>
            </div>
            
            <div className="divide-y divide-border-hairline">
                {commonOpponents.map((co) => {
                    const isExpanded = expandedOpponent === co.opponentId
                    const resA = formatResult(co.matchA, teamAId)
                    const resB = formatResult(co.matchB, teamBId)
                    const isLoading = loadingMatches[co.opponentId]
                    const details = matchDetails[co.opponentId]

                    return (
                        <div key={co.opponentId} className="py-3.5 first:pt-0 last:pb-0">
                            <div 
                                onClick={() => handleToggle(co.opponentId, co.matchA.match_id, co.matchB.match_id)}
                                className="flex items-center justify-between cursor-pointer hover:text-text-primary transition-colors text-sm"
                            >
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-bold text-text-primary truncate">{co.opponentName}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 mt-1.5 text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-text-muted w-16 shrink-0">{teamAName}:</span>
                                            {resA.outcomeLabel && (
                                                <span className={cn("px-1.5 py-0.5 rounded font-mono font-bold text-[10px] leading-none shrink-0", resA.badgeClass)}>
                                                    {resA.outcomeLabel}
                                                </span>
                                            )}
                                            <span className="text-text-secondary truncate">{resA.text}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-text-muted w-16 shrink-0">{upcomingMatch.team_B_name}:</span>
                                            {resB.outcomeLabel && (
                                                <span className={cn("px-1.5 py-0.5 rounded font-mono font-bold text-[10px] leading-none shrink-0", resB.badgeClass)}>
                                                    {resB.outcomeLabel}
                                                </span>
                                            )}
                                            <span className="text-text-secondary truncate">{resB.text}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="ml-3 shrink-0 p-1 text-text-muted hover:text-text-primary transition-colors">
                                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </div>
                            </div>

                            <AnimatePresence initial={false}>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="pt-4 mt-3 border-t border-border-hairline space-y-4">
                                            {isLoading ? (
                                                <div className="flex items-center justify-center py-8 gap-2 text-text-muted text-sm">
                                                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                                                    Ladataan kokoonpanotietoja...
                                                </div>
                                            ) : details ? (
                                                <div className="space-y-4">
                                                    {/* Tabs */}
                                                    <div className="flex bg-surface-2 border border-border-hairline rounded-lg p-0.5 max-w-xs mx-auto">
                                                        <button
                                                            onClick={() => setActiveTab('past')}
                                                            className={cn(
                                                                'flex-1 py-1.5 text-xs font-semibold rounded-md transition-all',
                                                                activeTab === 'past' 
                                                                    ? 'bg-surface-3 text-text-primary shadow-sm' 
                                                                    : 'text-text-muted hover:text-text-secondary'
                                                            )}
                                                        >
                                                            Edellinen peli
                                                        </button>
                                                        <button
                                                            onClick={() => setActiveTab('upcoming')}
                                                            className={cn(
                                                                'flex-1 py-1.5 text-xs font-semibold rounded-md transition-all',
                                                                activeTab === 'upcoming' 
                                                                    ? 'bg-surface-3 text-text-primary shadow-sm' 
                                                                    : 'text-text-muted hover:text-text-secondary'
                                                            )}
                                                        >
                                                            Tuleva peli
                                                        </button>
                                                    </div>

                                                    {/* Side by side lists */}
                                                    <div className="grid grid-cols-2 gap-4 bg-surface-2/40 border border-border-hairline rounded-xl p-4">
                                                        {activeTab === 'past' ? (
                                                            <>
                                                                {/* Team A players in match against opponent */}
                                                                {renderRosterList(
                                                                    details.detailsA.lineups.filter(p => p.team_id === teamAId),
                                                                    `${teamAName} (vs ${co.opponentName})`
                                                                )}
                                                                {/* Team B players in match against opponent */}
                                                                {renderRosterList(
                                                                    details.detailsB.lineups.filter(p => p.team_id === teamBId),
                                                                    `${upcomingMatch.team_B_name} (vs ${co.opponentName})`
                                                                )}
                                                            </>
                                                        ) : (
                                                            <>
                                                                {/* Team A upcoming lineup */}
                                                                {renderRosterList(
                                                                    upcomingMatch.lineups.filter(p => p.team_id === teamAId),
                                                                    `${teamAName} (Tuleva)`
                                                                )}
                                                                {/* Team B upcoming lineup */}
                                                                {renderRosterList(
                                                                    upcomingMatch.lineups.filter(p => p.team_id === teamBId),
                                                                    `${upcomingMatch.team_B_name} (Tuleva)`
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-4 text-xs text-semantic-red flex items-center justify-center gap-1">
                                                    <AlertTriangle className="w-3.5 h-3.5" />
                                                    Kokoonpanotietojen haku epäonnistui.
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
