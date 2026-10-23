export const MAX_OUTPUT_PEAK = 0.25
export const MASTER_CEILING_DB = -6.0
export const MASTER_CEILING_LINEAR = Math.pow(10, MASTER_CEILING_DB / 20) // ~0.501187
export const FLASH_INTERVAL_MS = 400
export function limiterCurve(size = 4097) {
  return Float32Array.from({ length: size }, (_, i) => MAX_OUTPUT_PEAK * Math.tanh((i / (size - 1) * 2 - 1) / MAX_OUTPUT_PEAK))
}

/**
 * Determines whether a resize event represents a true screen/orientation change
 * that warrants pausing active sequences, rather than a transient mobile address-bar
 * collapse or small layout shift.
 *
 * Rules:
 * 1. Pause on orientation change (portrait <-> landscape).
 * 2. Ignore height-only changes under 120px (mobile browser address bar collapse).
 * 3. Pause if width or height changes by more than 20% from the previous size.
 *
 * @param {{ width: number, height: number }} prev
 * @param {{ width: number, height: number }} next
 * @returns {boolean} true if pause should occur
 */
export function shouldPauseOnResize(prev, next) {
  if (!prev || !next || typeof prev.width !== 'number' || typeof next.width !== 'number') {
    return false
  }
  if (prev.width <= 0 || prev.height <= 0 || next.width <= 0 || next.height <= 0) {
    return false
  }

  // 1. Orientation change
  const prevLandscape = prev.width > prev.height
  const nextLandscape = next.width > next.height
  if (prevLandscape !== nextLandscape) {
    return true
  }

  const dw = Math.abs(next.width - prev.width)
  const dh = Math.abs(next.height - prev.height)

  // 2. Ignore height-only changes under 120px (mobile browser address-bar toggle)
  if (dw === 0 && dh < 120) {
    return false
  }

  // 3. Width or height changed by > 20%
  const widthRatio = dw / prev.width
  const heightRatio = dh / prev.height

  if (widthRatio > 0.20) {
    return true
  }

  if (dh >= 120 && heightRatio > 0.20) {
    return true
  }

  return false
}

export const meaningfulResize = shouldPauseOnResize
