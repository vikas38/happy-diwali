import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  ShowTimeline,
  playCrackerShow,
  SHOW_DURATIONS,
} from '../src/crackers/crackerControllers.js'
import { Particles } from '../src/render/Particles.js'
import { drawCourtyard } from '../src/render/layers/Courtyard.js'

describe('Task M2 — Align show timing and optimize rendering costs', () => {
  describe('1. ShowTimeline coordination and bounded catch-up', () => {
    it('schedules events and fires them in strict chronological order', () => {
      const executed = []
      const timeline = new ShowTimeline(1000, () => executed.push('done'))
      timeline.schedule(500, () => executed.push('halfway'))
      timeline.schedule(200, () => executed.push('early'))
      timeline.schedule(800, () => executed.push('late'))

      // Step by 250ms
      timeline.advance(250)
      expect(executed).toEqual(['early'])

      // Step by 300ms (elapsed: 550ms)
      timeline.advance(300)
      expect(executed).toEqual(['early', 'halfway'])

      // Step by 500ms (elapsed: 1050ms >= 1000ms)
      timeline.advance(500)
      expect(executed).toEqual(['early', 'halfway', 'late', 'done'])
      expect(timeline.completed).toBe(true)
    })

    it('clamps single-frame delta spikes using bounded fixed-step catch-up to prevent unbounded loops', () => {
      const executed = []
      const timeline = new ShowTimeline(2000, () => executed.push('done'))
      timeline.schedule(300, () => executed.push('burst'))

      // Huge 6000ms freeze spike — bounded catch-up caps at 10 steps of 50ms = 500ms
      timeline.advance(6000)
      expect(timeline.elapsed).toBe(500)
      expect(executed).toEqual(['burst'])
    })

    it('cancels scheduled events and prevents delayed completion upon cancellation', () => {
      const onDone = vi.fn()
      const eventFn = vi.fn()
      const timeline = new ShowTimeline(1000, onDone)
      timeline.schedule(500, eventFn)

      timeline.advance(200)
      timeline.cancel()
      expect(timeline.cancelled).toBe(true)

      timeline.advance(800)
      expect(eventFn).not.toHaveBeenCalled()
      expect(onDone).not.toHaveBeenCalled()
    })
  })

  describe('2. Particles trail zero-allocation ring buffer', () => {
    it('uses fixed Float32Array ring buffer for particle trails without array shift churn', () => {
      const p = new Particles()
      const particle = p.spawn(100, 150, { trail: 6, vx: 10, vy: 10, decay: 0.1 })
      expect(particle.maxTrail).toBe(6)
      expect(particle.trailCount).toBe(0)
      expect(particle.trailX).toBeInstanceOf(Float32Array)
      expect(particle.trailY).toBeInstanceOf(Float32Array)

      // Step 3 frames
      p.update(0.016, 0)
      p.update(0.016, 0.016)
      p.update(0.016, 0.032)

      expect(particle.trailCount).toBe(3)
      const trail = particle.trail
      expect(trail).toHaveLength(3)
      expect(trail[0]).toHaveProperty('x')
      expect(trail[0]).toHaveProperty('y')

      // Step past capacity (10 frames total)
      for (let i = 0; i < 7; i++) p.update(0.016, 0.05 + i * 0.016)

      expect(particle.trailCount).toBe(6) // capped at maxTrail
      const wrappedTrail = particle.trail
      expect(wrappedTrail).toHaveLength(6)
    })

    it('does not re-allocate Float32Arrays when recycling particle from pool', () => {
      const p = new Particles()
      const p1 = p.spawn(50, 50, { trail: 8, decay: 100 })
      const originalBufferX = p1.trailX

      p.update(0.5, 0) // deactivates particle
      p.update(0.016, 0.5) // refreshes activeCount
      expect(p.activeCount).toBe(0)

      // Next free wrap-around reuses slot 0 without reallocating buffer
      p._nextFree = 0
      const p2 = p.spawn(80, 80, { trail: 8, decay: 100 })
      expect(p2).toBe(p1)
      expect(p2.trailX).toBe(originalBufferX) // exact same typed array reused
    })
  })

  describe('3. PlayCrackerShow coordinated timeline and settling phase', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('preserves rocket ascent (1.15s), burst synchronization, and settling phase (4s)', () => {
      const onDone = vi.fn()
      let burstFired = false
      const mockP = {
        spawn: vi.fn(),
        flash: vi.fn((x, y, radius) => {
          if (radius >= 200) burstFired = true
        }),
      }
      const mockR = {
        width: 800,
        height: 600,
      }
      const engines = {
        particles: mockP,
        renderer: mockR,
        sound: {
          supported: false,
        },
      }

      playCrackerShow(3, engines, onDone) // Rocket: duration 4000ms

      // Advance by 1100ms: apex burst should not have fired yet
      vi.advanceTimersByTime(1100)
      expect(burstFired).toBe(false)
      expect(onDone).not.toHaveBeenCalled()

      // Advance past 1150ms: apex burst fires
      vi.advanceTimersByTime(100)
      expect(burstFired).toBe(true)

      // Before full duration (3500ms): show is settling, reward should not fire yet
      vi.advanceTimersByTime(2300)
      expect(onDone).not.toHaveBeenCalled()

      // At 4000ms: settling phase finishes and onDone fires
      vi.advanceTimersByTime(550)
      expect(onDone).toHaveBeenCalledOnce()
    })

    it('cancels scheduled cracker events cleanly when interrupted', () => {
      const onDone = vi.fn()
      const mockP = { spawn: vi.fn(), flash: vi.fn() }
      const engines = { particles: mockP, renderer: { width: 400, height: 700 } }

      const cancel = playCrackerShow(5, engines, onDone) // Sutli Bomb
      vi.advanceTimersByTime(500)
      cancel()

      // Advance past burst and full duration
      vi.advanceTimersByTime(6000)
      expect(onDone).not.toHaveBeenCalled()
      expect(mockP.flash).not.toHaveBeenCalled()
    })
  })

  describe('4. Courtyard static scenery caching', () => {
    it('draws courtyard cleanly with valid dimensions', () => {
      const mockCtx = {
        createLinearGradient: vi.fn(() => ({
          addColorStop: vi.fn(),
        })),
        createRadialGradient: vi.fn(() => ({
          addColorStop: vi.fn(),
        })),
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        ellipse: vi.fn(),
        fill: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        arc: vi.fn(),
        closePath: vi.fn(),
        stroke: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        bezierCurveTo: vi.fn(),
        drawImage: vi.fn(),
        setLineDash: vi.fn(),
        getLineDash: vi.fn(() => []),
      }

      expect(() => {
        drawCourtyard(mockCtx, 800, 600, 1.5, 'IDLE', false)
      }).not.toThrow()
      expect(mockCtx.fillRect).toHaveBeenCalled()
    })
  })
})
