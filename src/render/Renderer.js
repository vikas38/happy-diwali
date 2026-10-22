// ===================================================================
// Renderer — DPR-scaled canvas, requestAnimationFrame delta-time loop
// ===================================================================

const MAX_DT = 1 / 30 // clamp to avoid huge jumps after tab switch

export class Renderer {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d', { alpha: false })
    if (!this.ctx) throw new Error('Canvas is unavailable')
    this.dpr = 1
    this.width = 0
    this.height = 0
    this.layers = []
    this.running = false
    this.lastTime = 0
    this.time = 0 // accumulated time in seconds
    this._rafId = null
    this._reducedMotion = window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

    this._resize()

    // Observe parent for size changes
    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(() => this._resize())
      this._resizeObserver.observe(canvas.parentElement)
    }
    window.addEventListener('resize', this._onWindowResize)
  }

  _onWindowResize = () => this._resize()

  _resize() {
    const parent = this.canvas.parentElement
    if (!parent) return
    const rect = parent.getBoundingClientRect()
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    // Validate dimensions to avoid 0-size canvas
    const w = Math.max(1, Math.round(rect.width))
    const h = Math.max(1, Math.round(rect.height))
    this.canvas.width = w * this.dpr
    this.canvas.height = h * this.dpr
    this.canvas.style.width = w + 'px'
    this.canvas.style.height = h + 'px'
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    this.width = w
    this.height = h
    for (const layer of this.layers) {
      if (layer.onResize) layer.onResize(w, h)
    }
  }

  addLayer(layer) {
    this.layers.push(layer)
    if (layer.onResize) layer.onResize(this.width, this.height)
    return layer
  }

  removeLayer(layer) {
    this.layers = this.layers.filter((l) => l !== layer)
  }

  start() {
    if (this.running) return
    this.running = true
    this.lastTime = performance.now()
    this._loop()
  }

  stop() {
    this.running = false
    if (this._rafId) cancelAnimationFrame(this._rafId)
  }

  _loop = () => {
    if (!this.running) return
    const now = performance.now()
    let dt = (now - this.lastTime) / 1000
    this.lastTime = now
    // Clamp dt to avoid huge jumps
    dt = Math.min(dt, MAX_DT)
    this.time += dt

    try {
      this.update(dt)
      this.draw()
    } catch (error) {
      this.stop()
      this.onError?.(error)
      return
    }

    this._rafId = requestAnimationFrame(this._loop)
  }

  update(dt) {
    for (const layer of this.layers) {
      if (layer.update) layer.update(dt, this.time)
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height)
    for (const layer of this.layers) {
      if (layer.draw) layer.draw(this.ctx, this.width, this.height, this.time)
    }
  }

  /**
   * Get the clamped dt value for a given raw frame time (used in tests).
   */
  static clampDt(rawDt) {
    return Math.min(rawDt, MAX_DT)
  }

  dispose() {
    this.stop()
    if (this._resizeObserver) this._resizeObserver.disconnect()
    window.removeEventListener('resize', this._onWindowResize)
  }
}
