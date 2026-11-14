import { describe, it, expect } from 'vitest'
import { nameMatch, rankTwins, teamBirthYear } from './rosterTwin'

// Real Taso getClub 52 rows (2026-11-14), same club as Winterliiga PPJ/Laru Sininen 35224454.
const club = [
    { team_id: '35230232', team_name: 'PPJ/Laru Sininen', yob: '2013', sport_id: 'futsal', season: '2026-27', category_name: 'P14 Futsal-Kolmonen' },
    { team_id: '185085', team_name: 'PPJ/Laru sin', yob: '2013', sport_id: 'football', season: '2026', category_name: 'P13 Kolmonen' },
    { team_id: '35187930', team_name: 'PPJ/Laru Sininen', yob: '2018', sport_id: 'football', season: '2026', category_name: 'P8' },
    { team_id: '35121670', team_name: 'PPJ/Laru Sininen', yob: '2015', sport_id: 'football', season: '2026', category_name: 'P11' },
    { team_id: '35170355', team_name: 'PPJ/Laru sinivalk', yob: '2017', sport_id: 'football', season: '2026' },
    { team_id: '185086', team_name: 'PPJ/Laru oran', yob: '2013', sport_id: 'football', season: '2026' },
    { team_id: '35224454', team_name: 'PPJ/Laru Sininen', sport_id: 'football' },
]
const winter = { team_id: '35224454', team_name: 'PPJ/Laru Sininen', yob: '2013', clubAbbr: 'PPJ' }

describe('nameMatch', () => {
    it('exact ignoring case', () => expect(nameMatch('PPJ/Laru Sininen', 'ppj/laru sininen')).toBe('exact'))
    it('abbreviation word by word', () => expect(nameMatch('PPJ/Laru Sininen', 'PPJ/Laru sin')).toBe('abbrev'))
    it('different team colour is not a match', () => {
        expect(nameMatch('PPJ/Laru Sininen', 'PPJ/Laru sinivalk')).toBeNull()
        expect(nameMatch('PPJ/Laru Sininen', 'PPJ/Laru oran')).toBeNull()
        expect(nameMatch('PPJ/Laru Sininen', 'PPJ/Laru 2013 Sininen')).toBeNull()
    })
    it('too short to be an abbreviation', () => expect(nameMatch('PPJ/Laru Sininen', 'PPJ/Laru s')).toBeNull())
})

describe('teamBirthYear', () => {
    it('own birthyear first', () => expect(teamBirthYear({ birthyear: '2013' })).toBe('2013'))
    it('year in brackets in the primary category (Winterliiga)', () => {
        expect(teamBirthYear({ birthyear: '', primary_category: { category_name: 'Pojat C14 (2013) Haaste' } })).toBe('2013')
    })
    it('no stated year: null, never guessed from P14', () => {
        expect(teamBirthYear({ birthyear: '', primary_category: { category_name: 'P14', age_group: 'P14' } })).toBeNull()
    })
})

describe('rankTwins', () => {
    it('Winterliiga PPJ/Laru Sininen → futsal Sininen 2013 first, then PPJ/Laru sin 2013', () => {
        expect(rankTwins(winter, club).map(t => [t.team_id, t.match])).toEqual([['35230232', 'exact'], ['185085', 'abbrev']])
    })
    it('never another birth year or itself', () => {
        const ids = rankTwins(winter, club).map(t => t.team_id)
        expect(ids).not.toContain('35187930')
        expect(ids).not.toContain('35121670')
        expect(ids).not.toContain('35224454')
    })
    it('no birth year → no twins', () => {
        expect(rankTwins({ ...winter, yob: null }, club)).toEqual([])
    })
    it('no matching name → empty (keeps "Ei pelaajatietoja")', () => {
        expect(rankTwins({ ...winter, team_name: 'PPJ/Laru Keltainen' }, club)).toEqual([])
    })
    it('equal exact matches: newest season first', () => {
        const two = [
            { team_id: '170321', team_name: 'PPJ/Laru Sininen', yob: '2013', season: '2024' },
            { team_id: '35230232', team_name: 'PPJ/Laru Sininen', yob: '2013', season: '2026-27' },
        ]
        expect(rankTwins(winter, two)[0].team_id).toBe('35230232')
    })
})
