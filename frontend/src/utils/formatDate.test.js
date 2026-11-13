import { describe, expect, it } from 'vitest'

import { formatDate, formatMonthYear, formatShortDate } from './formatDate'

describe('formatDate', () => {
  it('formats a date as "Sat, 2 May 2026" in the Irish locale', () => {
    expect(formatDate(new Date(2026, 4, 2))).toBe('Sat, 2 May 2026')
  })
})

describe('formatMonthYear', () => {
  it('formats a date as "May 2026"', () => {
    expect(formatMonthYear(new Date(2026, 4, 2))).toBe('May 2026')
  })
})

describe('formatShortDate', () => {
  it('formats a date as "2 May 2026" without a weekday', () => {
    expect(formatShortDate(new Date(2026, 4, 2))).toBe('2 May 2026')
  })
})
