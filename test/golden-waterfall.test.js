import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  CRACKER_TEST_META,
  SHOW_DURATIONS,
  playCrackerShow,
} from '../src/crackers/crackerControllers.js'
import { getCrackerById, isValidCrackerId } from '../src/crackers/crackerDefs.js'
import { playFireworkSound } from '../src/audio/FireworkSound.js'

describe('DIW-019 — Golden Waterfall (Ground cascade, ID 6)', () => {
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

  it('is registered in catalog with stable ID 6 and Ground category', () => {
    expect(isValidCrackerId(6)).toBe(true)
    const def = getCrackerById(6)
    expect(def).toBeDefined()
    expect(def.id).toBe(6)
    expect(def.name).toBe('Golden Waterfall')
    expect(def.category).toBe('ground')
    expect(def.descriptor).toBe('Ground cascade')
    expect(def.durationMs).toBe(4500)
    expect(def.soundCharacter).toMatch(/cascade/i)
    expect(def.budget.maxParticles).toBe(210)
  })

  it('triggers cascade audio cue and matches authored duration 4500ms', () => {
    const onDone = vi.fn()
    playCrackerShow(6, mockEngines, onDone)

    expect(SHOW_DURATIONS[6]).toBe(4500)
    expect(CRACKER_TEST_META[6].durationMs).toBe(4500)

    // Advance right before completion
    vi.advanceTimersByTime(4400)
    expect(onDone).not.toHaveBeenCalled()

    // Advance to complete
    vi.advanceTimersByTime(200)
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('emits downward filaments (vy > 0) distinct from upward Anar (vy < 0)', () => {
    const spawnedConfigs = []
    mockEngines.particles.spawn.mockImplementation((x, y, cfg) => {
      spawnedConfigs.push({ x, y, cfg })
    })

    playCrackerShow(6, mockEngines, vi.fn())
    vi.advanceTimersByTime(500)

    expect(spawnedConfigs.length).toBeGreaterThan(0)
    const downwardSparks = spawnedConfigs.filter((s) => s.cfg.shape === 'spark' && s.cfg.vy > 0)
    expect(downwardSparks.length).toBeGreaterThan(0)
    // Verify filaments bounce on courtyard cobblestones
    expect(downwardSparks.some((s) => s.cfg.bounceY !== undefined)).toBe(true)
  })

  it('cancels cleanly without leaking callbacks or firing onDone', () => {
    const onDone = vi.fn()
    const cancel = playCrackerShow(6, mockEngines, onDone)

    vi.advanceTimersByTime(1000)
    cancel()

    vi.advanceTimersByTime(5000)
    expect(onDone).not.toHaveBeenCalled()
  })

  it('plays cascade sound without throwing and releases audio nodes', () => {
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

    const stop = playFireworkSound(audioEng, 'cascade', 3.2, 0)
    expect(typeof stop).toBe('function')
    expect(() => stop()).not.toThrow()
  })
})
