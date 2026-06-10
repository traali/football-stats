import { motion } from 'framer-motion'

type BarSide = 'left' | 'right'

const barColors: Record<BarSide, string> = {
    left: 'bg-accent',
    right: 'bg-semantic-blue',
}

interface DualStatBarProps {
    label: string
    valueA: number
    valueB: number
}

export function DualStatBar({ label, valueA, valueB }: DualStatBarProps) {
    const total = valueA + valueB
    const percentA = total > 0 ? (valueA / total) * 100 : 50
    const percentB = total > 0 ? (valueB / total) * 100 : 50

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
                <span className="text-text-primary font-medium tabular-nums">{valueA}</span>
                <span className="text-text-muted font-medium">{label}</span>
                <span className="text-text-primary font-medium tabular-nums">{valueB}</span>
            </div>
            <div className="flex items-center h-2 rounded-full bg-surface-3 overflow-hidden">
                <motion.div
                    className={`h-full rounded-r-full ${barColors.left}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentA}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                />
                <motion.div
                    className={`h-full rounded-l-full ${barColors.right}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentB}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                />
            </div>
        </div>
    )
}
