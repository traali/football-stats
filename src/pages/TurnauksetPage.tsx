import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Bookmark, BookmarkCheck, Trophy } from 'lucide-react'
import { BackButton, ErrorState, MatchRow, PageLayout, StandingsTable, TasoLink } from '../components'
import { TournamentScorersList } from '../components/tournament'
import { useTournamentData } from '../hooks/useTournamentData'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { isKnockoutGroup, uniqueTeams } from '../services/tournament'
import { isTournamentSaved, removeTournament, saveTournament } from '../services/tournamentStorage'
import { splitMatches, byKickoffAsc } from '../domain/matchState'
import { tasoCategoryUrl } from '../utils/tasoLinks'
import { cn } from '../utils/cn'
import type { GroupResponse, MatchSummary } from '../types'

function groupLabel(g: GroupResponse): string {
    const name = String(g.group_name || g.group_id || '')
    return !isKnockoutGroup(g) && name.length <= 3 ? `Lohko ${name}` : name
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="bg-surface-1 border border-border-hairline rounded-xl p-4 space-y-2">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">{title}</h2>
            {children}
        </section>
    )
}

function MatchSections({ matches, teamId }: { matches: MatchSummary[]; teamId?: string }) {
    const split = splitMatches(matches)
    return (
        <>
            {split.onNow.length > 0 && (
                <Section title="Nyt käynnissä">
                    {split.onNow.map(m => <MatchRow key={m.match_id} match={m} teamId={teamId} />)}
                </Section>
            )}
            {split.upcoming.length > 0 && (
                <Section title="Tulevat ottelut">
                    {split.upcoming.map(m => <MatchRow key={m.match_id} match={m} teamId={teamId} />)}
                </Section>
            )}
            {split.results.length > 0 && (
                <Section title="Pelatut ottelut">
                    {split.results.map(m => <MatchRow key={m.match_id} match={m} teamId={teamId} />)}
                </Section>
            )}
        </>
    )
}

/** Knockout games by Taso round (round names are often empty, so "Kierros N"). */
function Bracket({ group, teamId }: { group: GroupResponse; teamId?: string }) {
    const rounds = useMemo(() => {
        const map = new Map<string, MatchSummary[]>()
        for (const m of group.matches || []) {
            const r = String((m as MatchSummary & { round_id?: string }).round_id || '')
            const list = map.get(r) || []
            list.push(m)
            map.set(r, list)
        }
        return [...map.entries()]
            .sort((a, b) => (Number(a[0]) || 0) - (Number(b[0]) || 0))
            .map(([r, ms]) => ({ round: r, name: String((ms[0] as MatchSummary & { round_name?: string }).round_name || ''), matches: [...ms].sort(byKickoffAsc) }))
    }, [group])
    return (
        <Section title={`Jatkopelit · ${groupLabel(group)}`}>
            {rounds.map(r => (
                <div key={r.round || 'x'} className="space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted pt-2">{r.name || (r.round ? `Kierros ${r.round}` : 'Ottelut')}</p>
                    {r.matches.map(m => <MatchRow key={m.match_id} match={m} teamId={teamId} />)}
                </div>
            ))}
        </Section>
    )
}

export function TurnauksetPage() {
    const params = useParams()
    const turnaus = params.turnaus || ''
    const sarja = params.sarja || ''
    const rawTeam = String(params.teamId || '')
    const teamId = /^\d+$/.test(rawTeam) ? rawTeam : ''
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()
    const data = useTournamentData({ turnaus, sarja, teamId })
    const [saved, setSaved] = useState(() => isTournamentSaved({ turnaus, sarja, teamId }))

    useDocumentTitle(data.teamName ? `${data.teamName} · ${data.compName || 'Turnaus'}` : data.compName || 'Turnaus')

    const selectedId = searchParams.get('lohko') || data.myStageGroup?.group_id || data.stageGroups[0]?.group_id || data.groups[0]?.group_id || ''
    const selected = data.groups.find(g => String(g.group_id) === String(selectedId)) || null

    if (!turnaus || !sarja) return <ErrorState message="Turnauksen osoite on vajaa." />
    if (data.loading) return (
        <PageLayout>
            <div className="animate-pulse bg-surface-1 rounded-xl h-40" />
            <div className="animate-pulse bg-surface-1 rounded-xl h-64" />
        </PageLayout>
    )
    if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />

    const toggleSave = () => {
        const p = { turnaus, sarja, teamId }
        if (saved) removeTournament(`${turnaus}-${sarja}-${teamId}`)
        else saveTournament(p, { title: data.compName, teamName: data.teamName, category: data.catName })
        setSaved(!saved)
    }

    return (
        <PageLayout>
            <BackButton fallbackTo={teamId ? `/team/${teamId}` : '/'} />

            <div className="bg-surface-1 border border-border-hairline rounded-2xl p-5 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-accent flex items-center gap-1"><Trophy className="w-3.5 h-3.5" /> Turnaus</span>
                <h1 className="text-xl font-bold text-text-primary">{data.teamName || data.compName || turnaus}</h1>
                <p className="text-sm text-text-secondary">{[data.teamName ? data.compName : '', data.catName].filter(Boolean).join(' · ')}</p>
                {data.myStanding && data.myStageGroup && (
                    <p className="text-xs text-text-primary font-semibold">
                        {groupLabel(data.myStageGroup)} · {data.myStanding.current_standing}. sija · {data.myStanding.matches_played} ottelua · {data.myStanding.points} p
                    </p>
                )}
                <div className="flex flex-wrap items-center gap-x-4">
                    <button type="button" onClick={toggleSave} aria-pressed={saved}
                        className="inline-flex items-center gap-1.5 min-h-[44px] text-xs font-semibold text-text-primary hover:text-accent">
                        {saved ? <BookmarkCheck className="w-4 h-4 text-accent" /> : <Bookmark className="w-4 h-4" />}
                        {saved ? 'Tallennettu etusivulle' : 'Tallenna etusivulle'}
                    </button>
                    <TasoLink href={tasoCategoryUrl(turnaus, sarja)} />
                    {teamId && <button type="button" onClick={() => navigate(`/team/${teamId}`)} className="min-h-[44px] text-xs font-semibold text-accent hover:underline">Joukkueen sivu</button>}
                </div>
            </div>

            {teamId && data.myMatches.length > 0 && <MatchSections matches={data.myMatches} teamId={teamId} />}
            {teamId && data.myMatches.length === 0 && (
                <p className="text-sm text-text-secondary bg-surface-1 border border-border-hairline rounded-xl p-4">
                    Joukkueella ei ole otteluita tässä sarjassa. Valitse lohko alta.
                </p>
            )}

            {data.groups.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Lohkot">
                    {data.groups.map(g => {
                        const active = String(g.group_id) === String(selectedId)
                        return (
                            <button key={g.group_id} type="button" role="tab" aria-selected={active}
                                onClick={() => setSearchParams(prev => { const n = new URLSearchParams(prev); n.set('lohko', String(g.group_id)); return n }, { replace: true })}
                                className={cn('shrink-0 min-h-[40px] px-3 rounded-full border text-xs font-semibold',
                                    active ? 'bg-accent text-text-inverse border-accent' : 'bg-surface-1 border-border-hairline text-text-secondary hover:text-text-primary')}>
                                {groupLabel(g)}
                            </button>
                        )
                    })}
                </div>
            )}

            {selected && (isKnockoutGroup(selected) ? (
                <Bracket group={selected} teamId={teamId || undefined} />
            ) : (
                <>
                    <Section title={`Sarjataulukko · ${groupLabel(selected)}`}>
                        <StandingsTable teams={uniqueTeams(selected.teams)} matches={selected.matches || []} teamAId={teamId || undefined}
                            showPointsPerMatch={String(selected.show_points_per_match) === '1'} />
                    </Section>
                    {!teamId || String(selected.group_id) !== String(data.myStageGroup?.group_id) ? (
                        <MatchSections matches={selected.matches || []} />
                    ) : null}
                </>
            ))}

            <TournamentScorersList
                title={teamId ? 'Joukkueen maalintekijät turnauksessa' : 'Maalintekijät'}
                scorers={data.scorers}
                onSelectPlayer={pid => navigate(`/player/${pid}`)}
            />
        </PageLayout>
    )
}
