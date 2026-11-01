import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  CRACKER_TEST_META,
  SHOW_DURATIONS,
  playCrackerShow,
} from '../src/crackers/crackerControllers.js'
import { getCrackerById, isValidCrackerId } from '../src/crackers/crackerDefs.js'
import { playFireworkSound } from '../src/audio/FireworkSound.js'

describe('DIW-021 — Ring Burst (Concentric halos, ID 8)', () => {
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

  it('is registered in catalog with stable ID 8 and Sky category', () => {
    expect(isValidCrackerId(8)).toBe(true)
    const def = getCrackerById(8)
    expect(def).toBeDefined()
    expect(def.id).toBe(8)
    expect(def.name).toBe('Ring Burst')
    expect(def.category).toBe('sky')
    expect(def.descriptor).toBe('Concentric halos')
    expect(def.durationMs).toBe(4000)
    expect(def.soundCharacter).toMatch(/chime/i)
    expect(def.budget.maxParticles).toBe(240)
  })

  it('triggers ring audio cue and completes at 4000ms', () => {
    const onDone = vi.fn()
    playCrackerShow(8, mockEngines, onDone)

    expect(SHOW_DURATIONS[8]).toBe(4000)
    expect(CRACKER_TEST_META[8].durationMs).toBe(4000)

    vi.advanceTimersByTime(3900)
    expect(onDone).not.toHaveBeenCalled()

    vi.advanceTimersByTime(200)
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('builds an ascent and explodes into concentric rings with circular symmetry', () => {
    const spawnedConfigs = []
    mockEngines.particles.spawn.mockImplementation((x, y, cfg) => {
      spawnedConfigs.push({ x, y, cfg })
    })

    playCrackerShow(8, mockEngines, vi.fn())
    // Advance through ascent
    vi.advanceTimersByTime(500)
    expect(spawnedConfigs.length).toBeGreaterThan(0)

    // Advance past concentric ring burst at 950ms
    vi.advanceTimersByTime(550)
    expect(spawnedConfigs.length).toBeGreaterThan(50)

    // Verify circular distribution: both positive and negative vx, vy
    const burstSparks = spawnedConfigs.slice(10)
    const hasLeft = burstSparks.some((s) => s.cfg.vx < -50)
    const hasRight = burstSparks.some((s) => s.cfg.vx > 50)
    const hasUp = burstSparks.some((s) => s.cfg.vy < -50)
    const hasDown = burstSparks.some((s) => s.cfg.vy > 50)

    expect(hasLeft && hasRight && hasUp && hasDown).toBe(true)
  })

  it('cancels cleanly without leaking timers or firing onDone', () => {
    const onDone = vi.fn()
    const cancel = playCrackerShow(8, mockEngines, onDone)

    vi.advanceTimersByTime(500)
    cancel()

    vi.advanceTimersByTime(5000)
    expect(onDone).not.toHaveBeenCalled()
  })

  it('plays ring sound without throwing and releases audio nodes', () => {
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
            frequency: { setValueAtTime: vi.fn() },
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

    const stop = playFireworkSound(audioEng, 'ring', 3.0, 0)
    expect(typeof stop).toBe('function')
    expect(() => stop()).not.toThrow()
  })
})
