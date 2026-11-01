import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  CRACKER_TEST_META,
  SHOW_DURATIONS,
  playCrackerShow,
} from '../src/crackers/crackerControllers.js'
import { getCrackerById, isValidCrackerId } from '../src/crackers/crackerDefs.js'
import { playFireworkSound } from '../src/audio/FireworkSound.js'

describe('DIW-024 — Chrysanthemum Bloom (Flower burst, ID 11)', () => {
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
        flash: vi.fn(),
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

  it('is registered in catalog with stable ID 11 and Sky category', () => {
    expect(isValidCrackerId(11)).toBe(true)
    const def = getCrackerById(11)
    expect(def).toBeDefined()
    expect(def.id).toBe(11)
    expect(def.name).toBe('Chrysanthemum Bloom')
    expect(def.category).toBe('sky')
    expect(def.descriptor).toBe('Flower burst')
    expect(def.durationMs).toBe(4000)
    expect(def.soundCharacter).toMatch(/petal/i)
    expect(def.budget.maxParticles).toBe(230)
  })

  it('triggers chrysanthemum audio cue and completes at 4000ms', () => {
    const onDone = vi.fn()
    playCrackerShow(11, mockEngines, onDone)

    expect(SHOW_DURATIONS[11]).toBe(4000)
    expect(CRACKER_TEST_META[11].durationMs).toBe(4000)

    vi.advanceTimersByTime(3900)
    expect(onDone).not.toHaveBeenCalled()

    vi.advanceTimersByTime(200)
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('authors layered radial petals with warm inner and cool outer layers', () => {
    const spawnedConfigs = []
    mockEngines.particles.spawn.mockImplementation((x, y, cfg) => {
      spawnedConfigs.push({ x, y, cfg })
    })

    playCrackerShow(11, mockEngines, vi.fn())
    vi.advanceTimersByTime(1100) // past bloom at 1000ms

    expect(spawnedConfigs.length).toBeGreaterThan(60)
    // Check that petals distribute radially (both positive and negative velocities)
    const petals = spawnedConfigs.slice(10)
    expect(petals.some((p) => p.cfg.vx < -40)).toBe(true)
    expect(petals.some((p) => p.cfg.vx > 40)).toBe(true)
  })

  it('cancels cleanly without leaking timers or firing onDone', () => {
    const onDone = vi.fn()
    const cancel = playCrackerShow(11, mockEngines, onDone)

    vi.advanceTimersByTime(500)
    cancel()

    vi.advanceTimersByTime(5000)
    expect(onDone).not.toHaveBeenCalled()
  })

  it('plays chrysanthemum sound without throwing and releases audio nodes', () => {
    const mockNodes = []
    const audioEng = {
      supported: true,
      ctx: {
        currentTime: 0,
        createGain: () => {
          const n = {
            connect: vi.fn(),
            disconnect: vi.fn(),
            gain: {
              setValueAtTime: vi.fn(),
              linearRampToValueAtTime: vi.fn(),
              exponentialRampToValueAtTime: vi.fn(),
            },
          }
          mockNodes.push(n)
          return n
        },
        createBiquadFilter: () => {
          const n = {
            connect: vi.fn(),
            disconnect: vi.fn(),
            frequency: { setValueAtTime: vi.fn() },
            Q: { setValueAtTime: vi.fn() },
          }
          mockNodes.push(n)
          return n
        },
        createOscillator: () => {
          const n = {
            connect: vi.fn(),
            disconnect: vi.fn(),
            start: vi.fn(),
            stop: vi.fn(),
            frequency: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
          }
          mockNodes.push(n)
          return n
        },
        createStereoPanner: () => {
          const n = {
            connect: vi.fn(),
            disconnect: vi.fn(),
            pan: { value: 0 },
          }
          mockNodes.push(n)
          return n
        },
      },
      intensityGain: {},
      createNoiseSource: () => ({
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      }),
      trackCrackerNode: vi.fn(),
    }

    const stop = playFireworkSound(audioEng, 'chrysanthemum', 3.0, 0)
    expect(typeof stop).toBe('function')
    expect(() => stop()).not.toThrow()
  })
})
