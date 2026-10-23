import { describe, it, expect } from 'vitest'
import { Renderer, DEPTH } from '../src/render/Renderer.js'
import { Background, InteractivePropLayer } from '../src/render/layers/Background.js'
import {
  parseHex,
  relativeLuminance,
  contrastRatio,
  meetsNonTextContrast,
  COURTYARD_PALETTE,
  INTERACTIVE_PALETTE,
} from '../src/safety/contrast.js'

describe('T18 — WCAG 2.1 Contrast Helper (1.4.11 Non-Text Contrast)', () => {
  it('correctly parses 3, 4, 6, and 8 digit hex colors', () => {
    expect(parseHex('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 })
    expect(parseHex('#000f')).toEqual({ r: 0, g: 0, b: 0, a: 1 })
    expect(parseHex('#ff8000')).toEqual({ r: 255, g: 128, b: 0, a: 1 })
    expect(parseHex('#11223380')).toEqual({ r: 17, g: 34, b: 51, a: 128 / 255 })
  })

  it('calculates relative luminance according to WCAG sRGB linear formula', () => {
    // Pure black L = 0, Pure white L = 1
    expect(relativeLuminance('#000000')).toBe(0)
    expect(relativeLuminance('#ffffff')).toBe(1)
    // Pure red, green, blue relative weights (0.2126, 0.7152, 0.0722)
    expect(relativeLuminance('#ff0000')).toBeCloseTo(0.2126, 3)
    expect(relativeLuminance('#00ff00')).toBeCloseTo(0.7152, 3)
    expect(relativeLuminance('#0000ff')).toBeCloseTo(0.0722, 3)
  })

  it('calculates contrast ratio between two colors (1:1 to 21:1)', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBe(21.0)
    expect(contrastRatio('#000000', '#000000')).toBe(1.0)
    expect(contrastRatio('#ffffff', '#ffffff')).toBe(1.0)
  })

  it('asserts all interactive indicators meet >= 3:1 non-text contrast against the street and rug palette', () => {
    const backgroundEntries = Object.entries(COURTYARD_PALETTE)
    const indicators = [
      { name: 'glow', color: INTERACTIVE_PALETTE.glow },
      { name: 'aura', color: INTERACTIVE_PALETTE.aura },
      { name: 'outline', color: INTERACTIVE_PALETTE.outline },
      { name: 'targetRing', color: INTERACTIVE_PALETTE.targetRing },
    ]

    for (const indicator of indicators) {
      for (const [bgName, bgColor] of backgroundEntries) {
        const ratio = contrastRatio(indicator.color, bgColor)
        const passes = meetsNonTextContrast(indicator.color, bgColor, 3.0)
        expect(
          passes,
          `Indicator ${indicator.name} (${indicator.color}) against ${bgName} (${bgColor}) must have >= 3:1 contrast (got ${ratio}:1)`
        ).toBe(true)
        expect(ratio).toBeGreaterThanOrEqual(3.0)
      }
    }
  })

  it('asserts all interactive prop colours meet >= 3:1 non-text contrast against the street and rug palette', () => {
    const backgroundEntries = Object.entries(COURTYARD_PALETTE)
    const propEntries = Object.entries(INTERACTIVE_PALETTE.props)

    for (const [propName, propColor] of propEntries) {
      for (const [bgName, bgColor] of backgroundEntries) {
        const ratio = contrastRatio(propColor, bgColor)
        const passes = meetsNonTextContrast(propColor, bgColor, 3.0)
        expect(
          passes,
          `Prop ${propName} (${propColor}) against ${bgName} (${bgColor}) must have >= 3:1 contrast (got ${ratio}:1)`
        ).toBe(true)
        expect(ratio).toBeGreaterThanOrEqual(3.0)
      }
    }
  })
})

describe('T18 — Render Layer Depth Hierarchy (Backdrop, Midground, Interactive)', () => {
  it('defines the three canonical depth levels', () => {
    expect(DEPTH).toEqual({
      BACKDROP: 0,
      MIDGROUND: 1,
      INTERACTIVE: 2,
    })
  })

  it('orders layers strictly by depth tier (BACKDROP -> MIDGROUND -> INTERACTIVE)', () => {
    const mockCanvas = {
      getContext: () => ({
        setTransform: () => {},
        clearRect: () => {},
      }),
      parentElement: {
        getBoundingClientRect: () => ({ width: 800, height: 600 }),
      },
      style: {},
    }

    const renderer = new Renderer(mockCanvas)

    const midLayer = { id: 'mid', depth: DEPTH.MIDGROUND }
    const interactiveLayer = { id: 'interactive', depth: DEPTH.INTERACTIVE }
    const backdropLayer = { id: 'backdrop', depth: DEPTH.BACKDROP }

    // Add out of order
    renderer.addLayer(midLayer)
    renderer.addLayer(interactiveLayer)
    renderer.addLayer(backdropLayer)

    expect(renderer.layers.map((l) => l.id)).toEqual(['backdrop', 'mid', 'interactive'])
  })

  it('preserves insertion order within the same depth tier', () => {
    const mockCanvas = {
      getContext: () => ({
        setTransform: () => {},
        clearRect: () => {},
      }),
      parentElement: {
        getBoundingClientRect: () => ({ width: 800, height: 600 }),
      },
      style: {},
    }

    const renderer = new Renderer(mockCanvas)

    const chhotu = { id: 'chhotu', depth: DEPTH.MIDGROUND }
    const pip = { id: 'pip', depth: DEPTH.MIDGROUND }
    const particles = { id: 'particles', depth: DEPTH.MIDGROUND }

    renderer.addLayer(chhotu)
    renderer.addLayer(pip)
    renderer.addLayer(particles)

    expect(renderer.layers.map((l) => l.id)).toEqual(['chhotu', 'pip', 'particles'])
  })

  it('InteractivePropLayer delegates to background when present', () => {
    const bg = new Background()
    bg.onResize(400, 700)
    bg.hasInteractiveLayer = true

    let drawn = false
    const mockCtx = {
      save: () => {},
      restore: () => {},
      translate: () => {},
      scale: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      ellipse: () => {},
      stroke: () => {},
      fill: () => {},
      fillRect: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
      setLineDash: () => {},
    }

    const propLayer = new InteractivePropLayer(bg)
    expect(propLayer.depth).toBe(DEPTH.INTERACTIVE)

    bg.setGameState('READY_ON_STREET', 0)
    expect(() => propLayer.draw(mockCtx, 400, 700, 1.0)).not.toThrow()
  })
})
