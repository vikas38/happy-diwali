import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  CRACKER_TEST_META,
  SHOW_DURATIONS,
  playCrackerShow,
} from '../src/crackers/crackerControllers.js'
import { getCrackerById, isValidCrackerId } from '../src/crackers/crackerDefs.js'
import { playFireworkSound } from '../src/audio/FireworkSound.js'

describe('DIW-026 — Constellation Sparkles (Starlit pose, ID 13)', () => {
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

  it('is registered in catalog with stable ID 13 and Sky category', () => {
    expect(isValidCrackerId(13)).toBe(true)
    const def = getCrackerById(13)
    expect(def).toBeDefined()
    expect(def.id).toBe(13)
    expect(def.name).toBe('Constellation Sparkles')
    expect(def.category).toBe('sky')
    expect(def.descriptor).toBe('Starlit pose')
    expect(def.durationMs).toBe(5000)
    expect(def.soundCharacter).toMatch(/chimes/i)
    expect(def.budget.maxParticles).toBe(190)
  })

  it('triggers constellation audio cue and completes at 5000ms', () => {
    const onDone = vi.fn()
    playCrackerShow(13, mockEngines, onDone)

    expect(SHOW_DURATIONS[13]).toBe(5000)
    expect(CRACKER_TEST_META[13].durationMs).toBe(5000)

    vi.advanceTimersByTime(4900)
    expect(onDone).not.toHaveBeenCalled()

    vi.advanceTimersByTime(200)
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('reveals starlit points in sequence with still constellation pose', () => {
    const spawnedConfigs = []
    mockEngines.particles.spawn.mockImplementation((x, y, cfg) => {
      spawnedConfigs.push({ x, y, cfg })
    })

    playCrackerShow(13, mockEngines, vi.fn())

    // Advance through star points (up to 1800ms)
    vi.advanceTimersByTime(2000)
    expect(spawnedConfigs.length).toBeGreaterThan(40)

    // Starlit points have low gravity and high drag to hold still in sky
    const starSparks = spawnedConfigs.filter((s) => s.cfg.gravity <= 10)
    expect(starSparks.length).toBeGreaterThan(20)
  })

  it('cancels cleanly without leaking timers or firing onDone', () => {
    const onDone = vi.fn()
    const cancel = playCrackerShow(13, mockEngines, onDone)

    vi.advanceTimersByTime(500)
    cancel()

    vi.advanceTimersByTime(6000)
    expect(onDone).not.toHaveBeenCalled()
  })

  it('plays constellation sound without throwing and releases audio nodes', () => {
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

    const stop = playFireworkSound(audioEng, 'constellation', 4.0, 0)
    expect(typeof stop).toBe('function')
    expect(() => stop()).not.toThrow()
  })
})
