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

// ===================================================================
// Inner app — uses game store context
// ===================================================================
function GameApp({ onBack }) {
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
    gcRef.current = new GameController()
  }
  const gc = gcRef.current

  const [fsmSnapshot, setFsmSnapshot] = useState(() => gc.getSnapshot())
  const [showStickerBook, setShowStickerBook] = useState(false)
  const enginesRef = useRef(null)
  const readyCooldownRef = useRef(0)

  // Subscribe to FSM state changes for React re-renders
  useEffect(() => {
    const unsub = gc.subscribe(snapshot => {
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
  const handleEnginesReady = useCallback((canvasEngines) => {
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
  // store is stable (context ref); gc is stable (sync ref) — safe to omit
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gc])

  // Returning from a hidden tab should never skip the visible safety routine.
  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden && gc.state !== STATES.SAFETY_SPLASH) gc.enterCalmCorner()
    }
    const pauseOnResize = () => {
      if ([STATES.STEPPING_BACK_SAFE_ROUTINE, STATES.COUNTDOWN_3_2_1, STATES.CRACKER_SHOW_ACTIVE].includes(gc.state)) gc.enterCalmCorner()
    }
    document.addEventListener('visibilitychange', pauseWhenHidden)
    window.addEventListener('resize', pauseOnResize)
    return () => {
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
  }, [gc])

  const handleSelectCracker = useCallback((index) => {
    gc.selectCracker(index)
  }, [gc])

  const handlePutOnStreet = useCallback(() => {
    gc.putOnStreet()
  }, [gc])

  const handleTapCracker = useCallback((e) => {
    if (fsmSnapshot.state !== STATES.READY_ON_STREET) return
    // Cooldown guard: prevent accidental click from "Put on Street" modal
    if (Date.now() < readyCooldownRef.current) return
    if (e && e.target) {
      const tag = e.target.tagName.toLowerCase()
      if (tag === 'input' || tag === 'label') return
      if (tag === 'canvas') {
        const rect = e.target.getBoundingClientRect()
        const point = getLaunchPoint(rect.width, rect.height)
        if (Math.hypot(e.clientX-rect.left-point.x, e.clientY-rect.top-point.y) > 90) return
      }
    }
    gc.tapCracker()
  }, [gc, fsmSnapshot.state])

  const handleLightAgain = useCallback(() => {
    gc.lightAgain()
  }, [gc])

  const handleNextCracker = useCallback(() => {
    gc.nextCracker()
  }, [gc])

  const handleCalmCorner = useCallback(() => {
    gc.enterCalmCorner()
  }, [gc])

  const handleResumeFromCalm = useCallback(() => {
    gc.exitCalmCorner()
  }, [gc])

  const handleVolumeChange = useCallback((vol) => {
    gc.setMasterVolume(vol)
  }, [gc])

  const handleIntensityChange = useCallback((mode) => {
    gc.setIntensity(mode)
  }, [gc])

  // ---- Derived state ----

  const { state: fsmState, uiData, selectedCracker } = fsmSnapshot
  const showHUD = fsmState !== STATES.SAFETY_SPLASH
  const showCarousel =
    fsmState === STATES.IDLE ||
    fsmState === STATES.READY_ON_STREET ||
    fsmState === STATES.REWARD_CELEBRATION
  const isLastCracker = selectedCracker === 5

  return (
    <div className="play-shell">
      {/* Top Navigation Bar with Back button & settings */}
      <HUD
        onBack={onBack}
        showSettings={showHUD}
        masterVolume={saveState.masterVolume}
        intensity={saveState.intensity}
        stars={saveState.stars}
        onVolumeChange={handleVolumeChange}
        onIntensityChange={handleIntensityChange}
        onOpenStickerBook={() => setShowStickerBook(true)}
        onCalmCorner={handleCalmCorner}
      />

      <div className="game-stage" data-state={fsmState}>
        {showHUD && (
          <div className="scene-caption" aria-live="polite">
            <span>AN EVENING IN THE COURTYARD</span>
            <h1>
              {fsmState === STATES.IDLE
                ? 'A little spark. A sky of possibilities.'
                : CRACKERS[selectedCracker]?.name || 'Your Diwali, your pace.'}
            </h1>
            <p>
              {fsmState === STATES.IDLE
                ? 'Choose a firework from your box below.'
                : fsmState === STATES.READY_ON_STREET
                ? 'Your spark is ready. Let’s bring it to life.'
                : fsmState === STATES.STEPPING_BACK_SAFE_ROUTINE
                ? 'Fuse lit. Stepping back together…'
                : fsmState === STATES.CRACKER_SHOW_ACTIVE
                ? 'Stay a little. Watch the last embers fall.'
                : fsmState === STATES.REWARD_CELEBRATION
                ? 'One more bright memory for your collection.'
                : 'A moment of anticipation.'}
            </p>
          </div>
        )}

        {/* Canvas layer — always rendered */}
        <CanvasStage onReady={handleEnginesReady} onClick={handleTapCracker} />

        {/* Cracker carousel — shown in idle / ready / reward */}
        {showCarousel && (
          <CrackerCarousel
            unlocked={saveState.unlocked}
            selectedCracker={selectedCracker}
            onSelect={handleSelectCracker}
          />
        )}

        {/* Ready to light prompt — shown when cracker is safely on street */}
        {fsmState === STATES.READY_ON_STREET && (
          <div className="ready-street-banner" role="region" aria-label="Light cracker action">
            <button
              className="btn btn--primary btn--bounce ready-street-btn"
              onClick={handleTapCracker}
              aria-label="Light with Sparkler!"
            >
              <span aria-hidden="true">✦</span> Light the fuse <span aria-hidden="true">→</span>
            </button>
            <p className="ready-street-hint">
              One tap to light. Chhotu will step back.
            </p>
          </div>
        )}

        {/* ---- FSM overlays ---- */}

        {fsmState === STATES.SAFETY_SPLASH && (
          <SafetySplash onStart={handleStart} />
        )}

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
            isLastCracker={isLastCracker}
          />
        )}

        {fsmState === STATES.CALM_CORNER_OVERLAY && (
          <CalmCorner onResume={handleResumeFromCalm} />
        )}

        {/* Sticker Book — modal on top */}
        {showStickerBook && (
          <StickerBook
            stickers={saveState.stickers}
            onClose={() => setShowStickerBook(false)}
            onUnlockAll={() => {
              store.unlockAllCrackers()
              setShowStickerBook(false)
            }}
          />
        )}
      </div>
    </div>
  )
}

// ===================================================================
// Root App
// ===================================================================
export default function App() {
  const [playing, setPlaying] = useState(false)

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
        <GameApp onBack={handleBackToFestival} />
      ) : (
        <FestivalHome onPlay={() => setPlaying(true)} />
      )}
    </GameStoreProvider>
  )
}
