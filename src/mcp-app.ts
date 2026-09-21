/**
 * Football WebMCP tools for native Chrome and ChatGPT Desktop/Sites.
 * Registers on document.modelContext.registerTool — never overwrites the host getter.
 */

import { buildMatchStatsContract } from './types/contracts'
import type { SportStatsContract } from './types/contracts'
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
