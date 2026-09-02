/**
 * Football Stats MCP App Tool Handler
 * Standard: @modelcontextprotocol/ext-apps (2026 UI Capabilities Standard)
 * Reference: https://modelcontextprotocol.info/blog/mcp-apps-ui-capabilities/
 *
 * Exposes interactive Head-to-Head and match stats tools with `_meta.ui.resourceUri`.
 */

import { buildMatchStatsContract } from './types/contracts'
import type { SportStatsContract } from '../../contracts'

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

/**
 * MCP App Tool: get_h2h_card
 * Returns structured SportStatsContract data and an interactive UI widget resource URI.
 */
export async function getH2HCardTool(args: {
    homeTeam: string
    awayTeam: string
    leagueName?: string
}): Promise<McpToolResponse> {
    const stats: SportStatsContract = buildMatchStatsContract({
        homeTeam: args.homeTeam || 'Kotijoukkue',
        awayTeam: args.awayTeam || 'Vierasjoukkue',
        leagueName: args.leagueName || 'Sarjaottelu',
    })

    const summary = `⚽ Keskinäiset tilastot (${args.homeTeam} vs ${args.awayTeam}): Kuntopuntari Kotijoukkue [${stats.recentForm.home.join(
        '-'
    )}], Vierasjoukkue [${stats.recentForm.away.join('-')}]. Keskinäiset kohtaamiset: ${
        stats.headToHeadSummary.matchesPlayed
    } ottelua.`

    return {
        content: [
            {
                type: 'text',
                text: summary,
            },
        ],
        _meta: {
            ui: {
                resourceUri: `ui://football/h2h-card?home=${encodeURIComponent(args.homeTeam)}&away=${encodeURIComponent(
                    args.awayTeam
                )}&league=${encodeURIComponent(args.leagueName || 'Sarjaottelu')}`,
            },
        },
    }
}
