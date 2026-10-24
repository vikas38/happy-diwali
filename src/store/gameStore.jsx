import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  createDefaultSave,
  loadSave,
  writeSave,
  validateSave,
  INTENSITY,
  SPARKLE_PALETTES,
  TOTAL_CRACKERS,
  MOTION_POLICY,
  resolveEffectiveMotion,
} from './save.js'

// ===================================================================
// Game Store — React context for the entire app's persistent state
// ===================================================================

export const GameStoreContext = createContext(null)

export function GameStoreProvider({ children }) {
  const [state, setState] = useState(() => loadSave())
  const stateRef = useRef(state)
  stateRef.current = state

  // Write-through to localStorage whenever state changes
  useEffect(() => {
    writeSave(state)
  }, [state])

  // Synchronous store state updater ensuring stateRef.current is immediately
  // updated before any downstream reads, while scheduling React render.
  const updateStore = useCallback((updater) => {
    const current = stateRef.current
    const partial = typeof updater === 'function' ? updater(current) : updater
    const next = validateSave(partial)
    stateRef.current = next
    setState(next)
    return next
  }, [])

  // ---- Actions ----

  const setIntensity = useCallback(
    (intensity) => {
      updateStore((s) => ({ ...s, intensity }))
    },
    [updateStore]
  )

  const setMasterVolume = useCallback(
    (vol) => {
      const clamped = Math.min(1, Math.max(0, Number(vol) || 0))
      updateStore((s) => {
        if (clamped === 0) {
          const nonZero =
            s.lastNonZeroVolume > 0
              ? s.lastNonZeroVolume
              : s.masterVolume > 0
                ? s.masterVolume
                : 0.7
          return { ...s, masterVolume: 0, muted: true, lastNonZeroVolume: nonZero }
        }
        return {
          ...s,
          masterVolume: clamped,
          lastNonZeroVolume: clamped,
          muted: false,
        }
      })
    },
    [updateStore]
  )

  const toggleMute = useCallback(() => {
    let nextVol = 0
    updateStore((s) => {
      const isMuted = s.masterVolume === 0 || s.muted
      if (isMuted) {
        // Restore previous non-zero volume (default 0.7, never 0.35)
        const restoreVol = s.lastNonZeroVolume > 0 ? s.lastNonZeroVolume : 0.7
        nextVol = restoreVol
        return {
          ...s,
          masterVolume: restoreVol,
          muted: false,
          lastNonZeroVolume: restoreVol,
        }
      } else {
        const nonZero =
          s.masterVolume > 0 ? s.masterVolume : s.lastNonZeroVolume > 0 ? s.lastNonZeroVolume : 0.7
        nextVol = 0
        return {
          ...s,
          masterVolume: 0,
          muted: true,
          lastNonZeroVolume: nonZero,
        }
      }
    })
    return nextVol
  }, [updateStore])

  const unlockCracker = useCallback(
    (index) => {
      updateStore((s) => {
        if (s.unlocked.includes(index)) return s
        return { ...s, unlocked: [...s.unlocked, index] }
      })
    },
    [updateStore]
  )

  const unlockAllCrackers = useCallback(() => {
    updateStore((s) => ({
      ...s,
      unlocked: Array.from({ length: TOTAL_CRACKERS }, (_, i) => i),
      stickers: Array.from({ length: TOTAL_CRACKERS }, (_, i) => i),
      hasCompletedFirst: true,
    }))
  }, [updateStore])

  const markIntroSeen = useCallback(
    (index) => {
      updateStore((s) => {
        if (s.seenIntros.includes(index)) return s
        return { ...s, seenIntros: [...s.seenIntros, index] }
      })
    },
    [updateStore]
  )

  const collectSticker = useCallback(
    (index) => {
      updateStore((s) => {
        if (s.stickers.includes(index)) return s
        return {
          ...s,
          stickers: [...s.stickers, index],
          stars: s.stars + 3,
          hasCompletedFirst: true,
        }
      })
    },
    [updateStore]
  )

  // Award stars without collecting a sticker (e.g., replaying a cracker)
  const addStars = useCallback(
    (count) => {
      updateStore((s) => ({
        ...s,
        stars: s.stars + count,
        hasCompletedFirst: true,
      }))
    },
    [updateStore]
  )

  // Atomic show completion: single transaction for stars, sticker, and next unlock.
  // Returns deterministic metadata so UI and persistent storage never disagree.
  const awardShowCompletion = useCallback(
    (crackerIndex) => {
      let result = null
      updateStore((s) => {
        const isNewSticker = !s.stickers.includes(crackerIndex)
        const starsEarned = isNewSticker ? 3 : 1
        const stickers = isNewSticker ? [...s.stickers, crackerIndex] : s.stickers
        const stars = s.stars + starsEarned
        const nextIndex = crackerIndex + 1
        const unlockNext = nextIndex < TOTAL_CRACKERS && !s.unlocked.includes(nextIndex)
        const unlocked = unlockNext ? [...s.unlocked, nextIndex] : s.unlocked

        result = {
          isNewSticker,
          starsEarned,
          nextUnlocked: unlockNext,
          nextIndex: unlockNext ? nextIndex : null,
        }

        return {
          ...s,
          stickers,
          stars,
          unlocked,
          hasCompletedFirst: true,
        }
      })
      return result
    },
    [updateStore]
  )

  const markFirstCompleted = useCallback(() => {
    updateStore((s) => {
      if (s.hasCompletedFirst) return s
      return { ...s, hasCompletedFirst: true }
    })
  }, [updateStore])

  const setCalmVisuals = useCallback(
    (val) => {
      updateStore((s) => {
        const next = typeof val === 'function' ? val(s.calmVisuals) : val
        const policy = next ? MOTION_POLICY.REDUCED : MOTION_POLICY.FULL
        return { ...s, motionPolicy: policy, calmVisuals: Boolean(next) }
      })
    },
    [updateStore]
  )

  const setMotionPolicy = useCallback(
    (policy) => {
      if (!Object.values(MOTION_POLICY).includes(policy)) return
      updateStore((s) => ({
        ...s,
        motionPolicy: policy,
      }))
    },
    [updateStore]
  )

  const setSparklePalette = useCallback(
    (palette) => {
      if (!Object.values(SPARKLE_PALETTES).includes(palette)) return
      updateStore((s) => ({
        ...s,
        selectedPalette: palette,
      }))
    },
    [updateStore]
  )

  const markSplashSeen = useCallback(() => {
    updateStore((s) => {
      if (s.seenSplash) return s
      return { ...s, seenSplash: true }
    })
  }, [updateStore])

  const dismissHint = useCallback(() => {
    updateStore((s) => {
      if (s.seenHint) return s
      return { ...s, seenHint: true }
    })
  }, [updateStore])

  const resetProgress = useCallback(() => {
    const fresh = createDefaultSave()
    stateRef.current = fresh
    setState(fresh)
  }, [])

  // Derived query helpers — always evaluate against stateRef.current
  // so external references (GameController, callbacks) never capture stale progress.
  const getState = useCallback(() => stateRef.current, [])
  const isUnlocked = useCallback((index) => stateRef.current.unlocked.includes(index), [])
  const hasSticker = useCallback((index) => stateRef.current.stickers.includes(index), [])
  const hasSeenIntro = useCallback((index) => stateRef.current.seenIntros.includes(index), [])

  const value = {
    state,
    // derived helpers
    isUnlocked,
    hasSticker,
    hasSeenIntro,
    // actions
    setIntensity,
    setMasterVolume,
    toggleMute,
    setCalmVisuals,
    setMotionPolicy,
    setSparklePalette,
    markSplashSeen,
    unlockCracker,
    unlockAllCrackers,
    markIntroSeen,
    collectSticker,
    addStars,
    awardShowCompletion,
    markFirstCompleted,
    dismissHint,
    resetProgress,
    getState,
  }

  return <GameStoreContext.Provider value={value}>{children}</GameStoreContext.Provider>
}

export function useGameStore() {
  const ctx = useContext(GameStoreContext)
  if (!ctx) throw new Error('useGameStore must be used within a GameStoreProvider')
  return ctx
}

export { INTENSITY, TOTAL_CRACKERS, MOTION_POLICY, SPARKLE_PALETTES, resolveEffectiveMotion }
