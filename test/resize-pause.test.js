import { describe, it, expect, vi } from 'vitest'
import { shouldPauseOnResize, meaningfulResize } from '../src/safety/limits.js'
import { GameController, STATES } from '../src/fsm/GameController.js'

function makeMockEngines() {
  const sound = {
    supported: true,
    init: vi.fn(),
    resume: () => Promise.resolve(),
    startMusic: vi.fn(),
    stopMusic: vi.fn(),
    setIntensity: vi.fn(),
    setMasterVolume: vi.fn(),
    fadeCrackerAudio: vi.fn(),
    stopCrackerAudio: vi.fn(),
    startCalmPad: vi.fn(),
    stopCalmPad: vi.fn(),
  }
  const storeState = { intensity: 'SOFT', masterVolume: 0.7 }
  const store = { getState: () => storeState }
  const chhotu = {
    x: 0,
    y: 0,
    facing: 1,
    walkActive: false,
    jumpActive: false,
    setPosition: vi.fn(),
    setFacing: vi.fn(),
    setArmState: vi.fn(),
    walkTo: vi.fn(),
  }
  const pip = {
    x: 0,
    y: 0,
    _jumpActive: false,
    setPosition: vi.fn(),
    setMood: vi.fn(),
    walkTo: vi.fn(),
  }
  const particles = { clear: vi.fn() }
  const renderer = { width: 800, height: 600 }
  const background = { setGameState: vi.fn() }
  return { sound, store, chhotu, pip, particles, renderer, background }
}

describe('T06 — shouldPauseOnResize & Visibility Pausing', () => {
  describe('Address-bar collapse (no pause)', () => {
    it('does not pause on mobile address bar collapse (< 120px height change, same width)', () => {
      // iPhone 14 address bar collapse: 60px height change
      const before = { width: 390, height: 750 }
      const after = { width: 390, height: 810 }
      expect(shouldPauseOnResize(before, after)).toBe(false)
    })

    it('does not pause on Android Chrome address bar expand/collapse (95px height change)', () => {
      const before = { width: 412, height: 820 }
      const after = { width: 412, height: 915 }
      expect(shouldPauseOnResize(before, after)).toBe(false)
      // Reverse (expand)
      expect(shouldPauseOnResize(after, before)).toBe(false)
    })

    it('does not pause on 119px height-only change', () => {
      expect(shouldPauseOnResize({ width: 375, height: 667 }, { width: 375, height: 786 })).toBe(
        false
      )
    })
  })

  describe('Device rotation (pause)', () => {
    it('pauses on rotation from portrait to landscape', () => {
      const portrait = { width: 390, height: 844 }
      const landscape = { width: 844, height: 390 }
      expect(shouldPauseOnResize(portrait, landscape)).toBe(true)
    })

    it('pauses on rotation from landscape to portrait on tablet', () => {
      const landscape = { width: 1024, height: 768 }
      const portrait = { width: 768, height: 1024 }
      expect(shouldPauseOnResize(landscape, portrait)).toBe(true)
    })
  })

  describe('Desktop window resize (large vs small)', () => {
    it('pauses on desktop window resize exceeding 20% width change', () => {
      // 1200 -> 900 is 300px change = 25% > 20%
      expect(shouldPauseOnResize({ width: 1200, height: 800 }, { width: 900, height: 800 })).toBe(
        true
      )
      // 800 -> 1100 is 300px change = 37.5% > 20%
      expect(shouldPauseOnResize({ width: 800, height: 800 }, { width: 1100, height: 800 })).toBe(
        true
      )
    })

    it('pauses on large desktop vertical resize >= 120px and > 20%', () => {
      // 800 -> 1100 height = 300px change = 37.5%
      expect(shouldPauseOnResize({ width: 1200, height: 800 }, { width: 1200, height: 1100 })).toBe(
        true
      )
    })

    it('does not pause on minor resize under 20%', () => {
      // 1000 -> 1050 is 5% change
      expect(shouldPauseOnResize({ width: 1000, height: 800 }, { width: 1050, height: 800 })).toBe(
        false
      )
      // 1000 -> 950 is 5% change
      expect(shouldPauseOnResize({ width: 1000, height: 800 }, { width: 950, height: 800 })).toBe(
        false
      )
    })
  })

  describe('Robustness and edge cases', () => {
    it('returns false for missing or non-numeric inputs', () => {
      expect(shouldPauseOnResize(null, null)).toBe(false)
      expect(shouldPauseOnResize(undefined, { width: 400, height: 400 })).toBe(false)
      expect(shouldPauseOnResize({ width: 0, height: 0 }, { width: 400, height: 400 })).toBe(false)
      expect(shouldPauseOnResize({ width: -100, height: 200 }, { width: 400, height: 400 })).toBe(
        false
      )
    })

    it('meaningfulResize is an alias to shouldPauseOnResize for backward compatibility', () => {
      expect(meaningfulResize).toBe(shouldPauseOnResize)
    })
  })

  describe('FSM calm corner pause integration', () => {
    it('calling enterCalmCorner pauses an active show and exit resumes it', () => {
      const gc = new GameController(STATES.IDLE)
      const engines = makeMockEngines()
      gc.init(engines)
      gc.state = STATES.STEPPING_BACK_SAFE_ROUTINE

      // Hidden tab or large resize pauses into calm corner
      gc.enterCalmCorner()
      expect(gc.state).toBe(STATES.CALM_CORNER_OVERLAY)

      // Resuming exits cleanly back to the routine
      gc.exitCalmCorner()
      expect(gc.state).toBe(STATES.STEPPING_BACK_SAFE_ROUTINE)
    })
  })
})
