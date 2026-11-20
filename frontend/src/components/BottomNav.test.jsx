import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AuthContext } from '../context/auth'
import BottomNav from './BottomNav'

const show = (path, auth) =>
  render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[path]}>
        <BottomNav />
      </MemoryRouter>
    </AuthContext.Provider>,
  )

describe('BottomNav', () => {
  it('marks the tab for the page you are on, and only that one', () => {
    show('/instructors', { user: { role: 'user' }, loading: false })
    expect(screen.getByRole('link', { name: 'Explore' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('link', { name: 'Saved' })).toHaveAttribute('href', '/saved')
  })

  it('does not mark Home on every page just because every path starts with /', () => {
    show('/saved', { user: null, loading: false })
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('link', { name: 'Saved' })).toHaveAttribute('aria-current', 'page')
  })

  it('waits for the session check before showing tabs that depend on it', () => {
    const { container } = show('/', { user: null, loading: true })
    expect(container).toBeEmptyDOMElement()
  })
})
