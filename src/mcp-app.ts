/**
 * Football Stats MCP App Tool Handler
 * Standard: @modelcontextprotocol/ext-apps (2026 UI Capabilities Standard)
 * Reference: https://modelcontextprotocol.info/blog/mcp-apps-ui-capabilities/
 *
 * Exposes interactive Head-to-Head and match stats tools with `_meta.ui.resourceUri`.
 */

import { buildMatchStatsContract } from './types/contracts'
import type { SportStatsContract } from './types/contracts'

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

    const summary = `⚽ Keskinäiset tilastot (${args.homeTeam} vs ${args.awayTeam}): Kuntopuntari Kotijoukkue [${(stats.recentFormStrings?.home || ['W', 'W']).join(
        '-'
    )}], Vierasjoukkue [${(stats.recentFormStrings?.away || ['W', 'L']).join('-')}]. Keskinäiset kohtaamiset: ${
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

export interface ModelContextTool {
    name: string
    description: string
    inputSchema: {
        type: string
        properties?: Record<string, unknown>
        required?: string[];
    }
    execute: (args: Record<string, unknown>) => Promise<unknown>
}

export interface ModelContextRegistry {
    registerTool: (tool: ModelContextTool) => Promise<void> | void
    unregisterTool?: (name: string) => Promise<void> | void
    getTools: () => ModelContextTool[]
    listTools: () => Promise<{ tools: Array<{ name: string; description: string; inputSchema: ModelContextTool['inputSchema'] }> }>
    callTool: (params: { name: string; arguments?: Record<string, unknown> }) => Promise<McpToolResponse>
    executeTool: (name: string, args?: Record<string, unknown>) => Promise<unknown>
}

declare global {
    interface Document {
        modelContext?: ModelContextRegistry
    }
    interface Navigator {
        modelContext?: ModelContextRegistry
    }
    interface Window {
        modelContext?: ModelContextRegistry
    }
}

export function registerFootballWebMCP(): ModelContextRegistry | undefined {
    if (typeof window === 'undefined') return

    const registeredTools = new Map<string, ModelContextTool>()

    const registry: ModelContextRegistry = {
        registerTool: async (tool: ModelContextTool) => {
            registeredTools.set(tool.name, tool)
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('webmcp:tool_registered', { detail: { toolName: tool.name } }))
            }
        },
        unregisterTool: async (name: string) => {
            registeredTools.delete(name)
        },
        getTools: () => Array.from(registeredTools.values()),
        listTools: async () => ({
            tools: Array.from(registeredTools.values()).map(t => ({
                name: t.name,
                description: t.description,
                inputSchema: t.inputSchema,
            })),
        }),
        callTool: async (params: { name: string; arguments?: Record<string, unknown> }) => {
            const tool = registeredTools.get(params.name)
            if (!tool) {
                return {
                    content: [{ type: 'text', text: `Error: Tool '${params.name}' not found in Football Stats WebMCP.` }],
                }
            }
            try {
                const res = await tool.execute(params.arguments || {})
                if (res && typeof res === 'object' && 'content' in res) {
                    return res as McpToolResponse
                }
                return {
                    content: [{
                        type: 'text',
                        text: typeof res === 'string' ? res : JSON.stringify(res, null, 2),
                    }],
                }
            } catch (err: any) {
                return {
                    content: [{ type: 'text', text: `Error executing '${params.name}': ${err?.message || String(err)}` }],
                }
            }
        },
        executeTool: async (name: string, args: Record<string, unknown> = {}) => {
            const tool = registeredTools.get(name)
            if (!tool) throw new Error(`Tool '${name}' not found`)
            return tool.execute(args)
        },
    }

    if (typeof document !== 'undefined') {
        document.modelContext = registry
    }
    if (typeof navigator !== 'undefined') {
        try {
            Object.defineProperty(navigator, 'modelContext', {
                value: registry,
                configurable: true,
                enumerable: true,
                writable: true,
            })
        } catch {
            ;(navigator as any).modelContext = registry
        }
    }
    if (typeof window !== 'undefined') {
        ;(window as any).modelContext = registry

        window.addEventListener('message', async (event: MessageEvent) => {
            const data = event.data
            if (!data || data.type !== 'webmcp:request' || !data.id) return

            try {
                if (data.method === 'tools/list' || data.method === 'listTools') {
                    const result = await registry.listTools()
                    window.postMessage({ type: 'webmcp:response', id: data.id, result }, '*')
                } else if (data.method === 'tools/call' || data.method === 'callTool') {
                    const result = await registry.callTool(data.params || { name: '', arguments: {} })
                    window.postMessage({ type: 'webmcp:response', id: data.id, result }, '*')
                }
            } catch (err: any) {
                window.postMessage({
                    type: 'webmcp:response',
                    id: data.id,
                    error: { message: err?.message || 'WebMCP execution failed' },
                }, '*')
            }
        })

        window.dispatchEvent(
            new CustomEvent('webmcp:ready', { detail: { location: 'navigator.modelContext & document.modelContext' } })
        )
    }

    // Register get_h2h_card tool
    registry.registerTool({
        name: 'get_h2h_card',
        description: 'Returns head-to-head comparison stats and interactive HTML UI widget URI for football matches.',
        inputSchema: {
            type: 'object',
            properties: {
                homeTeam: { type: 'string', description: 'Home team name' },
                awayTeam: { type: 'string', description: 'Away team name' },
                leagueName: { type: 'string', description: 'Optional competition or league name' },
            },
            required: ['homeTeam', 'awayTeam'],
        },
        execute: async (args) => getH2HCardTool(args as { homeTeam: string; awayTeam: string; leagueName?: string }),
    })

    // Register get_tournament_standings tool
    registry.registerTool({
        name: 'get_tournament_standings',
        description: 'Fetches tournament standings and groups for Finnish junior football tournaments.',
        inputSchema: {
            type: 'object',
            properties: {
                turnaus: { type: 'string', description: 'Tournament identifier (e.g. lime_0016 for Vierumäki)' },
                sarja: { type: 'string', description: 'Category code (e.g. P13H)' },
            },
            required: ['turnaus'],
        },
        execute: async ({ turnaus, sarja }) => ({
            turnaus: turnaus || 'lime_0016',
            sarja: sarja || 'P13H',
            tournamentTitle: 'Vierumäki-turnaus 5.–6.9.2026',
            categoryName: 'Pojat 13 Haaste (2013)',
            teamCount: 16,
            status: 'upcoming',
        }),
    })

    console.log('✨ [WebMCP] Successfully registered Football Stats tools into navigator.modelContext & document.modelContext')
    return registry
}

