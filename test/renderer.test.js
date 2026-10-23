import { describe, it, expect } from 'vitest'
import { Renderer } from '../src/render/Renderer.js'
import {
  Background,
  LAYOUT,
  getLaunchPoint,
  getSafeZonePoint,
} from '../src/render/layers/Background.js'

describe('Renderer — dt clamping', () => {
  it('clamps dt to 1/30 max', () => {
    expect(Renderer.clampDt(0.016)).toBeCloseTo(0.016, 3)
    expect(Renderer.clampDt(1)).toBeCloseTo(1 / 30, 3)
    expect(Renderer.clampDt(10)).toBeCloseTo(1 / 30, 3)
  })
})

describe('Background — layout positions', () => {
  it('launch point is center-bottom of screen', () => {
    const p = getLaunchPoint(400, 700)
    expect(p.x).toBeCloseTo(228) // 0.5 * 400
    expect(p.y).toBeCloseTo(511) // 0.78 * 700
  })

  it('safe zone is on the left side', () => {
    const p = getSafeZonePoint(400, 700)
    expect(p.x).toBe(76) // 0.22 * 400
    expect(p.y).toBe(525) // 0.72 * 700
  })

  it('safe zone is to the left of launch point', () => {
    const launch = getLaunchPoint(400, 700)
    const safe = getSafeZonePoint(400, 700)
    expect(safe.x).toBeLessThan(launch.x)
  })

  it('LAYOUT has all required keys', () => {
    expect(LAYOUT).toHaveProperty('launchX')
    expect(LAYOUT).toHaveProperty('launchY')
    expect(LAYOUT).toHaveProperty('safeX')
    expect(LAYOUT).toHaveProperty('safeY')
    expect(LAYOUT).toHaveProperty('chhotuStartX')
    expect(LAYOUT).toHaveProperty('chhotuStartY')
    expect(LAYOUT).toHaveProperty('pipStartX')
    expect(LAYOUT).toHaveProperty('pipStartY')
    expect(LAYOUT).toHaveProperty('streetTop')
  })
})

describe('Background — generation', () => {
  it('generates stars, buildings, fairy lights, and torans on resize', () => {
    const bg = new Background()
    bg.onResize(400, 700)
    expect(bg.stars.length).toBeGreaterThan(0)
    expect(bg.buildings.length).toBeGreaterThan(0)
    expect(bg.fairyLights.length).toBe(3)
    expect(bg.torans.length).toBe(2)
  })

  it('stars are within the sky region', () => {
    const bg = new Background()
    bg.onResize(400, 700)
    for (const s of bg.stars) {
      expect(s.x).toBeGreaterThanOrEqual(0)
      expect(s.x).toBeLessThanOrEqual(400)
      expect(s.y).toBeGreaterThanOrEqual(0)
      expect(s.y).toBeLessThanOrEqual(700 * 0.55)
    }
  })

  it('buildings have windows', () => {
    const bg = new Background()
    bg.onResize(400, 700)
    const totalWindows = bg.buildings.reduce((sum, b) => sum + b.windows.length, 0)
    expect(totalWindows).toBeGreaterThan(0)
  })

  it('draws without throwing and never passes undefined to addColorStop', () => {
    const bg = new Background()
    bg.onResize(400, 700)
    const mockGradient = {
      addColorStop: (offset, color) => {
        if (
          color === undefined ||
          color === null ||
          typeof color !== 'string' ||
          color === 'undefined'
        ) {
          throw new Error(`Invalid color in addColorStop: ${color}`)
        }
      },
    }
    const mockCtx = {
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      scale: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      ellipse: () => {},
      quadraticCurveTo: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      stroke: () => {},
      fill: () => {},
      fillText: () => {},
      measureText: () => ({ width: 50 }),
      createLinearGradient: () => mockGradient,
      createRadialGradient: () => mockGradient,
      setLineDash: () => {},
      bezierCurveTo: () => {},
    }
    expect(() => bg.draw(mockCtx, 400, 700, 0)).not.toThrow()
    expect(() => bg.draw(mockCtx, 400, 700, 1.0)).not.toThrow()
    expect(() => bg.draw(mockCtx, 1200, 800, 2.5)).not.toThrow()

    // Test all game states and all 6 crackers
    const states = [
      'SAFETY_SPLASH',
      'IDLE',
      'CRACKER_INTRO_CARD',
      'READY_ON_STREET',
      'STEPPING_BACK_SAFE_ROUTINE',
      'COUNTDOWN_3_2_1',
      'CRACKER_SHOW_ACTIVE',
      'REWARD_CELEBRATION',
    ]
    for (const st of states) {
      for (let c = 0; c < 6; c++) {
        bg.setGameState(st, c)
        expect(() => bg.draw(mockCtx, 400, 700, 1.2)).not.toThrow()
      }
    }
  })
})
