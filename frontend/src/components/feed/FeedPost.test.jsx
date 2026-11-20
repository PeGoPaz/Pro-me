import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import FeedPost from './FeedPost'

const now = new Date('2026-11-20T12:00:00Z')
const post = (author = {}) => ({
  id: 'p1',
  url: 'https://example.com/car.jpg',
  caption: 'The Yaris, washed for Monday',
  postedAt: '2026-11-20T09:00:00Z',
  author: { id: 'prof1', userId: 'user1', name: 'Aoife Byrne', photo: '', isVerified: true, acceptingNewStudents: true, ...author },
})

const show = (item) => render(<MemoryRouter><FeedPost post={item} now={now} /></MemoryRouter>)

describe('FeedPost', () => {
  it('shows who posted it, how long ago, the photo and the caption', () => {
    show(post())
    expect(screen.getByRole('article', { name: 'Post by Aoife Byrne' })).toBeInTheDocument()
    expect(screen.getByText('3 h')).toHaveAttribute('dateTime', '2026-11-20T09:00:00Z')
    expect(screen.getByAltText('The Yaris, washed for Monday')).toHaveAttribute('src', 'https://example.com/car.jpg')
    expect(screen.getByText('Verified ADI')).toBeInTheDocument()
  })

  it('links to the profile, and to a lesson request while they take learners', () => {
    show(post())
    expect(screen.getByRole('link', { name: 'View profile' })).toHaveAttribute('href', '/instructors/prof1')
    expect(screen.getByRole('link', { name: 'Request a lesson' })).toHaveAttribute('href', '/booking?instructor=user1')
  })

  it('offers no lesson request when they are full, and no badge when unverified', () => {
    show(post({ acceptingNewStudents: false, isVerified: false }))
    expect(screen.queryByRole('link', { name: 'Request a lesson' })).toBeNull()
    expect(screen.queryByText('Verified ADI')).toBeNull()
  })
})
