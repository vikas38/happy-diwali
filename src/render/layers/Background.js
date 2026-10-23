// ===================================================================
// Background Layer — Authentic Indian Diwali Street & Mohalla
// ===================================================================
// Renders:
//   - Atmospheric Indian residential street (Gali/Mohalla) during Diwali
//   - Rich midnight sky, luminous moon with craters, distant festive fireworks
//   - Heritage haveli facades with carved Jharokha balconies & Chhatris
//   - Carved wooden Haveli doorway on the right with stone steps, diyas & Tulsi plant
//   - Authentic Rangoli placed at the HOUSE THRESHOLD / DOORSTEP (not camouflaging cracker)
//   - Cracker launchpad on open street marked by a clean, crisp white chalk circle
//   - Realistic 3D cracker props with high-contrast visibility and burning fuse sparks
//   - Traditional street lamp post, overhead criss-crossing festive bunting & fairy lights
//   - Distinct Safe Zone viewing mat with brass floral border
// ===================================================================

import { STAGE, drawCourtyard, propScale } from './Courtyard.js'
export const LAYOUT = STAGE

export function getLaunchPoint(w, h) {
  return { x: w * LAYOUT.launchX, y: h * LAYOUT.launchY }
}
export function getSafeZonePoint(w, h) {
  return { x: w * LAYOUT.safeX, y: h * LAYOUT.safeY }
}

export class Background {
  constructor() {
    this.stars = []
    this.distantFireworks = []
    this.ambientBursts = []
    this.buildings = []
    this.distantBuildings = []
    this.fairyLights = []
    this.torans = []
    this.rooftopDiyas = []
    this.streetDiyas = []
    this.doorstepDiyas = []
    this.w = 0
    this.h = 0
    this.currentCracker = 0
    this.gameState = 'SAFETY_SPLASH'
    this.fuseBurn = 0
  }

  setGameState(state, crackerIndex) {
    this.gameState = state
    if (crackerIndex !== undefined && crackerIndex !== null) {
      this.currentCracker = crackerIndex
    }
  }

  setCracker(index) {
    if (index !== undefined && index !== null) {
      this.currentCracker = index
    }
  }

  onResize(w, h) {
    this.w = w
    this.h = h
    this._generateStars()
    this._generateBuildings()
    this._generateFairyLights()
    this._generateTorans()
    this._generateDiyas()
    this._generateDistantFireworks()
  }

  _generateStars() {
    const count = 90
    this.stars = []
    const starPalette = ['#FFFDF5', '#FFD166', '#00F5D4', '#FF99C8', '#A2D2FF', '#FEE440']
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h * 0.55,
        size: 0.7 + Math.random() * 1.6,
        phase: Math.random() * Math.PI * 2,
        speed: 0.8 + Math.random() * 2.0,
        baseAlpha: 0.45 + Math.random() * 0.5,
        color: starPalette[Math.floor(Math.random() * starPalette.length)],
      })
    }
  }

  _generateBuildings() {
    const w = this.w
    const h = this.h
    const streetTop = h * LAYOUT.streetTop
    const buildingBase = streetTop + 12

    // Distant background silhouettes (layer 1)
    this.distantBuildings = []
    let dx = -30
    while (dx < w + 40) {
      const bw = 50 + Math.random() * 70
      const bh = 80 + Math.random() * (streetTop * 0.55)
      const domeType = Math.random() > 0.45 ? (Math.random() > 0.5 ? 'chhatri' : 'temple') : 'flat'
      this.distantBuildings.push({ x: dx, top: buildingBase - bh, w: bw, h: bh, domeType })
      dx += bw - 8
    }

    // Midground havelis (layer 2) — Vibrant Authentic Indian Color Palette
    this.buildings = []
    let x = -20
    const haveliPalettes = [
      {
        base: '#9F1239', // Jaipur Pink City Rose
        shade: '#881337',
        trim: '#F59E0B', // Golden Marigold Trim
        highlight: '#BE123C',
        jaali: '#FDE047',
      },
      {
        base: '#1E40AF', // Jodhpur Royal Indigo Blue
        shade: '#1E3A8A',
        trim: '#FBBF24',
        highlight: '#2563EB',
        jaali: '#FEF08A',
      },
      {
        base: '#B45309', // Jaisalmer Warm Golden Sandstone
        shade: '#92400E',
        trim: '#FDE047',
        highlight: '#D97706',
        jaali: '#FEF9C3',
      },
      {
        base: '#047857', // Udaipur Emerald Peacock Green
        shade: '#064E3B',
        trim: '#F59E0B',
        highlight: '#059669',
        jaali: '#FDE68A',
      },
      {
        base: '#6B21A8', // Mewar Amethyst Royal Violet
        shade: '#581C87',
        trim: '#F472B6',
        highlight: '#7E22CE',
        jaali: '#FBCFE8',
      },
      {
        base: '#BE185D', // Festive Fuchsia Ruby
        shade: '#9D174D',
        trim: '#FDE047',
        highlight: '#DB2777',
        jaali: '#FFFBEB',
      },
    ]

    let pIdx = 0
    while (x < w + 30) {
      const bw = 65 + Math.random() * 75
      const bh = 70 + Math.random() * (streetTop * 0.48)
      const top = buildingBase - bh
      const palette = haveliPalettes[pIdx % haveliPalettes.length]
      pIdx++

      // Windows with Indian cusped arch / jharokha styling
      const windows = []
      const winRows = Math.max(1, Math.floor(bh / 24))
      const winCols = Math.max(1, Math.floor(bw / 20))
      for (let r = 0; r < winRows; r++) {
        for (let c = 0; c < winCols; c++) {
          if (Math.random() < 0.65) {
            windows.push({
              x: 8 + c * (bw / winCols),
              y: 10 + r * 22,
              w: 7,
              h: 12,
              glow: Math.random() < 0.8,
              phase: Math.random() * Math.PI * 2,
            })
          }
        }
      }

      const hasTerrace = true
      const hasKandil = Math.random() < 0.55
      const kandilColor = ['#FF1493', '#FFB703', '#00F5D4', '#9D4EDD', '#FF5722'][
        Math.floor(Math.random() * 5)
      ]

      this.buildings.push({
        x,
        top,
        w: bw,
        h: bh,
        color: palette.base,
        palette,
        windows,
        hasTerrace,
        hasKandil,
        kandilColor,
      })
      x += bw + 4 + Math.random() * 10
    }
  }

  _generateDiyas() {
    this.rooftopDiyas = []
    for (const b of this.buildings) {
      const diyaCount = Math.floor(b.w / 22)
      for (let i = 0; i <= diyaCount; i++) {
        const dx = b.x + 4 + (i * (b.w - 8)) / Math.max(1, diyaCount)
        this.rooftopDiyas.push({
          x: dx,
          y: b.top - 2,
          phase: Math.random() * Math.PI * 2,
          speed: 6 + Math.random() * 8,
        })
      }
    }

    // Street edge diyas
    this.streetDiyas = []
    const streetTop = this.h * LAYOUT.streetTop
    const curbCount = Math.floor(this.w / 55)
    for (let i = 0; i <= curbCount; i++) {
      const x = (i / Math.max(1, curbCount)) * this.w
      this.streetDiyas.push({
        x: x + (Math.random() - 0.5) * 8,
        y: streetTop + 4 + Math.random() * 4,
        phase: Math.random() * Math.PI * 2,
        speed: 7 + Math.random() * 6,
      })
    }

    // Doorstep diyas near house entrance
    this.doorstepDiyas = []
    const doorX = this.w * 0.84
    const doorY = this.h * 0.74
    for (let i = 0; i < 4; i++) {
      this.doorstepDiyas.push({
        x: doorX - 25 + i * 16,
        y: doorY + 6,
        phase: i * 1.2,
        speed: 7,
      })
    }
  }

  _generateFairyLights() {
    const w = this.w
    const h = this.h
    const count = 3
    this.fairyLights = []
    const warmPalette = ['#FFD56B', '#FFA94D', '#FFE8A3']
    for (let i = 0; i < count; i++) {
      this.fairyLights.push({
        x1: -10,
        y1: h * (0.12 + i * 0.05),
        x2: w + 10,
        y2: h * (0.1 + i * 0.05),
        sag: 20 + i * 8,
        bulbCount: 22 + Math.floor(Math.random() * 8),
        color: warmPalette[i % warmPalette.length],
        phase: i * 0.8,
      })
    }
  }

  _generateTorans() {
    const w = this.w
    const h = this.h
    this.torans = []
    const positions = [w * 0.18, w * 0.72]
    for (const px of positions) {
      this.torans.push({
        x: px,
        y: h * 0.32,
        length: 50 + Math.random() * 20,
        flowers: 8,
        sway: Math.random() * Math.PI,
      })
    }
  }

  _generateDistantFireworks() {
    this.distantFireworks = [
      { x: this.w * 0.22, y: this.h * 0.2, color: '#FFB703', size: 22, delay: 0 },
      { x: this.w * 0.78, y: this.h * 0.16, color: '#FF4D6D', size: 26, delay: 1.6 },
      { x: this.w * 0.48, y: this.h * 0.13, color: '#00F5D4', size: 24, delay: 3.0 },
      { x: this.w * 0.35, y: this.h * 0.17, color: '#9D4EDD', size: 20, delay: 4.2 },
    ]
  }

  /* ── Ambient distant sky burst fireworks ──────────────────────────── */

  _spawnAmbientBurst(time, delay = 0) {
    const PALETTES = [
      ['#FFD700', '#FFA000', '#FFF59D', '#FF8F00'], // Golden Sparkle / Kamuro
      ['#FF1744', '#FF5252', '#FF8A80', '#FF4081'], // Festive Crimson / Rose
      ['#00E676', '#69F0AE', '#00F5D4', '#1DE9B6'], // Emerald Glow
      ['#D500F9', '#E040FB', '#7C4DFF', '#B388FF'], // Royal Violet / Purple
      ['#FF6D00', '#FF9100', '#FFD180', '#FF3D00'], // Vibrant Tangerine / Saffron
      ['#00E5FF', '#18FFFF', '#80D8FF', '#40C4FF'], // Electric Sky Blue
    ]

    const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)]
    // Burst across the upper sky area (avoiding direct lower ground stage)
    const launchX = 0.08 + Math.random() * 0.84
    const launchY = 0.07 + Math.random() * 0.23
    const burstType =
      Math.random() < 0.45 ? 'chrysanthemum' : Math.random() < 0.5 ? 'willow' : 'ring'
    const count = burstType === 'willow' ? 24 : burstType === 'ring' ? 22 : 32
    const riseTime = 0.35 + Math.random() * 0.15

    const particles = []
    for (let i = 0; i < count; i++) {
      const angle =
        burstType === 'ring'
          ? (i / count) * Math.PI * 2
          : (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.35
      const speed =
        burstType === 'willow'
          ? 24 + Math.random() * 32
          : burstType === 'ring'
            ? 42 + (i % 2) * 6
            : 32 + Math.random() * 45
      particles.push({
        angle,
        speed,
        color: palette[Math.floor(Math.random() * palette.length)],
        size: 1.2 + Math.random() * 1.6,
        alpha: 0.85 + Math.random() * 0.15,
        twinkleOffset: Math.random() * Math.PI * 2,
        drag: burstType === 'willow' ? 0.96 : 0.94,
        gravity: burstType === 'willow' ? 28 : 14,
      })
    }

    if (!this.ambientBursts) this.ambientBursts = []
    this.ambientBursts.push({
      x: launchX,
      y: launchY,
      trailStartY: 0.52 + Math.random() * 0.06,
      born: time + delay,
      riseTime,
      life: riseTime + 1.2 + Math.random() * 0.6,
      particles,
      burstType,
      primaryColor: palette[0],
    })

    // 30% chance of a staggered double burst (second shot volley)
    if (delay === 0 && Math.random() < 0.32) {
      this._spawnAmbientBurst(time, 0.18 + Math.random() * 0.12)
    }
  }

  _drawAmbientBursts(ctx, w, h, time) {
    if (!this.ambientBursts || this.ambientBursts.length === 0) return
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'

    for (const burst of this.ambientBursts) {
      const age = time - burst.born
      if (age < 0) continue // Future scheduled burst

      const bx = burst.x * w
      const by = burst.y * h

      // ── Phase 1: Rising streak / comet ──────────────────
      if (age < burst.riseTime) {
        const tRise = age / burst.riseTime
        const easeRise = tRise * (2 - tRise) // easeOutQuad
        const startY = burst.trailStartY * h
        const headY = startY + (by - startY) * easeRise
        const tailY = startY + (by - startY) * Math.max(0, easeRise - 0.18)

        // Streak tail
        ctx.strokeStyle = 'rgba(255, 214, 140, 0.75)'
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.moveTo(bx, tailY)
        ctx.lineTo(bx, headY)
        ctx.stroke()

        // Glowing head
        ctx.fillStyle = '#FFF8E1'
        ctx.beginPath()
        ctx.arc(bx, headY, 2.2, 0, Math.PI * 2)
        ctx.fill()

        // Tiny sparks trailing the comet
        for (let i = 0; i < 2; i++) {
          const sparkY = headY + (i + 1) * 5 + Math.sin(time * 40 + i) * 2
          const sparkX = bx + Math.sin(time * 30 + i * 2) * 2
          ctx.fillStyle = 'rgba(255, 170, 50, 0.6)'
          ctx.beginPath()
          ctx.arc(sparkX, sparkY, 1, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // ── Phase 2: Shell explosion & particle dispersal ───
      if (age >= burst.riseTime) {
        const burstAge = age - burst.riseTime
        const burstLife = burst.life - burst.riseTime
        const t = Math.min(1, burstAge / burstLife)
        const easeExpand = 1 - Math.pow(1 - t, 3) // easeOutCubic
        const fade = Math.pow(1 - t, 1.4)

        // Ambient bursts use particles without an additional flash overlay.
        // Render bursting particles
        for (const p of burst.particles) {
          const dist = easeExpand * p.speed
          const dragFactor = Math.pow(p.drag, burstAge * 60)
          const gravityDrop = t * t * p.gravity

          const px = bx + Math.cos(p.angle) * dist * dragFactor
          const py = by + Math.sin(p.angle) * dist * dragFactor + gravityDrop

          // Sparkle twinkle factor
          const twinkle = 0.75 + 0.25 * Math.sin(time * 28 + p.twinkleOffset)
          const pAlpha = p.alpha * fade * twinkle
          if (pAlpha < 0.02) continue

          const pSize = Math.max(0.6, p.size * (1 - t * 0.45))

          // Particle body
          ctx.globalAlpha = pAlpha
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(px, py, pSize, 0, Math.PI * 2)
          ctx.fill()

          // Glittering halo around bright embers
          if (t < 0.5) {
            ctx.globalAlpha = pAlpha * 0.35
            ctx.beginPath()
            ctx.arc(px, py, pSize * 2.2, 0, Math.PI * 2)
            ctx.fill()
          }

          // Trailing ember tail for willow effect
          if (burst.burstType === 'willow' && t < 0.8) {
            ctx.globalAlpha = pAlpha * 0.25
            ctx.beginPath()
            ctx.arc(px - Math.cos(p.angle) * 3, py - 3, pSize * 0.6, 0, Math.PI * 2)
            ctx.fill()
          }
        }
        ctx.globalAlpha = 1
      }
    }

    ctx.restore()
  }

  illuminate(amount) {
    this.light = Math.max(this.light || 0, amount)
  }

  update(dt, time) {
    this.light = Math.max(0, (this.light || 0) - dt * 0.8)

    // Schedule and trigger ambient sky bursts every 1.5 - 3.2 seconds
    if (!this.ambientBursts) this.ambientBursts = []
    if (this._nextBurstTime === undefined) {
      this._nextBurstTime = time + 0.6 // quick first burst on launch
    }
    if (time >= this._nextBurstTime) {
      this._spawnAmbientBurst(time)
      this._nextBurstTime = time + 1.4 + Math.random() * 2.0
    }

    // Clean up finished bursts
    this.ambientBursts = this.ambientBursts.filter((b) => time - b.born < b.life)
  }

  draw(ctx, w, h, time) {
    const motionPaused = Boolean(this.reducedMotion || this.calmVisuals)
    drawCourtyard(ctx, w, h, time, this.gameState, motionPaused)
    if (!motionPaused) this._drawAmbientBursts(ctx, w, h, time)
    this._drawCrackerOnLaunchpad(ctx, w, h, time)
    if (this.light > 0) {
      ctx.fillStyle = `rgba(255,187,100,${this.light * 0.25})`
      ctx.fillRect(0, h * 0.6, w, h * 0.4)
    }
  }

  _drawCrackerOnLaunchpad(ctx, w, h, time) {
    const activeStates = [
      'READY_ON_STREET',
      'STEPPING_BACK_SAFE_ROUTINE',
      'COUNTDOWN_3_2_1',
      'CRACKER_SHOW_ACTIVE',
    ]
    if (!activeStates.includes(this.gameState)) return

    const cx = w * LAYOUT.launchX
    const cy = h * LAYOUT.launchY - 6
    const isBurning = this.gameState === 'COUNTDOWN_3_2_1'
    const isReady = this.gameState === 'READY_ON_STREET'

    ctx.save()

    if (this.gameState === 'CRACKER_SHOW_ACTIVE' && [3, 4, 5].includes(this.currentCracker)) {
      ctx.restore()
      return
    }
    const size = propScale(w, h)
    ctx.translate(cx, cy)
    ctx.scale(size, size)
    ctx.translate(-cx, -cy)

    // Dedicated high-contrast drop shadow so cracker stands out with 3D depth
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.beginPath()
    ctx.ellipse(cx, cy + 4, 18, 5, 0, 0, Math.PI * 2)
    ctx.fill()

    // Draw the realistic 3D-shaded cracker prop
    switch (this.currentCracker) {
      case 0: // Phuljhari
        this._drawPhuljhariProp(ctx, cx, cy, time, isBurning)
        break
      case 1: // Anar
        this._drawAnarProp(ctx, cx, cy, time, isBurning)
        break
      case 2: // Chakri
        this._drawChakriProp(ctx, cx, cy, time, isBurning)
        break
      case 3: // Rocket
        this._drawRocketProp(ctx, cx, cy, time, isBurning)
        break
      case 4: // Ladi
        this._drawLadiProp(ctx, cx, cy, time, isBurning)
        break
      case 5: // Sutli Bomb
        this._drawSutliProp(ctx, cx, cy, time, isBurning)
        break
    }

    ctx.restore()
  }

  _drawPhuljhariProp(ctx, cx, cy, time, isBurning) {
    ctx.strokeStyle = '#D1D5DB'
    ctx.lineWidth = 1.8
    ctx.beginPath()
    ctx.moveTo(cx, cy + 18)
    ctx.lineTo(cx - 6, cy - 36)
    ctx.stroke()

    const grad = ctx.createLinearGradient(cx, cy + 6, cx - 6, cy - 30)
    grad.addColorStop(0, '#374151')
    grad.addColorStop(0.5, '#6B7280')
    grad.addColorStop(1, '#9CA3AF')
    ctx.strokeStyle = grad
    ctx.lineWidth = 4.5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(cx - 1, cy + 4)
    ctx.lineTo(cx - 5.5, cy - 28)
    ctx.stroke()

    if (isBurning) {
      this._drawFuseSparks(ctx, cx - 6, cy - 30, time)
    }
  }

  _drawAnarProp(ctx, cx, cy, time, isBurning) {
    const potH = 28
    const topW = 6
    const baseW = 20

    const potGrad = ctx.createLinearGradient(cx - baseW / 2, cy, cx + baseW / 2, cy)
    potGrad.addColorStop(0, '#B45309')
    potGrad.addColorStop(0.3, '#F59E0B')
    potGrad.addColorStop(0.7, '#FCD34D')
    potGrad.addColorStop(1, '#92400E')
    ctx.fillStyle = potGrad
    ctx.beginPath()
    ctx.moveTo(cx - topW / 2, cy - potH)
    ctx.lineTo(cx + topW / 2, cy - potH)
    ctx.lineTo(cx + baseW / 2, cy)
    ctx.lineTo(cx - baseW / 2, cy)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#DC2626'
    ctx.fillRect(cx - baseW * 0.38, cy - potH * 0.6, baseW * 0.76, potH * 0.28)

    ctx.fillStyle = '#FDE047'
    ctx.beginPath()
    ctx.arc(cx, cy - potH * 0.46, 3, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = '#E5E7EB'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(cx, cy - potH)
    ctx.quadraticCurveTo(cx + 4, cy - potH - 6, cx + 2, cy - potH - 10)
    ctx.stroke()

    if (isBurning) {
      this._drawFuseSparks(ctx, cx + 2, cy - potH - 10, time)
    }
  }

  _drawChakriProp(ctx, cx, cy, time, isBurning) {
    const r = 16
    const rot = this.gameState === 'CRACKER_SHOW_ACTIVE' ? time * 24 : 0

    ctx.save()
    ctx.translate(cx, cy - 4)
    ctx.rotate(rot)

    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, r)
    grad.addColorStop(0, '#FBBF24')
    grad.addColorStop(0.5, '#EF4444')
    grad.addColorStop(0.8, '#10B981')
    grad.addColorStop(1, '#D97706')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = '#FEF08A'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let a = 0; a < Math.PI * 4; a += 0.2) {
      const dist = (a / (Math.PI * 4)) * (r - 2)
      const x = Math.cos(a) * dist
      const y = Math.sin(a) * dist
      if (a === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    ctx.restore()

    if (isBurning) {
      this._drawFuseSparks(ctx, cx + r - 2, cy - 4, time)
    }
  }

  _drawRocketProp(ctx, cx, cy, time, isBurning) {
    ctx.strokeStyle = '#B45309'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cx, cy + 12)
    ctx.lineTo(cx, cy - 30)
    ctx.stroke()

    const bodyW = 9
    const bodyH = 22
    const bodyY = cy - 28

    const rocketGrad = ctx.createLinearGradient(cx - bodyW / 2, bodyY, cx + bodyW / 2, bodyY)
    rocketGrad.addColorStop(0, '#B91C1C')
    rocketGrad.addColorStop(0.5, '#F87171')
    rocketGrad.addColorStop(1, '#991B1B')
    ctx.fillStyle = rocketGrad
    ctx.fillRect(cx - bodyW / 2, bodyY, bodyW, bodyH)

    ctx.fillStyle = '#FBBF24'
    ctx.fillRect(cx - bodyW / 2, bodyY + 4, bodyW, 2)
    ctx.fillRect(cx - bodyW / 2, bodyY + 12, bodyW, 2)

    ctx.fillStyle = '#F59E0B'
    ctx.beginPath()
    ctx.moveTo(cx, bodyY - 10)
    ctx.lineTo(cx + bodyW / 2, bodyY)
    ctx.lineTo(cx - bodyW / 2, bodyY)
    ctx.closePath()
    ctx.fill()

    if (isBurning) {
      this._drawFuseSparks(ctx, cx, bodyY + bodyH, time)
    }
  }

  _drawLadiProp(ctx, cx, cy, time, isBurning) {
    const miniCount = 8
    ctx.strokeStyle = '#F3F4F6'
    ctx.lineWidth = 1.2
    ctx.beginPath()

    const startX = cx - 22
    for (let i = 0; i < miniCount; i++) {
      const px = startX + i * 6.5
      const py = cy - 2 + Math.sin(i * 0.8) * 3

      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)

      ctx.save()
      ctx.fillStyle = '#DC2626'
      ctx.fillRect(px - 1.8, py - 4, 3.6, 9)
      ctx.fillStyle = '#FBBF24'
      ctx.fillRect(px - 1.8, py - 1, 3.6, 1.5)
      ctx.restore()
    }
    ctx.stroke()

    if (isBurning) {
      this._drawFuseSparks(ctx, startX, cy - 2, time)
    }
  }

  _drawSutliProp(ctx, cx, cy, time, isBurning) {
    const sz = 16
    const topY = cy - sz

    const cubeGrad = ctx.createLinearGradient(cx - sz / 2, topY, cx + sz / 2, topY + sz)
    cubeGrad.addColorStop(0, '#15803D')
    cubeGrad.addColorStop(0.5, '#22C55E')
    cubeGrad.addColorStop(1, '#14532D')
    ctx.fillStyle = cubeGrad
    ctx.fillRect(cx - sz / 2, topY, sz, sz)

    ctx.strokeStyle = '#D97706'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(cx, topY)
    ctx.lineTo(cx, topY + sz)
    ctx.moveTo(cx - sz / 2, topY + sz / 2)
    ctx.lineTo(cx + sz / 2, topY + sz / 2)
    ctx.stroke()

    ctx.strokeStyle = '#F3F4F6'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(cx, topY)
    ctx.quadraticCurveTo(cx + 4, topY - 5, cx + 2, topY - 9)
    ctx.stroke()

    if (isBurning) {
      this._drawFuseSparks(ctx, cx + 2, topY - 9, time)
    }
  }

  _drawFuseSparks(ctx, fx, fy, time) {
    if (this.reducedMotion) time = 0
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'

    const flick = Math.sin(time * 25) * 1.5
    ctx.fillStyle = '#FFFDF5'
    ctx.beginPath()
    ctx.arc(fx, fy, 2.5 + flick, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#FFA500'
    ctx.beginPath()
    ctx.arc(fx, fy, 5 + flick, 0, Math.PI * 2)
    ctx.fill()

    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + time * 12
      const dist = 5 + ((i * 2 + Math.sin(time * 20)) % 6)
      ctx.fillStyle = '#FFD700'
      ctx.beginPath()
      ctx.arc(fx + Math.cos(a) * dist, fy + Math.sin(a) * dist, 1, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }
}
