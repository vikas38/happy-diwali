import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CrackerLibrary from '../src/ui/CrackerLibrary.jsx'
import { CRACKERS } from '../src/crackers/crackerDefs.js'

describe('DIW-010 — Create a browsable cracker library with filters and favourites', () => {
  it('renders all shipped crackers in the All category with correct counts', () => {
    render(
      <CrackerLibrary
        isOpen={true}
        onClose={vi.fn()}
        selectedCracker={0}
        unlocked={[0, 1]}
        favorites={[]}
        onToggleFavorite={vi.fn()}
        onSelect={vi.fn()}
      />
    )

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeTruthy()

    // All category chips exist with accurate counts
    const allChip = screen.getByRole('button', { name: /^All/i })
    expect(allChip).toBeTruthy()
    expect(allChip.getAttribute('aria-pressed')).toBe('true')
    expect(allChip.textContent).toContain(String(CRACKERS.length))

    const groundCount = CRACKERS.filter((c) => c.category === 'ground').length
    const skyCount = CRACKERS.filter((c) => c.category === 'sky').length

    const groundChip = screen.getByRole('button', { name: /^Ground/i })
    expect(groundChip).toBeTruthy()
    expect(groundChip.textContent).toContain(String(groundCount))

    const skyChip = screen.getByRole('button', { name: /^Sky/i })
    expect(skyChip).toBeTruthy()
    expect(skyChip.textContent).toContain(String(skyCount))

    // All shipped cards are rendered
    const listItems = screen.getAllByRole('listitem')
    expect(listItems.length).toBe(CRACKERS.length)
  })

  it('filters crackers by Ground and Sky categories accurately', () => {
    render(
      <CrackerLibrary
        isOpen={true}
        onClose={vi.fn()}
        selectedCracker={0}
        unlocked={[0, 1, 2, 3]}
        favorites={[]}
      />
    )

    const groundCount = CRACKERS.filter((c) => c.category === 'ground').length
    const groundChip = screen.getByRole('button', { name: /^Ground/i })

    // Click Ground filter
    fireEvent.click(groundChip)
    expect(groundChip.getAttribute('aria-pressed')).toBe('true')

    const groundCards = screen.getAllByRole('listitem')
    expect(groundCards.length).toBe(groundCount)
    expect(screen.getByText('Phuljhari')).toBeTruthy()
    expect(screen.getByText('Anar')).toBeTruthy()
    expect(screen.getByText('Chakri')).toBeTruthy()
    // Sky effects are filtered out
    expect(screen.queryByText('Rocket')).toBeNull()

    // Click Sky filter
    const skyCount = CRACKERS.filter((c) => c.category === 'sky').length
    const skyChip = screen.getByRole('button', { name: /^Sky/i })
    fireEvent.click(skyChip)
    expect(skyChip.getAttribute('aria-pressed')).toBe('true')

    const skyCards = screen.getAllByRole('listitem')
    expect(skyCards.length).toBe(skyCount)
    expect(screen.getByText('Rocket')).toBeTruthy()
    expect(screen.queryByText('Phuljhari')).toBeNull()
  })

  it('renders locked cards with locked status and hint, preventing selection', () => {
    const handleSelect = vi.fn()
    const handleClose = vi.fn()

    render(
      <CrackerLibrary
        isOpen={true}
        onClose={handleClose}
        selectedCracker={0}
        unlocked={[0]} // only 0 is unlocked
        favorites={[]}
        onSelect={handleSelect}
      />
    )

    // Phuljhari (unlocked & selected)
    const phuljhariCard = screen.getByRole('button', { name: /Select Phuljhari/i })
    expect(phuljhariCard.disabled).toBe(false)

    // Anar (locked)
    const anarCard = screen.getByRole('button', { name: /Select Anar/i })
    expect(anarCard.disabled).toBe(true)

    // Clicking locked item does not trigger select or close
    fireEvent.click(anarCard)
    expect(handleSelect).not.toHaveBeenCalled()
    expect(handleClose).not.toHaveBeenCalled()

    // Clicking unlocked item selects and closes
    fireEvent.click(phuljhariCard)
    expect(handleSelect).toHaveBeenCalledWith(0)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('toggles favourite status directly and displays empty favourites state when none exist', () => {
    const handleToggleFav = vi.fn()

    const { rerender } = render(
      <CrackerLibrary
        isOpen={true}
        onClose={vi.fn()}
        selectedCracker={0}
        unlocked={[0, 1]}
        favorites={[]} // empty favorites
        onToggleFavorite={handleToggleFav}
      />
    )

    // Click favourite heart on Phuljhari
    const favBtn = screen.getByRole('button', { name: /Add Phuljhari to favourites/i })
    fireEvent.click(favBtn)
    expect(handleToggleFav).toHaveBeenCalledWith(0)

    // Switch to Favourites filter
    const favChip = screen.getByRole('button', { name: /^Favourites/i })
    expect(favChip.textContent).toContain('0')
    fireEvent.click(favChip)

    // Empty favourites state rendered with friendly hint and reset button
    expect(screen.getByTestId('empty-favourites-state')).toBeTruthy()
    expect(screen.getByText(/No favourites saved yet/i)).toBeTruthy()

    // Reset button returns to All
    const resetBtn = screen.getByRole('button', { name: /Show all sparkles/i })
    fireEvent.click(resetBtn)
    expect(screen.queryByTestId('empty-favourites-state')).toBeNull()
    expect(screen.getAllByRole('listitem').length).toBe(CRACKERS.length)

    // Re-render with cracker 0 as favorite
    rerender(
      <CrackerLibrary
        isOpen={true}
        onClose={vi.fn()}
        selectedCracker={0}
        unlocked={[0, 1]}
        favorites={[0]}
        onToggleFavorite={handleToggleFav}
      />
    )

    // Switch back to Favourites filter
    const favChipWithCount = screen.getByRole('button', { name: /^Favourites/i })
    expect(favChipWithCount.textContent).toContain('1')
    fireEvent.click(favChipWithCount)

    const favList = screen.getAllByRole('listitem')
    expect(favList.length).toBe(1)
    expect(screen.getByText('Phuljhari')).toBeTruthy()
  })

  it('announces results count politely in a live region', () => {
    render(
      <CrackerLibrary
        isOpen={true}
        onClose={vi.fn()}
        selectedCracker={0}
        unlocked={[0, 1, 2]}
        favorites={[]}
      />
    )

    const liveRegion = screen.getByRole('status')
    expect(liveRegion.getAttribute('aria-live')).toBe('polite')
    expect(liveRegion.textContent).toContain(`${CRACKERS.length} sparkles shown`)
  })
})
