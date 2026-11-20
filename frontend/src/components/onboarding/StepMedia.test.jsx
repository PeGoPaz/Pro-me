import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { StepMedia } from './OnboardingSteps'

const posts = [
  { id: 'p2', url: 'https://example.com/car.jpg', caption: 'The Yaris', postedAt: '2026-11-20T10:00:00Z' },
  { id: 'p1', url: 'https://example.com/centre.jpg', caption: '', postedAt: '2026-11-19T10:00:00Z' },
]

const media = (overrides = {}) => ({
  busy: '',
  error: '',
  onAdd: vi.fn(),
  onRemove: vi.fn(),
  onCaption: vi.fn(),
  onChooseProfile: vi.fn(),
  ...overrides,
})

describe('StepMedia', () => {
  it('shows each post with its caption and how many there are', () => {
    render(<StepMedia draft={{ posts, profilePhotoUrl: '' }} media={media()} />)
    expect(screen.getByLabelText('Caption of post 1')).toHaveValue('The Yaris')
    expect(screen.getByLabelText('Caption of post 2')).toHaveValue('')
    expect(screen.getByText('2 of 24 posts')).toBeInTheDocument()
  })

  it('saves a caption when its field is left', () => {
    const handlers = media()
    render(<StepMedia draft={{ posts, profilePhotoUrl: '' }} media={handlers} />)
    const field = screen.getByLabelText('Caption of post 2')
    fireEvent.change(field, { target: { value: 'Finglas test centre' } })
    fireEvent.blur(field)
    expect(handlers.onCaption).toHaveBeenCalledWith(posts[1], 'Finglas test centre')
  })

  it('removes a post and stars its photo as the profile photo', () => {
    const handlers = media()
    render(<StepMedia draft={{ posts, profilePhotoUrl: posts[0].url }} media={handlers} />)
    fireEvent.click(screen.getByLabelText('Remove post 2'))
    expect(handlers.onRemove).toHaveBeenCalledWith(posts[1])
    const star = screen.getByLabelText('Use the photo of post 1 as your profile photo')
    expect(star).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByLabelText('Use the photo of post 2 as your profile photo'))
    expect(handlers.onChooseProfile).toHaveBeenCalledWith(posts[1].url)
  })

  it('offers no more posts once the limit is reached', () => {
    const full = Array.from({ length: 24 }, (_, i) => ({ id: `p${i}`, url: `https://example.com/${i}.jpg`, caption: '', postedAt: null }))
    render(<StepMedia draft={{ posts: full, profilePhotoUrl: '' }} media={media()} />)
    expect(screen.getByRole('button', { name: 'No room for more posts' })).toBeDisabled()
  })
})
