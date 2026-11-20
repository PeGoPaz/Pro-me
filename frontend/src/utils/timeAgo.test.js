import { describe, expect, it } from 'vitest'

import { timeAgo } from './timeAgo'

const now = new Date('2026-11-20T12:00:00Z')
const ago = (ms) => new Date(now.getTime() - ms)
const MIN = 60 * 1000

describe('timeAgo', () => {
  it('counts minutes, hours, days and weeks the short way', () => {
    expect(timeAgo(ago(20 * 1000), now)).toBe('just now')
    expect(timeAgo(ago(12 * MIN), now)).toBe('12 min')
    expect(timeAgo(ago(3 * 60 * MIN + 59 * MIN), now)).toBe('3 h')
    expect(timeAgo(ago(2 * 24 * 60 * MIN), now)).toBe('2 d')
    expect(timeAgo(ago(15 * 24 * 60 * MIN), now)).toBe('2 w')
  })

  it('gives the date once a post is more than four weeks old', () => {
    expect(timeAgo('2026-10-01T10:00:00Z', now)).toBe('1 Oct 2026')
  })

  it('treats a time in the future as just now', () => {
    expect(timeAgo(new Date(now.getTime() + 5 * MIN), now)).toBe('just now')
  })
})
