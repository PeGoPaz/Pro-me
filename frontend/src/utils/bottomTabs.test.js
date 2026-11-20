import { describe, expect, it } from 'vitest'

import { bottomTabs } from './bottomTabs'

const labels = (user) => bottomTabs(user).map((tab) => tab.label)

describe('bottomTabs', () => {
  it('gives a visitor home, explore, saved and a way to sign in', () => {
    expect(labels(null)).toEqual(['Home', 'Explore', 'Saved', 'Sign in'])
  })

  it('gives a learner their saved list and their own page', () => {
    expect(labels({ role: 'user' })).toEqual(['Home', 'Explore', 'Saved', 'You'])
    expect(bottomTabs({ role: 'user' }).at(-1).to).toBe('/dashboard/customer')
  })

  it('gives instructors and admins no saved list, and their dashboard', () => {
    expect(labels({ role: 'enterprise' })).toEqual(['Home', 'Explore', 'Dashboard'])
    expect(labels({ role: 'admin' })).toEqual(['Home', 'Explore', 'Admin'])
  })
})
