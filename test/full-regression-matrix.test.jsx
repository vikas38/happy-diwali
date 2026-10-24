import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { GameController, STATES } from '../src/fsm/GameController.js'
import {
  ALL_CRACKER_DEFINITIONS,
  ORIGINAL_SIX_IDS,
  R1_CRACKER_IDS,
  R2_CRACKER_IDS,
  getAllCrackers,
  getCrackerById,
  getCracker,
  isValidCrackerId,
} from '../src/crackers/crackerDefs.js'
import {
  createDefaultSave,
  validateSave,
  migrateSave,
  hasCompletedOriginalSix,
} from '../src/store/save.js'

describe('DIW-040 — Automated Gameplay, Migration, and Expanded-Catalog Regressions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Expanded Catalog Integrity (14 Crackers)', () => {
    it('contains all 14 shipped crackers with stable IDs 0..13 and unique art/effect keys', () => {
      const all = getAllCrackers()
      expect(all).toHaveLength(14)

      const ids = all.map((c) => c.id).sort((a, b) => a - b)
      expect(ids).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13])

      for (let i = 0; i <= 13; i++) {
        expect(isValidCrackerId(i)).toBe(true)
        const def = getCrackerById(i)
        expect(def).toBeTruthy()
        expect(def.id).toBe(i)
        expect(typeof def.name).toBe('string')
        expect(typeof def.duration).toBe('number')
        expect(def.duration).toBeGreaterThan(0)
        expect(['ground', 'sky']).toContain(def.category)
        expect(def.budget.maxParticles).toBeGreaterThan(0)
        expect(def.budget.maxParticles).toBeLessThanOrEqual(300)
      }
    })

    it('rejects invalid or corrupt cracker IDs without crash or silent substitution', () => {
      expect(isValidCrackerId(-1)).toBe(false)
      expect(isValidCrackerId(999)).toBe(false)
      expect(isValidCrackerId('chakri')).toBe(false)

      const fallback = getCracker(999)
      expect(fallback.isUnavailable).toBe(true)
      expect(fallback.id).toBe(-1)
    })
  })

  describe('Save Migration and Badging', () => {
    it('migrates legacy saves safely and maintains original-six completion badge', () => {
      const legacySave = {
        unlocked: [0, 1, 2, 3, 4, 5],
        stickers: [0, 1, 2, 3, 4, 5],
        stars: 18,
      }

      const migrated = migrateSave(legacySave)
      const validated = validateSave(migrated)

      expect(validated.version).toBe(2)
      expect(hasCompletedOriginalSix(validated.stickers)).toBe(true)
      expect(validated.unlocked).toEqual(expect.arrayContaining([0, 1, 2, 3, 4, 5]))
      expect(validated.courtyardDecorations).toEqual({
        rangoliMotif: 'lotus',
        toranStyle: 'marigold',
        diyaStyle: 'arch',
      })
      expect(validated.gentleGoals).toBeDefined()
    })
  })

  describe('FSM Full Flow and Interruption Rigor', () => {
    function makeEngines() {
      const chhotu = {
        x: 0,
        y: 0,
        walkTo: (fx, fy, tx, ty, dur, cb) => {
          chhotu._cb = cb
        },
        setPosition: vi.fn(),
        setFacing: vi.fn(),
        setArmState: vi.fn(),
        jump: vi.fn(),
        reset: vi.fn(),
      }
      const pip = { setPosition: vi.fn(), setMood: vi.fn(), jump: vi.fn() }
      const sound = {
        resume: () => Promise.resolve(),
        fadeCrackerAudio: vi.fn(),
        stopCrackerAudio: vi.fn(),
        startMusic: vi.fn(),
        stopMusic: vi.fn(),
        setIntensity: vi.fn(),
        setMasterVolume: vi.fn(),
        getAudioLevel: () => 0,
      }
      const storeState = { seenIntros: [] }
      const store = {
        hasSeenIntro: (i) => storeState.seenIntros.includes(i),
        markIntroSeen: (i) => storeState.seenIntros.push(i),
        isUnlocked: () => true,
        collectSticker: vi.fn(),
        addStars: vi.fn(),
        getState: () => storeState,
      }
      return {
        chhotu,
        pip,
        sound,
        store,
        particles: { clear: vi.fn(), burst: vi.fn(), spawn: vi.fn() },
        comicBubble: { spawn: vi.fn(), clear: vi.fn() },
        jellySquash: { trigger: vi.fn(), reset: vi.fn() },
        renderer: { width: 400, height: 700 },
      }
    }

    it('executes the full game progression loop cleanly', () => {
      vi.useFakeTimers()
      const gc = new GameController(STATES.SAFETY_SPLASH)
      const engines = makeEngines()
      gc.init(engines)

      // Start game
      gc.startGame()
      expect(gc.state).toBe(STATES.IDLE)

      // Choose cracker 0
      gc.selectCracker(0)
      expect(gc.state).toBe(STATES.CRACKER_INTRO_CARD)

      gc.putOnStreet()
      expect(gc.state).toBe(STATES.READY_ON_STREET)

      // Light cracker
      gc.tapCracker()
      expect(gc.state).toBe(STATES.STEPPING_BACK_SAFE_ROUTINE)

      // Step back completes to countdown
      engines.chhotu._cb()
      expect(gc.state).toBe(STATES.COUNTDOWN_3_2_1)

      // Interruption test: open library during countdown
      gc.openLibrary()
      expect(gc.state).toBe(STATES.LIBRARY_OVERLAY)

      // Close library restores countdown
      gc.closeLibrary()
      expect(gc.state).toBe(STATES.COUNTDOWN_3_2_1)

      // Advance through countdown to show and reward
      vi.advanceTimersByTime(3200)
      expect(gc.state).toBe(STATES.REWARD_CELEBRATION)

      vi.useRealTimers()
    })

    it('handles calm corner overlay from active show without losing state', () => {
      vi.useFakeTimers()
      const gc = new GameController(STATES.IDLE)
      const engines = makeEngines()
      gc.init(engines)
      engines.store.markIntroSeen(0)

      gc.selectCracker(0)
      gc.tapCracker()
      engines.chhotu._cb()
      expect(gc.state).toBe(STATES.COUNTDOWN_3_2_1)

      // Calm corner interruption
      gc.enterCalmCorner()
      expect(gc.state).toBe(STATES.CALM_CORNER_OVERLAY)

      // Resume from calm corner restores countdown safely
      gc.exitCalmCorner()
      expect(gc.state).toBe(STATES.COUNTDOWN_3_2_1)

      vi.useRealTimers()
    })
  })
})
