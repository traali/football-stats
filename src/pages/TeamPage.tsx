import { useParams } from 'react-router-dom'
import { Users, Calendar, TrendingUp } from 'lucide-react'
import { cn } from '../utils/cn'
import { useTeamData } from '../hooks/useTeamData'
import { usePlayerCardStats } from '../hooks/usePlayerCardStats'
import { getTeamCategory } from '../utils/dataProcessors'
import { APP_CONFIG } from '../config'
import { StatBadge, BackButton, PageLayout, Card, PlayerAvatar, TeamHeader, TeamMatchList } from '../components'
import { TeamRoster } from '../components/TeamRoster'
import { useNavigate } from 'react-router-dom'

export function TeamPage() {
    const { teamId = '' } = useParams()
    const navigate = useNavigate()
    const data = useTeamData(teamId)

    if (data.loading) return (
        <div className="min-h-screen px-4 py-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="animate-pulse bg-surface-1 rounded-xl h-64" />
                <div className="animate-pulse bg-surface-1 rounded-xl h-96" />
            </div>
        </div>
    )

    if (data.error || !teamId) return (
        <div className="min-h-screen px-4 py-8 text-center text-semantic-red">
            {data.error || 'Joukkuetta ei löytynyt'}
        </div>
    )

    const {
        team, tab, setTab, selectedYear, setSelectedYear,
        displayStats, performanceComparison, statsByYear, years,
        playerTransitions, categoriesByYear, rosterPlayers,
        rosterYear, loadingPlayers, historyError, historicalPlayersByYear,
        currentScorers, pastMatches, upcoming, last5Form,
        fav, toggle,
    } = data

    return (
        <TeamPageReady
            teamId={teamId}
            navigate={navigate}
            team={team}
            tab={tab}
            setTab={setTab}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            displayStats={displayStats}
            performanceComparison={performanceComparison}
            statsByYear={statsByYear}
            years={years}
            playerTransitions={playerTransitions}
            categoriesByYear={categoriesByYear}
            rosterPlayers={rosterPlayers}
            rosterYear={rosterYear}
            loadingPlayers={loadingPlayers}
            historyError={historyError}
            historicalPlayersByYear={historicalPlayersByYear}
            currentScorers={currentScorers}
            pastMatches={pastMatches}
            upcoming={upcoming}
            last5Form={last5Form}
            fav={fav}
            toggle={toggle}
        />
    )
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function TeamPageReady(props: any) {
    return <TeamPageBody {...props} />
}

function TeamPageBody({
    teamId, navigate, team, tab, setTab, selectedYear, setSelectedYear,
    displayStats, performanceComparison, statsByYear, years,
    playerTransitions, categoriesByYear, rosterPlayers, rosterYear,
    loadingPlayers, historyError, historicalPlayersByYear,
    currentScorers, pastMatches, upcoming, last5Form, fav, toggle,
}: any) {
/* eslint-enable @typescript-eslint/no-explicit-any */
    const cardStats = usePlayerCardStats(rosterPlayers.map((p: { player_id: string }) => p.player_id), rosterYear)
    const prevYear = String(parseInt(rosterYear, 10) - 1)
    const lastSeasonById = Object.fromEntries(
        (historicalPlayersByYear[prevYear] || []).map((p: { player_id: string; matches?: number; goals?: number }) => [p.player_id, { matches: p.matches, goals: p.goals }]),
    )

    const rosterContent = (
        <TeamRoster
            players={rosterPlayers}
            teamName={team?.team_name}
            level={team ? getTeamCategory(team, rosterYear) || '' : ''}
            rosterYear={rosterYear}
            loading={loadingPlayers}
            error={historyError}
            lastSeasonById={lastSeasonById}
            cardStats={cardStats}
        />
    )

    const transitionsContent = (
        <div className="space-y-4">
            <Card className="space-y-3">
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
                        {playerTransitions.newPlayers.map((p: { player_id: string; img_url?: string; first_name: string; last_name: string }) => (
                            <div
                                key={p.player_id}
                                onClick={() => navigate(`/player/${p.player_id}`)}
                                className="bg-surface-2 border border-border-hairline hover:border-accent/30 rounded-lg p-2.5 flex items-center justify-between cursor-pointer hover:bg-surface-3 transition-all active:scale-[0.98] min-h-[44px]"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <PlayerAvatar src={p.img_url} size="sm" />
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
            </Card>

            <Card className="space-y-3">
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
                        {playerTransitions.gonePlayers.map((p: { player_id: string; img_url?: string; first_name: string; last_name: string }) => (
                            <div
                                key={p.player_id}
                                onClick={() => navigate(`/player/${p.player_id}`)}
                                className="bg-surface-2 border border-border-hairline hover:border-accent/30 rounded-lg p-2.5 flex items-center justify-between cursor-pointer hover:bg-surface-3 transition-all active:scale-[0.98] min-h-[44px]"
                            >
                                <div className="flex items-center gap-2.5 min-w-0 opacity-60">
                                    <PlayerAvatar src={p.img_url} size="sm" />
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
            </Card>
        </div>
    )

    const scorersContent = currentScorers.length > 0 ? (
        <Card className="space-y-3">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" /> Parhaat maalintekijät
            </h3>
            <div className="space-y-1">
                {currentScorers.map((p: { player_id: string; first_name: string; last_name: string; goals: number; assists: number }, i: number) => (
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
        </Card>
    ) : null

    return (
        <PageLayout>
            <BackButton className="mb-2" />

            <TeamHeader
                team={team}
                teamId={teamId}
                last5Form={last5Form}
                fav={fav}
                onToggleFav={() => toggle(teamId, team?.team_name, team ? getTeamCategory(team, APP_CONFIG.CURRENT_YEAR) : undefined)}
            />

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
                            {years.map((y: string) => (
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
                            {years.map((yr: string) => {
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
                    {tab === 'matches' ? (
                        <TeamMatchList upcoming={upcoming} pastMatches={pastMatches} teamId={teamId} />
                    ) : (
                        <div className="space-y-6">
                            {rosterContent}
                            {scorersContent}
                            {transitionsContent}
                        </div>
                    )}
                </div>
            </div>

            <div className="hidden lg:grid grid-cols-3 gap-8 items-start">
                <div className="col-span-1 space-y-6">
                    {rosterContent}
                    {scorersContent}
                    {transitionsContent}
                </div>
                <div className="col-span-2 space-y-6">
                    <TeamMatchList upcoming={upcoming} pastMatches={pastMatches} teamId={teamId} />
                </div>
            </div>
        </PageLayout>
    )
}
