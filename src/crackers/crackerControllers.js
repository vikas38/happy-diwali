import { effectOrigin, STAGE } from '../render/layers/Courtyard.js'
import { playFireworkSound } from '../audio/FireworkSound.js'
import { CALM_VISUALS_CONFIG } from '../safety/calmVisuals.js'
export { fireRewardConfetti } from './rewardConfetti.js'
export const SHOW_DURATIONS = {
  0: 3000,
  1: 3500,
  2: 3500,
  3: 4000,
  4: 4500,
  5: 5000,
  6: 4500,
  7: 4500,
  8: 4000,
  9: 4500,
  10: 4000,
  11: 4000,
  12: 4500,
  13: 5000,
}
const TAU = Math.PI * 2
export const CRACKER_TEST_META = {
  0: { audioType: 'granular-crackle', particleShape: 'spark', durationMs: 3000 },
  1: { audioType: 'noise-fountain', particleShape: 'spark', durationMs: 3500 },
  2: { audioType: 'pulsed-noise', particleShape: 'spark', durationMs: 3500 },
  3: { audioType: 'exhaust-impact', particleShape: 'spark', durationMs: 4000 },
  4: { audioType: 'noise-impact', particleShape: 'spark', durationMs: 4500 },
  5: { audioType: 'sub-drop', particleShape: 'spark', durationMs: 5000 },
  6: { audioType: 'cascade-gold', particleShape: 'filament', durationMs: 4500 },
  7: { audioType: 'arcing-sweep', particleShape: 'star', durationMs: 4500 },
  8: { audioType: 'harmonic-ring', particleShape: 'halo', durationMs: 4000 },
  9: { audioType: 'fluttering-fan', particleShape: 'feather', durationMs: 4500 },
  10: { audioType: 'curling-trail', particleShape: 'spiral', durationMs: 4000 },
  11: { audioType: 'radial-petals', particleShape: 'petal', durationMs: 4000 },
  12: { audioType: 'twin-bloom', particleShape: 'flower', durationMs: 4500 },
  13: { audioType: 'starlit-chime', particleShape: 'constellation', durationMs: 5000 },
}

/**
 * ShowTimeline coordinates visual emission, audio cues, and settling phases
 * against simulation time without wall-clock drift or stutter jumps.
 */
export class ShowTimeline {
  constructor(duration, onDone) {
    this.duration = duration
    this.elapsed = 0
    this.completed = false
    this.cancelled = false
    this.events = []
    this.onDone = onDone
  }

  schedule(timeMs, fn) {
    this.events.push({ timeMs, fn, fired: false })
    this.events.sort((a, b) => a.timeMs - b.timeMs)
  }

  advance(dtMs) {
    if (this.cancelled || this.completed) return
    const MAX_CATCHUP_STEPS = 10
    const STEP_SIZE = 50 // ms
    let remaining = Math.min(Math.max(0, dtMs), MAX_CATCHUP_STEPS * STEP_SIZE)

    while (remaining > 0 && !this.cancelled && !this.completed) {
      const step = Math.min(remaining, STEP_SIZE)
      this.elapsed += step
      remaining -= step

      for (const evt of this.events) {
        if (!evt.fired && this.elapsed >= evt.timeMs) {
          evt.fired = true
          evt.fn()
        }
      }

      if (this.elapsed >= this.duration && !this.completed) {
        this.completed = true
        this.onDone?.()
      }
    }
  }

  cancel() {
    this.cancelled = true
    this.events = []
  }
}

export function playCrackerShow(index, engines, onDone) {
  const { particles: p, renderer: r, sound, background, jellySquash } = engines
  const duration = SHOW_DURATIONS[index] ?? 3000,
    timers = [],
    sounds = []
  let cancelled = false,
    tick = 0
  const { x, y } = effectOrigin(index, r.width, r.height)
  const scale = Math.max(0.7, Math.min(1.5, r.height / 650, r.width / 650))
  const calm = Boolean(p.calmVisuals || r._calmVisuals)
  const motionReduced = Boolean(r._reducedMotion || p.reducedMotion)
  p.reducedMotion = motionReduced
  p.calmVisuals = calm
  if (jellySquash) jellySquash.calmVisuals = calm
  const getDensity = () => {
    const isCalm = Boolean(p.calmVisuals || r._calmVisuals)
    const isMotionReduced = Boolean(r._reducedMotion || p.reducedMotion)
    return isCalm ? CALM_VISUALS_CONFIG.particleCountMultiplier : isMotionReduced ? 0.55 : 1
  }
  const density = {
    valueOf: getDensity,
    [Symbol.toPrimitive]: getDensity,
  }

  const palette =
    engines?.store?.getState?.()?.selectedPalette ||
    engines?.store?.state?.selectedPalette ||
    'GOLD'

  const getPaletteHue = (offset = 0) => {
    if (palette === 'RAINBOW') {
      return (Math.random() * 360 + offset) % 360
    }
    if (palette === 'ROSE') {
      return (330 + Math.random() * 30 + offset) % 360
    }
    if (palette === 'EMERALD') {
      return (145 + Math.random() * 35 + offset) % 360
    }
    return 32 + Math.random() * 17
  }

  // Create coordinated timeline for emission, audio, and settling phases
  const timeline = new ShowTimeline(duration, () => {
    clean()
    onDone?.()
  })

  const later = (fn, ms) => {
    timeline.schedule(ms, () => {
      if (!cancelled) fn()
    })
  }

  const audio = (kind, seconds = 1, px = x) =>
    sounds.push(playFireworkSound(sound, kind, seconds, (px / r.width - 0.5) * 1.2))

  const smoke = (px, py, size = 18) =>
    p.spawn(px, py, {
      shape: 'smoke',
      vx: 12 + Math.random() * 12,
      vy: -20 - Math.random() * 18,
      gravity: -3,
      drag: 0.998,
      size,
      alpha: 0.28,
      decay: 0.1,
      hue: 30,
      sat: 8,
      light: 60,
    })

  const spark = (px, py, vx, vy, extra = {}) =>
    p.spawn(px, py, {
      vx: vx * scale,
      vy: vy * scale,
      gravity: 115 * scale,
      drag: 0.992,
      size: 0.85 + Math.random() * 1.25,
      alpha: 1,
      decay: 0.55 + Math.random() * 0.4,
      hue: extra.hue !== undefined ? extra.hue : getPaletteHue(),
      sat: 85,
      light: 82,
      shape: 'spark',
      glow: true,
      trail: 9,
      ...extra,
    })

  const flash = (px, py, radius = 140, hue = 38) => {
    if (calm) return
    p.flash?.(px, py, radius * scale, hue, motionReduced ? 0.2 : 0.45)
  }

  const burst = (px, py, count = 100, power = 220, hue) => {
    const burstHue = hue !== undefined ? hue : getPaletteHue()
    flash(px, py, 220, burstHue)
    for (let i = 0; i < count * density; i++) {
      const a = (i / (count * density)) * TAU + (Math.random() - 0.5) * 0.1
      const speed = power * (0.3 + Math.random() * 0.7)
      spark(px, py, Math.cos(a) * speed, Math.sin(a) * speed, {
        hue: burstHue + Math.random() * 12,
        decay: 0.35 + Math.random() * 0.2,
        gravity: 70 * scale,
        drag: 0.992,
        trail: 12,
      })
    }
    for (let i = 0; i < 4; i++) smoke(px + (i - 2) * 10, py, 25)
  }

  // Audio identity cues scheduled with the visual start
  if (index === 0) audio('sparkler', 2.2)
  if (index === 1) audio('fountain', 2.5)
  if (index === 2) audio('spinner', 2.5)
  if (index === 3) audio('whoosh', 1.15)
  if (index === 5) audio('fuse', 1.5)

  // Simulation step function executed per frame or timer step
  const emitterStep = (dtMs) => {
    if (cancelled) return
    timeline.advance(dtMs)
    const t = timeline.elapsed / 1000
    tick++

    if (index === 0 && t < 2.2) {
      const power = 70 + Math.sin(t * 8) * 20
      for (let i = 0; i < 7 * density; i++) {
        const a = Math.random() * TAU
        spark(x, y, Math.cos(a) * power * (0.4 + Math.random()), Math.sin(a) * power, {
          gravity: 70,
          decay: 1.1,
          trail: 4,
        })
      }
      if (tick % 5 === 0) {
        smoke(x, y, 8)
        flash(x, y, 45)
      }
    }

    if (index === 1 && t < 2.5) {
      const strength = Math.sin(Math.min(1, t / 2.8) * Math.PI) * 0.65 + 0.45
      for (let i = 0; i < 10 * density; i++)
        spark(
          x,
          y,
          (Math.random() - 0.5) * 150 * strength,
          -(220 + Math.random() * 330) * strength,
          {
            gravity: 200 * scale,
            decay: 0.5 + Math.random() * 0.3,
            trail: 8,
            bounceY: r.height * STAGE.launchY,
            bounceDamp: 0.22,
          }
        )
      if (tick % 4 === 0) {
        smoke(x, y, 17)
        flash(x, y, 130)
      }
    }

    if (index === 2 && t < 2.5) {
      const a = t * 20 + t * t * 8
      for (let i = 0; i < 8 * density; i++) {
        const angle = a + i * 0.17
        spark(
          x + Math.cos(a) * 18,
          y + Math.sin(a) * 6,
          Math.cos(angle) * 300,
          Math.sin(angle) * 90 - 40,
          { gravity: 40, decay: 1.5, drag: 0.985, bounceY: y + 15, bounceDamp: 0.15 }
        )
      }
      if (tick % 5 === 0) {
        smoke(x, y, 12)
        flash(x, y, 100)
      }
    }

    if (index === 3 && t < 1.15) {
      const k = t / 1.15,
        ry = y - (y - r.height * 0.26) * k * k,
        rx = x + Math.sin(k * 2) * 14
      for (let i = 0; i < 5 * density; i++)
        spark(rx, ry, (Math.random() - 0.5) * 25, 70 + Math.random() * 60, {
          gravity: 40,
          decay: 1.5,
          trail: 6,
        })
      p.flash?.(rx, ry, 35, 38, 0.09)
      if (tick % 3 === 0) smoke(rx, ry, 8)
    }
  }

  let lastDriveSource = 'timer'
  let lastFrameTime = typeof performance !== 'undefined' ? performance.now() : Date.now()

  // 1. Primary timeline driver: frame update hook from active renderer
  const timelineLayer = {
    update(dt) {
      if (cancelled) return
      lastDriveSource = 'renderer'
      // dt from renderer is already clamped by MAX_DT (<= 1/30s)
      emitterStep(dt * 1000)
    },
  }
  if (typeof r?.addLayer === 'function') {
    r.addLayer(timelineLayer)
  }

  // 2. Fallback driver for headless/unit test runs or when RAF is idle
  const intervalDriver = setInterval(() => {
    if (cancelled) return
    if (r?.running && lastDriveSource === 'renderer') {
      lastDriveSource = 'timer'
      return
    }
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const dt = Math.min(50, Math.max(10, now - lastFrameTime))
    lastFrameTime = now
    emitterStep(dt)
  }, 25)
  timers.push(intervalDriver)

  // Authored midshow timeline events
  if (index === 3) {
    later(() => {
      const rx = x + Math.sin(2) * 14,
        ry = r.height * 0.26
      burst(rx, ry, 150, 230, 35)
      audio('boom', 1, rx)
    }, 1150)
    later(() => {
      const ry = r.height * 0.26
      for (let i = 0; i < 45 * density; i++) {
        const a = Math.random() * TAU
        spark(x + Math.cos(a) * 80, ry + Math.sin(a) * 60, Math.cos(a) * 75, Math.sin(a) * 75, {
          hue: 42,
          decay: 1.1,
          trail: 4,
        })
      }
      audio('sparkler', 0.5)
    }, 1900)
  }

  if (index === 4) {
    for (let i = 0; i < 8; i++) {
      later(() => {
        const px = x + i * 7
        burst(px, y, 24, 140, 28)
        audio('pop', 0.2, px)
        if (!motionReduced && i % 2 === 0) jellySquash?.trigger(0.015)
      }, i * 180)
    }
  }

  if (index === 5) {
    later(() => {
      burst(x, y, 130, 310, 32)
      audio('boom', 1.2)
      for (let i = 0; i < 8; i++) smoke(x + (i - 4) * 12, y, 35)
      if (!motionReduced) jellySquash?.trigger(0.035)
    }, 1500)
  }

  function clean() {
    if (cancelled) return
    cancelled = true
    timeline.cancel()
    timers.forEach((id) => {
      clearTimeout(id)
      clearInterval(id)
    })
    if (typeof r?.removeLayer === 'function') {
      r.removeLayer(timelineLayer)
    }
    sounds.forEach((stop) => {
      try {
        ;(typeof stop === 'function' ? stop : stop.stop)?.()
      } catch {}
    })
  }

  return clean
}
