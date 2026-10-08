export function FormLegend({ className = '' }: { className?: string }) {
    return (
        <span className={`inline-flex items-center gap-2 text-[10px] text-text-muted ${className}`}>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-semantic-green" />V = voitto</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent" />T = tasapeli</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-semantic-red" />H = häviö</span>
        </span>
    )
}
