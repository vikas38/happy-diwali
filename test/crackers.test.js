// ===================================================================
// Cracker Controllers Tests
// ===================================================================
// Tests: cracker show metadata integrity, reward confetti, timing,
//        Ladi 8-pop sequence, and SHOW_DURATIONS correctness.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  CRACKER_TEST_META,
  SHOW_DURATIONS,
  fireRewardConfetti,
  playCrackerShow,
} from '../src/crackers/crackerControllers.js'
import { CRACKERS } from '../src/crackers/crackerDefs.js'

// ---- Cracker definition integrity ----
describe('Cracker definitions integrity', () => {
  it('has exactly 6 crackers defined', () => {
    expect(CRACKERS).toHaveLength(6)
  })

  it.each(CRACKERS.map((c, i) => [i, c]))('cracker %i has required fields', (i, cracker) => {
    expect(cracker).toMatchObject({
      id: i,
      name: expect.any(String),
      emoji: expect.any(String),
      description: expect.any(String),
      intensityDots: expect.any(Number),
      colors: expect.any(Array),
      comicWord: expect.any(String),
      audioProfile: expect.any(String),
    })
    expect(cracker.intensityDots).toBeGreaterThanOrEqual(1)
    expect(cracker.intensityDots).toBeLessThanOrEqual(4)
    expect(cracker.colors.length).toBeGreaterThan(0)
  })

  it('intensity dots escalate correctly (1→2→2→3→3→4)', () => {
    const dots = CRACKERS.map(c => c.intensityDots)
    expect(dots).toEqual([1, 2, 2, 3, 3, 4])
  })

  it('comic words match the spec exactly', () => {
    expect(CRACKERS[0].comicWord).toBe('TWINKLE ✨')
    expect(CRACKERS[1].comicWord).toBe('FIZZZZZ 🌸')
    expect(CRACKERS[2].comicWord).toBe('WHEEEEE 🌀')
    expect(CRACKERS[3].comicWord).toBe('WHOOSH... POP! 🚀')
    expect(CRACKERS[4].comicWord).toBe('POP! POP! POP! 🎉')
    expect(CRACKERS[5].comicWord).toBe('BOOOOM! 💥🌈')
  })
})

// ---- CRACKER_TEST_META ----
describe('CRACKER_TEST_META', () => {
  it('has entries for all 6 crackers', () => {
    for (let i = 0; i < 6; i++) {
      expect(CRACKER_TEST_META[i]).toBeDefined()
      expect(CRACKER_TEST_META[i].audioType).toBeTruthy()
      expect(CRACKER_TEST_META[i].particleShape).toBeTruthy()
      expect(CRACKER_TEST_META[i].durationMs).toBeGreaterThan(0)
    }
  })

  it('durations match SHOW_DURATIONS', () => {
    for (let i = 0; i < 6; i++) {
      expect(CRACKER_TEST_META[i].durationMs).toBe(SHOW_DURATIONS[i])
    }
  })

  it('Phuljhari uses granular crackle and incandescent sparks', () => {
    expect(CRACKER_TEST_META[0].audioType).toBe('granular-crackle')
    expect(CRACKER_TEST_META[0].particleShape).toBe('spark')
  })

  it('Sutli Bomb is a sub-drop with incandescent sparks', () => {
    expect(CRACKER_TEST_META[5].audioType).toBe('sub-drop')
    expect(CRACKER_TEST_META[5].particleShape).toBe('spark')
  })
})

// ---- SHOW_DURATIONS ----
describe('SHOW_DURATIONS', () => {
  it('has 6 entries', () => {
    expect(Object.keys(SHOW_DURATIONS)).toHaveLength(6)
  })

  it('escalates from Phuljhari to Sutli Bomb', () => {
    expect(SHOW_DURATIONS[0]).toBeLessThan(SHOW_DURATIONS[5])
  })

  it('Phuljhari is 3000ms', () => {
    expect(SHOW_DURATIONS[0]).toBe(3000)
  })

  it('Sutli Bomb is 5000ms', () => {
    expect(SHOW_DURATIONS[5]).toBe(5000)
  })

  it('Ladi duration accounts for 8 pops at 180ms + settle (≥1440ms)', () => {
    // 8 pops × 180ms = 1440ms; total must be well above that
    expect(SHOW_DURATIONS[4]).toBeGreaterThan(1440)
  })
})

// ---- fireRewardConfetti ----
describe('fireRewardConfetti', () => {
  it('spawns particles on both sides of the screen', () => {
    const spawnCalls = []
    const mockParticles = {
      spawn: vi.fn((x, y, cfg) => spawnCalls.push({ x, y, cfg })),
    }

    fireRewardConfetti(mockParticles, 400, 800)

    expect(mockParticles.spawn).toHaveBeenCalled()
    const leftCalls = spawnCalls.filter(c => c.x < 200)
    const rightCalls = spawnCalls.filter(c => c.x > 200)
    expect(leftCalls.length).toBeGreaterThan(0)
    expect(rightCalls.length).toBeGreaterThan(0)
  })

  it('spawns confetti or star shapes', () => {
    const spawnCalls = []
    const mockParticles = {
      spawn: vi.fn((x, y, cfg) => spawnCalls.push(cfg)),
    }
    fireRewardConfetti(mockParticles, 400, 800)
    const shapes = new Set(spawnCalls.map(c => c.shape))
    expect([...shapes].every(s => ['confetti', 'star'].includes(s))).toBe(true)
  })

  it('all spawned particles have positive alpha and decay', () => {
    const spawnCalls = []
    const mockParticles = {
      spawn: vi.fn((x, y, cfg) => spawnCalls.push(cfg)),
    }
    fireRewardConfetti(mockParticles, 400, 800)
    spawnCalls.forEach(cfg => {
      expect(cfg.alpha).toBe(1)
      expect(cfg.decay).toBeGreaterThan(0)
    })
  })
})

// ---- playCrackerShow ----
describe('playCrackerShow', () => {
  let mockEngines

  beforeEach(() => {
    vi.useFakeTimers()
    mockEngines = {
      sound: {
        ctx: null,
        supported: false,
        intensityGain: null,
        _noiseBuffers: {},
        trackCrackerNode: vi.fn(),
        createNoiseSource: vi.fn(() => null),
      },
      particles: {
        spawn: vi.fn(),
        burst: vi.fn(),
        pool: [],
      },
      comicBubble: { spawn: vi.fn() },
      jellySquash: { trigger: vi.fn() },
      renderer: { width: 400, height: 800 },
      chhotu: {},
      pip: {},
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it.each([0, 1, 2, 3, 4, 5])('calls onDone for cracker %i after show duration', (i) => {
    const onDone = vi.fn()
    playCrackerShow(i, mockEngines, onDone)
    vi.advanceTimersByTime(SHOW_DURATIONS[i] + 100)
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('returns a cancel function', () => {
    const cancel = playCrackerShow(0, mockEngines, vi.fn())
    expect(typeof cancel).toBe('function')
  })

  it('cancel function prevents onDone from firing', () => {
    const onDone = vi.fn()
    const cancel = playCrackerShow(0, mockEngines, onDone)
    cancel()
    vi.advanceTimersByTime(SHOW_DURATIONS[0] + 500)
    expect(onDone).not.toHaveBeenCalled()
  })

  it('Ladi triggers jellySquash on even pops', () => {
    playCrackerShow(4, mockEngines, vi.fn())
    // Pop 0 is at 0ms, pop 2 at 360ms, pop 4 at 720ms, pop 6 at 1080ms
    vi.advanceTimersByTime(SHOW_DURATIONS[4] + 100)
    expect(mockEngines.jellySquash.trigger).toHaveBeenCalled()
  })

  it('Sutli Bomb triggers jellySquash on boom', () => {
    playCrackerShow(5, mockEngines, vi.fn())
    vi.advanceTimersByTime(1600) // past boom at 1500ms
    expect(mockEngines.jellySquash.trigger).toHaveBeenCalledWith(0.035)
  })
})

// ---- Ladi 8-pop timing ----
describe('Ladi 8-pop timing sequence', () => {
  it('8 pops fire 180ms apart', () => {
    vi.useFakeTimers()

    const popTimes = []
    const mockEngines = {
      sound: { ctx: null, supported: false, trackCrackerNode: vi.fn(), _noiseBuffers: {} },
      particles: { spawn: vi.fn() },
      comicBubble: { spawn: vi.fn() },
      jellySquash: { trigger: vi.fn() },
      renderer: { width: 400, height: 800 },
      chhotu: {}, pip: {},
    }

    // Intercept particle spawns as proxy for pops
    let popCount = 0
    mockEngines.particles.spawn.mockImplementation(() => { popCount++ })

    playCrackerShow(4, mockEngines, vi.fn())

    // Advance time in 180ms increments and count pop groups
    for (let i = 0; i < 8; i++) {
      vi.advanceTimersByTime(180)
    }

    // At least 8 × 20 particles spawned (each pop emits 20)
    expect(popCount).toBeGreaterThanOrEqual(8 * 20)

    vi.useRealTimers()
  })
})

// Regression: stopping a continuous show must stop particle production too.
describe('Firework lifecycle', () => {
  it.each([0,1,2,3,4,5])('cancels every emitter and delayed burst for firework %i', index => {
    vi.useFakeTimers()
    const particles={spawn:vi.fn(),flash:vi.fn()},done=vi.fn()
    const cancel=playCrackerShow(index,{particles,renderer:{width:1000,height:700},sound:{supported:false},jellySquash:{trigger:vi.fn()}},done)
    vi.advanceTimersByTime(400); cancel()
    const emitted=particles.spawn.mock.calls.length
    vi.advanceTimersByTime(10000)
    expect(particles.spawn).toHaveBeenCalledTimes(emitted)
    expect(done).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
    vi.useRealTimers()
  })
  it('suppresses camera movement when reduced motion is requested',()=>{
    vi.useFakeTimers()
    const trigger=vi.fn()
    const cancel=playCrackerShow(5,{particles:{spawn:vi.fn(),flash:vi.fn()},renderer:{width:1000,height:700,_reducedMotion:true},sound:{supported:false},jellySquash:{trigger}},vi.fn())
    vi.advanceTimersByTime(1600);expect(trigger).not.toHaveBeenCalled();cancel();vi.useRealTimers()
  })
})
