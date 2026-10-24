import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import IntroCard from '../src/ui/IntroCard.jsx'
import RewardOverlay from '../src/ui/RewardOverlay.jsx'
import SafetySplash from '../src/ui/SafetySplash.jsx'
import CalmCorner from '../src/ui/CalmCorner.jsx'
import StickerBook from '../src/ui/StickerBook.jsx'
import Countdown from '../src/ui/Countdown.jsx'
import { GameController, STATES } from '../src/fsm/GameController.js'
import { CRACKERS } from '../src/crackers/crackerDefs.js'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function () {
    this.open = true
  })
  HTMLDialogElement.prototype.close = vi.fn(function () {
    this.open = false
  })
})

describe('Task U5 — Unify Dialogs, Focus Management, and Nonvisual Feedback', () => {
  describe('Accessible titles via aria-labelledby', () => {
    it('connects IntroCard dialog to its visible heading via aria-labelledby', () => {
      render(<IntroCard cracker={CRACKERS[0]} onPutOnStreet={vi.fn()} onCancel={vi.fn()} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog.getAttribute('aria-labelledby')).toBe('intro-card-title')
      const title = document.getElementById('intro-card-title')
      expect(title).not.toBeNull()
      expect(title.textContent).toContain('Phuljhari')
    })

    it('connects RewardOverlay dialog to its visible heading via aria-labelledby', () => {
      render(
        <RewardOverlay
          cracker={CRACKERS[0]}
          isNewSticker={true}
          onLightAgain={vi.fn()}
          onNextCracker={vi.fn()}
          onSkip={vi.fn()}
          isLastCracker={false}
        />
      )
      const dialog = screen.getByRole('dialog')
      expect(dialog.getAttribute('aria-labelledby')).toBe('reward-card-title')
      const title = document.getElementById('reward-card-title')
      expect(title).not.toBeNull()
      expect(title.textContent).toContain('wonder')
    })

    it('connects SafetySplash dialog to its visible heading via aria-labelledby', () => {
      render(<SafetySplash onStart={vi.fn()} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog.getAttribute('aria-labelledby')).toBe('safety-splash-title')
      const title = document.getElementById('safety-splash-title')
      expect(title).not.toBeNull()
    })

    it('connects CalmCorner dialog to its visible heading via aria-labelledby', () => {
      render(<CalmCorner onResume={vi.fn()} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog.getAttribute('aria-labelledby')).toBe('calm-corner-title')
      const title = document.getElementById('calm-corner-title')
      expect(title).not.toBeNull()
    })

    it('connects StickerBook dialog to its visible heading via aria-labelledby', () => {
      render(<StickerBook stickers={[0]} onClose={vi.fn()} onUnlockAll={vi.fn()} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog.getAttribute('aria-labelledby')).toBe('sticker-book-title')
      const title = document.getElementById('sticker-book-title')
      expect(title).not.toBeNull()
      expect(title.textContent).toContain('Sticker Book')
    })
  })

  describe('Escape key dismissal and safe cancellation contracts', () => {
    it('cancels IntroCard back to tray when Escape is pressed or close button is clicked', () => {
      const handleCancel = vi.fn()
      render(<IntroCard cracker={CRACKERS[0]} onPutOnStreet={vi.fn()} onCancel={handleCancel} />)

      // Escape key triggers cancel
      fireEvent.keyDown(window, { key: 'Escape' })
      expect(handleCancel).toHaveBeenCalledTimes(1)

      // Close button also triggers cancel
      const closeBtn = screen.getByRole('button', { name: /Close dialog/i })
      fireEvent.click(closeBtn)
      expect(handleCancel).toHaveBeenCalledTimes(2)
    })

    it('GameController cancelIntro returns legally from CRACKER_INTRO_CARD to IDLE', () => {
      const gc = new GameController(STATES.IDLE)
      gc.init({
        sound: {
          init: vi.fn(),
          resume: vi.fn().mockResolvedValue(),
          stopMusic: vi.fn(),
          setMasterVolume: vi.fn(),
        },
        store: {
          getState: () => ({ masterVolume: 0.7 }),
          isUnlocked: () => true,
          hasSeenIntro: () => false,
        },
        chhotu: { setPosition: vi.fn(), setFacing: vi.fn(), setArmState: vi.fn() },
        pip: { setPosition: vi.fn(), setMood: vi.fn() },
        background: { setGameState: vi.fn() },
        renderer: { width: 800, height: 600 },
      })

      // Select cracker with unseen intro -> CRACKER_INTRO_CARD
      gc.selectCracker(0)
      expect(gc.state).toBe(STATES.CRACKER_INTRO_CARD)

      // Cancel introduction -> transitions legally back to IDLE
      gc.cancelIntro()
      expect(gc.state).toBe(STATES.IDLE)
      expect(gc.getSnapshot().uiData.cracker).toBeNull()
    })

    it('RewardOverlay dismisses cleanly when Escape is pressed', () => {
      const handleSkip = vi.fn()
      render(
        <RewardOverlay
          cracker={CRACKERS[0]}
          isNewSticker={false}
          onLightAgain={vi.fn()}
          onNextCracker={vi.fn()}
          onSkip={handleSkip}
          isLastCracker={false}
        />
      )

      fireEvent.keyDown(window, { key: 'Escape' })
      expect(handleSkip).toHaveBeenCalledTimes(1)
    })

    it('SafetySplash dismisses cleanly when Escape is pressed', () => {
      const handleStart = vi.fn()
      render(<SafetySplash onStart={handleStart} />)

      fireEvent.keyDown(window, { key: 'Escape' })
      expect(handleStart).toHaveBeenCalledTimes(1)
    })
  })

  describe('Nonvisual feedback: restrained polite announcements without duplication', () => {
    it('Countdown announces via polite live region without duplicate parent aria-label', () => {
      render(<Countdown countdownNumber={3} />)

      const liveRegion = document.querySelector('.countdown-overlay')
      expect(liveRegion.getAttribute('aria-live')).toBe('polite')
      expect(liveRegion.getAttribute('role')).toBe('status')
      // No duplicate aria-label on the live-region container to avoid double screen-reader utterances
      expect(liveRegion.getAttribute('aria-label')).toBeNull()

      // The child sr-only span provides the single clean polite announcement
      const srOnly = liveRegion.querySelector('.sr-only')
      expect(srOnly).not.toBeNull()
      expect(srOnly.textContent).toBe('Countdown: 3')
    })
  })
})
