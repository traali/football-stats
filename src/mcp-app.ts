/**
 * Football WebMCP tools for native Chrome and ChatGPT Desktop/Sites.
 * Registers on document.modelContext.registerTool — never overwrites the host getter.
 */

import { buildMatchStatsContract } from './types/contracts'
import type { SportStatsContract } from './types/contracts'
import { getMatchDetails, getTeamProfile } from './services/api'
import {
  connectModelContext,
  detectWebMcpConsumer,
  publishWebMcpStatus,
  type ModelContextTool,
} from './webmcp'

export interface McpToolResponse {
  content: Array<{
    type: 'text' | 'resource'
    text?: string
    resource?: {
      uri: string
      mimeType: string
      text?: string
    }
  }>
  _meta?: {
    ui?: {
      resourceUri: string
    }
  }
}

export async function getH2HCardTool(args: {
  homeTeam: string
  awayTeam: string
  leagueName?: string
}): Promise<McpToolResponse> {
  const homeTeam = String(args.homeTeam || '').trim()
  const awayTeam = String(args.awayTeam || '').trim()
  if (!homeTeam || !awayTeam) {
    return {
      content: [{ type: 'text', text: 'homeTeam and awayTeam are required. Dummy H2H is not allowed.' }],
    }
  }

  const stats: SportStatsContract = buildMatchStatsContract({
    homeTeam,
    awayTeam,
    leagueName: args.leagueName || 'Sarjaottelu',
  })

  const summary = `Head-to-head ${homeTeam} vs ${awayTeam}: form home [${(stats.recentFormStrings?.home || []).join(
    '-',
  )}], away [${(stats.recentFormStrings?.away || []).join('-')}]. Meetings: ${stats.headToHeadSummary.matchesPlayed}.`

  return {
    content: [{ type: 'text', text: summary }],
    _meta: {
      ui: {
        resourceUri: `ui://football/h2h-card?home=${encodeURIComponent(homeTeam)}&away=${encodeURIComponent(
          awayTeam,
        )}&league=${encodeURIComponent(args.leagueName || 'Sarjaottelu')}`,
      },
    },
  }
}

function textResult(text: string, extra?: Record<string, unknown>) {
  return { content: [{ type: 'text' as const, text }], summary: text, ...extra }
}

async function getFootballMatchTool(args: Record<string, unknown>) {
  const matchId = String(args.matchId || '').trim()
  if (!matchId) return textResult('matchId is required. Do not invent a Palloliitto match.')
  try {
    const match = await getMatchDetails(matchId)
    const summary = `${match.team_A_name} ${match.fs_A ?? '–'}–${match.fs_B ?? '–'} ${match.team_B_name} (${match.category_name}). ${match.date} ${match.time || ''}`
    return {
      content: [{ type: 'text' as const, text: summary }],
      summary,
      match: {
        matchId: match.match_id,
        homeTeamName: match.team_A_name,
        awayTeamName: match.team_B_name,
        scoreHome: match.fs_A,
        scoreAway: match.fs_B,
        date: match.date,
        time: match.time,
        venue: match.venue_city_name,
        status: match.status,
      },
    }
  } catch (err) {
    return textResult(err instanceof Error ? err.message : `Match ${matchId} was not found.`)
  }
}

async function getFootballTeamTool(args: Record<string, unknown>) {
  const teamId = String(args.teamId || '').trim()
  if (!teamId) return textResult('teamId is required.')
  const team = await getTeamProfile(teamId)
  if (!team) return textResult(`Team ${teamId} was not found.`)
  const summary = `${team.team_name || teamId} · ${team.club_name || ''} · ${(team.players || []).length} players.`
  return {
    content: [{ type: 'text' as const, text: summary }],
    summary,
    team: {
      teamId: team.team_id || teamId,
      teamName: team.team_name,
      clubName: team.club_name,
      category: team.primary_category,
    },
  }
}

async function openFootballResourceTool(args: Record<string, unknown>) {
  const kind = String(args.kind || '').trim()
  const id = String(args.id || '').trim()
  const allowed = new Set(['match', 'team', 'player', 'favorites', 'home', 'turnaukset'])
  if (!allowed.has(kind)) return textResult('kind must be match, team, player, favorites, home, or turnaukset.')
  if (typeof window === 'undefined') return textResult('No window to navigate.')
  const path =
    kind === 'home'
      ? '#/'
      : kind === 'favorites'
        ? '#/favorites'
        : kind === 'turnaukset'
          ? `#/turnaukset/${encodeURIComponent(id)}`
          : `#/${kind}/${encodeURIComponent(id)}`
  if ((kind === 'match' || kind === 'team' || kind === 'player') && !id) return textResult(`${kind} needs id.`)
  window.location.hash = path
  return { content: [{ type: 'text' as const, text: `Opened ${path}` }], summary: `Opened ${path}`, path }
}

const TOOLS: ModelContextTool[] = [
  {
    name: 'get_h2h_card',
    title: 'Football H2H',
    description:
      'Head-to-head card for two Finnish football teams. Requires homeTeam and awayTeam. Do not invent club names.',
    inputSchema: {
      type: 'object',
      properties: {
        homeTeam: { type: 'string', description: 'Home team name' },
        awayTeam: { type: 'string', description: 'Away team name' },
        leagueName: { type: 'string', description: 'Optional competition name' },
      },
      required: ['homeTeam', 'awayTeam'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    execute: async (args) => getH2HCardTool(args as { homeTeam: string; awayTeam: string; leagueName?: string }),
  },
  {
    name: 'get_tournament_standings',
    title: 'Football tournament standings',
    description:
      'Finnish junior tournament standings. Requires a live turnaus id from TASO. Dummy Vierumäki tables are forbidden.',
    inputSchema: {
      type: 'object',
      properties: {
        turnaus: { type: 'string', description: 'Tournament identifier' },
        sarja: { type: 'string', description: 'Category code, e.g. P13H' },
      },
      required: ['turnaus'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    execute: async ({ turnaus, sarja }) => {
      const id = String(turnaus || '').trim()
      if (!id) {
        return {
          content: [{ type: 'text' as const, text: 'turnaus is required. Dummy standings are not allowed.' }],
        }
      }
      const summary = `Open /turnaukset/${id}/${String(sarja || '')} in the app for the live TASO table. No dummy rows.`
      return { content: [{ type: 'text' as const, text: summary }], turnaus: id, sarja: sarja || null }
    },
  },
  {
    name: 'get_football_match',
    title: 'Football match',
    description: 'Fetch a Palloliitto / TASO match by matchId. Do not invent ids.',
    inputSchema: {
      type: 'object',
      properties: { matchId: { type: 'string', description: 'TASO match id' } },
      required: ['matchId'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    execute: getFootballMatchTool,
  },
  {
    name: 'get_football_team',
    title: 'Football team',
    description: 'Fetch a Palloliitto team profile by teamId.',
    inputSchema: {
      type: 'object',
      properties: { teamId: { type: 'string', description: 'TASO team id' } },
      required: ['teamId'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    execute: getFootballTeamTool,
  },
  {
    name: 'open_football_resource',
    title: 'Open in app',
    description: 'Navigate this page to a match, team, player, tournament, favorites, or home.',
    inputSchema: {
      type: 'object',
      properties: {
        kind: { type: 'string', description: 'match | team | player | turnaukset | favorites | home' },
        id: { type: 'string', description: 'Resource id' },
      },
      required: ['kind'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, consequentialHint: true },
    execute: openFootballResourceTool,
  },
]

let session: AbortController | null = null

export async function registerFootballWebMCP() {
  if (typeof window === 'undefined') return undefined
  session?.abort()
  session = new AbortController()
  const { mode, mc } = connectModelContext()
  const consumer = detectWebMcpConsumer()
  const registered: string[] = []
  let error: string | undefined

  for (const tool of TOOLS) {
    try {
      await mc.registerTool(tool, { signal: session.signal })
      registered.push(tool.name)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (/already registered/i.test(message) || /InvalidStateError/i.test(message)) {
        registered.push(tool.name)
      } else {
        error = `${tool.name}: ${message}`
        console.warn('[WebMCP] registerTool failed', tool.name, message)
      }
    }
  }

  publishWebMcpStatus({ mode, consumer, tools: registered, error })
  return { mode, mc, tools: registered }
}
