import { describe, expect, it } from 'vitest'
import { nonNumericMatchRefusal } from './useMatchData'

describe('nonNumericMatchRefusal', () => {
  it('refuses a team slug so a table is not invented', () => {
    expect(nonNumericMatchRefusal('HJK-KäPa')).toMatch(/ottelun numero/)
    expect(nonNumericMatchRefusal('PPJ%2FLaru')).toMatch(/ottelun numero/)
  })

  it('allows a TASO match id', () => {
    expect(nonNumericMatchRefusal('4321789')).toBeNull()
  })
})
