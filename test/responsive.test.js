import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  isPortraitLayout,
  getGroundY,
  propScale,
  characterScale,
  STAGE,
} from '../src/render/layers/Courtyard.js'

describe('T19 — Responsive Stage Geometry & Proportions', () => {
  it('correctly detects portrait vs landscape orientation', () => {
    expect(isPortraitLayout(360, 640)).toBe(true)
    expect(isPortraitLayout(390, 844)).toBe(true)
    expect(isPortraitLayout(768, 1024)).toBe(true)
    expect(isPortraitLayout(640, 360)).toBe(false)
    expect(isPortraitLayout(844, 390)).toBe(false)
    expect(isPortraitLayout(1280, 800)).toBe(false)
  })

  it('shrinks the sky in portrait layout (44% height vs 60% in landscape)', () => {
    // In portrait, ground starts higher at 44% of height, giving 56% to street and props
    const groundPortrait = getGroundY(390, 844)
    expect(groundPortrait).toBeCloseTo(844 * 0.44, 1)

    // In landscape, ground starts at 60% of height, keeping expansive sky for fireworks
    const groundLandscape = getGroundY(844, 390)
    expect(groundLandscape).toBeCloseTo(390 * 0.6, 1)
  })

  it('keeps props large in portrait layout for young children (ages 4 to 8, D3)', () => {
    // Portrait mode propScale stays between 1.35 and 2.0
    const scale360 = propScale(360, 640)
    const scale390 = propScale(390, 844)
    const scale768 = propScale(768, 1024)

    expect(scale360).toBeGreaterThanOrEqual(1.35)
    expect(scale390).toBeGreaterThanOrEqual(1.35)
    expect(scale768).toBeLessThanOrEqual(2.0)

    // In landscape, scales based on stage viewport limits (1.0 to 1.8)
    const scaleLandscapeSmall = propScale(640, 360)
    expect(scaleLandscapeSmall).toBeGreaterThanOrEqual(1.0)
    expect(scaleLandscapeSmall).toBeLessThanOrEqual(1.8)
  })

  it('character scale adapts smoothly to viewport dimensions', () => {
    const sSmall = characterScale(360, 640)
    const sLarge = characterScale(1280, 800)
    expect(sSmall).toBeGreaterThanOrEqual(1.55)
    expect(sLarge).toBeLessThanOrEqual(2.8)
  })

  it('STAGE provides defined normalized anchor points for characters and props', () => {
    expect(STAGE.launchX).toBeGreaterThan(0.4)
    expect(STAGE.launchX).toBeLessThan(0.7)
    expect(STAGE.safeX).toBeLessThan(STAGE.launchX) // Safe zone always left of launch
  })

  it('defines safe area environment variables in styles.css and gameplay.css', () => {
    const stylesCss = fs.readFileSync(path.resolve(__dirname, '../src/styles.css'), 'utf8')
    const gameplayCss = fs.readFileSync(path.resolve(__dirname, '../src/gameplay.css'), 'utf8')

    expect(stylesCss).toContain('env(safe-area-inset-top')
    expect(stylesCss).toContain('env(safe-area-inset-bottom')
    expect(stylesCss).toContain('env(safe-area-inset-left')
    expect(stylesCss).toContain('env(safe-area-inset-right')

    expect(gameplayCss).toContain('var(--sab')
    expect(gameplayCss).toContain('var(--sat')
    expect(gameplayCss).toContain('var(--sal')
    expect(gameplayCss).toContain('var(--sar')
    expect(gameplayCss).toContain('.contextual-action-bar.has-dock')
  })
})
