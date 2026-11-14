/**
 * Venue facts for a game, only from what Taso sends (venue_name, venue_city_name,
 * venue_lat, venue_lon). Never a guessed location.
 *
 * Parkkis link: same URL and rules as Pelipäivä (traali/pelipaiva
 * src/lib/parking/parkkisLink.ts + buildParkingDeepLink): only with an exact pin,
 * `https://parkkis.pages.dev/venue/<name>?lat=&lon=`. Taso's venue_lat/venue_lon is
 * the venue's own registered pin (never a city-centre fallback), so it counts as exact;
 * missing, non-numeric or 0,0 coordinates mean "no pin" and no Parkkis button.
 */

export const PARKKIS_BASE_URL = 'https://parkkis.pages.dev'

export interface Venue {
    name: string
    city: string
    /** Exact pin from Taso, or null when Taso has none. */
    coords: { lat: number; lon: number } | null
}

function str(v: unknown): string {
    return v === null || v === undefined ? '' : String(v).trim()
}

function num(v: unknown): number | null {
    const s = str(v)
    if (!s) return null
    const n = Number(s)
    return Number.isFinite(n) ? n : null
}

export function venueCoords(lat: unknown, lon: unknown): { lat: number; lon: number } | null {
    const la = num(lat), lo = num(lon)
    if (la === null || lo === null) return null
    if (la === 0 && lo === 0) return null
    if (Math.abs(la) > 90 || Math.abs(lo) > 180) return null
    return { lat: la, lon: lo }
}

export function venueOf(m: object | null | undefined): Venue | null {
    if (!m) return null
    const r = m as Record<string, unknown>
    const name = str(r.venue_name) || str(r.venue)
    const city = str(r.venue_city_name)
    const coords = venueCoords(r.venue_lat, r.venue_lon)
    if (!name && !coords) return null
    return { name, city, coords }
}

/** Pelipäivä's buildParkingDeepLink, byte for byte in behaviour. */
export function parkkisUrl(v: Venue | null): string | null {
    if (!v?.coords) return null
    const url = new URL(PARKKIS_BASE_URL)
    url.pathname = v.name ? `/venue/${encodeURIComponent(v.name)}` : '/'
    url.searchParams.set('lat', String(v.coords.lat))
    url.searchParams.set('lon', String(v.coords.lon))
    return url.toString()
}

/** Google Maps: directions to the exact pin, or a name search when Taso has no pin. */
export function mapsUrl(v: Venue | null): string | null {
    if (!v) return null
    if (v.coords) return `https://www.google.com/maps/dir/?api=1&destination=${v.coords.lat},${v.coords.lon}`
    const q = [v.name, v.city].filter(Boolean).join(', ')
    return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null
}

/** OpenStreetMap embed centred on the pin, with a marker. Null without a pin. */
export function osmEmbedUrl(v: Venue | null, span = 0.004): string | null {
    if (!v?.coords) return null
    const { lat, lon } = v.coords
    const f = (n: number) => n.toFixed(6)
    const bbox = [f(lon - span * 2), f(lat - span), f(lon + span * 2), f(lat + span)].join(',')
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${f(lat)},${f(lon)}`
}
