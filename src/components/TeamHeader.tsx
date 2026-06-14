import { Shield, Heart, CalendarDays } from 'lucide-react'
import { cn } from '../utils/cn'
import type { TeamResponse } from '../types'
import { APP_CONFIG } from '../config'
interface CategoryLike {
    category_name?: string | { fi?: string }
    category_name_translations?: { fi?: string }
    competition_season?: string | number
    competition_id?: string | number
}

export function TeamHeader({ team, teamId, last5Form, fav, onToggleFav }: {
    team: TeamResponse | null
    teamId: string
    last5Form: ('V' | 'H' | 'T')[]
    fav: boolean
    onToggleFav: () => void
}) {
    const getCategoryName = (c: CategoryLike): string | null => {
        if (!c) return null
        const name = c.category_name
        if (typeof name === 'string') return name
        if (name && typeof name === 'object' && typeof name.fi === 'string') return name.fi
        if (c.category_name_translations && typeof c.category_name_translations.fi === 'string') return c.category_name_translations.fi
        return null
    }

    const categoryNames = new Set<string>()
    if (team?.categories) {
        (team.categories as CategoryLike[]).forEach(c => {
            if (!c) return
            const season = c.competition_season ? String(c.competition_season) : ''
            const compId = c.competition_id ? String(c.competition_id) : ''
            const isCurrent = season === APP_CONFIG.CURRENT_YEAR ||
                (compId && compId.includes(APP_CONFIG.CURRENT_YEAR)) ||
                (compId && compId.includes(APP_CONFIG.CURRENT_YEAR.slice(2)))
            if (isCurrent) {
                const name = getCategoryName(c)
                if (name) categoryNames.add(name)
            }
        })
    }
    const primaryCatNames = Array.from(categoryNames).slice(0, 3)

    return (
        <div className="bg-surface-1 border border-border-hairline rounded-2xl p-6 relative overflow-hidden space-y-6">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-bmw-cyan via-bmw-magenta to-bmw-amber" />

            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-3.5">
                        {team?.crest ? (
                            <div className="w-14 h-14 rounded-full bg-surface-2 border border-border-hairline p-1 flex items-center justify-center shrink-0">
                                <img src={team.crest} alt="" className="w-full h-full rounded-full object-contain" />
                            </div>
                        ) : (
                            <div className="w-14 h-14 rounded-full bg-surface-2 border border-border-hairline flex items-center justify-center shrink-0 text-text-muted">
                                <Shield className="w-8 h-8" />
                            </div>
                        )}
                        {team?.kit_1_front && (
                            <div className="w-14 h-14 rounded-xl bg-surface-2 border border-border-hairline p-1 flex items-center justify-center shrink-0">
                                <img src={team.kit_1_front} alt="Paita" className="w-full h-full object-contain rounded" />
                            </div>
                        )}
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-accent">Joukkueprofiili</span>
                            <h1 className="text-2xl font-bold text-text-primary truncate mt-0.5">{team?.team_name || teamId}</h1>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-secondary mt-1.5">
                                {team?.birthyear && (
                                    <span className="flex items-center gap-1 font-medium bg-surface-2 px-2 py-0.5 rounded-md">
                                        <CalendarDays className="w-3.5 h-3.5 text-accent" />
                                        {team.birthyear}
                                    </span>
                                )}
                                {primaryCatNames.map((name, idx) => (
                                    <span key={idx} className="text-xs bg-surface-3 border border-border-hairline px-2 py-0.5 rounded-md text-text-primary font-medium">
                                        {name}
                                    </span>
                                ))}
                                {team?.club_name && <span className="text-text-muted font-medium">{team.club_name}</span>}
                            </div>
                            {last5Form.length > 0 && (
                                <div className="flex items-center gap-1.5 mt-1.5">
                                    <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Kunto:</span>
                                    {last5Form.map((r, i) => (
                                        <span key={i} className={cn('w-2.5 h-2.5 rounded-full', r === 'V' ? 'bg-semantic-green' : r === 'H' ? 'bg-semantic-red' : 'bg-accent')} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <button
                    onClick={onToggleFav}
                    className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-surface-2 border border-border-hairline hover:border-accent/30 hover:bg-surface-3 transition-all cursor-pointer active:scale-95"
                    aria-label={fav ? 'Poista suosikeista' : 'Lisää suosikkeihin'}
                >
                    <Heart className={cn('w-5 h-5 transition-colors', fav ? 'fill-semantic-red text-semantic-red' : 'text-text-muted')} />
                </button>
            </div>
        </div>
    )
}
