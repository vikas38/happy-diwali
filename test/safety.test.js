import { describe, it, expect, vi, afterEach } from 'vitest'
import { limiterCurve, MAX_OUTPUT_PEAK, meaningfulResize } from '../src/safety/limits.js'
import { Particles } from '../src/render/Particles.js'
import { loadSave, writeSave, clearSave } from '../src/store/save.js'
import { SoundEngine } from '../src/audio/SoundEngine.js'
afterEach(() => vi.restoreAllMocks())
describe('release safety boundaries', () => {
  it('bounds the output transfer curve at every input', () => {
    const curve = limiterCurve()
    expect(Math.max(...curve)).toBeLessThanOrEqual(MAX_OUTPUT_PEAK)
    expect(Math.min(...curve)).toBeGreaterThanOrEqual(-MAX_OUTPUT_PEAK)
    expect(curve[2048]).toBe(0)
  })
  it('suppresses flashes completely with reduced motion', () => {
    const p = new Particles()
    p.reducedMotion = true
    p.flash(0, 0)
    expect(p.flashes).toHaveLength(0)
  })
  it('limits localized flashes to at most three in a rolling second', () => {
    const p = new Particles()
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    for (now = 0; now < 1000; now += 20) p.flash(0, 0, 500)
    expect(p.flashes.length).toBeLessThanOrEqual(3)
    expect(p.flashes.every((f) => f.radius <= 100)).toBe(true)
  })
  it('ignores browser chrome height changes and detects orientation', () => {
    expect(meaningfulResize({ width: 390, height: 844 }, { width: 390, height: 750 })).toBe(false)
    expect(meaningfulResize({ width: 390, height: 844 }, { width: 844, height: 390 })).toBe(true)
  })
  it('survives a storage getter that throws', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw Error('denied')
    })
    expect(loadSave().intensity).toBe('SOFT')
    expect(() => writeSave({})).not.toThrow()
    expect(() => clearSave()).not.toThrow()
  })
  it('continues without audio when context creation is blocked', () => {
    vi.stubGlobal('AudioContext', function () {
      throw Error('blocked')
    })
    const sound = new SoundEngine()
    expect(() => sound.init()).not.toThrow()
    expect(sound.supported).toBe(false)
    vi.unstubAllGlobals()
  })
})
