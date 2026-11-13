import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import ChipGroup from './ChipGroup'

const options = [
  { value: 'dublin', label: 'Dublin', hint: 'County Dublin' },
  { value: 'cork', label: 'Cork', hint: 'County Cork' },
]

describe('ChipGroup', () => {
  it('renders a button per option', () => {
    render(<ChipGroup options={options} selected={[]} onToggle={() => {}} label="Counties" />)
    expect(screen.getByRole('button', { name: 'Dublin' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cork' })).toBeInTheDocument()
  })

  it('marks selected options as pressed', () => {
    render(<ChipGroup options={options} selected={['cork']} onToggle={() => {}} label="Counties" />)
    expect(screen.getByRole('button', { name: 'Cork' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Dublin' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onToggle with the clicked value', () => {
    const onToggle = vi.fn()
    render(<ChipGroup options={options} selected={[]} onToggle={onToggle} label="Counties" />)
    fireEvent.click(screen.getByRole('button', { name: 'Dublin' }))
    expect(onToggle).toHaveBeenCalledWith('dublin')
  })
})
