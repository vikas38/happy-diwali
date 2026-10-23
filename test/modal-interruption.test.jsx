import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest'
import React, { useEffect, useRef } from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { GameStoreProvider, useGameStore } from '../src/store/gameStore.jsx'
import { GameController, STATES } from '../src/fsm/GameController.js'
import HUD from '../src/ui/HUD.jsx'
import StickerBook from '../src/ui/StickerBook.jsx'
import RewardOverlay from '../src/ui/RewardOverlay.jsx'
import CalmCorner from '../src/ui/CalmCorner.jsx'
import CrackerCarousel from '../src/ui/CrackerCarousel.jsx'
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

function TestModalApp({ onReady }) {
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
      <div data-testid="fsm-state">{fsmState}</div>

      <HUD
        masterVolume={store.state.masterVolume}
        intensity={store.state.intensity}
        stars={store.state.stars}
        settingsOpen={fsmState === STATES.SETTINGS_OVERLAY}
        onOpenSettings={() => gc.openSettings()}
        onCloseSettings={() => gc.closeSettings()}
        onVolumeChange={(v) => gc.setMasterVolume(v)}
        onIntensityChange={(i) => gc.setIntensity(i)}
        onOpenStickerBook={() => gc.openStickerBook()}
        onCalmCorner={() => gc.enterCalmCorner()}
      />

      <CrackerCarousel
        unlocked={store.state.unlocked}
        selectedCracker={selectedCracker}
        onSelect={(id) => gc.selectCracker(id)}
      />

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

      {fsmState === STATES.STICKER_BOOK_OVERLAY && (
        <StickerBook
          stickers={store.state.stickers}
          onClose={() => gc.closeStickerBook()}
          onUnlockAll={() => {
            store.unlockAllCrackers()
            gc.closeStickerBook()
          }}
        />
      )}
    </div>
  )
}

describe('G3 — Make Sticker Book and settings participate in interruption', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('suspends countdown when Sticker Book is opened and prevents background show completion', async () => {
    let refs = null
    render(
      <GameStoreProvider>
        <TestModalApp onReady={(r) => (refs = r)} />
      </GameStoreProvider>
    )

    const { gc, store } = refs
    act(() => {
      store.markIntroSeen(0)
      gc.selectCracker(0)
      gc.tapCracker()
    })
    // Chhotu walk completes -> countdown starts (beat 0: 3)
    act(() => {
      refs.engines.chhotu._walkCb?.()
    })
    expect(gc.state).toBe(STATES.COUNTDOWN_3_2_1)

    // Open Sticker Book during countdown
    const collectionBtn = screen.getByLabelText(/open sticker book/i)
    act(() => {
      fireEvent.click(collectionBtn)
    })

    expect(gc.state).toBe(STATES.STICKER_BOOK_OVERLAY)
    expect(screen.getByRole('dialog', { name: /sticker/i })).toBeDefined()

    // Advance time while Sticker Book is open
    act(() => {
      vi.advanceTimersByTime(5000)
    })

    // Countdown did NOT complete into show or award stars behind the modal
    expect(store.getState().stars).toBe(0)
    expect(store.getState().stickers).toEqual([])

    // Close Sticker Book
    const closeBtn = screen.getByLabelText(/close/i)
    act(() => {
      fireEvent.click(closeBtn)
    })

    // Safely resumes countdown without hidden completion
    expect(gc.state).toBe(STATES.COUNTDOWN_3_2_1)
    expect(store.getState().stars).toBe(0)
  })

  it('cancels active firework effect when Sticker Book is opened and prevents awards from abandoned show', async () => {
    let refs = null
    render(
      <GameStoreProvider>
        <TestModalApp onReady={(r) => (refs = r)} />
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

    // Open Sticker Book during active firework show
    act(() => {
      gc.openStickerBook()
    })
    expect(gc.state).toBe(STATES.STICKER_BOOK_OVERLAY)

    // Abandoned show callback fires while Sticker Book is open
    act(() => {
      abandonedShowCallback?.()
    })
    expect(store.getState().stars).toBe(0)

    // Close Sticker Book: restarts safely through complete visible countdown
    act(() => {
      gc.closeStickerBook()
    })
    expect(gc.state).toBe(STATES.COUNTDOWN_3_2_1)

    // Old callback fires again: still ignored
    act(() => {
      abandonedShowCallback?.()
    })
    expect(store.getState().stars).toBe(0)
  })

  it('preserves exact reward state when opening and closing Sticker Book from reward celebration', async () => {
    let refs = null
    render(
      <GameStoreProvider>
        <TestModalApp onReady={(r) => (refs = r)} />
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
      store.markIntroSeen(0)
      gc.selectCracker(0)
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

    // Open Sticker Book directly from reward
    act(() => {
      gc.openStickerBook()
    })
    expect(gc.state).toBe(STATES.STICKER_BOOK_OVERLAY)

    // Close Sticker Book
    act(() => {
      gc.closeStickerBook()
    })

    // Original reward returns unchanged and is not re-awarded
    expect(gc.state).toBe(STATES.REWARD_CELEBRATION)
    expect(gc.getSnapshot().uiData.isNewSticker).toBe(true)
    expect(gc.getSnapshot().uiData.starsEarned).toBe(3)
    expect(store.getState().stars).toBe(3)
  })

  it('guarantees exactly one dialog is active at a time and switching between modals does not create traps', async () => {
    let refs = null
    render(
      <GameStoreProvider>
        <TestModalApp onReady={(r) => (refs = r)} />
      </GameStoreProvider>
    )

    const { gc } = refs

    // Open settings
    act(() => {
      gc.openSettings()
    })
    expect(gc.state).toBe(STATES.SETTINGS_OVERLAY)
    expect(screen.queryAllByRole('dialog').length).toBe(1)

    // Switch directly from settings to Sticker Book
    act(() => {
      gc.openStickerBook()
    })
    expect(gc.state).toBe(STATES.STICKER_BOOK_OVERLAY)
    expect(screen.queryAllByRole('dialog').length).toBe(1)

    // Switch directly from Sticker Book to Calm Corner
    act(() => {
      gc.enterCalmCorner()
    })
    expect(gc.state).toBe(STATES.CALM_CORNER_OVERLAY)
    expect(screen.queryAllByRole('dialog').length).toBe(1)

    // Close Calm Corner returns cleanly to initial gameplay state (IDLE)
    act(() => {
      gc.exitCalmCorner()
    })
    expect(gc.state).toBe(STATES.IDLE)
    expect(screen.queryAllByRole('dialog').length).toBe(0)
  })
})
