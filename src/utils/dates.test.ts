import { describe, it, expect } from 'vitest'
import { formatDate, formatTime, formatDayName, halfOf, getCurrentSeason, formatSeasonLabel, resolveActiveSeason } from './dates'

describe('dates utils', () => {
    describe('formatDate', () => {
        it('should return empty string for undefined input', () => {
            expect(formatDate(undefined)).toBe('')
        })

        it('should format date with short format', () => {
            expect(formatDate('2026-06-14', 'short')).toBe('06.14')
        })

        it('should format date with day-month format', () => {
            expect(formatDate('2026-06-14')).toBe('Su 14.6.')
        })

        it('should include year when asked', () => {
            expect(formatDate('2026-08-29', 'with-year')).toBe('29.8.2026')
        })
    })

    describe('formatTime', () => {
        it('should format time correctly', () => {
            expect(formatTime('18:30:00')).toBe('18:30')
        })

        it('should return empty string for undefined', () => {
            expect(formatTime(undefined)).toBe('')
        })
    })

    describe('formatDayName', () => {
        it('should return correct day name', () => {
            expect(formatDayName('2026-06-14')).toBe('Su')
        })
    })

    describe('season helpers', () => {
        it('halfOf correctly identifies spring and autumn', () => {
            expect(halfOf('2026-05-15')).toBe('kevät')
            expect(halfOf('2026-06-30')).toBe('kevät')
            expect(halfOf('2026-07-01')).toBe('syksy')
            expect(halfOf('2026-09-12')).toBe('syksy')
            expect(halfOf('')).toBe('')
        })

        it('getCurrentSeason returns current year and season half', () => {
            const springDate = new Date('2026-04-10T12:00:00Z')
            expect(getCurrentSeason(springDate)).toEqual({ year: '2026', half: 'kevät' })

            const autumnDate = new Date('2026-09-12T12:00:00Z')
            expect(getCurrentSeason(autumnDate)).toEqual({ year: '2026', half: 'syksy' })
        })

        it('formatSeasonLabel formats labels properly', () => {
            expect(formatSeasonLabel('all')).toBe('Kaikki kaudet (Yhteensä)')
            expect(formatSeasonLabel('2026', 'all')).toBe('Kausi 2026')
            expect(formatSeasonLabel('2026', 'syksy')).toBe('Syksy 2026')
            expect(formatSeasonLabel('2026', 'kevät')).toBe('Kevät 2026')
        })

        it('resolveActiveSeason prefers live/upcoming over latest played', () => {
            const now = new Date('2026-09-12T12:00:00Z')
            const upcoming = resolveActiveSeason([
                { date: '2026-05-10', status: 'Played', season_id: '2026' },
                { date: '2026-08-20', status: 'Played', season_id: '2026' },
                { date: '2026-09-20', status: 'Fixture', season_id: '2026' },
            ], now)
            expect(upcoming).toEqual({ year: '2026', half: 'syksy' })

            const liveToday = resolveActiveSeason([
                { date: '2026-05-10', status: 'Played' },
                { date: '2026-09-12', status: 'Live' },
            ], now)
            expect(liveToday).toEqual({ year: '2026', half: 'syksy' })

            const onlySpring = resolveActiveSeason([
                { date: '2026-04-01', status: 'Played' },
                { date: '2026-05-20', status: 'Played' },
            ], now)
            expect(onlySpring).toEqual({ year: '2026', half: 'kevät' })

            const empty = resolveActiveSeason([], now)
            expect(empty).toEqual({ year: '2026', half: 'syksy' })
        })
    })
})
