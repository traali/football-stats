import { MapPin, Navigation, Car } from 'lucide-react'
import { cn } from '../utils/cn'
import { mapsUrl, osmEmbedUrl, parkkisUrl, type Venue } from '../utils/venue'

/**
 * Where the game is: Taso's venue name + city, a small map at Taso's exact pin,
 * directions, and Parkkis (only with an exact pin, like Pelipäivä).
 */
export function VenueBlock({ venue, compact = false, className }: { venue: Venue | null; compact?: boolean; className?: string }) {
    if (!venue) return null
    const map = osmEmbedUrl(venue)
    const maps = mapsUrl(venue)
    const parkkis = parkkisUrl(venue)
    const place = [venue.name, venue.city].filter(Boolean).join(', ')
    const btn = 'inline-flex items-center justify-center gap-1.5 min-h-[44px] px-2 rounded-lg text-xs font-bold border transition-colors text-center leading-tight'
    return (
        <div className={cn('space-y-2', className)} data-testid="venue-block">
            {place && (
                <p className="text-sm text-text-secondary flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span className="min-w-0 break-words">{place}</span>
                </p>
            )}
            {map && (
                <div className={cn('relative w-full overflow-hidden rounded-lg border border-border-hairline bg-surface-2', compact ? 'h-32' : 'h-44')}>
                    <iframe
                        src={map}
                        title={`Kartta: ${place || 'pelipaikka'}`}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className={cn('absolute inset-0 w-full h-full border-0', compact && 'pointer-events-none')}
                    />
                </div>
            )}
            {(maps || parkkis) && (
                <div className="grid grid-cols-2 gap-2">
                    {maps && (
                        <a href={maps} target="_blank" rel="noopener noreferrer" data-testid="venue-maps"
                            className={cn(btn, 'bg-surface-2 border-border-hairline text-text-primary hover:bg-surface-3', !parkkis && 'col-span-2')}>
                            <Navigation className="w-4 h-4 text-accent shrink-0" /> Avaa kartalla
                        </a>
                    )}
                    {parkkis && (
                        <a href={parkkis} target="_blank" rel="noopener noreferrer" data-testid="venue-parkkis"
                            className={cn(btn, 'bg-semantic-blue/10 border-semantic-blue/30 text-semantic-blue hover:bg-semantic-blue/20', !maps && 'col-span-2')}>
                            <Car className="w-4 h-4 shrink-0" /> Pysäköinti (Parkkis)
                        </a>
                    )}
                </div>
            )}
        </div>
    )
}
