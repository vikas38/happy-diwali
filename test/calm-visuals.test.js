import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  CALM_VISUALS_CONFIG,
  STANDARD_VISUALS_CONFIG,
  FlashLimiter,
  canTriggerFlash,
  detectsReducedMotion,
  MAX_FLASHES_PER_SECOND,
  FLASH_WINDOW_MS,
} from '../src/safety/calmVisuals.js'
import { Particles } from '../src/render/Particles.js'
import { JellySquash } from '../src/render/fx/JellySquash.js'
import { createDefaultSave, validateSave } from '../src/store/save.js'

describe('T03 — Calm Visuals & Flash Cap Engine', () => {
  describe('CALM_VISUALS_CONFIG constants', () => {
    it('defines exact sensory comfort constants without magic numbers', () => {
      expect(CALM_VISUALS_CONFIG.particleCountMultiplier).toBe(0.5)
      expect(CALM_VISUALS_CONFIG.particleLifetimeMultiplier).toBe(0.6)
      expect(CALM_VISUALS_CONFIG.allowScreenFlash).toBe(false)
      expect(CALM_VISUALS_CONFIG.squashMultiplier).toBe(0.5)
      expect(CALM_VISUALS_CONFIG.allowScreenShake).toBe(false)
    })

    it('standard visuals baseline allows flash and standard multipliers', () => {
      expect(STANDARD_VISUALS_CONFIG.particleCountMultiplier).toBe(1.0)
      expect(STANDARD_VISUALS_CONFIG.particleLifetimeMultiplier).toBe(1.0)
      expect(STANDARD_VISUALS_CONFIG.allowScreenFlash).toBe(true)
      expect(STANDARD_VISUALS_CONFIG.squashMultiplier).toBe(1.0)
      expect(STANDARD_VISUALS_CONFIG.allowScreenShake).toBe(false)
    })
  })

  describe('FlashLimiter (WCAG 2.3.1 compliance)', () => {
    let limiter

    beforeEach(() => {
      limiter = new FlashLimiter(MAX_FLASHES_PER_SECOND, FLASH_WINDOW_MS)
    })

    it('allows up to 3 flashes in a 1000ms window', () => {
      expect(limiter.requestFlash(100)).toBe(true)
      expect(limiter.requestFlash(250)).toBe(true)
      expect(limiter.requestFlash(500)).toBe(true)
      expect(limiter.history).toEqual([100, 250, 500])
    })

    it('rejects the 4th burst when fired in rapid succession within 1000ms', () => {
      // 10 rapid burst requests across 300 ms
      const results = []
      for (let i = 0; i < 10; i++) {
        results.push(limiter.requestFlash(100 + i * 30))
      }
      // Exactly 3 allowed, 7 rejected
      expect(results.filter(Boolean).length).toBe(3)
      expect(results[0]).toBe(true)
      expect(results[1]).toBe(true)
      expect(results[2]).toBe(true)
      expect(results[3]).toBe(false)
      expect(results[9]).toBe(false)
    })

    it('allows a 4th flash once the rolling 1000ms window has passed the first flash', () => {
      expect(limiter.requestFlash(100)).toBe(true)
      expect(limiter.requestFlash(300)).toBe(true)
      expect(limiter.requestFlash(600)).toBe(true)
      expect(limiter.requestFlash(900)).toBe(false) // 4th in 1000ms -> rejected

      // At 1105ms, timestamp 100 is > 1000ms ago -> purged, flash permitted
      expect(limiter.requestFlash(1105)).toBe(true)
      // At 1150ms, still 3 active (300, 600, 1105) -> rejected
      expect(limiter.requestFlash(1150)).toBe(false)
      // At 1305ms, 300 is purged -> flash permitted
      expect(limiter.requestFlash(1305)).toBe(true)
    })

    it('rejects all flashes when calmVisuals is true', () => {
      expect(limiter.requestFlash(100, true)).toBe(false)
      expect(limiter.requestFlash(200, true)).toBe(false)
      expect(limiter.requestFlash(1500, true)).toBe(false)
      expect(limiter.history).toEqual([])
    })

    it('resets cleanly', () => {
      limiter.requestFlash(100)
      limiter.requestFlash(200)
      limiter.reset()
      expect(limiter.history).toEqual([])
      expect(limiter.requestFlash(250)).toBe(true)
    })
  })

  describe('canTriggerFlash helper function', () => {
    it('limits array history to 3 flashes in 1000ms window', () => {
      const history = []
      expect(canTriggerFlash(history, 100)).toBe(true)
      expect(canTriggerFlash(history, 200)).toBe(true)
      expect(canTriggerFlash(history, 300)).toBe(true)
      expect(canTriggerFlash(history, 400)).toBe(false)
      expect(history.length).toBe(3)

      // Rolling window after 1105ms
      expect(canTriggerFlash(history, 1105)).toBe(true)
      expect(history.length).toBe(3)
    })

    it('rejects when calmVisuals is true', () => {
      const history = []
      expect(canTriggerFlash(history, 100, { calmVisuals: true })).toBe(false)
      expect(history).toEqual([])
    })
  })

  describe('Particles integration with calmVisuals', () => {
    let p

    beforeEach(() => {
      p = new Particles()
    })

    it('shortens particle lifetime by scaling decay when calmVisuals is active', () => {
      // Standard particle
      const pStd = p.spawn(0, 0, { decay: 1.0 })
      expect(pStd.decay).toBe(1.0)

      p.clear()
      p.calmVisuals = true

      // Calm particle: decay = baseDecay / 0.6
      const pCalm = p.spawn(0, 0, { decay: 1.0 })
      expect(pCalm.decay).toBeCloseTo(1.0 / 0.6, 3)
    })

    it('halves burst particle count when calmVisuals is active', () => {
      p.burst(0, 0, 40)
      p.update(0.016, 0)
      expect(p.activeCount).toBe(40)

      p.clear()
      p.calmVisuals = true
      p.burst(0, 0, 40)
      p.update(0.016, 0)
      // Halved by 0.5
      expect(p.activeCount).toBe(20)
    })

    it('applies rolling flash limiter to Particles.flash', () => {
      expect(p.flash(10, 10, 120, 38, 0.35, 100)).toBe(true)
      expect(p.flash(10, 10, 120, 38, 0.35, 200)).toBe(true)
      expect(p.flash(10, 10, 120, 38, 0.35, 300)).toBe(true)
      // 4th flash in rolling 1000ms rejected
      expect(p.flash(10, 10, 120, 38, 0.35, 400)).toBe(false)
      expect(p.flashes.length).toBe(3)
    })

    it('suppresses all flashes when calmVisuals is active', () => {
      p.calmVisuals = true
      expect(p.flash(10, 10, 120, 38, 0.35, 100)).toBe(false)
      expect(p.flashes.length).toBe(0)
    })
  })

  describe('JellySquash with calmVisuals', () => {
    it('scales squash amount by 0.5 when calmVisuals is active', () => {
      const mockEl = { style: {} }
      const squash = new JellySquash(mockEl)
      squash.reducedMotion = false
      squash.calmVisuals = true

      squash.trigger(0.2, 'y')
      // amount is 0.2 * 0.5 = 0.1
      expect(squash.scaleX).toBeCloseTo(1.1, 4)
      expect(squash.scaleY).toBeCloseTo(0.9, 4)
    })

    it('suppresses squash completely when reducedMotion is active', () => {
      const mockEl = { style: {} }
      const squash = new JellySquash(mockEl)
      squash.reducedMotion = true

      squash.trigger(0.2, 'y')
      expect(squash.scaleX).toBe(1)
      expect(squash.scaleY).toBe(1)
    })
  })

  describe('First-run reduced motion detection in store/save', () => {
    it('defaults calmVisuals to true if prefers-reduced-motion matches', () => {
      const originalMatchMedia = globalThis.matchMedia
      globalThis.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      try {
        expect(detectsReducedMotion()).toBe(true)
        const save = createDefaultSave()
        expect(save.calmVisuals).toBe(true)
      } finally {
        globalThis.matchMedia = originalMatchMedia
      }
    })

    it('defaults calmVisuals to false if prefers-reduced-motion does not match', () => {
      const originalMatchMedia = globalThis.matchMedia
      globalThis.matchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))

      try {
        expect(detectsReducedMotion()).toBe(false)
        const save = createDefaultSave()
        expect(save.calmVisuals).toBe(false)
      } finally {
        globalThis.matchMedia = originalMatchMedia
      }
    })
  })
})
