import { useDialogFocus } from './accessibility/useDialogFocus.js'
import { shouldPauseOnResize } from './safety/limits.js'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { GameStoreProvider, useGameStore } from './store/gameStore.jsx'
import CanvasStage from './ui/CanvasStage.jsx'
import HUD from './ui/HUD.jsx'
import CrackerCarousel from './ui/CrackerCarousel.jsx'
import SafetySplash from './ui/SafetySplash.jsx'
import IntroCard from './ui/IntroCard.jsx'
import Countdown from './ui/Countdown.jsx'
import RewardOverlay from './ui/RewardOverlay.jsx'
import StickerBook from './ui/StickerBook.jsx'
import CalmCorner from './ui/CalmCorner.jsx'
import { GameController, STATES } from './fsm/GameController.js'
import { getSoundEngine } from './audio/SoundEngine.js'
import { playCrackerShow, fireRewardConfetti } from './crackers/crackerControllers.js'
import { getLaunchPoint } from './render/layers/Background.js'
import { CRACKERS } from './crackers/crackerDefs.js'
import FestivalHome from './ui/FestivalHome.jsx'
import ContextualAction from './ui/ContextualAction.jsx'
import { t } from './i18n/index.js'

// ===================================================================
// Inner app — uses game store context
// ===================================================================
function GameApp({ onBack, reducedMotion, onToggleMotion }) {
  const store = useGameStore()
  const { state: saveState } = store

  // ----------------------------------------------------------------
  // IMPORTANT: GameController must be created SYNCHRONOUSLY so it
  // exists before CanvasStage's useEffect fires onReady.
  // (React runs child effects before parent effects, so a parent
  //  useEffect would be too late.)
  // ----------------------------------------------------------------
  const gcRef = useRef(null)
  if (!gcRef.current) {
    gcRef.current = new GameController(STATES.IDLE)
  }
  const gc = gcRef.current

  const [fsmSnapshot, setFsmSnapshot] = useState(() => gc.getSnapshot())
  const { state: fsmState, uiData, selectedCracker } = fsmSnapshot
  useDialogFocus(fsmSnapshot.state)
  const [audioState, setAudioState] = useState('')
  const [canvasFailed, setCanvasFailed] = useState(false)
  const enginesRef = useRef(null)
  const readyCooldownRef = useRef(0)

  // Subscribe to FSM state changes for React re-renders
  useEffect(() => {
    const unsub = gc.subscribe((snapshot) => {
      if (snapshot.state === STATES.READY_ON_STREET) {
        // 500ms cooldown so clicking "Put on Street" cannot accidentally light cracker immediately
        readyCooldownRef.current = Date.now() + 500
      }
      setFsmSnapshot({ ...snapshot })
    })
    return () => {
      unsub()
      gc.dispose()
    }
  }, [gc])

  // Called when CanvasStage engines are ready (runs in CanvasStage's useEffect)
  // gc is already set at this point because it was created synchronously above.
  const handleEnginesReady = useCallback(
    (canvasEngines) => {
      const sound = getSoundEngine()

      const engines = {
        sound,
        store,
        renderer: canvasEngines.renderer,
        background: canvasEngines.background,
        chhotu: canvasEngines.chhotu,
        pip: canvasEngines.pip,
        particles: canvasEngines.particles,
        comicBubble: canvasEngines.comicBubble,
        jellySquash: canvasEngines.jellySquash,
        layout: canvasEngines.layout,
      }
      enginesRef.current = engines

      // Initial background state sync
      if (canvasEngines.background) {
        canvasEngines.background.setGameState(gc.state, gc.selectedCracker)
      }

      // Register the cracker show function
      gc.setCrackerShowFn((crackerIndex, _engines, onDone) => {
        return playCrackerShow(crackerIndex, _engines, onDone)
      })

      gc.init(engines)
    },
    [gc, store]
  )

  // Keep store reference in engines in sync across React updates without recreating engines or controller
  useEffect(() => {
    if (enginesRef.current) {
      enginesRef.current.store = store
    }
    if (gc._engines) {
      gc._engines.store = store
    }
  }, [gc, store])

  // Returning from a hidden tab should never skip the visible safety routine.
  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden && gc.state !== STATES.SAFETY_SPLASH) gc.enterCalmCorner()
    }
    let size = { width: window.innerWidth, height: window.innerHeight }
    let resizeTimer
    const pauseOnResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        const next = { width: window.innerWidth, height: window.innerHeight }
        if (shouldPauseOnResize(size, next)) {
          if (
            [
              STATES.STEPPING_BACK_SAFE_ROUTINE,
              STATES.COUNTDOWN_3_2_1,
              STATES.CRACKER_SHOW_ACTIVE,
            ].includes(gc.state)
          )
            gc.enterCalmCorner()
          size = next
        }
      }, 250)
    }
    document.addEventListener('visibilitychange', pauseWhenHidden)
    window.addEventListener('resize', pauseOnResize)
    return () => {
      clearTimeout(resizeTimer)
      document.removeEventListener('visibilitychange', pauseWhenHidden)
      window.removeEventListener('resize', pauseOnResize)
    }
  }, [gc])

  // Trigger reward confetti when entering REWARD_CELEBRATION
  useEffect(() => {
    if (fsmSnapshot.state === STATES.REWARD_CELEBRATION && enginesRef.current) {
      const { particles, renderer } = enginesRef.current
      if (particles && renderer) {
        fireRewardConfetti(particles, renderer.width, renderer.height)
      }
    }
    // Synchronize background cracker prop and states
    if (enginesRef.current?.background) {
      enginesRef.current.background.setGameState(fsmSnapshot.state, fsmSnapshot.selectedCracker)
    }
  }, [fsmSnapshot.state, fsmSnapshot.selectedCracker])

  // ---- Action handlers ----

  const handleStart = useCallback(() => {
    gc.startGame()
    setTimeout(
      () => setAudioState(getSoundEngine().ctx?.state === 'running' ? '' : t('audio_paused_hint')),
      250
    )
  }, [gc])

  const handleSelectCracker = useCallback(
    (index) => {
      if (!saveState.seenHint) store.dismissHint()
      gc.selectCracker(index)
    },
    [gc, saveState.seenHint, store]
  )

  const handlePutOnStreet = useCallback(() => {
    if (!saveState.seenHint) store.dismissHint()
    gc.putOnStreet()
  }, [gc, saveState.seenHint, store])

  const handleTapCracker = useCallback(
    (e) => {
      if (!saveState.seenHint) store.dismissHint()
      if (fsmSnapshot.state !== STATES.READY_ON_STREET) return
      // Cooldown guard: prevent accidental click from "Put on Street" modal
      if (e?.target?.tagName?.toLowerCase() === 'canvas' && Date.now() < readyCooldownRef.current)
        return
      if (e && e.target) {
        const tag = e.target.tagName.toLowerCase()
        if (tag === 'input' || tag === 'label') return
        if (tag === 'canvas') {
          const rect = e.target.getBoundingClientRect()
          const point = getLaunchPoint(rect.width, rect.height)
          if (Math.hypot(e.clientX - rect.left - point.x, e.clientY - rect.top - point.y) > 90)
            return
        }
      }
      gc.tapCracker()
    },
    [gc, fsmSnapshot.state, saveState.seenHint, store]
  )

  const handleLightAgain = useCallback(() => {
    gc.lightAgain()
  }, [gc])

  const handleNextCracker = useCallback(() => {
    gc.nextCracker()
  }, [gc])

  const handleSkipWalk = useCallback(() => {
    gc.skipWalk()
  }, [gc])

  const handleContextualPlace = useCallback(() => {
    if (!saveState.seenHint) store.dismissHint()
    const target = selectedCracker !== null ? selectedCracker : 0
    if (fsmSnapshot.state === STATES.IDLE) {
      if (!store.hasSeenIntro(target)) {
        gc.selectCracker(target)
      } else {
        gc.selectCracker(target)
        gc.putOnStreet()
      }
    } else if (fsmSnapshot.state === STATES.CRACKER_INTRO_CARD) {
      gc.putOnStreet()
    }
  }, [gc, selectedCracker, fsmSnapshot.state, saveState.seenHint, store])

  const handleCalmCorner = useCallback(() => {
    gc.enterCalmCorner()
  }, [gc])

  const handleResumeFromCalm = useCallback(() => {
    gc.exitCalmCorner()
  }, [gc])

  const handleVolumeChange = useCallback(
    (vol) => {
      gc.setMasterVolume(vol)
    },
    [gc]
  )

  const handleIntensityChange = useCallback(
    (mode) => {
      gc.setIntensity(mode)
    },
    [gc]
  )

  const lastNonZeroVolumeRef = useRef(saveState.masterVolume || 0.7)
  if (saveState.masterVolume > 0) {
    lastNonZeroVolumeRef.current = saveState.masterVolume
  }

  const handleToggleMute = useCallback(() => {
    if (saveState.masterVolume > 0) {
      lastNonZeroVolumeRef.current = saveState.masterVolume
      gc.setMasterVolume(0)
    } else {
      const restoreVol = lastNonZeroVolumeRef.current || 0.7
      gc.setMasterVolume(restoreVol)
    }
  }, [saveState.masterVolume, gc])

  const handleTestSound = useCallback(() => {
    const sound = getSoundEngine()
    sound.setIntensity(saveState.intensity)
    sound.setMasterVolume(saveState.masterVolume)
    sound.playTestChime()
  }, [saveState.intensity, saveState.masterVolume])

  // ---- Derived state ----

  const showHUD = fsmState !== STATES.SAFETY_SPLASH
  const showCarousel =
    fsmState === STATES.IDLE ||
    fsmState === STATES.READY_ON_STREET ||
    fsmState === STATES.REWARD_CELEBRATION
  const isLastCracker = selectedCracker === 5

  if (canvasFailed)
    return (
      <main className="recovery-card" role="alert">
        <h1>{t('canvas_fail_title')}</h1>
        <p>{t('canvas_fail_desc_progress')}</p>
        <button className="sun-button" onClick={onBack}>
          {t('back_to_festival')}
        </button>
      </main>
    )
  const calmVisuals = Boolean(saveState.calmVisuals)
  const isMotionPaused = calmVisuals || Boolean(reducedMotion)

  return (
    <div className={`play-shell ${isMotionPaused ? 'motion-paused' : ''}`}>
      {/* Top Navigation Bar with Back button & settings */}
      <HUD
        onBack={onBack}
        calmVisuals={calmVisuals}
        onToggleCalmVisuals={() => store.setCalmVisuals((v) => !v)}
        reducedMotion={isMotionPaused}
        onToggleMotion={() => store.setCalmVisuals((v) => !v)}
        showSettings={showHUD}
        masterVolume={saveState.masterVolume}
        intensity={saveState.intensity}
        stars={saveState.stars}
        settingsOpen={fsmState === STATES.SETTINGS_OVERLAY}
        onOpenSettings={() => gc.openSettings()}
        onCloseSettings={() => gc.closeSettings()}
        onVolumeChange={handleVolumeChange}
        onIntensityChange={handleIntensityChange}
        onToggleMute={handleToggleMute}
        onTestSound={handleTestSound}
        onOpenStickerBook={() => gc.openStickerBook()}
        onCalmCorner={handleCalmCorner}
      />

      {audioState && (
        <div className="audio-status" role="status">
          {audioState}
          <button
            onClick={async () => {
              const sound = getSoundEngine()
              await sound.resume()
              setAudioState(sound.ctx?.state === 'running' ? '' : t('audio_unavailable_hint'))
            }}
          >
            {t('enable_sound')}
          </button>
        </div>
      )}
      <div className="game-stage" data-state={fsmState}>
        {!saveState.seenHint && showHUD && (
          <aside className="courtyard-hint-banner" role="status" aria-live="polite">
            <span className="hint-star" aria-hidden="true">
              ✦
            </span>
            <span className="hint-text">{t('hint_choose_sparkle')}</span>
            <button
              type="button"
              className="hint-close-btn"
              onClick={() => store.dismissHint()}
              aria-label={t('hint_dismiss')}
            >
              ✕
            </button>
          </aside>
        )}
        {showHUD && (
          <div className="scene-caption" aria-live="polite">
            <span>{t('scene_evening')}</span>
            <h1>
              {fsmState === STATES.IDLE
                ? t('scene_spark_possibilities')
                : CRACKERS[selectedCracker]?.name || t('scene_default_title')}
            </h1>
            <p>
              {fsmState === STATES.IDLE
                ? t('scene_idle_desc')
                : fsmState === STATES.READY_ON_STREET
                  ? t('scene_ready_desc')
                  : fsmState === STATES.STEPPING_BACK_SAFE_ROUTINE
                    ? t('scene_stepping_desc')
                    : fsmState === STATES.CRACKER_SHOW_ACTIVE
                      ? t('scene_active_desc')
                      : fsmState === STATES.REWARD_CELEBRATION
                        ? t('scene_reward_desc')
                        : t('scene_anticipation_desc')}
            </p>
          </div>
        )}

        {/* Canvas layer — always rendered */}
        <CanvasStage
          onReady={handleEnginesReady}
          onClick={handleTapCracker}
          reducedMotion={isMotionPaused}
          calmVisuals={calmVisuals}
          paused={
            fsmState === STATES.CALM_CORNER_OVERLAY ||
            fsmState === STATES.STICKER_BOOK_OVERLAY ||
            fsmState === STATES.SETTINGS_OVERLAY
          }
          onFailure={() => {
            if (enginesRef.current) gc.enterCalmCorner()
            getSoundEngine().stopMusic()
            getSoundEngine().stopCalmPad()
            setCanvasFailed(true)
          }}
        />

        {/* Cracker carousel — shown in idle / ready / reward */}
        {showCarousel && (
          <CrackerCarousel
            unlocked={saveState.unlocked}
            selectedCracker={selectedCracker}
            onSelect={handleSelectCracker}
          />
        )}

        {/* Contextual Action Bar — single primary action + 5-step indicator in lower half */}
        {showHUD && (
          <ContextualAction
            fsmState={fsmState}
            selectedCracker={selectedCracker ?? 0}
            countdownNumber={uiData.countdownNumber}
            canSkipWalk={Boolean(saveState.hasCompletedFirst || saveState.stickers.length > 0)}
            hasDock={showCarousel}
            onPlaceOnStreet={
              fsmState === STATES.CRACKER_INTRO_CARD ? handlePutOnStreet : handleContextualPlace
            }
            onLightFuse={handleTapCracker}
            onSkipWalk={handleSkipWalk}
            onNextCracker={handleNextCracker}
            onLightAgain={handleLightAgain}
            isLastCracker={isLastCracker}
          />
        )}

        {/* Safety notice when ready to light */}
        {fsmState === STATES.READY_ON_STREET && (
          <div
            className="ready-street-banner"
            role="region"
            aria-label={t('ready_street_banner_aria')}
          >
            <p className="ready-street-hint">{t('ready_street_hint')}</p>
          </div>
        )}

        {/* ---- FSM overlays ---- */}

        {fsmState === STATES.SAFETY_SPLASH && <SafetySplash onStart={handleStart} />}

        {fsmState === STATES.CRACKER_INTRO_CARD && uiData.cracker && (
          <IntroCard cracker={uiData.cracker} onPutOnStreet={handlePutOnStreet} />
        )}

        {fsmState === STATES.COUNTDOWN_3_2_1 && (
          <Countdown countdownNumber={uiData.countdownNumber} />
        )}

        {fsmState === STATES.REWARD_CELEBRATION && (
          <RewardOverlay
            cracker={uiData.cracker}
            isNewSticker={uiData.isNewSticker}
            onLightAgain={handleLightAgain}
            onNextCracker={handleNextCracker}
            onSkip={handleNextCracker}
            isLastCracker={isLastCracker}
          />
        )}

        {fsmState === STATES.CALM_CORNER_OVERLAY && <CalmCorner onResume={handleResumeFromCalm} />}

        {/* Sticker Book — modal governed by FSM interruption */}
        {fsmState === STATES.STICKER_BOOK_OVERLAY && (
          <StickerBook
            stickers={saveState.stickers}
            onClose={() => gc.closeStickerBook()}
            onUnlockAll={() => {
              store.unlockAllCrackers()
              gc.closeStickerBook()
            }}
          />
        )}
      </div>
    </div>
  )
}

// ===================================================================
// Festival Home Wrapper — unlocks audio on gesture and wires settings
// ===================================================================
function FestivalHomeWrapper({ onPlay, reducedMotion }) {
  const store = useGameStore()
  const calmVisuals = Boolean(store.state.calmVisuals)
  const isMotionPaused = calmVisuals || Boolean(reducedMotion)

  const handlePlay = useCallback(() => {
    const sound = getSoundEngine()
    try {
      sound.init()
      sound
        .resume()
        .then(() => {
          sound.setIntensity(store.state.intensity || 'SOFT')
          sound.setMasterVolume(store.state.masterVolume ?? 0.7)
          sound.startMusic()
        })
        .catch(() => {})
    } catch {}
    onPlay()
  }, [store.state.intensity, store.state.masterVolume, onPlay])

  return (
    <FestivalHome
      onPlay={handlePlay}
      motion={!isMotionPaused}
      setMotion={(v) => {
        const nextMotion = typeof v === 'function' ? v(!isMotionPaused) : v
        store.setCalmVisuals(!nextMotion)
      }}
    />
  )
}

// ===================================================================
// Root App
// ===================================================================
export default function App() {
  const [playing, setPlaying] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false
  )
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const sync = (e) => setReducedMotion(e.matches)
    mq?.addEventListener('change', sync)
    return () => mq?.removeEventListener('change', sync)
  }, [])

  const handleBackToFestival = useCallback(() => {
    const sound = getSoundEngine()
    sound.stopMusic()
    sound.stopCalmPad()
    sound.stopCrackerAudio()
    sound.stopCalmAudio()
    setPlaying(false)
  }, [])

  return (
    <GameStoreProvider>
      {playing ? (
        <GameApp onBack={handleBackToFestival} reducedMotion={reducedMotion} />
      ) : (
        <FestivalHomeWrapper onPlay={() => setPlaying(true)} reducedMotion={reducedMotion} />
      )}
    </GameStoreProvider>
  )
}
