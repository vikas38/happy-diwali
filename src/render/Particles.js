import { FLASH_INTERVAL_MS } from '../safety/limits.js'
import { CALM_VISUALS_CONFIG, FlashLimiter } from '../safety/calmVisuals.js'
// ===================================================================
// Particle Engine — Object-pooled, 60fps, additive neon glow
// ===================================================================
// Capacity: 800 particles. Shapes: circle, star, spark, confetti.
// Uses globalCompositeOperation='lighter' for glow particles.
// Zero allocation after warmup (pool is pre-allocated and reused).
// ===================================================================

const POOL_SIZE = 800

/**
 * Seeded RNG hook for testing environments.
 * Returns window.__SEEDED_RNG__() if defined; falls back to Math.random() in production.
 */
export function particleRng() {
  if (typeof window !== 'undefined' && typeof window.__SEEDED_RNG__ === 'function') {
    return window.__SEEDED_RNG__()
  }
  return Math.random()
}

export class Particles {
  constructor() {
    this.reducedMotion = false
    this.calmVisuals = false
    this.flashLimiter = new FlashLimiter()
    this._lastFlash = -Infinity
    this.pool = new Array(POOL_SIZE)
    for (let i = 0; i < POOL_SIZE; i++) {
      this.pool[i] = this._createParticle()
    }
    this.flashes = []
    this.activeCount = 0
    this._nextFree = 0 // round-robin start search index for efficiency
  }

  _createParticle() {
    return {
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      gravity: 0,
      drag: 0.98,
      size: 2,
      alpha: 1,
      decay: 1,
      hue: 0,
      sat: 100,
      light: 60,
      shape: 'circle',
      trail: null,
      maxTrail: 0,
      rotation: 0,
      rotSpeed: 0,
      glow: false,
      bounceY: null, // floor for bouncing
      bounceDamp: 0.5,
    }
  }

  /**
   * Find a free particle in the pool (round-robin search).
   * @returns {object|null} a particle object or null if pool is full
   */
  _getFree() {
    for (let i = 0; i < POOL_SIZE; i++) {
      const idx = (this._nextFree + i) % POOL_SIZE
      if (!this.pool[idx].active) {
        this._nextFree = (idx + 1) % POOL_SIZE
        return this.pool[idx]
      }
    }
    return null
  }

  /**
   * Spawn a single particle with the given configuration.
   * @param {number} x
   * @param {number} y
   * @param {object} config - particle properties
   * @returns {object|null} the spawned particle (for further modification)
   */
  spawn(x, y, config = {}) {
    const p = this._getFree()
    if (!p) return null

    p.age = 0
    p.active = true
    p.x = x
    p.y = y
    p.vx = config.vx || 0
    p.vy = config.vy || 0
    p.gravity = config.gravity || 0
    p.drag = config.drag ?? 0.98
    p.size = config.size || 2
    p.alpha = config.alpha ?? 1
    const baseDecay = config.decay ?? 1
    p.decay = this.calmVisuals
      ? baseDecay / CALM_VISUALS_CONFIG.particleLifetimeMultiplier
      : baseDecay
    p.hue = config.hue ?? 0
    p.sat = config.sat ?? 100
    p.light = config.light ?? 60
    p.shape = config.shape || 'circle'
    p.maxTrail = config.trail || 0
    p.trail = p.maxTrail > 0 ? [] : null
    p.rotation = config.rotation ?? particleRng() * Math.PI * 2
    p.rotSpeed = config.rotSpeed ?? 0
    p.glow = config.glow || false
    p.bounceY = config.bounceY ?? null
    p.bounceDamp = config.bounceDamp ?? 0.5

    return p
  }

  /**
   * Spawn a burst of particles with randomized angles and speeds.
   * @param {number} x
   * @param {number} y
   * @param {number} count
   * @param {object} config - burst config with angle, spread, speedMin/Max, hueMin/Max, etc.
   */
  burst(x, y, count, config = {}) {
    const actualCount = this.calmVisuals
      ? Math.max(1, Math.round(count * CALM_VISUALS_CONFIG.particleCountMultiplier))
      : count
    const speedMin = config.speedMin ?? 30
    const speedMax = config.speedMax ?? 100
    const sizeMin = config.sizeMin ?? 2
    const sizeMax = config.sizeMax ?? 4
    const angleBase = config.angle ?? 0
    const spread = config.spread ?? Math.PI * 2

    for (let i = 0; i < actualCount; i++) {
      const angle = angleBase + (particleRng() - 0.5) * spread
      const speed = speedMin + particleRng() * (speedMax - speedMin)
      const hue =
        config.hueMin !== undefined
          ? config.hueMin + particleRng() * ((config.hueMax ?? config.hueMin) - config.hueMin)
          : (config.hue ?? 0)

      this.spawn(x, y, {
        ...config,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        hue,
        size: sizeMin + particleRng() * (sizeMax - sizeMin),
      })
    }
  }

  update(dt, time) {
    this.flashes = this.flashes.filter((f) => (f.life -= dt) > 0)
    this.activeCount = 0
    const dragFactor = Math.pow(0.98, dt * 60) // frame-rate independent drag baseline

    for (const p of this.pool) {
      if (!p.active) continue
      this.activeCount++

      p.age += dt
      if (p.shape === 'smoke') p.size += dt * 13
      // Physics
      p.vy += p.gravity * dt
      const d = Math.pow(p.drag, dt * 60)
      p.vx *= d
      p.vy *= d
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.rotation += p.rotSpeed * dt

      // Bounce off floor
      if (p.bounceY !== null && p.y > p.bounceY && p.vy > 0) {
        p.y = p.bounceY
        p.vy = -p.vy * p.bounceDamp
        p.vx *= 0.7
        if (Math.abs(p.vy) < 10) p.vy = 0
      }

      // Trail
      if (p.trail) {
        p.trail.push({ x: p.x, y: p.y })
        if (p.trail.length > p.maxTrail) p.trail.shift()
      }

      // Alpha decay
      p.alpha -= p.decay * dt
      if (p.alpha <= 0) {
        p.active = false
        p.alpha = 0
      }
    }
  }

  draw(ctx, w, h, time) {
    // Smoke is behind the incandescent cores, with soft feathered edges.
    ctx.globalCompositeOperation = 'source-over'
    for (const p of this.pool) if (p.active && p.shape === 'smoke') this._drawParticle(ctx, p)
    ctx.globalCompositeOperation = 'lighter'
    for (const f of this.flashes) {
      const a = f.life / f.duration
      const radius = f.radius * (1.2 - a * 0.2)
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, radius)
      g.addColorStop(0, `hsla(${f.hue},100%,80%,${a * 0.3})`)
      g.addColorStop(0.2, `hsla(${f.hue},100%,60%,${a * 0.12})`)
      g.addColorStop(1, 'transparent')
      ctx.fillStyle = g
      ctx.fillRect(f.x - radius, f.y - radius, radius * 2, radius * 2)
    }
    // Pass 1: glow particles (additive)
    ctx.globalCompositeOperation = 'lighter'
    for (const p of this.pool) {
      if (!p.active || !p.glow) continue
      this._drawParticle(ctx, p)
    }
    ctx.globalCompositeOperation = 'source-over'

    // Pass 2: non-glow particles
    for (const p of this.pool) {
      if (!p.active || p.glow || p.shape === 'smoke') continue
      this._drawParticle(ctx, p)
    }
    ctx.globalAlpha = 1
  }

  _drawParticle(ctx, p) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha))
    ctx.fillStyle = `hsl(${p.hue}, ${p.sat}%, ${p.light}%)`

    // Smooth glowing trail with incandescent core
    if (p.trail && p.trail.length > 1) {
      ctx.lineCap = 'round'
      const alpha = Math.max(0, Math.min(1, p.alpha))
      for (let i = 1; i < p.trail.length; i++) {
        const heat = i / (p.trail.length - 1)
        ctx.globalAlpha = alpha * heat * heat * 0.8
        ctx.strokeStyle = `hsl(${p.hue - (1 - heat) * 12}, ${p.sat}%, ${Math.max(35, p.light - (1 - heat) * 30 - p.age * 8)}%)`
        ctx.lineWidth = Math.max(0.25, p.size * heat * 0.8)
        ctx.beginPath()
        ctx.moveTo(p.trail[i - 1].x, p.trail[i - 1].y)
        ctx.lineTo(p.trail[i].x, p.trail[i].y)
        ctx.stroke()
      }
      ctx.globalAlpha = alpha
    }

    switch (p.shape) {
      case 'smoke': {
        ctx.globalAlpha = Math.min(0.2, p.alpha) * Math.min(1, p.age * 4)
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size)
        g.addColorStop(0, '#b2a9a4')
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2)
        break
      }
      case 'circle': {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        if (p.glow && p.size > 2) {
          ctx.fillStyle = '#FFFDF5'
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 0.45, 0, Math.PI * 2)
          ctx.fill()
        }
        break
      }
      case 'star':
        this._drawStar(ctx, p.x, p.y, p.size, p.rotation)
        break
      case 'spark': {
        // Realistic motion-blurred elongated incandescent streak
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        const lengthMultiplier = Math.min(4.5, 1.8 + speed * 0.015)
        const angle = Math.atan2(p.vy, p.vx)

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(angle)

        // Outer colored spark envelope
        ctx.beginPath()
        ctx.ellipse(0, 0, p.size * lengthMultiplier, p.size * 0.7, 0, 0, Math.PI * 2)
        ctx.fill()

        // Incandescent white-hot center core
        if (p.glow) {
          ctx.fillStyle = '#FFFDF5'
          ctx.beginPath()
          ctx.ellipse(0, 0, p.size * lengthMultiplier * 0.55, p.size * 0.35, 0, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
        break
      }
      case 'confetti': {
        // Metallic festive foil chit with 3D perspective tumble
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        const flipY = Math.cos(p.rotation * 2)
        const fw = p.size * 2
        const fh = p.size * 0.8 * flipY

        ctx.fillRect(-p.size, -fh / 2, fw, Math.max(1, Math.abs(fh)))

        // Metallic sheen reflection line
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'
        ctx.fillRect(-p.size * 0.7, -fh / 2, p.size * 0.5, Math.max(1, Math.abs(fh)))
        ctx.restore()
        break
      }
    }
  }

  _drawStar(ctx, cx, cy, r, rotation) {
    // Realistic radiant 4-point diamond starburst with incandescent center
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(rotation)

    // Diamond 4-point flare
    ctx.beginPath()
    ctx.moveTo(0, -r * 1.5)
    ctx.quadraticCurveTo(0, 0, r * 1.5, 0)
    ctx.quadraticCurveTo(0, 0, 0, r * 1.5)
    ctx.quadraticCurveTo(0, 0, -r * 1.5, 0)
    ctx.quadraticCurveTo(0, 0, 0, -r * 1.5)
    ctx.closePath()
    ctx.fill()

    // Diagonal micro-rays
    ctx.beginPath()
    ctx.moveTo(0, -r * 0.7)
    ctx.lineTo(r * 0.7, 0)
    ctx.lineTo(0, r * 0.7)
    ctx.lineTo(-r * 0.7, 0)
    ctx.closePath()
    ctx.fill()

    // Incandescent white-hot center dot
    ctx.fillStyle = '#FFFDF5'
    ctx.beginPath()
    ctx.arc(0, 0, Math.max(0.8, r * 0.35), 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  /**
   * Deactivate all particles.
   */
  flash(x, y, radius = 120, hue = 38, duration = 0.35, timestamp) {
    const now = timestamp ?? (typeof performance !== 'undefined' ? performance.now() : Date.now())
    if (!this.flashLimiter.requestFlash(now, this.calmVisuals || this.reducedMotion)) {
      return false
    }
    this._lastFlash = now
    radius = Math.min(radius, 100)
    duration = Math.min(duration, 0.25)
    this.flashes.push({ x, y, radius, hue, duration, life: duration })
    if (this.flashes.length > 20) this.flashes.shift()
    return true
  }

  clear() {
    this.flashes = []
    this.flashLimiter.reset()
    for (const p of this.pool) p.active = false
    this.activeCount = 0
  }

  /**
   * Get the pool capacity (for tests).
   */
  get capacity() {
    return POOL_SIZE
  }
}

export { POOL_SIZE }
