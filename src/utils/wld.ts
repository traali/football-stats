export const WLD_CONFIG = {
    V: { label: 'V', color: 'text-semantic-green', bg: 'bg-semantic-green/10', dot: 'bg-semantic-green' },
    T: { label: 'T', color: 'text-accent', bg: 'bg-accent/10', dot: 'bg-accent' },
    H: { label: 'H', color: 'text-semantic-red', bg: 'bg-semantic-red/10', dot: 'bg-semantic-red' },
} as const

export type WLDKey = keyof typeof WLD_CONFIG

