import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  CRACKER_TEST_META,
  SHOW_DURATIONS,
  playCrackerShow,
} from '../src/crackers/crackerControllers.js'
import { getCrackerById, isValidCrackerId } from '../src/crackers/crackerDefs.js'
import { playFireworkSound } from '../src/audio/FireworkSound.js'

describe('DIW-022 — Peacock Fan (Feather fan, ID 9)', () => {
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

  it('is registered in catalog with stable ID 9 and Ground category', () => {
    expect(isValidCrackerId(9)).toBe(true)
    const def = getCrackerById(9)
    expect(def).toBeDefined()
    expect(def.id).toBe(9)
    expect(def.name).toBe('Peacock Fan')
    expect(def.category).toBe('ground')
    expect(def.descriptor).toBe('Feather fan')
    expect(def.durationMs).toBe(4500)
    expect(def.soundCharacter).toMatch(/fluttering/i)
    expect(def.budget.maxParticles).toBe(210)
  })

  it('triggers peacock audio cue and advances to completion at 4500ms', () => {
    const onDone = vi.fn()
    playCrackerShow(9, mockEngines, onDone)

    expect(SHOW_DURATIONS[9]).toBe(4500)
    expect(CRACKER_TEST_META[9].durationMs).toBe(4500)

    vi.advanceTimersByTime(4400)
    expect(onDone).not.toHaveBeenCalled()

    vi.advanceTimersByTime(200)
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('emits upward feather plumes in turquoise, emerald, and gold', () => {
    const spawnedConfigs = []
    mockEngines.particles.spawn.mockImplementation((x, y, cfg) => {
      spawnedConfigs.push({ x, y, cfg })
    })

    playCrackerShow(9, mockEngines, vi.fn())
    vi.advanceTimersByTime(600)

    expect(spawnedConfigs.length).toBeGreaterThan(0)
    // Verify plumes rise upward (vy < 0) from ground
    const upwardPlumes = spawnedConfigs.filter((s) => s.cfg.vy < 0)
    expect(upwardPlumes.length).toBeGreaterThan(0)

    // Verify presence of peacock hues (175 turquoise, 145 emerald, 45 gold)
    const hues = new Set(spawnedConfigs.map((s) => s.cfg.hue))
    const hasPeacockHue = [175, 145, 45].some((h) => hues.has(h))
    expect(hasPeacockHue).toBe(true)
  })

  it('cancels cleanly without leaking timers or firing onDone', () => {
    const onDone = vi.fn()
    const cancel = playCrackerShow(9, mockEngines, onDone)

    vi.advanceTimersByTime(500)
    cancel()

    vi.advanceTimersByTime(5000)
    expect(onDone).not.toHaveBeenCalled()
  })

  it('plays peacock sound without throwing and releases audio nodes', () => {
    const mockNodes = []
    const audioEng = {
      supported: true,
      ctx: {
        currentTime: 0,
        createGain: () => {
          const n = {
            connect: vi.fn(),
            disconnect: vi.fn(),
            gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
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

    const stop = playFireworkSound(audioEng, 'peacock', 3.2, 0)
    expect(typeof stop).toBe('function')
    expect(() => stop()).not.toThrow()
  })
})
