// ===================================================================
// Save System — localStorage persistence for Chhotu Champ's Diwali Glow
// Key: chhotu_diwali_save_v1 (preserves existing storage key across versions)
// DIW-017: Schema v2 with favorites, quality, show drafts, valid-ID
// membership, nonfatal storage notices, and expansion unlock rules.
// ===================================================================

import {
  detectsReducedMotion,
  MOTION_POLICY,
  resolveEffectiveMotion,
} from '../safety/calmVisuals.js'

import {
  isValidCrackerId,
  ORIGINAL_SIX_IDS,
  R1_CRACKER_IDS,
  TOTAL_CRACKERS as ACTIVE_CATALOG_COUNT,
} from '../crackers/crackerDefs.js'

export const SAVE_KEY = 'chhotu_diwali_save_v1'
export const SAVE_VERSION = 2
// Retained for backward compatibility with legacy 6-item references
export const TOTAL_CRACKERS = 6

export const INTENSITY = {
  SOFT: 'SOFT',
  NORMAL: 'NORMAL',
  LOUD: 'LOUD',
}

export const QUALITY_SETTINGS = {
  AUTO: 'AUTO',
  LOW: 'LOW',
  HIGH: 'HIGH',
}

export const SPARKLE_PALETTES = {
  GOLD: 'GOLD',
  RAINBOW: 'RAINBOW',
  ROSE: 'ROSE',
  EMERALD: 'EMERALD',
}

export const DIYA_ARRANGEMENTS = {
  ROW: 'ROW',
  CIRCLE: 'CIRCLE',
  ARCH: 'ARCH',
}

export const RANGOLI_PATTERNS = {
  LOTUS: 'LOTUS',
  STAR: 'STAR',
  CHAKRA: 'CHAKRA',
}

export const DEFAULT_RANGOLI_COLORS = {
  outer: '#dd796d', // rose
  middle: '#dc922e', // marigold
  center: '#58a7a5', // ocean
}

// Session-only persistence notification for truthful nonfatal reporting
let currentStorageNotice = null

export function getStorageNotice() {
  return currentStorageNotice
}

export function clearStorageNotice() {
  currentStorageNotice = null
}

/**
 * Returns true if the given stickers array contains all original six IDs (0..5).
 * Ensures an earned original-six completion badge is never revoked when catalog expands.
 */
export function hasCompletedOriginalSix(stickers) {
  if (!Array.isArray(stickers)) return false
  return ORIGINAL_SIX_IDS.every((id) => stickers.includes(id))
}

/**
 * The default save state for a brand-new player.
 * Only the first cracker (Phuljhari) is unlocked; intensity defaults to SOFT.
 */
export function createDefaultSave() {
  const osReduced = detectsReducedMotion()
  return {
    version: SAVE_VERSION,
    unlocked: [0], // cracker index 0 (Phuljhari) unlocked
    stickers: [], // indices of collected stickers
    stars: 0, // total stars earned
    favorites: [], // cracker IDs marked as favorites
    quality: QUALITY_SETTINGS.AUTO, // 'AUTO' | 'LOW' | 'HIGH'
    masterVolume: 0.7, // 0..1
    lastNonZeroVolume: 0.7, // remembered volume for unmuting
    muted: false, // explicit master mute state
    motionPolicy: MOTION_POLICY.SYSTEM, // 'SYSTEM' | 'REDUCED' | 'FULL'
    intensity: INTENSITY.SOFT,
    selectedPalette: SPARKLE_PALETTES.GOLD,
    seenSplash: false,
    seenIntros: [], // cracker indices whose intro card has been shown
    seenHint: false, // first-run courtyard hint
    dismissedHints: [], // ['choose', 'grownup', 'controls']
    hasCompletedFirst: false, // completed at least one firework
    calmVisuals: osReduced, // backward-compatible boolean
    discoveredIds: [0],
    showDrafts: {},
    diyas: {
      lit: [],
      arrangement: DIYA_ARRANGEMENTS.ROW,
    },
    rangoli: {
      pattern: RANGOLI_PATTERNS.LOTUS,
      colors: { ...DEFAULT_RANGOLI_COLORS },
    },
  }
}

/**
 * Multi-version migration pipeline keyed on the version field.
 * Migrates older/legacy shapes up to the current SAVE_VERSION (v2).
 * Idempotent: running repeatedly produces the same clean state without granting free rewards.
 * @param {any} raw
 * @returns {object} migrated state
 */
export function migrateSave(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return createDefaultSave()
  }

  let state = { ...raw }
  const currentVersion = Number(state.version) || 0

  // Migration step: v0 (legacy unversioned) -> v1
  if (currentVersion < 1) {
    state.version = 1
    if (!Array.isArray(state.unlocked)) state.unlocked = [0]
    if (!Array.isArray(state.stickers)) state.stickers = []
    if (!Array.isArray(state.seenIntros)) state.seenIntros = []
  }

  // Migration step: v1 -> v2 (expanded catalog & customization)
  if (currentVersion < 2) {
    state.version = 2
    if (!Array.isArray(state.favorites)) state.favorites = []
    if (!state.quality || !Object.values(QUALITY_SETTINGS).includes(state.quality)) {
      state.quality = QUALITY_SETTINGS.AUTO
    }
    if (!state.showDrafts || typeof state.showDrafts !== 'object' || Array.isArray(state.showDrafts)) {
      state.showDrafts = {}
    }
    if (!Array.isArray(state.discoveredIds)) {
      state.discoveredIds = Array.isArray(state.unlocked) ? [...state.unlocked] : [0]
    }

    // DIW-017 rule: After the first original completion, make installed expansion items selectable;
    // old saves with any earned sticker qualify immediately. Original progression remains intact.
    const hasCompletedAny = Boolean(
      state.hasCompletedFirst || (Array.isArray(state.stickers) && state.stickers.length > 0)
    )
    if (hasCompletedAny) {
      const existingUnlocked = Array.isArray(state.unlocked) ? state.unlocked : [0]
      // Add installed expansion items [6, 7, 8, 9] to unlocked, without granting stickers
      state.unlocked = [...new Set([...existingUnlocked, 6, 7, 8, 9])]
      state.hasCompletedFirst = true
    }
  }

  return state
}

/**
 * Validate and normalise a raw parsed object into a proper save state.
 * Fills missing fields with defaults, validates IDs via registry, and clamps safe ranges.
 * @param {any} raw - the parsed JSON object (may be malformed/incomplete)
 * @returns {object} a clean, valid save state
 */
export function validateSave(raw) {
  const defaults = createDefaultSave()
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return defaults
  }

  // Determine volume preferences
  const rawVolProvided = typeof raw.masterVolume !== 'undefined' && raw.masterVolume !== null
  const parsedVol = rawVolProvided
    ? Math.min(1, Math.max(0, Number(raw.masterVolume) || 0))
    : defaults.masterVolume

  let lastNonZero = defaults.lastNonZeroVolume
  if (
    typeof raw.lastNonZeroVolume === 'number' &&
    raw.lastNonZeroVolume > 0 &&
    raw.lastNonZeroVolume <= 1
  ) {
    lastNonZero = raw.lastNonZeroVolume
  } else if (parsedVol > 0) {
    lastNonZero = parsedVol
  }

  const isMuted = typeof raw.muted === 'boolean' ? raw.muted : rawVolProvided && parsedVol === 0
  const finalMasterVol = isMuted ? 0 : parsedVol

  let motionPolicy = defaults.motionPolicy
  if (raw.motionPolicy && Object.values(MOTION_POLICY).includes(raw.motionPolicy)) {
    motionPolicy = raw.motionPolicy
  } else if (typeof raw.calmVisuals === 'boolean') {
    motionPolicy = raw.calmVisuals ? MOTION_POLICY.REDUCED : MOTION_POLICY.FULL
  }
  const effectiveCalmVisuals = resolveEffectiveMotion(motionPolicy, detectsReducedMotion())

  let quality = defaults.quality
  if (raw.quality && Object.values(QUALITY_SETTINGS).includes(raw.quality)) {
    quality = raw.quality
  }

  let selectedPalette = defaults.selectedPalette
  if (raw.selectedPalette && Object.values(SPARKLE_PALETTES).includes(raw.selectedPalette)) {
    selectedPalette = raw.selectedPalette
  }

  const seenSplash =
    typeof raw.seenSplash === 'boolean'
      ? raw.seenSplash
      : Boolean(raw.hasCompletedFirst || (Array.isArray(raw.stickers) && raw.stickers.length > 0))

  // Validate diyas
  const diyasRaw = raw.diyas && typeof raw.diyas === 'object' ? raw.diyas : {}
  const rawLit = Array.isArray(diyasRaw.lit) ? diyasRaw.lit : []
  const validLit = [...new Set(rawLit.filter((n) => Number.isInteger(n) && n >= 0 && n < 5))].sort(
    (a, b) => a - b
  )
  const arrangement = Object.values(DIYA_ARRANGEMENTS).includes(diyasRaw.arrangement)
    ? diyasRaw.arrangement
    : DIYA_ARRANGEMENTS.ROW

  // Validate rangoli
  const rangoliRaw = raw.rangoli && typeof raw.rangoli === 'object' ? raw.rangoli : {}
  const pattern = Object.values(RANGOLI_PATTERNS).includes(rangoliRaw.pattern)
    ? rangoliRaw.pattern
    : RANGOLI_PATTERNS.LOTUS
  const hexPattern = /^#[0-9a-fA-F]{6}$/
  const colorsRaw =
    rangoliRaw.colors && typeof rangoliRaw.colors === 'object' ? rangoliRaw.colors : {}
  const colors = {
    outer: hexPattern.test(colorsRaw.outer) ? colorsRaw.outer : DEFAULT_RANGOLI_COLORS.outer,
    middle: hexPattern.test(colorsRaw.middle) ? colorsRaw.middle : DEFAULT_RANGOLI_COLORS.middle,
    center: hexPattern.test(colorsRaw.center) ? colorsRaw.center : DEFAULT_RANGOLI_COLORS.center,
  }

  const hasCompletedFirst =
    typeof raw.hasCompletedFirst === 'boolean'
      ? raw.hasCompletedFirst
      : Boolean(Array.isArray(raw.stickers) && raw.stickers.length > 0)

  // Validate cracker ID arrays using explicit registry membership
  let rawUnlocked = Array.isArray(raw.unlocked) ? raw.unlocked : defaults.unlocked
  let validUnlocked = rawUnlocked.filter((n) => Number.isInteger(n) && isValidCrackerId(n))
  if (!validUnlocked.includes(0)) validUnlocked.unshift(0)
  validUnlocked = [...new Set(validUnlocked)].sort((a, b) => a - b)

  // stickers: array of valid cracker IDs
  const rawStickers = Array.isArray(raw.stickers) ? raw.stickers : defaults.stickers
  const validStickers = [
    ...new Set(rawStickers.filter((n) => Number.isInteger(n) && isValidCrackerId(n))),
  ].sort((a, b) => a - b)

  // favorites: array of valid cracker IDs
  const rawFavorites = Array.isArray(raw.favorites) ? raw.favorites : defaults.favorites
  const validFavorites = [
    ...new Set(rawFavorites.filter((n) => Number.isInteger(n) && isValidCrackerId(n))),
  ].sort((a, b) => a - b)

  // seenIntros: array of valid cracker IDs
  const rawSeenIntros = Array.isArray(raw.seenIntros) ? raw.seenIntros : defaults.seenIntros
  const validSeenIntros = [
    ...new Set(rawSeenIntros.filter((n) => Number.isInteger(n) && isValidCrackerId(n))),
  ].sort((a, b) => a - b)

  // discoveredIds: array of valid cracker IDs
  const rawDiscovered = Array.isArray(raw.discoveredIds) ? raw.discoveredIds : validUnlocked
  const validDiscovered = [
    ...new Set(rawDiscovered.filter((n) => Number.isInteger(n) && isValidCrackerId(n))),
  ].sort((a, b) => a - b)

  // showDrafts: object map
  const showDrafts =
    raw.showDrafts && typeof raw.showDrafts === 'object' && !Array.isArray(raw.showDrafts)
      ? raw.showDrafts
      : defaults.showDrafts

  // stars: non-negative integer
  const stars = Math.max(0, Math.floor(Number(raw.stars) || 0))

  // masterVolume: 0..1
  const masterVolume = Math.min(1, Math.max(0, Number(finalMasterVol) || 0))

  // intensity: must be one of the valid modes
  const intensity = Object.values(INTENSITY).includes(raw.intensity)
    ? raw.intensity
    : defaults.intensity

  const rawDismissed = Array.isArray(raw.dismissedHints) ? raw.dismissedHints : null
  const seenHintBool = typeof raw.seenHint === 'boolean' ? raw.seenHint : defaults.seenHint
  const validDismissed = rawDismissed
    ? [...new Set(rawDismissed.filter((h) => typeof h === 'string'))]
    : seenHintBool
      ? ['choose', 'grownup', 'controls']
      : []

  return {
    version: SAVE_VERSION,
    unlocked: validUnlocked,
    stickers: validStickers,
    stars,
    favorites: validFavorites,
    quality,
    masterVolume,
    lastNonZeroVolume: lastNonZero,
    muted: isMuted || masterVolume === 0,
    motionPolicy,
    intensity,
    selectedPalette,
    seenSplash,
    seenIntros: validSeenIntros,
    seenHint: seenHintBool,
    dismissedHints: validDismissed,
    hasCompletedFirst,
    calmVisuals:
      typeof raw.calmVisuals === 'boolean' && !raw.motionPolicy
        ? raw.calmVisuals
        : effectiveCalmVisuals,
    discoveredIds: validDiscovered,
    showDrafts,
    diyas: {
      lit: validLit,
      arrangement,
    },
    rangoli: {
      pattern,
      colors,
    },
  }
}

/**
 * Load the save state from localStorage. Returns defaults if missing/corrupt.
 * Exposes truthful session notice on failure without throwing.
 * @param {Storage} [storage] - injectable storage (defaults to localStorage)
 * @returns {object} a valid save state
 */
export function loadSave(storage) {
  try {
    const store = typeof storage !== 'undefined' ? storage : globalThis.localStorage
    if (!store) {
      currentStorageNotice = 'Storage unavailable: using default progress for this session.'
      return createDefaultSave()
    }
    const raw = store.getItem(SAVE_KEY)
    if (!raw) return createDefaultSave()
    const parsed = JSON.parse(raw)
    const migrated = migrateSave(parsed)
    return validateSave(migrated)
  } catch (e) {
    // Corrupt data, storage disabled, or SecurityError
    currentStorageNotice = 'Saved progress could not be loaded: using default session progress.'
    return createDefaultSave()
  }
}

/**
 * Persist a save state to localStorage.
 * Nonfatal: sets a session notice if storage is full or disabled.
 * @param {object} state - the save state to write
 * @param {Storage} [storage] - injectable storage (defaults to localStorage)
 * @returns {{ success: boolean, reason?: string, error?: any }}
 */
export function writeSave(state, storage) {
  try {
    const store = typeof storage !== 'undefined' ? storage : globalThis.localStorage
    if (!store) {
      currentStorageNotice = 'Storage unavailable: changes are session-only.'
      return { success: false, reason: 'no_storage' }
    }
    const clean = validateSave(state)
    store.setItem(SAVE_KEY, JSON.stringify(clean))
    currentStorageNotice = null
    return { success: true }
  } catch (e) {
    currentStorageNotice = 'Unable to save progress: browser storage may be full or disabled.'
    return { success: false, error: e }
  }
}

/**
 * Clear the save (for a parent "reset progress" option if needed).
 * @param {Storage} [storage]
 */
export function clearSave(storage) {
  try {
    const store = storage || globalThis.localStorage
    if (!store) return
    store.removeItem(SAVE_KEY)
  } catch (e) {
    // ignore
  }
}

export { MOTION_POLICY, resolveEffectiveMotion }
