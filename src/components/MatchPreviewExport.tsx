import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { buildMatchPreviewMd } from '../utils/buildMatchPreviewMd'
import { useSeasonGoalTimeline } from '../hooks/useSeasonGoalTimeline'
import type { MatchDetails, GroupDetails, PlayerStats } from '../types'
import type { PlayerEligibilityResult, SquadEligibilityResult } from '../domain/eligibility'

export function MatchPreviewExport({
    match, group, teamAPlayers, teamBPlayers, byTeam, byPlayer,
}: {
    match: MatchDetails
    group: GroupDetails | null
    teamAPlayers: PlayerStats[]
    teamBPlayers: PlayerStats[]
    byTeam?: Record<string, SquadEligibilityResult>
    byPlayer?: Record<string, PlayerEligibilityResult>
    statsReady?: boolean
}) {
    const [requested, setRequested] = useState(false)
    const a = useSeasonGoalTimeline(match.team_A_id, group?.matches, requested)
    const b = useSeasonGoalTimeline(match.team_B_id, group?.matches, requested)
    const [copied, setCopied] = useState(false)
    const busy = requested && (a.loading || b.loading)
    const ready = requested && !busy

    const md = useMemo(() => {
        if (!ready) return ''
        return buildMatchPreviewMd({
            match, group, teamAPlayers, teamBPlayers, byTeam, byPlayer,
            goalsA: a.moments, goalsB: b.moments,
            lineupsA: a.lineups, lineupsB: b.lineups,
        })
    }, [ready, match, group, teamAPlayers, teamBPlayers, byTeam, byPlayer, a.moments, b.moments, a.lineups, b.lineups])

    const download = () => {
        if (!ready || !md) return
        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const el = document.createElement('a')
        el.href = url
        el.download = `${match.date}_${match.team_A_name}_vs_${match.team_B_name}.md`.replace(/\s+/g, '_')
        el.click()
        URL.revokeObjectURL(url)
    }

    const copy = async () => {
        if (!ready || !md) return
        await navigator.clipboard.writeText(md)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }

    const shareWhatsApp = () => {
        const text = `⚽ OTTELUENNAKKO: ${match.team_A_name} vs ${match.team_B_name}\n` +
            `📅 ${match.date} klo ${match.time || '18:00'} | 📍 ${match.venue_name || 'Kenttä'}\n` +
            `🏆 ${group?.group_name || match.category_name || 'Sarjaottelu'}\n` +
            `🔗 Katso tilastot: ${window.location.href}`
        if (typeof navigator !== 'undefined' && navigator.share) {
            navigator.share({ title: `Ottelu: ${match.team_A_name} vs ${match.team_B_name}`, text }).catch(() => {})
        } else {
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
        }
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            <button
                type="button"
                onClick={shareWhatsApp}
                className="text-xs font-bold px-3 py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/30 transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
                <span>💬</span>
                <span>Jaa WhatsAppiin</span>
            </button>
            {!requested && (
                <button
                    type="button"
                    onClick={() => setRequested(true)}
                    className="text-xs font-semibold px-3 py-2 rounded-lg bg-surface-2 border border-border-hairline text-text-primary hover:bg-surface-3 transition-all cursor-pointer"
                >
                    Luo markdown
                </button>
            )}
            {requested && (
                <>
                    <button type="button" disabled={!ready} onClick={copy} className="text-xs font-semibold px-3 py-2 rounded-lg bg-surface-2 border border-border-hairline text-text-primary disabled:opacity-50 hover:bg-surface-3 transition-all cursor-pointer">
                        {copied ? 'Kopioitu' : busy ? 'Haetaan maaliaikoja ja kokoonpanoja…' : 'Kopioi markdown'}
                    </button>
                    <button type="button" disabled={!ready} onClick={download} className="text-xs font-semibold px-3 py-2 rounded-lg bg-accent text-text-inverse inline-flex items-center gap-1 disabled:opacity-50 hover:brightness-110 transition-all cursor-pointer">
                        <Download className="w-3.5 h-3.5" /> Lataa .md
                    </button>
                </>
            )}
        </div>
    )
}
