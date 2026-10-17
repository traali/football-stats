import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import rows from '../test/fixtures/taso/getMatches_live_rows_2026-10-17.json'
import { MatchRow, type RowMatch } from './MatchRow'

const at = (hhmm: string) => new Date(`2026-10-17T${hhmm}:00+03:00`)
const row = (id: string) => rows.matches.find(m => m.match_id === id) as unknown as RowMatch
const html = (m: RowMatch, now: Date, fetchedAt?: number) =>
    renderToStaticMarkup(<MemoryRouter><MatchRow match={m} now={now} fetchedAt={fetchedAt} /></MemoryRouter>)

describe('MatchRow freshness note (real Taso rows 2026-10-17)', () => {
    const fetched = at('13:49').getTime()
    it('live row shows the fetch time, no stale note within 3 min', () => {
        const h = html(row('4312783'), at('13:50'), fetched)
        expect(h).toContain('(päivitetty klo 13.49)')
        expect(h).not.toContain('vanhentunut')
    })
    it('live row older than 3 min adds the gentle note', () => {
        const h = html(row('4312783'), at('13:53'), fetched)
        expect(h).toContain('(päivitetty klo 13.49)')
        expect(h).toContain('Tulos voi olla vanhentunut.')
    })
    it('finished and upcoming rows never show it', () => {
        expect(html({ ...row('4312783'), status: 'Played' }, at('13:53'), fetched)).not.toContain('päivitetty')
        expect(html(row('4313216'), at('13:48'), fetched)).not.toContain('päivitetty') // upcoming before kickoff
    })
    it('no fetch time → nothing', () => {
        expect(html(row('4312783'), at('13:50'))).not.toContain('päivitetty')
    })
})
