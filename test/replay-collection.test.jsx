import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import App from '../src/App.jsx'
import SafetySplash from '../src/ui/SafetySplash.jsx'
import RewardOverlay from '../src/ui/RewardOverlay.jsx'
import HUD from '../src/ui/HUD.jsx'
import { CRACKERS } from '../src/crackers/crackerDefs.js'
import { GameStoreProvider, useGameStore } from '../src/store/gameStore.jsx'
import { SAVE_KEY, createDefaultSave, validateSave, SPARKLE_PALETTES } from '../src/store/save.js'
import { playCrackerShow } from '../src/crackers/crackerControllers.js'
import { GameController, STATES } from '../src/fsm/GameController.js'
import { STRINGS_EN } from '../src/i18n/strings.en.js'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function () {
    this.open = true
  })
  HTMLDialogElement.prototype.close = vi.fn(function () {
    this.open = false
  })
  window.scrollTo = vi.fn()
})

describe('Task D1 — Replay, Onboarding, and Whole-Collection Completion', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('1. Pre-start settings before first audio cue', () => {
    it('allows a new player to choose Silent or Gentle visuals on SafetySplash before starting', () => {
      const handleStart = vi.fn()
      let storeRef = null
      function TestConsumer() {
        storeRef = useGameStore()
        return <SafetySplash onStart={handleStart} />
      }

      render(
        <GameStoreProvider>
          <TestConsumer />
        </GameStoreProvider>
      )

      // Sound and Visuals toggle buttons are rendered
      const soundBtn = screen.getByRole('button', { name: /Gentle sound/i })
      const visualsBtn = screen.getByRole('button', { name: /Festive visuals/i })
      expect(soundBtn).toBeTruthy()
      expect(visualsBtn).toBeTruthy()

      // Toggle silent
      fireEvent.click(soundBtn)
      expect(screen.getByRole('button', { name: /Silent/i })).toBeTruthy()
      expect(storeRef.state.muted).toBe(true)
      expect(storeRef.state.masterVolume).toBe(0)

      // Toggle gentle visuals
      fireEvent.click(visualsBtn)
      expect(screen.getByRole('button', { name: /Gentle visuals/i })).toBeTruthy()
      expect(storeRef.state.calmVisuals).toBe(true)

      // Confirm start
      const startBtn = screen.getByRole('button', { name: /Step into the courtyard/i })
      fireEvent.click(startBtn)
      expect(handleStart).toHaveBeenCalledWith({ silent: true, gentleVisuals: true })
      expect(storeRef.state.seenSplash).toBe(true)
    })

    it('persists seenSplash so returning players streamline entry', () => {
      const save = createDefaultSave()
      save.seenSplash = true
      localStorage.setItem(SAVE_KEY, JSON.stringify(save))

      const loaded = validateSave(JSON.parse(localStorage.getItem(SAVE_KEY)))
      expect(loaded.seenSplash).toBe(true)
    })
  })

  describe('2. Culturally familiar names with plain-language descriptors', () => {
    it('CRACKERS definitions pair cultural names with descriptive English subtitles', () => {
      expect(CRACKERS[0].name).toBe('Phuljhari')
      expect(CRACKERS[0].descriptor).toBe('Sparkler')
      expect(CRACKERS[0].fullName).toBe('Phuljhari · Sparkler')

      expect(CRACKERS[1].name).toBe('Anar')
      expect(CRACKERS[1].descriptor).toBe('Fountain')
      expect(CRACKERS[1].fullName).toBe('Anar · Fountain')

      expect(CRACKERS[2].name).toBe('Chakri')
      expect(CRACKERS[2].descriptor).toBe('Ground spinner')

      expect(CRACKERS[3].name).toBe('Rocket')
      expect(CRACKERS[3].descriptor).toBe('Sky rocket')

      expect(CRACKERS[4].name).toBe('Ladi')
      expect(CRACKERS[4].descriptor).toBe('Sparkle garland')

      expect(CRACKERS[5].name).toBe('Sutli Bomb')
      expect(CRACKERS[5].descriptor).toBe('Twine sounder')
    })
  })

  describe('3. Bounded expressive choice (Sparkle Palette)', () => {
    it('persists selected Sparkle Palette and provides selection in HUD Settings', async () => {
      let storeRef = null
      function TestHUD() {
        storeRef = useGameStore()
        return (
          <HUD
            onBack={vi.fn()}
            showSettings={true}
            settingsOpen={true}
            masterVolume={0.7}
            intensity="SOFT"
            stars={3}
            selectedPalette={storeRef.state.selectedPalette}
            onPaletteChange={(pal) => storeRef.setSparklePalette(pal)}
          />
        )
      }

      render(
        <GameStoreProvider>
          <TestHUD />
        </GameStoreProvider>
      )

      expect(storeRef.state.selectedPalette).toBe(SPARKLE_PALETTES.GOLD)

      // Click Rainbow palette
      const rainbowBtn = screen.getByRole('button', { name: /Rainbow/i })
      fireEvent.click(rainbowBtn)
      expect(storeRef.state.selectedPalette).toBe(SPARKLE_PALETTES.RAINBOW)

      // Click Rose palette
      const roseBtn = screen.getByRole('button', { name: /Rose/i })
      fireEvent.click(roseBtn)
      expect(storeRef.state.selectedPalette).toBe(SPARKLE_PALETTES.ROSE)

      // Click Emerald palette
      const emeraldBtn = screen.getByRole('button', { name: /Emerald/i })
      fireEvent.click(emeraldBtn)
      expect(storeRef.state.selectedPalette).toBe(SPARKLE_PALETTES.EMERALD)
    })

    it('playCrackerShow uses selected palette without coupling to volume or intensity', () => {
      const mockSpawn = vi.fn()
      const mockFlash = vi.fn()
      let registeredLayer = null
      const engines = {
        particles: { spawn: mockSpawn, flash: mockFlash, calmVisuals: false, reducedMotion: false },
        renderer: {
          width: 800,
          height: 600,
          _calmVisuals: false,
          _reducedMotion: false,
          addLayer: (layer) => {
            registeredLayer = layer
          },
        },
        sound: {
          ctx: {
            currentTime: 0,
            destination: {},
            createGain: () => ({
              gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
              connect: vi.fn(),
            }),
            createBiquadFilter: () => ({ frequency: { value: 1000 }, connect: vi.fn() }),
          },
          playTone: vi.fn(),
          masterGain: { gain: { value: 0.7 } },
          effectsBus: { gain: { value: 1 }, connect: vi.fn() },
        },
        store: {
          state: { selectedPalette: SPARKLE_PALETTES.ROSE },
          getState: () => ({ selectedPalette: SPARKLE_PALETTES.ROSE }),
        },
        background: { setGameState: vi.fn() },
        jellySquash: { calmVisuals: false },
      }

      const cancel = playCrackerShow(0, engines, vi.fn())
      expect(registeredLayer).not.toBeNull()
      registeredLayer.update(0.016)

      expect(mockSpawn).toHaveBeenCalled()
      // Rose palette hues are around 330..360
      const firstSparkHue = mockSpawn.mock.calls[0][2]?.hue
      expect(firstSparkHue).toBeGreaterThanOrEqual(330)
      cancel()
    })
  })

  describe('4. Whole-collection completion state', () => {
    it('renders all-six-stickers completion celebration with the three required destination actions', () => {
      const handleReplay = vi.fn()
      const handleRangoli = vi.fn()
      const handleFinish = vi.fn()

      render(
        <RewardOverlay
          cracker={CRACKERS[5]}
          isNewSticker={true}
          allStickersCollected={true}
          onLightAgain={vi.fn()}
          onNextCracker={vi.fn()}
          onReplayFavourites={handleReplay}
          onMakeRangoli={handleRangoli}
          onFinishForNow={handleFinish}
          isLastCracker={true}
        />
      )

      // Celebration heading and copy
      expect(screen.getByText(/All 6 sparkles discovered/i)).toBeTruthy()
      expect(screen.getByText(/Your box of wonder is complete/i)).toBeTruthy()

      // The 3 destination actions
      const replayBtn = screen.getByRole('button', { name: /Replay your favourite fireworks/i })
      const rangoliBtn = screen.getByRole('button', { name: /Create and keep a rangoli gift/i })
      const finishBtn = screen.getByRole('button', { name: /Return to festival home/i })

      expect(replayBtn).toBeTruthy()
      expect(rangoliBtn).toBeTruthy()
      expect(finishBtn).toBeTruthy()

      fireEvent.click(replayBtn)
      expect(handleReplay).toHaveBeenCalledTimes(1)

      fireEvent.click(rangoliBtn)
      expect(handleRangoli).toHaveBeenCalledTimes(1)

      fireEvent.click(finishBtn)
      expect(handleFinish).toHaveBeenCalledTimes(1)
    })

    it('reload preserves all 6 collected stickers and star progress', () => {
      const completedSave = {
        ...createDefaultSave(),
        stickers: [0, 1, 2, 3, 4, 5],
        unlocked: [0, 1, 2, 3, 4, 5],
        stars: 18,
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(completedSave))

      const restored = validateSave(JSON.parse(localStorage.getItem(SAVE_KEY)))
      expect(restored.stickers).toEqual([0, 1, 2, 3, 4, 5])
      expect(restored.unlocked).toEqual([0, 1, 2, 3, 4, 5])
      expect(restored.stars).toBe(18)
    })
  })

  describe('5. Streamlined replay without redundant modal steps', () => {
    it('GameController selects already-seen cracker directly to READY_ON_STREET without intro card', () => {
      const gc = new GameController(STATES.IDLE)
      const mockStore = {
        state: { unlocked: [0, 1], seenIntros: [0], stickers: [0] },
        hasSeenIntro: (idx) => idx === 0,
        isUnlocked: (idx) => [0, 1].includes(idx),
        hasSticker: (idx) => idx === 0,
      }
      gc.init({
        store: mockStore,
        renderer: { width: 800, height: 600 },
        chhotu: { setPosition: vi.fn(), setFacing: vi.fn(), setArmState: vi.fn() },
        pip: { setPosition: vi.fn(), setMood: vi.fn() },
        sound: { init: vi.fn(), resume: vi.fn().mockResolvedValue() },
      })

      // Select cracker 0 (already seen intro)
      gc.selectCracker(0)
      // Immediately on street, bypassing CRACKER_INTRO_CARD
      expect(gc.state).toBe(STATES.READY_ON_STREET)
    })

    it('lightAgain from reward returns directly to READY_ON_STREET preserving safety sequence', () => {
      const gc = new GameController(STATES.REWARD_CELEBRATION)
      gc.selectedCracker = 0
      gc.init({
        renderer: { width: 800, height: 600 },
        chhotu: { setPosition: vi.fn(), setFacing: vi.fn(), setArmState: vi.fn() },
        pip: { setPosition: vi.fn(), setMood: vi.fn() },
      })

      gc.lightAgain()
      expect(gc.state).toBe(STATES.READY_ON_STREET)
    })
  })

  describe('6. Neutral choice copy', () => {
    it('uses neutral phrasing without pressure-oriented bravery words', () => {
      expect(STRINGS_EN.activity_spark_tag).toBe('CHOOSE YOUR SPARKLE')
      expect(STRINGS_EN.activity_spark_desc).toBe('Little sparkles. Explore at your own pace.')
      expect(STRINGS_EN.welcome_subtitle).not.toContain('brave')
      expect(STRINGS_EN.hero_desc_line2).not.toContain('find your brave')
      expect(STRINGS_EN.footer_text).not.toContain('courage')
    })
  })
})
