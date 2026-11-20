import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Highlights from './Highlights'

const highlights = [
  { id: 'areas', title: 'Areas', icon: 'pin', sections: [{ heading: 'Counties', items: ['Dublin', 'Kildare'] }] },
  { id: 'prices', title: 'Prices', icon: 'euro', sections: [{ heading: 'A lesson', items: ['€45'] }], note: 'Prices are set by the instructor.' },
]
const author = { name: 'Aoife Byrne', initials: 'AB', photo: '' }

describe('Highlights', () => {
  it('shows nothing when there is nothing to highlight', () => {
    const { container } = render(<Highlights highlights={[]} author={author} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('opens a highlight like a story, and steps on to the next', () => {
    render(<Highlights highlights={highlights} author={author} />)
    fireEvent.click(screen.getByRole('button', { name: 'Areas' }))
    expect(screen.getByRole('dialog', { name: 'Areas, 1 of 2' })).toHaveFocus()
    expect(screen.getByText('Kildare')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(screen.getByRole('dialog', { name: 'Prices, 2 of 2' })).toBeInTheDocument()
    expect(screen.getByText('Prices are set by the instructor.')).toBeInTheDocument()
  })

  it('closes after the last highlight, and on Escape, giving the focus back', () => {
    render(<Highlights highlights={highlights} author={author} />)
    const prices = screen.getByRole('button', { name: 'Prices' })
    prices.focus()
    fireEvent.click(prices)
    fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(prices).toHaveFocus()

    fireEvent.click(prices)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
