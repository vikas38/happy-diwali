import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { GameController, STATES } from '../src/fsm/GameController.js'
import ContextualAction, { getStepFromState, StepIndicator } from '../src/ui/ContextualAction.jsx'
import Countdown from '../src/ui/Countdown.jsx'
import CrackerCarousel from '../src/ui/CrackerCarousel.jsx'
import App from '../src/App.jsx'

function makeMockEngines() {
  const soundCalls = []
  const sound = {
    supported: true,
    init: () => soundCalls.push('init'),
    resume: () => Promise.resolve(),
    startMusic: () => soundCalls.push('startMusic'),
    stopMusic: () => soundCalls.push('stopMusic'),
    setIntensity: () => {},
    setMasterVolume: () => {},
    playTestTone: (freq, dur) => soundCalls.push(['tone', freq]),
    fadeCrackerAudio: () => soundCalls.push('fadeCracker'),
    stopCrackerAudio: () => soundCalls.push('stopCracker'),
    startCalmPad: () => soundCalls.push('startCalmPad'),
    stopCalmPad: () => soundCalls.push('stopCalmPad'),
    getAudioLevel: () => 0,
    _calls: soundCalls,
  }

  const storeState = {
    unlocked: [0, 1],
    stickers: [0],
    stars: 3,
    masterVolume: 0.7,
    intensity: 'SOFT',
    seenIntros: [0],
    seenHint: true,
    hasCompletedFirst: true,
  }
  const store = {
    isUnlocked: (i) => storeState.unlocked.includes(i),
    hasSeenIntro: (i) => storeState.seenIntros.includes(i),
    hasSticker: (i) => storeState.stickers.includes(i),
    markIntroSeen: (i) => storeState.seenIntros.push(i),
    collectSticker: (i) => {
      storeState.stickers.push(i)
      storeState.stars += 3
    },
    addStars: (n) => {
      storeState.stars += n
    },
    unlockCracker: (i) => {
      if (!storeState.unlocked.includes(i)) storeState.unlocked.push(i)
    },
    setIntensity: (v) => {
      storeState.intensity = v
    },
    setMasterVolume: (v) => {
      storeState.masterVolume = v
    },
    getState: () => storeState,
  }

  const chhotu = {
    x: 0,
    y: 0,
    facing: 1,
    walkActive: false,
    jumpActive: false,
    setPosition: (x, y) => {
      chhotu.x = x
      chhotu.y = y
    },
    setFacing: (f) => {
      chhotu.facing = f
    },
    setArmState: vi.fn(),
    walkTo: (fx, fy, tx, ty, dur, cb) => {
      chhotu.x = tx
      chhotu.y = ty
      chhotu._walkCb = cb
    },
    jump: vi.fn(),
    reset: vi.fn(),
  }

  const pip = {
    x: 0,
    y: 0,
    _jumpActive: false,
    setPosition: (x, y) => {
      pip.x = x
      pip.y = y
    },
    setMood: vi.fn(),
    jump: vi.fn(),
  }

  const particles = { clear: vi.fn(), burst: vi.fn(), spawn: vi.fn() }
  const comicBubble = { spawn: vi.fn(), clear: vi.fn() }
  const jellySquash = { trigger: vi.fn(), reset: vi.fn() }
  const renderer = { width: 400, height: 700 }

  return { sound, store, chhotu, pip, particles, comicBubble, jellySquash, renderer }
}

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function () {
    this.open = true
  })
  HTMLDialogElement.prototype.close = vi.fn(function () {
    this.open = false
  })

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

describe('T02 — Contextual Action Button, Step Dots, Tap Targets & Breath Pause', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('Step Indicator — mapping and accessibility', () => {
    it('maps every FSM state to its correct 1–5 step index', () => {
      expect(getStepFromState(STATES.IDLE)).toBe(1)
      expect(getStepFromState(STATES.CRACKER_INTRO_CARD)).toBe(2)
      expect(getStepFromState(STATES.READY_ON_STREET)).toBe(3)
      expect(getStepFromState(STATES.STEPPING_BACK_SAFE_ROUTINE)).toBe(4)
      expect(getStepFromState(STATES.COUNTDOWN_3_2_1)).toBe(4)
      expect(getStepFromState(STATES.CRACKER_SHOW_ACTIVE)).toBe(5)
      expect(getStepFromState(STATES.REWARD_CELEBRATION)).toBe(5)
    })

    it('renders accessible text equivalent "Step X of 5"', () => {
      render(<StepIndicator step={3} totalSteps={5} />)
      expect(screen.getByText('Step 3 of 5: Light the fuse')).toBeTruthy()
      expect(screen.getByText('Step 3 of 5')).toBeTruthy()
    })
  })

  describe('Take a breath during countdown', () => {
    it('resumes at the same countdown number after breathing break (fake timers)', () => {
      vi.useFakeTimers()
      try {
        const gc = new GameController(STATES.IDLE)
        const engines = makeMockEngines()
        gc.init(engines)
        gc.setCrackerShowFn(vi.fn())

        gc.selectCracker(0)
        // Simulate street ready then tap
        gc.tapCracker()
        // In test mock, walk callback triggers _startCountdown
        if (engines.chhotu._walkCb) engines.chhotu._walkCb()

        // Countdown starts at beat 0 -> '3'
        expect(gc.state).toBe(STATES.COUNTDOWN_3_2_1)
        expect(gc.getSnapshot().uiData.countdownNumber).toBe(3)

        // Advance 800ms -> beat 1 ('2')
        vi.advanceTimersByTime(800)
        expect(gc.getSnapshot().uiData.countdownNumber).toBe(2)

        // Take a breath! Pause into Calm Corner mid-countdown
        gc.enterCalmCorner()
        expect(gc.state).toBe(STATES.CALM_CORNER_OVERLAY)

        // Advance time while in Calm Corner
        vi.advanceTimersByTime(4000)

        // Resume from Calm Corner
        gc.exitCalmCorner()

        // MUST resume at the SAME countdown number ('2')!
        expect(gc.state).toBe(STATES.COUNTDOWN_3_2_1)
        expect(gc.getSnapshot().uiData.countdownNumber).toBe(2)

        // Advance another 800ms -> beat 2 ('1')
        vi.advanceTimersByTime(800)
        expect(gc.getSnapshot().uiData.countdownNumber).toBe(1)

        // Advance another 800ms -> 'GLOW!'
        vi.advanceTimersByTime(800)
        expect(gc.getSnapshot().uiData.countdownNumber).toBe('GLOW!')
      } finally {
        vi.useRealTimers()
      }
    })
  })

  describe('Walk-back skip', () => {
    it('skipWalk jumps directly to countdown and never leaves FSM in invalid state', () => {
      const gc = new GameController(STATES.IDLE)
      const engines = makeMockEngines()
      gc.init(engines)
      gc.setCrackerShowFn(vi.fn())

      // Do not auto-fire callback to stay in STEPPING_BACK_SAFE_ROUTINE
      engines.chhotu.walkTo = vi.fn()

      gc.selectCracker(0)
      gc.tapCracker()
      expect(gc.state).toBe(STATES.STEPPING_BACK_SAFE_ROUTINE)

      // Skip the walk
      gc.skipWalk()

      // FSM state transitioned legally to COUNTDOWN_3_2_1
      expect(gc.state).toBe(STATES.COUNTDOWN_3_2_1)
      expect(gc.getSnapshot().uiData.countdownNumber).toBe(3)
      // Characters are in safe zone
      expect(engines.chhotu.setArmState).toHaveBeenCalled()
      expect(engines.pip.setMood).toHaveBeenCalled()
    })

    it('skipWalk is rejected outside STEPPING_BACK_SAFE_ROUTINE', () => {
      const gc = new GameController(STATES.IDLE)
      const engines = makeMockEngines()
      gc.init(engines)

      gc.skipWalk()
      // Still in IDLE
      expect(gc.state).toBe(STATES.IDLE)
    })
  })

  describe('Countdown overlay', () => {
    it('renders with progress ring and polite aria-live announcement', () => {
      const { rerender } = render(<Countdown countdownNumber={3} />)
      const region = screen.getByRole('status')
      expect(region.getAttribute('aria-live')).toBe('polite')
      expect(screen.getByText('Countdown: 3')).toBeTruthy()
      expect(document.querySelector('.countdown-progress-ring')).toBeTruthy()

      rerender(<Countdown countdownNumber={'GLOW!'} />)
      expect(screen.getByText('Countdown: GLOW!')).toBeTruthy()
    })
  })

  describe('CrackerCarousel Dock', () => {
    it('renders locked items with lock badge and disabled state without error styling', () => {
      render(
        <CrackerCarousel
          unlocked={[0]}
          selectedCracker={0}
          onSelect={vi.fn()}
        />
      )

      const choices = screen.getAllByRole('option')
      expect(choices.length).toBe(6)

      // First is unlocked & selected
      expect(choices[0].disabled).toBe(false)
      expect(choices[0].className).toContain('selected')

      // Second is locked
      expect(choices[1].disabled).toBe(true)
      expect(choices[1].className).toContain('is-locked')
      expect(choices[1].getAttribute('aria-label')).toContain('locked')
    })
  })

  describe('Contextual Action Button', () => {
    it('renders single dominant primary action that updates per FSM state', () => {
      const handlePlace = vi.fn()
      const handleLight = vi.fn()
      const handleSkip = vi.fn()

      const { rerender } = render(
        <ContextualAction
          fsmState={STATES.IDLE}
          selectedCracker={0}
          canSkipWalk={true}
          onPlaceOnStreet={handlePlace}
          onLightFuse={handleLight}
          onSkipWalk={handleSkip}
        />
      )

      // IDLE: Place on street
      const placeBtn = screen.getByRole('button', { name: /Place Phuljhari on street/i })
      expect(placeBtn.className).toContain('contextual-primary-btn')
      fireEvent.click(placeBtn)
      expect(handlePlace).toHaveBeenCalled()

      // READY_ON_STREET: Ask grown-up
      rerender(
        <ContextualAction
          fsmState={STATES.READY_ON_STREET}
          selectedCracker={0}
          canSkipWalk={true}
          onPlaceOnStreet={handlePlace}
          onLightFuse={handleLight}
          onSkipWalk={handleSkip}
        />
      )
      const lightBtn = screen.getByRole('button', { name: /Ask a grown-up to light the fuse/i })
      expect(lightBtn).toBeTruthy()
      fireEvent.click(lightBtn)
      expect(handleLight).toHaveBeenCalled()

      // STEPPING_BACK_SAFE_ROUTINE: in progress + skip walk button
      rerender(
        <ContextualAction
          fsmState={STATES.STEPPING_BACK_SAFE_ROUTINE}
          selectedCracker={0}
          canSkipWalk={true}
          onPlaceOnStreet={handlePlace}
          onLightFuse={handleLight}
          onSkipWalk={handleSkip}
        />
      )
      const skipBtn = screen.getByRole('button', { name: /Skip walking to safe spot/i })
      expect(skipBtn).toBeTruthy()
      fireEvent.click(skipBtn)
      expect(handleSkip).toHaveBeenCalled()
    })
  })
})
