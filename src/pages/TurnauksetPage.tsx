import { useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Users, Shield } from "lucide-react";
import { getSavedTournaments } from "../services/tournamentStorage";
import { BackButton, PageLayout, PlayerCard, PlayerCardSkeleton } from "../components";
import {
  TournamentStandingsTable,
  TournamentMatchesList,
  TournamentPlayoffsTree,
  TournamentScorersList,
} from "../components/tournament";
import { useTournamentData } from "../hooks/useTournamentData";
import { APP_CONFIG } from "../config";

export function TurnauksetPage() {
  const params = useParams();
  const { turnaus, sarja } = params;
  const rawTeamParam = (params["*"] || params.teamId || "").trim();
  let decodedTeam = rawTeamParam.replace(/^\/+/, "");
  try {
    decodedTeam = decodeURIComponent(decodedTeam);
  } catch {
    // keep as-is
  }

  // Resolve effective numeric teamId if a team name or slug was provided
  let effectiveTeamId = decodedTeam;
  if (!/^\d+$/.test(effectiveTeamId)) {
    const saved = getSavedTournaments()
        const match = saved.find(t =>
            t.turnaus === turnaus &&
            (t.teamName.toLowerCase().includes(decodedTeam.toLowerCase()) || decodedTeam.toLowerCase().includes(t.teamName.toLowerCase()))
        )
        if (match?.teamId) {
            effectiveTeamId = match.teamId
        } else if (turnaus === 'lime_0016' && /ppj|laru|sininen/i.test(decodedTeam)) {
            effectiveTeamId = '201313'
        }
    }
    const teamId = effectiveTeamId

    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    const {
        loading,
        error,
        groupName,
        compName,
        catName,
        standings,
        matches,
        teamName,
        teamCrest,
        players,
        processedPlayers,
        loadingPlayers,
        playerStats,
        playoffs,
        expandedPlayoff,
        setExpandedPlayoff,
        allGroups,
    } = useTournamentData({
        turnaus,
        sarja,
        teamId,
        decodedTeam,
        hostParam: searchParams.get('host'),
    })

    const teamMatches = useMemo(() => {
        return matches
            .filter(m => 
                m.team_A_id === effectiveTeamId || 
                m.team_B_id === effectiveTeamId ||
                (decodedTeam && (m.team_A_name.toLowerCase().includes(decodedTeam.toLowerCase()) || m.team_B_name.toLowerCase().includes(decodedTeam.toLowerCase()))) ||
                (teamName && (m.team_A_name.toLowerCase().includes(teamName.toLowerCase()) || m.team_B_name.toLowerCase().includes(teamName.toLowerCase())))
            )
            .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    }, [matches, effectiveTeamId, decodedTeam, teamName])

    const myStanding = useMemo(() => {
        return standings.find(s => 
            String(s.team_id) === effectiveTeamId ||
            (decodedTeam && s.team_name.toLowerCase().includes(decodedTeam.toLowerCase())) ||
            (teamName && s.team_name.toLowerCase().includes(teamName.toLowerCase()))
        )
    }, [standings, effectiveTeamId, decodedTeam, teamName])

    const sortedStandings = useMemo(() => {
        return [...standings].sort((a, b) => parseInt(String(a.current_standing)) - parseInt(String(b.current_standing)))
    }, [standings])

    const topScorers = useMemo(() => {
        return playerStats
            .filter(p => String(p.team_id) === effectiveTeamId)
            .sort((a, b) => (parseInt(b.goals || '0') || 0) - (parseInt(a.goals || '0') || 0))
            .slice(0, 20)
    }, [playerStats, effectiveTeamId])

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

    if (!turnaus || !sarja || (!effectiveTeamId && !decodedTeam)) return (
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

                <TournamentStandingsTable
                    groupName={groupName}
                    standings={sortedStandings}
                    teamId={teamId}
                    onSelectTeam={(tId) => navigate(`/turnaukset/${turnaus}/${sarja}/${tId}`)}
                />

                <TournamentMatchesList
                    teamName={teamName}
                    teamId={teamId}
                    matches={teamMatches}
                    onSelectMatch={(mId) => navigate(`/match/${mId}`)}
                />

                <TournamentPlayoffsTree
                    playoffs={playoffs}
                    expandedPlayoff={expandedPlayoff}
                    onTogglePlayoff={(id) => setExpandedPlayoff(expandedPlayoff === id ? null : id)}
                    groupName={groupName}
                    onSelectMatch={(mId) => navigate(`/match/${mId}`)}
                    renderPlayoffTeamName={renderPlayoffTeamName}
                />

                <TournamentScorersList
                    title="Maalintekijät (Turnaus)"
                    scorers={topScorers}
                    onSelectPlayer={(pId) => navigate(`/player/${pId}`)}
                />

                {topScorers.length === 0 && (
                    <TournamentScorersList
                        title={`Parhaat maalintekijät (Kausi ${APP_CONFIG.CURRENT_YEAR})`}
                        scorers={rosterScorers}
                        onSelectPlayer={(pId) => navigate(`/player/${pId}`)}
                    />
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
