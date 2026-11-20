import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import PostViewer from './PostViewer'

const posts = [
  { id: 'p2', url: 'https://example.com/car.jpg', caption: 'The Yaris', postedAt: '2026-11-20T10:00:00Z' },
  { id: 'p1', url: 'https://example.com/centre.jpg', caption: '', postedAt: '2026-11-19T10:00:00Z' },
]
const author = { name: 'Aoife Byrne', initials: 'AB', photo: '' }

const open = (index, handlers = {}) => {
  const props = { onIndex: vi.fn(), onClose: vi.fn(), ...handlers }
  render(<PostViewer posts={posts} index={index} author={author} {...props} />)
  return props
}

describe('PostViewer', () => {
  it('shows the post with who posted it, its caption and its date, and takes the focus', () => {
    open(0)
    const dialog = screen.getByRole('dialog', { name: 'Post 1 of 2' })
    expect(dialog).toHaveFocus()
    expect(screen.getByAltText('The Yaris')).toHaveAttribute('src', posts[0].url)
    expect(screen.getByText('Aoife Byrne')).toBeInTheDocument()
    expect(screen.getByText('20 Nov 2026')).toBeInTheDocument()
  })

  it('closes on Escape, on the close button and on the backdrop, not on the post itself', () => {
    const { onClose } = open(0)
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('steps through the posts with the arrow keys and buttons, and stops at either end', () => {
    const first = open(0)
    fireEvent.keyDown(document, { key: 'ArrowRight' })
    fireEvent.keyDown(document, { key: 'ArrowLeft' })
    expect(first.onIndex.mock.calls).toEqual([[1]])
    expect(screen.queryByRole('button', { name: 'Previous post' })).toBeNull()
  })

  it('goes back from the last post, with no way further on', () => {
    const last = open(1)
    fireEvent.click(screen.getByRole('button', { name: 'Previous post' }))
    expect(last.onIndex).toHaveBeenCalledWith(0)
    expect(screen.queryByRole('button', { name: 'Next post' })).toBeNull()
  })
})
