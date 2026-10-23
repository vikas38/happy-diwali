import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GameController, STATES } from '../src/fsm/GameController.js'
import { ARM_STATES } from '../src/render/characters/ChhotuChamp.js'
import { PIP_MOODS } from '../src/render/characters/Pip.js'

// Mock engine factory for testing the FSM logic
function makeMockEngines() {
  const soundCalls = []
  const sound = {
    supported: true,
    init: () => soundCalls.push('init'),
    resume: () => Promise.resolve(),
    startMusic: () => soundCalls.push('startMusic'),
    stopMusic: () => soundCalls.push('stopMusic'),
    setIntensity: () => {},
    setMasterVolume: () => {},
    playTestTone: (freq, dur) => soundCalls.push(['tone', freq]),
    fadeCrackerAudio: () => soundCalls.push('fadeCracker'),
    stopCrackerAudio: () => soundCalls.push('stopCracker'),
    startCalmPad: () => soundCalls.push('startCalmPad'),
    stopCalmPad: () => soundCalls.push('stopCalmPad'),
    getAudioLevel: () => 0,
    _calls: soundCalls,
  }

  const storeState = {
    unlocked: [0],
    stickers: [],
    stars: 0,
    masterVolume: 0.7,
    intensity: 'SOFT',
    seenIntros: [],
  }
  const store = {
    isUnlocked: (i) => storeState.unlocked.includes(i),
    hasSeenIntro: (i) => storeState.seenIntros.includes(i),
    hasSticker: (i) => storeState.stickers.includes(i),
    markIntroSeen: (i) => storeState.seenIntros.push(i),
    collectSticker: (i) => {
      storeState.stickers.push(i)
      storeState.stars += 3
    },
    addStars: (n) => {
      storeState.stars += n
    },
    unlockCracker: (i) => {
      if (!storeState.unlocked.includes(i)) storeState.unlocked.push(i)
    },
    setIntensity: (v) => {
      storeState.intensity = v
    },
    setMasterVolume: (v) => {
      storeState.masterVolume = v
    },
    getState: () => storeState,
  }

  const chhotu = {
    x: 0,
    y: 0,
    facing: 1,
    walkActive: false,
    jumpActive: false,
    setPosition: (x, y) => {
      chhotu.x = x
      chhotu.y = y
    },
    setFacing: (f) => {
      chhotu.facing = f
    },
    setArmState: vi.fn(),
    walkTo: (fx, fy, tx, ty, dur, cb) => {
      chhotu.x = tx
      chhotu.y = ty
      chhotu._walkCb = cb // store callback but don't call (simulates async walk)
    },
    jump: vi.fn(),
    reset: vi.fn(),
  }

  const pip = {
    x: 0,
    y: 0,
    _jumpActive: false,
    setPosition: (x, y) => {
      pip.x = x
      pip.y = y
    },
    setMood: vi.fn(),
    jump: vi.fn(),
  }

  const particles = { clear: vi.fn(), burst: vi.fn(), spawn: vi.fn() }
  const comicBubble = { spawn: vi.fn(), clear: vi.fn() }
  const jellySquash = { trigger: vi.fn(), reset: vi.fn() }
  const renderer = { width: 400, height: 700 }

  return { sound, store, chhotu, pip, particles, comicBubble, jellySquash, renderer }
}

describe('GameController — initial state', () => {
  it('starts in SAFETY_SPLASH', () => {
    const gc = new GameController()
    expect(gc.state).toBe(STATES.SAFETY_SPLASH)
  })

  it('has no selected cracker initially', () => {
    const gc = new GameController()
    expect(gc.selectedCracker).toBeNull()
  })
})

describe('GameController — legal transitions', () => {
  let gc, engines

  beforeEach(() => {
    gc = new GameController()
    engines = makeMockEngines()
    gc.init(engines)
  })

  it('transitions SAFETY_SPLASH → IDLE via startGame', () => {
    gc.startGame()
    expect(gc.state).toBe(STATES.IDLE)
  })

  it('transitions IDLE → CRACKER_INTRO_CARD for first-time cracker', () => {
    gc.startGame()
    gc.selectCracker(0)
    expect(gc.state).toBe(STATES.CRACKER_INTRO_CARD)
  })

  it('transitions IDLE → READY_ON_STREET for already-seen cracker', () => {
    engines.store.markIntroSeen(0)
    gc.startGame()
    gc.selectCracker(0)
    expect(gc.state).toBe(STATES.READY_ON_STREET)
  })

  it('transitions CRACKER_INTRO_CARD → READY_ON_STREET via putOnStreet', () => {
    gc.startGame()
    gc.selectCracker(0)
    gc.putOnStreet()
    expect(gc.state).toBe(STATES.READY_ON_STREET)
    expect(engines.store.hasSeenIntro(0)).toBe(true)
  })

  it('transitions READY_ON_STREET → STEPPING_BACK via tapCracker', () => {
    engines.store.markIntroSeen(0)
    gc.startGame()
    gc.selectCracker(0)
    gc.tapCracker()
    expect(gc.state).toBe(STATES.STEPPING_BACK_SAFE_ROUTINE)
  })

  it('full flow: splash → intro → ready → step → countdown → show → reward', () => {
    // Fast-forward timers
    vi.useFakeTimers()

    gc.startGame()
    gc.selectCracker(0) // → CRACKER_INTRO_CARD
    gc.putOnStreet() // → READY_ON_STREET
    gc.tapCracker() // → STEPPING_BACK (mock walk stores callback)
    engines.chhotu._walkCb() // simulate walk completion → COUNTDOWN
    expect(gc.state).toBe(STATES.COUNTDOWN_3_2_1)

    // Advance through countdown (4 beats * 800ms) → show → reward
    // Mock show completes instantly (no _crackerShowFn), so we reach reward
    vi.advanceTimersByTime(3200)
    expect(gc.state).toBe(STATES.REWARD_CELEBRATION)

    vi.useRealTimers()
  })
})

describe('GameController — illegal transitions', () => {
  let gc, engines

  beforeEach(() => {
    gc = new GameController()
    engines = makeMockEngines()
    gc.init(engines)
  })

  it('rejects SAFETY_SPLASH → READY_ON_STREET directly', () => {
    const result = gc._setState(STATES.READY_ON_STREET)
    expect(result).toBe(false)
    expect(gc.state).toBe(STATES.SAFETY_SPLASH)
  })

  it('rejects IDLE → CRACKER_SHOW_ACTIVE directly', () => {
    gc.startGame()
    const result = gc._setState(STATES.CRACKER_SHOW_ACTIVE)
    expect(result).toBe(false)
    expect(gc.state).toBe(STATES.IDLE)
  })

  it('rejects READY_ON_STREET → REWARD_CELEBRATION directly', () => {
    engines.store.markIntroSeen(0)
    gc.startGame()
    gc.selectCracker(0)
    const result = gc._setState(STATES.REWARD_CELEBRATION)
    expect(result).toBe(false)
  })

  it('tapCracker does nothing when not in READY_ON_STREET', () => {
    gc.startGame()
    gc.tapCracker() // should do nothing in IDLE
    expect(gc.state).toBe(STATES.IDLE)
  })

  it('selectCracker rejects locked crackers', () => {
    gc.startGame()
    gc.selectCracker(5) // not unlocked
    expect(gc.state).toBe(STATES.IDLE)
    expect(gc.selectedCracker).toBeNull()
  })
})

describe('GameController — calm corner interrupt', () => {
  let gc, engines

  beforeEach(() => {
    gc = new GameController()
    engines = makeMockEngines()
    gc.init(engines)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('can enter calm corner from any state (except safety splash)', () => {
    gc.startGame()
    gc.enterCalmCorner()
    expect(gc.state).toBe(STATES.CALM_CORNER_OVERLAY)
    expect(gc._prevState).toBe(STATES.IDLE)
  })

  it('does not enter calm corner from SAFETY_SPLASH', () => {
    gc.enterCalmCorner()
    expect(gc.state).toBe(STATES.SAFETY_SPLASH)
  })

  it('stores previous state and resumes to it', () => {
    engines.store.markIntroSeen(0)
    gc.startGame()
    gc.selectCracker(0) // → READY_ON_STREET
    expect(gc.state).toBe(STATES.READY_ON_STREET)

    gc.enterCalmCorner()
    expect(gc.state).toBe(STATES.CALM_CORNER_OVERLAY)
    expect(gc._prevState).toBe(STATES.READY_ON_STREET)

    gc.exitCalmCorner()
    expect(gc.state).toBe(STATES.READY_ON_STREET)
  })

  it('clears timers when entering calm corner', () => {
    gc.startGame()
    engines.store.markIntroSeen(0)
    gc.selectCracker(0)
    gc.tapCracker()
    engines.chhotu._walkCb() // walk completes → countdown starts with timers
    expect(gc._timers.length).toBeGreaterThan(0)

    gc.enterCalmCorner()
    expect(gc._timers.length).toBe(0)
  })

  it('starts calm pad on enter and stops on exit', () => {
    gc.startGame()
    gc.enterCalmCorner()
    expect(engines.sound._calls).toContain('startCalmPad')

    gc.exitCalmCorner()
    expect(engines.sound._calls).toContain('stopCalmPad')
  })

  it('resumes countdown when exiting from COUNTDOWN', () => {
    engines.store.markIntroSeen(0)
    gc.startGame()
    gc.selectCracker(0)
    gc.tapCracker()
    engines.chhotu._walkCb() // walk completes → countdown starts
    expect(gc.state).toBe(STATES.COUNTDOWN_3_2_1)

    gc.enterCalmCorner()
    expect(gc.state).toBe(STATES.CALM_CORNER_OVERLAY)

    gc.exitCalmCorner()
    expect(gc.state).toBe(STATES.COUNTDOWN_3_2_1)
  })

  it('cannot enter calm corner when already in calm corner', () => {
    gc.startGame()
    gc.enterCalmCorner()
    gc.enterCalmCorner() // should be a no-op
    expect(gc._prevState).toBe(STATES.IDLE) // not overwritten
  })
})

describe('GameController — reward & next cracker', () => {
  let gc, engines

  beforeEach(() => {
    gc = new GameController()
    engines = makeMockEngines()
    gc.init(engines)
    gc.setCrackerShowFn((index, eng, onDone) => onDone())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('awards stars and unlocks sticker on cracker completion', () => {
    engines.store.markIntroSeen(0)
    gc.startGame()
    gc.selectCracker(0)
    gc.tapCracker()
    engines.chhotu._walkCb() // walk completes → countdown starts
    vi.advanceTimersByTime(3200) // countdown completes → show → complete
    expect(gc.state).toBe(STATES.REWARD_CELEBRATION)
    expect(engines.store.getState().stickers).toContain(0)
    expect(engines.store.getState().stars).toBe(3)
  })

  it('unlocks the next cracker on completion', () => {
    engines.store.markIntroSeen(0)
    gc.startGame()
    gc.selectCracker(0)
    gc.tapCracker()
    engines.chhotu._walkCb() // walk completes → countdown starts
    vi.advanceTimersByTime(3200)
    expect(engines.store.isUnlocked(1)).toBe(true)
  })

  it('lightAgain returns to READY_ON_STREET with same cracker', () => {
    engines.store.markIntroSeen(0)
    gc.startGame()
    gc.selectCracker(0)
    gc.tapCracker()
    engines.chhotu._walkCb() // walk completes → countdown starts
    vi.advanceTimersByTime(3200)
    gc.lightAgain()
    expect(gc.state).toBe(STATES.READY_ON_STREET)
    expect(gc.selectedCracker).toBe(0)
  })

  it('nextCracker goes to intro for the next cracker if not seen', () => {
    engines.store.markIntroSeen(0)
    gc.startGame()
    gc.selectCracker(0)
    gc.tapCracker()
    engines.chhotu._walkCb() // walk completes → countdown starts
    vi.advanceTimersByTime(3200)
    gc.nextCracker()
    expect(gc.state).toBe(STATES.CRACKER_INTRO_CARD)
    expect(gc.selectedCracker).toBe(1)
  })
})

describe('GameController — show cancellation', () => {
  it.each(['calm', 'dispose'])(
    'cancels running emitters on %s and ignores their stale completion',
    (action) => {
      vi.useFakeTimers()
      const gc = new GameController(),
        engines = makeMockEngines()
      const cancel = vi.fn()
      let finish
      gc.init(engines)
      gc.setCrackerShowFn((index, eng, done) => {
        finish = done
        return cancel
      })
      gc.startGame()
      engines.store.markIntroSeen(0)
      gc.selectCracker(0)
      gc.tapCracker()
      engines.chhotu._walkCb()
      vi.advanceTimersByTime(3200)
      expect(gc.state).toBe(STATES.CRACKER_SHOW_ACTIVE)
      if (action === 'calm') gc.enterCalmCorner()
      else gc.dispose()
      expect(cancel).toHaveBeenCalledOnce()
      finish()
      if (action === 'calm') expect(gc.state).toBe(STATES.CALM_CORNER_OVERLAY)
      expect(engines.store.getState().stars).toBe(0)
      vi.useRealTimers()
    }
  )
})

describe('DIW-001 interruption ownership', () => {
  it('retains cancellation of the restarted show after an abandoned callback fires', () => {
    vi.useFakeTimers()
    const gc = new GameController(STATES.IDLE)
    const engines = makeMockEngines()
    const runs = []
    gc.init(engines)
    gc.setCrackerShowFn((index, refs, done) => {
      const cancel = vi.fn()
      runs.push({ done, cancel })
      return cancel
    })
    try {
      gc.selectCracker(0)
      gc.putOnStreet()
      gc.tapCracker()
      engines.chhotu._walkCb()
      vi.advanceTimersByTime(3200)
      gc.enterCalmCorner()
      expect(runs[0].cancel).toHaveBeenCalledOnce()
      gc.exitCalmCorner()
      vi.advanceTimersByTime(3200)
      expect(runs).toHaveLength(2)
      runs[0].done()
      gc.openStickerBook()
      expect(runs[1].cancel).toHaveBeenCalledOnce()
      runs[1].done()
      expect(engines.store.getState().stars).toBe(0)
      expect(gc.state).toBe(STATES.STICKER_BOOK_OVERLAY)
    } finally {
      gc.dispose()
      vi.useRealTimers()
    }
  })

  it('ignores a stale close action after switching overlays and restores the introduction', () => {
    const gc = new GameController(STATES.IDLE)
    gc.init(makeMockEngines())
    gc.selectCracker(0)
    const intro = gc.getSnapshot()
    gc.openSettings()
    gc.openStickerBook()
    gc.closeSettings()
    expect(gc.state).toBe(STATES.STICKER_BOOK_OVERLAY)
    gc.closeStickerBook()
    expect(gc.getSnapshot()).toEqual(intro)
    gc.dispose()
  })

  it('stops the calm pad when switching to another overlay', () => {
    const gc = new GameController(STATES.IDLE)
    const engines = makeMockEngines()
    gc.init(engines)
    gc.enterCalmCorner()
    engines.sound._calls.length = 0
    gc.openSettings()
    expect(engines.sound._calls).toContain('stopCalmPad')
    expect(engines.sound._calls).not.toContain('startCalmPad')
    gc.dispose()
  })
})

describe('Adult ignition regression', () => {
  it('keeps the child out of the lighting pose before countdown', () => {
    const gc = new GameController(),
      engines = makeMockEngines()
    gc.init(engines)
    gc.startGame()
    gc.selectCracker(0)
    gc.putOnStreet()
    gc.tapCracker()
    expect(gc.state).toBe(STATES.STEPPING_BACK_SAFE_ROUTINE)
    expect(engines.chhotu.setArmState).not.toHaveBeenCalledWith(ARM_STATES.LIGHTING_REACH)
    engines.chhotu._walkCb()
    expect(gc.state).toBe(STATES.COUNTDOWN_3_2_1)
    gc.dispose()
  })
})
