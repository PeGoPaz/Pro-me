import { describe, expect, it } from 'vitest'

import { formatIrishPhone } from './formatPhone'

describe('formatIrishPhone', () => {
  it('formats an Irish mobile as "087 123 4567"', () => {
    expect(formatIrishPhone('+353871234567')).toBe('087 123 4567')
  })

  it('formats a Dublin landline as "01 234 5678"', () => {
    expect(formatIrishPhone('+35312345678')).toBe('01 234 5678')
  })

  it('leaves non-Irish numbers untouched', () => {
    expect(formatIrishPhone('+441234567890')).toBe('+441234567890')
  })

  it('returns an empty string for empty input', () => {
    expect(formatIrishPhone('')).toBe('')
  })

  it('returns an empty string for null/undefined', () => {
    expect(formatIrishPhone(null)).toBe('')
    expect(formatIrishPhone(undefined)).toBe('')
  })
})
