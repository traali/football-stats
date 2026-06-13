import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../utils/cn'
import type { MatchSummary } from '../types/api'

export function PreMatchComparison({ teamAId, teamBId, teamAName, teamBName, matches }: {
    teamAId: string
    teamBId: string
    teamAName: string
    teamBName: string
    matches: MatchSummary[]
}) {
    const navigate = useNavigate()

    const common = useMemo(() => {
        const aOpponents = new Map<string, { result: 'win' | 'draw' | 'loss'; matchId: string }[]>()
        const bOpponents = new Map<string, { result: 'win' | 'draw' | 'loss'; matchId: string }[]>()

        for (const m of matches) {
            if (m.status !== 'Played') continue
            const myScoreA = parseInt(m.fs_A)
            const oppScoreA = parseInt(m.fs_B)
            if (isNaN(myScoreA) || isNaN(oppScoreA)) continue

            if (m.team_A_id === teamAId) {
                const r = myScoreA > oppScoreA ? 'win' : myScoreA < oppScoreA ? 'loss' : 'draw'
                const arr = aOpponents.get(m.team_B_id) || []
                arr.push({ result: r, matchId: m.match_id })
                aOpponents.set(m.team_B_id, arr)
            }
            if (m.team_B_id === teamAId) {
                const r = oppScoreA > myScoreA ? 'win' : oppScoreA < myScoreA ? 'loss' : 'draw'
                const arr = aOpponents.get(m.team_A_id) || []
                arr.push({ result: r, matchId: m.match_id })
                aOpponents.set(m.team_A_id, arr)
            }
            if (m.team_A_id === teamBId) {
                const r = myScoreA > oppScoreA ? 'win' : myScoreA < oppScoreA ? 'loss' : 'draw'
                const arr = bOpponents.get(m.team_B_id) || []
                arr.push({ result: r, matchId: m.match_id })
                bOpponents.set(m.team_B_id, arr)
            }
            if (m.team_B_id === teamBId) {
                const r = oppScoreA > myScoreA ? 'win' : oppScoreA < myScoreA ? 'loss' : 'draw'
                const arr = bOpponents.get(m.team_A_id) || []
                arr.push({ result: r, matchId: m.match_id })
                bOpponents.set(m.team_A_id, arr)
            }
        }

        const commonIds = [...aOpponents.keys()].filter(id => bOpponents.has(id))

        return commonIds.map(id => {
            const aRes = aOpponents.get(id)!
            const bRes = bOpponents.get(id)!
            const aLast = aRes[aRes.length - 1]
            const bLast = bRes[bRes.length - 1]

            const aWins = aRes.filter(r => r.result === 'win').length
            const aDraws = aRes.filter(r => r.result === 'draw').length
            const aLosses = aRes.filter(r => r.result === 'loss').length
            const bWins = bRes.filter(r => r.result === 'win').length
            const bDraws = bRes.filter(r => r.result === 'draw').length
            const bLosses = bRes.filter(r => r.result === 'loss').length

            return { opponentId: id, aLast, bLast, aWins, aDraws, aLosses, bWins, bDraws, bLosses }
        })
    }, [teamAId, teamBId, matches])

    const aOverall = useMemo(() => {
        let w = 0, d = 0, l = 0
        for (const c of common) { w += c.aWins; d += c.aDraws; l += c.aLosses }
        return { w, d, l }
    }, [common])

    const bOverall = useMemo(() => {
        let w = 0, d = 0, l = 0
        for (const c of common) { w += c.bWins; d += c.bDraws; l += c.bLosses }
        return { w, d, l }
    }, [common])

    const rc: Record<string, { c: string; bg: string; l: string }> = {
        win: { c: 'text-semantic-green', bg: 'bg-semantic-green/15', l: 'V' },
        draw: { c: 'text-accent', bg: 'bg-accent/15', l: 'T' },
        loss: { c: 'text-semantic-red', bg: 'bg-semantic-red/15', l: 'H' },
    }

    if (common.length === 0) return null

    return (
        <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest">
                Yhteiset vastustajat ({common.length})
            </h4>

            <div className="space-y-2">
                {common.map(c => {
                    const oppMatch = matches.find(m =>
                        (m.team_A_id === c.opponentId || m.team_B_id === c.opponentId) &&
                        m.status === 'Played'
                    )
                    const oppName = oppMatch
                        ? (oppMatch.team_A_id === c.opponentId ? oppMatch.team_A_name : oppMatch.team_B_name)
                        : c.opponentId
                    return (
                        <div key={c.opponentId} className="text-xs">
                            <p className="text-text-primary font-medium mb-1 truncate">{oppName}</p>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                    <span className="text-text-muted">{teamAName}:</span>
                                    <span className={cn('font-bold', rc[c.aLast.result].c)}>{rc[c.aLast.result].l}</span>
                                    <span className="text-text-muted">({c.aWins}V/{c.aDraws}T/{c.aLosses}H)</span>
                                </div>
                                <span className="text-text-muted">|</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-text-muted">{teamBName}:</span>
                                    <span className={cn('font-bold', rc[c.bLast.result].c)}>{rc[c.bLast.result].l}</span>
                                    <span className="text-text-muted">({c.bWins}V/{c.bDraws}T/{c.bLosses}H)</span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="pt-2 border-t border-border-hairline">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-text-primary font-medium">Yhteensä yhteisiä vastustajia vastaan</span>
                    <div className="flex items-center gap-4">
                        <span className="text-text-muted">{teamAName}: <span className="text-semantic-green">{aOverall.w}V</span> <span className="text-accent">{aOverall.d}T</span> <span className="text-semantic-red">{aOverall.l}H</span></span>
                        <span className="text-text-muted">{teamBName}: <span className="text-semantic-green">{bOverall.w}V</span> <span className="text-accent">{bOverall.d}T</span> <span className="text-semantic-red">{bOverall.l}H</span></span>
                    </div>
                </div>
            </div>
        </div>
    )
}