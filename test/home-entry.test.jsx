import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import App from '../src/App.jsx'
import HUD from '../src/ui/HUD.jsx'
import FestivalHome from '../src/ui/FestivalHome.jsx'
import { GameStoreProvider } from '../src/store/gameStore.jsx'
import { SAVE_KEY } from '../src/store/save.js'

beforeAll(() => {
  // Mock dialog methods for jsdom
  HTMLDialogElement.prototype.showModal = vi.fn(function () {
    this.open = true
  })
  HTMLDialogElement.prototype.close = vi.fn(function () {
    this.open = false
  })

  // Mock canvas 2D context
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    drawImage: vi.fn(),
    measureText: () => ({ width: 0 }),
    createRadialGradient: () => ({ addColorStop: vi.fn() }),
    createLinearGradient: () => ({ addColorStop: vi.fn() }),
  }))

  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))

  window.scrollTo = vi.fn()
})

describe('T01 — Home Entry & Navigation', () => {
  beforeEach(() => {
    localStorage.clear()

    // Mock dialog methods for jsdom
    HTMLDialogElement.prototype.showModal = vi.fn(function () {
      this.open = true
    })
    HTMLDialogElement.prototype.close = vi.fn(function () {
      this.open = false
    })

    // Mock canvas 2D context using Proxy so any 2D canvas method works in tests
    HTMLCanvasElement.prototype.getContext = vi.fn(() => {
      const ctx = {
        canvas: {},
        measureText: () => ({ width: 0 }),
        createRadialGradient: () => ({ addColorStop: vi.fn() }),
        createLinearGradient: () => ({ addColorStop: vi.fn() }),
        setLineDash: vi.fn(),
        getLineDash: () => [],
      }
      return new Proxy(ctx, {
        get(target, prop) {
          if (prop in target) return target[prop]
          return vi.fn()
        },
        set(target, prop, value) {
          target[prop] = value
          return true
        },
      })
    })
  })

  it('renders dominant Play action on Home screen', () => {
    render(
      <GameStoreProvider>
        <FestivalHome onPlay={vi.fn()} motion={true} setMotion={vi.fn()} />
      </GameStoreProvider>
    )

    const playBtn = screen.getByRole('button', { name: /Play Little Lights/i })
    expect(playBtn).toBeTruthy()
    expect(playBtn.className).toContain('play-dominant-btn')
  })

  it('navigates from Home to Courtyard in a single tap on Play', async () => {
    render(<App />)

    // Initially at Home
    expect(screen.getByRole('button', { name: /Play Little Lights/i })).toBeTruthy()

    // Single tap on Play
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Play Little Lights/i }))
    })

    // Reaches Courtyard immediately (Back to festival and wordmark present)
    expect(screen.getByRole('button', { name: /Back to festival/i })).toBeTruthy()
    expect(screen.getByText('THE DIWALI COURTYARD')).toBeTruthy()
  })

  it('returns to Home cleanly without confirmation prompt', async () => {
    render(<App />)

    // Tap Play to enter Courtyard
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Play Little Lights/i }))
    })
    expect(screen.getByRole('button', { name: /Back to festival/i })).toBeTruthy()

    // Tap Back to festival
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Back to festival/i }))
    })

    // Returns to Home
    expect(screen.getByRole('button', { name: /Play Little Lights/i })).toBeTruthy()
  })

  it('shows first-run hint on fresh save and dismisses upon interaction', async () => {
    render(<App />)

    // Enter Courtyard
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Play Little Lights/i }))
    })

    // First-run hint is visible
    expect(screen.getByText(/Choose a sparkle below to begin your celebration/i)).toBeTruthy()

    // Tap dismiss button
    const dismissBtn = screen.getByRole('button', { name: /Dismiss hint/i })
    await act(async () => {
      fireEvent.click(dismissBtn)
    })

    // Hint is gone
    expect(screen.queryByText(/Choose a sparkle below to begin your celebration/i)).toBeNull()

    // Saved to localStorage
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY))
    expect(saved.seenHint).toBe(true)
  })

  it('volume and level controls live ONLY inside Settings sheet; Take a breath is outside', async () => {
    const handleVolume = vi.fn()
    const handleIntensity = vi.fn()
    const handleCalm = vi.fn()

    render(
      <HUD
        onBack={vi.fn()}
        reducedMotion={false}
        onToggleMotion={vi.fn()}
        showSettings={true}
        masterVolume={0.7}
        intensity="SOFT"
        stars={3}
        onVolumeChange={handleVolume}
        onIntensityChange={handleIntensity}
        onOpenStickerBook={vi.fn()}
        onCalmCorner={handleCalm}
      />
    )

    // Take a breath is visible directly in the HUD
    const breathBtn = screen.getByRole('button', { name: /Take a breath/i })
    expect(breathBtn).toBeTruthy()

    // Volume slider and Sound mode buttons are NOT visible before opening settings
    expect(screen.queryByLabelText(/Master Volume/i)).toBeNull()
    expect(screen.queryByRole('group', { name: /Sound Level/i })).toBeNull()

    // Click Settings button
    const settingsBtn = screen.getByRole('button', { name: /Settings/i })
    await act(async () => {
      fireEvent.click(settingsBtn)
    })

    // Volume slider and Sound Level controls are now available inside the sheet
    const volumeSlider = screen.getByLabelText(/Master Volume/i)
    expect(volumeSlider).toBeTruthy()
    expect(screen.getByRole('group', { name: /Sound Level/i })).toBeTruthy()

    // Take a breath is STILL outside the sheet
    expect(screen.getByRole('button', { name: /Take a breath/i })).toBeTruthy()

    // Interacting with controls in the sheet works
    fireEvent.change(volumeSlider, { target: { value: '50' } })
    expect(handleVolume).toHaveBeenCalledWith(0.5)

    const naturalBtn = screen.getByRole('button', { name: /Natural/i })
    fireEvent.click(naturalBtn)
    expect(handleIntensity).toHaveBeenCalledWith('NORMAL')

    // Close settings sheet with Done
    const doneBtn = screen.getByRole('button', { name: /Done/i })
    await act(async () => {
      fireEvent.click(doneBtn)
    })

    // Sheet is closed
    expect(screen.queryByLabelText(/Master Volume/i)).toBeNull()
  })

  it('For Grown-ups cannot be opened by a single accidental tap, but opens via keyboard', async () => {
    render(
      <GameStoreProvider>
        <FestivalHome onPlay={vi.fn()} motion={true} setMotion={vi.fn()} />
      </GameStoreProvider>
    )

    const grownUpsBtn = screen.getByRole('button', { name: /For grown-ups/i })

    // Single click does NOT open parents modal
    await act(async () => {
      fireEvent.click(grownUpsBtn)
    })
    expect(screen.queryByText(/Little moments, thoughtfully made/i)).toBeNull()

    // Keyboard Enter DOES open it
    await act(async () => {
      fireEvent.keyDown(grownUpsBtn, { key: 'Enter' })
    })
    expect(screen.getByText(/Little moments, thoughtfully made/i)).toBeTruthy()
  })

  it('For Grown-ups opens after 800ms press-and-hold', async () => {
    vi.useFakeTimers()
    try {
      render(
        <GameStoreProvider>
          <FestivalHome onPlay={vi.fn()} motion={true} setMotion={vi.fn()} />
        </GameStoreProvider>
      )

      const grownUpsBtn = screen.getByRole('button', { name: /For grown-ups/i })

      // Pointer down starts hold
      act(() => {
        fireEvent.pointerDown(grownUpsBtn)
      })
      expect(screen.queryByText(/Little moments, thoughtfully made/i)).toBeNull()

      // Advance by 850ms
      act(() => {
        vi.advanceTimersByTime(850)
      })

      // Modal is now open!
      expect(screen.getByText(/Little moments, thoughtfully made/i)).toBeTruthy()
    } finally {
      vi.useRealTimers()
    }
  })
})
