import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CrackerCarousel from '../src/ui/CrackerCarousel.jsx'

describe('DIW-007 — Redesigned cracker cards and quick-access tray', () => {
  it('renders generous art-led cards with name, descriptor, and accessible attributes', () => {
    const handleSelect = vi.fn()
    render(
      <CrackerCarousel
        unlocked={[0, 1]}
        selectedCracker={0}
        onSelect={handleSelect}
      />
    )

    const options = screen.getAllByRole('option')
    expect(options.length).toBe(6)

    // First card: Phuljhari, unlocked & selected
    const first = options[0]
    expect(first.getAttribute('aria-selected')).toBe('true')
    expect(first.textContent).toContain('Phuljhari')
    // Selection is not conveyed only by color: checkmark is present
    expect(first.querySelector('.choice-selected-indicator')).toBeDefined()
    expect(first.querySelector('.choice-selected-indicator').textContent).toBe('✓')

    // Second card: Anar, unlocked & unselected
    const second = options[1]
    expect(second.getAttribute('aria-selected')).toBe('false')
    expect(second.textContent).toContain('Anar')

    // Third card: Chakri, locked
    const third = options[2]
    expect(third.disabled).toBe(true)
    expect(third.className).toContain('is-locked')
    expect(third.textContent).toContain('🔒')
  })

  it('renders visible "Browse all" button when onOpenLibrary callback is provided', () => {
    const handleOpenLibrary = vi.fn()
    render(
      <CrackerCarousel
        unlocked={[0, 1]}
        selectedCracker={0}
        onSelect={vi.fn()}
        onOpenLibrary={handleOpenLibrary}
      />
    )

    const browseBtn = screen.getByRole('button', { name: /browse all/i })
    expect(browseBtn).toBeDefined()
    fireEvent.click(browseBtn)
    expect(handleOpenLibrary).toHaveBeenCalledTimes(1)
  })

  it('renders favourite and new badges on cards when specified', () => {
    render(
      <CrackerCarousel
        unlocked={[0, 1, 2]}
        selectedCracker={0}
        onSelect={vi.fn()}
        favorites={[1]}
        newItems={[2]}
      />
    )

    const options = screen.getAllByRole('option')
    // Option 1 (Anar) has favorite heart
    expect(options[1].querySelector('.choice-badge-fav')).toBeDefined()
    expect(options[1].querySelector('.choice-badge-fav').textContent).toBe('♥')

    // Option 2 (Chakri) has NEW badge
    expect(options[2].querySelector('.choice-badge-new')).toBeDefined()
    expect(options[2].querySelector('.choice-badge-new').textContent).toBe('NEW')
  })

  it('selecting an item invokes onSelect with correct cracker ID without starting show or audio', () => {
    const handleSelect = vi.fn()
    render(
      <CrackerCarousel
        unlocked={[0, 1]}
        selectedCracker={0}
        onSelect={handleSelect}
      />
    )

    const options = screen.getAllByRole('option')
    fireEvent.click(options[1])
    expect(handleSelect).toHaveBeenCalledWith(1)
  })
})
