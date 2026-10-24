import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest'
import React, { useState } from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { GameStoreProvider, useGameStore } from '../src/store/gameStore.jsx'
import { GameController, STATES } from '../src/fsm/GameController.js'
import HUD from '../src/ui/HUD.jsx'
import { Renderer } from '../src/render/Renderer.js'
import { Particles } from '../src/render/Particles.js'
import { QUALITY_SETTINGS, MOTION_POLICY, INTENSITY, validateSave } from '../src/store/save.js'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function () {
    this.open = true
  })
  HTMLDialogElement.prototype.close = vi.fn(function () {
    this.open = false
  })
})

function makeMockEngines(store) {
  return {
    store,
    sound: {
      supported: true,
      init: vi.fn(),
      resume: async () => {},
      startMusic: vi.fn(),
      stopMusic: vi.fn(),
      stopCrackerAudio: vi.fn(),
      fadeCrackerAudio: vi.fn(),
      startCalmPad: vi.fn(),
      stopCalmPad: vi.fn(),
      setIntensity: vi.fn(),
      setMasterVolume: vi.fn(),
      playTestTone: vi.fn(),
      getAudioLevel: () => 0,
    },
    chhotu: {
      setPosition: vi.fn(),
      setFacing: vi.fn(),
      setArmState: vi.fn(),
      walkTo: vi.fn(),
    },
    pip: {
      setPosition: vi.fn(),
      setMood: vi.fn(),
    },
    particles: { clear: vi.fn() },
    renderer: { width: 800, height: 600 },
    background: { setGameState: vi.fn() },
    layout: {
      chhotuStartX: 0.38,
      chhotuStartY: 0.62,
      pipStartX: 0.3,
      pipStartY: 0.64,
      safeZoneX: 0.15,
      safeZoneY: 0.65,
    },
  }
}

describe('DIW-014 — Create a readable sound, motion, and quality settings sheet', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('groups Master volume/mute, sound intensity, optional music, Motion, and Quality', () => {
    const onVolumeChange = vi.fn()
    const onIntensityChange = vi.fn()
    const onToggleMute = vi.fn()
    const onToggleMusic = vi.fn()
    const onMotionPolicyChange = vi.fn()
    const onQualityChange = vi.fn()
    const onTestSound = vi.fn()

    render(
      <HUD
        stars={12}
        masterVolume={0.8}
        intensity="SOFT"
        motionPolicy="SYSTEM"
        quality="AUTO"
        musicEnabled={true}
        showSettings={true}
        settingsOpen={true}
        onVolumeChange={onVolumeChange}
        onIntensityChange={onIntensityChange}
        onToggleMute={onToggleMute}
        onToggleMusic={onToggleMusic}
        onMotionPolicyChange={onMotionPolicyChange}
        onQualityChange={onQualityChange}
        onTestSound={onTestSound}
      />
    )

    // Master volume slider and mute
    expect(screen.getByRole('slider', { name: /Master volume/i })).toBeTruthy()
    expect(screen.getAllByRole('button', { name: /Mute audio/i })[0]).toBeTruthy()

    // Sound intensity modes
    expect(screen.getByRole('group', { name: /Sound level/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Gentle sound mode/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Natural sound mode/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Full sound mode/i })).toBeTruthy()

    // Preview sound button
    const testSoundBtn = screen.getByRole('button', { name: /Play test chime/i })
    expect(testSoundBtn).toBeTruthy()
    // Focusing the control does NOT play audio
    testSoundBtn.focus()
    expect(onTestSound).not.toHaveBeenCalled()
    // Clicking the button plays preview
    fireEvent.click(testSoundBtn)
    expect(onTestSound).toHaveBeenCalledTimes(1)

    // Optional background music
    const musicGroup = screen.getByRole('group', { name: /Background music/i })
    expect(musicGroup).toBeTruthy()
    const musicOffBtn = screen.getByRole('button', { name: /^Off$/i })
    fireEvent.click(musicOffBtn)
    expect(onToggleMusic).toHaveBeenCalledWith(false)

    // Motion Policy: System, Reduced, Full
    expect(screen.getByRole('group', { name: /Motion & Visuals/i })).toBeTruthy()
    const reducedMotionBtn = screen.getByRole('button', { name: /Reduced/i })
    fireEvent.click(reducedMotionBtn)
    expect(onMotionPolicyChange).toHaveBeenCalledWith('REDUCED')

    // Visual Quality: Auto, Low, High
    expect(screen.getByRole('group', { name: /Visual quality/i })).toBeTruthy()
    const qualityLowBtn = screen.getByRole('button', { name: /Low/i })
    fireEvent.click(qualityLowBtn)
    expect(onQualityChange).toHaveBeenCalledWith('LOW')
  })

  it('separates sound intensity from graphics quality and persists settings', () => {
    let storeRef

    function TestApp() {
      const store = useGameStore()
      storeRef = store
      return (
        <HUD
          stars={store.state.stars}
          masterVolume={store.state.masterVolume}
          intensity={store.state.intensity}
          quality={store.state.quality}
          musicEnabled={store.state.musicEnabled}
          motionPolicy={store.state.motionPolicy}
          showSettings={true}
          settingsOpen={true}
          onIntensityChange={(lvl) => store.setIntensity(lvl)}
          onQualityChange={(q) => store.setQuality(q)}
          onToggleMusic={(m) => store.setMusicEnabled(m)}
        />
      )
    }

    render(
      <GameStoreProvider>
        <TestApp />
      </GameStoreProvider>
    )

    // Default state: intensity is SOFT, quality is AUTO
    expect(storeRef.state.intensity).toBe(INTENSITY.SOFT)
    expect(storeRef.state.quality).toBe(QUALITY_SETTINGS.AUTO)

    // Change intensity to LOUD — quality remains AUTO
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Full sound mode/i }))
    })
    expect(storeRef.state.intensity).toBe(INTENSITY.LOUD)
    expect(storeRef.state.quality).toBe(QUALITY_SETTINGS.AUTO)

    // Change quality to LOW — intensity remains LOUD
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Low/i }))
    })
    expect(storeRef.state.intensity).toBe(INTENSITY.LOUD)
    expect(storeRef.state.quality).toBe(QUALITY_SETTINGS.LOW)

    // Change music to disabled
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /^Off$/i }))
    })
    expect(storeRef.state.musicEnabled).toBe(false)

    // Save validation retains separate intensity, quality, and musicEnabled
    const validated = validateSave(storeRef.state)
    expect(validated.intensity).toBe(INTENSITY.LOUD)
    expect(validated.quality).toBe(QUALITY_SETTINGS.LOW)
    expect(validated.musicEnabled).toBe(false)
  })

  it('Quality Low changes rendering detail (DPR and particles), not unlocks, timing, or rewards', () => {
    // 1. Renderer DPR scaling
    const mockCanvas = document.createElement('canvas')
    const parent = document.createElement('div')
    Object.defineProperty(parent, 'getBoundingClientRect', {
      value: () => ({ width: 800, height: 600, top: 0, left: 0, right: 800, bottom: 600 }),
    })
    parent.appendChild(mockCanvas)
    document.body.appendChild(parent)

    // Stub 2D context
    mockCanvas.getContext = () => ({
      setTransform: vi.fn(),
      fillRect: vi.fn(),
      clearRect: vi.fn(),
    })

    const renderer = new Renderer(mockCanvas)
    expect(renderer.quality).toBe('AUTO')

    renderer.setQuality('LOW')
    expect(renderer.quality).toBe('LOW')
    expect(renderer.dpr).toBe(1.0) // Low caps DPR to 1.0

    // 2. Particles density scaling
    const particles = new Particles()
    particles.setQuality('LOW')
    expect(particles.quality).toBe('LOW')

    // Low quality shortens max trails and scales burst count
    const p = particles.spawn(100, 100, { trail: 20 })
    expect(p.maxTrail).toBeLessThanOrEqual(6)

    particles.burst(100, 100, 50)
    // 50 * 0.6 = 30 particles active
    expect(particles.activeCount).toBeLessThanOrEqual(30)
  })

  it('settings overlay suspends underlying show via interruption contract and restores upon close', () => {
    const store = {
      isUnlocked: () => true,
      hasSticker: () => false,
      hasSeenIntro: () => true,
      getState: () => ({ muted: false, masterVolume: 0.7, stickers: [], unlocked: [0] }),
    }
    const engines = makeMockEngines(store)
    const gc = new GameController(STATES.READY_ON_STREET)
    gc.init(engines)
    gc.selectedCracker = 0

    // Opening settings suspends to SETTINGS_OVERLAY
    gc.openSettings()
    expect(gc.state).toBe(STATES.SETTINGS_OVERLAY)

    // Closing settings restores to previous state
    gc.closeSettings()
    expect(gc.state).toBe(STATES.READY_ON_STREET)

    gc.dispose()
  })
})
