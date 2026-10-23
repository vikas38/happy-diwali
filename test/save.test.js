import { describe, it, expect, beforeEach } from 'vitest'
import {
  createDefaultSave,
  validateSave,
  loadSave,
  writeSave,
  clearSave,
  SAVE_KEY,
  SAVE_VERSION,
  INTENSITY,
  TOTAL_CRACKERS,
} from '../src/store/save.js'

// A simple in-memory Storage mock for testing
function makeMemoryStorage() {
  let store = {}
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v)
    },
    removeItem: (k) => {
      delete store[k]
    },
    clear: () => {
      store = {}
    },
    get _raw() {
      return store
    },
  }
}

describe('save.js', () => {
  let storage

  beforeEach(() => {
    storage = makeMemoryStorage()
    clearSave(storage)
  })

  describe('createDefaultSave', () => {
    it('returns a save with version 1', () => {
      expect(createDefaultSave().version).toBe(SAVE_VERSION)
    })

    it('unlocks only cracker 0 by default', () => {
      expect(createDefaultSave().unlocked).toEqual([0])
    })

    it('defaults to SOFT intensity', () => {
      expect(createDefaultSave().intensity).toBe(INTENSITY.SOFT)
    })

    it('starts with zero stars and no stickers', () => {
      const s = createDefaultSave()
      expect(s.stars).toBe(0)
      expect(s.stickers).toEqual([])
    })

    it('defaults seenHint to false', () => {
      expect(createDefaultSave().seenHint).toBe(false)
    })
  })

  describe('validateSave', () => {
    it('returns defaults for null/undefined', () => {
      expect(validateSave(null)).toEqual(createDefaultSave())
      expect(validateSave(undefined)).toEqual(createDefaultSave())
    })

    it('returns defaults for non-object input', () => {
      expect(validateSave('hello')).toEqual(createDefaultSave())
      expect(validateSave(42)).toEqual(createDefaultSave())
      expect(validateSave([1, 2, 3])).toEqual(createDefaultSave())
    })

    it('always includes cracker 0 in unlocked even if missing', () => {
      const s = validateSave({ unlocked: [3, 4] })
      expect(s.unlocked).toContain(0)
    })

    it('dedupes and sorts unlocked and stickers', () => {
      const s = validateSave({ unlocked: [3, 1, 1, 0], stickers: [5, 2, 2] })
      expect(s.unlocked).toEqual([0, 1, 3])
      expect(s.stickers).toEqual([2, 5])
    })

    it('filters out-of-range cracker indices', () => {
      const s = validateSave({ unlocked: [0, 99, -1], stickers: [7] })
      expect(s.unlocked).toEqual([0])
      expect(s.stickers).toEqual([])
    })

    it('clamps masterVolume to 0..1', () => {
      expect(validateSave({ masterVolume: 5 }).masterVolume).toBe(1)
      expect(validateSave({ masterVolume: -3 }).masterVolume).toBe(0)
      expect(validateSave({ masterVolume: 0.5 }).masterVolume).toBe(0.5)
    })

    it('falls back to SOFT for invalid intensity', () => {
      expect(validateSave({ intensity: 'EXTREME' }).intensity).toBe(INTENSITY.SOFT)
      expect(validateSave({ intensity: 'LOUD' }).intensity).toBe(INTENSITY.LOUD)
    })

    it('clamps stars to non-negative integers', () => {
      expect(validateSave({ stars: -10 }).stars).toBe(0)
      expect(validateSave({ stars: 3.7 }).stars).toBe(3)
    })

    it('tolerates missing or non-boolean seenHint', () => {
      expect(validateSave({}).seenHint).toBe(false)
      expect(validateSave({ seenHint: true }).seenHint).toBe(true)
      expect(validateSave({ seenHint: 'invalid' }).seenHint).toBe(false)
      expect(validateSave({ seenHint: 1 }).seenHint).toBe(false)
    })
  })

  describe('loadSave / writeSave round-trip', () => {
    it('returns defaults when nothing is saved', () => {
      expect(loadSave(storage)).toEqual(createDefaultSave())
    })

    it('round-trips a full save through write then load', () => {
      const data = {
        unlocked: [0, 1, 2],
        stickers: [0, 1],
        stars: 9,
        masterVolume: 0.85,
        intensity: INTENSITY.NORMAL,
        seenIntros: [0, 1],
        seenHint: true,
      }
      writeSave(data, storage)
      const loaded = loadSave(storage)
      expect(loaded.unlocked).toEqual([0, 1, 2])
      expect(loaded.stickers).toEqual([0, 1])
      expect(loaded.stars).toBe(9)
      expect(loaded.masterVolume).toBe(0.85)
      expect(loaded.intensity).toBe(INTENSITY.NORMAL)
      expect(loaded.seenIntros).toEqual([0, 1])
      expect(loaded.seenHint).toBe(true)
    })

    it('falls back to defaults on corrupt JSON', () => {
      storage.setItem(SAVE_KEY, '{ this is not valid json')
      const loaded = loadSave(storage)
      expect(loaded).toEqual(createDefaultSave())
    })

    it('falls back to defaults on valid-but-wrong-shape JSON', () => {
      storage.setItem(SAVE_KEY, '"just a string"')
      const loaded = loadSave(storage)
      expect(loaded.intensity).toBe(INTENSITY.SOFT)
      expect(loaded.unlocked).toEqual([0])
    })

    it('writeSave cleans data before writing (version upgrade safety)', () => {
      // Simulate an old/future save with extra/missing fields
      writeSave({ unlocked: [2, 3], intensity: 'NORMAL', extraField: 'junk' }, storage)
      const raw = JSON.parse(storage.getItem(SAVE_KEY))
      expect(raw.version).toBe(SAVE_VERSION)
      expect(raw.unlocked).toContain(0) // always includes cracker 0
      expect(raw.extraField).toBeUndefined()
    })
  })

  describe('TOTAL_CRACKERS', () => {
    it('is 6', () => {
      expect(TOTAL_CRACKERS).toBe(6)
    })
  })
})
