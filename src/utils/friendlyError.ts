import { APINotFoundError, APIRateLimitError, APITimeoutError } from '../services/api'

/** Turn any thrown value into a short Finnish sentence. Never shows raw API text. */
export function friendlyError(err: unknown, what = 'Tietoja'): string {
    if (err instanceof APINotFoundError) return `${what} ei löytynyt tulospalvelusta.`
    if (err instanceof APIRateLimitError) return 'Tulospalvelu on juuri nyt kiireinen. Odota hetki ja yritä uudelleen.'
    if (err instanceof APITimeoutError) return 'Yhteys katkesi. Tarkista netti ja yritä uudelleen.'
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'Puhelin on offline-tilassa. Yhdistä nettiin ja yritä uudelleen.'
    return `${what} ei saatu ladattua juuri nyt. Yritä uudelleen.`
}
