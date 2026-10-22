// ===================================================================
// Chhotu Champ — Procedural Illustrated Indian Protagonist
// ===================================================================
// Features:
//   - Authentic Indian festive attire: Royal silk Kurta with Zari brocade,
//     embroidered Nehru placket, cream churidar, and traditional embroidered Juttis
//   - Detailed expressive face: warm natural skin shading, hazel-amber eyes
//     with corneal light reflections, soft layered hair with diya-light sheen
//   - Silk Angavastram (festive stole) draped over shoulder with gold tassel trim
//   - Articulated arms with smooth pose lerping (IDLE_WAVE, LIGHTING_REACH,
//     COVER_EARS_SMILE, VICTORY_JUMP)
//   - Responsive proportional scaling for wide laptop & mobile screens
// ===================================================================

export const ARM_STATES = {
  IDLE_WAVE: 'IDLE_WAVE',
  LIGHTING_REACH: 'LIGHTING_REACH',
  COVER_EARS_SMILE: 'COVER_EARS_SMILE',
  VICTORY_JUMP: 'VICTORY_JUMP',
}

// Arm pose definitions — hand positions relative to shoulder center
const ARM_POSES = {
  IDLE_WAVE: { lx: -16, ly: 6, rx: 18, ry: -18 },
  LIGHTING_REACH: { lx: -13, ly: 4, rx: 19, ry: 23 },
  COVER_EARS_SMILE: { lx: -14, ly: -14, rx: 14, ry: -14 },
  VICTORY_JUMP: { lx: -17, ly: -24, rx: 17, ry: -24 },
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

    // Proportional character scale so he looks prominent on laptop/desktop screens
    const responsiveScale = this.scale * Math.max(1.55, Math.min(2.8, (h || 600) / 285, (w || 800) / 240))

    ctx.translate(this.x, this.y + this._jumpY)
    ctx.scale(this.facing * responsiveScale, responsiveScale)

    const breath = Math.sin(this.breathPhase)
    const bodyScaleY = 1 + breath * 0.02
    const bodyScaleX = 1 - breath * 0.01
    const walkBob = this.walkActive ? Math.abs(Math.sin(this._walkPhase)) * 3.5 : 0
    const walkSwing = this.walkActive ? Math.sin(this._walkPhase) : 0

    // Soft character contact shadow on pavement
    ctx.save()
    ctx.fillStyle = 'rgba(5, 2, 18, 0.45)'
    ctx.beginPath()
    ctx.ellipse(0, 2 - this._jumpY * 0.2, 18 * bodyScaleX, 5, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // Render Chhotu Champ layers back-to-front
    this._drawLegs(ctx, walkSwing, bodyScaleX)
    this._drawBody(ctx, bodyScaleX, bodyScaleY, walkBob, time)
    this._drawHead(ctx, bodyScaleY, walkBob, time)
    this._drawArms(ctx, time)

    ctx.restore()
  }

  _drawLegs(ctx, swing, bodyScaleX) {
    const legSpread = 6 * bodyScaleX
    const leftX = -legSpread + swing * 4.5
    const rightX = legSpread - swing * 4.5

    for (const lx of [leftX, rightX]) {
      // Churidar trousers (cream/ivory raw silk with realistic ankle gathers)
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

      // Churidar fabric crease lines
      ctx.strokeStyle = 'rgba(180, 160, 140, 0.45)'
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.moveTo(lx - 2.5, -8)
      ctx.lineTo(lx + 2.5, -7)
      ctx.moveTo(lx - 2, -13)
      ctx.lineTo(lx + 2.2, -12)
      ctx.stroke()

      // Traditional Indian Juttis / Mojaris (Rich Crimson & Gold Embroidery)
      ctx.fillStyle = '#8B0000' // Royal deep maroon
      this._roundRect(ctx, lx - 7, -4.5, 15, 6, 2.5)
      ctx.fill()

      // Curved upturned jutti toe tip
      ctx.beginPath()
      ctx.moveTo(lx + 7, -3)
      ctx.quadraticCurveTo(lx + 9.5, -5.5, lx + 7.5, -7)
      ctx.lineWidth = 1.2
      ctx.strokeStyle = '#D4AF37'
      ctx.stroke()

      // Gold zari embroidery border along jutti rim
      ctx.fillStyle = '#FFD700'
      this._roundRect(ctx, lx - 7, -1, 15, 2, 1)
      ctx.fill()

      // Gold embroidery motif on shoe top
      ctx.fillStyle = '#FFF8DC'
      ctx.beginPath()
      ctx.arc(lx + 1, -2.5, 1.2, 0, Math.PI * 2)
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

    // Royal Silk Kurta (Deep sapphire blue with woven luster gradient)
    const kurtaGrad = ctx.createLinearGradient(x, y, x + w, y + hh)
    kurtaGrad.addColorStop(0, '#78452d')
    kurtaGrad.addColorStop(0.35, '#ce8d46')
    kurtaGrad.addColorStop(0.7, '#ad6e37')
    kurtaGrad.addColorStop(1, '#633a2b')
    ctx.fillStyle = kurtaGrad
    this._roundRect(ctx, x, y, w, hh, 7)
    ctx.fill()

    // Kurta side slit & subtle fabric folds
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x + w * 0.15, y + hh * 0.7)
    ctx.lineTo(x + w * 0.15, y + hh)
    ctx.moveTo(x + w * 0.85, y + hh * 0.7)
    ctx.lineTo(x + w * 0.85, y + hh)
    ctx.stroke()

    // Ornate Golden Zari Embroidered Placket (Mandarin collar & buttons)
    const placketW = 5.5
    const placketX = -placketW / 2
    const placketGrad = ctx.createLinearGradient(placketX, y, placketX + placketW, y + 16)
    placketGrad.addColorStop(0, '#FBBF24')
    placketGrad.addColorStop(0.5, '#F59E0B')
    placketGrad.addColorStop(1, '#D97706')
    ctx.fillStyle = placketGrad
    this._roundRect(ctx, placketX, y - 2, placketW, 17, 2)
    ctx.fill()

    // Tiny golden spherical buttons (Potli buttons)
    ctx.fillStyle = '#FFFDF0'
    for (let b = 0; b < 3; b++) {
      ctx.beginPath()
      ctx.arc(0, y + 2 + b * 5, 1, 0, Math.PI * 2)
      ctx.fill()
    }

    // Golden Zari embroidery border at Kurta hem
    ctx.fillStyle = '#F59E0B'
    this._roundRect(ctx, x, y + hh - 3.5, w, 3.5, 1.5)
    ctx.fill()

    ctx.fillStyle = '#FDE047'
    this._roundRect(ctx, x + 1, y + hh - 2.5, w - 2, 1, 0.5)
    ctx.fill()

    // Traditional Silk Angavastram (Festive Stole) draped across shoulder
    const stoleSway = Math.sin(time * 2.5 + this.breathPhase) * 1.5
    const stoleGrad = ctx.createLinearGradient(x - 2, y, x + w * 0.6, y + hh)
    stoleGrad.addColorStop(0, '#E11D48') // Festive Rose Crimson
    stoleGrad.addColorStop(0.5, '#BE123C')
    stoleGrad.addColorStop(1, '#9F1239')
    ctx.fillStyle = stoleGrad
    ctx.beginPath()
    ctx.moveTo(-w * 0.45, y)
    ctx.quadraticCurveTo(0, y + hh * 0.45, w * 0.38 + stoleSway, y + hh + 2)
    ctx.lineTo(w * 0.2 + stoleSway, y + hh + 3)
    ctx.quadraticCurveTo(-2, y + hh * 0.5, -w * 0.3, y)
    ctx.closePath()
    ctx.fill()

    // Gold zari border on the stole
    ctx.strokeStyle = '#FBBF24'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(-w * 0.45, y)
    ctx.quadraticCurveTo(0, y + hh * 0.45, w * 0.38 + stoleSway, y + hh + 2)
    ctx.stroke()

    // Golden tassel on stole corner
    ctx.fillStyle = '#FFD700'
    ctx.beginPath()
    ctx.arc(w * 0.34 + stoleSway, y + hh + 3.5, 1.4, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  _drawArms(ctx, time) {
    const shoulderY = -43
    const pose = this._currentPose
    const wave = this.walkActive ? Math.sin(this._walkPhase) * 9 : this.armState === ARM_STATES.IDLE_WAVE
      ? Math.sin(time * 3.5) * 4.5
      : 0

    // Left arm
    this._drawArm(ctx, -5, shoulderY, pose.lx, shoulderY + pose.ly - (this.walkActive ? wave : 0), '#ad6e37')
    // Right arm (with animated gesture)
    this._drawArm(ctx, 5, shoulderY, pose.rx, shoulderY + pose.ry + wave, '#ce8d46')

    // If lighting reach, draw the magic sparkler wand in his hand!
    if (this.armState === ARM_STATES.LIGHTING_REACH) {
      this._drawSparklerWand(ctx, pose.rx, shoulderY + pose.ry, time)
    }
  }

  _drawArm(ctx, sx, sy, hx, hy, sleeveColor) {
    const mx = (sx + hx) / 2 + (hx > sx ? 3.5 : -3.5)
    const my = (sy + hy) / 2 + 2

    ctx.save()

    // Silk kurta sleeve with shading
    ctx.strokeStyle = sleeveColor
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.quadraticCurveTo(mx, my, hx, hy)
    ctx.stroke()

    // Golden brocade cuff border
    ctx.strokeStyle = '#F59E0B'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(hx - 2, hy - 1)
    ctx.lineTo(hx + 2, hy - 1)
    ctx.stroke()

    // Hand with natural Indian skin tone
    ctx.fillStyle = '#F0B788'
    ctx.beginPath()
    ctx.arc(hx, hy + 1, 3.2, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  _drawSparklerWand(ctx, hx, hy, time) {
    ctx.save()
    // Thin sparkler wand
    ctx.strokeStyle = '#D1D5DB'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(hx, hy)
    ctx.lineTo(hx + 24, hy - 6)
    ctx.stroke()

    // Gentle magical glow at tip
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

    // Neck with soft shadow
    const neckGrad = ctx.createLinearGradient(-3, headY + headR - 2, 3, headY + headR + 6)
    neckGrad.addColorStop(0, '#D99B6A')
    neckGrad.addColorStop(1, '#EDAA79')
    ctx.fillStyle = neckGrad
    ctx.fillRect(-3.5, headY + headR - 2, 7, 7)

    // Head base with warm, natural 3D skin tone gradient
    const skinGrad = ctx.createRadialGradient(-2, headY - 3, 2, 0, headY, headR + 1)
    skinGrad.addColorStop(0, '#FBD5B2')
    skinGrad.addColorStop(0.6, '#F2BA8C')
    skinGrad.addColorStop(1, '#E19C66')
    ctx.fillStyle = skinGrad
    ctx.beginPath()
    ctx.ellipse(0, headY, headR, headR + 1.2, 0, 0, Math.PI * 2)
    ctx.fill()

    // Ears with anatomical inner shading
    for (const side of [-1, 1]) {
      const ex = side * (headR - 0.5)
      const ey = headY + 1

      // Outer ear
      ctx.fillStyle = '#E8A370'
      ctx.beginPath()
      ctx.ellipse(ex, ey, 2.8, 4.2, 0, 0, Math.PI * 2)
      ctx.fill()

      // Inner ear fold
      ctx.fillStyle = '#D08855'
      ctx.beginPath()
      ctx.ellipse(ex - side * 0.5, ey, 1.4, 2.4, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    // Warm reflected light along the cheek facing the launch point.
    ctx.strokeStyle = 'rgba(255,214,146,.32)'
    ctx.lineWidth = 1.2
    ctx.beginPath(); ctx.ellipse(0,headY,headR-.5,headR,0,-.6,1.1);ctx.stroke()

    // Lush layered dark hair with natural volume and amber rim highlights
    ctx.fillStyle = '#171123'
    ctx.beginPath()
    ctx.ellipse(0, headY - 4.5, headR + 0.8, 8, 0, Math.PI, Math.PI * 2)
    ctx.fill()

    // Soft hair strand volume on top & gentle sideburns
    ctx.beginPath()
    ctx.arc(-headR * 0.35, headY - headR + 2, 5, 0, Math.PI * 2)
    ctx.arc(headR * 0.3, headY - headR + 2.5, 4.5, 0, Math.PI * 2)
    ctx.arc(0, headY - headR + 1, 4.5, 0, Math.PI * 2)
    // Sideburns
    ctx.ellipse(-headR + 1.5, headY - 1, 2, 5, 0, 0, Math.PI * 2)
    ctx.ellipse(headR - 1.5, headY - 1, 2, 5, 0, 0, Math.PI * 2)
    ctx.fill()

    // Soft warm diya-light specular sheen on hair
    ctx.strokeStyle = 'rgba(255, 215, 140, 0.3)'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.arc(-1, headY - headR + 3, headR * 0.7, Math.PI * 1.15, Math.PI * 1.85)
    ctx.stroke()

    // Soft natural eyebrows
    ctx.strokeStyle = '#2D2042'
    ctx.lineWidth = 1.4
    ctx.lineCap = 'round'
    for (const side of [-1, 1]) {
      const bx = side * 5.5
      ctx.beginPath()
      ctx.moveTo(bx - 3.2, headY - 4.8)
      ctx.quadraticCurveTo(bx, headY - 6.2, bx + 3.2, headY - 5.2)
      ctx.stroke()
    }

    // Expressive Eyes
    const eyeY = headY - 0.5
    const eyeSpread = 6
    const crinkle = this._eyeCrinkle
    const blink = this._blinkProgress

    if (crinkle > 0.3) {
      // Happy crinkle eyes (^ ^)
      ctx.strokeStyle = '#1F1532'
      ctx.lineWidth = 2.4
      ctx.lineCap = 'round'
      for (const ex of [-eyeSpread, eyeSpread]) {
        const sz = 4 - crinkle * 1.8
        ctx.beginPath()
        ctx.moveTo(ex - sz, eyeY + 1)
        ctx.quadraticCurveTo(ex, eyeY - sz * 1.2, ex + sz, eyeY + 1)
        ctx.stroke()
      }
    } else {
      const eyeH = 2.9 * (1 - blink)
      if (eyeH > 0.6) {
        for (const ex of [-eyeSpread, eyeSpread]) {
          // Eye sclera
          ctx.fillStyle = '#FFFDF5'
          ctx.beginPath()
          ctx.ellipse(ex, eyeY, 3.5, eyeH, 0, 0, Math.PI * 2)
          ctx.fill()

          // Hazel-amber iris with depth
          const irisGrad = ctx.createRadialGradient(ex, eyeY, 0.5, ex, eyeY, 2.6)
          irisGrad.addColorStop(0, '#5C240E')
          irisGrad.addColorStop(0.65, '#3B1808')
          irisGrad.addColorStop(1, '#1A0C04')
          ctx.fillStyle = irisGrad
          ctx.beginPath()
          ctx.ellipse(ex + 0.3, eyeY, 2.6, Math.min(eyeH - 0.4, 2.6), 0, 0, Math.PI * 2)
          ctx.fill()

          // Deep pupil
          ctx.fillStyle = '#0F0602'
          ctx.beginPath()
          ctx.arc(ex + 0.3, eyeY, 1.4, 0, Math.PI * 2)
          ctx.fill()

          // Double corneal catchlights reflecting festival lights
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
          ctx.beginPath()
          ctx.arc(ex - 0.8, eyeY - 1.2, 1, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = 'rgba(255, 235, 180, 0.7)'
          ctx.beginPath()
          ctx.arc(ex + 1.2, eyeY + 0.8, 0.6, 0, Math.PI * 2)
          ctx.fill()

          // Upper eyelid definition with subtle lash line
          ctx.strokeStyle = '#1F1532'
          ctx.lineWidth = 1.2
          ctx.beginPath()
          ctx.arc(ex, eyeY - 0.5, 3.5, Math.PI * 1.15, Math.PI * 1.85)
          ctx.stroke()
        }
      } else {
        // Eyelids closed (blink)
        ctx.strokeStyle = '#221535'
        ctx.lineWidth = 1.8
        ctx.lineCap = 'round'
        for (const ex of [-eyeSpread, eyeSpread]) {
          ctx.beginPath()
          ctx.moveTo(ex - 4, eyeY)
          ctx.quadraticCurveTo(ex, eyeY + 1.5, ex + 4, eyeY)
          ctx.stroke()
        }
      }
    }

    // Cute nose with soft bridge shadow
    ctx.fillStyle = 'rgba(195, 125, 75, 0.5)'
    ctx.beginPath()
    ctx.arc(0, headY + 3.2, 1.6, 0, Math.PI * 2)
    ctx.fill()

    // Mouth
    const mouthY = headY + 7.5
    ctx.lineCap = 'round'
    if (this.armState === ARM_STATES.COVER_EARS_SMILE || this.armState === ARM_STATES.VICTORY_JUMP) {
      // Radiant confident smile
      ctx.fillStyle = '#D94848'
      ctx.beginPath()
      ctx.ellipse(0, mouthY + 0.5, 6, 3.8, 0, 0, Math.PI)
      ctx.fill()

      ctx.strokeStyle = '#1F1532'
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.arc(0, mouthY + 0.5, 6, 0, Math.PI)
      ctx.stroke()

      // Pearlescent teeth highlight
      ctx.fillStyle = '#FFFDF5'
      ctx.fillRect(-4.5, mouthY, 9, 1.8)
    } else if (this.armState === ARM_STATES.LIGHTING_REACH) {
      // Focused smile
      ctx.strokeStyle = '#8E3838'
      ctx.lineWidth = 1.8
      ctx.beginPath()
      ctx.arc(0, mouthY, 3.2, 0.15, Math.PI - 0.15)
      ctx.stroke()
    } else {
      // Gentle warm natural smile
      ctx.strokeStyle = '#8E3838'
      ctx.lineWidth = 1.8
      ctx.beginPath()
      ctx.arc(0, mouthY - 0.5, 4.2, 0.25, Math.PI - 0.25)
      ctx.stroke()
    }

    // Rosy cheek glow
    ctx.fillStyle = 'rgba(244, 114, 114, 0.25)'
    ctx.beginPath()
    ctx.arc(-8.5, headY + 3.8, 3.2, 0, Math.PI * 2)
    ctx.arc(8.5, headY + 3.8, 3.2, 0, Math.PI * 2)
    ctx.fill()

    // If COVER_EARS_SMILE: Render stylish festive safety ear-muffs / defenders!
    if (this.armState === ARM_STATES.COVER_EARS_SMILE) {
      this._drawEarMuffs(ctx, headY, headR)
    }

    ctx.restore()
  }

  _drawEarMuffs(ctx, headY, headR) {
    ctx.save()
    // Headband
    ctx.strokeStyle = '#38D9A9'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(0, headY - 1, headR + 2, Math.PI * 1.15, Math.PI * 1.85)
    ctx.stroke()

    // Cushioned ear pads over both ears
    for (const side of [-1, 1]) {
      const ex = side * (headR + 1)
      const ey = headY + 1

      // Outer cup (emerald festive)
      ctx.fillStyle = '#06D6A0'
      ctx.beginPath()
      ctx.ellipse(ex, ey, 3.8, 6.5, 0, 0, Math.PI * 2)
      ctx.fill()

      // Inner cushion ring
      ctx.strokeStyle = '#FFD166'
      ctx.lineWidth = 1.2
      ctx.stroke()
    }
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
