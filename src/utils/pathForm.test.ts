import { describe, expect, it } from 'vitest'
import { pathFormTarget } from './pathForm'

describe('pathFormTarget', () => {
    it('forwards /match/<id> to the hash route', () => {
        expect(pathFormTarget('/match/4208631', '', '', '/')).toBe('/#/match/4208631')
    })

    it('keeps the query string', () => {
        expect(pathFormTarget('/match/4208631', '?embed=true', '', '/')).toBe('/#/match/4208631?embed=true')
    })

    it('forwards team and player paths and drops a trailing slash', () => {
        expect(pathFormTarget('/team/185085/', '', '', '/')).toBe('/#/team/185085')
        expect(pathFormTarget('/player/123', '?a=1&b=2', '', '/')).toBe('/#/player/123?a=1&b=2')
    })

    it('respects the GitHub Pages base path', () => {
        expect(pathFormTarget('/football-stats/match/4208631', '?x=1', '', '/football-stats/')).toBe(
            '/football-stats/#/match/4208631?x=1',
        )
    })

    it('leaves the app root and the hash route alone', () => {
        expect(pathFormTarget('/', '', '#/match/4208631', '/')).toBeNull()
        expect(pathFormTarget('/', '?embed=true', '', '/')).toBeNull()
        expect(pathFormTarget('/football-stats/', '', '#/match/4208631', '/football-stats/')).toBeNull()
        expect(pathFormTarget('/index.html', '', '', '/')).toBeNull()
    })

    it('keeps an existing hash route instead of the path', () => {
        expect(pathFormTarget('/match/1', '', '#/match/4208631', '/')).toBe('/#/match/4208631')
    })
})
