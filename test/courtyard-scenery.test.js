import { describe, it, expect, vi } from 'vitest'
import { drawCourtyard, STAGE } from '../src/render/layers/Courtyard.js'
import { Background } from '../src/render/layers/Background.js'

function createMockCtx() {
  const linearGradients = []
  const fillStyles = []
  return {
    linearGradients,
    fillStyles,
    ctx: {
      createLinearGradient: vi.fn((x0, y0, x1, y1) => {
        const grad = {
          stops: [],
          addColorStop: vi.fn((offset, color) => {
            grad.stops.push({ offset, color })
          }),
        }
        linearGradients.push(grad)
        return grad
      }),
      createRadialGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      bezierCurveTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      setLineDash: vi.fn(),
      drawImage: vi.fn(),
      set fillStyle(val) {
        fillStyles.push(val)
      },
      set strokeStyle(val) {},
      set lineWidth(val) {},
      set globalAlpha(val) {},
    },
  }
}

describe('DIW-005 — Layered cinematic Diwali courtyard scenery', () => {
  it('draws the nocturnal indigo/plum sky gradient and restrained doorstep rangoli', () => {
    const { ctx, linearGradients } = createMockCtx()

    drawCourtyard(ctx, 1280, 800, 2.0, 'IDLE', false)

    // Verify sky gradient uses DIW-002 / DIW-005 spec: deep indigo #11122b to muted plum #30203d
    const skyGrad = linearGradients[0]
    expect(skyGrad).toBeDefined()
    const color0 = skyGrad.stops.find((s) => s.offset === 0)?.color
    const color1 = skyGrad.stops.find((s) => s.offset === 1)?.color
    expect(color0).toBe('#11122b')
    expect(color1).toBe('#30203d')

    // Verify stage geometry anchors leave central upper sky negative space for fireworks
    expect(STAGE.launchX).toBeGreaterThanOrEqual(0.5)
    expect(STAGE.launchX).toBeLessThanOrEqual(0.7)
    expect(STAGE.safeX).toBeLessThan(STAGE.launchX)
  })

  it('suspends ambient bursts in Background when CRACKER_SHOW_ACTIVE so sky stays clear for player effect', () => {
    const bg = new Background()
    bg.onResize(1000, 700)
    bg.setGameState('READY_ON_STREET')

    // First update initializes _nextBurstTime to 0.6
    bg.update(0.1, 0.0)
    // Next update at time 1.0 triggers burst
    bg.update(1.0, 1.0)
    expect(bg.ambientBursts.length).toBeGreaterThan(0)

    // Switch to active cracker show
    bg.setGameState('CRACKER_SHOW_ACTIVE')
    bg.update(0.1, 1.1)

    // Bursts must be cleared and suppressed during active show
    expect(bg.ambientBursts.length).toBe(0)

    // During active show, update does not spawn ambient bursts
    bg.update(2.0, 3.1)
    expect(bg.ambientBursts.length).toBe(0)
  })

  it('supports reduced-motion mode by zeroing animation time without error', () => {
    const { ctx } = createMockCtx()

    expect(() => {
      drawCourtyard(ctx, 800, 600, 5.0, 'IDLE', true)
    }).not.toThrow()
  })

  describe('DIW-006 — Scene lighting & tactile interaction polish', () => {
    it('renders bounded local floor glow tied to effect light without full-screen wash', () => {
      const bg = new Background()
      bg.onResize(1000, 700)
      bg.setGameState('READY_ON_STREET')
      bg.illuminate(0.8)

      const { ctx } = createMockCtx()
      bg.draw(ctx, 1000, 700, 1.0)

      // Radial gradient created for bounded floor glow at launch coordinates
      const lx = 1000 * STAGE.launchX
      const ly = 700 * STAGE.launchY
      const glowR = Math.min(180, 1000 * 0.28)
      expect(ctx.createRadialGradient).toHaveBeenCalledWith(lx, ly, 4, lx, ly, glowR)
    })

    it('suppresses floor glow when motion/visuals are paused or reduced', () => {
      const bg = new Background()
      bg.onResize(1000, 700)
      bg.reducedMotion = true
      bg.illuminate(0.8)

      const { ctx } = createMockCtx()
      bg.draw(ctx, 1000, 700, 1.0)

      // No pulsing flash or floor glow created at launch coords under reduced motion
      const lx = 1000 * STAGE.launchX
      const ly = 700 * STAGE.launchY
      const glowR = Math.min(180, 1000 * 0.28)
      expect(ctx.createRadialGradient).not.toHaveBeenCalledWith(lx, ly, 4, lx, ly, glowR)
    })
  })
})
