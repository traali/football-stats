export function resolveCrest(team: { img_url?: string; club_crest?: string; crest?: string }): string | undefined {
    return team.img_url || team.club_crest || team.crest
}

export function resolveCrestFromBasic(team: { img_url?: string; club_crest?: string }): string | undefined {
    return team.img_url || team.club_crest
}