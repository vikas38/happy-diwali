// ===================================================================
// Pip the Diya — Handcrafted Terracotta Oil Lamp Sidekick
// ===================================================================
// Features:
//   - Authentic handcrafted clay terracotta pottery texture with earthen lip
//   - Real glistening ghee/oil reservoir and twisted cotton wick (baati)
//   - Multi-layer realistic flame: blue flame base, incandescent white core,
//     vibrant saffron halo, and audio-reactive dancing flickers
//   - Soulful expressive eyes with firelight reflections and clay cheeks
//   - Responsive scale matching Chhotu on desktop & mobile viewports
// ===================================================================

export const PIP_MOODS = {
  IDLE: 'IDLE',
  HIDE: 'HIDE',
  HAPPY: 'HAPPY',
}

export class Pip {
  constructor() {
    this.x = 0
    this.y = 0
    this.scale = 1
    this.facing = 1
    this.mood = PIP_MOODS.IDLE
    this.visible = true
    this.reducedMotion = false
    this._bouncePhase = 0
    this._hideAmount = 0
    this._hideTarget = 0
    this._jumpY = 0
    this._jumpActive = false
    this._jumpElapsed = 0
    this._jumpDuration = 0.5
    this._flameFlicker = 0
    this._blinkTimer = 3 + Math.random() * 3
    this._blinkProgress = 0
    this._blinkDir = 0
    this._heartTimer = 0
    this._hearts = []
    this.getAudioLevel = () => 0
  }

  // ---- Control methods ----

  setPosition(x, y) {
    this.x = x
    this.y = y
  }

  setMood(mood) {
    this.mood = mood
    this._hideTarget = mood === PIP_MOODS.HIDE ? 1 : 0
    if (mood === PIP_MOODS.HAPPY) {
      this._heartTimer = 0
    }
  }

  jump(duration = 0.5) {
    if (this.reducedMotion) {
      this._jumpActive = false
      this._jumpY = 0
      return
    }
    this._jumpActive = true
    this._jumpDuration = duration
    this._jumpElapsed = 0
  }

  reset() {
    this.mood = PIP_MOODS.IDLE
    this._hideTarget = 0
    this._jumpActive = false
    this._jumpY = 0
    this._hearts = []
  }

  // ---- Update ----

  update(dt, time) {
    if (!this.visible) return

    // Bounce
    if (this.reducedMotion) {
      this._bouncePhase = 0
      this._jumpY = 0
    } else {
      const bounceSpeed = this.mood === PIP_MOODS.HAPPY ? 6.5 : 2.8
      this._bouncePhase += dt * bounceSpeed
    }

    // Hide lerp
    this._hideAmount += (this._hideTarget - this._hideAmount) * Math.min(1, dt * 5)

    // Jump
    if (this._jumpActive) {
      this._jumpElapsed += dt
      const t = Math.min(1, this._jumpElapsed / this._jumpDuration)
      this._jumpY = -4 * t * (1 - t) * 16
      if (t >= 1) {
        this._jumpActive = false
        this._jumpY = 0
      }
    }

    // Flame flicker from audio level + base natural flicker
    const audioLevel = this.reducedMotion ? 0 : this.getAudioLevel()
    const flickTime = this.reducedMotion ? time * 0.2 : time
    const baseFlicker = 0.6 + 0.4 * Math.sin(flickTime * 8) + 0.2 * Math.sin(flickTime * 13.7)
    this._flameFlicker = baseFlicker * 0.5 + audioLevel * 1.5

    // Blink
    this._blinkTimer -= dt
    if (this._blinkDir === 0 && this._blinkTimer <= 0) {
      this._blinkDir = 1
      this._blinkProgress = 0
    }
    if (this._blinkDir === 1) {
      this._blinkProgress += dt * 10
      if (this._blinkProgress >= 1) {
        this._blinkProgress = 1
        this._blinkDir = -1
      }
    } else if (this._blinkDir === -1) {
      this._blinkProgress -= dt * 10
      if (this._blinkProgress <= 0) {
        this._blinkProgress = 0
        this._blinkDir = 0
        this._blinkTimer = 3 + Math.random() * 4
      }
    }

    // Hearts during HAPPY mood
    if (this.mood === PIP_MOODS.HAPPY && !this.reducedMotion) {
      this._heartTimer -= dt
      if (this._heartTimer <= 0) {
        this._heartTimer = 0.38
        this._hearts.push({
          x: (Math.random() - 0.5) * 18,
          y: -24,
          vy: -32,
          life: 1.5,
          maxLife: 1.5,
          scale: 0.7 + Math.random() * 0.5,
        })
      }
    }

    // Update floating hearts
    for (const h of this._hearts) {
      h.y += h.vy * dt
      h.life -= dt
    }
    this._hearts = this._hearts.filter((h) => h.life > 0)
  }

  // ---- Draw ----

  draw(ctx, w, h, time) {
    if (!this.visible) return
    ctx.save()

    const responsiveScale = this.scale * Math.max(1.1, Math.min(1.8, (h || 600) / 440))

    ctx.translate(this.x, this.y + this._jumpY)
    ctx.scale(this.facing * responsiveScale, responsiveScale)

    const hide = this._hideAmount
    const bounce = Math.abs(Math.sin(this._bouncePhase)) * (this.mood === PIP_MOODS.HAPPY ? 5 : 2.5)
    const crouch = hide * 6

    // Contact shadow
    ctx.save()
    ctx.fillStyle = 'rgba(5, 2, 18, 0.4)'
    ctx.beginPath()
    ctx.ellipse(0, 1.5 - this._jumpY * 0.2, 14 * (1 - hide * 0.2), 4, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // Floating celebratory hearts
    this._drawHearts(ctx)

    // Realistic living diya flame
    if (hide < 0.8) {
      this._drawRealisticFlame(ctx, time, -22 - crouch + bounce)
    }

    // Terracotta pottery body
    this._drawTerracottaBody(ctx, bounce, crouch, hide)

    // Little clay feet
    if (hide < 0.5) {
      this._drawFeet(ctx, bounce)
    }

    // Soulful expressive eyes
    if (hide < 0.9) {
      this._drawEyes(ctx, bounce, crouch, hide)
    }

    // Warm earthen cheek flush
    if (hide < 0.7) {
      ctx.fillStyle = 'rgba(235, 120, 80, 0.35)'
      ctx.globalAlpha = 1 - hide
      ctx.beginPath()
      ctx.arc(-8, -6 + bounce - crouch, 2.5, 0, Math.PI * 2)
      ctx.arc(8, -6 + bounce - crouch, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }

    ctx.restore()
  }

  _drawRealisticFlame(ctx, time, y) {
    const flick = this._flameFlicker
    const flameH = 15 + flick * 7
    const flameW = 6.5 + flick * 2.2
    const sway = this.reducedMotion ? 0 : Math.sin(time * 7) * 1.5

    ctx.save()

    // 1. Warm ambient radial glow halo illuminating surroundings
    ctx.globalCompositeOperation = 'lighter'
    const ambGlow = ctx.createRadialGradient(
      sway,
      y - flameH * 0.4,
      2,
      sway,
      y - flameH * 0.4,
      flameH * 2.5
    )
    ambGlow.addColorStop(0, 'rgba(255, 180, 50, 0.55)')
    ambGlow.addColorStop(0.4, 'rgba(255, 100, 20, 0.22)')
    ambGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = ambGlow
    ctx.beginPath()
    ctx.arc(sway, y - flameH * 0.4, flameH * 2.5, 0, Math.PI * 2)
    ctx.fill()

    // 2. Translucent cobalt-blue base near the cotton wick
    const blueGrad = ctx.createRadialGradient(sway, y, 0.5, sway, y, 4.5)
    blueGrad.addColorStop(0, 'rgba(96, 165, 250, 0.85)')
    blueGrad.addColorStop(0.6, 'rgba(37, 99, 235, 0.45)')
    blueGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = blueGrad
    ctx.beginPath()
    ctx.ellipse(sway, y - 1, 3.5, 4, 0, 0, Math.PI * 2)
    ctx.fill()

    // 3. Saffron-gold outer flame teardrop
    const flameGrad = ctx.createLinearGradient(0, y, 0, y - flameH)
    flameGrad.addColorStop(0, '#DC2626')
    flameGrad.addColorStop(0.3, '#F97316')
    flameGrad.addColorStop(0.7, '#FBBF24')
    flameGrad.addColorStop(1, '#FFFBEB')
    ctx.fillStyle = flameGrad
    ctx.beginPath()
    ctx.moveTo(sway, y)
    ctx.quadraticCurveTo(-flameW + sway, y - flameH * 0.5, sway, y - flameH)
    ctx.quadraticCurveTo(flameW + sway, y - flameH * 0.5, sway, y)
    ctx.closePath()
    ctx.fill()

    // 4. Brilliant incandescent white-hot core
    const coreH = flameH * 0.65
    const coreW = flameW * 0.5
    const coreGrad = ctx.createLinearGradient(0, y, 0, y - coreH)
    coreGrad.addColorStop(0, '#FDE047')
    coreGrad.addColorStop(0.6, '#FEF08A')
    coreGrad.addColorStop(1, '#FFFFFF')
    ctx.fillStyle = coreGrad
    ctx.beginPath()
    ctx.moveTo(sway, y - 1)
    ctx.quadraticCurveTo(-coreW + sway, y - coreH * 0.5, sway, y - coreH)
    ctx.quadraticCurveTo(coreW + sway, y - coreH * 0.5, sway, y - 1)
    ctx.closePath()
    ctx.fill()

    // 5. Tiny floating embers from flame tip
    if (!this.reducedMotion) {
      for (let i = 0; i < 2; i++) {
        const ey = y - flameH - 3 - ((time * 25 + i * 15) % 18)
        const ex = sway + Math.sin(time * 10 + i * 3) * 3
        ctx.fillStyle = '#FFD700'
        ctx.beginPath()
        ctx.arc(ex, ey, 0.8, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.restore()
  }

  _drawTerracottaBody(ctx, bounce, crouch, hide) {
    const y = -13 + bounce - crouch
    const w = 26
    const hh = 19 * (1 - hide * 0.3)

    ctx.save()

    // Handcrafted clay body gradient (warm terracotta earthen shades)
    const clayGrad = ctx.createRadialGradient(-3, y + hh * 0.4, 2, 0, y + hh * 0.5, w * 0.6)
    clayGrad.addColorStop(0, '#E07A48')
    clayGrad.addColorStop(0.4, '#C85A28')
    clayGrad.addColorStop(0.85, '#9C3D15')
    clayGrad.addColorStop(1, '#6E250A')
    ctx.fillStyle = clayGrad
    ctx.beginPath()
    ctx.ellipse(0, y + hh * 0.52, w * 0.5, hh * 0.5, 0, 0, Math.PI * 2)
    ctx.fill()

    // Smooth earthen rim highlight
    ctx.strokeStyle = '#F29668'
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.ellipse(0, y + 0.5, w * 0.5 - 0.5, 3.2, 0, Math.PI, Math.PI * 2)
    ctx.stroke()

    // Ghee / mustard oil reservoir (warm deep golden-brown liquid with specular sheen)
    const oilGrad = ctx.createLinearGradient(0, y - 1, 0, y + 4)
    oilGrad.addColorStop(0, '#78350F')
    oilGrad.addColorStop(0.5, '#92400E')
    oilGrad.addColorStop(1, '#B45309')
    ctx.fillStyle = oilGrad
    ctx.beginPath()
    ctx.ellipse(0, y + 0.8, w * 0.5 - 2.5, 2.8, 0, 0, Math.PI * 2)
    ctx.fill()

    // Liquid surface specular highlight
    ctx.fillStyle = 'rgba(255, 235, 180, 0.45)'
    ctx.beginPath()
    ctx.ellipse(-2, y + 0.5, w * 0.25, 1.2, 0, 0, Math.PI * 2)
    ctx.fill()

    // Twisted cotton wick (baati) with burnt carbon tip
    ctx.strokeStyle = '#FEF3C7'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, y + 3)
    ctx.quadraticCurveTo(1.5, y, 0, y - 3)
    ctx.stroke()

    ctx.fillStyle = '#1C1917'
    ctx.beginPath()
    ctx.arc(0, y - 3, 1.2, 0, Math.PI * 2)
    ctx.fill()

    // Traditional painted gold & vermilion floral band
    if (hide < 0.6) {
      ctx.strokeStyle = '#F59E0B'
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.ellipse(0, y + hh * 0.65, w * 0.48, 2.2, 0, 0, Math.PI)
      ctx.stroke()

      // Miniature decorative dots along band
      ctx.fillStyle = '#FFFBEB'
      for (let d = -3; d <= 3; d++) {
        const dx = d * 3.2
        ctx.beginPath()
        ctx.arc(dx, y + hh * 0.65 + 1.2, 0.7, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.restore()
  }

  _drawFeet(ctx, bounce) {
    // Little terracotta clay feet
    ctx.fillStyle = '#C85A28'
    for (const side of [-1, 1]) {
      const fx = side * 6.5
      const fy = -1.5
      ctx.beginPath()
      ctx.ellipse(fx, fy, 3.2, 2.2, side * 0.2, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#E07A48'
      ctx.beginPath()
      ctx.ellipse(fx, fy - 0.5, 2.2, 1.2, side * 0.2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  _drawEyes(ctx, bounce, crouch, hide) {
    const eyeY = -6 + bounce - crouch
    const eyeSpread = 5.2
    const blink = this._blinkProgress

    ctx.save()

    const eyeH = 4.8 * (1 - blink) * (1 - hide * 0.3)
    if (eyeH > 0.6) {
      for (const ex of [-eyeSpread, eyeSpread]) {
        // Deep soulful dark eye
        ctx.fillStyle = '#1A0C04'
        ctx.beginPath()
        ctx.ellipse(ex, eyeY, 3.2, eyeH, 0, 0, Math.PI * 2)
        ctx.fill()

        // Double firelight reflection catchlights
        ctx.fillStyle = '#FFFFFF'
        ctx.beginPath()
        ctx.arc(ex - 0.8, eyeY - 1, 1.1, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = '#FDE047'
        ctx.beginPath()
        ctx.arc(ex + 1, eyeY + 0.8, 0.6, 0, Math.PI * 2)
        ctx.fill()
      }
    } else {
      // Happy squint lines
      ctx.strokeStyle = '#1A0C04'
      ctx.lineWidth = 1.8
      ctx.lineCap = 'round'
      for (const ex of [-eyeSpread, eyeSpread]) {
        ctx.beginPath()
        ctx.moveTo(ex - 3, eyeY)
        ctx.quadraticCurveTo(ex, eyeY + 1.4, ex + 3, eyeY)
        ctx.stroke()
      }
    }

    // Happy little mouth
    ctx.strokeStyle = '#78350F'
    ctx.lineWidth = 1.4
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(0, eyeY + 2.8, 2.2, 0.2, Math.PI - 0.2)
    ctx.stroke()

    ctx.restore()
  }

  _drawHearts(ctx) {
    for (const h of this._hearts) {
      const alpha = Math.max(0, h.life / h.maxLife)
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(h.x, h.y)
      ctx.scale(h.scale, h.scale)

      ctx.fillStyle = '#FF4D6D'
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.bezierCurveTo(-3, -3, -6, 0, 0, 6)
      ctx.bezierCurveTo(6, 0, 3, -3, 0, 0)
      ctx.fill()

      ctx.restore()
    }
  }
}
