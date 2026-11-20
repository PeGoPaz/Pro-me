import { beforeEach, describe, expect, it, vi } from 'vitest'

import { hasSeen, markSeen } from './seenStories'

describe('seenStories', () => {
  beforeEach(() => window.localStorage.clear())

  it('remembers the newest post seen for each instructor', () => {
    expect(hasSeen('aoife', '2026-11-20T10:00:00Z')).toBe(false)
    markSeen('aoife', '2026-11-20T10:00:00Z')
    expect(hasSeen('aoife', '2026-11-20T10:00:00Z')).toBe(true)
    expect(hasSeen('aoife', '2026-11-20T11:00:00Z')).toBe(false)
    expect(hasSeen('cian', '2026-11-19T10:00:00Z')).toBe(false)
  })

  it('never goes back to an older post', () => {
    markSeen('aoife', '2026-11-20T10:00:00Z')
    markSeen('aoife', '2026-11-18T10:00:00Z')
    expect(hasSeen('aoife', '2026-11-20T10:00:00Z')).toBe(true)
  })

  it('treats broken or blocked storage as nothing seen', () => {
    window.localStorage.setItem('prome.seenStories', 'not json')
    expect(hasSeen('aoife', '2026-11-20T10:00:00Z')).toBe(false)
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    expect(() => markSeen('aoife', '2026-11-20T10:00:00Z')).not.toThrow()
    setItem.mockRestore()
  })
})
