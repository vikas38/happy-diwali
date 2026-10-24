import { describe, it, expect, beforeEach } from 'vitest'
import {
  createDefaultSave,
  validateSave,
  migrateSave,
  loadSave,
  writeSave,
  hasCompletedOriginalSix,
  getStorageNotice,
  clearStorageNotice,
  SAVE_KEY,
  SAVE_VERSION,
  QUALITY_SETTINGS,
  INTENSITY,
} from '../src/store/save.js'
import {
  ORIGINAL_SIX_IDS,
  R1_CRACKER_IDS,
  R2_CRACKER_IDS,
  CATALOG_GROUPS,
  getCrackersByGroup,
} from '../src/crackers/crackerDefs.js'

function makeMockStorage(initial = {}) {
  let store = { ...initial }
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

describe('DIW-017 — Migrate saves for expanded content and customization', () => {
  let storage

  beforeEach(() => {
    storage = makeMockStorage()
    clearStorageNotice()
  })

  describe('Fresh save behavior', () => {
    it('creates fresh save with version 2 and sensible defaults', () => {
      const fresh = createDefaultSave()
      expect(fresh.version).toBe(SAVE_VERSION)
      expect(fresh.version).toBe(2)
      expect(fresh.unlocked).toEqual([0])
      expect(fresh.stickers).toEqual([])
      expect(fresh.stars).toBe(0)
      expect(fresh.favorites).toEqual([])
      expect(fresh.quality).toBe(QUALITY_SETTINGS.AUTO)
      expect(fresh.hasCompletedFirst).toBe(false)
      expect(fresh.discoveredIds).toEqual([0])
      expect(fresh.showDrafts).toEqual({})
    })

    it('loads fresh defaults when storage is empty', () => {
      const loaded = loadSave(storage)
      expect(loaded.version).toBe(SAVE_VERSION)
      expect(loaded.unlocked).toEqual([0])
      expect(loaded.stickers).toEqual([])
      expect(getStorageNotice()).toBeNull()
    })
  })

  describe('Partial original save migration (v0 and v1)', () => {
    it('migrates legacy v0 save with one completion into v2 and unlocks R1 expansion items', () => {
      const legacyV0 = {
        unlocked: [0, 1],
        stickers: [0],
        stars: 3,
        hasCompletedFirst: true,
      }
      const migrated = migrateSave(legacyV0)
      expect(migrated.version).toBe(2)
      // Player with any earned sticker qualifies for installed expansion items [6, 7, 8, 9]
      expect(migrated.unlocked).toEqual([0, 1, 6, 7, 8, 9])
      // Stickers must NOT be awarded for expansion items during migration
      expect(migrated.stickers).toEqual([0])
      expect(migrated.stars).toBe(3)
      expect(migrated.favorites).toEqual([])
      expect(migrated.quality).toBe(QUALITY_SETTINGS.AUTO)
    })

    it('migrates v1 partial save without completion (only Phuljhari seen, 0 stars) without unlocking expansion', () => {
      const v1BrandNew = {
        version: 1,
        unlocked: [0],
        stickers: [],
        stars: 0,
        hasCompletedFirst: false,
      }
      const migrated = migrateSave(v1BrandNew)
      expect(migrated.version).toBe(2)
      expect(migrated.unlocked).toEqual([0])
      expect(migrated.stickers).toEqual([])
    })
  })

  describe('Completed original save migration & completion badge preservation', () => {
    it('preserves all original 6 stickers and completion badge when migrating to expanded catalog', () => {
      const completedOriginalV1 = {
        version: 1,
        unlocked: [0, 1, 2, 3, 4, 5],
        stickers: [0, 1, 2, 3, 4, 5],
        stars: 18,
        hasCompletedFirst: true,
        masterVolume: 0.9,
      }
      const migrated = migrateSave(completedOriginalV1)
      expect(migrated.version).toBe(2)
      // Unlocked includes original 6 + installed R1 expansion items (6, 7, 8, 9)
      expect(migrated.unlocked).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
      // Stickers remain exactly the 6 earned stickers
      expect(migrated.stickers).toEqual([0, 1, 2, 3, 4, 5])
      // hasCompletedOriginalSix badge helper evaluates to true
      expect(hasCompletedOriginalSix(migrated.stickers)).toBe(true)
      // Progress was not reset
      expect(migrated.stars).toBe(18)
      expect(migrated.masterVolume).toBe(0.9)
    })

    it('hasCompletedOriginalSix is independent of expansion stickers', () => {
      expect(hasCompletedOriginalSix([0, 1, 2, 3, 4, 5])).toBe(true)
      expect(hasCompletedOriginalSix([0, 1, 2, 3, 4, 5, 6, 7])).toBe(true)
      // Missing original item 5
      expect(hasCompletedOriginalSix([0, 1, 2, 3, 4, 6, 7, 8, 9])).toBe(false)
    })
  })

  describe('Idempotence of migration and validation', () => {
    it('running migration multiple times produces identical state without extra awards', () => {
      const initial = {
        version: 1,
        unlocked: [0, 1],
        stickers: [0],
        stars: 3,
      }
      const run1 = migrateSave(initial)
      const val1 = validateSave(run1)
      const run2 = migrateSave(val1)
      const val2 = validateSave(run2)

      expect(val2).toEqual(val1)
      expect(val2.stickers).toEqual([0])
      expect(val2.stars).toBe(3)
      expect(val2.unlocked).toEqual([0, 1, 6, 7, 8, 9])
    })
  })

  describe('Validation & catalog membership (R1: 10 items, R2: 14 items)', () => {
    it('filters out corrupt and out-of-range cracker IDs without crashing', () => {
      const corrupt = {
        unlocked: [-1, 0, 1, 999, 'bad', null],
        stickers: [0, 888, 'fake'],
        favorites: [1, 777],
        seenIntros: [0, 555],
        stars: -10,
      }
      const validated = validateSave(corrupt)
      expect(validated.unlocked).toEqual([0, 1])
      expect(validated.stickers).toEqual([0])
      expect(validated.favorites).toEqual([1])
      expect(validated.seenIntros).toEqual([0])
      expect(validated.stars).toBe(0)
    })

    it('accepts all 10 R1 cracker IDs (0..9) without false locked states', () => {
      const r1Save = {
        unlocked: [...R1_CRACKER_IDS],
        stickers: [...R1_CRACKER_IDS],
        favorites: [0, 6, 7],
      }
      const validated = validateSave(r1Save)
      expect(validated.unlocked).toEqual(R1_CRACKER_IDS)
      expect(validated.stickers).toEqual(R1_CRACKER_IDS)
      expect(validated.favorites).toEqual([0, 6, 7])
    })

    it('accepts future R2 cracker IDs (10..13) without truncation', () => {
      const r2Save = {
        unlocked: [...R2_CRACKER_IDS],
        stickers: [...R2_CRACKER_IDS],
      }
      const validated = validateSave(r2Save)
      expect(validated.unlocked).toEqual(R2_CRACKER_IDS)
      expect(validated.stickers).toEqual(R2_CRACKER_IDS)
    })

    it('preserves valid custom fields (quality, showDrafts, favorites)', () => {
      const custom = {
        quality: QUALITY_SETTINGS.HIGH,
        favorites: [0, 2],
        showDrafts: { draft1: { crackers: [0, 1] } },
      }
      const validated = validateSave(custom)
      expect(validated.quality).toBe(QUALITY_SETTINGS.HIGH)
      expect(validated.favorites).toEqual([0, 2])
      expect(validated.showDrafts).toEqual({ draft1: { crackers: [0, 1] } })
    })

    it('falls back to default quality for unknown quality mode', () => {
      expect(validateSave({ quality: 'ULTRA_4K' }).quality).toBe(QUALITY_SETTINGS.AUTO)
    })
  })

  describe('Storage-blocked fixtures & nonfatal handling', () => {
    it('handles SecurityError on read gracefully with default progress and session notice', () => {
      const blockedStorage = {
        getItem: () => {
          throw new Error('SecurityError: Access denied')
        },
        setItem: () => {
          throw new Error('SecurityError: Access denied')
        },
        removeItem: () => {},
      }

      const loaded = loadSave(blockedStorage)
      expect(loaded).toEqual(createDefaultSave())
      expect(getStorageNotice()).toContain('Saved progress could not be loaded')
    })

    it('handles QuotaExceededError on write gracefully with truthful session notice', () => {
      const fullStorage = {
        getItem: () => null,
        setItem: () => {
          const err = new Error('QuotaExceededError: storage full')
          err.name = 'QuotaExceededError'
          throw err
        },
        removeItem: () => {},
      }

      const res = writeSave(createDefaultSave(), fullStorage)
      expect(res.success).toBe(false)
      expect(getStorageNotice()).toContain('browser storage may be full or disabled')
    })

    it('handles missing storage object gracefully', () => {
      const res = writeSave(createDefaultSave(), null)
      expect(res.success).toBe(false)
      expect(getStorageNotice()).toContain('Storage unavailable')
    })
  })
})
