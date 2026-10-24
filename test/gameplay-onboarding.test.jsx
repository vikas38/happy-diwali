import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest'
import React, { useEffect, useRef, useState } from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { GameStoreProvider, useGameStore } from '../src/store/gameStore.jsx'
import { GameController, STATES } from '../src/fsm/GameController.js'
import HUD from '../src/ui/HUD.jsx'
import SafetySplash from '../src/ui/SafetySplash.jsx'
import { createDefaultSave, validateSave, loadSave } from '../src/store/save.js'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function () {
    this.open = true
  })
  HTMLDialogElement.prototype.close = vi.fn(function () {
    this.open = false
  })
})

function makeMockEngines(store) {
  return {
    store,
    sound: {
      supported: true,
      init: vi.fn(),
      resume: async () => {},
      startMusic: vi.fn(),
      stopMusic: vi.fn(),
      stopCrackerAudio: vi.fn(),
      fadeCrackerAudio: vi.fn(),
      startCalmPad: vi.fn(),
      stopCalmPad: vi.fn(),
      setIntensity: vi.fn(),
      setMasterVolume: vi.fn(),
      playTestTone: vi.fn(),
      getAudioLevel: () => 0,
    },
    chhotu: {
      setPosition: vi.fn(),
      setFacing: vi.fn(),
      setArmState: vi.fn(),
      walkTo: vi.fn(),
    },
    pip: {
      setPosition: vi.fn(),
      setMood: vi.fn(),
    },
    particles: { clear: vi.fn() },
    renderer: { width: 800, height: 600 },
    background: { setGameState: vi.fn() },
    layout: {
      chhotuStartX: 0.38,
      chhotuStartY: 0.62,
      pipStartX: 0.3,
      pipStartY: 0.64,
      safeZoneX: 0.15,
      safeZoneY: 0.65,
    },
  }
}

describe('DIW-013 — Add brief, skippable gameplay onboarding', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('offers Silent/Gentle sound and Gentle visuals choices on SafetySplash before game start', () => {
    const onStart = vi.fn()
    render(
      <GameStoreProvider>
        <SafetySplash onStart={onStart} />
      </GameStoreProvider>
    )

    const silentBtn = screen.getByRole('button', { name: /Gentle sound/i })
    const visualsBtn = screen.getByRole('button', { name: /Festive visuals/i })
    expect(silentBtn).toBeTruthy()
    expect(visualsBtn).toBeTruthy()

    // Toggle silent mode
    fireEvent.click(silentBtn)
    expect(screen.getByRole('button', { name: /Silent/i })).toBeTruthy()

    // Toggle gentle visuals
    fireEvent.click(visualsBtn)
    expect(screen.getByRole('button', { name: /Gentle visuals/i })).toBeTruthy()

    // Start with chosen preferences
    const startBtn = screen.getByRole('button', { name: /Step into the courtyard/i })
    fireEvent.click(startBtn)
    expect(onStart).toHaveBeenCalledWith({ silent: true, gentleVisuals: true })
  })

  it('shows and contextually progresses through the three hints (choose, ask grown-up, controls)', () => {
    let storeRef

    function TestApp() {
      const store = useGameStore()
      storeRef = store
      const { state: saveState } = store
      const [fsmState, setFsmState] = useState(STATES.IDLE)

      const dismissedHints = Array.isArray(saveState.dismissedHints)
        ? saveState.dismissedHints
        : saveState.seenHint
          ? ['choose', 'grownup', 'controls']
          : []

      let activeHintKey = null
      let activeHintText = null

      if (!dismissedHints.includes('choose') && fsmState === STATES.IDLE) {
        activeHintKey = 'choose'
        activeHintText = 'Choose a sparkle below to begin your celebration.'
      } else if (!dismissedHints.includes('grownup') && fsmState === STATES.READY_ON_STREET) {
        activeHintKey = 'grownup'
        activeHintText =
          'Ask a grown-up to light the fuse — grown-ups handle the pretend spark together.'
      } else if (
        !dismissedHints.includes('controls') &&
        (fsmState === STATES.STEPPING_BACK_SAFE_ROUTINE || fsmState === STATES.COUNTDOWN_3_2_1)
      ) {
        activeHintKey = 'controls'
        activeHintText = 'You can pause or mute anytime with the buttons at the top.'
      }

      return (
        <div>
          {activeHintKey && (
            <aside className="courtyard-hint-banner" role="status">
              <span className="hint-text">{activeHintText}</span>
              <button
                type="button"
                className="hint-close-btn"
                onClick={() => store.dismissHint(activeHintKey)}
                aria-label="Dismiss hint"
              >
                ✕
              </button>
            </aside>
          )}

          <button
            onClick={() => {
              store.dismissHint('choose')
              setFsmState(STATES.READY_ON_STREET)
            }}
          >
            Select Cracker
          </button>
          <button
            onClick={() => {
              store.dismissHint('grownup')
              setFsmState(STATES.COUNTDOWN_3_2_1)
            }}
          >
            Light Fuse
          </button>
        </div>
      )
    }

    render(
      <GameStoreProvider>
        <TestApp />
      </GameStoreProvider>
    )

    // 1. Hint 1: Choose
    expect(screen.getByText(/Choose a sparkle below/i)).toBeTruthy()
    const dismissChoose = screen.getByRole('button', { name: /Dismiss hint/i })
    expect(dismissChoose).toBeTruthy()

    // Advance to READY_ON_STREET: dismisses choose, displays Hint 2: Ask grown-up
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Select Cracker/i }))
    })
    expect(screen.queryByText(/Choose a sparkle below/i)).toBeNull()
    expect(screen.getByText(/Ask a grown-up to light the fuse/i)).toBeTruthy()

    // Advance to COUNTDOWN_3_2_1: dismisses grownup, displays Hint 3: Controls (pause/mute)
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Light Fuse/i }))
    })
    expect(screen.queryByText(/Ask a grown-up to light the fuse/i)).toBeNull()
    expect(screen.getByText(/pause or mute anytime/i)).toBeTruthy()

    // Dismissing Hint 3 with close button
    const dismissControls = screen.getByRole('button', { name: /Dismiss hint/i })
    act(() => {
      fireEvent.click(dismissControls)
    })
    expect(screen.queryByText(/pause or mute anytime/i)).toBeNull()

    // All hints are now dismissed in store
    expect(storeRef.state.dismissedHints).toContain('choose')
    expect(storeRef.state.dismissedHints).toContain('grownup')
    expect(storeRef.state.dismissedHints).toContain('controls')
    expect(storeRef.state.seenHint).toBe(true)
  })

  it('restores hints when Replay Hints is selected in Settings', () => {
    let storeRef

    function TestApp() {
      const store = useGameStore()
      storeRef = store
      return (
        <HUD
          stars={5}
          masterVolume={0.7}
          intensity="SOFT"
          showSettings={true}
          settingsOpen={true}
          onReplayHints={() => store.replayHints()}
        />
      )
    }

    render(
      <GameStoreProvider>
        <TestApp />
      </GameStoreProvider>
    )

    // Pre-dismiss all hints
    act(() => {
      storeRef.dismissHint()
    })
    expect(storeRef.state.seenHint).toBe(true)
    expect(storeRef.state.dismissedHints.length).toBeGreaterThanOrEqual(3)

    // Click "Replay hints" in settings
    const replayBtn = screen.getByRole('button', { name: /Restore gameplay hints/i })
    expect(replayBtn).toBeTruthy()
    act(() => {
      fireEvent.click(replayBtn)
    })

    // Hints are reset
    expect(storeRef.state.seenHint).toBe(false)
    expect(storeRef.state.dismissedHints).toEqual([])
  })

  it('persists dismissed hints in save migration without repeating for returning players', () => {
    const rawSaved = {
      version: 2,
      seenHint: true,
      unlocked: [0, 1],
      stickers: [0],
    }
    const validated = validateSave(rawSaved)
    expect(validated.seenHint).toBe(true)
    expect(validated.dismissedHints).toContain('choose')
    expect(validated.dismissedHints).toContain('grownup')
    expect(validated.dismissedHints).toContain('controls')
  })
})
