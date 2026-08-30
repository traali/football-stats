import { ParsedTournamentUrl } from '../utils/tournamentUrl'

export interface TournamentMatch {
    matchNumber: string
    matchId: string
    date: string
    time: string
    pitch: string
    homeTeam: string
    awayTeam: string
    score: string
    status: 'fixture' | 'played'
}

export interface TournamentStandingRow {
    rank: number
    teamName: string
    crestUrl?: string
    played: number
    wins: number
    draws: number
    losses: number
    goals: string
    points: number
    teamId?: string
}

export interface TournamentData {
    tournamentTitle: string
    categoryName: string
    groupName: string
    teamName: string
    matches: TournamentMatch[]
    standings: TournamentStandingRow[]
    host: string
    turnaus: string
    sarja: string
    teamId: string
}

function parseWidgetScript(js: string): string {
    const match = js.match(/document\.write\("([\s\S]*)"\);?/)
    if (!match) return js
    return match[1]
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\\//g, '/')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
}

export async function fetchTournamentWidgetHtml(url: string): Promise<string> {
    try {
        const proxyUrl = `https://taso-proxy.sakkoja.workers.dev/tournamentWidget?${url.replace(/^https?:\/\/[^/]+\/taso\/widget\.php\?/, '')}&host=${new URL(url).hostname}`
        const res = await fetch(proxyUrl)
        if (res.ok) {
            const txt = await res.text()
            if (txt.includes('table')) return txt
        }
    } catch {
        // fallback
    }

    return new Promise<string>((resolve, reject) => {
        const iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin')
        const timer = setTimeout(() => {
            iframe.remove()
            reject(new Error('Turnausdatan lataus aikakatkaistiin'))
        }, 10000)

        iframe.onload = () => {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow?.document
                if (doc && (doc.querySelector('table') || doc.body.innerHTML)) {
                    clearTimeout(timer)
                    const content = doc.body.innerHTML
                    iframe.remove()
                    resolve(content)
                    return
                }
            } catch {
                // fall through
            }
        }

        iframe.srcdoc = `<!DOCTYPE html><html><body><script src="${url}"><\/script></body></html>`
        document.body.appendChild(iframe)
    })
}

export async function loadTournamentData(parsed: ParsedTournamentUrl): Promise<TournamentData> {
    const { host, turnaus, sarja, teamId } = parsed

    const scheduleUrl = `https://${host}/taso/widget.php?teamid=${teamId}&widget=schedule`
    const scoretableUrl = `https://${host}/taso/widget.php?competition=${turnaus}&class=${sarja}&widget=scoretable`

    const [scheduleRaw, scoretableRaw] = await Promise.all([
        fetchTournamentWidgetHtml(scheduleUrl).catch(() => ''),
        fetchTournamentWidgetHtml(scoretableUrl).catch(() => ''),
    ])

    const scheduleHtml = parseWidgetScript(scheduleRaw)
    const scoretableHtml = parseWidgetScript(scoretableRaw)

    const parser = new DOMParser()
    const sDoc = parser.parseFromString(scheduleHtml, 'text/html')
    const tDoc = parser.parseFromString(scoretableHtml, 'text/html')

    const teamName = sDoc.querySelector('.competitionname')?.textContent?.trim() || ''
    const tournamentTitle = tDoc.querySelector('.competitionname')?.textContent?.trim() || 'Turnaus'
    const categoryName = tDoc.querySelector('.groupname')?.textContent?.trim() || sarja
    const groupNameCaption = tDoc.querySelector('caption')?.textContent || ''
    const groupMatch = groupMatchCaption(groupNameCaption)

    const matches: TournamentMatch[] = []
    const matchRows = sDoc.querySelectorAll('tr[class*="matchid_"], tr.fixture, tr.played')
    matchRows.forEach(tr => {
        const matchNum = tr.querySelector('.match')?.textContent?.trim() || ''
        const date = tr.querySelector('.date')?.textContent?.trim() || ''
        const time = tr.querySelector('.time')?.textContent?.trim() || ''
        const pitch = tr.querySelector('.pitch')?.textContent?.trim() || ''
        const homeTeam = tr.querySelector('.home')?.textContent?.trim() || ''
        const awayTeam = tr.querySelector('.away')?.textContent?.trim() || ''
        const score = tr.querySelector('.score')?.textContent?.trim() || '–'

        let matchId = ''
        const classNames = tr.className || ''
        const mIdMatch = classNames.match(/matchid_(\d+)/)
        if (mIdMatch) matchId = mIdMatch[1]

        const isPlayed = score !== '–' && /\d/.test(score)

        if (homeTeam && awayTeam) {
            matches.push({
                matchNumber: matchNum,
                matchId,
                date,
                time,
                pitch,
                homeTeam,
                awayTeam,
                score,
                status: isPlayed ? 'played' : 'fixture',
            })
        }
    })

    const standings: TournamentStandingRow[] = []
    const tableRows = tDoc.querySelectorAll('table.scoretable tbody tr, table.scoretable tr[class*="scoredivider"]')
    let rankIdx = 1
    tableRows.forEach(tr => {
        const teamCell = tr.querySelector('td.team')
        if (!teamCell) return

        const rowTeamName = teamCell.textContent?.replace(/\s+/g, ' ').trim() || ''
        const crestImg = tr.querySelector('td.crest img')?.getAttribute('src') || ''
        const played = parseInt(tr.querySelector('td.played')?.textContent?.trim() || '0', 10) || 0
        const wins = parseInt(tr.querySelector('td.wins')?.textContent?.trim() || '0', 10) || 0
        const draws = parseInt(tr.querySelector('td.draws')?.textContent?.trim() || '0', 10) || 0
        const losses = parseInt(tr.querySelector('td.losses')?.textContent?.trim() || '0', 10) || 0
        const goals = tr.querySelector('td.goals')?.textContent?.trim() || '0-0'
        const points = parseInt(tr.querySelector('td.points')?.textContent?.trim() || '0', 10) || 0

        standings.push({
            rank: rankIdx++,
            teamName: rowTeamName,
            crestUrl: crestImg,
            played,
            wins,
            draws,
            losses,
            goals,
            points,
        })
    })

    return {
        tournamentTitle,
        categoryName,
        groupName: groupMatch,
        teamName,
        matches,
        standings,
        host,
        turnaus,
        sarja,
        teamId,
    }
}

function groupMatchCaption(caption: string): string {
    const slashIdx = caption.indexOf('/')
    if (slashIdx !== -1) {
        return caption.slice(slashIdx + 1).trim()
    }
    return ''
}
