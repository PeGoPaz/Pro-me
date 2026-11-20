import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { tileImage } from '../utils/tileImage'
import ExploreTile from './ExploreTile'

const aoife = {
  id: 'prof1',
  name: 'Aoife Byrne',
  isVerified: true,
  averageRating: 4.75,
  pricePerLesson: 45,
  profilePhotoUrl: 'https://example.com/me.jpg',
  posts: [{ id: 'p2', url: 'https://example.com/newest.jpg' }, { id: 'p1', url: 'https://example.com/older.jpg' }],
}

const show = (instructor) => render(<MemoryRouter><ExploreTile instructor={instructor} /></MemoryRouter>)

describe('tileImage', () => {
  it('shows the newest post, else the profile photo, else nothing', () => {
    expect(tileImage(aoife)).toBe('https://example.com/newest.jpg')
    expect(tileImage({ ...aoife, posts: [] })).toBe('https://example.com/me.jpg')
    expect(tileImage({ ...aoife, posts: [], profilePhotoUrl: '' })).toBeNull()
  })
})

describe('ExploreTile', () => {
  it('links to the profile with the name, verification, rating and price', () => {
    show(aoife)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/instructors/prof1')
    expect(link).toHaveTextContent('Aoife Byrne, verified ADI')
    expect(link).toHaveTextContent('★ 4.8 · €45')
  })

  it('stands in initials when there is no picture, and leaves out what is not known', () => {
    show({ id: 'prof2', name: 'Cian Murphy', isVerified: false, averageRating: null, pricePerLesson: null, profilePhotoUrl: '', posts: [] })
    expect(screen.getByText('CM')).toBeInTheDocument()
    expect(screen.getByRole('link')).not.toHaveTextContent('★')
    expect(screen.getByRole('link')).not.toHaveTextContent('verified')
  })
})
