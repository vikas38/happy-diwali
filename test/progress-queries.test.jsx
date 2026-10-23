import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest'
import React, { useEffect, useRef } from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { GameStoreProvider, useGameStore } from '../src/store/gameStore.jsx'
import { GameController, STATES } from '../src/fsm/GameController.js'
import CrackerCarousel from '../src/ui/CrackerCarousel.jsx'
import RewardOverlay from '../src/ui/RewardOverlay.jsx'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function () {
    this.open = true
  })
  HTMLDialogElement.prototype.close = vi.fn(function () {
    this.open = false
  })
})

function makeMockEngines(store) {
  return {
    store,
    sound: {
      supported: true,
      init: () => {},
      resume: async () => {},
      startMusic: () => {},
      stopMusic: () => {},
      stopCrackerAudio: () => {},
      fadeCrackerAudio: () => {},
      startCalmPad: () => {},
      stopCalmPad: () => {},
      setIntensity: () => {},
      setMasterVolume: () => {},
      playTestTone: () => {},
      getAudioLevel: () => 0,
    },
    chhotu: {
      setPosition: () => {},
      setFacing: () => {},
      setArmState: () => {},
      jump: () => {},
      walkTo: (fx, fy, tx, ty, d, cb) => cb?.(),
    },
    pip: {
      setPosition: () => {},
      setMood: () => {},
      jump: () => {},
    },
    particles: { flashes: [], clear: () => {} },
    comicBubble: {},
    jellySquash: {},
    renderer: { width: 800, height: 600 },
    background: { setGameState: () => {} },
    layout: {
      chhotuStartX: 0.38,
      chhotuStartY: 0.62,
      pipStartX: 0.3,
      pipStartY: 0.64,
      safeZoneX: 0.15,
      safeZoneY: 0.65,
    },
  }
}

/**
 * Harness component using the real GameStoreProvider, real GameController,
 * and real CrackerCarousel dock to test live user interactions.
 */
function TestHarness({ onReady }) {
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

  // Keep store in engines updated just like in App.jsx
  useEffect(() => {
    if (gc._engines) {
      gc._engines.store = store
    }
  }, [store, gc])

  return (
    <div data-testid="harness">
      <div data-testid="state">{snapshot.state}</div>
      <div data-testid="selected-cracker">{snapshot.selectedCracker ?? 'none'}</div>
      <div data-testid="stars">{store.state.stars}</div>
      <div data-testid="stickers-count">{store.state.stickers.length}</div>
      <CrackerCarousel
        unlocked={store.state.unlocked}
        selectedCracker={snapshot.selectedCracker}
        onSelect={(id) => gc.selectCracker(id)}
      />
      {snapshot.state === STATES.REWARD_CELEBRATION && snapshot.uiData.cracker && (
        <RewardOverlay
          cracker={snapshot.uiData.cracker}
          isNewSticker={snapshot.uiData.isNewSticker}
          onLightAgain={() => gc.lightAgain()}
          onNextCracker={() => gc.nextCracker()}
        />
      )}
    </div>
  )
}

describe('G1 — Eliminate stale unlock, sticker, and introduction queries', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('allows clicking newly unlocked Anar in tray immediately after completing Phuljhari and choosing Light Again', async () => {
    let harnessRefs = null
    render(
      <GameStoreProvider>
        <TestHarness onReady={(refs) => (harnessRefs = refs)} />
      </GameStoreProvider>
    )

    const { gc, store } = harnessRefs
    let finishShow = null
    gc.setCrackerShowFn((idx, engines, onDone) => {
      finishShow = onDone
      return () => {
        finishShow = null
      }
    })

    // 1. Initial state: only Phuljhari (0) is unlocked
    expect(store.isUnlocked(0)).toBe(true)
    expect(store.isUnlocked(1)).toBe(false)

    // 2. Start Phuljhari
    act(() => {
      gc.selectCracker(0)
    })
    expect(gc.state).toBe(STATES.CRACKER_INTRO_CARD)
    act(() => {
      gc.putOnStreet()
    })
    expect(gc.state).toBe(STATES.READY_ON_STREET)

    // 3. Step back & start show
    act(() => {
      gc.tapCracker()
    })
    act(() => {
      gc._startCrackerShow()
    })
    expect(gc.state).toBe(STATES.CRACKER_SHOW_ACTIVE)

    // 4. Show completes: unlocks Anar (1) and awards 3 stars + sticker
    act(() => {
      finishShow()
    })
    expect(gc.state).toBe(STATES.REWARD_CELEBRATION)
    expect(store.getState().stars).toBe(3)
    expect(store.getState().stickers).toContain(0)
    expect(store.getState().unlocked).toContain(1)

    // 5. Choose "Light again"
    act(() => {
      gc.lightAgain()
    })
    expect(gc.state).toBe(STATES.READY_ON_STREET)
    expect(gc.selectedCracker).toBe(0)

    // 6. Click the newly unlocked Anar (1) in the tray
    const choices = screen.getAllByRole('option')
    const anarButton = choices[1]
    expect(anarButton.disabled).toBe(false)

    act(() => {
      fireEvent.click(anarButton)
    })

    // At the audited version, selection was ignored.
    // With G1 fix, selection is accepted immediately!
    expect(gc.selectedCracker).toBe(1)
    expect(gc.state).toBe(STATES.CRACKER_INTRO_CARD)
  })

  it('awards exactly 3 stars on first completion and exactly 1 star with no duplicate sticker on replay', async () => {
    let harnessRefs = null
    render(
      <GameStoreProvider>
        <TestHarness onReady={(refs) => (harnessRefs = refs)} />
      </GameStoreProvider>
    )

    const { gc, store } = harnessRefs
    let finishShow = null
    gc.setCrackerShowFn((idx, engines, onDone) => {
      finishShow = onDone
      return () => {
        finishShow = null
      }
    })

    // First completion of Phuljhari
    act(() => {
      gc.selectCracker(0)
      gc.putOnStreet()
      gc.tapCracker()
      gc._startCrackerShow()
    })
    act(() => {
      finishShow()
    })

    expect(gc.state).toBe(STATES.REWARD_CELEBRATION)
    expect(gc.getSnapshot().uiData.isNewSticker).toBe(true)
    expect(gc.getSnapshot().uiData.starsEarned).toBe(3)
    expect(store.getState().stars).toBe(3)
    expect(store.getState().stickers).toEqual([0])

    // Replay Phuljhari
    act(() => {
      gc.lightAgain()
      gc.tapCracker()
      gc._startCrackerShow()
    })
    act(() => {
      finishShow()
    })

    expect(gc.state).toBe(STATES.REWARD_CELEBRATION)
    // Replay announces 1 star and NOT a new sticker
    expect(gc.getSnapshot().uiData.isNewSticker).toBe(false)
    expect(gc.getSnapshot().uiData.starsEarned).toBe(1)
    // Stored total increases by exactly 1 star (3 -> 4), stickers remains [0]
    expect(store.getState().stars).toBe(4)
    expect(store.getState().stickers).toEqual([0])

    // Second replay of Phuljhari
    act(() => {
      gc.lightAgain()
      gc.tapCracker()
      gc._startCrackerShow()
    })
    act(() => {
      finishShow()
    })

    expect(gc.getSnapshot().uiData.isNewSticker).toBe(false)
    expect(gc.getSnapshot().uiData.starsEarned).toBe(1)
    expect(store.getState().stars).toBe(5)
    expect(store.getState().stickers).toEqual([0])
  })

  it('skips intro card for seen fireworks immediately and across reloads', async () => {
    let harnessRefs = null
    const { unmount } = render(
      <GameStoreProvider>
        <TestHarness onReady={(refs) => (harnessRefs = refs)} />
      </GameStoreProvider>
    )

    const { gc, store } = harnessRefs

    // First time seeing Phuljhari (0)
    act(() => {
      gc.selectCracker(0)
    })
    expect(gc.state).toBe(STATES.CRACKER_INTRO_CARD)
    act(() => {
      gc.putOnStreet()
    })
    expect(gc.state).toBe(STATES.READY_ON_STREET)
    expect(store.getState().seenIntros).toContain(0)

    // Re-select Phuljhari
    act(() => {
      gc.goToIdle()
      gc.selectCracker(0)
    })
    // Intro card is skipped! Directly goes to READY_ON_STREET
    expect(gc.state).toBe(STATES.READY_ON_STREET)

    // Unmount and reload with same localStorage save
    unmount()

    let reloadedRefs = null
    render(
      <GameStoreProvider>
        <TestHarness onReady={(refs) => (reloadedRefs = refs)} />
      </GameStoreProvider>
    )

    act(() => {
      reloadedRefs.gc.selectCracker(0)
    })
    // Still skipped after reload!
    expect(reloadedRefs.gc.state).toBe(STATES.READY_ON_STREET)
  })

  it('grown-up unlock updates selectable content immediately without remounting or returning home', async () => {
    let harnessRefs = null
    render(
      <GameStoreProvider>
        <TestHarness onReady={(refs) => (harnessRefs = refs)} />
      </GameStoreProvider>
    )

    const { gc, store } = harnessRefs

    // Initially, Sutli Bomb (index 5) is locked
    expect(store.isUnlocked(5)).toBe(false)
    act(() => {
      gc.selectCracker(5)
    })
    // Rejected
    expect(gc.selectedCracker).toBe(null)

    // Adult triggers unlockAllCrackers while in the Courtyard
    act(() => {
      store.unlockAllCrackers()
    })

    // Immediately selectable without remounting or navigating away
    const choices = screen.getAllByRole('option')
    expect(choices[5].disabled).toBe(false)

    act(() => {
      fireEvent.click(choices[5])
    })

    expect(gc.selectedCracker).toBe(5)
    expect(gc.state).toBe(STATES.CRACKER_INTRO_CARD)
  })

  it('prevents stale, repeated, or interrupted completion callbacks from granting duplicate awards', async () => {
    let harnessRefs = null
    render(
      <GameStoreProvider>
        <TestHarness onReady={(refs) => (harnessRefs = refs)} />
      </GameStoreProvider>
    )

    const { gc, store } = harnessRefs

    let capturedDoneCallback = null
    gc.setCrackerShowFn((idx, engines, onDone) => {
      capturedDoneCallback = onDone
      return () => {}
    })

    // Start show
    act(() => {
      gc.selectCracker(0)
      gc.putOnStreet()
      gc.tapCracker()
      gc._startCrackerShow()
    })
    expect(gc.state).toBe(STATES.CRACKER_SHOW_ACTIVE)
    expect(typeof capturedDoneCallback).toBe('function')

    // 1. Invoke callback twice in a row
    act(() => {
      capturedDoneCallback()
      capturedDoneCallback() // Duplicate invocation!
    })

    // Should only award once (3 stars, 1 sticker)
    expect(store.getState().stars).toBe(3)
    expect(store.getState().stickers).toEqual([0])

    // 2. Interrupted run via Calm Corner
    act(() => {
      gc.lightAgain()
      gc.tapCracker()
      gc._startCrackerShow()
    })
    expect(gc.state).toBe(STATES.CRACKER_SHOW_ACTIVE)
    const oldRunCallback = capturedDoneCallback

    // Enter Calm Corner (interrupts the active show)
    act(() => {
      gc.enterCalmCorner()
    })
    expect(gc.state).toBe(STATES.CALM_CORNER_OVERLAY)

    // Stale callback from the abandoned run fires while interrupted
    act(() => {
      oldRunCallback()
    })

    // Stars should NOT change
    expect(store.getState().stars).toBe(3)

    // Resume from Calm Corner
    act(() => {
      gc.exitCalmCorner()
    })
    // Calm Corner resume takes it to COUNTDOWN
    expect(gc.state).toBe(STATES.COUNTDOWN_3_2_1)

    // Old callback fires again during countdown
    act(() => {
      oldRunCallback()
    })
    expect(store.getState().stars).toBe(3)
  })
})
