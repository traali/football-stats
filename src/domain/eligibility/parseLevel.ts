import type { AgeClass, Format, LevelRank } from './types'

export function parseLevel(categoryName?: string, categoryId?: string): LevelRank {
    const blob = `${categoryName || ''} ${categoryId || ''}`.toLowerCase()
    if (/liiga/.test(blob)) return 'liiga'
    if (/ykkönen|ykkonen/.test(blob)) return 'ykkonen'
    if (/kakkonen/.test(blob)) return 'kakkonen'
    if (/kolmonen/.test(blob)) return 'kolmonen'
    if (/nelonen/.test(blob)) return 'nelonen'
    if (/vitonen/.test(blob)) return 'vitonen'
    if (/harraste|peli-ilta|peliilta/.test(blob)) return 'harraste'
    return 'unknown'
}

export function parseAgeClass(categoryName?: string, categoryId?: string, birthYear?: number, seasonYear = 2026): AgeClass {
    const blob = `${categoryName || ''} ${categoryId || ''}`
    const m = blob.match(/\b([PT])\s?(\d{2})\b/i)
    if (m) return `${m[1].toUpperCase()}${m[2]}`
    const y = blob.match(/20(\d{2})/)
    if (y) {
        const born = 2000 + parseInt(y[1], 10)
        return `P${seasonYear - born}`
    }
    if (birthYear) return `P${seasonYear - birthYear}`
    return 'unknown'
}

export function parseFormat(categoryId?: string, categoryName?: string, explicit?: Format): Format {
    if (explicit) return explicit
    const level = parseLevel(categoryName, categoryId)
    if (level === 'liiga' || level === 'ykkonen') return '11v11'
    return '8v8'
}

export const ETELA_P13_2026 = {
    competitionId: 'etejp26',
    categories: {
        P13LE: { level: 'liiga' as LevelRank, format: '11v11' as Format },
        P131: { level: 'ykkonen' as LevelRank, format: '11v11' as Format },
        P132: { level: 'kakkonen' as LevelRank, format: '8v8' as Format },
        P133: { level: 'kolmonen' as LevelRank, format: '8v8' as Format },
        P134: { level: 'nelonen' as LevelRank, format: '8v8' as Format },
        P135: { level: 'vitonen' as LevelRank, format: '8v8' as Format },
        P136: { level: 'harraste' as LevelRank, format: '8v8' as Format },
    },
}
