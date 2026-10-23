import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  createDefaultSave,
  loadSave,
  writeSave,
  validateSave,
  INTENSITY,
  TOTAL_CRACKERS,
} from './save.js'

// ===================================================================
// Game Store — React context for the entire app's persistent state
// ===================================================================

const GameStoreContext = createContext(null)

export function GameStoreProvider({ children }) {
  const [state, setState] = useState(() => loadSave())
  const stateRef = useRef(state)
  stateRef.current = state

  // Write-through to localStorage whenever state changes
  useEffect(() => {
    writeSave(state)
  }, [state])

  // ---- Actions ----

  const setIntensity = useCallback((intensity) => {
    setState((s) => validateSave({ ...s, intensity }))
  }, [])

  const setMasterVolume = useCallback((vol) => {
    setState((s) => validateSave({ ...s, masterVolume: vol }))
  }, [])

  const unlockCracker = useCallback((index) => {
    setState((s) => {
      if (s.unlocked.includes(index)) return s
      return validateSave({ ...s, unlocked: [...s.unlocked, index] })
    })
  }, [])

  const unlockAllCrackers = useCallback(() => {
    setState((s) =>
      validateSave({ ...s, unlocked: Array.from({ length: TOTAL_CRACKERS }, (_, i) => i) }),
    )
  }, [])

  const markIntroSeen = useCallback((index) => {
    setState((s) => {
      if (s.seenIntros.includes(index)) return s
      return validateSave({ ...s, seenIntros: [...s.seenIntros, index] })
    })
  }, [])

  const collectSticker = useCallback((index) => {
    setState((s) => {
      const stickers = s.stickers.includes(index) ? s.stickers : [...s.stickers, index]
      return validateSave({
        ...s,
        stickers,
        stars: s.stars + 3,
        hasCompletedFirst: true,
      })
    })
  }, [])

  // Award stars without collecting a sticker (e.g., replaying a cracker)
  const addStars = useCallback((count) => {
    setState((s) => validateSave({ ...s, stars: s.stars + count, hasCompletedFirst: true }))
  }, [])

  const markFirstCompleted = useCallback(() => {
    setState((s) => {
      if (s.hasCompletedFirst) return s
      return validateSave({ ...s, hasCompletedFirst: true })
    })
  }, [])

  const dismissHint = useCallback(() => {
    setState((s) => {
      if (s.seenHint) return s
      return validateSave({ ...s, seenHint: true })
    })
  }, [])

  const resetProgress = useCallback(() => {
    const fresh = createDefaultSave()
    setState(fresh)
  }, [])

  const isUnlocked = useCallback(
    (index) => state.unlocked.includes(index),
    [state.unlocked],
  )

  const hasSticker = useCallback(
    (index) => state.stickers.includes(index),
    [state.stickers],
  )

  const hasSeenIntro = useCallback(
    (index) => state.seenIntros.includes(index),
    [state.seenIntros],
  )

  const value = {
    state,
    // derived helpers
    isUnlocked,
    hasSticker,
    hasSeenIntro,
    // actions
    setIntensity,
    setMasterVolume,
    unlockCracker,
    unlockAllCrackers,
    markIntroSeen,
    collectSticker,
    addStars,
    markFirstCompleted,
    dismissHint,
    resetProgress,
    getState: () => stateRef.current,
  }

  return <GameStoreContext.Provider value={value}>{children}</GameStoreContext.Provider>
}

export function useGameStore() {
  const ctx = useContext(GameStoreContext)
  if (!ctx) throw new Error('useGameStore must be used within a GameStoreProvider')
  return ctx
}

export { INTENSITY, TOTAL_CRACKERS }
