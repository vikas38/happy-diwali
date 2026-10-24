import { describe, it, expect } from 'vitest'
import {
  CRACKERS,
  ORIGINAL_CRACKERS,
  R1_CRACKERS,
  ALL_CRACKER_DEFINITIONS,
  CATALOG_GROUPS,
  ORIGINAL_SIX_IDS,
  R1_CRACKER_IDS,
  R2_CRACKER_IDS,
  getCrackerById,
  getCracker,
  isValidCrackerId,
  getAllCrackers,
  getCrackersByGroup,
  getCrackersByCategory,
  registerCracker,
} from '../src/crackers/crackerDefs.js'

describe('DIW-016 — Extensible Cracker Catalog by Stable ID', () => {
  describe('Stable IDs and Catalog Schema Integrity', () => {
    it('preserves the original six IDs (0..5) and sets stable IDs 6..9 for R1 and 10..13 for R2', () => {
      expect(ORIGINAL_SIX_IDS).toEqual([0, 1, 2, 3, 4, 5])
      expect(R1_CRACKER_IDS).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
      expect(R2_CRACKER_IDS).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13])

      expect(ORIGINAL_CRACKERS).toHaveLength(6)
      expect(R1_CRACKERS).toHaveLength(10)
      expect(CRACKERS).toHaveLength(10)
    })

    it('every definition contains complete required metadata schema', () => {
      for (const def of ALL_CRACKER_DEFINITIONS) {
        expect(def).toMatchObject({
          id: expect.any(Number),
          stableKey: expect.any(String),
          name: expect.any(String),
          descriptor: expect.any(String),
          fullName: expect.any(String),
          category: expect.stringMatching(/^(ground|sky)$/),
          catalogGroup: expect.stringMatching(/^(original|expansion_r1|expansion_r2)$/),
          release: expect.stringMatching(/^(R0|R1|R2)$/),
          artKey: expect.any(String),
          effectKey: expect.any(String),
          duration: expect.any(Number),
          durationMs: expect.any(Number),
          intensityDots: expect.any(Number),
          colors: expect.any(Array),
          palettes: expect.any(Array),
          soundCharacter: expect.any(String),
          audioProfile: expect.any(String),
          motionVariant: expect.any(String),
          budget: expect.objectContaining({
            maxParticles: expect.any(Number),
            maxDrawCalls: expect.any(Number),
          }),
          description: expect.any(String),
          comicWord: expect.any(String),
        })
        expect(def.durationMs).toBeGreaterThan(0)
        expect(def.intensityDots).toBeGreaterThanOrEqual(1)
        expect(def.intensityDots).toBeLessThanOrEqual(4)
      }
    })

    it('correctly categorizes ground vs sky effects', () => {
      const groundItems = getCrackersByCategory('ground')
      const skyItems = getCrackersByCategory('sky')

      // Ground: Phuljhari(0), Anar(1), Chakri(2), Ladi(4), Sutli(5), Waterfall(6), Peacock(9)
      const groundIds = groundItems.map((c) => c.id)
      expect(groundIds).toContain(0)
      expect(groundIds).toContain(1)
      expect(groundIds).toContain(2)
      expect(groundIds).toContain(4)
      expect(groundIds).toContain(5)
      expect(groundIds).toContain(6)
      expect(groundIds).toContain(9)

      // Sky: Rocket(3), Comet Fan(7), Ring Burst(8), Spiral Sky(10), Chrysanthemum(11), Double Blossom(12), Constellation(13)
      const skyIds = skyItems.map((c) => c.id)
      expect(skyIds).toContain(3)
      expect(skyIds).toContain(7)
      expect(skyIds).toContain(8)
      expect(skyIds).toContain(10)
    })
  })

  describe('Registry Lookup and Safe Fallback Behavior', () => {
    it('retrieves definition by stable numeric ID or string key', () => {
      const waterfallById = getCrackerById(6)
      expect(waterfallById).toBeDefined()
      expect(waterfallById.name).toBe('Golden Waterfall')

      const waterfallByKey = getCrackerById('waterfall')
      expect(waterfallByKey).toBeDefined()
      expect(waterfallByKey.id).toBe(6)

      const cometByKey = getCrackerById('comet_fan')
      expect(cometByKey.id).toBe(7)
      expect(cometByKey.name).toBe('Comet Fan')
    })

    it('returns truthful unavailable item for unknown/corrupt IDs without silently substituting Phuljhari', () => {
      const corruptItem = getCracker(9999)
      expect(corruptItem).toBeDefined()
      expect(corruptItem.isUnavailable).toBe(true)
      expect(corruptItem.name).toBe('Unavailable Sparkle')
      // Must not silently return Phuljhari under a false name!
      expect(corruptItem.name).not.toBe('Phuljhari')
      expect(corruptItem.id).toBe(-1)

      const stringCorrupt = getCracker('unknown_sparkle_xyz')
      expect(stringCorrupt.isUnavailable).toBe(true)
    })

    it('validates IDs accurately with isValidCrackerId', () => {
      expect(isValidCrackerId(0)).toBe(true)
      expect(isValidCrackerId(6)).toBe(true)
      expect(isValidCrackerId(9)).toBe(true)
      expect(isValidCrackerId(13)).toBe(true)
      expect(isValidCrackerId(-1)).toBe(false)
      expect(isValidCrackerId(99)).toBe(false)
      expect(isValidCrackerId('phuljhari')).toBe(false)
    })

    it('supports registering an extensible test definition without modifying hardcoded counts', () => {
      const customId = 999
      registerCracker({
        id: customId,
        stableKey: 'test_sparkler',
        name: 'Test Sparkler',
        descriptor: 'Test effect',
        fullName: 'Test Sparkler · Test effect',
        category: 'sky',
        catalogGroup: CATALOG_GROUPS.EXPANSION_R2,
        release: 'R2',
        artKey: 'phuljhari',
        effectKey: 'phuljhari',
        duration: 3.0,
        durationMs: 3000,
        intensityDots: 1,
        colors: [60],
        palettes: ['GOLD'],
        soundCharacter: 'Test sound',
        audioProfile: 'Test',
        motionVariant: 'test',
        budget: { maxParticles: 10, maxDrawCalls: 10 },
        emoji: '🧪',
        iconType: 'sparkler',
        description: 'A test definition for registry extensibility verification.',
        comicWord: 'TEST 🧪',
      })

      expect(isValidCrackerId(customId)).toBe(true)
      const retrieved = getCrackerById(customId)
      expect(retrieved.name).toBe('Test Sparkler')
    })
  })
})
