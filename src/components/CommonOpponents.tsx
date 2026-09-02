import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Users, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../utils/cn'
import { getMatchDetails } from '../services/api'
import { MATCH_STATUS } from '../types'
import type { MatchDetails, GroupDetails, MatchSummary, PlayerLineupInfo } from '../types'

function scoreOf(m: MatchSummary, teamId: string): { my: number; opp: number; wld: 'V' | 'T' | 'H' } | null {
    const isA = m.team_A_id === teamId
    const my = parseInt(String((isA ? m.fs_A : m.fs_B) ?? ''), 10)
    const opp = parseInt(String((isA ? m.fs_B : m.fs_A) ?? ''), 10)
    if (Number.isNaN(my) || Number.isNaN(opp)) return null
    return { my, opp, wld: my > opp ? 'V' : my < opp ? 'H' : 'T' }
}

function Wld({ v }: { v: 'V' | 'T' | 'H' }) {
    return (
        <span className={cn(
            'w-5 h-5 rounded-md text-[10px] font-bold font-mono inline-flex items-center justify-center shrink-0',
            v === 'V' ? 'bg-semantic-green/15 text-semantic-green' :
            v === 'H' ? 'bg-semantic-red/15 text-semantic-red' :
            'bg-surface-2 text-text-muted',
        )}>{v}</span>
    )
}

export function CommonOpponents({
    teamAId, teamBId, teamAName, teamBName, group,
}: {
    teamAId: string
    teamBId: string
    teamAName: string
    teamBName: string
    group: GroupDetails | null
    _upcomingMatch?: MatchDetails
}) {
    const [openId, setOpenId] = useState<string | null>(null)
    const [loading, setLoading] = useState<Record<string, boolean>>({})
    const [details, setDetails] = useState<Record<string, { a: MatchDetails; b: MatchDetails }>>({})

    const rows = useMemo(() => {
        const played = (group?.matches || []).filter(m => m.status === MATCH_STATUS.PLAYED)
        const lastA = new Map<string, MatchSummary>()
        const lastB = new Map<string, MatchSummary>()
        const nameOf = new Map<string, string>()
        for (const m of played) {
            if (m.team_A_id === teamAId) { lastA.set(m.team_B_id, m); nameOf.set(m.team_B_id, m.team_B_name) }
            if (m.team_B_id === teamAId) { lastA.set(m.team_A_id, m); nameOf.set(m.team_A_id, m.team_A_name) }
            if (m.team_A_id === teamBId) { lastB.set(m.team_B_id, m); nameOf.set(m.team_B_id, m.team_B_name) }
            if (m.team_B_id === teamBId) { lastB.set(m.team_A_id, m); nameOf.set(m.team_A_id, m.team_A_name) }
        }
        return [...lastA.keys()].filter(id => lastB.has(id) && id !== teamAId && id !== teamBId).map(id => ({
            id,
            name: nameOf.get(id) || id,
            matchA: lastA.get(id)!,
            matchB: lastB.get(id)!,
            resA: scoreOf(lastA.get(id)!, teamAId),
            resB: scoreOf(lastB.get(id)!, teamBId),
        }))
    }, [group, teamAId, teamBId])

    if (!rows.length) return null

    const tot = rows.reduce((acc, r) => {
        if (r.resA) acc.a[r.resA.wld]++
        if (r.resB) acc.b[r.resB.wld]++
        return acc
    }, { a: { V: 0, T: 0, H: 0 }, b: { V: 0, T: 0, H: 0 } })

    const toggle = async (id: string, matchA: string, matchB: string) => {
        if (openId === id) { setOpenId(null); return }
        setOpenId(id)
        if (details[id]) return
        setLoading(s => ({ ...s, [id]: true }))
        try {
            const [a, b] = await Promise.all([getMatchDetails(matchA), getMatchDetails(matchB)])
            setDetails(s => ({ ...s, [id]: { a, b } }))
        } finally {
            setLoading(s => ({ ...s, [id]: false }))
        }
    }

    const roster = (players: PlayerLineupInfo[], label: string) => (
        <div className="min-w-0">
            <p className="text-[10px] font-bold text-text-muted uppercase mb-1 truncate">{label}</p>
            {players.length === 0 ? (
                <p className="text-[11px] text-text-muted">Ei kokoonpanoa</p>
            ) : players.map(p => (
                <p key={p.player_id} className="text-xs text-text-primary truncate">
                    {p.shirt_number ? `#${p.shirt_number} ` : ''}{p.player_name}
                </p>
            ))}
        </div>
    )

    return (
        <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">
                    Yhteiset vastustajat ({rows.length})
                </h3>
            </div>

            <div className="space-y-3">
                {rows.map(row => {
                    const open = openId === row.id
                    return (
                        <div key={row.id} className="border-b border-border-hairline last:border-0 pb-3 last:pb-0">
                            <button
                                type="button"
                                onClick={() => toggle(row.id, row.matchA.match_id, row.matchB.match_id)}
                                className="w-full text-left"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <p className="font-semibold text-sm text-text-primary truncate">{row.name}</p>
                                    {open ? <ChevronUp className="w-4 h-4 text-text-muted shrink-0" /> : <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />}
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-1.5 text-xs">
                                    <Link to={`/match/${row.matchA.match_id}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 min-w-0 hover:text-accent">
                                        {row.resA && <Wld v={row.resA.wld} />}
                                        <span className="font-mono">{row.resA ? `${row.resA.my}–${row.resA.opp}` : '–'}</span>
                                        <span className="text-text-muted truncate">{teamAName}</span>
                                    </Link>
                                    <Link to={`/match/${row.matchB.match_id}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 min-w-0 hover:text-accent">
                                        {row.resB && <Wld v={row.resB.wld} />}
                                        <span className="font-mono">{row.resB ? `${row.resB.my}–${row.resB.opp}` : '–'}</span>
                                        <span className="text-text-muted truncate">{teamBName}</span>
                                    </Link>
                                </div>
                            </button>
                            <AnimatePresence initial={false}>
                                {open && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                        <div className="pt-3 grid grid-cols-2 gap-3">
                                            {loading[row.id] ? (
                                                <p className="col-span-2 text-xs text-text-muted flex items-center gap-2">
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Ladataan kokoonpanoa…
                                                </p>
                                            ) : details[row.id] ? (
                                                <>
                                                    {roster(details[row.id].a.lineups.filter(p => p.team_id === teamAId), `${teamAName} vs ${row.name}`)}
                                                    {roster(details[row.id].b.lineups.filter(p => p.team_id === teamBId), `${teamBName} vs ${row.name}`)}
                                                </>
                                            ) : null}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )
                })}
            </div>

            <div className="flex items-center justify-between gap-2 text-xs pt-1">
                <span className="text-text-muted">Yhteisiä vastaan</span>
                <div className="flex items-center gap-3 font-mono">
                    <span className="truncate max-w-[40vw] text-text-secondary">
                        {teamAName} <span className="text-semantic-green">{tot.a.V}V</span> {tot.a.T}T <span className="text-semantic-red">{tot.a.H}H</span>
                    </span>
                    <span className="truncate max-w-[40vw] text-text-secondary">
                        {teamBName} <span className="text-semantic-green">{tot.b.V}V</span> {tot.b.T}T <span className="text-semantic-red">{tot.b.H}H</span>
                    </span>
                </div>
            </div>
        </div>
    )
}
