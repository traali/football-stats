import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { buildMatchPreviewMd } from '../utils/buildMatchPreviewMd'
import { useSeasonGoalTimeline } from '../hooks/useSeasonGoalTimeline'
import type { MatchDetails, GroupDetails, PlayerStats } from '../types'
import type { PlayerEligibilityResult, TeamEligibilityResult } from '../domain/eligibility'

export function MatchPreviewExport({
    match, group, teamAPlayers, teamBPlayers, byTeam, byPlayer,
}: {
    match: MatchDetails
    group: GroupDetails | null
    teamAPlayers: PlayerStats[]
    teamBPlayers: PlayerStats[]
    byTeam?: Record<string, TeamEligibilityResult>
    byPlayer?: Record<string, PlayerEligibilityResult>
}) {
    const a = useSeasonGoalTimeline(match.team_A_id, group?.matches)
    const b = useSeasonGoalTimeline(match.team_B_id, group?.matches)
    const [copied, setCopied] = useState(false)

    const md = useMemo(() => buildMatchPreviewMd({
        match, group, teamAPlayers, teamBPlayers, byTeam, byPlayer,
        goalsA: a.moments, goalsB: b.moments,
    }), [match, group, teamAPlayers, teamBPlayers, byTeam, byPlayer, a.moments, b.moments])

    const download = () => {
        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const el = document.createElement('a')
        el.href = url
        el.download = `${match.date}_${match.team_A_name}_vs_${match.team_B_name}.md`.replace(/\s+/g, '_')
        el.click()
        URL.revokeObjectURL(url)
    }

    const copy = async () => {
        await navigator.clipboard.writeText(md)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }

    return (
        <div className="flex items-center gap-2">
            <button type="button" onClick={copy} className="text-xs font-semibold px-3 py-2 rounded-lg bg-surface-2 border border-border-hairline text-text-primary">
                {copied ? 'Kopioitu' : a.loading || b.loading ? 'Kerätään maaliaikoja…' : 'Kopioi markdown'}
            </button>
            <button type="button" onClick={download} className="text-xs font-semibold px-3 py-2 rounded-lg bg-accent text-text-inverse inline-flex items-center gap-1">
                <Download className="w-3.5 h-3.5" /> Lataa .md
            </button>
        </div>
    )
}
