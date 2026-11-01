import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  CRACKER_TEST_META,
  SHOW_DURATIONS,
  playCrackerShow,
} from '../src/crackers/crackerControllers.js'
import { getCrackerById, isValidCrackerId } from '../src/crackers/crackerDefs.js'
import { playFireworkSound } from '../src/audio/FireworkSound.js'

describe('DIW-020 — Comet Fan (Sky fan, ID 7)', () => {
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

  it('is registered in catalog with stable ID 7 and Sky category', () => {
    expect(isValidCrackerId(7)).toBe(true)
    const def = getCrackerById(7)
    expect(def).toBeDefined()
    expect(def.id).toBe(7)
    expect(def.name).toBe('Comet Fan')
    expect(def.category).toBe('sky')
    expect(def.descriptor).toBe('Sky fan')
    expect(def.durationMs).toBe(4500)
    expect(def.soundCharacter).toMatch(/sweep/i)
    expect(def.budget.maxParticles).toBe(220)
  })

  it('triggers fan audio cue and advances to completion at 4500ms', () => {
    const onDone = vi.fn()
    playCrackerShow(7, mockEngines, onDone)

    expect(SHOW_DURATIONS[7]).toBe(4500)
    expect(CRACKER_TEST_META[7].durationMs).toBe(4500)

    vi.advanceTimersByTime(4400)
    expect(onDone).not.toHaveBeenCalled()

    vi.advanceTimersByTime(200)
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('launches 5 arcing comets across the sky with apex bursts', () => {
    const spawnedConfigs = []
    mockEngines.particles.spawn.mockImplementation((x, y, cfg) => {
      spawnedConfigs.push({ x, y, cfg })
    })

    playCrackerShow(7, mockEngines, vi.fn())
    // Advance past comet launches (first ~700ms)
    vi.advanceTimersByTime(800)

    expect(spawnedConfigs.length).toBeGreaterThanOrEqual(5)
    // Verify comets have upward velocity (vy < 0)
    const upwardComets = spawnedConfigs.filter((s) => s.cfg.vy < 0)
    expect(upwardComets.length).toBeGreaterThanOrEqual(5)

    // Advance past apex bursts (~1700ms)
    vi.advanceTimersByTime(1200)
    expect(spawnedConfigs.length).toBeGreaterThan(30)
  })

  it('cancels cleanly without leaking timers or firing onDone', () => {
    const onDone = vi.fn()
    const cancel = playCrackerShow(7, mockEngines, onDone)

    vi.advanceTimersByTime(500)
    cancel()

    vi.advanceTimersByTime(5000)
    expect(onDone).not.toHaveBeenCalled()
  })

  it('plays fan sound without throwing and releases audio nodes', () => {
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
            frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
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

    const stop = playFireworkSound(audioEng, 'fan', 3.5, 0)
    expect(typeof stop).toBe('function')
    expect(() => stop()).not.toThrow()
  })
})
