// ===================================================================
// Save System — localStorage persistence for Chhotu Champ's Diwali Glow
// Key: chhotu_diwali_save_v1
// ===================================================================

export const SAVE_KEY = 'chhotu_diwali_save_v1'
export const SAVE_VERSION = 1
export const TOTAL_CRACKERS = 6

import {
  detectsReducedMotion,
  MOTION_POLICY,
  resolveEffectiveMotion,
} from '../safety/calmVisuals.js'

export const INTENSITY = {
  SOFT: 'SOFT',
  NORMAL: 'NORMAL',
  LOUD: 'LOUD',
}

export const SPARKLE_PALETTES = {
  GOLD: 'GOLD',
  RAINBOW: 'RAINBOW',
  ROSE: 'ROSE',
  EMERALD: 'EMERALD',
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
    masterVolume: 0.7, // 0..1
    lastNonZeroVolume: 0.7, // remembered volume for unmuting (never hardcoded to 0.35)
    muted: false, // explicit master mute state
    motionPolicy: MOTION_POLICY.SYSTEM, // 'SYSTEM' | 'REDUCED' | 'FULL'
    intensity: INTENSITY.SOFT,
    selectedPalette: SPARKLE_PALETTES.GOLD,
    seenSplash: false,
    seenIntros: [], // cracker indices whose intro card has been shown
    seenHint: false, // first-run courtyard hint
    hasCompletedFirst: false, // completed at least one firework (unlocks skip walk)
    calmVisuals: osReduced, // backward-compatible boolean
  }
}

/**
 * Multi-version migration pipeline keyed on the version field.
 * Migrates older/legacy shapes up to the current SAVE_VERSION,
 * with structured pipelines for v0 -> v1 and readiness for future v2 schema.
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

  // Future migration handler ready for v2
  if (currentVersion === 1 && SAVE_VERSION === 2) {
    state.version = 2
  }

  return state
}

/**
 * Validate and normalise a raw parsed object into a proper save state.
 * Fills missing fields with defaults and clamps values to safe ranges.
 * @param {any} raw - the parsed JSON object (may be malformed/incomplete)
 * @returns {object} a clean, valid save state
 */
export function validateSave(raw) {
  const defaults = createDefaultSave()
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return defaults
  }

  // Explicitly pick only known fields (version-upgrade safety: unknown
  // keys from future/old versions are dropped rather than persisted).
  // Determine muted & volume preferences with backward compatibility
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

  let selectedPalette = defaults.selectedPalette
  if (raw.selectedPalette && Object.values(SPARKLE_PALETTES).includes(raw.selectedPalette)) {
    selectedPalette = raw.selectedPalette
  }

  const seenSplash =
    typeof raw.seenSplash === 'boolean'
      ? raw.seenSplash
      : Boolean(raw.hasCompletedFirst || (Array.isArray(raw.stickers) && raw.stickers.length > 0))

  const result = {
    version: SAVE_VERSION,
    unlocked: Array.isArray(raw.unlocked) ? raw.unlocked : defaults.unlocked,
    stickers: Array.isArray(raw.stickers) ? raw.stickers : defaults.stickers,
    stars: raw.stars,
    masterVolume: finalMasterVol,
    lastNonZeroVolume: lastNonZero,
    muted: isMuted || finalMasterVol === 0,
    motionPolicy,
    intensity: raw.intensity,
    selectedPalette,
    seenSplash,
    seenIntros: Array.isArray(raw.seenIntros) ? raw.seenIntros : defaults.seenIntros,
    seenHint: typeof raw.seenHint === 'boolean' ? raw.seenHint : defaults.seenHint,
    hasCompletedFirst:
      typeof raw.hasCompletedFirst === 'boolean'
        ? raw.hasCompletedFirst
        : Array.isArray(raw.stickers) && raw.stickers.length > 0,
    calmVisuals:
      typeof raw.calmVisuals === 'boolean' && !raw.motionPolicy
        ? raw.calmVisuals
        : effectiveCalmVisuals,
  }

  // unlocked: array of cracker indices 0..5, always include 0
  if (!Array.isArray(result.unlocked)) result.unlocked = []
  result.unlocked = result.unlocked.filter(
    (n) => Number.isInteger(n) && n >= 0 && n < TOTAL_CRACKERS
  )
  if (!result.unlocked.includes(0)) result.unlocked.unshift(0)
  result.unlocked = [...new Set(result.unlocked)].sort((a, b) => a - b)

  // stickers: array of cracker indices
  if (!Array.isArray(result.stickers)) result.stickers = []
  result.stickers = result.stickers.filter(
    (n) => Number.isInteger(n) && n >= 0 && n < TOTAL_CRACKERS
  )
  result.stickers = [...new Set(result.stickers)].sort((a, b) => a - b)

  // stars: non-negative integer
  result.stars = Math.max(0, Math.floor(Number(result.stars) || 0))

  // masterVolume: 0..1
  result.masterVolume = Math.min(1, Math.max(0, Number(result.masterVolume) || 0))
  if (result.masterVolume > 0) {
    result.lastNonZeroVolume = result.masterVolume
    result.muted = false
  } else {
    result.muted = true
  }

  // intensity: must be one of the valid modes
  if (!Object.values(INTENSITY).includes(result.intensity)) {
    result.intensity = INTENSITY.SOFT
  }

  // seenIntros: array of cracker indices
  if (!Array.isArray(result.seenIntros)) result.seenIntros = []
  result.seenIntros = result.seenIntros.filter(
    (n) => Number.isInteger(n) && n >= 0 && n < TOTAL_CRACKERS
  )
  result.seenIntros = [...new Set(result.seenIntros)].sort((a, b) => a - b)

  return result
}

/**
 * Load the save state from localStorage. Returns defaults if missing/corrupt.
 * @param {Storage} [storage] - injectable storage (defaults to localStorage)
 * @returns {object} a valid save state
 */
export function loadSave(storage) {
  try {
    const store = storage || globalThis.localStorage
    if (!store) return createDefaultSave()
    const raw = store.getItem(SAVE_KEY)
    if (!raw) return createDefaultSave()
    const parsed = JSON.parse(raw)
    const migrated = migrateSave(parsed)
    return validateSave(migrated)
  } catch (e) {
    // Corrupt data, storage disabled, or SecurityError — fall back to a fresh save
    // without destroying the bad data (so in-memory play continues uninterrupted).
    return createDefaultSave()
  }
}

/**
 * Persist a save state to localStorage.
 * @param {object} state - the save state to write
 * @param {Storage} [storage] - injectable storage (defaults to localStorage)
 */
export function writeSave(state, storage) {
  try {
    const store = storage || globalThis.localStorage
    if (!store) return
    const clean = validateSave(state)
    store.setItem(SAVE_KEY, JSON.stringify(clean))
  } catch (e) {
    // localStorage may be full or disabled — silently ignore (game still works in-memory)
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
