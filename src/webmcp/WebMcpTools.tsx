import { useNavigate } from 'react-router-dom'
import { useWebMCP } from 'use-webmcp-tool'
import { appUrl, matchTool, openPath, playerTool, searchTool, teamTool } from './tools'

const RO = { readOnlyHint: true } as const

/**
 * Registers the app's WebMCP tools on document.modelContext when the browser has it
 * (feature-detected by use-webmcp-tool). Renders nothing.
 */
export function WebMcpTools() {
    const navigate = useNavigate()

    useWebMCP<{ query?: string }, string>({
        name: 'search_football',
        description: 'Search Palloliitto (Finnish football) teams, players and clubs. Players need the full name, e.g. "Simo Oinonen". Returns Taso ids.',
        inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'Team, club or full player name' } }, required: ['query'] },
        annotations: RO,
        execute: searchTool,
    })
    useWebMCP<{ matchId?: string }, string>({
        name: 'get_football_match',
        description: 'One match from Palloliitto\'s results service. Score only when Taso has one ("vs" otherwise); walkovers say "Luovutus". Never invent ids.',
        inputSchema: { type: 'object', properties: { matchId: { type: 'string', description: 'Numeric Taso match id' } }, required: ['matchId'] },
        annotations: RO,
        execute: args => matchTool(args),
    })
    useWebMCP<{ teamId?: string }, string>({
        name: 'get_football_team',
        description: 'A team\'s live, upcoming and latest matches from Palloliitto\'s results service.',
        inputSchema: { type: 'object', properties: { teamId: { type: 'string', description: 'Numeric Taso team id' } }, required: ['teamId'] },
        annotations: RO,
        execute: args => teamTool(args),
    })
    useWebMCP<{ playerId?: string }, string>({
        name: 'get_football_player',
        description: 'A player\'s teams and live, upcoming and latest matches from Palloliitto\'s results service.',
        inputSchema: { type: 'object', properties: { playerId: { type: 'string', description: 'Numeric Taso player id' } }, required: ['playerId'] },
        annotations: RO,
        execute: args => playerTool(args),
    })
    useWebMCP<{ kind?: string; id?: string }, string>({
        name: 'open_football_resource',
        description: 'Open a page in this app: match, team, player, club (numeric id), search (id = search text), favorites or home.',
        inputSchema: {
            type: 'object',
            properties: {
                kind: { type: 'string', enum: ['match', 'team', 'player', 'club', 'search', 'favorites', 'home'] },
                id: { type: 'string', description: 'Taso id, or search text for kind=search' },
            },
            required: ['kind'],
        },
        annotations: { readOnlyHint: false },
        execute: args => {
            const path = openPath(args)
            navigate(path)
            return `Avattiin ${appUrl(path)}`
        },
    })
    return null
}
