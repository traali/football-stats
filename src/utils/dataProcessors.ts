export function getTeamCategory(team: { categories?: Array<{ competition_season?: string | number; competition_id?: string | number; category_name?: string } | null> } | null | undefined, currentYear: string): string | undefined {
    if (!team || !team.categories) return undefined
    const categoryNames = new Set<string>()
    for (const c of team.categories) {
        if (!c) continue
        const season = c.competition_season ? String(c.competition_season) : ''
        const compId = c.competition_id ? String(c.competition_id) : ''
        const isCurrent = season === currentYear ||
            (compId && compId.includes(currentYear)) ||
            (compId && compId.includes(currentYear.slice(2)))
        if (isCurrent) {
            const raw = c as Record<string, unknown>
            const name = raw.category_name
            let nameStr: string | null = null
            if (typeof name === 'string') nameStr = name
            else if (name && typeof name === 'object' && 'fi' in name && typeof (name as Record<string, unknown>).fi === 'string') nameStr = (name as Record<string, unknown>).fi as string
            else if (raw.category_name_translations && typeof raw.category_name_translations === 'object' && 'fi' in raw.category_name_translations && typeof (raw.category_name_translations as Record<string, unknown>).fi === 'string') nameStr = (raw.category_name_translations as Record<string, unknown>).fi as string
            if (nameStr) categoryNames.add(nameStr)
        }
    }
    return Array.from(categoryNames)[0]
}
