// ===================================================================
// Chhotu Champ — High-End 2D Animated Protagonist
// ===================================================================
// Features:
//   - High-fidelity Disney-Pixar 2D animation style character sprites
//   - Saffron embroidered silk Kurta with gold Zari, cream churidar,
//     and traditional embroidered Juttis
//   - Dynamic real-time animations: breathing bob, walk bounce & tilt,
//     ground contact shadow, dynamic firework/sparkler particle aura
//   - Expressive pose switching for all game states:
//       • IDLE_WAVE: Standing proudly, waving with glowing sparkler
//       • LIGHTING_REACH: Reaching forward with live sparkling wand
//       • COVER_EARS_SMILE: Covering ears safely with delightful smile
//       • VICTORY_JUMP: Ecstatic victory celebration jump
// ===================================================================

export const ARM_STATES = {
  IDLE_WAVE: 'IDLE_WAVE',
  LIGHTING_REACH: 'LIGHTING_REACH',
  COVER_EARS_SMILE: 'COVER_EARS_SMILE',
  VICTORY_JUMP: 'VICTORY_JUMP',
}

// Arm pose definitions — maintained for state interpolation & unit tests
const ARM_POSES = {
  IDLE_WAVE: { lx: -16, ly: 6, rx: 18, ry: -18 },
  LIGHTING_REACH: { lx: -13, ly: 4, rx: 19, ry: 23 },
  COVER_EARS_SMILE: { lx: -14, ly: -14, rx: 14, ry: -14 },
  VICTORY_JUMP: { lx: -17, ly: -24, rx: 17, ry: -24 },
}

// Global sprite manager with browser-safe preloading
const SPRITE_DEFS = {
  IDLE: '/assets/characters/chhotu_idle.png',
  COVER_EARS: '/assets/characters/chhotu_safe_ears.png',
  CELEBRATE: '/assets/characters/chhotu_celebrate.png',
}

const spriteCache = {}

function loadSprites() {
  if (typeof window === 'undefined' || typeof window.Image === 'undefined') return
  for (const [key, src] of Object.entries(SPRITE_DEFS)) {
    if (!spriteCache[key]) {
      const img = new Image()
      img.src = src
      spriteCache[key] = { img, loaded: false }
      img.onload = () => { spriteCache[key].loaded = true }
      img.onerror = () => { console.warn('Failed to load sprite:', src) }
    }
  }
}

if (typeof window !== 'undefined') {
  loadSprites()
}

export class ChhotuChamp {
  constructor() {
    this.x = 0
    this.y = 0
    this.facing = 1 // 1 = right, -1 = left
    this.scale = 1
    this.armState = ARM_STATES.IDLE_WAVE
    this._prevPose = { ...ARM_POSES[ARM_STATES.IDLE_WAVE] }
    this._targetPose = { ...ARM_POSES[ARM_STATES.IDLE_WAVE] }
    this._currentPose = { ...ARM_POSES[ARM_STATES.IDLE_WAVE] }
    this._armLerp = 1
    this._armLerpSpeed = 5
    this.breathPhase = 0
    this._blinkTimer = 2 + Math.random() * 3
    this._blinkProgress = 0
    this._blinkDir = 0 // 0=idle, 1=closing, -1=opening
    this.walkActive = false
    this._walkPhase = 0
    this._walkFromX = 0
    this._walkFromY = 0
    this._walkToX = 0
    this._walkToY = 0
    this._walkDuration = 1
    this._walkElapsed = 0
    this._walkOnDone = null
    this.jumpActive = false
    this._jumpY = 0
    this._jumpDuration = 0.6
    this._jumpElapsed = 0
    this.visible = true
    this._eyeCrinkle = 0
    this._eyeCrinkleTarget = 0

    if (typeof window !== 'undefined') {
      loadSprites()
    }
  }

  // ---- Control methods ----

  setPosition(x, y) {
    this.x = x
    this.y = y
  }

  setFacing(f) {
    this.facing = f
  }

  setArmState(state) {
    if (this.armState === state) return
    this.armState = state
    this._prevPose = { ...this._currentPose }
    this._targetPose = { ...ARM_POSES[state] }
    this._armLerp = 0
    this._eyeCrinkleTarget = state === ARM_STATES.COVER_EARS_SMILE ? 1 : 0
  }

  walkTo(fromX, fromY, toX, toY, duration, onDone) {
    this._walkFromX = fromX
    this._walkFromY = fromY
    this._walkToX = toX
    this._walkToY = toY
    this._walkDuration = duration
    this._walkElapsed = 0
    this.walkActive = true
    this._walkOnDone = onDone || null
  }

  jump(duration = 0.6) {
    this.jumpActive = true
    this._jumpDuration = duration
    this._jumpElapsed = 0
  }

  reset() {
    this.walkActive = false
    this.jumpActive = false
    this._jumpY = 0
    this.setArmState(ARM_STATES.IDLE_WAVE)
  }

  // ---- Update ----

  update(dt, time) {
    if (!this.visible) return

    // Breathing
    this.breathPhase += dt * 2.2

    // Blink logic
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
        this._blinkTimer = 2 + Math.random() * 3
      }
    }

    // Eye crinkle lerp
    this._eyeCrinkle += (this._eyeCrinkleTarget - this._eyeCrinkle) * Math.min(1, dt * 6)

    // Arm pose lerp
    if (this._armLerp < 1) {
      this._armLerp = Math.min(1, this._armLerp + dt * this._armLerpSpeed)
      const t = this._easeInOut(this._armLerp)
      this._currentPose.lx = this._lerp(this._prevPose.lx, this._targetPose.lx, t)
      this._currentPose.ly = this._lerp(this._prevPose.ly, this._targetPose.ly, t)
      this._currentPose.rx = this._lerp(this._prevPose.rx, this._targetPose.rx, t)
      this._currentPose.ry = this._lerp(this._prevPose.ry, this._targetPose.ry, t)
    }

    // Walk cycle
    if (this.walkActive) {
      if (this._walkDelay > 0) { this._walkDelay -= dt; return }
      this._walkElapsed += dt
      const t = Math.min(1, this._walkElapsed / this._walkDuration)
      const easeT = this._easeInOut(t)
      this.x = this._lerp(this._walkFromX, this._walkToX, easeT)
      this.y = this._lerp(this._walkFromY, this._walkToY, easeT)
      this._walkPhase += dt * 9

      if (t >= 1) {
        this.walkActive = false
        this.x = this._walkToX
        this.y = this._walkToY
        if (this._walkOnDone) {
          const cb = this._walkOnDone
          this._walkOnDone = null
          cb()
        }
      }
    }

    // Jump arc
    if (this.jumpActive) {
      this._jumpElapsed += dt
      const t = Math.min(1, this._jumpElapsed / this._jumpDuration)
      this._jumpY = -4 * t * (1 - t) * 28
      if (t >= 1) {
        this.jumpActive = false
        this._jumpY = 0
      }
    }
  }

  // ---- Draw ----

  draw(ctx, w, h, time) {
    if (!this.visible) return
    ctx.save()

    // Proportional character scale matching the scene layout
    const responsiveScale = this.scale * Math.max(1.55, Math.min(2.8, (h || 600) / 285, (w || 800) / 240))

    ctx.translate(this.x, this.y + this._jumpY)
    ctx.scale(this.facing * responsiveScale, responsiveScale)

    const breath = Math.sin(this.breathPhase)
    const bodyScaleY = 1 + breath * 0.018
    const bodyScaleX = 1 - breath * 0.012
    const walkBob = this.walkActive ? Math.abs(Math.sin(this._walkPhase)) * 3.5 : 0
    const walkTilt = this.walkActive ? Math.sin(this._walkPhase) * 0.045 : 0

    // Soft character contact shadow on pavement
    ctx.save()
    ctx.fillStyle = 'rgba(5, 2, 18, 0.45)'
    ctx.beginPath()
    const shadowStretch = Math.max(0.35, 1 - Math.abs(this._jumpY) * 0.02)
    ctx.ellipse(0, 1.5 - this._jumpY * 0.1, 16 * bodyScaleX * shadowStretch, 4.5 * shadowStretch, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // Select sprite pose based on state
    let spriteKey = 'IDLE'
    if (this.armState === ARM_STATES.COVER_EARS_SMILE) {
      spriteKey = 'COVER_EARS'
    } else if (this.armState === ARM_STATES.VICTORY_JUMP) {
      spriteKey = 'CELEBRATE'
    }

    const spriteObj = spriteCache[spriteKey]
    if (spriteObj && spriteObj.loaded) {
      this._drawSprite(ctx, spriteObj.img, spriteKey, bodyScaleX, bodyScaleY, walkBob, walkTilt, time)
    } else {
      this._drawProceduralFallback(ctx, bodyScaleX, bodyScaleY, walkBob, time)
    }

    ctx.restore()
  }

  _drawSprite(ctx, img, key, sx, sy, walkBob, walkTilt, time) {
    ctx.save()

    // Apply walk bounce & tilt
    ctx.translate(0, -walkBob)
    ctx.rotate(walkTilt)

    // Subtle natural breathing scale anchored at feet
    ctx.scale(sx, sy)

    // Local coordinate height: 76 units tall (feet at y = 0)
    const targetH = key === 'CELEBRATE' ? 78 : 76
    const aspect = img.width / img.height
    const targetW = targetH * aspect

    // Center horizontally, feet resting at y = 0
    const drawX = -targetW / 2
    const drawY = -targetH

    ctx.drawImage(img, drawX, drawY, targetW, targetH)

    // Interactive sparkling wand particle aura on IDLE / LIGHTING_REACH
    if (key === 'IDLE') {
      this._drawSparklerGlow(ctx, drawX, drawY, targetW, targetH, time)
    }

    ctx.restore()
  }

  _drawSparklerGlow(ctx, dx, dy, tw, th, time) {
    // Location of sparkler tip on Chhotu's idle sprite
    const sx = dx + tw * 0.43
    const sy = dy + th * 0.25

    ctx.save()
    ctx.globalCompositeOperation = 'lighter'

    // Pulsing central incandescent spark
    const flick = Math.sin(time * 25) * 0.8
    ctx.fillStyle = 'rgba(255, 245, 180, 0.95)'
    ctx.beginPath()
    ctx.arc(sx, sy, 2.5 + flick, 0, Math.PI * 2)
    ctx.fill()

    // Warm golden ambient flare
    const haloGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 14 + flick * 2)
    haloGrad.addColorStop(0, 'rgba(255, 195, 60, 0.55)')
    haloGrad.addColorStop(0.5, 'rgba(255, 130, 20, 0.25)')
    haloGrad.addColorStop(1, 'rgba(255, 100, 0, 0)')
    ctx.fillStyle = haloGrad
    ctx.beginPath()
    ctx.arc(sx, sy, 14 + flick * 2, 0, Math.PI * 2)
    ctx.fill()

    // Dynamic micro-sparks scattering around tip
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + time * 12
      const dist = 5 + ((i * 3 + Math.sin(time * 30 + i)) % 7)
      const px = sx + Math.cos(angle) * dist
      const py = sy + Math.sin(angle) * dist
      ctx.fillStyle = i % 2 === 0 ? '#FFE082' : '#FFF9C4'
      ctx.beginPath()
      ctx.arc(px, py, 0.8 + Math.sin(time * 20 + i) * 0.3, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }

  _drawProceduralFallback(ctx, bodyScaleX, bodyScaleY, walkBob, time) {
    const walkSwing = this.walkActive ? Math.sin(this._walkPhase) : 0
    this._drawLegs(ctx, walkSwing, bodyScaleX)
    this._drawBody(ctx, bodyScaleX, bodyScaleY, walkBob, time)
    this._drawHead(ctx, bodyScaleY, walkBob, time)
    this._drawArms(ctx, time)
  }

  _drawLegs(ctx, swing, bodyScaleX) {
    const legSpread = 6 * bodyScaleX
    const leftX = -legSpread + swing * 4.5
    const rightX = legSpread - swing * 4.5

    for (const lx of [leftX, rightX]) {
      ctx.save()
      const legGrad = ctx.createLinearGradient(lx - 4, -22, lx + 4, -2)
      legGrad.addColorStop(0, '#FAF5E8')
      legGrad.addColorStop(0.5, '#EDE3D1')
      legGrad.addColorStop(1, '#DCCDB7')
      ctx.strokeStyle = legGrad
      ctx.lineWidth = 6.5
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(lx, -21)
      ctx.lineTo(lx, -2)
      ctx.stroke()

      ctx.fillStyle = '#8B0000'
      this._roundRect(ctx, lx - 7, -4.5, 15, 6, 2.5)
      ctx.fill()

      ctx.fillStyle = '#FFD700'
      this._roundRect(ctx, lx - 7, -1, 15, 2, 1)
      ctx.fill()
      ctx.restore()
    }
  }

  _drawBody(ctx, sx, sy, walkBob, time) {
    const w = 26 * sx
    const hh = 28 * sy
    const x = -w / 2
    const y = -47 + walkBob

    ctx.save()
    const kurtaGrad = ctx.createLinearGradient(x, y, x + w, y + hh)
    kurtaGrad.addColorStop(0, '#E65100')
    kurtaGrad.addColorStop(0.5, '#FF9800')
    kurtaGrad.addColorStop(1, '#BF360C')
    ctx.fillStyle = kurtaGrad
    this._roundRect(ctx, x, y, w, hh, 7)
    ctx.fill()
    ctx.restore()
  }

  _drawArms(ctx, time) {
    const shoulderY = -43
    const pose = this._currentPose
    const wave = this.walkActive ? Math.sin(this._walkPhase) * 9 : this.armState === ARM_STATES.IDLE_WAVE
      ? Math.sin(time * 3.5) * 4.5
      : 0

    this._drawArm(ctx, -5, shoulderY, pose.lx, shoulderY + pose.ly - (this.walkActive ? wave : 0), '#BF360C')
    this._drawArm(ctx, 5, shoulderY, pose.rx, shoulderY + pose.ry + wave, '#E65100')

    if (this.armState === ARM_STATES.LIGHTING_REACH) {
      this._drawSparklerWand(ctx, pose.rx, shoulderY + pose.ry, time)
    }
  }

  _drawArm(ctx, sx, sy, hx, hy, sleeveColor) {
    const mx = (sx + hx) / 2 + (hx > sx ? 3.5 : -3.5)
    const my = (sy + hy) / 2 + 2

    ctx.save()
    ctx.strokeStyle = sleeveColor
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.quadraticCurveTo(mx, my, hx, hy)
    ctx.stroke()

    ctx.fillStyle = '#F0B788'
    ctx.beginPath()
    ctx.arc(hx, hy + 1, 3.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  _drawSparklerWand(ctx, hx, hy, time) {
    ctx.save()
    ctx.strokeStyle = '#D1D5DB'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(hx, hy)
    ctx.lineTo(hx + 24, hy - 6)
    ctx.stroke()

    ctx.globalCompositeOperation = 'lighter'
    const flick = Math.sin(time * 15) * 1.5
    ctx.fillStyle = '#FFFBEB'
    ctx.beginPath()
    ctx.arc(hx + 24, hy - 6, 2.5 + flick, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#F59E0B'
    ctx.beginPath()
    ctx.arc(hx + 24, hy - 6, 5 + flick, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  _drawHead(ctx, sy, walkBob, time) {
    const headY = -61 + walkBob
    const headR = 12.5

    ctx.save()
    const skinGrad = ctx.createRadialGradient(-2, headY - 3, 2, 0, headY, headR + 1)
    skinGrad.addColorStop(0, '#FBD5B2')
    skinGrad.addColorStop(0.6, '#F2BA8C')
    skinGrad.addColorStop(1, '#E19C66')
    ctx.fillStyle = skinGrad
    ctx.beginPath()
    ctx.ellipse(0, headY, headR, headR + 1.2, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#171123'
    ctx.beginPath()
    ctx.ellipse(0, headY - 4.5, headR + 0.8, 8, 0, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // ---- Helpers ----

  _lerp(a, b, t) {
    return a + (b - a) * t
  }
  _easeInOut(t) {
    return t * t * (3 - 2 * t)
  }
  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }
}
