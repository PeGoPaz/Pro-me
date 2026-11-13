import { describe, expect, it } from 'vitest'

import { getCategoryImage } from './categoryImages'

describe('getCategoryImage', () => {
  it('returns the cover image for a known category', () => {
    expect(getCategoryImage('Driving')).toBeTruthy()
  })

  it('returns null for an unknown category', () => {
    expect(getCategoryImage('Other')).toBeNull()
  })

  it('returns null for a missing category', () => {
    expect(getCategoryImage(undefined)).toBeNull()
  })
})
