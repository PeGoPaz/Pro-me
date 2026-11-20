import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import StoryPlayer from './StoryPlayer'

const author = (id, name) => ({ id, userId: `u-${id}`, name, photo: '', isVerified: false, acceptingNewStudents: true })
const stories = [
  {
    author: author('a', 'Aoife Byrne'),
    posts: [
      { id: 'a1', url: 'https://example.com/a1.jpg', caption: 'Monday', postedAt: '2026-11-16T10:00:00Z' },
      { id: 'a2', url: 'https://example.com/a2.jpg', caption: 'Today', postedAt: '2026-11-20T10:00:00Z' },
    ],
  },
  { author: author('c', 'Cian Murphy'), posts: [{ id: 'c1', url: 'https://example.com/c1.jpg', caption: 'Hill starts', postedAt: '2026-11-19T10:00:00Z' }] },
]

const play = (start = 0) => {
  const handlers = { onSeen: vi.fn(), onClose: vi.fn() }
  render(
    <MemoryRouter>
      <StoryPlayer stories={stories} start={start} now={new Date('2026-11-20T12:00:00Z')} {...handlers} />
    </MemoryRouter>,
  )
  return handlers
}

describe('StoryPlayer', () => {
  it('plays an instructor\'s posts oldest first, then the next instructor, then closes', () => {
    const { onSeen, onClose } = play()
    expect(screen.getByRole('dialog', { name: "Aoife Byrne's story, 1 of 2" })).toHaveFocus()
    expect(screen.getByText('Monday')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(screen.getByText('Today')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('dialog', { name: "Cian Murphy's story, 1 of 1" })).toBeInTheDocument()

    expect(onSeen.mock.calls.map(([id, postedAt]) => `${id} ${postedAt}`)).toEqual([
      'a 2026-11-16T10:00:00Z',
      'a 2026-11-20T10:00:00Z',
      'c 2026-11-19T10:00:00Z',
    ])
    fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('goes back within a story and to the start of the one before, but not before the first', () => {
    play(1)
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled()
    fireEvent.keyDown(document, { key: 'ArrowLeft' })
    expect(screen.getByText('Monday')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
  })

  it('closes on Escape and links to a lesson request', () => {
    const { onClose } = play()
    expect(screen.getByRole('link', { name: 'Request a lesson' })).toHaveAttribute('href', '/booking?instructor=u-a')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })
})
