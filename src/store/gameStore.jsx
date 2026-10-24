import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  createDefaultSave,
  loadSave,
  writeSave,
  validateSave,
  INTENSITY,
  QUALITY_SETTINGS,
  SPARKLE_PALETTES,
  DIYA_ARRANGEMENTS,
  RANGOLI_PATTERNS,
  DEFAULT_RANGOLI_COLORS,
  TOTAL_CRACKERS,
  MOTION_POLICY,
  resolveEffectiveMotion,
  hasCompletedOriginalSix,
  getStorageNotice,
  clearStorageNotice,
} from './save.js'
import {
  isValidCrackerId,
  ORIGINAL_SIX_IDS,
  R1_CRACKER_IDS,
} from '../crackers/crackerDefs.js'

// ===================================================================
// Game Store — React context for the entire app's persistent state
// ===================================================================

export const GameStoreContext = createContext(null)

export function GameStoreProvider({ children }) {
  const [state, setState] = useState(() => loadSave())
  const [storageNotice, setStorageNotice] = useState(() => getStorageNotice())
  const stateRef = useRef(state)
  stateRef.current = state

  // Write-through to localStorage whenever state changes
  useEffect(() => {
    const res = writeSave(state)
    if (res && res.success === false) {
      setStorageNotice(getStorageNotice())
    } else {
      setStorageNotice((prev) => (prev ? null : prev))
    }
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

  const setQuality = useCallback(
    (quality) => {
      if (!Object.values(QUALITY_SETTINGS).includes(quality)) return
      updateStore((s) => ({ ...s, quality }))
    },
    [updateStore]
  )

  const toggleFavorite = useCallback(
    (crackerId) => {
      if (!isValidCrackerId(crackerId)) return
      updateStore((s) => {
        const favs = s.favorites || []
        const next = favs.includes(crackerId)
          ? favs.filter((id) => id !== crackerId)
          : [...favs, crackerId]
        return {
          ...s,
          favorites: [...new Set(next)].sort((a, b) => a - b),
        }
      })
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
      unlocked: [...R1_CRACKER_IDS],
      stickers: [...R1_CRACKER_IDS],
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

        let unlocked = [...s.unlocked]
        let nextIndex = null
        let unlockNext = false

        // Original-six sequential unlock
        if (ORIGINAL_SIX_IDS.includes(crackerIndex)) {
          const candNext = crackerIndex + 1
          if (ORIGINAL_SIX_IDS.includes(candNext) && !unlocked.includes(candNext)) {
            nextIndex = candNext
            unlockNext = true
            unlocked.push(candNext)
          }
        }

        // Completing any cracker makes installed expansion items (6..9) unlocked/selectable
        for (const expId of [6, 7, 8, 9]) {
          if (!unlocked.includes(expId)) {
            unlocked.push(expId)
          }
        }
        unlocked = [...new Set(unlocked)].sort((a, b) => a - b)

        result = {
          isNewSticker,
          starsEarned,
          nextUnlocked: unlockNext,
          nextIndex: unlockNext ? nextIndex : null,
        }

        // DIW-032: Gentle goal tracking — Courtyard & Sky Explorer
        const groundIds = [0, 1, 2, 4, 5, 6, 9]
        const skyIds = [3, 7, 8, 10, 11, 12, 13]
        const hasGround = stickers.some((id) => groundIds.includes(id))
        const hasSky = stickers.some((id) => skyIds.includes(id))
        const groundAndSkyGoal = hasGround && hasSky

        const gentleGoals = {
          ...(s.gentleGoals || {}),
          groundAndSky: Boolean(s.gentleGoals?.groundAndSky || groundAndSkyGoal),
        }

        return {
          ...s,
          stickers,
          stars,
          unlocked,
          gentleGoals,
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

  const setCrackerPalette = useCallback(
    (crackerId, palette) => {
      if (!isValidCrackerId(crackerId)) return
      if (!Object.values(SPARKLE_PALETTES).includes(palette)) return
      updateStore((s) => {
        const nextPalettes = {
          ...(s.selectedPalettes || {}),
          [crackerId]: palette,
        }
        const uniquePals = new Set(Object.values(nextPalettes))
        const twoPalettesGoal = uniquePals.size >= 2 || Boolean(s.gentleGoals?.twoPalettes)

        return {
          ...s,
          selectedPalette: palette,
          selectedPalettes: nextPalettes,
          gentleGoals: {
            ...(s.gentleGoals || {}),
            twoPalettes: twoPalettesGoal,
          },
        }
      })
    },
    [updateStore]
  )

  const setLaunchPlacement = useCallback(
    (placement) => {
      if (!['left', 'center', 'right'].includes(placement)) return
      updateStore((s) => ({
        ...s,
        launchPlacement: placement,
      }))
    },
    [updateStore]
  )

  const addSequenceSlot = useCallback(
    (crackerId, palette = 'GOLD', placement = 'center') => {
      if (!isValidCrackerId(crackerId)) return
      updateStore((s) => {
        const currentDraft = Array.isArray(s.sequenceDraft) ? s.sequenceDraft : []
        if (currentDraft.length >= 3) return s
        return {
          ...s,
          sequenceDraft: [...currentDraft, { crackerId, palette, placement }],
        }
      })
    },
    [updateStore]
  )

  const updateSequenceSlot = useCallback(
    (index, slotData) => {
      updateStore((s) => {
        const currentDraft = Array.isArray(s.sequenceDraft) ? [...s.sequenceDraft] : []
        if (index < 0 || index >= currentDraft.length) return s
        currentDraft[index] = { ...currentDraft[index], ...slotData }
        return { ...s, sequenceDraft: currentDraft }
      })
    },
    [updateStore]
  )

  const removeSequenceSlot = useCallback(
    (index) => {
      updateStore((s) => {
        const currentDraft = Array.isArray(s.sequenceDraft) ? s.sequenceDraft : []
        return {
          ...s,
          sequenceDraft: currentDraft.filter((_, idx) => idx !== index),
        }
      })
    },
    [updateStore]
  )

  const moveSequenceSlot = useCallback(
    (fromIndex, toIndex) => {
      updateStore((s) => {
        const currentDraft = Array.isArray(s.sequenceDraft) ? [...s.sequenceDraft] : []
        if (
          fromIndex < 0 ||
          fromIndex >= currentDraft.length ||
          toIndex < 0 ||
          toIndex >= currentDraft.length
        ) {
          return s
        }
        const [moved] = currentDraft.splice(fromIndex, 1)
        currentDraft.splice(toIndex, 0, moved)
        return { ...s, sequenceDraft: currentDraft }
      })
    },
    [updateStore]
  )

  const clearSequenceDraft = useCallback(() => {
    updateStore((s) => ({ ...s, sequenceDraft: [] }))
  }, [updateStore])

  const setCourtyardDecoration = useCallback(
    (type, value) => {
      updateStore((s) => ({
        ...s,
        courtyardDecorations: {
          ...(s.courtyardDecorations || {}),
          [type]: value,
        },
        gentleGoals: {
          ...(s.gentleGoals || {}),
          decoratedCourtyard: true,
        },
      }))
    },
    [updateStore]
  )

  const resetCourtyardDecorations = useCallback(() => {
    updateStore((s) => ({
      ...s,
      courtyardDecorations: {
        rangoliMotif: 'lotus',
        toranStyle: 'marigold',
        diyaStyle: 'arch',
      },
    }))
  }, [updateStore])

  const completeGentleGoal = useCallback(
    (goalKey) => {
      updateStore((s) => ({
        ...s,
        gentleGoals: {
          ...(s.gentleGoals || {}),
          [goalKey]: true,
        },
      }))
    },
    [updateStore]
  )

  const setMusicEnabled = useCallback(
    (enabled) => {
      updateStore((s) => ({
        ...s,
        musicEnabled: Boolean(enabled),
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

  // ---- Creative Activities (Diyas & Rangoli) ----

  const setDiyaLit = useCallback(
    (index) => {
      updateStore((s) => {
        const currentLit = s.diyas?.lit || []
        const nextLit = currentLit.includes(index)
          ? currentLit.filter((i) => i !== index)
          : [...currentLit, index]
        return {
          ...s,
          diyas: {
            ...s.diyas,
            lit: nextLit,
          },
        }
      })
    },
    [updateStore]
  )

  const setDiyaArrangement = useCallback(
    (arrangement) => {
      if (!Object.values(DIYA_ARRANGEMENTS).includes(arrangement)) return
      updateStore((s) => ({
        ...s,
        diyas: {
          ...s.diyas,
          arrangement,
        },
      }))
    },
    [updateStore]
  )

  const resetDiyas = useCallback(() => {
    updateStore((s) => ({
      ...s,
      diyas: {
        ...s.diyas,
        lit: [],
      },
    }))
  }, [updateStore])

  const setRangoliPattern = useCallback(
    (pattern) => {
      if (!Object.values(RANGOLI_PATTERNS).includes(pattern)) return
      updateStore((s) => ({
        ...s,
        rangoli: {
          ...s.rangoli,
          pattern,
        },
      }))
    },
    [updateStore]
  )

  const setRangoliRegionColor = useCallback(
    (region, color) => {
      updateStore((s) => ({
        ...s,
        rangoli: {
          ...s.rangoli,
          colors: {
            ...s.rangoli?.colors,
            [region]: color,
          },
        },
      }))
    },
    [updateStore]
  )

  const setRangoliColors = useCallback(
    (colors) => {
      updateStore((s) => ({
        ...s,
        rangoli: {
          ...s.rangoli,
          colors: { ...colors },
        },
      }))
    },
    [updateStore]
  )

  const resetRangoli = useCallback(() => {
    updateStore((s) => ({
      ...s,
      rangoli: {
        pattern: s.rangoli?.pattern || RANGOLI_PATTERNS.LOTUS,
        colors: { ...DEFAULT_RANGOLI_COLORS },
      },
    }))
  }, [updateStore])

  const dismissHint = useCallback(
    (hintId) => {
      updateStore((s) => {
        const current = Array.isArray(s.dismissedHints)
          ? s.dismissedHints
          : s.seenHint
            ? ['choose', 'grownup', 'controls']
            : []
        const updated = hintId
          ? [...new Set([...current, hintId])]
          : ['choose', 'grownup', 'controls']
        return {
          ...s,
          seenHint: updated.length >= 3 || !hintId,
          dismissedHints: updated,
        }
      })
    },
    [updateStore]
  )

  const replayHints = useCallback(() => {
    updateStore((s) => ({
      ...s,
      seenHint: false,
      dismissedHints: [],
    }))
  }, [updateStore])

  const resetProgress = useCallback(() => {
    const fresh = createDefaultSave()
    stateRef.current = fresh
    setState(fresh)
  }, [])

  const dismissStorageNotice = useCallback(() => {
    clearStorageNotice()
    setStorageNotice(null)
  }, [])

  // Derived query helpers — always evaluate against stateRef.current
  // so external references (GameController, callbacks) never capture stale progress.
  const getState = useCallback(() => stateRef.current, [])
  const isUnlocked = useCallback((index) => stateRef.current.unlocked.includes(index), [])
  const hasSticker = useCallback((index) => stateRef.current.stickers.includes(index), [])
  const hasSeenIntro = useCallback((index) => stateRef.current.seenIntros.includes(index), [])
  const isFavorite = useCallback(
    (index) => Boolean((stateRef.current.favorites || []).includes(index)),
    []
  )
  const isOriginalSixComplete = useCallback(
    () => hasCompletedOriginalSix(stateRef.current.stickers),
    []
  )

  const value = {
    state,
    storageNotice,
    // derived helpers
    isUnlocked,
    hasSticker,
    hasSeenIntro,
    isFavorite,
    isOriginalSixComplete,
    // actions
    setIntensity,
    setQuality,
    toggleFavorite,
    setMasterVolume,
    toggleMute,
    setCalmVisuals,
    setMotionPolicy,
    setSparklePalette,
    setCrackerPalette,
    setLaunchPlacement,
    addSequenceSlot,
    updateSequenceSlot,
    removeSequenceSlot,
    moveSequenceSlot,
    clearSequenceDraft,
    setCourtyardDecoration,
    resetCourtyardDecorations,
    completeGentleGoal,
    setMusicEnabled,
    markSplashSeen,
    setDiyaLit,
    setDiyaArrangement,
    resetDiyas,
    setRangoliPattern,
    setRangoliRegionColor,
    setRangoliColors,
    resetRangoli,
    unlockCracker,
    unlockAllCrackers,
    markIntroSeen,
    collectSticker,
    addStars,
    awardShowCompletion,
    markFirstCompleted,
    dismissHint,
    replayHints,
    dismissStorageNotice,
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

export {
  INTENSITY,
  QUALITY_SETTINGS,
  TOTAL_CRACKERS,
  MOTION_POLICY,
  SPARKLE_PALETTES,
  DIYA_ARRANGEMENTS,
  RANGOLI_PATTERNS,
  DEFAULT_RANGOLI_COLORS,
  resolveEffectiveMotion,
  hasCompletedOriginalSix,
  getStorageNotice,
}
