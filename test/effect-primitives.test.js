import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createRng,
  resolveAnchor,
  BudgetTracker,
  emitFan,
  emitRing,
  emitArc,
  emitTrail,
  emitPetal,
  emitStaggeredBurst,
  AuthoredShowTimeline,
  SHOW_PHASES,
} from '../src/crackers/effectPrimitives.js'
import { Particles } from '../src/render/Particles.js'

describe('DIW-018 — Add reusable authored effect timelines and emission primitives', () => {
  describe('1. Deterministic PRNG & Stage Anchors', () => {
    it('produces identical repeatable pseudorandom sequence for the same seed', () => {
      const rng1 = createRng(42)
      const rng2 = createRng(42)

      const seq1 = Array.from({ length: 5 }, () => rng1())
      const seq2 = Array.from({ length: 5 }, () => rng2())

      expect(seq1).toEqual(seq2)
      expect(seq1[0]).toBeGreaterThanOrEqual(0)
      expect(seq1[0]).toBeLessThan(1)
    })

    it('resolves normalized stage anchors accurately across different viewports', () => {
      const ground800 = resolveAnchor('ground', 800, 600)
      expect(ground800.x).toBeCloseTo(800 * 0.57, 1)
      expect(ground800.y).toBeCloseTo(600 * 0.73, 1)

      const skyHigh1200 = resolveAnchor('sky_high', 1200, 800)
      expect(skyHigh1200.x).toBeCloseTo(1200 * 0.5, 1)
      expect(skyHigh1200.y).toBeCloseTo(800 * 0.3, 1)

      const skyMid1024 = resolveAnchor('sky_mid', 1024, 768)
      expect(skyMid1024.x).toBeCloseTo(1024 * 0.5, 1)
      expect(skyMid1024.y).toBeCloseTo(768 * 0.44, 1)
    })
  })

  describe('2. BudgetTracker Enforcement', () => {
    it('clamps particle requests so total never exceeds defined budget', () => {
      const tracker = new BudgetTracker(100)

      expect(tracker.request(60)).toBe(60)
      expect(tracker.allocated).toBe(60)

      // Request 50 more when only 40 are available
      expect(tracker.request(50)).toBe(40)
      expect(tracker.allocated).toBe(100)

      // Further requests are rejected (0 granted)
      expect(tracker.request(20)).toBe(0)

      // Release partial or reset
      tracker.release(30)
      expect(tracker.allocated).toBe(70)
      expect(tracker.request(15)).toBe(15)

      tracker.reset()
      expect(tracker.allocated).toBe(0)
    })
  })

  describe('3. Six Geometric Emission Primitives', () => {
    let particles

    beforeEach(() => {
      particles = new Particles()
    })

    it('emitFan authors an angular spread with reduced motion scaling', () => {
      const rng = createRng(100)
      const budget = new BudgetTracker(50)

      const spawned = emitFan({
        particles,
        x: 400,
        y: 300,
        count: 20,
        angleBase: -Math.PI / 2,
        spread: Math.PI * 0.5,
        speedMin: 50,
        speedMax: 100,
        budgetTracker: budget,
        rng,
      })

      expect(spawned.length).toBe(20)
      expect(budget.allocated).toBe(20)

      // Velocities point upward (vy < 0)
      spawned.forEach((p) => {
        expect(p.vy).toBeLessThan(0)
        expect(p.active).toBe(true)
      })

      // Reduced motion test: velocity magnitude is scaled down
      const reducedSpawned = emitFan({
        particles,
        x: 400,
        y: 300,
        count: 10,
        reducedMotion: true,
        speedMin: 100,
        speedMax: 100,
        rng,
      })
      const vMag = Math.hypot(reducedSpawned[0].vx, reducedSpawned[0].vy)
      expect(vMag).toBeCloseTo(100 * 0.55, 1)
    })

    it('emitRing authors concentric circular and elliptical rings', () => {
      const rng = createRng(200)

      const spawned = emitRing({
        particles,
        x: 400,
        y: 200,
        count: 32,
        speed: 80,
        aspectRatio: 1.0,
        rng,
      })

      expect(spawned.length).toBe(32)
      // Check radial speeds: all particles expand outward around ~80px/s
      spawned.forEach((p) => {
        const speed = Math.hypot(p.vx, p.vy)
        expect(speed).toBeCloseTo(80, 0)
      })
    })

    it('emitArc authors a parabolic directional arc stream', () => {
      const rng = createRng(300)

      const spawned = emitArc({
        particles,
        x: 450,
        y: 400,
        count: 15,
        startAngle: -Math.PI * 0.8,
        endAngle: -Math.PI * 0.2,
        speedMin: 60,
        speedMax: 60,
        gravity: 30,
        rng,
      })

      expect(spawned.length).toBe(15)
      spawned.forEach((p) => {
        expect(p.gravity).toBe(30)
        expect(p.vy).toBeLessThan(0) // initially upward arc
      })
    })

    it('emitTrail authors filaments along an authored vector', () => {
      const rng = createRng(400)

      const spawned = emitTrail({
        particles,
        startX: 400,
        startY: 100,
        endX: 400,
        endY: 450,
        count: 25,
        rng,
      })

      expect(spawned.length).toBe(25)
      // First particle is near top (startY = 100), last particle is near bottom (endY = 450)
      expect(spawned[0].y).toBeCloseTo(100, -1)
      expect(spawned[spawned.length - 1].y).toBeCloseTo(450, -1)
    })

    it('emitPetal authors radial petal lobes forming flower shapes', () => {
      const rng = createRng(500)

      const spawned = emitPetal({
        particles,
        x: 400,
        y: 250,
        petals: 8,
        particlesPerPetal: 4,
        speed: 70,
        rng,
      })

      expect(spawned.length).toBe(32)
    })

    it('emitStaggeredBurst schedules sequential rhythmic bursts', () => {
      const timeline = { schedule: vi.fn() }
      const positions = [
        { x: 100, y: 100 },
        { x: 120, y: 100 },
        { x: 140, y: 100 },
      ]

      emitStaggeredBurst({
        timeline,
        particles,
        positions,
        countPerBurst: 8,
        intervalMs: 200,
      })

      expect(timeline.schedule).toHaveBeenCalledTimes(3)
      expect(timeline.schedule).toHaveBeenNthCalledWith(1, 0, expect.any(Function))
      expect(timeline.schedule).toHaveBeenNthCalledWith(2, 200, expect.any(Function))
      expect(timeline.schedule).toHaveBeenNthCalledWith(3, 400, expect.any(Function))
    })
  })

  describe('4. AuthoredShowTimeline Phases & Cancellation', () => {
    it('transitions through ANTICIPATION → FOCAL_ACTION → SETTLING → COMPLETED', () => {
      const phaseChanges = []
      const onDone = vi.fn()

      const timeline = new AuthoredShowTimeline({
        totalDurationMs: 4000,
        anticipationMs: 400,
        focalMs: 2600,
        onDone,
        onPhaseChange: (p) => phaseChanges.push(p),
      })

      expect(timeline.phase).toBe(SHOW_PHASES.ANTICIPATION)

      // Step past anticipation (500ms)
      timeline.advance(500)
      expect(timeline.phase).toBe(SHOW_PHASES.FOCAL_ACTION)

      // Step into settling (elapsed >= 3000ms)
      for (let i = 0; i < 6; i++) {
        timeline.advance(450)
      }
      expect(timeline.phase).toBe(SHOW_PHASES.SETTLING)

      // Step to end of show (elapsed >= 4000ms)
      for (let i = 0; i < 4; i++) {
        timeline.advance(400)
      }
      expect(timeline.phase).toBe(SHOW_PHASES.COMPLETED)
      expect(timeline.completed).toBe(true)
      expect(onDone).toHaveBeenCalledTimes(1)
      expect(phaseChanges).toEqual([
        SHOW_PHASES.FOCAL_ACTION,
        SHOW_PHASES.SETTLING,
        SHOW_PHASES.COMPLETED,
      ])
    })

    it('cancellation executes cleanup handles, clears pending events, and prevents onDone', () => {
      const onDone = vi.fn()
      const cleanupFn = vi.fn()
      const futureEvent = vi.fn()

      const timeline = new AuthoredShowTimeline({
        totalDurationMs: 3000,
        anticipationMs: 200,
        focalMs: 2000,
        onDone,
      })

      timeline.addCleanup(cleanupFn)
      timeline.schedule(1500, futureEvent)

      timeline.advance(500)
      timeline.cancel()

      expect(timeline.cancelled).toBe(true)
      expect(cleanupFn).toHaveBeenCalledTimes(1)

      // Advance through remainder of time
      timeline.advance(3000)
      expect(futureEvent).not.toHaveBeenCalled()
      expect(onDone).not.toHaveBeenCalled()
    })

    it('clamps single-frame delta spikes with bounded catch-up steps', () => {
      const timeline = new AuthoredShowTimeline({
        totalDurationMs: 5000,
        anticipationMs: 500,
        focalMs: 3500,
      })

      // 10 second spike capped at 10 * 50ms = 500ms
      timeline.advance(10000)
      expect(timeline.elapsedMs).toBe(500)
      expect(timeline.phase).toBe(SHOW_PHASES.FOCAL_ACTION)
    })
  })
})
