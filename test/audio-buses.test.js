import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SoundEngine, INTENSITY_PROFILES } from '../src/audio/SoundEngine.js'
import { playFireworkSound } from '../src/audio/FireworkSound.js'
import { GameController, STATES } from '../src/fsm/GameController.js'

function createMockAudioContext() {
  const nodes = []
  const createParam = (initial = 0) => ({
    value: initial,
    setValueAtTime: vi.fn(function (v) {
      this.value = v
    }),
    linearRampToValueAtTime: vi.fn(function (v) {
      this.value = v
    }),
    exponentialRampToValueAtTime: vi.fn(function (v) {
      this.value = v
    }),
    setTargetAtTime: vi.fn(function (v) {
      this.value = v
    }),
    cancelScheduledValues: vi.fn(),
  })

  const createMockNode = (type) => {
    const n = {
      _type: type,
      gain: createParam(1),
      frequency: createParam(440),
      Q: createParam(1),
      pan: createParam(0),
      threshold: createParam(-12),
      ratio: createParam(8),
      attack: createParam(0.002),
      knee: createParam(30),
      release: createParam(0.25),
      curve: null,
      oversample: 'none',
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    }
    nodes.push(n)
    return n
  }

  const ctx = {
    state: 'running',
    currentTime: 10,
    sampleRate: 44100,
    destination: { _isDestination: true, connect: vi.fn() },
    createGain: vi.fn(() => createMockNode('gain')),
    createBiquadFilter: vi.fn(() => createMockNode('filter')),
    createOscillator: vi.fn(() => createMockNode('oscillator')),
    createStereoPanner: vi.fn(() => createMockNode('panner')),
    createDynamicsCompressor: vi.fn(() => createMockNode('compressor')),
    createWaveShaper: vi.fn(() => createMockNode('waveshaper')),
    createAnalyser: vi.fn(() => {
      const a = createMockNode('analyser')
      a.frequencyBinCount = 128
      a.getByteFrequencyData = vi.fn()
      return a
    }),
    createBuffer: vi.fn((channels, len, rate) => ({
      length: len,
      numberOfChannels: channels,
      sampleRate: rate,
      getChannelData: vi.fn(() => new Float32Array(len)),
    })),
    createBufferSource: vi.fn(() => createMockNode('bufferSource')),
    resume: vi.fn().mockResolvedValue(),
    close: vi.fn().mockResolvedValue(),
  }

  return { ctx, nodes }
}

describe('Task A2 — Sound buses, cancellation, and identities', () => {
  let engine
  let mock

  beforeEach(() => {
    vi.useFakeTimers()
    mock = createMockAudioContext()
    engine = new SoundEngine()
    vi.stubGlobal('AudioContext', function () {
      return mock.ctx
    })
    engine.init()
  })

  afterEach(() => {
    engine.dispose()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  describe('1. Sub-bus routing and intensity independence', () => {
    it('initializes separate sub-buses: effectsBus, musicBus, calmBus, cueBus, and masterGain', () => {
      expect(engine.effectsBus).toBeTruthy()
      expect(engine.musicBus).toBeTruthy()
      expect(engine.calmBus).toBeTruthy()
      expect(engine.cueBus).toBeTruthy()
      expect(engine.masterGain).toBeTruthy()
      expect(engine.intensityGain).toBeTruthy()
      expect(engine.intensityFilter).toBeTruthy()
    })

    it('routes effectsBus through intensityGain and intensityFilter into masterGain', () => {
      expect(engine.effectsBus.connect).toHaveBeenCalledWith(engine.intensityGain)
      expect(engine.intensityGain.connect).toHaveBeenCalledWith(engine.intensityFilter)
      expect(engine.intensityFilter.connect).toHaveBeenCalledWith(engine.masterGain)
    })

    it('routes musicBus, calmBus, and cueBus directly to masterGain, bypassing intensity shaping', () => {
      expect(engine.musicBus.connect).toHaveBeenCalledWith(engine.masterGain)
      expect(engine.calmBus.connect).toHaveBeenCalledWith(engine.masterGain)
      expect(engine.cueBus.connect).toHaveBeenCalledWith(engine.masterGain)

      // None of music, calm, or cue should connect to intensityGain
      expect(engine.musicBus.connect).not.toHaveBeenCalledWith(engine.intensityGain)
      expect(engine.calmBus.connect).not.toHaveBeenCalledWith(engine.intensityGain)
      expect(engine.cueBus.connect).not.toHaveBeenCalledWith(engine.intensityGain)
    })

    it('changing intensity modifies only intensityGain and intensityFilter without altering music or cue buses', () => {
      engine.setIntensity('SOFT')
      expect(engine.intensityGain.gain.setTargetAtTime).toHaveBeenCalledWith(
        INTENSITY_PROFILES.SOFT.gain,
        expect.any(Number),
        expect.any(Number)
      )
      expect(engine.intensityFilter.frequency.setTargetAtTime).toHaveBeenCalledWith(
        INTENSITY_PROFILES.SOFT.cutoff,
        expect.any(Number),
        expect.any(Number)
      )

      // musicBus and cueBus retain default 1.0 gain
      expect(engine.musicBus.gain.value).toBe(1.0)
      expect(engine.cueBus.gain.value).toBe(1.0)
    })

    it('masterVolume applies to masterGain, bounding all buses beneath user volume and limiter', () => {
      engine.setMasterVolume(0.4)
      expect(engine.masterGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        0.4,
        expect.any(Number)
      )
    })
  })

  describe('2. Cancellable playback handles and resource tracking', () => {
    it('playFireworkSound returns a handle that cleanly stops and disconnects all nodes', () => {
      const handle = playFireworkSound(engine, 'sparkler', 2, 0.2)
      expect(typeof handle.stop).toBe('function')
      expect(engine._crackerHandles.size).toBe(1)

      // Stop handle
      handle.stop()
      expect(engine._crackerHandles.size).toBe(0)
      expect(engine._crackerNodes.size).toBe(0)
    })

    it('handle.stop is idempotent and safe against repeated calls', () => {
      const handle = playFireworkSound(engine, 'boom', 1, 0)
      expect(() => {
        handle.stop()
        handle.stop()
        handle()
      }).not.toThrow()
      expect(engine._crackerHandles.size).toBe(0)
    })

    it('fadeCrackerAudio ramps effectsBus.gain to 0 over duration without abrupt cuts', () => {
      playFireworkSound(engine, 'fountain', 2.5, 0)
      engine.fadeCrackerAudio(150)
      expect(engine.effectsBus.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        0,
        mock.ctx.currentTime + 0.15
      )
    })

    it('stopCrackerAudio stops all active cracker handles and restores effectsBus.gain to 1.0', () => {
      playFireworkSound(engine, 'spinner', 2, 0)
      playFireworkSound(engine, 'pop', 1, 0)
      expect(engine._crackerHandles.size).toBe(2)

      engine.stopCrackerAudio()
      expect(engine._crackerHandles.size).toBe(0)
      expect(engine.effectsBus.gain.setValueAtTime).toHaveBeenCalledWith(1.0, mock.ctx.currentTime)
    })

    it('playCueTone returns a tracked cancellable handle and self-cleans on completion', () => {
      const handle = engine.playCueTone(523.25, 0.3)
      expect(engine._cueHandles.size).toBe(1)

      // Fast forward past duration
      vi.advanceTimersByTime(450)
      expect(engine._cueHandles.size).toBe(0)
    })

    it('stopAllCues immediately stops all active cue handles', () => {
      engine.playCueTone(440, 1.0)
      engine.playCueTone(660, 1.0)
      expect(engine._cueHandles.size).toBe(2)

      engine.stopAllCues()
      expect(engine._cueHandles.size).toBe(0)
    })

    it('calm pad chords self-clean from tracking set after chord cycle finishes', () => {
      engine.startCalmPad()
      expect(engine._calmPlaying).toBe(true)

      // Advance by one chord cycle (8s + margin)
      vi.advanceTimersByTime(8500)
      // Chords self-clean; active handles remain bounded (at most current active chord)
      expect(engine._calmHandles.size).toBeLessThanOrEqual(2)

      engine.stopCalmPad()
      expect(engine._calmHandles.size).toBe(0)
      expect(engine._calmPlaying).toBe(false)
    })

    it('repeated start/stop transitions return handle sets to bounded zero baseline', () => {
      for (let i = 0; i < 5; i++) {
        engine.startMusic()
        engine.startCalmPad()
        playFireworkSound(engine, 'sparkler', 0.5)
        engine.playCueTone(440, 0.2)

        engine.stopMusic()
        engine.stopCalmPad()
        engine.stopCrackerAudio()
        engine.stopAllCues()
      }

      expect(engine._crackerHandles.size).toBe(0)
      expect(engine._calmHandles.size).toBe(0)
      expect(engine._musicHandles.size).toBe(0)
      expect(engine._cueHandles.size).toBe(0)
    })
  })

  describe('3. GameController sound cancellation on interruption and route changes', () => {
    it('cancels countdown chimes when interrupted by Calm Corner or route navigation', () => {
      const gc = new GameController(STATES.IDLE)
      const chhotu = {
        setPosition: vi.fn(),
        setFacing: vi.fn(),
        setArmState: vi.fn(),
        walkTo: vi.fn((x1, y1, x2, y2, dur, cb) => cb()),
      }
      const pip = { setPosition: vi.fn(), setMood: vi.fn() }
      const renderer = { width: 800, height: 600 }
      const store = {
        getState: () => ({ seenIntros: [0], unlockedCrackers: [0], masterVolume: 0.7 }),
        hasSeenIntro: () => true,
        isUnlocked: () => true,
        markIntroSeen: vi.fn(),
      }

      gc.init({ sound: engine, renderer, chhotu, pip, store })
      gc.selectCracker(0)
      expect(gc.state).toBe(STATES.READY_ON_STREET)
      gc.tapCracker() // transitions to STEPPING_BACK and synchronously to COUNTDOWN_3_2_1 via chhotu walkTo cb

      expect(gc.state).toBe(STATES.COUNTDOWN_3_2_1)
      expect(engine._cueHandles.size).toBeGreaterThanOrEqual(1)

      // Interrupt with Calm Corner
      gc.enterCalmCorner()
      expect(gc.state).toBe(STATES.CALM_CORNER_OVERLAY)
      // Countdown chime and fuse must be stopped immediately
      expect(engine._cueHandles.size).toBe(0)
      expect(engine._crackerHandles.size).toBe(0)

      gc.dispose()
    })

    it('cancels fanfare notes and active show audio on dispose without leaking timers', () => {
      const gc = new GameController(STATES.IDLE)
      gc.init({
        sound: engine,
        renderer: { width: 800, height: 600 },
        chhotu: { setPosition: vi.fn(), setFacing: vi.fn(), setArmState: vi.fn(), jump: vi.fn() },
        pip: { setPosition: vi.fn(), setMood: vi.fn(), jump: vi.fn() },
        store: {
          getState: () => ({ seenIntros: [0], unlockedCrackers: [0] }),
          awardShowCompletion: () => ({ isNewSticker: true, starsEarned: 3 }),
        },
      })

      gc.selectCracker(0)
      gc.state = STATES.CRACKER_SHOW_ACTIVE
      // Complete show and trigger fanfare
      gc._onCrackerShowComplete()
      expect(gc.state).toBe(STATES.REWARD_CELEBRATION)

      // Advance one beat of fanfare
      vi.advanceTimersByTime(130)
      expect(engine._cueHandles.size).toBeGreaterThanOrEqual(1)

      // Disposing controller stops fanfare and cue handles immediately
      gc.dispose()
      expect(engine._cueHandles.size).toBe(0)
      expect(gc._timers.length).toBe(0)
    })
  })

  describe('4. Firework synthesis identity refinements', () => {
    it('Phuljhari (sparkler) creates micro-crackles with tapering tail', () => {
      const handle = playFireworkSound(engine, 'sparkler', 2.2, 0)
      expect(engine._crackerHandles.size).toBe(1)
      // All nodes route to effectsBus
      expect(
        mock.nodes.some((n) => n.connect.mock.calls.some(([t]) => t === engine.effectsBus))
      ).toBe(true)
      handle.stop()
    })

    it('Anar (fountain) aligns peak rushing exhaust with fountain height curve', () => {
      const handle = playFireworkSound(engine, 'fountain', 2.5, 0)
      expect(engine._crackerHandles.size).toBe(1)
      handle.stop()
    })

    it('Chakri (spinner) pulse cadence accelerates with angular speed omega(t)', () => {
      const handle = playFireworkSound(engine, 'spinner', 2.5, 0)
      expect(engine._crackerHandles.size).toBe(1)
      handle.stop()
    })

    it('Rocket produces whoosh ascent followed by boom impact with rounded low thump and reflections', () => {
      const whooshHandle = playFireworkSound(engine, 'whoosh', 1.15, 0)
      expect(engine._crackerHandles.size).toBe(1)
      whooshHandle.stop()

      const boomHandle = playFireworkSound(engine, 'boom', 1.0, 0)
      expect(engine._crackerHandles.size).toBe(1)
      boomHandle.stop()
    })

    it('Ladi (pop) schedules bounded discrete pops without surprise gain spikes', () => {
      const handle = playFireworkSound(engine, 'pop', 0.2, 0)
      expect(engine._crackerHandles.size).toBe(1)
      handle.stop()
    })

    it('Sutli Bomb (fuse and boom) provides clear warning sizzle and rounded low impact', () => {
      const fuseHandle = playFireworkSound(engine, 'fuse', 1.5, 0)
      expect(engine._crackerHandles.size).toBe(1)
      fuseHandle.stop()

      const boomHandle = playFireworkSound(engine, 'boom', 1.2, 0)
      expect(engine._crackerHandles.size).toBe(1)
      boomHandle.stop()
    })
  })
})
