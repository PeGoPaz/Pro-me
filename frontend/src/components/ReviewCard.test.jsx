import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ReviewCard from './ReviewCard'

const review = {
  rating: 5,
  comment: 'Great instructor, very patient.',
  createdAt: '2026-05-02',
  reviewerId: { name: 'Aoife Byrne', avatarUrl: '' },
  serviceId: { subject: 'Driving' },
}

describe('ReviewCard', () => {
  it('renders the reviewer name, service and comment', () => {
    render(<ReviewCard review={review} />)
    expect(screen.getByText('Aoife Byrne')).toBeInTheDocument()
    expect(screen.getByText('for: Driving')).toBeInTheDocument()
    expect(screen.getByText('"Great instructor, very patient."')).toBeInTheDocument()
  })

  it('falls back to "Deleted user" when the reviewer is gone', () => {
    render(<ReviewCard review={{ ...review, reviewerId: null }} />)
    expect(screen.getByText('Deleted user')).toBeInTheDocument()
  })

  it('shows initials when there is no avatar', () => {
    render(<ReviewCard review={review} />)
    expect(screen.getByText('AB')).toBeInTheDocument()
  })
})
