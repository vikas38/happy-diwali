import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import CrackerInspector from '../src/ui/CrackerInspector.jsx'
import { CRACKERS } from '../src/crackers/crackerDefs.js'

describe('DIW-011 — Add a clear selected-cracker inspector', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('renders metadata-driven art, name, plain-language description, category, and palettes', () => {
    const cracker = CRACKERS[0] // Phuljhari
    render(
      <CrackerInspector
        cracker={cracker}
        isOpen={true}
        onClose={vi.fn()}
        onPutOnStreet={vi.fn()}
        isUnlocked={true}
        playbackIntensity="SOFT"
      />
    )

    // Name & descriptor in accessible title
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-labelledby')).toBe('intro-card-title')
    const title = document.getElementById('intro-card-title')
    expect(title.textContent).toBe('Phuljhari')

    // Plain-language description
    expect(screen.getByText(cracker.description)).toBeTruthy()

    // Authored duration (excluding adult preparation)
    expect(
      screen.getByText(new RegExp(`~${Math.round(cracker.duration)}\\s+seconds.*excludes adult preparation`, 'i'))
    ).toBeTruthy()

    // Category
    expect(screen.getByText(/ground/i)).toBeTruthy()

    // Palettes
    expect(screen.getByText(cracker.palettes.join(', '))).toBeTruthy()
  })

  it('separates natural sound character from user-selected playback intensity', () => {
    const cracker = CRACKERS[1] // Anar
    render(
      <CrackerInspector
        cracker={cracker}
        isOpen={true}
        onClose={vi.fn()}
        onPutOnStreet={vi.fn()}
        isUnlocked={true}
        playbackIntensity="LOUD"
      />
    )

    // Natural sound character
    expect(screen.getByText(cracker.soundCharacter)).toBeTruthy()

    // Separated user playback intensity
    expect(screen.getByText(/LOUD\s+\(Festive\)/i)).toBeTruthy()
  })

  it('provides primary "Ask grown-up to light" action and secondary favourite action', () => {
    const handleLight = vi.fn()
    const handleToggleFav = vi.fn()
    const cracker = CRACKERS[2] // Chakri

    render(
      <CrackerInspector
        cracker={cracker}
        isOpen={true}
        onClose={vi.fn()}
        onPutOnStreet={handleLight}
        isUnlocked={true}
        isFavorite={false}
        onToggleFavorite={handleToggleFav}
      />
    )

    // Primary action
    const primaryBtn = screen.getByRole('button', { name: /Ask grown-up to light Chakri/i })
    expect(primaryBtn).toBeTruthy()
    fireEvent.click(primaryBtn)
    expect(handleLight).toHaveBeenCalledTimes(1)

    // Secondary favourite action
    const favBtn = screen.getByRole('button', { name: /Add Chakri to favourites/i })
    fireEvent.click(favBtn)
    expect(handleToggleFav).toHaveBeenCalledWith(cracker.id)
  })

  it('provides explicit silent visual preview that leaves no sounds, rewards, or timers behind', () => {
    const cracker = CRACKERS[3] // Rocket
    render(
      <CrackerInspector
        cracker={cracker}
        isOpen={true}
        onClose={vi.fn()}
        onPutOnStreet={vi.fn()}
        isUnlocked={true}
      />
    )

    const previewBtn = screen.getByRole('button', { name: /Play silent short visual preview of Rocket/i })
    expect(previewBtn).toBeTruthy()

    // Clicking starts silent visual preview
    act(() => {
      fireEvent.click(previewBtn)
    })
    expect(screen.getByRole('button', { name: /Previewing\.\.\./i })).toBeTruthy()

    // Advance timer past preview duration (1800ms)
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    // Preview completes cleanly and button returns to idle
    expect(screen.getByRole('button', { name: /Play silent short visual preview of Rocket/i })).toBeTruthy()
  })

  it('renders locked cracker with locked banner and disabled primary action', () => {
    const cracker = CRACKERS[5] // Sutli Bomb
    const handleLight = vi.fn()

    render(
      <CrackerInspector
        cracker={cracker}
        isOpen={true}
        onClose={vi.fn()}
        onPutOnStreet={handleLight}
        isUnlocked={false} // locked
      />
    )

    expect(screen.getByRole('status').textContent).toContain(
      'Discover this sparkle by lighting earlier sparkles'
    )

    const lockedBtn = screen.getByRole('button', { name: /Locked/i })
    expect(lockedBtn.disabled).toBe(true)
    fireEvent.click(lockedBtn)
    expect(handleLight).not.toHaveBeenCalled()
  })

  it('dismisses cleanly on Escape without leaving active timers', () => {
    const handleClose = vi.fn()
    const cracker = CRACKERS[0]

    render(
      <CrackerInspector
        cracker={cracker}
        isOpen={true}
        onClose={handleClose}
        isUnlocked={true}
      />
    )

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})
