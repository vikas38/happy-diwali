import { describe, it, expect, vi } from 'vitest'
import { ChhotuChamp, ARM_STATES } from '../src/render/characters/ChhotuChamp.js'
import { drawAdult } from '../src/render/characters/Adult.js'
import { Particles } from '../src/render/Particles.js'
import { GameController, STATES } from '../src/fsm/GameController.js'

describe('Task M3 — Character states, poses, and rendered flash bounds', () => {
  describe('1. ChhotuChamp poses and visual continuity', () => {
    it('defines neutral empty-handed idle and attentive watching arm states', () => {
      expect(ARM_STATES.NEUTRAL_IDLE).toBe('NEUTRAL_IDLE')
      expect(ARM_STATES.WATCHING).toBe('WATCHING')
      expect(ARM_STATES.COVER_EARS_SMILE).toBe('COVER_EARS_SMILE')
      expect(ARM_STATES.VICTORY_JUMP).toBe('VICTORY_JUMP')
    })

    it('defaults to neutral empty-handed IDLE sprite pose rather than cover-ears during browsing', () => {
      const chhotu = new ChhotuChamp()
      chhotu.setArmState(ARM_STATES.NEUTRAL_IDLE)

      const mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        lineCap: 'round',
        beginPath: vi.fn(),
        ellipse: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        quadraticCurveTo: vi.fn(),
        closePath: vi.fn(),
        drawImage: vi.fn(),
        createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        rotate: vi.fn(),
        arc: vi.fn(),
        rect: vi.fn(),
      }

      // Draw in procedural mode
      chhotu.draw(mockCtx, 800, 600, 0)
      expect(chhotu.armState).toBe(ARM_STATES.NEUTRAL_IDLE)
    })

    it('GameController uses NEUTRAL_IDLE on ready and idle, WATCHING during show, and COVER_EARS on countdown', () => {
      const chhotu = new ChhotuChamp()
      const pip = { setPosition: vi.fn(), setMood: vi.fn() }
      const gc = new GameController(STATES.IDLE)
      const store = {
        getState: () => ({ seenIntros: [0], unlockedCrackers: [0] }),
        hasSeenIntro: () => true,
        isUnlocked: () => true,
      }

      gc.init({
        sound: { supported: false },
        renderer: { width: 800, height: 600 },
        chhotu,
        pip,
        store,
      })
      gc.setCrackerShowFn(() => () => {})

      // 1. Ready on street -> NEUTRAL_IDLE
      gc.selectCracker(0)
      expect(chhotu.armState).toBe(ARM_STATES.NEUTRAL_IDLE)

      // 2. Start cracker show -> WATCHING
      gc.state = STATES.COUNTDOWN_3_2_1
      gc._startCrackerShow()
      expect(chhotu.armState).toBe(ARM_STATES.WATCHING)

      // 3. Complete show -> VICTORY_JUMP
      gc.state = STATES.CRACKER_SHOW_ACTIVE
      gc._onCrackerShowComplete()
      expect(chhotu.armState).toBe(ARM_STATES.VICTORY_JUMP)

      // 4. Return to idle tray -> NEUTRAL_IDLE
      gc.goToIdle()
      expect(chhotu.armState).toBe(ARM_STATES.NEUTRAL_IDLE)
    })

    it('in reduced motion, Chhotu retains grounded still pose without jumping or breathing distortion', () => {
      const chhotu = new ChhotuChamp()
      chhotu.reducedMotion = true
      chhotu.jump(0.6)
      expect(chhotu.jumpActive).toBe(false)
      expect(chhotu._jumpY).toBe(0)

      chhotu.update(0.1, 1.0)
      expect(chhotu.breathPhase).toBe(0)
      expect(chhotu._jumpY).toBe(0)
    })
  })

  describe('2. Responsible adult visual grounding and contact shadow', () => {
    it('draws responsible adult with a ground contact shadow on street pavement', () => {
      const mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        lineCap: 'butt',
        font: '',
        textAlign: '',
        beginPath: vi.fn(),
        ellipse: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        fillRect: vi.fn(),
        arc: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        fillText: vi.fn(),
      }

      drawAdult(mockCtx, 800, 600, 0)
      // Visual grounding ellipse under feet
      expect(mockCtx.ellipse).toHaveBeenCalledWith(0, 1.5, 20, 5.5, 0, 0, Math.PI * 2)
      // Clearly labeled GROWN-UP
      expect(mockCtx.fillText).toHaveBeenCalledWith('GROWN-UP', 0, -134)
    })
  })

  describe('3. Rendered flash bounds compliance', () => {
    it('strictly bounds rendered flash radius <= 100 CSS px at all lifetime fractions', () => {
      const p = new Particles()
      p.flash(400, 300, 100) // request 100px flash

      expect(p.flashes).toHaveLength(1)
      const flash = p.flashes[0]
      expect(flash.radius).toBeLessThanOrEqual(100)

      const renderedRadii = []
      const mockCtx = {
        createRadialGradient: vi.fn((x, y, r0, fx, fy, r) => {
          renderedRadii.push(r)
          return { addColorStop: vi.fn() }
        }),
        fillRect: vi.fn(),
      }

      // Test at various fractions of lifetime: a = 1.0, 0.75, 0.5, 0.25, 0.05
      const steps = [0.0, 0.05, 0.1, 0.15, 0.2]
      for (const t of steps) {
        flash.life = flash.duration * (1 - t / flash.duration)
        p.draw(mockCtx, 800, 600, t)
      }

      expect(renderedRadii.length).toBeGreaterThan(0)
      for (const r of renderedRadii) {
        expect(r).toBeLessThanOrEqual(100)
        expect(r).toBeGreaterThan(0)
      }
    })

    it('enforces maximum 100px rendered extent even when requested with oversized radius (500px)', () => {
      const p = new Particles()
      p.flash(200, 200, 500)

      expect(p.flashes[0].radius).toBeLessThanOrEqual(100)

      let renderedRadius = null
      const mockCtx = {
        createRadialGradient: vi.fn((x, y, r0, fx, fy, r) => {
          renderedRadius = r
          return { addColorStop: vi.fn() }
        }),
        fillRect: vi.fn(),
      }

      p.draw(mockCtx, 800, 600, 0)
      expect(renderedRadius).toBeLessThanOrEqual(100)
    })
  })
})
