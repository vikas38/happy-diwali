// ===================================================================
// WCAG 2.1 Non-Text Contrast (1.4.11) & Visual Hierarchy Helper
// ===================================================================
// Success Criterion 1.4.11 requires a contrast ratio of at least 3:1
// for user interface components and graphical objects against adjacent colors.

/**
 * Parses a hex color string (#RGB, #RGBA, #RRGGBB, #RRGGBBAA) into sRGB 0..255 components.
 * @param {string} hex
 * @returns {{ r: number, g: number, b: number, a: number }}
 */
export function parseHex(hex) {
  if (typeof hex !== 'string') {
    throw new TypeError(`Expected color string, received: ${typeof hex}`)
  }
  let h = hex.trim().replace(/^#/, '')
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  } else if (h.length === 4) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]
  }

  if (h.length === 6) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: 1.0,
    }
  }
  if (h.length === 8) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: parseInt(h.slice(6, 8), 16) / 255,
    }
  }

  throw new Error(`Unsupported hex color format: ${hex}`)
}

/**
 * Computes the WCAG 2.1 relative luminance of an sRGB color.
 * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 * where each channel is linearized.
 * @param {string|{r: number, g: number, b: number}} color
 * @returns {number} Luminance between 0.0 and 1.0
 */
export function relativeLuminance(color) {
  const { r, g, b } = typeof color === 'string' ? parseHex(color) : color
  const toLinear = (c) => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  const rLin = toLinear(r)
  const gLin = toLinear(g)
  const bLin = toLinear(b)
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin
}

/**
 * Computes the WCAG contrast ratio between two colors (lighter + 0.05) / (darker + 0.05).
 * @param {string} colorA
 * @param {string} colorB
 * @returns {number} Ratio formatted to 2 decimal places (1.00 to 21.00)
 */
export function contrastRatio(colorA, colorB) {
  const l1 = relativeLuminance(colorA)
  const l2 = relativeLuminance(colorB)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  const ratio = (lighter + 0.05) / (darker + 0.05)
  return Math.round(ratio * 100) / 100
}

/**
 * Checks whether the contrast ratio meets WCAG 2.1 Non-Text Contrast (3:1 minimum).
 * @param {string} foreground
 * @param {string} background
 * @param {number} [threshold=3.0]
 * @returns {boolean}
 */
export function meetsNonTextContrast(foreground, background, threshold = 3.0) {
  return contrastRatio(foreground, background) >= threshold
}

// ── Palette Specifications ──────────────────────────────────────────

/**
 * Courtyard background palettes against which interactive elements sit.
 */
export const COURTYARD_PALETTE = {
  streetTop: '#3e393a',
  streetMid: '#2b292e',
  streetBottom: '#1b1c24',
  rugBase: '#4a2233',
  rugInner: '#3e1d2c',
}

/**
 * Interactive prop, outline, and glow palettes.
 */
export const INTERACTIVE_PALETTE = {
  // Shared interactive visual hierarchy treatments (glow / outline)
  glow: '#FFE082',
  aura: '#FFD54F',
  outline: '#FFF59D',
  targetRing: '#FDE047',

  // Interactive firework prop primary distinctive tones
  props: {
    phuljhari: '#D1D5DB', // Sparkler rod & metallic tip
    anar: '#F59E0B', // Amber earthenware cone
    chakri: '#FBBF24', // Golden spinning spiral
    rocket: '#F87171', // Bright rocket body
    ladi: '#FBBF24', // Golden garland ribbon
    sutli: '#22C55E', // Vibrant festive twine green
  },
}
