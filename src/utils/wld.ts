export const WLD_CONFIG = {
    V: { label: 'V', color: 'text-semantic-green', bg: 'bg-semantic-green/10', dot: 'bg-semantic-green' },
    T: { label: 'T', color: 'text-accent', bg: 'bg-accent/10', dot: 'bg-accent' },
    H: { label: 'H', color: 'text-semantic-red', bg: 'bg-semantic-red/10', dot: 'bg-semantic-red' },
} as const

export type WLDKey = keyof typeof WLD_CONFIG

export function getWldConfig(wld: WLDKey | string | undefined) {
    return WLD_CONFIG[wld as WLDKey] || WLD_CONFIG.V
}

export function getWldFromScore(fsA: string | undefined, fsB: string | undefined, teamAId: string, teamBId: string, myTeamId: string): WLDKey {
    if (!fsA || !fsB) return 'V'
    const a = parseInt(fsA)
    const b = parseInt(fsB)
    if (a === b) return 'T'
    if ((myTeamId === teamAId && a > b) || (myTeamId === teamBId && b > a)) return 'V'
    return 'H'
}

export function getWldFromWinner(winnerId: string | undefined, myTeamId: string): WLDKey {
    if (!winnerId) return 'V'
    if (winnerId === myTeamId) return 'V'
    return winnerId === 'draw' ? 'T' : 'H'
}