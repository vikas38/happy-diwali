import { describe, it, expect } from 'vitest'
import {
  SoundEngine,
  INTENSITY_PROFILES,
  COMPRESSOR_SETTINGS,
} from '../src/audio/SoundEngine.js'

describe('SoundEngine — intensity profiles', () => {
  describe('INTENSITY_PROFILES', () => {
    it('has SOFT with gain 0.22 and cutoff 900Hz', () => {
      expect(INTENSITY_PROFILES.SOFT).toEqual({ gain: 0.22, cutoff: 900 })
    })

    it('has NORMAL with gain 0.55 and cutoff 2800Hz', () => {
      expect(INTENSITY_PROFILES.NORMAL).toEqual({ gain: 0.55, cutoff: 2800 })
    })

    it('has LOUD with gain 1.0 and cutoff 8000Hz', () => {
      expect(INTENSITY_PROFILES.LOUD).toEqual({ gain: 1.0, cutoff: 8000 })
    })

    it('gains increase monotonically SOFT < NORMAL < LOUD', () => {
      expect(INTENSITY_PROFILES.SOFT.gain).toBeLessThan(INTENSITY_PROFILES.NORMAL.gain)
      expect(INTENSITY_PROFILES.NORMAL.gain).toBeLessThan(INTENSITY_PROFILES.LOUD.gain)
    })

    it('cutoffs increase monotonically SOFT < NORMAL < LOUD', () => {
      expect(INTENSITY_PROFILES.SOFT.cutoff).toBeLessThan(INTENSITY_PROFILES.NORMAL.cutoff)
      expect(INTENSITY_PROFILES.NORMAL.cutoff).toBeLessThan(INTENSITY_PROFILES.LOUD.cutoff)
    })
  })

  describe('SoundEngine.getProfile', () => {
    it('returns the correct profile for each mode', () => {
      expect(SoundEngine.getProfile('SOFT')).toEqual({ gain: 0.22, cutoff: 900 })
      expect(SoundEngine.getProfile('NORMAL')).toEqual({ gain: 0.55, cutoff: 2800 })
      expect(SoundEngine.getProfile('LOUD')).toEqual({ gain: 1.0, cutoff: 8000 })
    })

    it('falls back to SOFT for unknown modes', () => {
      expect(SoundEngine.getProfile('EXTREME')).toEqual(INTENSITY_PROFILES.SOFT)
      expect(SoundEngine.getProfile(undefined)).toEqual(INTENSITY_PROFILES.SOFT)
    })
  })
})

describe('SoundEngine — safety compressor settings', () => {
  it('threshold is -12 dB', () => {
    expect(COMPRESSOR_SETTINGS.threshold).toBe(-12)
  })

  it('ratio is 8:1', () => {
    expect(COMPRESSOR_SETTINGS.ratio).toBe(8)
  })

  it('attack is 0.002 seconds', () => {
    expect(COMPRESSOR_SETTINGS.attack).toBe(0.002)
  })

  it('has a release value', () => {
    expect(COMPRESSOR_SETTINGS.release).toBeGreaterThan(0)
  })

  it('has a knee value', () => {
    expect(COMPRESSOR_SETTINGS.knee).toBeGreaterThanOrEqual(0)
  })
})

describe('SoundEngine — state before init', () => {
  it('defaults to SOFT intensity', () => {
    const se = new SoundEngine()
    expect(se.intensity).toBe('SOFT')
  })

  it('defaults master volume to 0.7', () => {
    const se = new SoundEngine()
    expect(se.masterVolume).toBe(0.7)
  })

  it('is not initialized before init()', () => {
    const se = new SoundEngine()
    expect(se._initialized).toBe(false)
  })

  it('setIntensity updates stored intensity even before init', () => {
    const se = new SoundEngine()
    se.setIntensity('LOUD')
    expect(se.intensity).toBe('LOUD')
  })

  it('setMasterVolume clamps to 0..1', () => {
    const se = new SoundEngine()
    se.setMasterVolume(5)
    expect(se.masterVolume).toBe(1)
    se.setMasterVolume(-3)
    expect(se.masterVolume).toBe(0)
    se.setMasterVolume(0.5)
    expect(se.masterVolume).toBe(0.5)
  })

  it('getAudioLevel returns 0 before init', () => {
    const se = new SoundEngine()
    expect(se.getAudioLevel()).toBe(0)
  })
})

describe('SoundEngine — music definitions', () => {
  it('pentatonic scale has all 5 Raag Bhopali notes (C D E G A) in two octaves', () => {
    const notes = SoundEngine.PENTATONIC
    expect(notes.C4).toBeCloseTo(261.63, 1)
    expect(notes.D4).toBeCloseTo(293.66, 1)
    expect(notes.E4).toBeCloseTo(329.63, 1)
    expect(notes.G4).toBeCloseTo(392.0, 1)
    expect(notes.A4).toBeCloseTo(440.0, 1)
    expect(notes.C5).toBeCloseTo(523.25, 1)
  })

  it('melody only uses pentatonic notes', () => {
    const validNotes = new Set(Object.keys(SoundEngine.PENTATONIC))
    for (const [noteName] of SoundEngine.MELODY) {
      expect(validNotes.has(noteName)).toBe(true)
    }
  })

  it('melody has 16 notes', () => {
    expect(SoundEngine.MELODY.length).toBe(16)
  })

  it('melody note durations are uniform (0.4s)', () => {
    for (const [, dur] of SoundEngine.MELODY) {
      expect(dur).toBe(0.4)
    }
  })

  it('calm chords are Fmaj7 and Cmaj7', () => {
    // Fmaj7: F A C E
    expect(SoundEngine.CALM_CHORDS[0]).toEqual([174.61, 220.0, 261.63, 329.63])
    // Cmaj7: C E G B
    expect(SoundEngine.CALM_CHORDS[1]).toEqual([130.81, 164.81, 196.0, 246.94])
  })

  it('each calm chord has 4 notes', () => {
    for (const chord of SoundEngine.CALM_CHORDS) {
      expect(chord.length).toBe(4)
    }
  })
})
