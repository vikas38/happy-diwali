// ===================================================================
// ComicBubble — Spring-physics onomatopoeia word bubbles
// ===================================================================
// Spawns comic-book word bubbles ("TWINKLE!", "POP!", "KABOOM!") that
// scale in with a bouncy spring overshoot, float upward, and fade.
// ===================================================================

export class ComicBubble {
  constructor() {
    this.bubbles = []
  }

  /**
   * Spawn a comic word bubble.
   * @param {number} x
   * @param {number} y
   * @param {string} text
   * @param {object} options - { color, fontSize, duration, floatSpeed }
   */
  spawn(x, y, text, options = {}) {
    this.bubbles.push({
      x,
      y,
      text,
      scale: 0.01,
      targetScale: 1,
      springV: 0,
      vy: options.floatSpeed ?? -20,
      alpha: 1,
      life: options.duration ?? 2.5,
      elapsed: 0,
      color: options.color || '#FF5CE0',
      fontSize: options.fontSize || 26,
      springK: options.springK ?? 300,
      damping: options.damping ?? 14,
      rotation: (Math.random() - 0.5) * 0.15,
    })
  }

  update(dt, time) {
    for (const b of this.bubbles) {
      // Spring scale-in with overshoot
      const force = -b.springK * (b.scale - b.targetScale) - b.damping * b.springV
      b.springV += force * dt
      b.scale += b.springV * dt
      if (b.scale < 0.01) b.scale = 0.01

      // Float upward
      b.y += b.vy * dt
      b.vy *= Math.pow(0.95, dt * 60)

      // Life timer
      b.elapsed += dt
      if (b.elapsed > b.life - 0.6) {
        b.alpha = Math.max(0, (b.life - b.elapsed) / 0.6)
      }
    }
    this.bubbles = this.bubbles.filter((b) => b.elapsed < b.life)
  }

  draw(ctx, w, h, time) {
    for (const b of this.bubbles) {
      // Measure text first to calculate dimensions and safety margins
      ctx.font = `800 ${b.fontSize}px 'Trebuchet MS', 'Segoe UI', system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const metrics = ctx.measureText ? ctx.measureText(b.text) : null
      const tw =
        metrics && typeof metrics.width === 'number'
          ? metrics.width
          : b.text.length * b.fontSize * 0.6
      const th = b.fontSize
      const padX = 18
      const padY = 10
      const bw = tw + padX * 2
      const bh = th + padY * 2

      // Clamp renderX so badge never clips off-screen on narrow screens
      let renderX = b.x
      if (w && w > 0) {
        renderX = Math.max(bw / 2 + 10, Math.min(b.x, w - bw / 2 - 10))
      }

      ctx.save()
      ctx.translate(renderX, b.y)
      ctx.rotate(b.rotation)
      ctx.scale(b.scale, b.scale)
      ctx.globalAlpha = b.alpha

      // 1. Soft radial bloom glow behind banner
      const bloom = ctx.createRadialGradient(0, 0, 10, 0, 0, tw * 0.75 + 20)
      bloom.addColorStop(0, 'rgba(255, 215, 0, 0.4)')
      bloom.addColorStop(0.5, 'rgba(255, 140, 0, 0.15)')
      bloom.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = bloom
      ctx.beginPath()
      ctx.ellipse(0, 0, tw * 0.75 + 20, th + 24, 0, 0, Math.PI * 2)
      ctx.fill()

      // 2. Festive Illuminated Cartouche / Badge
      const rad = 14

      // Deep festive dark amethyst badge fill
      const badgeGrad = ctx.createLinearGradient(0, -bh / 2, 0, bh / 2)
      badgeGrad.addColorStop(0, '#2D124D')
      badgeGrad.addColorStop(0.5, '#1B0A33')
      badgeGrad.addColorStop(1, '#110524')
      ctx.fillStyle = badgeGrad

      ctx.beginPath()
      ctx.roundRect
        ? ctx.roundRect(-bw / 2, -bh / 2, bw, bh, rad)
        : this._drawBurst(ctx, 0, 0, bw / 2, bh / 2, 14)
      ctx.fill()

      // 3. Ornate Golden Leaf Filigree Border
      const goldGrad = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0)
      goldGrad.addColorStop(0, '#F59E0B')
      goldGrad.addColorStop(0.3, '#FDE047')
      goldGrad.addColorStop(0.7, '#FCD34D')
      goldGrad.addColorStop(1, '#D97706')
      ctx.strokeStyle = goldGrad
      ctx.lineWidth = 2
      ctx.stroke()

      // Inner subtle gold inset line
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.35)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect ? ctx.roundRect(-bw / 2 + 3, -bh / 2 + 3, bw - 6, bh - 6, rad - 2) : null
      ctx.stroke()

      // 4. Luminous Festive Text with soft glow
      ctx.fillStyle = '#FFFDF5'
      ctx.shadowColor = 'rgba(255, 215, 0, 0.75)'
      ctx.shadowBlur = 8
      ctx.fillText(b.text, 0, 1)

      ctx.shadowBlur = 0
      ctx.restore()
    }
    ctx.globalAlpha = 1
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
  }

  /**
   * Draw a starburst / badge shape (fallback & test compatibility).
   */
  _drawBurst(ctx, cx, cy, rx, ry, spikes = 14) {
    ctx.beginPath()
    const points = spikes * 2
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2
      const r = i % 2 === 0 ? 1 : 0.88
      const x = cx + Math.cos(angle) * rx * r
      const y = cy + Math.sin(angle) * ry * r
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
  }

  clear() {
    this.bubbles = []
  }

  get hasActive() {
    return this.bubbles.length > 0
  }
}
