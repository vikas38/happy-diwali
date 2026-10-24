import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import StickerBook from '../src/ui/StickerBook.jsx'
import RewardOverlay from '../src/ui/RewardOverlay.jsx'
import { createDefaultSave, validateSave } from '../src/store/save.js'
import { CRACKERS } from '../src/crackers/crackerDefs.js'

describe('DIW-032, DIW-033, DIW-034 — Discovery Album, Gentle Goals, and Result Summary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('DIW-033: Discovery Album', () => {
    it('groups stickers into Original Six, Festival Additions, and Sky Collection with accurate counts', () => {
      const stickers = [0, 1, 6, 10]
      render(
        <StickerBook
          stickers={stickers}
          onClose={vi.fn()}
          onUnlockAll={vi.fn()}
        />
      )

      expect(screen.getByRole('dialog')).toBeDefined()
      expect(screen.getByText(/Fireworks Album/i)).toBeDefined()

      // Group headers
      expect(screen.getByText(/Original Six/i)).toBeDefined()
      expect(screen.getByText(/Festival Additions/i)).toBeDefined()
      expect(screen.getByText(/Sky Collection/i)).toBeDefined()

      // Counts per group
      expect(screen.getByText('2 / 6')).toBeDefined()
      expect(screen.getAllByText('1 / 4').length).toBe(2)

      // Total count
      expect(screen.getByText('4 / 14 collected')).toBeDefined()
    })

    it('displays honest empty state when 0 stickers are collected', () => {
      render(
        <StickerBook
          stickers={[]}
          onClose={vi.fn()}
          onUnlockAll={vi.fn()}
        />
      )

      expect(
        screen.getByText(/Your album is waiting for its first spark/i)
      ).toBeDefined()
    })

    it('displays completed group badge when an entire group is collected', () => {
      const originalSixCollected = [0, 1, 2, 3, 4, 5]
      render(
        <StickerBook
          stickers={originalSixCollected}
          onClose={vi.fn()}
          onUnlockAll={vi.fn()}
        />
      )

      expect(screen.getAllByText(/Completed!/i).length).toBeGreaterThanOrEqual(1)
    })

    it('clicking an unlocked sticker invokes onSelectCracker', () => {
      const handleSelect = vi.fn()
      render(
        <StickerBook
          stickers={[0]}
          onClose={vi.fn()}
          onUnlockAll={vi.fn()}
          onSelectCracker={handleSelect}
        />
      )

      const phuljhariTile = screen.getByLabelText(/Phuljhari sticker collected/i)
      fireEvent.click(phuljhariTile)
      expect(handleSelect).toHaveBeenCalledWith(0)
    })
  })

  describe('DIW-032: Gentle Discovery Goals', () => {
    it('displays goals tab with the three timeless discoveries', () => {
      const gentleGoals = {
        groundAndSky: true,
        twoPalettes: false,
        decoratedCourtyard: false,
      }

      render(
        <StickerBook
          stickers={[0, 3]}
          gentleGoals={gentleGoals}
          onClose={vi.fn()}
          onUnlockAll={vi.fn()}
        />
      )

      // Switch to goals tab
      const goalsTab = screen.getByRole('tab', { name: /Festival Discoveries/i })
      fireEvent.click(goalsTab)

      expect(screen.getByText(/Courtyard & Sky Explorer/i)).toBeDefined()
      expect(screen.getByText(/Festival Colors/i)).toBeDefined()
      expect(screen.getByText(/Courtyard Decorator/i)).toBeDefined()

      // Completed goal badge
      expect(screen.getByText(/Discovered!/i)).toBeDefined()
    })
  })

  describe('DIW-034: Polished Result and Celebration Summary', () => {
    it('renders stars earned, next suggestion, and dismisses suggestion on click', () => {
      const handleLightAgain = vi.fn()
      const handleNext = vi.fn()

      const cracker = CRACKERS[0] // Phuljhari (ground)
      const gentleGoals = {
        groundAndSky: false,
        twoPalettes: false,
        decoratedCourtyard: false,
      }

      render(
        <RewardOverlay
          cracker={cracker}
          isNewSticker={true}
          onLightAgain={handleLightAgain}
          onNextCracker={handleNext}
          gentleGoals={gentleGoals}
        />
      )

      // New sticker celebration banner
      expect(screen.getByText(/New sticker unlocked/i)).toBeDefined()

      // Suggestion based on completing ground: suggests sky firework
      expect(screen.getByText(/Try a sky firework next!/i)).toBeDefined()

      // Dismiss suggestion
      const dismissBtn = screen.getByRole('button', { name: /Dismiss suggestion/i })
      fireEvent.click(dismissBtn)
      expect(screen.queryByText(/Try a sky firework next!/i)).toBeNull()
    })

    it('renders celebration sequence summary pill when in sequence playback', () => {
      const cracker = CRACKERS[1]
      render(
        <RewardOverlay
          cracker={cracker}
          isNewSticker={false}
          onLightAgain={vi.fn()}
          onNextCracker={vi.fn()}
          isSequence={true}
          sequenceIndex={1}
          sequenceTotal={3}
        />
      )

      expect(screen.getByText(/Show 2 of 3/i)).toBeDefined()
    })
  })
})
