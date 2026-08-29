import type { MatchDetails, GroupDetails, PlayerStats, StandingTeam } from '../types'
import type { PlayerEligibilityResult, SquadEligibilityResult } from '../domain/eligibility'
import type { GoalMoment, PlayedLineup } from '../hooks/useSeasonGoalTimeline'

function pos(teams: StandingTeam[] | undefined, id: string): string {
    const t = teams?.find(x => x.team_id === id)
    return t ? `#${t.current_standing} (${t.points} p, ${t.matches_played} ott)` : ''
}

function goalsBlock(title: string, moments: GoalMoment[]): string {
    const scored = moments.filter(m => m.scored)
    const conceded = moments.filter(m => !m.scored)
    const byMatch = (list: GoalMoment[]) => {
        const map = new Map<string, GoalMoment[]>()
        for (const m of list) {
            const k = `${m.date} vs ${m.opponent}`
            map.set(k, [...(map.get(k) || []), m])
        }
        if (!map.size) return '_ei kirjattuja_'
        return [...map.entries()].map(([k, items]) => {
            const bits = items.map(i => `${i.minute}'${i.scorer ? ` ${i.scorer}` : ''}${i.score ? ` (${i.score})` : ''}`).join(', ')
            return `- ${k}: ${bits}`
        }).join('\n')
    }
    return [
        `### ${title} — tehnyt`,
        byMatch(scored),
        '',
        `### ${title} — päästänyt`,
        byMatch(conceded),
    ].join('\n')
}

function lineupBlock(title: string, rows: PlayedLineup[]): string {
    if (!rows.length) return `### ${title} — pelatut kokoonpanot\n_ei dataa_`
    const lines = rows.map(r => {
        const tag = r.won === true ? 'VOITTO' : r.won === false ? 'TAPPIO' : ''
        return `- ${r.date} vs ${r.opponent} ${r.score} ${tag} (${r.names.length} pelaajaa): ${r.names.join(', ') || 'ei nimiä'}`
    })
    return [`### ${title} — pelatut kokoonpanot`, ...lines].join('\n')
}

function playerLines(players: PlayerStats[], elig?: Record<string, PlayerEligibilityResult>): string {
    if (!players.length) return '_ei kokoonpanoa_'
    return players.map(p => {
        const series = (p.seriesThisYear || []).map(r => {
            const gd = r.gf != null && r.ga != null ? `${r.gf}–${r.ga}` : ''
            return `  - ${r.category}${r.half ? ` · ${r.half}` : ''}${r.teamName ? ` · ${r.teamName}` : ''}: ${r.matches} ott, ${r.goals} m, ${r.warnings} var, ${r.wins ?? 0}V ${r.draws ?? 0}T ${r.losses ?? 0}H ${gd}`
        }).join('\n')
        const badge = elig && p.playerId ? elig[p.playerId] : undefined
        const extra = badge?.lastOfficialHigher ? ` · edellinen ylempänä ${badge.lastOfficialHigher.level} ${badge.lastOfficialHigher.date}` : ''
        return `- **${p.name}** ${p.shirtNumber !== 'N/A' ? `#${p.shirtNumber}` : ''} · ${p.gamesPlayedThisYear} ott · ${p.goalsThisYear} m · ${p.warningsThisYear} var${extra}\n${series}`
    }).join('\n')
}

function analysisPrompt(m: MatchDetails): string {
    return [
        '## Prompt tekoälylle',
        '',
        'Kopioi tämä osio + yllä oleva data malliin. Vastaa suomeksi, valmentajalle, juniori P13.',
        '',
        '```',
        `Olet juniorijalkapallon otteluanalyytikko. Käytä VAIN tämän dokumentin lukuja. Älä keksitytä pelaajia, minuutteja tai sijoituksia. Jos tieto puuttuu, sano "ei datassa".`,
        '',
        `Ottelu: ${m.team_A_name} vs ${m.team_B_name}, ${m.date}${m.time ? ` ${m.time}` : ''}.`,
        '',
        'Tee tämä rakenne:',
        '1. Lyhyt ennakko (5–8 riviä): tasoero, viimeiset tulokset, mitä taulukko kertoo.',
        '2. Avainpelaajat molemmille: maalintekijät, paljon pelanneet, pelaajat jotka ovat juuri pelanneet ylempänä. Perustele luvuilla.',
        '3. Maaliaikojen kuvio: milloin joukkueet tekevät ja päästävät (alku / loppu, kasaumat). Listaa 2–3 riskiminuuttia.',
        '4. Pelioikeus ja rotaatio: ylhäältä tulleet, kiintiö, ketä kannattaa seurata jos kokoonpano elää.',
        '5. Kokoonpanovertailu: ketkä olivat mukana voitoissa vs isoissa tappioissa, keitä puuttui (lkm + nimet).',
        '6. Ennuste: todennäköisin tuloshaarukka. 3 skenaariota: koti, tasapeli, vieras.',
        '7. Valmentajan 4 tekoa: lämmittely, avausvartti, vaihdot, jos peli aukeaa.',
        '',
        'Sävy: asiallinen, ei hypeä, ei loukkaavaa. Juniorit.',
        '```',
    ].join('\n')
}

export function buildMatchPreviewMd(opts: {
    match: MatchDetails
    group: GroupDetails | null
    teamAPlayers: PlayerStats[]
    teamBPlayers: PlayerStats[]
    byTeam?: Record<string, SquadEligibilityResult>
    byPlayer?: Record<string, PlayerEligibilityResult>
    goalsA: GoalMoment[]
    goalsB: GoalMoment[]
    lineupsA?: PlayedLineup[]
    lineupsB?: PlayedLineup[]
}): string {
    const m = opts.match
    const g = opts.group
    const standings = (g?.teams || []).slice().sort((a, b) => Number(a.current_standing) - Number(b.current_standing))
    const table = standings.map(t =>
        `${t.current_standing}. ${t.team_name}  ${t.matches_played}ott ${t.matches_won}V ${t.matches_tied}T ${t.matches_lost}H  ${t.goals_for}–${t.goals_against}  ${t.points}p`,
    ).join('\n')

    const quota = (id: string, name: string) => {
        const q = opts.byTeam?.[id]
        if (!q) return ''
        return `${name}: ylhäältä ${q.downQuotaUsed}/${q.downQuotaMax}${q.exceptionUsed ? `, poikkeus ${q.exceptionUsed}` : ''}`
    }

    return [
        `# ${m.team_A_name} vs ${m.team_B_name}`,
        '',
        `${m.date}${m.time ? ` ${m.time}` : ''} · ${m.venue_name || ''}${m.venue_city_name ? `, ${m.venue_city_name}` : ''}`,
        `${m.competition_name} · ${m.category_name}${g?.group_name ? ` · ${g.group_name}` : ''}`,
        m.playing_time ? `Peliaika: ${m.playing_time} min` : '',
        '',
        `Sijoitus: ${m.team_A_name} ${pos(g?.teams, m.team_A_id)} · ${m.team_B_name} ${pos(g?.teams, m.team_B_id)}`,
        quota(m.team_A_id, m.team_A_name),
        quota(m.team_B_id, m.team_B_name),
        '',
        '## Sarjataulukko',
        '```',
        table || 'ei taulukkoa',
        '```',
        '',
        `## ${m.team_A_name}`,
        playerLines(opts.teamAPlayers, opts.byPlayer),
        '',
        `## ${m.team_B_name}`,
        playerLines(opts.teamBPlayers, opts.byPlayer),
        '',
        '## Pelatut kokoonpanot',
        lineupBlock(m.team_A_name, opts.lineupsA || []),
        '',
        lineupBlock(m.team_B_name, opts.lineupsB || []),
        '',
        '## Maaliajat tällä kaudella',
        goalsBlock(m.team_A_name, opts.goalsA),
        '',
        goalsBlock(m.team_B_name, opts.goalsB),
        '',
        analysisPrompt(m),
        '',
        `_Luotu football-stats, ottelu ${m.match_id}_`,
    ].filter(line => line !== '').join('\n')
}
