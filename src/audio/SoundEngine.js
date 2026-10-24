import { limiterCurve, MASTER_CEILING_DB, MASTER_CEILING_LINEAR } from '../safety/limits.js'
export { MASTER_CEILING_DB, MASTER_CEILING_LINEAR } from '../safety/limits.js'
// ===================================================================
// SoundEngine — Web Audio API DSP & Fear-Reduction Engine
// ===================================================================
//
// Master Signal Architecture:
//   Cracker Effects -> effectsBus -> intensityGain (per-mode) -> intensityFilter (lowpass per-mode) -\
//   Background Music -> musicBus (independent of firework intensity) -----------------------------------> masterGain (user slider) -> compressor -> limiter -> destination
//   Calm Pad Drone   -> calmBus  (independent of firework intensity) -----------------------------------/                     \-> analyser (flame reaction)
//   Interface Cues   -> cueBus   (independent of firework intensity) ----------------------------------/
//
// An AnalyserNode taps the output limiter so characters react to actual audio levels.
// All playback produces cancellable handles and tracked node sets that self-clean upon completion.
// ===================================================================

export const INTENSITY_PROFILES = {
  SOFT: { gain: 0.22, cutoff: 900 },
  NORMAL: { gain: 0.55, cutoff: 2800 },
  LOUD: { gain: 1.0, cutoff: 8000 },
}

// Compressor safety settings
export const COMPRESSOR_SETTINGS = {
  threshold: -12, // dB
  ratio: 8, // 8:1
  attack: 0.002, // seconds
  knee: 30, // soft knee
  release: 0.25, // seconds
}

const RAMP_TIME = 0.05 // 50ms smoothing for live param changes

export class SoundEngine {
  constructor() {
    this.ctx = null
    this.effectsBus = null
    this.musicBus = null
    this.calmBus = null
    this.cueBus = null

    this.intensityGain = null
    this.intensityFilter = null
    this.masterGain = null
    this.compressor = null
    this.outputLimiter = null
    this.analyser = null
    this.analyserData = null

    this.intensity = 'SOFT'
    this.masterVolume = 0.7

    this._initialized = false
    this._noiseBuffers = {} // cached noise buffer sources
    this._activeNodes = new Set() // legacy active nodes set
    this._calmNodes = new Set() // calm-corner-specific nodes
    this._crackerNodes = new Set() // cracker-effect-specific nodes
    this._musicNodes = new Set() // background music nodes

    // Cancellable handle tracking sets
    this._crackerHandles = new Set()
    this._calmHandles = new Set()
    this._musicHandles = new Set()
    this._cueHandles = new Set()

    this._musicPlaying = false
    this._calmPlaying = false
    this._crackerPlaying = false
  }

  // -----------------------------------------------------------------
  // Initialization & lifecycle
  // -----------------------------------------------------------------

  /**
   * Create the AudioContext and wire up the multi-bus master signal chain.
   * Must be called from a user gesture (tap/click) to satisfy autoplay policies.
   */
  init() {
    if (this._initialized) return
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) {
      console.warn('Web Audio API not supported — game will run silently.')
      this._initialized = true
      this._supported = false
      return
    }
    try {
      this.ctx = new Ctx()
    } catch {
      this._supported = false
      return
    }
    this._supported = true

    // Create sub-buses
    this.effectsBus = this.ctx.createGain()
    this.musicBus = this.ctx.createGain()
    this.calmBus = this.ctx.createGain()
    this.cueBus = this.ctx.createGain()

    this.effectsBus.gain.value = 1.0
    this.musicBus.gain.value = 1.0
    this.calmBus.gain.value = 1.0
    this.cueBus.gain.value = 1.0

    // Intensity processing chain (applied to effects only)
    this.intensityGain = this.ctx.createGain()
    this.intensityFilter = this.ctx.createBiquadFilter()

    // Master processing chain
    this.masterGain = this.ctx.createGain()
    this.compressor = this.ctx.createDynamicsCompressor()
    this.outputLimiter = this.ctx.createWaveShaper()
    this.analyser = this.ctx.createAnalyser()

    // Configure the safety compressor
    this.compressor.threshold.value = COMPRESSOR_SETTINGS.threshold
    this.compressor.ratio.value = COMPRESSOR_SETTINGS.ratio
    this.compressor.attack.value = COMPRESSOR_SETTINGS.attack
    this.compressor.knee.value = COMPRESSOR_SETTINGS.knee
    this.compressor.release.value = COMPRESSOR_SETTINGS.release

    // Configure the intensity filter (low-pass)
    this.intensityFilter.type = 'lowpass'
    this.intensityFilter.Q.value = 0.7

    // Configure output limiter
    this.outputLimiter.curve = limiterCurve()
    this.outputLimiter.oversample = 'none'

    // Apply initial intensity and volume
    const profile = INTENSITY_PROFILES[this.intensity] || INTENSITY_PROFILES.SOFT
    this.intensityGain.gain.value = profile.gain
    this.intensityFilter.frequency.value = profile.cutoff
    this.masterGain.gain.value = this.masterVolume

    // Analyser config for character flame flicker
    this.analyser.fftSize = 256
    this.analyser.smoothingTimeConstant = 0.6
    this.analyserData = new Uint8Array(this.analyser.frequencyBinCount)

    // Wire sub-buses:
    // 1. effectsBus -> intensityGain -> intensityFilter -> masterGain
    this.effectsBus.connect(this.intensityGain)
    this.intensityGain.connect(this.intensityFilter)
    this.intensityFilter.connect(this.masterGain)

    // 2. musicBus -> masterGain (independent of firework intensity shaping)
    this.musicBus.connect(this.masterGain)

    // 3. calmBus -> masterGain (independent of firework intensity shaping)
    this.calmBus.connect(this.masterGain)

    // 4. cueBus -> masterGain (independent of firework intensity shaping)
    this.cueBus.connect(this.masterGain)

    // Master bus -> compressor -> outputLimiter -> destination & analyser
    this.masterGain.connect(this.compressor)
    this.compressor.connect(this.outputLimiter)
    this.outputLimiter.connect(this.ctx.destination)
    this.outputLimiter.connect(this.analyser)

    // Pre-generate noise buffers for reuse
    this._generateNoiseBuffers()

    this._initialized = true
  }

  /**
   * Resume a suspended AudioContext (call on user gesture).
   */
  async resume() {
    if (!this.ctx) this.init()
    if (!this._supported) return
    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume()
      } catch {
        /* Retry through the visible sound button. */
      }
    }
  }

  get supported() {
    return this._supported !== false
  }

  // -----------------------------------------------------------------
  // Intensity & volume control (live, click-free)
  // -----------------------------------------------------------------

  /**
   * Set the three-tier intensity mode. Updates gain + low-pass cutoff live on effectsBus.
   * Does NOT dull music or interface cues.
   * @param {'SOFT'|'NORMAL'|'LOUD'} intensity
   */
  setIntensity(intensity) {
    this.intensity = intensity
    if (!this.ctx || !this._supported) return
    const profile = INTENSITY_PROFILES[intensity] || INTENSITY_PROFILES.SOFT
    const now = this.ctx.currentTime
    if (this.intensityGain?.gain?.setTargetAtTime) {
      this.intensityGain.gain.setTargetAtTime(profile.gain, now, RAMP_TIME)
    }
    if (this.intensityFilter?.frequency?.setTargetAtTime) {
      this.intensityFilter.frequency.setTargetAtTime(profile.cutoff, now, RAMP_TIME)
    }
  }

  /**
   * Set the master volume (0..1). Updates live across all sub-buses.
   * Cancels prior ramps to handle rapid toggles smoothly and reaches exact silence on 0.
   * @param {number} vol
   */
  setMasterVolume(vol) {
    this.masterVolume = Math.min(1, Math.max(0, Number(vol) || 0))
    if (!this.ctx || !this._supported || !this.masterGain) return
    const now = this.ctx.currentTime
    const gainParam = this.masterGain.gain
    if (gainParam) {
      if (typeof gainParam.cancelScheduledValues === 'function') {
        gainParam.cancelScheduledValues(now)
      }
      const currentVal = typeof gainParam.value === 'number' ? gainParam.value : this.masterVolume
      if (typeof gainParam.setValueAtTime === 'function') {
        gainParam.setValueAtTime(currentVal, now)
      }
      if (typeof gainParam.linearRampToValueAtTime === 'function') {
        gainParam.linearRampToValueAtTime(this.masterVolume, now + RAMP_TIME)
      } else if (typeof gainParam.setTargetAtTime === 'function') {
        gainParam.setTargetAtTime(this.masterVolume, now, RAMP_TIME)
      } else {
        gainParam.value = this.masterVolume
      }
    }
  }

  get isMuted() {
    return this.masterVolume === 0
  }

  /**
   * Compute the expected gain and filter cutoff for an intensity mode
   * without needing a live AudioContext (used in tests).
   */
  static getProfile(intensity) {
    return INTENSITY_PROFILES[intensity] || INTENSITY_PROFILES.SOFT
  }

  // -----------------------------------------------------------------
  // Audio level (for flame flicker / character reactions)
  // -----------------------------------------------------------------

  /**
   * Returns the current audio level as a value 0..1.
   */
  getAudioLevel() {
    if (!this.analyser || !this._supported) return 0
    this.analyser.getByteFrequencyData(this.analyserData)
    let sum = 0
    for (let i = 0; i < this.analyserData.length; i++) {
      sum += this.analyserData[i]
    }
    return sum / (this.analyserData.length * 255)
  }

  // -----------------------------------------------------------------
  // Noise buffer generation (cached for reuse)
  // -----------------------------------------------------------------

  _generateNoiseBuffers() {
    if (!this.ctx || !this._supported) return
    const len = this.ctx.sampleRate * 2 // 2 seconds

    // White noise
    const white = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const wData = white.getChannelData(0)
    for (let i = 0; i < len; i++) wData[i] = Math.random() * 2 - 1
    this._noiseBuffers.white = white

    // Pink noise (Paul Kellet's algorithm)
    const pink = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const pData = pink.getChannelData(0)
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0
    for (let i = 0; i < len; i++) {
      const whiteSample = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + whiteSample * 0.0555179
      b1 = 0.99332 * b1 + whiteSample * 0.0750759
      b2 = 0.969 * b2 + whiteSample * 0.153852
      b3 = 0.8665 * b3 + whiteSample * 0.3104856
      b4 = 0.55 * b4 + whiteSample * 0.5329522
      b5 = -0.7616 * b5 - whiteSample * 0.016898
      pData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + whiteSample * 0.5362) * 0.11
      b6 = whiteSample * 0.115926
    }
    this._noiseBuffers.pink = pink
  }

  /**
   * Create a looping noise source buffer node (unconnected for explicit routing).
   * @param {'white'|'pink'} type
   * @returns {AudioBufferSourceNode|null}
   */
  createNoiseSource(type = 'white') {
    if (!this.ctx || !this._supported) return null
    const buffer = this._noiseBuffers[type]
    if (!buffer) return null
    const src = this.ctx.createBufferSource()
    src.buffer = buffer
    src.loop = true
    return src
  }

  /**
   * Create an oscillator (unconnected for explicit routing).
   * @param {string} type - oscillator type ('sine','triangle','square','sawtooth')
   * @param {number} freq - frequency in Hz
   * @returns {OscillatorNode|null}
   */
  createOscillator(type = 'sine', freq = 440) {
    if (!this.ctx || !this._supported) return null
    const osc = this.ctx.createOscillator()
    osc.type = type
    osc.frequency.value = freq
    return osc
  }

  /**
   * Create a gain node (unconnected for explicit routing).
   * @returns {GainNode|null}
   */
  createGain() {
    if (!this.ctx || !this._supported) return null
    return this.ctx.createGain()
  }

  /**
   * Create a biquad filter (unconnected for explicit routing).
   * @param {string} type - filter type
   * @returns {BiquadFilterNode|null}
   */
  createFilter(type = 'lowpass') {
    if (!this.ctx || !this._supported) return null
    const f = this.ctx.createBiquadFilter()
    f.type = type
    return f
  }

  /**
   * The chain input node that cracker sources connect to.
   */
  get chainInput() {
    return this.effectsBus || this.intensityGain
  }

  // -----------------------------------------------------------------
  // Node and Handle tracking
  // -----------------------------------------------------------------

  /**
   * Register a cracker-effect node so it can be faded/stopped.
   * @param {AudioNode} node
   * @param {AudioNode} [gainNode]
   */
  trackCrackerNode(node, gainNode) {
    this._crackerNodes.add({ node, gain: gainNode })
    this._activeNodes.add(node)
  }

  /**
   * Register a background-music node.
   */
  trackMusicNode(node, gainNode) {
    this._musicNodes.add({ node, gain: gainNode })
    this._activeNodes.add(node)
  }

  /**
   * Register a calm-corner node.
   */
  trackCalmNode(node) {
    this._calmNodes.add(node)
  }

  trackCrackerHandle(handle) {
    if (handle) this._crackerHandles.add(handle)
  }

  // -----------------------------------------------------------------
  // Interface cues & test tones
  // -----------------------------------------------------------------

  /**
   * Play a short test/countdown tone through the cueBus.
   * Returns a cancellable handle.
   * @param {number} freq - frequency in Hz
   * @param {number} duration - seconds
   * @returns {{ stop: () => void }}
   */
  playTestTone(freq = 440, duration = 0.4) {
    return this.playCueTone(freq, duration, 'triangle')
  }

  /**
   * Play an interface cue tone routed to cueBus without firework intensity shaping.
   * Returns a cancellable handle and tracks it for immediate cleanup.
   * @param {number} freq - frequency in Hz
   * @param {number} duration - seconds
   * @param {string} type - oscillator type
   * @returns {{ stop: () => void }}
   */
  playCueTone(freq = 440, duration = 0.3, type = 'sine') {
    if (!this.ctx || !this._supported) {
      const noop = () => {}
      noop.stop = noop
      return noop
    }
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, now)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.linearRampToValueAtTime(0.35, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    osc.connect(gain)
    gain.connect(this.cueBus || this.masterGain)

    const stopTime = now + duration + 0.05
    osc.start(now)
    osc.stop(stopTime)

    const handle = () => {
      try {
        osc.stop?.()
      } catch {}
      try {
        osc.disconnect?.()
      } catch {}
      try {
        gain.disconnect?.()
      } catch {}
      this._cueHandles.delete(handle)
    }
    handle.stop = handle
    this._cueHandles.add(handle)

    const cleanDelay = Math.max(10, (stopTime - now) * 1000 + 20)
    const cleanupTimer = setTimeout(() => {
      handle.stop()
    }, cleanDelay)
    const origStop = handle.stop
    handle.stop = () => {
      clearTimeout(cleanupTimer)
      origStop()
    }
    return handle
  }

  /**
   * Play a soft chime through cueBus at the active master volume without firework lowpass.
   * Useful for testing sound in the settings sheet.
   * Returns a cancellable handle.
   */
  playTestChime() {
    if (!this.ctx || !this._supported) {
      return null
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(523.25, now) // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12) // E5
    gain.gain.setValueAtTime(0.001, now)
    gain.gain.linearRampToValueAtTime(0.25, now + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6)
    osc.connect(gain)
    gain.connect(this.cueBus || this.intensityGain)

    const stopTime = now + 0.65
    osc.start(now)
    osc.stop(stopTime)

    const handle = {
      osc,
      gain,
      stop: () => {
        try {
          osc.stop?.()
        } catch {}
        try {
          osc.disconnect?.()
        } catch {}
        try {
          gain.disconnect?.()
        } catch {}
        this._cueHandles.delete(handle)
      },
    }
    this._cueHandles.add(handle)

    const cleanDelay = Math.max(10, (stopTime - now) * 1000 + 20)
    const cleanupTimer = setTimeout(() => {
      handle.stop()
    }, cleanDelay)
    const origHandleStop = handle.stop
    handle.stop = () => {
      clearTimeout(cleanupTimer)
      origHandleStop()
    }
    osc._cueHandle = handle

    return osc
  }

  /**
   * Stop all active interface cues immediately.
   */
  stopAllCues() {
    for (const handle of Array.from(this._cueHandles)) {
      try {
        handle.stop?.()
      } catch {}
    }
    this._cueHandles.clear()
  }

  // -----------------------------------------------------------------
  // Background festive music — pentatonic plucked melody loop
  // (Raag Bhopali / Desh inspired: C D E G A)
  // -----------------------------------------------------------------

  static PENTATONIC = {
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    G4: 392.0,
    A4: 440.0,
    C5: 523.25,
    D5: 587.33,
    E5: 659.25,
    G5: 783.99,
    A5: 880.0,
  }

  static MELODY = [
    ['C4', 0.4],
    ['E4', 0.4],
    ['G4', 0.4],
    ['A4', 0.4],
    ['G4', 0.4],
    ['E4', 0.4],
    ['D4', 0.4],
    ['C4', 0.4],
    ['E4', 0.4],
    ['G4', 0.4],
    ['A4', 0.4],
    ['C5', 0.4],
    ['A4', 0.4],
    ['G4', 0.4],
    ['E4', 0.4],
    ['D4', 0.4],
  ]

  static CALM_CHORDS = [
    [174.61, 220.0, 261.63, 329.63], // Fmaj7: F A C E
    [130.81, 164.81, 196.0, 246.94], // Cmaj7: C E G B
  ]

  setMusicEnabled(enabled) {
    this._musicEnabled = Boolean(enabled)
    if (this.musicBus) {
      this.musicBus.gain.value = enabled ? 1.0 : 0.0
    }
    if (!enabled && this._musicPlaying) {
      this.stopMusic()
    }
  }

  /**
   * Start the background festive melody loop routed to musicBus.
   */
  startMusic() {
    if (this._musicEnabled === false) return
    if (!this.ctx || !this._supported || this._musicPlaying) return
    this._musicPlaying = true
    this._musicGain = this.ctx.createGain()
    this._musicGain.gain.value = 0.35
    this._musicGain.connect(this.musicBus || this.masterGain)
    this._musicNoteIndex = 0
    this._nextNoteTime = this.ctx.currentTime + 0.1
    this._musicTimer = setInterval(() => this._scheduleMusic(), 25)
  }

  _scheduleMusic() {
    if (!this._musicPlaying || !this.ctx) return
    const lookahead = 0.1
    while (this._nextNoteTime < this.ctx.currentTime + lookahead) {
      const [noteName, dur] = SoundEngine.MELODY[this._musicNoteIndex]
      const freq = SoundEngine.PENTATONIC[noteName]
      this._playPluckNote(freq, this._nextNoteTime, dur)
      this._nextNoteTime += dur
      this._musicNoteIndex = (this._musicNoteIndex + 1) % SoundEngine.MELODY.length
    }
  }

  _playPluckNote(freq, time, dur) {
    if (!this.ctx || !this._musicGain) return
    const osc = this.ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = freq

    const wobble = this.ctx.createOscillator()
    wobble.type = 'sine'
    wobble.frequency.value = 5
    const wobbleGain = this.ctx.createGain()
    wobbleGain.gain.value = freq * 0.005
    wobble.connect(wobbleGain)
    wobbleGain.connect(osc.frequency)

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = freq * 2
    filter.Q.value = 2

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.linearRampToValueAtTime(0.5, time + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur * 0.9)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this._musicGain)

    const stopTime = time + dur + 0.05
    osc.start(time)
    osc.stop(stopTime)
    wobble.start(time)
    wobble.stop(stopTime)

    const handle = {
      stop: () => {
        try {
          osc.stop()
        } catch {}
        try {
          wobble.stop()
        } catch {}
        try {
          osc.disconnect()
        } catch {}
        try {
          wobble.disconnect()
        } catch {}
        try {
          wobbleGain.disconnect()
        } catch {}
        try {
          filter.disconnect()
        } catch {}
        try {
          gain.disconnect()
        } catch {}
        this._musicHandles.delete(handle)
      },
    }
    this._musicHandles.add(handle)

    const cleanDelay = Math.max(10, (stopTime - this.ctx.currentTime) * 1000 + 20)
    const cleanupTimer = setTimeout(() => {
      handle.stop()
    }, cleanDelay)
    const origStop = handle.stop
    handle.stop = () => {
      clearTimeout(cleanupTimer)
      origStop()
    }
  }

  stopMusic() {
    this._musicPlaying = false
    if (this._musicTimer) {
      clearInterval(this._musicTimer)
      this._musicTimer = null
    }
    for (const handle of Array.from(this._musicHandles)) {
      try {
        handle.stop?.()
      } catch {}
    }
    this._musicHandles.clear()
    if (this._musicGain) {
      try {
        this._musicGain.disconnect()
      } catch {}
      this._musicGain = null
    }
  }

  // -----------------------------------------------------------------
  // Calm Corner pad — warm slow-attack chord drone
  // (Fmaj7 / Cmaj7, synced with the 4-second breathing guide)
  // -----------------------------------------------------------------

  startCalmPad() {
    if (!this.ctx || !this._supported || this._calmPlaying) return
    this._calmPlaying = true
    this._calmGain = this.ctx.createGain()
    this._calmGain.gain.value = 0
    this._calmGain.connect(this.calmBus || this.masterGain)
    this.trackCalmNode(this._calmGain)

    this._calmChordIndex = 0
    this._calmNextTime = this.ctx.currentTime + 0.1
    this._calmTimer = setInterval(() => this._scheduleCalmPad(), 25)
  }

  _scheduleCalmPad() {
    if (!this._calmPlaying || !this.ctx) return
    const lookahead = 0.1
    while (this._calmNextTime < this.ctx.currentTime + lookahead) {
      this._playPadChord(SoundEngine.CALM_CHORDS[this._calmChordIndex], this._calmNextTime)
      this._calmNextTime += 8
      this._calmChordIndex = (this._calmChordIndex + 1) % SoundEngine.CALM_CHORDS.length
    }
  }

  _playPadChord(freqs, time) {
    if (!this._calmGain || !this.ctx) return
    const chordDur = 8
    const startTime = Math.max(this.ctx.currentTime, time)

    try {
      this._calmGain.gain.cancelScheduledValues(startTime)
      this._calmGain.gain.setValueAtTime(0, startTime)
      this._calmGain.gain.linearRampToValueAtTime(0.18, startTime + 2)
      this._calmGain.gain.setValueAtTime(0.18, startTime + chordDur - 2)
      this._calmGain.gain.linearRampToValueAtTime(0, startTime + chordDur)
    } catch {}

    const chordNodes = []
    for (const freq of freqs) {
      const osc = this.ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq

      const osc2 = this.ctx.createOscillator()
      osc2.type = 'triangle'
      osc2.frequency.value = freq * 1.003

      const noteGain = this.ctx.createGain()
      noteGain.gain.value = 0.5

      osc.connect(noteGain)
      osc2.connect(noteGain)
      noteGain.connect(this._calmGain)

      const stopTime = startTime + chordDur + 0.1
      osc.start(startTime)
      osc.stop(stopTime)
      osc2.start(startTime)
      osc2.stop(stopTime)

      chordNodes.push(osc, osc2, noteGain)
    }

    const handle = {
      stop: () => {
        for (const n of chordNodes) {
          try {
            n.stop?.()
          } catch {}
          try {
            n.disconnect?.()
          } catch {}
        }
        this._calmHandles.delete(handle)
      },
    }
    this._calmHandles.add(handle)

    const cleanDelay = Math.max(10, (startTime + chordDur + 0.2 - this.ctx.currentTime) * 1000)
    const cleanupTimer = setTimeout(() => {
      handle.stop()
    }, cleanDelay)
    const origStop = handle.stop
    handle.stop = () => {
      clearTimeout(cleanupTimer)
      origStop()
    }
  }

  stopCalmPad() {
    this._calmPlaying = false
    if (this._calmTimer) {
      clearInterval(this._calmTimer)
      this._calmTimer = null
    }
    for (const handle of Array.from(this._calmHandles)) {
      try {
        handle.stop?.()
      } catch {}
    }
    this._calmHandles.clear()

    if (this._calmGain) {
      const now = this.ctx ? this.ctx.currentTime : 0
      try {
        this._calmGain.gain.cancelScheduledValues(now)
        this._calmGain.gain.setValueAtTime(this._calmGain.gain.value, now)
        this._calmGain.gain.linearRampToValueAtTime(0, now + 0.05)
      } catch {}
      const g = this._calmGain
      setTimeout(() => {
        try {
          g.disconnect()
        } catch {}
      }, 60)
      this._calmGain = null
    }
    this.stopCalmAudio()
  }

  // -----------------------------------------------------------------
  // Calm corner audio control (pause / resume cracker audio)
  // -----------------------------------------------------------------

  /**
   * Fade out cracker-effect audio over a given duration by ramping effectsBus.
   * @param {number} ms - fade duration in milliseconds
   */
  fadeCrackerAudio(ms = 150) {
    if (!this.ctx || !this._supported) return
    const now = this.ctx.currentTime
    const dur = Math.max(0.02, ms / 1000)
    if (this.effectsBus?.gain) {
      try {
        this.effectsBus.gain.cancelScheduledValues(now)
        this.effectsBus.gain.setValueAtTime(this.effectsBus.gain.value, now)
        this.effectsBus.gain.linearRampToValueAtTime(0, now + dur)
      } catch {}
    }
    this._crackerNodes.forEach(({ gain }) => {
      if (gain?.gain) {
        try {
          gain.gain.cancelScheduledValues(now)
          gain.gain.setValueAtTime(gain.gain.value, now)
          gain.gain.linearRampToValueAtTime(0, now + dur)
        } catch {}
      }
    })
  }

  /**
   * Stop and disconnect all tracked cracker nodes and handles.
   * Resets effectsBus gain for future shows.
   */
  stopCrackerAudio() {
    for (const handle of Array.from(this._crackerHandles)) {
      try {
        handle.stop?.()
      } catch {}
    }
    this._crackerHandles.clear()

    this._crackerNodes.forEach(({ node }) => {
      try {
        if (node.stop) node.stop()
      } catch {}
      try {
        node.disconnect()
      } catch {}
    })
    this._crackerNodes.clear()
    this._crackerPlaying = false

    if (this.effectsBus?.gain && this.ctx) {
      const now = this.ctx.currentTime
      try {
        this.effectsBus.gain.cancelScheduledValues(now)
        this.effectsBus.gain.setValueAtTime(1.0, now)
      } catch {}
    }
  }

  /**
   * Stop calm-corner nodes.
   */
  stopCalmAudio() {
    for (const handle of Array.from(this._calmHandles)) {
      try {
        handle.stop?.()
      } catch {}
    }
    this._calmHandles.clear()

    this._calmNodes.forEach((node) => {
      try {
        if (node.stop) node.stop()
      } catch {}
      try {
        node.disconnect()
      } catch {}
    })
    this._calmNodes.clear()
    this._calmPlaying = false
  }

  // -----------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------

  dispose() {
    this.stopMusic()
    this.stopCalmPad()
    this.stopCrackerAudio()
    this.stopCalmAudio()
    this.stopAllCues()
    if (this.ctx && this._supported) {
      try {
        this.ctx.close()
      } catch {}
    }
    this.ctx = null
    this._initialized = false
  }
}

// Singleton instance for the app
let _instance = null
export function getSoundEngine() {
  if (!_instance) _instance = new SoundEngine()
  return _instance
}
