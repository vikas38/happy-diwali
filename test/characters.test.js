import { describe, it, expect } from 'vitest'
import { ChhotuChamp, ARM_STATES } from '../src/render/characters/ChhotuChamp.js'
import { Pip, PIP_MOODS } from '../src/render/characters/Pip.js'

describe('ChhotuChamp — arm state transitions', () => {
  it('starts in IDLE_WAVE state', () => {
    const c = new ChhotuChamp()
    expect(c.armState).toBe(ARM_STATES.IDLE_WAVE)
  })

  it('changes arm state and triggers lerp on setArmState', () => {
    const c = new ChhotuChamp()
    c.setArmState(ARM_STATES.COVER_EARS_SMILE)
    expect(c.armState).toBe(ARM_STATES.COVER_EARS_SMILE)
    expect(c._armLerp).toBe(0) // lerp starts at 0
  })

  it('does not reset lerp if setting the same state', () => {
    const c = new ChhotuChamp()
    c._armLerp = 0.5
    c.setArmState(ARM_STATES.IDLE_WAVE) // same as initial
    expect(c._armLerp).toBe(0.5) // unchanged
  })

  it('lerps current pose toward target over time', () => {
    const c = new ChhotuChamp()
    const initialLy = c._currentPose.ly
    c.setArmState(ARM_STATES.COVER_EARS_SMILE)
    // After several update steps, pose should move toward target
    for (let i = 0; i < 50; i++) {
      c.update(0.016, i * 0.016)
    }
    // Should be close to the target pose
    expect(c._currentPose.ly).toBeCloseTo(-14, 0) // COVER_EARS_SMILE ly target
  })

  it('completes lerp and sets _armLerp to 1', () => {
    const c = new ChhotuChamp()
    c.setArmState(ARM_STATES.VICTORY_JUMP)
    for (let i = 0; i < 50; i++) {
      c.update(0.016, i * 0.016)
    }
    expect(c._armLerp).toBe(1)
  })

  it('triggers eye crinkle for COVER_EARS_SMILE', () => {
    const c = new ChhotuChamp()
    c.setArmState(ARM_STATES.COVER_EARS_SMILE)
    expect(c._eyeCrinkleTarget).toBe(1)
    for (let i = 0; i < 50; i++) c.update(0.016, i * 0.016)
    expect(c._eyeCrinkle).toBeGreaterThan(0.9)
  })
})

describe('ChhotuChamp — walk animation', () => {
  it('interpolates position during walk', () => {
    const c = new ChhotuChamp()
    c.walkTo(0, 100, 200, 100, 1.0)
    expect(c.walkActive).toBe(true)
    // Halfway through
    for (let i = 0; i < 31; i++) c.update(0.016, i * 0.016)
    expect(c.x).toBeGreaterThan(50)
    expect(c.x).toBeLessThan(200)
    expect(c.walkActive).toBe(true)
  })

  it('stops walking and calls onDone callback when complete', () => {
    const c = new ChhotuChamp()
    let doneCalled = false
    c.walkTo(0, 0, 100, 0, 0.5, () => {
      doneCalled = true
    })
    for (let i = 0; i < 40; i++) c.update(0.016, i * 0.016)
    expect(c.walkActive).toBe(false)
    expect(doneCalled).toBe(true)
    expect(c.x).toBeCloseTo(100, 0)
  })
})

describe('Pip — flame flicker tracks audio level', () => {
  it('has low flame flicker with no audio', () => {
    const p = new Pip()
    p.getAudioLevel = () => 0
    p.update(0.016, 0)
    expect(p._flameFlicker).toBeLessThan(1.0)
  })

  it('flame flicker increases with audio level', () => {
    const p1 = new Pip()
    p1.getAudioLevel = () => 0
    p1.update(0.016, 1.0)
    const lowFlicker = p1._flameFlicker

    const p2 = new Pip()
    p2.getAudioLevel = () => 1
    p2.update(0.016, 1.0)
    const highFlicker = p2._flameFlicker

    expect(highFlicker).toBeGreaterThan(lowFlicker)
    expect(highFlicker).toBeGreaterThan(1.0)
  })

  it('flame flicker scales proportionally with audio level', () => {
    const p = new Pip()
    p.getAudioLevel = () => 0.5
    p.update(0.016, 1.0)
    expect(p._flameFlicker).toBeGreaterThan(0.5)
  })
})

describe('Pip — moods', () => {
  it('starts in IDLE mood', () => {
    const p = new Pip()
    expect(p.mood).toBe(PIP_MOODS.IDLE)
  })

  it('sets hide target when mood is HIDE', () => {
    const p = new Pip()
    p.setMood(PIP_MOODS.HIDE)
    expect(p._hideTarget).toBe(1)
    for (let i = 0; i < 50; i++) p.update(0.016, i * 0.016)
    expect(p._hideAmount).toBeGreaterThan(0.9)
  })

  it('spawns hearts during HAPPY mood', () => {
    const p = new Pip()
    p.setMood(PIP_MOODS.HAPPY)
    for (let i = 0; i < 40; i++) p.update(0.016, i * 0.016)
    expect(p._hearts.length).toBeGreaterThan(0)
  })
})
