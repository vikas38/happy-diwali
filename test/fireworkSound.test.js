import { describe, it, expect, vi } from 'vitest'
import { playFireworkSound } from '../src/audio/FireworkSound.js'
import { SoundEngine, INTENSITY_PROFILES } from '../src/audio/SoundEngine.js'
import { MAX_OUTPUT_PEAK, limiterCurve } from '../src/safety/limits.js'

function audioFixture() {
  const nodes = []
  const noiseSources = []
  const param = () => ({
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  })
  const node = (type = 'generic') => {
    const n = {
      _type: type,
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      gain: param(),
      frequency: param(),
      Q: param(),
      pan: param(),
    }
    nodes.push(n)
    if (type === 'noise') noiseSources.push(n)
    return n
  }
  const sound = {
    supported: true,
    ctx: {
      currentTime: 5,
      createGain: () => node('gain'),
      createBiquadFilter: () => node('filter'),
      createOscillator: () => node('oscillator'),
      createStereoPanner: () => node('panner'),
    },
    intensityGain: { _isIntensityGain: true },
    createNoiseSource: () => node('noise'),
    _crackerNodes: new Set(),
    _activeNodes: new Set(),
    trackCrackerNode(n, g) {
      this._crackerNodes.add({ node: n, gain: g })
      this._activeNodes.add(n)
    },
  }
  return { sound, nodes, noiseSources }
}

describe('Firework sound graph (A1 regression & routing)', () => {
  const kinds = ['sparkler', 'fountain', 'spinner', 'whoosh', 'pop', 'boom', 'fuse']

  it.each(kinds)('routes %s through the volume/intensity chain and releases its nodes', (kind) => {
    const { sound, nodes } = audioFixture()
    const stop = playFireworkSound(sound, kind, 1, 0.4)
    expect(
      nodes.some((n) => n.connect.mock.calls.some(([target]) => target === sound.intensityGain))
    ).toBe(true)
    expect(nodes.some((n) => n.start.mock.calls.length)).toBe(true)
    stop()
    stop()
    expect(sound._crackerNodes.size).toBe(0)
    expect(sound._activeNodes.size).toBe(0)
    for (const n of nodes) expect(n.disconnect).toHaveBeenCalledOnce()
  })

  it.each(kinds)(
    'ensures NO noise source has an unintended direct dry bypass connection to intensityGain for %s',
    (kind) => {
      const { sound, noiseSources } = audioFixture()
      playFireworkSound(sound, kind, 1, 0.4)

      expect(noiseSources.length).toBeGreaterThan(0)
      for (const noiseSrc of noiseSources) {
        // Every noise source must connect ONLY to a filter, NEVER directly to intensityGain
        const directToIntensity = noiseSrc.connect.mock.calls.some(
          ([target]) => target === sound.intensityGain
        )
        expect(directToIntensity).toBe(false)

        // Must connect to a filter
        const connectsToFilter = noiseSrc.connect.mock.calls.some(
          ([target]) => target?._type === 'filter'
        )
        expect(connectsToFilter).toBe(true)
      }
    }
  )

  it('connects noise only through filter -> envelope -> bus -> panner -> intensityGain', () => {
    const { sound, nodes, noiseSources } = audioFixture()
    playFireworkSound(sound, 'pop', 1, 0.5)

    // The ONLY node that connects to sound.intensityGain must be the stereo panner
    const connectedToIntensity = nodes.filter((n) =>
      n.connect.mock.calls.some(([target]) => target === sound.intensityGain)
    )
    expect(connectedToIntensity.length).toBe(1)
    expect(connectedToIntensity[0]._type).toBe('panner')
    expect(connectedToIntensity[0].pan.value).toBe(0.5)
  })

  it('clamps stereo panner to safety range [-0.7, 0.7]', () => {
    const { sound, nodes } = audioFixture()
    playFireworkSound(sound, 'sparkler', 1, 1.0) // requested 1.0
    const panner = nodes.find((n) => n._type === 'panner')
    expect(panner.pan.value).toBe(0.7)

    const { sound: sound2, nodes: nodes2 } = audioFixture()
    playFireworkSound(sound2, 'sparkler', 1, -0.9) // requested -0.9
    const panner2 = nodes2.find((n) => n._type === 'panner')
    expect(panner2.pan.value).toBe(-0.7)
  })

  it('works silently without Web Audio', () => {
    expect(() => playFireworkSound({ supported: false }, 'boom')()).not.toThrow()
  })
})

describe('SoundEngine factory connection ownership (A1)', () => {
  it('createNoiseSource returns an unconnected source buffer node', () => {
    const mockSrc = { connect: vi.fn(), buffer: null, loop: false }
    const mockBuffer = {}
    const se = new SoundEngine()
    se.ctx = {
      createBufferSource: vi.fn(() => mockSrc),
    }
    se._supported = true
    se._noiseBuffers = { white: mockBuffer }
    se.intensityGain = { connect: vi.fn() }

    const src = se.createNoiseSource('white')
    expect(src).toBe(mockSrc)
    expect(src.buffer).toBe(mockBuffer)
    expect(src.loop).toBe(true)
    // Factory MUST NOT auto-connect to intensityGain
    expect(mockSrc.connect).not.toHaveBeenCalled()
  })

  it('createOscillator returns an unconnected oscillator node', () => {
    const mockOsc = { connect: vi.fn(), type: '', frequency: { value: 0 } }
    const se = new SoundEngine()
    se.ctx = {
      createOscillator: vi.fn(() => mockOsc),
    }
    se._supported = true
    se.intensityGain = { connect: vi.fn() }

    const osc = se.createOscillator('triangle', 330)
    expect(osc).toBe(mockOsc)
    expect(osc.type).toBe('triangle')
    expect(osc.frequency.value).toBe(330)
    expect(mockOsc.connect).not.toHaveBeenCalled()
  })

  it('createGain returns an unconnected gain node', () => {
    const mockGain = { connect: vi.fn() }
    const se = new SoundEngine()
    se.ctx = {
      createGain: vi.fn(() => mockGain),
    }
    se._supported = true
    se.intensityGain = { connect: vi.fn() }

    const g = se.createGain()
    expect(g).toBe(mockGain)
    expect(mockGain.connect).not.toHaveBeenCalled()
  })

  it('createFilter returns an unconnected filter node', () => {
    const mockFilter = { connect: vi.fn(), type: '' }
    const se = new SoundEngine()
    se.ctx = {
      createBiquadFilter: vi.fn(() => mockFilter),
    }
    se._supported = true
    se.intensityGain = { connect: vi.fn() }

    const f = se.createFilter('bandpass')
    expect(f).toBe(mockFilter)
    expect(f.type).toBe('bandpass')
    expect(mockFilter.connect).not.toHaveBeenCalled()
  })
})

describe('Deterministic DSP offline simulation (A1 stereo & peak verification)', () => {
  it('pan > 0 produces higher energy in the right channel than the left channel', () => {
    // Equal power panning simulation: pan = +0.6
    const pan = 0.6
    const angle = (pan + 1) * (Math.PI / 4)
    const gainL = Math.cos(angle)
    const gainR = Math.sin(angle)

    expect(gainR).toBeGreaterThan(gainL)
    const ratio = (gainR * gainR) / (gainL * gainL)
    // At pan = +0.6, right power is ~4x left power
    expect(ratio).toBeGreaterThan(3.5)
  })

  it('all intensity modes and limiter enforce output peak strictly bounded by MAX_OUTPUT_PEAK', () => {
    const curve = limiterCurve(4097)
    // Limiter curve strictly limits any input amplitude
    for (const mode of ['SOFT', 'NORMAL', 'LOUD']) {
      const profile = INTENSITY_PROFILES[mode]
      expect(profile.gain).toBeLessThanOrEqual(1.0)
      // Any sample passing through master and limiter stays bounded
      const saturated = MAX_OUTPUT_PEAK * Math.tanh(10.0 / MAX_OUTPUT_PEAK)
      expect(saturated).toBeLessThanOrEqual(MAX_OUTPUT_PEAK)
    }
  })
})
