import { limiterCurve, MASTER_CEILING_DB, MASTER_CEILING_LINEAR } from '../safety/limits.js'
export { MASTER_CEILING_DB, MASTER_CEILING_LINEAR } from '../safety/limits.js'
// ===================================================================
// SoundEngine — Web Audio API DSP & Fear-Reduction Engine
// ===================================================================
//
// Master Signal Chain:
//   Source Nodes
//     -> IntensityGain (per-mode gain multiplier)
//     -> IntensityFilter (low-pass, per-mode cutoff)
//     -> MasterVolumeGain (user volume slider 0..1)
//     -> SafetyCompressor (threshold -12dB, ratio 8:1, attack 0.002s)
//     -> AudioContext.destination
//
// An AnalyserNode taps the compressor output so the character flame
// can flicker in rhythm with the actual audio.
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
    this.intensityGain = null
    this.intensityFilter = null
    this.masterGain = null
    this.compressor = null
    this.analyser = null
    this.analyserData = null

    this.intensity = 'SOFT'
    this.masterVolume = 0.7

    this._initialized = false
    this._noiseBuffers = {} // cached noise buffer sources
    this._activeNodes = new Set() // nodes to fade/stop for calm corner
    this._calmNodes = new Set() // calm-corner-specific nodes
    this._crackerNodes = new Set() // cracker-effect-specific nodes
    this._musicNodes = new Set() // background music nodes
    this._musicPlaying = false
    this._calmPlaying = false
    this._crackerPlaying = false
  }

  // -----------------------------------------------------------------
  // Initialization & lifecycle
  // -----------------------------------------------------------------

  /**
   * Create the AudioContext and wire up the master signal chain.
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

    // Build the chain: intensityGain -> intensityFilter -> masterGain -> compressor -> destination
    this.intensityGain = this.ctx.createGain()
    this.intensityFilter = this.ctx.createBiquadFilter()
    this.masterGain = this.ctx.createGain()
    this.compressor = this.ctx.createDynamicsCompressor()
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

    // Apply initial intensity and volume
    const profile = INTENSITY_PROFILES[this.intensity] || INTENSITY_PROFILES.SOFT
    this.intensityGain.gain.value = profile.gain
    this.intensityFilter.frequency.value = profile.cutoff
    this.masterGain.gain.value = this.masterVolume

    // Analyser config for flame flicker
    this.analyser.fftSize = 256
    this.analyser.smoothingTimeConstant = 0.6
    this.analyserData = new Uint8Array(this.analyser.frequencyBinCount)

    // Wire: intensityGain -> filter -> masterGain -> compressor
    this.intensityGain.connect(this.intensityFilter)
    this.intensityFilter.connect(this.masterGain)
    this.masterGain.connect(this.compressor)
    // Compressor -> destination
    this.outputLimiter = this.ctx.createWaveShaper()
    this.outputLimiter.curve = limiterCurve()
    this.outputLimiter.oversample = 'none'
    this.compressor.connect(this.outputLimiter)
    this.outputLimiter.connect(this.ctx.destination)
    // Compressor -> analyser (tap for level reading)
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
   * Set the three-tier intensity mode. Updates gain + low-pass cutoff live.
   * @param {'SOFT'|'NORMAL'|'LOUD'} intensity
   */
  setIntensity(intensity) {
    this.intensity = intensity
    if (!this.ctx || !this._supported) return
    const profile = INTENSITY_PROFILES[intensity] || INTENSITY_PROFILES.SOFT
    const now = this.ctx.currentTime
    this.intensityGain.gain.setTargetAtTime(profile.gain, now, RAMP_TIME)
    this.intensityFilter.frequency.setTargetAtTime(profile.cutoff, now, RAMP_TIME)
  }

  /**
   * Set the master volume (0..1). Updates live.
   * @param {number} vol
   */
  setMasterVolume(vol) {
    this.masterVolume = Math.min(1, Math.max(0, vol))
    if (!this.ctx || !this._supported) return
    const now = this.ctx.currentTime
    this.masterGain.gain.setTargetAtTime(this.masterVolume, now, RAMP_TIME)
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
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.969 * b2 + white * 0.153852
      b3 = 0.8665 * b3 + white * 0.3104856
      b4 = 0.55 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.016898
      pData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
      b6 = white * 0.115926
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
    // Return unconnected node; callers wire explicit routing (filter -> env -> bus -> panner)
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
   * The chain input node that sources should connect to.
   */
  get chainInput() {
    return this.intensityGain
  }

  // -----------------------------------------------------------------
  // Node tracking (for calm corner fade-out)
  // -----------------------------------------------------------------

  /**
   * Register a cracker-effect node so it can be faded/stopped by the calm corner.
   * The node should be connected to chainInput.
   * @param {AudioNode} node - typically the first node in a cracker's signal chain
   * @param {AudioNode} [gainNode] - a gain node to fade (optional, for volume fade)
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
   * Register a calm-corner node (these are NOT faded by the calm corner itself).
   */
  trackCalmNode(node) {
    this._calmNodes.add(node)
  }

  // -----------------------------------------------------------------
  // Test tone (for Task 3 demo)
  // -----------------------------------------------------------------

  /**
   * Play a short test tone to verify the audio chain works.
   * @param {number} freq - frequency in Hz
   * @param {number} duration - seconds
   */
  playTestTone(freq = 440, duration = 0.4) {
    if (!this.ctx || !this._supported) return
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.5, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)
    osc.connect(gain)
    gain.connect(this.intensityGain)
    osc.start(now)
    osc.stop(now + duration + 0.05)
  }

  /**
   * Play a soft chime at the active intensity level through the master limiter.
   * Useful for testing sound in the settings sheet.
   */
  playTestChime() {
    if (!this.ctx || !this._supported) return null
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
    gain.connect(this.intensityGain)
    osc.start(now)
    osc.stop(now + 0.65)
    return osc
  }

  // -----------------------------------------------------------------
  // Background festive music — pentatonic plucked melody loop
  // (Raag Bhopali / Desh inspired: C D E G A)
  // -----------------------------------------------------------------

  // Pentatonic note frequencies (C4–A5)
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

  // A gentle, slow melodic phrase (16 notes, ~400ms each)
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

  // Calm Corner chords (Fmaj7 / Cmaj7), low octave for warmth
  static CALM_CHORDS = [
    [174.61, 220.0, 261.63, 329.63], // Fmaj7: F A C E
    [130.81, 164.81, 196.0, 246.94], // Cmaj7: C E G B
  ]

  /**
   * Start the background festive melody loop at low volume.
   */
  startMusic() {
    if (!this.ctx || !this._supported || this._musicPlaying) return
    this._musicPlaying = true
    this._musicGain = this.ctx.createGain()
    this._musicGain.gain.value = 0.35
    this._musicGain.connect(this.intensityGain)
    this._musicNoteIndex = 0
    this._nextNoteTime = this.ctx.currentTime + 0.1
    this._musicTimer = setInterval(() => this._scheduleMusic(), 25)
  }

  /**
   * Internal lookahead scheduler for the melody.
   */
  _scheduleMusic() {
    if (!this._musicPlaying || !this.ctx) return
    const lookahead = 0.1 // seconds to look ahead
    while (this._nextNoteTime < this.ctx.currentTime + lookahead) {
      const [noteName, dur] = SoundEngine.MELODY[this._musicNoteIndex]
      const freq = SoundEngine.PENTATONIC[noteName]
      this._playPluckNote(freq, this._nextNoteTime, dur)
      this._nextNoteTime += dur
      this._musicNoteIndex = (this._musicNoteIndex + 1) % SoundEngine.MELODY.length
    }
  }

  /**
   * Play a single plucked marimba/sitar note.
   * @param {number} freq - frequency
   * @param {number} time - start time (audio clock)
   * @param {number} dur - note duration in seconds
   */
  _playPluckNote(freq, time, dur) {
    // Fundamental: triangle oscillator with fast attack + exponential decay
    const osc = this.ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = freq

    // Slight pitch wobble for sitar character
    const wobble = this.ctx.createOscillator()
    wobble.type = 'sine'
    wobble.frequency.value = 5 // 5 Hz vibrato
    const wobbleGain = this.ctx.createGain()
    wobbleGain.gain.value = freq * 0.005
    wobble.connect(wobbleGain)
    wobbleGain.connect(osc.frequency)

    // Bandpass filter for marimba warmth
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = freq * 2
    filter.Q.value = 2

    // Amplitude envelope: pluck
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0, time)
    gain.gain.linearRampToValueAtTime(0.5, time + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.9)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this._musicGain)

    osc.start(time)
    osc.stop(time + dur + 0.05)
    wobble.start(time)
    wobble.stop(time + dur + 0.05)
  }

  /**
   * Stop the background music.
   */
  stopMusic() {
    this._musicPlaying = false
    if (this._musicTimer) {
      clearInterval(this._musicTimer)
      this._musicTimer = null
    }
    if (this._musicGain) {
      try {
        this._musicGain.disconnect()
      } catch (e) {
        // ignore
      }
      this._musicGain = null
    }
  }

  // -----------------------------------------------------------------
  // Calm Corner pad — warm slow-attack chord drone
  // (Fmaj7 / Cmaj7, synced with the 4-second breathing guide)
  // -----------------------------------------------------------------

  /**
   * Start the calm corner ambient pad. Alternates Fmaj7 / Cmaj7 every
   * 8 seconds (two breath cycles) with slow attack/release.
   */
  startCalmPad() {
    if (!this.ctx || !this._supported || this._calmPlaying) return
    this._calmPlaying = true
    this._calmGain = this.ctx.createGain()
    this._calmGain.gain.value = 0
    this._calmGain.connect(this.intensityGain)
    this.trackCalmNode(this._calmGain)

    this._calmChordIndex = 0
    this._calmNextTime = this.ctx.currentTime + 0.1
    this._calmTimer = setInterval(() => this._scheduleCalmPad(), 25)
  }

  /**
   * Internal scheduler for calm pad chord cycling.
   */
  _scheduleCalmPad() {
    if (!this._calmPlaying || !this.ctx) return
    const lookahead = 0.1
    while (this._calmNextTime < this.ctx.currentTime + lookahead) {
      this._playPadChord(SoundEngine.CALM_CHORDS[this._calmChordIndex], this._calmNextTime)
      this._calmNextTime += 8 // each chord lasts 8 seconds (two breath cycles)
      this._calmChordIndex = (this._calmChordIndex + 1) % SoundEngine.CALM_CHORDS.length
    }
  }

  /**
   * Play a single chord as a set of detuned sine oscillators with slow attack.
   * @param {number[]} freqs - chord note frequencies
   * @param {number} time - start time
   */
  _playPadChord(freqs, time) {
    const chordDur = 8
    // Fade the master calm gain in over 2s, out over 2s (within the chord duration)
    this._calmGain.gain.cancelScheduledValues(time)
    this._calmGain.gain.setValueAtTime(0, time)
    this._calmGain.gain.linearRampToValueAtTime(0.18, time + 2)
    this._calmGain.gain.setValueAtTime(0.18, time + chordDur - 2)
    this._calmGain.gain.linearRampToValueAtTime(0, time + chordDur)

    for (const freq of freqs) {
      // Main oscillator
      const osc = this.ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq

      // Slightly detuned second oscillator for warmth/chorus
      const osc2 = this.ctx.createOscillator()
      osc2.type = 'triangle'
      osc2.frequency.value = freq * 1.003

      const noteGain = this.ctx.createGain()
      noteGain.gain.value = 0.5

      osc.connect(noteGain)
      osc2.connect(noteGain)
      noteGain.connect(this._calmGain)

      osc.start(time)
      osc.stop(time + chordDur + 0.1)
      osc2.start(time)
      osc2.stop(time + chordDur + 0.1)
    }
  }

  /**
   * Stop the calm corner pad.
   */
  stopCalmPad() {
    this._calmPlaying = false
    if (this._calmTimer) {
      clearInterval(this._calmTimer)
      this._calmTimer = null
    }
    if (this._calmGain) {
      const now = this.ctx ? this.ctx.currentTime : 0
      try {
        this._calmGain.gain.cancelScheduledValues(now)
        this._calmGain.gain.setValueAtTime(this._calmGain.gain.value, now)
        this._calmGain.gain.linearRampToValueAtTime(0, now + 0.2)
      } catch (e) {
        // ignore
      }
      this._calmGain = null
    }
    // stopCalmAudio (inherited) will handle remaining tracked nodes
  }

  // -----------------------------------------------------------------
  // Calm corner audio control (pause / resume cracker audio)
  // -----------------------------------------------------------------

  /**
   * Fade out all cracker-effect audio over a given duration.
   * @param {number} ms - fade duration in milliseconds
   */
  fadeCrackerAudio(ms = 150) {
    if (!this.ctx || !this._supported) return
    const now = this.ctx.currentTime
    const dur = ms / 1000
    this._crackerNodes.forEach(({ gain }) => {
      if (gain && gain.gain) {
        gain.gain.cancelScheduledValues(now)
        gain.gain.setValueAtTime(gain.gain.value, now)
        gain.gain.linearRampToValueAtTime(0, now + dur)
      }
    })
  }

  /**
   * Stop and disconnect all tracked cracker nodes.
   */
  stopCrackerAudio() {
    this._crackerNodes.forEach(({ node }) => {
      try {
        if (node.stop) node.stop()
      } catch (e) {
        // already stopped
      }
      try {
        node.disconnect()
      } catch (e) {
        // already disconnected
      }
    })
    this._crackerNodes.clear()
    this._crackerPlaying = false
  }

  /**
   * Stop calm-corner nodes.
   */
  stopCalmAudio() {
    this._calmNodes.forEach((node) => {
      try {
        if (node.stop) node.stop()
      } catch (e) {
        // already stopped
      }
      try {
        node.disconnect()
      } catch (e) {
        // already disconnected
      }
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
    if (this.ctx && this._supported) {
      this.ctx.close()
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
