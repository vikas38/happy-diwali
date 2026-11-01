import React, { useRef, useState } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import ModalOverlay from '../src/ui/controls/ModalOverlay.jsx'
import { GameController, STATES } from '../src/fsm/GameController.js'
import { GameStoreProvider, useGameStore } from '../src/store/gameStore.jsx'
import { CRACKERS } from '../src/crackers/crackerDefs.js'

describe('DIW-015 — Unify drawers, dialogs, and focus restoration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('ModalOverlay interaction contract & accessible presentation', () => {
    it('renders with role="dialog", aria-modal="true", and connects title & subtitle via aria attributes', () => {
      const handleClose = vi.fn()
      render(
        <ModalOverlay
          isOpen={true}
          onClose={handleClose}
          title="Wonder Library"
          subtitle="Discover ground and sky celebrations"
        >
          <button type="button">Inside Button</button>
        </ModalOverlay>
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeTruthy()
      expect(dialog.getAttribute('aria-modal')).toBe('true')
      expect(dialog.getAttribute('aria-labelledby')).toBeTruthy()
      expect(dialog.getAttribute('aria-describedby')).toBeTruthy()

      const titleEl = document.getElementById(dialog.getAttribute('aria-labelledby'))
      expect(titleEl.textContent).toBe('Wonder Library')

      const subEl = document.getElementById(dialog.getAttribute('aria-describedby'))
      expect(subEl.textContent).toBe('Discover ground and sky celebrations')
    })

    it('focuses first control on mount and traps Tab navigation within the modal', () => {
      render(
        <div>
          <button type="button" id="outside-btn">
            Outside
          </button>
          <ModalOverlay isOpen={true} onClose={vi.fn()} title="Test Dialog">
            <button type="button" id="btn-1">
              First
            </button>
            <button type="button" id="btn-2">
              Second
            </button>
          </ModalOverlay>
        </div>
      )

      const firstBtn = screen.getByRole('button', { name: 'First' })
      const secondBtn = screen.getByRole('button', { name: 'Second' })
      const closeBtn = screen.getByRole('button', { name: /Close dialog/i })

      // Focus starts on first control inside modal
      expect(document.activeElement).toBe(closeBtn || firstBtn)

      // Tab wraps within modal
      fireEvent.keyDown(document, { key: 'Tab' })
      expect([closeBtn, firstBtn, secondBtn]).toContain(document.activeElement)
    })

    it('dismisses cleanly via Escape key without side-effects', () => {
      const handleClose = vi.fn()
      render(
        <ModalOverlay isOpen={true} onClose={handleClose} title="Escape Test">
          <div>Content</div>
        </ModalOverlay>
      )

      fireEvent.keyDown(document, { key: 'Escape' })
      expect(handleClose).toHaveBeenCalledTimes(1)
    })

    it('dismisses on backdrop click, but ignores clicks inside the modal card', () => {
      const handleClose = vi.fn()
      render(
        <ModalOverlay isOpen={true} onClose={handleClose} title="Backdrop Test">
          <div data-testid="inner-card-content">Inside Card Content</div>
        </ModalOverlay>
      )

      // Click inside modal card does NOT dismiss
      fireEvent.click(screen.getByTestId('inner-card-content'))
      expect(handleClose).not.toHaveBeenCalled()

      // Click on backdrop dismisses
      const overlay = screen.getByRole('dialog')
      fireEvent.click(overlay)
      expect(handleClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Focus restoration and disappearing trigger fallback', () => {
    it('restores focus to previous active trigger on close', () => {
      function TriggerHarness() {
        const [open, setOpen] = useState(false)
        return (
          <div>
            <button type="button" id="trigger-btn" onClick={() => setOpen(true)}>
              Open Modal
            </button>
            <ModalOverlay isOpen={open} onClose={() => setOpen(false)} title="Restoration">
              <button type="button" id="modal-action">
                Action
              </button>
            </ModalOverlay>
          </div>
        )
      }

      render(<TriggerHarness />)
      const trigger = screen.getByRole('button', { name: 'Open Modal' })
      trigger.focus()
      expect(document.activeElement).toBe(trigger)

      // Open
      act(() => {
        fireEvent.click(trigger)
      })
      expect(screen.getByRole('dialog')).toBeTruthy()

      // Close
      act(() => {
        fireEvent.keyDown(document, { key: 'Escape' })
      })
      expect(screen.queryByRole('dialog')).toBeNull()

      // Focus restored to trigger
      expect(document.activeElement).toBe(trigger)
    })

    it('falls back to a visible meaningful control when original trigger disappeared from DOM', () => {
      function DisappearingTriggerHarness() {
        const [open, setOpen] = useState(false)
        const [triggerExists, setTriggerExists] = useState(true)
        return (
          <div>
            <button type="button" className="contextual-primary-btn">
              Fallback Main Action
            </button>
            {triggerExists && (
              <button
                type="button"
                id="temporary-btn"
                onClick={() => {
                  setTriggerExists(false)
                  setOpen(true)
                }}
              >
                Temporary Trigger
              </button>
            )}
            <ModalOverlay isOpen={open} onClose={() => setOpen(false)} title="Disappearing Test">
              <button type="button">Inside</button>
            </ModalOverlay>
          </div>
        )
      }

      render(<DisappearingTriggerHarness />)
      const tempBtn = screen.getByRole('button', { name: 'Temporary Trigger' })
      tempBtn.focus()
      act(() => {
        fireEvent.click(tempBtn)
      })

      expect(screen.queryByRole('button', { name: 'Temporary Trigger' })).toBeNull()

      // Close modal
      act(() => {
        fireEvent.keyDown(document, { key: 'Escape' })
      })

      // Fallback element receives focus
      const fallback = document.querySelector('.contextual-primary-btn')
      expect(document.activeElement).toBe(fallback)
    })
  })

  describe('Single overlay owner across FSM states', () => {
    it('library, settings, collection, and photo mode cannot create competing active modals', () => {
      const gc = new GameController(STATES.IDLE)
      gc.init({
        sound: {
          init: vi.fn(),
          resume: vi.fn().mockResolvedValue(),
          stopMusic: vi.fn(),
          setMasterVolume: vi.fn(),
          fadeCrackerAudio: vi.fn(),
          stopCrackerAudio: vi.fn(),
          startCalmPad: vi.fn(),
          stopCalmPad: vi.fn(),
        },
        store: {
          getState: () => ({ masterVolume: 0.7, unlocked: [0] }),
          isUnlocked: () => true,
          hasSeenIntro: () => true,
        },
        chhotu: { setPosition: vi.fn(), setFacing: vi.fn(), setArmState: vi.fn() },
        pip: { setPosition: vi.fn(), setMood: vi.fn() },
        background: { setGameState: vi.fn() },
        particles: { clear: vi.fn() },
        renderer: { width: 800, height: 600 },
      })

      // Initially IDLE
      expect(gc.state).toBe(STATES.IDLE)

      // Open library
      gc.openLibrary()
      expect(gc.state).toBe(STATES.LIBRARY_OVERLAY)

      // Switch to settings from library — replaces library cleanly, never concurrent
      gc.openSettings()
      expect(gc.state).toBe(STATES.SETTINGS_OVERLAY)

      // Switch to Sticker Book from settings — replaces settings cleanly
      gc.openStickerBook()
      expect(gc.state).toBe(STATES.STICKER_BOOK_OVERLAY)

      // Switch to Calm Corner from Sticker Book
      gc.enterCalmCorner()
      expect(gc.state).toBe(STATES.CALM_CORNER_OVERLAY)

      // Switch to photo mode
      gc.openPhotoMode()
      expect(gc.state).toBe(STATES.PHOTO_MODE_OVERLAY)

      // Closing returns cleanly
      gc.closePhotoMode()
      expect(gc.state).toBe(STATES.IDLE)
    })
  })
})
