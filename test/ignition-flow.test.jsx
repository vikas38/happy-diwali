import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest'
import React, { useEffect, useRef, useState } from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { GameStoreProvider, useGameStore } from '../src/store/gameStore.jsx'
import { GameController, STATES } from '../src/fsm/GameController.js'
import ContextualAction, { getStepFromState } from '../src/ui/ContextualAction.jsx'
import Countdown from '../src/ui/Countdown.jsx'
import RewardOverlay from '../src/ui/RewardOverlay.jsx'
import { getCracker } from '../src/crackers/crackerDefs.js'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function () {
    this.open = true
  })
  HTMLDialogElement.prototype.close = vi.fn(function () {
    this.open = false
  })
})

function makeMockEngines(store) {
  const soundCalls = []
  const engines = {
    store,
    sound: {
      supported: true,
      init: () => soundCalls.push('init'),
      resume: async () => {},
      startMusic: () => soundCalls.push('startMusic'),
      stopMusic: () => soundCalls.push('stopMusic'),
      stopCrackerAudio: () => soundCalls.push('stopCrackerAudio'),
      fadeCrackerAudio: () => soundCalls.push('fadeCrackerAudio'),
      startCalmPad: () => soundCalls.push('startCalmPad'),
      stopCalmPad: () => soundCalls.push('stopCalmPad'),
      setIntensity: () => {},
      setMasterVolume: () => {},
      playTestTone: (freq) => soundCalls.push(['tone', freq]),
      getAudioLevel: () => 0,
      _calls: soundCalls,
    },
    chhotu: {
      x: 0,
      y: 0,
      walkActive: false,
      jumpActive: false,
      _walkCb: null,
      setPosition: vi.fn(),
      setFacing: vi.fn(),
      setArmState: vi.fn(),
      jump: vi.fn(),
      walkTo: vi.fn((fx, fy, tx, ty, d, cb) => {
        engines.chhotu._walkCb = cb
      }),
    },
    pip: {
      setPosition: vi.fn(),
      setMood: vi.fn(),
      jump: vi.fn(),
    },
    particles: { flashes: [], clear: vi.fn() },
    comicBubble: {},
    jellySquash: {},
    renderer: { width: 800, height: 600 },
    background: { setGameState: vi.fn() },
    layout: {
      chhotuStartX: 0.38,
      chhotuStartY: 0.62,
      pipStartX: 0.3,
      pipStartY: 0.64,
      safeZoneX: 0.15,
      safeZoneY: 0.65,
    },
  }
  return engines
}

describe('DIW-012 — Make ignition and show states feel clear and satisfying', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('progresses explicitly through Choose → Ready → Grown-up prepares → Countdown → Show → Result', async () => {
    let gcInstance
    let finishShow

    function TestHost() {
      const store = useGameStore()
      const gcRef = useRef(null)
      if (!gcRef.current) {
        gcRef.current = new GameController(STATES.IDLE)
        gcInstance = gcRef.current
      }
      const [fsmSnapshot, setFsmSnapshot] = useState(() => gcRef.current.getSnapshot())

      useEffect(() => {
        const gc = gcRef.current
        const engines = makeMockEngines(store)
        gc.init(engines)
        gc.setCrackerShowFn((idx, eng, onDone) => {
          finishShow = onDone
          return () => {}
        })

        const unsub = gc.subscribe((snap) => setFsmSnapshot({ ...snap }))
        setFsmSnapshot(gc.getSnapshot())
        return () => {
          unsub()
          gc.dispose()
        }
      }, [store])

      if (!fsmSnapshot) return null

      return (
        <div data-testid="game-host">
          <ContextualAction
            fsmState={fsmSnapshot.state}
            selectedCracker={fsmSnapshot.selectedCracker ?? 0}
            countdownNumber={fsmSnapshot.uiData?.countdownNumber}
            onPlaceOnStreet={() => {
              gcRef.current.selectCracker(0)
              gcRef.current.putOnStreet()
            }}
            onLightFuse={() => gcRef.current.tapCracker()}
            onSkipWalk={() => gcRef.current.skipWalk()}
            onLightAgain={() => gcRef.current.lightAgain()}
            onNextCracker={() => gcRef.current.nextCracker()}
          />
          {fsmSnapshot.state === STATES.COUNTDOWN_3_2_1 && (
            <Countdown countdownNumber={fsmSnapshot.uiData?.countdownNumber} />
          )}
          {fsmSnapshot.state === STATES.REWARD_CELEBRATION && (
            <RewardOverlay
              cracker={fsmSnapshot.uiData?.cracker}
              isNewSticker={fsmSnapshot.uiData?.isNewSticker}
              onLightAgain={() => gcRef.current.lightAgain()}
              onNextCracker={() => gcRef.current.nextCracker()}
            />
          )}
        </div>
      )
    }

    render(
      <GameStoreProvider>
        <TestHost />
      </GameStoreProvider>
    )

    // 1. Choose state (IDLE)
    expect(gcInstance.state).toBe(STATES.IDLE)
    expect(getStepFromState(STATES.IDLE)).toBe(1)
    const placeBtn = screen.getByRole('button', { name: /Place.*on street/i })
    expect(placeBtn).toBeTruthy()

    // Transition to READY_ON_STREET
    act(() => {
      gcInstance.selectCracker(0)
      gcInstance.putOnStreet()
    })
    expect(gcInstance.state).toBe(STATES.READY_ON_STREET)
    expect(getStepFromState(STATES.READY_ON_STREET)).toBe(3)

    // 2. Ready state (READY_ON_STREET): primary button is Ask grown-up to light
    const lightBtn = screen.getByRole('button', { name: /Ask.*grown-up.*light/i })
    expect(lightBtn).toBeTruthy()

    // 3. Grown-up prepares state (STEPPING_BACK_SAFE_ROUTINE)
    act(() => {
      fireEvent.click(lightBtn)
    })
    expect(gcInstance.state).toBe(STATES.STEPPING_BACK_SAFE_ROUTINE)
    const stepBtn = screen.getByRole('button', { name: /Stepping back safely/i })
    expect(stepBtn).toBeTruthy()
    expect(stepBtn.disabled).toBe(true)

    // 4. Countdown state (COUNTDOWN_3_2_1) via skipWalk
    vi.useFakeTimers()
    act(() => {
      gcInstance.skipWalk()
    })
    expect(gcInstance.state).toBe(STATES.COUNTDOWN_3_2_1)
    expect(screen.getByRole('status')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Counting down: 3/i }).disabled).toBe(true)

    // Advance timers through countdown beats (3, 2, 1, GLOW!) to CRACKER_SHOW_ACTIVE
    act(() => {
      vi.advanceTimersByTime(3200)
    })
    expect(gcInstance.state).toBe(STATES.CRACKER_SHOW_ACTIVE)
    expect(screen.getByRole('button', { name: /Watching the sparkle celebration/i }).disabled).toBe(
      true
    )

    // 5. Result state (REWARD_CELEBRATION)
    act(() => {
      finishShow()
    })
    expect(gcInstance.state).toBe(STATES.REWARD_CELEBRATION)
    expect(screen.getByRole('dialog', { name: /You did it/i })).toBeTruthy()
    expect(screen.getAllByRole('button', { name: /Light.*again/i })[0]).toBeTruthy()
  })

  it('guards against double-activation on start action and produces one award transaction', () => {
    const store = {
      isUnlocked: () => true,
      hasSticker: () => false,
      hasSeenIntro: () => true,
      awardShowCompletion: vi.fn(() => ({ isNewSticker: true, starsEarned: 3 })),
      getState: () => ({ muted: false, masterVolume: 0.7, stickers: [], unlocked: [0] }),
    }
    const engines = makeMockEngines(store)
    const gc = new GameController(STATES.READY_ON_STREET)
    gc.init(engines)
    gc.selectedCracker = 0

    let showCalls = 0
    let finishShow
    gc.setCrackerShowFn((idx, eng, onDone) => {
      showCalls++
      finishShow = onDone
      return () => {}
    })

    // Rapid double-tap on tapCracker
    gc.tapCracker()
    gc.tapCracker() // Second tap must be safely rejected

    expect(gc.state).toBe(STATES.STEPPING_BACK_SAFE_ROUTINE)

    vi.useFakeTimers()
    // Complete walk to countdown
    gc.skipWalk()
    expect(gc.state).toBe(STATES.COUNTDOWN_3_2_1)

    // Complete countdown to show
    act(() => {
      vi.advanceTimersByTime(3200)
    })
    expect(gc.state).toBe(STATES.CRACKER_SHOW_ACTIVE)
    expect(showCalls).toBe(1)

    // Double finish callback invocation
    act(() => {
      finishShow()
      finishShow() // Duplicate completion callback must be dropped
    })

    expect(gc.state).toBe(STATES.REWARD_CELEBRATION)
    expect(store.awardShowCompletion).toHaveBeenCalledTimes(1)
    gc.dispose()
  })

  it('keeps ordinary button activation as the primary ignition request without requiring precision stage tapping', () => {
    const store = {
      isUnlocked: () => true,
      hasSticker: () => false,
      hasSeenIntro: () => true,
      getState: () => ({ muted: false, masterVolume: 0.7, stickers: [], unlocked: [0] }),
    }
    const engines = makeMockEngines(store)
    const gc = new GameController(STATES.READY_ON_STREET)
    gc.init(engines)
    gc.selectedCracker = 0

    // Calling tapCracker directly via the primary action button succeeds
    gc.tapCracker()
    expect(gc.state).toBe(STATES.STEPPING_BACK_SAFE_ROUTINE)
    gc.dispose()
  })

  it('pauses during preparation or show and follows the established restart-countdown policy', () => {
    const store = {
      isUnlocked: () => true,
      hasSticker: () => false,
      hasSeenIntro: () => true,
      awardShowCompletion: vi.fn(),
      getState: () => ({ muted: false, masterVolume: 0.7, stickers: [], unlocked: [0] }),
    }
    const engines = makeMockEngines(store)
    const gc = new GameController(STATES.READY_ON_STREET)
    gc.init(engines)
    gc.selectedCracker = 0

    let cancelled = false
    let finishShow
    gc.setCrackerShowFn((idx, eng, onDone) => {
      finishShow = onDone
      return () => {
        cancelled = true
      }
    })

    // Start routine
    gc.tapCracker()
    expect(gc.state).toBe(STATES.STEPPING_BACK_SAFE_ROUTINE)

    // 1. Interruption during STEPPING_BACK_SAFE_ROUTINE
    gc.enterCalmCorner()
    expect(gc.state).toBe(STATES.CALM_CORNER_OVERLAY)
    gc.exitCalmCorner()
    expect(gc.state).toBe(STATES.STEPPING_BACK_SAFE_ROUTINE)

    // Move to show
    vi.useFakeTimers()
    gc.skipWalk()
    act(() => {
      vi.advanceTimersByTime(3200)
    })
    expect(gc.state).toBe(STATES.CRACKER_SHOW_ACTIVE)

    // 2. Interruption during CRACKER_SHOW_ACTIVE
    gc.enterCalmCorner()
    expect(gc.state).toBe(STATES.CALM_CORNER_OVERLAY)
    expect(cancelled).toBe(true)

    // Late callback from cancelled show should be dropped
    finishShow?.()
    expect(store.awardShowCompletion).not.toHaveBeenCalled()

    // Resume from Calm Corner: restarts through countdown, zero award from abandoned run
    gc.exitCalmCorner()
    expect(gc.state).toBe(STATES.COUNTDOWN_3_2_1)
    expect(store.awardShowCompletion).not.toHaveBeenCalled()

    gc.dispose()
  })

  it('suppresses redundant first-use introductions when replaying crackers', () => {
    const store = {
      isUnlocked: (id) => true,
      hasSticker: (id) => id === 0,
      hasSeenIntro: (id) => true, // Already seen intro
      getState: () => ({ muted: false, masterVolume: 0.7, stickers: [0], unlocked: [0, 1] }),
    }
    const engines = makeMockEngines(store)
    const gc = new GameController(STATES.IDLE)
    gc.init(engines)

    // Selecting an already-seen cracker goes straight to READY_ON_STREET
    gc.selectCracker(0)
    expect(gc.state).toBe(STATES.READY_ON_STREET)

    // Advance to show and complete to REWARD_CELEBRATION
    gc._setState(STATES.STEPPING_BACK_SAFE_ROUTINE)
    gc._setState(STATES.COUNTDOWN_3_2_1)
    gc._setState(STATES.CRACKER_SHOW_ACTIVE)
    gc._setState(STATES.REWARD_CELEBRATION, { cracker: getCracker(0) })

    // From REWARD_CELEBRATION, lightAgain goes straight to READY_ON_STREET
    gc.lightAgain()
    expect(gc.state).toBe(STATES.READY_ON_STREET)

    gc.dispose()
  })
})
