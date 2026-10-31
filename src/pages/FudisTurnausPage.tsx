import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Bookmark, BookmarkCheck, ExternalLink, Trophy } from 'lucide-react'
import { BackButton, ErrorState, LiveFreshness, MatchRow, PageLayout, StandingsTable } from '../components'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useQuietRefresh, needsQuietRefresh } from '../hooks/useQuietRefresh'
import { splitMatches } from '../domain/matchState'
import { buildFudisView, groupResultsToStanding, shortGroupName, type FudisViewMatch } from '../services/fudisMap'
import { fetchFudisTournament, fudisturnausPageUrl, isFudisSlug, type FudisTournament } from '../services/fudisturnaus'
import { isTournamentSaved, removeTournament, saveTournament } from '../services/tournamentStorage'
import { friendlyError } from '../utils/friendlyError'
import type { MatchSummary } from '../types'
import { formatDate } from '../utils/dates'
import { cn } from '../utils/cn'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="bg-surface-1 border border-border-hairline rounded-xl p-4 space-y-2">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">{title}</h2>
            {children}
        </section>
    )
}

function MatchSections({ matches, teamId, fetchedAt }: { matches: FudisViewMatch[]; teamId?: string; fetchedAt?: number }) {
    const split = splitMatches(matches)
    const row = (m: FudisViewMatch) => (
        <MatchRow
            key={m.match_id}
            match={m}
            teamId={teamId}
            fetchedAt={fetchedAt}
            subtitle={[m.kind === 'playoff' ? `Sijoitus ${m.groupName}` : shortGroupName(m.groupName), m.fieldName].filter(Boolean).join(' · ')}
        />
    )
    return (
        <>
            {split.onNow.length > 0 && <Section title="Nyt käynnissä">{split.onNow.map(row)}</Section>}
            {split.upcoming.length > 0 && <Section title="Tulevat ottelut">{split.upcoming.map(row)}</Section>}
            {split.results.length > 0 && <Section title="Pelatut ottelut">{split.results.map(row)}</Section>}
        </>
    )
}

export function FudisTurnausPage() {
    const params = useParams()
    const slug = params.slug || ''
    const paramTeam = /^\d+$/.test(String(params.teamId || '')) ? String(params.teamId) : ''
    const [searchParams, setSearchParams] = useSearchParams()
    const clubId = searchParams.get('clubId') || ''
    const navigate = useNavigate()

    const [data, setData] = useState<FudisTournament | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [fetchedAt, setFetchedAt] = useState<number | undefined>()
    const [teamId, setTeamId] = useState(paramTeam)
    const [tick, setTick] = useState(0)
    const quietAbort = useRef<AbortController | null>(null)

    const reload = useCallback(() => setTick(t => t + 1), [])
    const quietReload = useCallback(() => {
        if (!isFudisSlug(slug)) return
        quietAbort.current?.abort()
        const ctrl = new AbortController()
        quietAbort.current = ctrl
        fetchFudisTournament(slug, ctrl.signal)
            .then(d => {
                if (ctrl.signal.aborted) return
                setData(d)
                setFetchedAt(Date.now())
                setError(null)
            })
            .catch(() => { /* keep last good */ })
    }, [slug])

    useEffect(() => { setTeamId(paramTeam) }, [paramTeam])

    useEffect(() => {
        if (!isFudisSlug(slug)) {
            setLoading(false)
            setError('Turnauksen osoite on vajaa tai virheellinen.')
            return
        }
        const ctrl = new AbortController()
        setLoading(true)
        setError(null)
        fetchFudisTournament(slug, ctrl.signal)
            .then(d => {
                if (ctrl.signal.aborted) return
                setData(d)
                setFetchedAt(Date.now())
            })
            .catch(err => {
                if (ctrl.signal.aborted) return
                const msg = err instanceof Error ? err.message : ''
                setError(msg.includes('Turnaus') || msg.includes('live-tietoja') ? msg : friendlyError(err, 'Turnausta'))
            })
            .finally(() => { if (!ctrl.signal.aborted) setLoading(false) })
        return () => ctrl.abort()
    }, [slug, tick])

    const view = useMemo(() => (data ? buildFudisView(data) : null), [data])
    const quiet = useMemo(() => (view ? needsQuietRefresh(view.all) : false), [view])
    useQuietRefresh(quiet && !loading && !error, quietReload)

    const teams = data?.teams || []
    const clubTeams = clubId ? teams.filter(t => String(t.clubId) === clubId) : teams
    const selectedTeamId = teamId || ''
    const myIds = useMemo(() => {
        if (selectedTeamId) return [selectedTeamId]
        if (clubId) return clubTeams.map(t => String(t.id))
        return [] as string[]
    }, [selectedTeamId, clubId, clubTeams])

    const myMatches = useMemo(() => {
        if (!view || myIds.length === 0) return [] as FudisViewMatch[]
        return view.all.filter(m =>
            myIds.includes(String(m.team_A_id)) ||
            myIds.includes(String(m.team_B_id)) ||
            (m.kind === 'playoff' && !m.team_A_id && !m.team_B_id && data?.groups.some(g =>
                (m.originHome === g.id || m.originAway === g.id) && g.results.some(r => myIds.includes(String(r.teamId))),
            )),
        )
    }, [view, myIds, data])

    const focusGroups = useMemo(() => {
        if (!data) return []
        if (myIds.length === 0) return data.groups
        return data.groups.filter(g =>
            g.results.some(r => myIds.includes(String(r.teamId))) ||
            teams.some(t => myIds.includes(String(t.id)) && t.groupId === g.id),
        )
    }, [data, myIds, teams])

    const selectedGroupId = searchParams.get('lohko') || (focusGroups[0] ? String(focusGroups[0].id) : '')
    const selectedGroup = data?.groups.find(g => String(g.id) === selectedGroupId) || null
    const showTables = !!data?.calculateGroupTables && !(data.ageGroups || []).some(a => a.hideGroupTables)

    const savedKey = { turnaus: 'fudis' as const, sarja: slug, teamId: selectedTeamId, clubId }
    const [saved, setSaved] = useState(() => isTournamentSaved(savedKey))
    useEffect(() => { setSaved(isTournamentSaved(savedKey)) }, [slug, selectedTeamId, clubId])

    const teamName = selectedTeamId
        ? (teams.find(t => String(t.id) === selectedTeamId)?.name || '')
        : clubId
            ? (data?.clubs?.find(c => String(c.id) === clubId)?.name || clubTeams.map(t => t.name).join(', '))
            : ''

    useDocumentTitle(data ? (teamName ? `${teamName} · ${data.name}` : data.name) : 'Turnaus')

    const syncTeam = (next: string) => {
        setTeamId(next)
        const path = next ? `/fudis/${encodeURIComponent(slug)}/${next}` : `/fudis/${encodeURIComponent(slug)}`
        const q = new URLSearchParams(searchParams)
        const qs = q.toString()
        navigate(`${path}${qs ? `?${qs}` : ''}`, { replace: true })
    }

    if (!slug) return <ErrorState message="Turnauksen osoite on vajaa." />
    if (loading && !data) {
        return (
            <PageLayout>
                <div className="animate-pulse bg-surface-1 rounded-xl h-40" />
                <div className="animate-pulse bg-surface-1 rounded-xl h-64" />
            </PageLayout>
        )
    }
    if (error && !data) return <ErrorState message={error} onRetry={reload} />
    if (!data || !view) return <ErrorState message="Turnausta ei löytynyt." onRetry={reload} />

    const toggleSave = () => {
        if (saved) removeTournament(`fudis-${slug}-${selectedTeamId}`)
        else saveTournament(savedKey, { title: data.name, teamName, category: data.ageGroups?.[0]?.name || 'fudisturnaus' })
        setSaved(!saved)
    }

    const external = fudisturnausPageUrl(slug, clubId || undefined)
    const groupMatchesForSelected = selectedGroup
        ? view.groupRows.filter(m => m.groupId === selectedGroup.id)
        : []
    const tabs = focusGroups.length ? focusGroups : data.groups

    return (
        <PageLayout>
            <BackButton fallbackTo="/" />

            <div className="bg-surface-1 border border-border-hairline rounded-2xl p-5 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-accent flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" /> Turnaus · fudisturnaus
                </span>
                <h1 className="text-xl font-bold text-text-primary">{teamName || data.name}</h1>
                <p className="text-sm text-text-secondary">
                    {[teamName ? data.name : '', data.ageGroups?.[0]?.name, data.location]
                        .filter(Boolean)
                        .join(' · ')}
                </p>
                <p className="text-xs text-text-muted">
                    {formatDate(data.startDate, 'with-year')}
                    {data.endDate && data.endDate !== data.startDate ? `–${formatDate(data.endDate, 'with-year')}` : ''}
                    {data.address ? ` · ${data.address}` : ''}
                </p>
                <div className="flex flex-wrap items-center gap-x-4">
                    <button type="button" onClick={toggleSave} aria-pressed={saved}
                        className="inline-flex items-center gap-1.5 min-h-[44px] text-xs font-semibold text-text-primary hover:text-accent">
                        {saved ? <BookmarkCheck className="w-4 h-4 text-accent" /> : <Bookmark className="w-4 h-4" />}
                        {saved ? 'Tallennettu etusivulle' : 'Tallenna etusivulle'}
                    </button>
                    <a href={external} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 min-h-[44px] text-xs font-semibold text-accent hover:underline">
                        <ExternalLink className="w-3.5 h-3.5" /> Avaa fudisturnaus.comissa
                    </a>
                </div>
                {error && (
                    <p className="text-xs text-semantic-amber font-medium">
                        Päivitys epäonnistui. Näytetään viimeisin onnistunut lataus.
                        {fetchedAt ? <> · <LiveFreshness fetchedAt={fetchedAt} /></> : null}
                    </p>
                )}
            </div>

            {teams.length > 0 && (
                <label className="block bg-surface-1 border border-border-hairline rounded-xl p-3 space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Joukkue</span>
                    <select
                        value={selectedTeamId}
                        onChange={e => syncTeam(e.target.value)}
                        className="w-full min-h-[44px] bg-surface-2 border border-border-hairline rounded-lg px-3 text-sm text-text-primary"
                        aria-label="Valitse joukkue"
                    >
                        <option value="">{clubId ? 'Seuran joukkueet' : 'Kaikki joukkueet'}</option>
                        {[...clubTeams].sort((a, b) => a.name.localeCompare(b.name, 'fi')).map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </label>
            )}

            {myIds.length > 0 ? (
                myMatches.length > 0
                    ? <MatchSections matches={myMatches} teamId={selectedTeamId || undefined} fetchedAt={fetchedAt} />
                    : (
                        <p className="text-sm text-text-secondary bg-surface-1 border border-border-hairline rounded-xl p-4">
                            Joukkueella ei ole otteluita tässä turnauksessa vielä.
                        </p>
                    )
            ) : (
                <MatchSections matches={view.all} fetchedAt={fetchedAt} />
            )}

            {tabs.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Lohkot">
                    {tabs.map(g => {
                        const active = String(g.id) === String(selectedGroupId)
                        return (
                            <button key={g.id} type="button" role="tab" aria-selected={active}
                                onClick={() => setSearchParams(prev => {
                                    const n = new URLSearchParams(prev)
                                    n.set('lohko', String(g.id))
                                    return n
                                }, { replace: true })}
                                className={cn(
                                    'shrink-0 min-h-[40px] px-3 rounded-full border text-xs font-semibold',
                                    active ? 'bg-accent text-text-inverse border-accent' : 'bg-surface-1 border-border-hairline text-text-secondary hover:text-text-primary',
                                )}>
                                {shortGroupName(g.name)}
                            </button>
                        )
                    })}
                </div>
            )}

            {selectedGroup && showTables && selectedGroup.results?.length > 0 && (
                <Section title={`Sarjataulukko · ${shortGroupName(selectedGroup.name)}`}>
                    <StandingsTable
                        teams={groupResultsToStanding(selectedGroup)}
                        matches={groupMatchesForSelected as unknown as MatchSummary[]}
                        teamAId={selectedTeamId || undefined}
                    />
                </Section>
            )}

            {selectedGroup && myIds.length > 0 && (
                <MatchSections
                    matches={groupMatchesForSelected}
                    teamId={selectedTeamId || undefined}
                    fetchedAt={fetchedAt}
                />
            )}

            {myIds.length > 0 && view.playoffRows.length > 0 && (
                <Section title="Sijoitusottelut">
                    {view.playoffRows.map(m => (
                        <MatchRow
                            key={m.match_id}
                            match={m}
                            teamId={selectedTeamId || undefined}
                            fetchedAt={fetchedAt}
                            subtitle={[`Sijoitus ${m.groupName}`, m.fieldName].filter(Boolean).join(' · ')}
                        />
                    ))}
                </Section>
            )}

            {myIds.length > 0 && (
                <Section title="Kaikki ottelut">
                    {view.all.map(m => (
                        <MatchRow
                            key={m.match_id}
                            match={m}
                            teamId={selectedTeamId || undefined}
                            fetchedAt={fetchedAt}
                            subtitle={[m.kind === 'playoff' ? `Sijoitus ${m.groupName}` : shortGroupName(m.groupName), m.fieldName].filter(Boolean).join(' · ')}
                        />
                    ))}
                </Section>
            )}

            <p className="text-[11px] text-text-muted text-center">
                Ajat Suomen aikaa · tiedot: fudisturnaus.com
                {fetchedAt ? <> · <LiveFreshness fetchedAt={fetchedAt} /></> : null}
            </p>
        </PageLayout>
    )
}
