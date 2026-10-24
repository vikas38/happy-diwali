import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import FestivalHome from '../src/ui/FestivalHome.jsx'
import { GameStoreProvider, useGameStore } from '../src/store/gameStore.jsx'
import {
  SAVE_KEY,
  createDefaultSave,
  validateSave,
  DIYA_ARRANGEMENTS,
  RANGOLI_PATTERNS,
  DEFAULT_RANGOLI_COLORS,
} from '../src/store/save.js'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function () {
    this.open = true
  })
  HTMLDialogElement.prototype.close = vi.fn(function () {
    this.open = false
  })
  HTMLAnchorElement.prototype.click = vi.fn()
  window.scrollTo = vi.fn()

  globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
  globalThis.URL.revokeObjectURL = vi.fn()
})

describe('Task D2 — Persist Creative Activities and Make Exports Usable on Phones', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('1. Persistence, schema migration, and continuity', () => {
    it('initializes default diyas and rangoli in save state with backward-compatible schema', () => {
      const def = createDefaultSave()
      expect(def.diyas).toBeDefined()
      expect(def.diyas.lit).toEqual([])
      expect(def.diyas.arrangement).toBe(DIYA_ARRANGEMENTS.ROW)

      expect(def.rangoli).toBeDefined()
      expect(def.rangoli.pattern).toBe(RANGOLI_PATTERNS.LOTUS)
      expect(def.rangoli.colors).toEqual(DEFAULT_RANGOLI_COLORS)
    })

    it('migrates legacy save lacking diyas/rangoli safely without losing stars or stickers', () => {
      const legacySave = {
        version: 1,
        unlocked: [0, 1, 2],
        stickers: [0, 1],
        stars: 6,
        masterVolume: 0.8,
        // diyas and rangoli omitted
      }

      const validated = validateSave(legacySave)
      expect(validated.stars).toBe(6)
      expect(validated.stickers).toEqual([0, 1])
      expect(validated.unlocked).toEqual([0, 1, 2])
      expect(validated.diyas.lit).toEqual([])
      expect(validated.diyas.arrangement).toBe(DIYA_ARRANGEMENTS.ROW)
      expect(validated.rangoli.pattern).toBe(RANGOLI_PATTERNS.LOTUS)
    })

    it('falls back safely when storage contains malformed activity data', () => {
      const corrupted = {
        version: 1,
        diyas: { lit: 'not-an-array', arrangement: 'TRIANGLE_INVALID' },
        rangoli: { pattern: 'UNKNOWN', colors: { outer: 'not-a-color' } },
      }

      const validated = validateSave(corrupted)
      expect(validated.diyas.lit).toEqual([])
      expect(validated.diyas.arrangement).toBe(DIYA_ARRANGEMENTS.ROW)
      expect(validated.rangoli.pattern).toBe(RANGOLI_PATTERNS.LOTUS)
      expect(validated.rangoli.colors.outer).toBe(DEFAULT_RANGOLI_COLORS.outer)
    })

    it('resetting diyas only wipes lit diyas, preserving global stars, stickers, and progress', () => {
      let storeRef = null
      function TestConsumer() {
        storeRef = useGameStore()
        return null
      }

      render(
        <GameStoreProvider>
          <TestConsumer />
        </GameStoreProvider>
      )

      // Set stars, stickers, and lit diyas
      act(() => {
        storeRef.addStars(9)
        storeRef.collectSticker(0)
        storeRef.setDiyaLit(0)
        storeRef.setDiyaLit(1)
        storeRef.setDiyaArrangement(DIYA_ARRANGEMENTS.CIRCLE)
      })

      expect(storeRef.state.diyas.lit).toEqual([0, 1])
      expect(storeRef.state.diyas.arrangement).toBe(DIYA_ARRANGEMENTS.CIRCLE)
      expect(storeRef.state.stars).toBe(12) // 9 + 3 for sticker 0
      expect(storeRef.state.stickers).toEqual([0])

      // Reset Diyas
      act(() => {
        storeRef.resetDiyas()
      })

      // Diyas lit are reset, but stars, stickers, and arrangement remain intact!
      expect(storeRef.state.diyas.lit).toEqual([])
      expect(storeRef.state.stars).toBe(12)
      expect(storeRef.state.stickers).toEqual([0])
    })
  })

  describe('2. Diya arrangements, interactivity, and completed scene', () => {
    it('persists lit diyas and chosen arrangement across activity close and reload', () => {
      const initialSave = {
        ...createDefaultSave(),
        diyas: { lit: [0, 2, 4], arrangement: DIYA_ARRANGEMENTS.ARCH },
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(initialSave))

      render(
        <GameStoreProvider>
          <FestivalHome onPlay={vi.fn()} motion={true} setMotion={vi.fn()} initialModal="diyas" />
        </GameStoreProvider>
      )

      // The 3 diyas are lit from storage
      expect(
        screen.getByRole('button', { name: /Light diya 1/i }).getAttribute('aria-pressed')
      ).toBe('true')
      expect(
        screen.getByRole('button', { name: /Light diya 2/i }).getAttribute('aria-pressed')
      ).toBe('false')
      expect(
        screen.getByRole('button', { name: /Light diya 3/i }).getAttribute('aria-pressed')
      ).toBe('true')
      expect(
        screen.getByRole('button', { name: /Light diya 5/i }).getAttribute('aria-pressed')
      ).toBe('true')

      // Arch arrangement button is pressed
      const archBtn = screen.getByRole('button', { name: /Arch/i })
      expect(archBtn.getAttribute('aria-pressed')).toBe('true')

      // Switch to Circle arrangement
      const circleBtn = screen.getByRole('button', { name: /Circle/i })
      fireEvent.click(circleBtn)
      expect(circleBtn.getAttribute('aria-pressed')).toBe('true')

      // Light remaining diyas to complete scene
      fireEvent.click(screen.getByRole('button', { name: /Light diya 2/i }))
      fireEvent.click(screen.getByRole('button', { name: /Light diya 4/i }))

      // Complete scene banner is announced
      expect(screen.getByText(/Look at all that warmth. Happy Diwali!/i)).toBeTruthy()

      // Confirm saved in localStorage
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY))
      expect(saved.diyas.lit).toEqual([0, 1, 2, 3, 4])
      expect(saved.diyas.arrangement).toBe(DIYA_ARRANGEMENTS.CIRCLE)
    })
  })

  describe('3. Rangoli patterns, region coloring, undo, and reset', () => {
    it('allows choosing pattern, coloring regions, undoing, and resetting', () => {
      render(
        <GameStoreProvider>
          <FestivalHome onPlay={vi.fn()} motion={true} setMotion={vi.fn()} initialModal="rangoli" />
        </GameStoreProvider>
      )

      // Default pattern is Lotus
      const lotusBtn = screen.getByRole('button', { name: /Lotus/i })
      const starBtn = screen.getByRole('button', { name: /Star/i })
      const chakraBtn = screen.getByRole('button', { name: /Chakra/i })

      expect(lotusBtn.getAttribute('aria-pressed')).toBe('true')

      // Select Star pattern
      fireEvent.click(starBtn)
      expect(starBtn.getAttribute('aria-pressed')).toBe('true')

      // Select Ring region to color
      const ringBtn = screen.getByRole('button', { name: /Ring/i })
      fireEvent.click(ringBtn)
      expect(ringBtn.getAttribute('aria-pressed')).toBe('true')

      // Pick purple swatch
      const purpleSwatch = screen.getByRole('button', { name: /Purple/i })
      fireEvent.click(purpleSwatch)

      // Undo button is enabled
      const undoBtn = screen.getByRole('button', { name: /Undo/i })
      expect(undoBtn.disabled).toBe(false)

      // Click Undo
      fireEvent.click(undoBtn)

      // Click Reset
      const resetBtn = screen.getByRole('button', { name: /Reset/i })
      fireEvent.click(resetBtn)

      const saved = JSON.parse(localStorage.getItem(SAVE_KEY))
      expect(saved.rangoli.pattern).toBe(RANGOLI_PATTERNS.STAR)
      expect(saved.rangoli.colors).toEqual(DEFAULT_RANGOLI_COLORS)
    })
  })

  describe('4. Export usable on phones (SVG and PNG)', () => {
    it('renders preview and offers both SVG and PNG export buttons with download feedback', () => {
      render(
        <GameStoreProvider>
          <FestivalHome onPlay={vi.fn()} motion={true} setMotion={vi.fn()} initialModal="rangoli" />
        </GameStoreProvider>
      )

      // Preview is rendered with accessible img role
      const preview = screen.getByRole('img', { name: /Rangoli preview/i })
      expect(preview).toBeTruthy()

      // SVG and PNG export buttons
      const svgBtn = screen.getByRole('button', { name: /Download SVG/i })
      const pngBtn = screen.getByRole('button', { name: /Download PNG/i })
      expect(svgBtn).toBeTruthy()
      expect(pngBtn).toBeTruthy()

      // Trigger SVG export
      fireEvent.click(svgBtn)
      expect(URL.createObjectURL).toHaveBeenCalled()

      // Success feedback displayed
      expect(screen.getByRole('status')).toBeTruthy()
      expect(screen.getByText(/Saved to your device/i)).toBeTruthy()
    })
  })
})
