import { twMerge } from 'tailwind-merge'
import { clsx, type ClassValue } from 'clsx'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface SkeletonProps {
    className?: string
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                'animate-shimmer rounded-md',
                className,
            )}
        />
    )
}

export function PlayerCardSkeleton() {
    return (
        <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-5">
            <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                    <Skeleton className="w-16 h-16 rounded-lg" />
                    <div className="space-y-2">
                        <Skeleton className="w-36 h-5" />
                        <Skeleton className="w-24 h-3" />
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-3 rounded-xl border border-border-hairline flex flex-col items-center gap-1.5">
                        <Skeleton className="w-4 h-4" />
                        <Skeleton className="w-8 h-5" />
                        <Skeleton className="w-12 h-2" />
                    </div>
                ))}
            </div>
        </div>
    )
}

export function MatchHeaderSkeleton() {
    return (
        <div className="bg-surface-1 border border-border-hairline rounded-xl p-6 md:p-8 space-y-6">
            <div className="flex flex-col items-center space-y-2">
                <Skeleton className="w-32 h-5 rounded-md" />
                <Skeleton className="w-48 h-3" />
            </div>
            <div className="flex items-center justify-center space-x-4 md:space-x-8">
                <Skeleton className="w-24 h-8" />
                <Skeleton className="w-28 h-14" />
                <Skeleton className="w-24 h-8" />
            </div>
            <div className="flex justify-center">
                <Skeleton className="w-40 h-4" />
            </div>
        </div>
    )
}

export function StandingsTableSkeleton() {
    return (
        <div className="bg-surface-1 border border-border-hairline rounded-xl overflow-hidden">
            <div className="p-5 border-b border-border-hairline bg-surface-2">
                <Skeleton className="w-32 h-5" />
            </div>
            <div className="p-5 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <Skeleton className="w-6 h-4" />
                        <Skeleton className="flex-1 h-4" />
                        <Skeleton className="w-6 h-4" />
                        <Skeleton className="w-6 h-4" />
                        <Skeleton className="w-6 h-4" />
                        <Skeleton className="w-6 h-4" />
                        <Skeleton className="w-6 h-5" />
                    </div>
                ))}
            </div>
        </div>
    )
}
