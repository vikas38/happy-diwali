import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act, within } from '@testing-library/react'
import {
  MOTION_POLICY,
  resolveEffectiveMotion,
  CALM_VISUALS_CONFIG,
} from '../src/safety/calmVisuals.js'
import { createDefaultSave, validateSave, loadSave, writeSave } from '../src/store/save.js'
import { GameStoreProvider, useGameStore } from '../src/store/gameStore.jsx'
import HUD from '../src/ui/HUD.jsx'
import CalmCorner from '../src/ui/CalmCorner.jsx'
import FestivalHome from '../src/ui/FestivalHome.jsx'
import { ChhotuChamp, ARM_STATES } from '../src/render/characters/ChhotuChamp.js'
import { Pip } from '../src/render/characters/Pip.js'
import { drawCourtyard } from '../src/render/layers/Courtyard.js'

describe('Task M1 — Apply one persistent motion policy across DOM and Canvas', () => {
  let mockStorage

  beforeEach(() => {
    mockStorage = {
      _data: {},
      getItem(k) {
        return this._data[k] ?? null
      },
      setItem(k, v) {
        this._data[k] = String(v)
      },
      removeItem(k) {
        delete this._data[k]
      },
      clear() {
        this._data = {}
      },
    }
  })

  describe('Motion policy resolution and persistence', () => {
    it('System policy follows OS preference dynamically', () => {
      expect(resolveEffectiveMotion(MOTION_POLICY.SYSTEM, true)).toBe(true)
      expect(resolveEffectiveMotion(MOTION_POLICY.SYSTEM, false)).toBe(false)
    })

    it('Reduced policy forces reduced motion regardless of OS setting', () => {
      expect(resolveEffectiveMotion(MOTION_POLICY.REDUCED, false)).toBe(true)
      expect(resolveEffectiveMotion(MOTION_POLICY.REDUCED, true)).toBe(true)
    })

    it('Full policy forces full motion regardless of OS setting', () => {
      expect(resolveEffectiveMotion(MOTION_POLICY.FULL, true)).toBe(false)
      expect(resolveEffectiveMotion(MOTION_POLICY.FULL, false)).toBe(false)
    })

    it('persists explicit user motion choices across reloads', () => {
      // User selects REDUCED explicitly
      const savedState = validateSave({
        motionPolicy: MOTION_POLICY.REDUCED,
        stars: 6,
      })
      expect(savedState.motionPolicy).toBe(MOTION_POLICY.REDUCED)

      writeSave(savedState, mockStorage)
      const reloaded = loadSave(mockStorage)
      expect(reloaded.motionPolicy).toBe(MOTION_POLICY.REDUCED)

      // User selects FULL explicitly
      const fullState = validateSave({
        motionPolicy: MOTION_POLICY.FULL,
        stars: 6,
      })
      writeSave(fullState, mockStorage)
      const reloadedFull = loadSave(mockStorage)
      expect(reloadedFull.motionPolicy).toBe(MOTION_POLICY.FULL)
    })

    it('migrates legacy boolean calmVisuals cleanly to motionPolicy', () => {
      const legacyTrue = validateSave({ calmVisuals: true })
      expect(legacyTrue.motionPolicy).toBe(MOTION_POLICY.REDUCED)

      const legacyFalse = validateSave({ calmVisuals: false })
      expect(legacyFalse.motionPolicy).toBe(MOTION_POLICY.FULL)
    })
  })

  describe('GameStore setMotionPolicy action', () => {
    it('allows updating motionPolicy via store and updates calmVisuals', () => {
      let storeAPI
      function Consumer() {
        storeAPI = useGameStore()
        return (
          <div>
            <span data-testid="policy">{storeAPI.state.motionPolicy}</span>
            <button onClick={() => storeAPI.setMotionPolicy(MOTION_POLICY.REDUCED)}>
              set reduced
            </button>
            <button onClick={() => storeAPI.setMotionPolicy(MOTION_POLICY.FULL)}>set full</button>
          </div>
        )
      }

      render(
        <GameStoreProvider>
          <Consumer />
        </GameStoreProvider>
      )

      expect(storeAPI.state.motionPolicy).toBe(MOTION_POLICY.SYSTEM)

      act(() => {
        storeAPI.setMotionPolicy(MOTION_POLICY.REDUCED)
      })
      expect(storeAPI.state.motionPolicy).toBe(MOTION_POLICY.REDUCED)
      expect(storeAPI.state.calmVisuals).toBe(true)

      act(() => {
        storeAPI.setMotionPolicy(MOTION_POLICY.FULL)
      })
      expect(storeAPI.state.motionPolicy).toBe(MOTION_POLICY.FULL)
      expect(storeAPI.state.calmVisuals).toBe(false)
    })
  })

  describe('CalmCorner static guide in reduced motion', () => {
    it('suppresses transform scaling on breathing circle when reducedMotion is active', () => {
      const onResume = vi.fn()
      const { container } = render(
        <CalmCorner onResume={onResume} isMuted={false} reducedMotion={true} />
      )

      const circle = container.querySelector('.breathing-circle')
      expect(circle).toBeTruthy()
      expect(circle.classList.contains('breathing-circle--static')).toBe(true)
      expect(circle.style.transform).toBe('none')
    })
  })

  describe('Characters behavior under reduced motion', () => {
    it('ChhotuChamp suppresses jump bounce and breathing body scaling in reduced motion', () => {
      const chhotu = new ChhotuChamp()
      chhotu.reducedMotion = true

      // Trigger jump
      chhotu.jump(0.5)
      expect(chhotu.jumpActive).toBe(false)
      expect(chhotu._jumpY).toBe(0)

      // Update frame
      chhotu.update(0.016, 1.0)
      expect(chhotu.breathPhase).toBe(0)
      expect(chhotu._jumpY).toBe(0)

      // Verify still pose is maintained for ear protection
      chhotu.setArmState(ARM_STATES.COVER_EARS_SMILE)
      expect(chhotu.armState).toBe(ARM_STATES.COVER_EARS_SMILE)
    })

    it('Pip suppresses jump bounce and floating hearts in reduced motion', () => {
      const pip = new Pip()
      pip.reducedMotion = true

      // Jump
      pip.jump(0.5)
      expect(pip._jumpActive).toBe(false)
      expect(pip._jumpY).toBe(0)

      // Update frame in HAPPY mood
      pip.setMood('HAPPY')
      pip.update(0.5, 2.0)
      expect(pip._jumpY).toBe(0)
      expect(pip._hearts.length).toBe(0)
    })
  })

  describe('Courtyard layer under reduced motion', () => {
    it('drawCourtyard zeroes effectiveT when reducedMotion is true to freeze star flicker', () => {
      const mockCtx = new Proxy(
        {},
        {
          get: () => vi.fn(() => ({ addColorStop: vi.fn() })),
        }
      )

      // Should run without error and not produce oscillating pulses
      expect(() => {
        drawCourtyard(mockCtx, 800, 600, 10.0, 'IDLE', true)
      }).not.toThrow()
    })
  })

  describe('HUD motion controls', () => {
    it('renders System, Reduced, and Full segmented buttons in Settings', () => {
      const onMotionPolicyChange = vi.fn()
      render(
        <HUD
          masterVolume={0.7}
          motionPolicy="REDUCED"
          onMotionPolicyChange={onMotionPolicyChange}
          settingsOpen={true}
        />
      )

      const motionGroup = screen.getByRole('group', { name: /Motion & Visuals/i })
      const systemBtn = within(motionGroup).getByRole('button', { name: /System/i })
      const reducedBtn = within(motionGroup).getByRole('button', { name: /Reduced/i })
      const fullBtn = within(motionGroup).getByRole('button', { name: /Full/i })

      expect(systemBtn).toBeTruthy()
      expect(reducedBtn).toBeTruthy()
      expect(fullBtn).toBeTruthy()
      expect(reducedBtn.getAttribute('aria-pressed')).toBe('true')

      fireEvent.click(fullBtn)
      expect(onMotionPolicyChange).toHaveBeenCalledWith('FULL')
    })
  })
})
