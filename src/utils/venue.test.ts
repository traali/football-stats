import { describe, it, expect } from 'vitest'
import { mapsUrl, osmEmbedUrl, parkkisUrl, venueOf } from './venue'

// Real Taso getMatch 4379247 venue fields (2026-11-14).
const pikkupekka = { venue_name: 'Pikkupekka Areena', venue_city_name: 'Helsinki', venue_lat: '60.234015680055', venue_lon: '24.966134123568' }

describe('venueOf', () => {
    it('reads the exact Taso pin', () => {
        expect(venueOf(pikkupekka)).toEqual({ name: 'Pikkupekka Areena', city: 'Helsinki', coords: { lat: 60.234015680055, lon: 24.966134123568 } })
    })
    it('no pin when coordinates are missing, empty, bad or 0,0', () => {
        expect(venueOf({ venue_name: 'Kenttä' })?.coords).toBeNull()
        expect(venueOf({ venue_name: 'Kenttä', venue_lat: '', venue_lon: '' })?.coords).toBeNull()
        expect(venueOf({ venue_name: 'Kenttä', venue_lat: 'x', venue_lon: '24' })?.coords).toBeNull()
        expect(venueOf({ venue_name: 'Kenttä', venue_lat: '0', venue_lon: '0' })?.coords).toBeNull()
        expect(venueOf({ venue_name: 'Kenttä', venue_lat: '60.2' })?.coords).toBeNull()
    })
    it('null when Taso has neither a name nor a pin', () => {
        expect(venueOf({})).toBeNull()
    })
})

describe('parkkisUrl (Pelipäivä format)', () => {
    it('builds /venue/<name>?lat=&lon=', () => {
        expect(parkkisUrl(venueOf(pikkupekka))).toBe('https://parkkis.pages.dev/venue/Pikkupekka%20Areena?lat=60.234015680055&lon=24.966134123568')
    })
    it('hidden without an exact pin', () => {
        expect(parkkisUrl(venueOf({ venue_name: 'Kenttä' }))).toBeNull()
        expect(parkkisUrl(null)).toBeNull()
    })
})

describe('maps links', () => {
    it('directions to the pin', () => {
        expect(mapsUrl(venueOf(pikkupekka))).toBe('https://www.google.com/maps/dir/?api=1&destination=60.234015680055,24.966134123568')
    })
    it('name + city search without a pin, never a guessed point', () => {
        expect(mapsUrl(venueOf({ venue_name: 'Lauttasaari TN B', venue_city_name: 'Helsinki' }))).toBe('https://www.google.com/maps/search/?api=1&query=Lauttasaari%20TN%20B%2C%20Helsinki')
        expect(osmEmbedUrl(venueOf({ venue_name: 'Lauttasaari TN B' }))).toBeNull()
    })
    it('OSM embed has a marker on the pin', () => {
        expect(osmEmbedUrl(venueOf(pikkupekka))).toContain('marker=60.234016,24.966134')
    })
})
