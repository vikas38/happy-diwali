// ===================================================================
// Calm Visuals & Flash Safety Engine
// WCAG 2.3.1 (Three Flashes or Below Threshold) compliance
// ===================================================================

export const CALM_VISUALS_CONFIG = {
  particleCountMultiplier: 0.5,     // particle count x0.5
  particleLifetimeMultiplier: 0.6,  // particle lifetime x0.6
  allowScreenFlash: false,          // no full-screen flash or vignette pulse
  squashMultiplier: 0.5,            // squash amplitude x0.5
  allowScreenShake: false,          // zero screen shake
}

export const STANDARD_VISUALS_CONFIG = {
  particleCountMultiplier: 1.0,
  particleLifetimeMultiplier: 1.0,
  allowScreenFlash: true,
  squashMultiplier: 1.0,
  allowScreenShake: false,
}

export const MAX_FLASHES_PER_SECOND = 3
export const FLASH_WINDOW_MS = 1000

/**
 * FlashLimiter enforces that no more than 3 large-area luminance flashes
 * occur in any rolling 1000 ms window (WCAG 2.3.1).
 */
export class FlashLimiter {
  constructor(maxFlashes = MAX_FLASHES_PER_SECOND, windowMs = FLASH_WINDOW_MS) {
    this.maxFlashes = maxFlashes
    this.windowMs = windowMs
    this.history = []
  }

  /**
   * Request permission to flash at a given timestamp.
   * @param {number} now - timestamp in milliseconds
   * @param {boolean} [calmVisuals=false] - if true, no flashes permitted
   * @returns {boolean} true if flash is allowed, false if rejected
   */
  requestFlash(now = (typeof performance !== 'undefined' ? performance.now() : Date.now()), calmVisuals = false) {
    if (calmVisuals) return false
    const cutoff = now - this.windowMs
    this.history = this.history.filter((t) => t > cutoff)
    if (this.history.length >= this.maxFlashes) {
      return false
    }
    this.history.push(now)
    return true
  }

  reset() {
    this.history = []
  }
}

/**
 * Functional flash limiter for standalone evaluation.
 * @param {number[]} history - mutable or array of past flash timestamps
 * @param {number} now - current timestamp in ms
 * @param {object} [options]
 * @param {number} [options.maxFlashes=3]
 * @param {number} [options.windowMs=1000]
 * @param {boolean} [options.calmVisuals=false]
 * @returns {boolean}
 */
export function canTriggerFlash(
  history,
  now,
  { maxFlashes = MAX_FLASHES_PER_SECOND, windowMs = FLASH_WINDOW_MS, calmVisuals = false } = {},
) {
  if (calmVisuals) return false
  const cutoff = now - windowMs
  const valid = history.filter((t) => t > cutoff)
  if (valid.length >= maxFlashes) return false
  valid.push(now)
  history.length = 0
  history.push(...valid)
  return true
}

/**
 * Check whether the system prefers reduced motion.
 * @returns {boolean}
 */
export function detectsReducedMotion() {
  try {
    if (typeof globalThis.matchMedia === 'function') {
      return Boolean(globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches)
    }
  } catch (_) {}
  return false
}
