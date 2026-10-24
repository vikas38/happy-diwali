// ===================================================================
// effectPrimitives.js — Authored Effect Timelines & Emission Primitives
// ===================================================================
// DIW-018: Reusable primitives for distinct firework effects.
// Provides fan, ring, arc, trail, radial petal, and staggered-burst
// primitives with deterministic seed support, per-effect particle
// budgets, normalized stage anchors, and live motion policy integration.
// ===================================================================

import { CALM_VISUALS_CONFIG } from '../safety/calmVisuals.js'

export const SHOW_PHASES = {
  ANTICIPATION: 'ANTICIPATION',
  FOCAL_ACTION: 'FOCAL_ACTION',
  SETTLING: 'SETTLING',
  COMPLETED: 'COMPLETED',
}

/**
 * Deterministic pseudo-random number generator (Mulberry32).
 * Allows test suites to verify exact geometry and prevents visual glitches.
 * @param {number} seed - integer seed
 * @returns {Function} () => [0, 1)
 */
export function createRng(seed = 12345) {
  let s = Math.floor(seed) >>> 0
  return function rng() {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Resolve normalized courtyard stage anchors to pixel coordinates.
 * @param {string} name - 'ground' | 'sky_high' | 'sky_mid' | 'ground_left' | 'ground_right'
 * @param {number} width - canvas width
 * @param {number} height - canvas height
 * @returns {{ x: number, y: number }}
 */
export function resolveAnchor(name, width, height) {
  const w = Math.max(1, width)
  const h = Math.max(1, height)

  switch (name) {
    case 'ground':
    default:
      return { x: w * 0.57, y: h * 0.73 }
    case 'sky_high':
      return { x: w * 0.5, y: h * 0.3 }
    case 'sky_mid':
      return { x: w * 0.5, y: h * 0.44 }
    case 'sky_left':
      return { x: w * 0.35, y: h * 0.35 }
    case 'sky_right':
      return { x: w * 0.65, y: h * 0.35 }
    case 'ground_left':
      return { x: w * 0.38, y: h * 0.73 }
    case 'ground_right':
      return { x: w * 0.72, y: h * 0.73 }
  }
}

/**
 * BudgetTracker enforces per-effect particle allocations so effects never
 * exceed their authored performance and memory limits.
 */
export class BudgetTracker {
  constructor(maxParticles = 250) {
    this.maxParticles = maxParticles
    this.allocated = 0
  }

  request(count) {
    const available = Math.max(0, this.maxParticles - this.allocated)
    const granted = Math.min(count, available)
    this.allocated += granted
    return granted
  }

  release(count = this.allocated) {
    this.allocated = Math.max(0, this.allocated - count)
  }

  reset() {
    this.allocated = 0
  }
}

/**
 * 1. emitFan — Authors a radiant angular fan of sparks.
 * Useful for Peacock Fan (plumes) and Comet Fan (sweeping trails).
 */
export function emitFan({
  particles,
  x,
  y,
  count = 30,
  angleBase = -Math.PI / 2, // upward default
  spread = Math.PI * 0.6,
  speedMin = 40,
  speedMax = 120,
  hues = [45],
  budgetTracker = null,
  reducedMotion = false,
  calmVisuals = false,
  rng = Math.random,
  config = {},
}) {
  if (!particles) return []
  const motionScale = reducedMotion ? 0.55 : 1.0
  const countScale = calmVisuals ? CALM_VISUALS_CONFIG.particleCountMultiplier : 1.0
  const requested = Math.max(1, Math.round(count * countScale))
  const actualCount = budgetTracker ? budgetTracker.request(requested) : requested

  const spawned = []
  const halfSpread = spread / 2

  for (let i = 0; i < actualCount; i++) {
    // Uniform angular dispersion with slight jitter
    const t = actualCount > 1 ? i / (actualCount - 1) : 0.5
    const angle = angleBase - halfSpread + t * spread + (rng() - 0.5) * 0.08
    const speed = (speedMin + rng() * (speedMax - speedMin)) * motionScale
    const hue = hues[Math.floor(rng() * hues.length)]

    const p = particles.spawn(x, y, {
      ...config,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      hue,
      size: (config.size || 2.5) * (reducedMotion ? 1.2 : 1.0),
      trail: reducedMotion ? Math.min(config.trail || 0, 4) : config.trail,
      gravity: config.gravity ?? 18,
      decay: config.decay ?? 0.8,
    })
    if (p) spawned.push(p)
  }

  return spawned
}

/**
 * 2. emitRing — Authors concentric circular or elliptical halos.
 * Useful for Ring Burst (expanding concentric rings).
 */
export function emitRing({
  particles,
  x,
  y,
  count = 40,
  speed = 90,
  hue = 45,
  radiusOffset = 0,
  aspectRatio = 1.0, // 1.0 for circular, < 1 for ground perspective ellipse
  budgetTracker = null,
  reducedMotion = false,
  calmVisuals = false,
  rng = Math.random,
  config = {},
}) {
  if (!particles) return []
  const motionScale = reducedMotion ? 0.45 : 1.0
  const countScale = calmVisuals ? CALM_VISUALS_CONFIG.particleCountMultiplier : 1.0
  const requested = Math.max(1, Math.round(count * countScale))
  const actualCount = budgetTracker ? budgetTracker.request(requested) : requested

  const spawned = []
  const angleStep = (Math.PI * 2) / actualCount

  for (let i = 0; i < actualCount; i++) {
    const angle = i * angleStep + (rng() - 0.5) * 0.05
    const v = speed * motionScale
    const vx = Math.cos(angle) * v
    const vy = Math.sin(angle) * v * aspectRatio
    const px = x + Math.cos(angle) * radiusOffset
    const py = y + Math.sin(angle) * radiusOffset * aspectRatio

    const p = particles.spawn(px, py, {
      ...config,
      vx,
      vy,
      hue,
      size: (config.size || 2.5) * (reducedMotion ? 1.25 : 1.0),
      decay: config.decay ?? 0.9,
      drag: config.drag ?? 0.97,
      gravity: config.gravity ?? 10,
    })
    if (p) spawned.push(p)
  }

  return spawned
}

/**
 * 3. emitArc — Authors a directional parabolic arc stream.
 * Useful for cascading fountains, comet trails, and mortar arcs.
 */
export function emitArc({
  particles,
  x,
  y,
  count = 20,
  startAngle = -Math.PI * 0.75,
  endAngle = -Math.PI * 0.25,
  speedMin = 50,
  speedMax = 110,
  gravity = 40,
  hue = 45,
  budgetTracker = null,
  reducedMotion = false,
  calmVisuals = false,
  rng = Math.random,
  config = {},
}) {
  if (!particles) return []
  const motionScale = reducedMotion ? 0.6 : 1.0
  const countScale = calmVisuals ? CALM_VISUALS_CONFIG.particleCountMultiplier : 1.0
  const requested = Math.max(1, Math.round(count * countScale))
  const actualCount = budgetTracker ? budgetTracker.request(requested) : requested

  const spawned = []
  for (let i = 0; i < actualCount; i++) {
    const t = actualCount > 1 ? i / (actualCount - 1) : 0.5
    const angle = startAngle + t * (endAngle - startAngle) + (rng() - 0.5) * 0.06
    const speed = (speedMin + rng() * (speedMax - speedMin)) * motionScale

    const p = particles.spawn(x, y, {
      ...config,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: gravity * (reducedMotion ? 0.7 : 1.0),
      hue,
      decay: config.decay ?? 0.75,
      trail: reducedMotion ? Math.min(config.trail || 0, 4) : config.trail,
    })
    if (p) spawned.push(p)
  }

  return spawned
}

/**
 * 4. emitTrail — Authors trailing filaments along an authored vector or target.
 * Useful for Golden Waterfall cascading filaments and ascending rocket tails.
 */
export function emitTrail({
  particles,
  startX,
  startY,
  endX,
  endY,
  count = 15,
  hue = 48,
  speedJitter = 10,
  budgetTracker = null,
  reducedMotion = false,
  calmVisuals = false,
  rng = Math.random,
  config = {},
}) {
  if (!particles) return []
  const countScale = calmVisuals ? CALM_VISUALS_CONFIG.particleCountMultiplier : 1.0
  const requested = Math.max(1, Math.round(count * countScale))
  const actualCount = budgetTracker ? budgetTracker.request(requested) : requested

  const spawned = []
  for (let i = 0; i < actualCount; i++) {
    const t = actualCount > 1 ? i / (actualCount - 1) : 0.5
    const x = startX + t * (endX - startX) + (rng() - 0.5) * 4
    const y = startY + t * (endY - startY) + (rng() - 0.5) * 4

    const p = particles.spawn(x, y, {
      ...config,
      vx: (config.vx || 0) + (rng() - 0.5) * speedJitter,
      vy: (config.vy || 0) + (rng() - 0.5) * speedJitter,
      hue,
      size: config.size || 2.0,
      gravity: config.gravity ?? 25,
      decay: config.decay ?? 0.9,
      shape: config.shape || 'spark',
    })
    if (p) spawned.push(p)
  }

  return spawned
}

/**
 * 5. emitPetal — Authors layered radial flower petal lobes.
 * Useful for Chrysanthemum Bloom and floral bursts.
 */
export function emitPetal({
  particles,
  x,
  y,
  petals = 6,
  particlesPerPetal = 6,
  speed = 80,
  hue = 330,
  budgetTracker = null,
  reducedMotion = false,
  calmVisuals = false,
  rng = Math.random,
  config = {},
}) {
  if (!particles) return []
  const motionScale = reducedMotion ? 0.45 : 1.0
  const countScale = calmVisuals ? CALM_VISUALS_CONFIG.particleCountMultiplier : 1.0
  const total = petals * particlesPerPetal
  const requested = Math.max(1, Math.round(total * countScale))
  const actualCount = budgetTracker ? budgetTracker.request(requested) : requested

  const spawned = []
  const perPetal = Math.max(1, Math.floor(actualCount / petals))

  for (let p = 0; p < petals; p++) {
    const petalAngle = (p * Math.PI * 2) / petals
    for (let i = 0; i < perPetal; i++) {
      // Shape particles into a rounded petal lobe
      const t = (i + 1) / perPetal // 0..1 outward distance
      const lobeSpread = 0.25 * (1 - t * 0.5)
      const angle = petalAngle + (rng() - 0.5) * lobeSpread
      const v = speed * t * motionScale

      const part = particles.spawn(x, y, {
        ...config,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
        hue,
        size: (config.size || 2.5) * (1 - t * 0.3),
        decay: config.decay ?? 0.85,
        drag: 0.96,
      })
      if (part) spawned.push(part)
    }
  }

  return spawned
}

/**
 * 6. emitStaggeredBurst — Coordinates rhythmic sequential bursts.
 * Useful for Ladi cracker chains and multi-shot aerial fans.
 */
export function emitStaggeredBurst({
  timeline,
  particles,
  positions = [],
  countPerBurst = 12,
  intervalMs = 150,
  onBurst = null,
  config = {},
}) {
  if (!timeline || !particles) return

  positions.forEach((pos, idx) => {
    const timeMs = idx * intervalMs
    timeline.schedule(timeMs, () => {
      onBurst?.(idx, pos)
      for (let i = 0; i < countPerBurst; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = (config.speedMin ?? 20) + Math.random() * (config.speedMax ?? 60)
        particles.spawn(pos.x, pos.y, {
          ...config,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
        })
      }
    })
  })
}

/**
 * AuthoredShowTimeline manages the 3 explicit phases:
 * ANTICIPATION → FOCAL_ACTION → SETTLING → COMPLETED.
 * Guarantees zero duplicate completion events, deterministic simulation time,
 * and clean cancellation without timer leakage.
 */
export class AuthoredShowTimeline {
  constructor({
    totalDurationMs = 4000,
    anticipationMs = 300,
    focalMs = 2500,
    onDone = null,
    onPhaseChange = null,
  } = {}) {
    this.totalDurationMs = totalDurationMs
    this.anticipationMs = anticipationMs
    this.focalMs = focalMs
    this.settlingMs = Math.max(0, totalDurationMs - anticipationMs - focalMs)

    this.phase = SHOW_PHASES.ANTICIPATION
    this.elapsedMs = 0
    this.completed = false
    this.cancelled = false
    this.onDone = onDone
    this.onPhaseChange = onPhaseChange
    this.events = []
    this.cleanupHandles = []

    this._schedulePhaseTransitions()
  }

  _schedulePhaseTransitions() {
    this.schedule(0, () => this._setPhase(SHOW_PHASES.ANTICIPATION))
    this.schedule(this.anticipationMs, () => this._setPhase(SHOW_PHASES.FOCAL_ACTION))
    this.schedule(this.anticipationMs + this.focalMs, () => this._setPhase(SHOW_PHASES.SETTLING))
  }

  _setPhase(newPhase) {
    if (this.phase !== newPhase && !this.cancelled && !this.completed) {
      this.phase = newPhase
      this.onPhaseChange?.(newPhase)
    }
  }

  schedule(timeMs, fn) {
    this.events.push({ timeMs, fn, fired: false })
    this.events.sort((a, b) => a.timeMs - b.timeMs)
  }

  addCleanup(fn) {
    if (typeof fn === 'function') {
      this.cleanupHandles.push(fn)
    }
  }

  advance(dtMs, maxCatchupSteps = 10) {
    if (this.cancelled || this.completed) return
    const maxSteps = Math.max(1, maxCatchupSteps)
    const STEP_SIZE = 50 // ms
    let remaining = Math.min(Math.max(0, dtMs), maxSteps * STEP_SIZE)

    while (remaining > 0 && !this.cancelled && !this.completed) {
      const step = Math.min(remaining, STEP_SIZE)
      this.elapsedMs += step
      remaining -= step

      for (const evt of this.events) {
        if (!evt.fired && this.elapsedMs >= evt.timeMs) {
          evt.fired = true
          evt.fn()
        }
      }

      if (this.elapsedMs >= this.totalDurationMs && !this.completed) {
        this.completed = true
        this.phase = SHOW_PHASES.COMPLETED
        this.onPhaseChange?.(SHOW_PHASES.COMPLETED)
        this.onDone?.()
      }
    }
  }

  cancel() {
    if (this.cancelled) return
    this.cancelled = true
    this.events = []
    this.cleanupHandles.forEach((fn) => {
      try {
        fn()
      } catch {}
    })
    this.cleanupHandles = []
  }
}
