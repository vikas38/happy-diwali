// ===================================================================
// Save System — localStorage persistence for Chhotu Champ's Diwali Glow
// Key: chhotu_diwali_save_v1
// ===================================================================

export const SAVE_KEY = 'chhotu_diwali_save_v1'
export const SAVE_VERSION = 1
export const TOTAL_CRACKERS = 6

import { detectsReducedMotion } from '../safety/calmVisuals.js'

export const INTENSITY = {
  SOFT: 'SOFT',
  NORMAL: 'NORMAL',
  LOUD: 'LOUD',
}

/**
 * The default save state for a brand-new player.
 * Only the first cracker (Phuljhari) is unlocked; intensity defaults to SOFT.
 */
export function createDefaultSave() {
  return {
    version: SAVE_VERSION,
    unlocked: [0], // cracker index 0 (Phuljhari) unlocked
    stickers: [], // indices of collected stickers
    stars: 0, // total stars earned
    masterVolume: 0.7, // 0..1
    intensity: INTENSITY.SOFT,
    seenIntros: [], // cracker indices whose intro card has been shown
    seenHint: false, // first-run courtyard hint
    hasCompletedFirst: false, // completed at least one firework (unlocks skip walk)
    calmVisuals: detectsReducedMotion(), // calm visual effects & reduced flashing
  }
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
  const result = {
    version: SAVE_VERSION,
    unlocked: Array.isArray(raw.unlocked) ? raw.unlocked : defaults.unlocked,
    stickers: Array.isArray(raw.stickers) ? raw.stickers : defaults.stickers,
    stars: raw.stars,
    masterVolume: raw.masterVolume,
    intensity: raw.intensity,
    seenIntros: Array.isArray(raw.seenIntros) ? raw.seenIntros : defaults.seenIntros,
    seenHint: typeof raw.seenHint === 'boolean' ? raw.seenHint : defaults.seenHint,
    hasCompletedFirst:
      typeof raw.hasCompletedFirst === 'boolean'
        ? raw.hasCompletedFirst
        : Array.isArray(raw.stickers) && raw.stickers.length > 0,
    calmVisuals: typeof raw.calmVisuals === 'boolean' ? raw.calmVisuals : defaults.calmVisuals,
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
    return validateSave(parsed)
  } catch (e) {
    // Corrupt data — fall back to a fresh save without destroying the bad data
    // (so a parent doesn't lose progress due to a transient parse error).
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
