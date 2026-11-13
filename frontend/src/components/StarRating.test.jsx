import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { StarDisplay, StarPicker } from './StarRating'

describe('StarDisplay', () => {
  it('renders five stars', () => {
    const { container } = render(<StarDisplay rating={4} />)
    expect(container.querySelectorAll('svg')).toHaveLength(5)
  })

  it('labels the row with the rating', () => {
    render(<StarDisplay rating={4} />)
    expect(screen.getByLabelText('4 out of 5 stars')).toBeInTheDocument()
  })
})

describe('StarPicker', () => {
  it('calls onChange with the clicked star', () => {
    const onChange = vi.fn()
    render(<StarPicker value={0} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('3 stars'))
    expect(onChange).toHaveBeenCalledWith(3)
  })

  it('renders one button per star', () => {
    render(<StarPicker value={0} onChange={() => {}} />)
    expect(screen.getAllByRole('button')).toHaveLength(5)
  })
})
