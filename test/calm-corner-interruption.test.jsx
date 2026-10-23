import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest'
import React, { useEffect, useRef } from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { GameStoreProvider, useGameStore } from '../src/store/gameStore.jsx'
import { GameController, STATES } from '../src/fsm/GameController.js'
import IntroCard from '../src/ui/IntroCard.jsx'
import RewardOverlay from '../src/ui/RewardOverlay.jsx'
import CalmCorner from '../src/ui/CalmCorner.jsx'
import CrackerCarousel from '../src/ui/CrackerCarousel.jsx'
import ContextualAction from '../src/ui/ContextualAction.jsx'
import { CRACKERS } from '../src/crackers/crackerDefs.js'

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

function InterruptionApp({ onReady }) {
  const store = useGameStore()
  const gcRef = useRef(null)
  if (!gcRef.current) {
    gcRef.current = new GameController(STATES.IDLE)
  }
  const gc = gcRef.current
  const [snapshot, setSnapshot] = React.useState(() => gc.getSnapshot())

  useEffect(() => {
    const unsub = gc.subscribe((s) => setSnapshot({ ...s }))
    const engines = makeMockEngines(store)
    gc.init(engines)
    if (onReady) onReady({ gc, store, engines })
    return () => {
      unsub()
      gc.dispose()
    }
  }, [])

  useEffect(() => {
    if (gc._engines) {
      gc._engines.store = store
    }
  }, [store, gc])

  const { state: fsmState, uiData, selectedCracker } = snapshot

  return (
    <div>
      <div data-testid="state">{fsmState}</div>
      <div data-testid="selected">{selectedCracker ?? 'none'}</div>

      <CrackerCarousel
        unlocked={store.state.unlocked}
        selectedCracker={selectedCracker}
        onSelect={(id) => gc.selectCracker(id)}
      />

      <ContextualAction
        fsmState={fsmState}
        selectedCracker={selectedCracker ?? 0}
        countdownNumber={uiData?.countdownNumber}
        onPlaceOnStreet={() => gc.putOnStreet()}
        onLightFuse={() => gc.tapCracker()}
        onLightAgain={() => gc.lightAgain()}
        onNextCracker={() => gc.nextCracker()}
      />

      {fsmState === STATES.CRACKER_INTRO_CARD && uiData?.cracker && (
        <IntroCard cracker={uiData.cracker} onPutOnStreet={() => gc.putOnStreet()} />
      )}

      {fsmState === STATES.REWARD_CELEBRATION && uiData?.cracker && (
        <RewardOverlay
          cracker={uiData.cracker}
          isNewSticker={uiData.isNewSticker}
          onLightAgain={() => gc.lightAgain()}
          onNextCracker={() => gc.nextCracker()}
        />
      )}

      {fsmState === STATES.CALM_CORNER_OVERLAY && (
        <CalmCorner onResume={() => gc.exitCalmCorner()} />
      )}
    </div>
  )
}

describe('G2 — Preserve complete state when entering and leaving Calm Corner', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('preserves complete introduction card state and actions when entering/exiting Calm Corner', async () => {
    let refs = null
    render(
      <GameStoreProvider>
        <InterruptionApp onReady={(r) => (refs = r)} />
      </GameStoreProvider>
    )

    const { gc } = refs

    // 1. Select Phuljhari (first time -> CRACKER_INTRO_CARD)
    act(() => {
      gc.selectCracker(0)
    })
    expect(gc.state).toBe(STATES.CRACKER_INTRO_CARD)
    expect(screen.getByRole('dialog', { name: /meet/i })).toBeDefined()
    expect(screen.getAllByText(CRACKERS[0].name).length).toBeGreaterThanOrEqual(2)

    // 2. Enter Calm Corner
    act(() => {
      gc.enterCalmCorner()
    })
    expect(gc.state).toBe(STATES.CALM_CORNER_OVERLAY)

    // 3. Close Calm Corner
    act(() => {
      gc.exitCalmCorner()
    })

    // At the audited version, uiData.cracker was lost, breaking the Intro card.
    // With G2 fix, IntroCard is fully restored with firework data and "Put on Street" action!
    expect(gc.state).toBe(STATES.CRACKER_INTRO_CARD)
    expect(gc.getSnapshot().uiData.cracker).toBeDefined()
    expect(gc.getSnapshot().uiData.cracker.id).toBe(0)
    expect(screen.getByRole('dialog', { name: /meet/i })).toBeDefined()
    expect(screen.getAllByText(CRACKERS[0].name).length).toBeGreaterThanOrEqual(2)

    // Usable start action: clicking "Put on Street" transitions to READY_ON_STREET
    act(() => {
      gc.putOnStreet()
    })
    expect(gc.state).toBe(STATES.READY_ON_STREET)
  })

  it('preserves identical reward payload (isNewSticker, starsEarned) when entering/exiting Calm Corner from reward', async () => {
    let refs = null
    render(
      <GameStoreProvider>
        <InterruptionApp onReady={(r) => (refs = r)} />
      </GameStoreProvider>
    )

    const { gc, store } = refs
    let showCb = null
    gc.setCrackerShowFn((idx, engines, onDone) => {
      showCb = onDone
      return () => {}
    })

    // Play Phuljhari to reward celebration
    act(() => {
      gc.selectCracker(0)
      gc.putOnStreet()
      gc.tapCracker()
    })
    act(() => {
      refs.engines.chhotu._walkCb?.()
    })
    act(() => {
      gc._startCrackerShow()
      showCb()
    })

    expect(gc.state).toBe(STATES.REWARD_CELEBRATION)
    expect(gc.getSnapshot().uiData.isNewSticker).toBe(true)
    expect(gc.getSnapshot().uiData.starsEarned).toBe(3)
    expect(store.getState().stars).toBe(3)

    // Enter Calm Corner from reward
    act(() => {
      gc.enterCalmCorner()
    })
    expect(gc.state).toBe(STATES.CALM_CORNER_OVERLAY)

    // Exit Calm Corner
    act(() => {
      gc.exitCalmCorner()
    })

    // Restores exact reward celebration with isNewSticker=true and starsEarned=3
    expect(gc.state).toBe(STATES.REWARD_CELEBRATION)
    expect(gc.getSnapshot().uiData.isNewSticker).toBe(true)
    expect(gc.getSnapshot().uiData.starsEarned).toBe(3)
    // Does NOT grant a second award
    expect(store.getState().stars).toBe(3)
  })

  it('restarts visible preparation safely when interrupted during adult walk (STEPPING_BACK_SAFE_ROUTINE)', async () => {
    let refs = null
    render(
      <GameStoreProvider>
        <InterruptionApp onReady={(r) => (refs = r)} />
      </GameStoreProvider>
    )

    const { gc, engines } = refs
    act(() => {
      engines.store.markIntroSeen(0)
    })

    act(() => {
      gc.selectCracker(0)
      gc.tapCracker()
    })
    expect(gc.state).toBe(STATES.STEPPING_BACK_SAFE_ROUTINE)

    // Interrupt during walk
    act(() => {
      gc.enterCalmCorner()
    })
    expect(gc.state).toBe(STATES.CALM_CORNER_OVERLAY)

    // Resume from Calm Corner
    act(() => {
      gc.exitCalmCorner()
    })

    // Resumes to STEPPING_BACK_SAFE_ROUTINE restarting the walk safely
    expect(gc.state).toBe(STATES.STEPPING_BACK_SAFE_ROUTINE)
  })

  it('restarts complete visible countdown when interrupted during COUNTDOWN_3_2_1', async () => {
    let refs = null
    render(
      <GameStoreProvider>
        <InterruptionApp onReady={(r) => (refs = r)} />
      </GameStoreProvider>
    )

    const { gc, engines } = refs
    act(() => {
      engines.store.markIntroSeen(0)
    })

    act(() => {
      gc.selectCracker(0)
      gc.tapCracker()
    })
    // Walk completes into countdown
    act(() => {
      refs.engines.chhotu._walkCb?.()
    })
    expect(gc.state).toBe(STATES.COUNTDOWN_3_2_1)

    // Interrupt countdown
    act(() => {
      gc.enterCalmCorner()
    })
    expect(gc.state).toBe(STATES.CALM_CORNER_OVERLAY)

    // Resume
    act(() => {
      gc.exitCalmCorner()
    })

    // Complete visible countdown restarts from beat 0 (3)
    expect(gc.state).toBe(STATES.COUNTDOWN_3_2_1)
    expect(gc.getSnapshot().uiData.countdownNumber).toBe(3)
  })

  it('restarts through complete countdown when interrupted during CRACKER_SHOW_ACTIVE and grants no award from abandoned run', async () => {
    let refs = null
    render(
      <GameStoreProvider>
        <InterruptionApp onReady={(r) => (refs = r)} />
      </GameStoreProvider>
    )

    const { gc, store } = refs
    let showCb = null
    gc.setCrackerShowFn((idx, engines, onDone) => {
      showCb = onDone
      return () => {
        showCb = null
      }
    })

    act(() => {
      store.markIntroSeen(0)
      gc.selectCracker(0)
      gc.tapCracker()
    })
    act(() => {
      refs.engines.chhotu._walkCb?.()
    })
    act(() => {
      gc._startCrackerShow()
    })
    expect(gc.state).toBe(STATES.CRACKER_SHOW_ACTIVE)

    const abandonedShowCallback = showCb

    // Interrupt active show
    act(() => {
      gc.enterCalmCorner()
    })
    expect(gc.state).toBe(STATES.CALM_CORNER_OVERLAY)

    // Abandoned callback fires during interruption
    act(() => {
      abandonedShowCallback?.()
    })
    expect(store.getState().stars).toBe(0)

    // Resume from Calm Corner
    act(() => {
      gc.exitCalmCorner()
    })

    // Resumes through COUNTDOWN_3_2_1 from beat 0
    expect(gc.state).toBe(STATES.COUNTDOWN_3_2_1)
    expect(gc.getSnapshot().uiData.countdownNumber).toBe(3)

    // Abandoned callback fires again during countdown
    act(() => {
      abandonedShowCallback?.()
    })
    expect(store.getState().stars).toBe(0)
  })

  it('handles rapid repeated enter/exit Calm Corner calls without corrupting state or granting extra awards', async () => {
    let refs = null
    render(
      <GameStoreProvider>
        <InterruptionApp onReady={(r) => (refs = r)} />
      </GameStoreProvider>
    )

    const { gc, store } = refs
    act(() => {
      store.markIntroSeen(0)
    })

    act(() => {
      gc.selectCracker(0)
    })
    expect(gc.state).toBe(STATES.READY_ON_STREET)

    // Rapid repeated calls to enterCalmCorner
    act(() => {
      gc.enterCalmCorner()
      gc.enterCalmCorner()
      gc.enterCalmCorner()
    })
    expect(gc.state).toBe(STATES.CALM_CORNER_OVERLAY)

    // Rapid repeated calls to exitCalmCorner
    act(() => {
      gc.exitCalmCorner()
      gc.exitCalmCorner()
    })
    expect(gc.state).toBe(STATES.READY_ON_STREET)
    expect(gc.selectedCracker).toBe(0)
  })
})
