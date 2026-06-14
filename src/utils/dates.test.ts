import { describe, it, expect } from 'vitest'
import { formatDate, formatTime, formatDayName } from './dates'

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
})
