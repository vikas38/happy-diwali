// ===================================================================
// JellySquash — Bouncy spring oscillation replacing screen-shake
// ===================================================================
// Applies a scaleX/scaleY spring oscillation to the canvas container
// element so loud crackers feel cartoonish rather than jarring.
// Respects prefers-reduced-motion (disables entirely) and calm visuals (x0.5 amplitude).
// ===================================================================

import { CALM_VISUALS_CONFIG } from '../../safety/calmVisuals.js'

export class JellySquash {
  /**
   * @param {HTMLElement} element - the canvas wrapper to transform
   */
  constructor(element) {
    this.element = element || null
    this.scaleX = 1
    this.scaleY = 1
    this.vx = 0
    this.vy = 0
    this.k = 220 // spring constant
    this.c = 9 // damping (underdamped for bouncy feel)
    this._triggered = false
    this.calmVisuals = false
    this.reducedMotion =
      typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false
  }

  /**
   * Trigger a jelly squash. The container compresses on one axis and
   * stretches on the other, then bounces back with spring oscillation.
   * @param {number} amount - squash magnitude (0..0.3)
   * @param {string} axis - 'y' (vertical squash, default) or 'x'
   */
  trigger(amount = 0.15, axis = 'y') {
    if (this.reducedMotion) return
    if (this.calmVisuals) amount *= CALM_VISUALS_CONFIG.squashMultiplier
    this._triggered = true
    if (axis === 'y') {
      this.scaleX = 1 + amount
      this.scaleY = 1 - amount
    } else {
      this.scaleX = 1 - amount
      this.scaleY = 1 + amount
    }
    this.vx = 0
    this.vy = 0
  }

  update(dt, time) {
    if (this.reducedMotion) {
      if (this.element) this.element.style.transform = ''
      return
    }

    // Spring physics toward rest (1, 1)
    const ax = -this.k * (this.scaleX - 1) - this.c * this.vx
    const ay = -this.k * (this.scaleY - 1) - this.c * this.vy
    this.vx += ax * dt
    this.vy += ay * dt
    this.scaleX += this.vx * dt
    this.scaleY += this.vy * dt

    // Snap to rest when close enough (prevents endless tiny oscillation)
    if (
      this._triggered &&
      Math.abs(this.scaleX - 1) < 0.002 &&
      Math.abs(this.scaleY - 1) < 0.002 &&
      Math.abs(this.vx) < 0.05 &&
      Math.abs(this.vy) < 0.05
    ) {
      this.scaleX = 1
      this.scaleY = 1
      this.vx = 0
      this.vy = 0
      this._triggered = false
    }

    // Apply transform to the DOM element
    if (this.element) {
      this.element.style.transform = `scale(${this.scaleX}, ${this.scaleY})`
    }
  }

  draw(ctx, w, h, time) {
    // No canvas drawing — operates on the DOM container
  }

  reset() {
    this.scaleX = 1
    this.scaleY = 1
    this.vx = 0
    this.vy = 0
    this._triggered = false
    if (this.element) this.element.style.transform = ''
  }

  /**
   * Check if the squash has settled back to rest.
   */
  get isAtRest() {
    return Math.abs(this.scaleX - 1) < 0.01 && Math.abs(this.scaleY - 1) < 0.01
  }
}
