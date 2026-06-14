import { useNavigate } from 'react-router-dom'
import { cn } from '../utils/cn'
import { formatDate } from '../utils/dates'
import { WLD_CONFIG } from '../utils/wld'

interface MatchRowBase {
    matchId: string
    date: string
    className?: string
}

export function MatchRowPast({ matchId, date, teamName, opponentName, myScore, oppScore, resultIndicator, className }: MatchRowBase & {
    teamName: string
    opponentName: string
    myScore?: string | null
    oppScore?: string | null
    resultIndicator?: 'V' | 'H' | 'T'
    className?: string
}) {
    const navigate = useNavigate()
    const wldConfig = resultIndicator ? WLD_CONFIG[resultIndicator] : null

    return (
        <div
            onClick={() => navigate(`/match/${matchId}`)}
            className={cn(
                'flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-surface-2 border border-transparent hover:border-border-hairline cursor-pointer transition-all active:scale-[0.99] text-sm min-h-[44px]',
                className,
            )}
        >
            <span className="text-text-muted w-12 shrink-0 text-xs">{formatDate(date, 'short')}</span>
            <span className="text-text-primary truncate flex-1 text-right pr-2">{opponentName}</span>
            <span className="font-mono font-bold mx-2 shrink-0 flex items-center gap-1.5">
                <span className="text-text-primary">
                    {myScore !== undefined && oppScore !== undefined ? `${myScore}–${oppScore}` : '–'}
                </span>
                {wldConfig && (
                    <span className={cn(
                        'text-[10px] font-bold px-1 py-0.5 rounded leading-none',
                        wldConfig.bg + ' ' + wldConfig.color + ' border border-' + wldConfig.dot.replace('bg-', '') + '/20'
                    )}>
                        {resultIndicator}
                    </span>
                )}
            </span>
        </div>
    )
}

export function MatchRowSymmetric({ matchId, date, teamAName, teamBName, scoreA, scoreB, winnerId, className }: MatchRowBase & {
    teamAName: string
    teamBName: string
    scoreA?: string | null
    scoreB?: string | null
    winnerId?: string | null
    className?: string
}) {
    const navigate = useNavigate()

    const wld = winnerId && winnerId !== '0' && winnerId !== '-'
        ? (winnerId === 'draw' ? 'T' as const : null)
        : (scoreA && scoreB ? 'T' as const : null)
    const wldColor = wld ? (WLD_CONFIG[wld]?.color || 'text-accent') : null

    return (
        <div
            onClick={() => navigate(`/match/${matchId}`)}
            className={cn(
                'flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-surface-2 border border-transparent hover:border-border-hairline cursor-pointer transition-all active:scale-[0.99] text-sm min-h-[44px]',
                className,
            )}
        >
            <span className="text-text-muted text-xs w-12 shrink-0">{formatDate(date, 'short')}</span>
            <span className="text-text-primary truncate text-right min-w-0 flex-1">{teamAName}</span>
            <span className="font-mono font-bold text-text-primary mx-2 shrink-0 flex items-center gap-1">
                {scoreA !== undefined && scoreB !== undefined ? `${scoreA}–${scoreB}` : '–'}
                {wld && wldColor && <span className={cn('text-xs font-bold', wldColor)}>{wld}</span>}
            </span>
            <span className="text-text-primary truncate min-w-0 flex-1">{teamBName}</span>
        </div>
    )
}

export function MatchRowFixture({ matchId, date, teamAName, teamBName, className }: MatchRowBase & {
    teamAName: string
    teamBName: string
    className?: string
}) {
    const navigate = useNavigate()

    return (
        <div
            onClick={() => navigate(`/match/${matchId}`)}
            className={cn(
                'flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-surface-2 border border-transparent hover:border-border-hairline cursor-pointer transition-all active:scale-[0.99] text-sm min-h-[44px]',
                className,
            )}
        >
            <span className="text-text-muted w-12 shrink-0 text-xs">{formatDate(date, 'short')}</span>
            <span className="text-text-primary truncate text-right flex-1 pr-2">{teamAName}</span>
            <span className="text-text-muted mx-2 shrink-0 font-mono text-xs">vs</span>
            <span className="text-text-primary truncate flex-1 pl-2">{teamBName}</span>
        </div>
    )
}
