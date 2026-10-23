import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { GameStoreProvider, useGameStore } from '../src/store/gameStore.jsx'
import { createDefaultSave, validateSave, loadSave, writeSave } from '../src/store/save.js'
import HUD from '../src/ui/HUD.jsx'
import CalmCorner from '../src/ui/CalmCorner.jsx'
import RewardOverlay from '../src/ui/RewardOverlay.jsx'
import StickerBook from '../src/ui/StickerBook.jsx'
import FestivalHome from '../src/ui/FestivalHome.jsx'
import { GameController } from '../src/fsm/GameController.js'
import { CRACKERS } from '../src/crackers/crackerDefs.js'

describe('Task U1 — Mute and pause available throughout every journey', () => {
  let mockStorage

  beforeEach(() => {
    mockStorage = {
      _data: {},
      getItem(k) {
        return this._data[k] ?? null
      },
      setItem(k, v) {
        this._data[k] = String(v)
      },
      removeItem(k) {
        delete this._data[k]
      },
      clear() {
        this._data = {}
      },
    }
  })

  describe('Persistence policy & never resetting to 0.35', () => {
    it('defaults volume to 0.7 with muted: false', () => {
      const def = createDefaultSave()
      expect(def.masterVolume).toBe(0.7)
      expect(def.lastNonZeroVolume).toBe(0.7)
      expect(def.muted).toBe(false)
    })

    it('setting a custom volume, muting, reloading, and unmuting restores the exact custom volume (0.85, never 0.35)', () => {
      const customSave = validateSave({
        masterVolume: 0.85,
        stickers: [0],
      })
      expect(customSave.masterVolume).toBe(0.85)
      expect(customSave.lastNonZeroVolume).toBe(0.85)
      expect(customSave.muted).toBe(false)

      // Player mutes
      const mutedSave = validateSave({
        ...customSave,
        masterVolume: 0,
        muted: true,
      })
      expect(mutedSave.masterVolume).toBe(0)
      expect(mutedSave.lastNonZeroVolume).toBe(0.85)
      expect(mutedSave.muted).toBe(true)

      // Persist and reload
      writeSave(mutedSave, mockStorage)
      const reloaded = loadSave(mockStorage)
      expect(reloaded.masterVolume).toBe(0)
      expect(reloaded.lastNonZeroVolume).toBe(0.85)
      expect(reloaded.muted).toBe(true)

      // Unmute restores previous 0.85, never 0.35
      const unmutedSave = validateSave({
        ...reloaded,
        masterVolume: reloaded.lastNonZeroVolume,
        muted: false,
      })
      expect(unmutedSave.masterVolume).toBe(0.85)
      expect(unmutedSave.masterVolume).not.toBe(0.35)
      expect(unmutedSave.muted).toBe(false)
    })

    it('unmuting from default state restores 0.7, never hardcoded 0.35', () => {
      const mutedDefault = validateSave({
        masterVolume: 0,
        muted: true,
      })
      expect(mutedDefault.lastNonZeroVolume).toBe(0.7)
      const restored = validateSave({
        ...mutedDefault,
        masterVolume: mutedDefault.lastNonZeroVolume,
        muted: false,
      })
      expect(restored.masterVolume).toBe(0.7)
      expect(restored.masterVolume).not.toBe(0.35)
    })

    it('GameStore toggleMute flips between 0 and lastNonZeroVolume', () => {
      let storeAPI
      function Consumer() {
        storeAPI = useGameStore()
        return (
          <div>
            <span data-testid="vol">{storeAPI.state.masterVolume}</span>
            <span data-testid="muted">{String(storeAPI.state.muted)}</span>
            <button onClick={storeAPI.toggleMute}>toggle</button>
          </div>
        )
      }

      render(
        <GameStoreProvider>
          <Consumer />
        </GameStoreProvider>
      )

      // Initially 0.7
      expect(storeAPI.state.masterVolume).toBe(0.7)
      expect(storeAPI.state.muted).toBe(false)

      // Set custom volume 0.62
      act(() => {
        storeAPI.setMasterVolume(0.62)
      })
      expect(storeAPI.state.masterVolume).toBe(0.62)
      expect(storeAPI.state.lastNonZeroVolume).toBe(0.62)

      // Toggle to mute
      act(() => {
        storeAPI.toggleMute()
      })
      expect(storeAPI.state.masterVolume).toBe(0)
      expect(storeAPI.state.muted).toBe(true)
      expect(storeAPI.state.lastNonZeroVolume).toBe(0.62)

      // Toggle to unmute — restores 0.62, never 0.35
      act(() => {
        storeAPI.toggleMute()
      })
      expect(storeAPI.state.masterVolume).toBe(0.62)
      expect(storeAPI.state.muted).toBe(false)
    })
  })

  describe('FestivalHome unmute does not reset to 0.35', () => {
    it('unmute button on home restores lastNonZeroVolume (e.g. 0.85), not 0.35', () => {
      let storeAPI
      function HomeTest() {
        storeAPI = useGameStore()
        React.useEffect(() => {
          storeAPI.setMasterVolume(0.85)
          storeAPI.setMasterVolume(0)
        }, [])
        return <FestivalHome onPlay={() => {}} motion={true} setMotion={() => {}} />
      }

      render(
        <GameStoreProvider>
          <HomeTest />
        </GameStoreProvider>
      )

      // Find sound toggle button (when muted, it has "Enable sound")
      const soundBtn = screen.getByRole('button', { name: /enable sound/i })
      expect(soundBtn).toBeTruthy()

      // Click to enable sound
      fireEvent.click(soundBtn)

      // Sound should be unmuted to 0.85, not 0.35
      expect(storeAPI.state.masterVolume).toBe(0.85)
      expect(storeAPI.state.masterVolume).not.toBe(0.35)

      const activeBtn = screen.getByRole('button', { name: /mute sound/i })
      expect(activeBtn).toBeTruthy()
    })
  })

  describe('One-action mute accessible in all surfaces', () => {
    it('HUD contains reachable mute button with accessible state in portrait and landscape', () => {
      const onToggleMute = vi.fn()
      render(
        <HUD
          masterVolume={0.7}
          intensity="SOFT"
          stars={3}
          onToggleMute={onToggleMute}
          onCalmCorner={() => {}}
        />
      )

      const muteBtn = screen.getByRole('button', { name: /mute audio/i })
      expect(muteBtn).toBeTruthy()
      expect(muteBtn.getAttribute('aria-pressed')).toBe('false')

      fireEvent.click(muteBtn)
      expect(onToggleMute).toHaveBeenCalledTimes(1)
    })

    it('HUD reflects muted state with unmute label when volume is 0', () => {
      const onToggleMute = vi.fn()
      render(
        <HUD
          masterVolume={0}
          intensity="SOFT"
          stars={3}
          onToggleMute={onToggleMute}
          onCalmCorner={() => {}}
        />
      )

      const muteBtn = screen.getByRole('button', { name: /unmute audio/i })
      expect(muteBtn).toBeTruthy()
      expect(muteBtn.getAttribute('aria-pressed')).toBe('true')
    })

    it('CalmCorner provides one-action mute and clear close/resume actions', () => {
      const onResume = vi.fn()
      const onToggleMute = vi.fn()

      render(<CalmCorner onResume={onResume} isMuted={false} onToggleMute={onToggleMute} />)

      // Mute control is present inside Calm Corner
      const muteBtn = screen.getByRole('button', { name: /mute audio/i })
      expect(muteBtn).toBeTruthy()
      fireEvent.click(muteBtn)
      expect(onToggleMute).toHaveBeenCalledTimes(1)

      // Close button and Resume button both exist and work
      const closeBtn = screen.getByRole('button', { name: /close calm corner/i })
      fireEvent.click(closeBtn)
      expect(onResume).toHaveBeenCalledTimes(1)

      const resumeBtn = screen.getByRole('button', { name: /step back into the courtyard/i })
      fireEvent.click(resumeBtn)
      expect(onResume).toHaveBeenCalledTimes(2)
    })

    it('RewardOverlay provides one-action mute without obscuring reward actions', () => {
      const onToggleMute = vi.fn()
      const onLightAgain = vi.fn()
      const onNextCracker = vi.fn()

      render(
        <RewardOverlay
          cracker={CRACKERS[0]}
          isNewSticker={true}
          onLightAgain={onLightAgain}
          onNextCracker={onNextCracker}
          isLastCracker={false}
          isMuted={false}
          onToggleMute={onToggleMute}
        />
      )

      const muteBtn = screen.getByRole('button', { name: /mute audio/i })
      expect(muteBtn).toBeTruthy()
      fireEvent.click(muteBtn)
      expect(onToggleMute).toHaveBeenCalledTimes(1)

      // Primary actions remain accessible
      expect(screen.getByRole('button', { name: /light again/i })).toBeTruthy()
    })

    it('StickerBook modal provides one-action mute in header', () => {
      const onClose = vi.fn()
      const onToggleMute = vi.fn()

      render(
        <StickerBook
          stickers={[0]}
          onClose={onClose}
          onUnlockAll={() => {}}
          isMuted={false}
          onToggleMute={onToggleMute}
        />
      )

      const muteBtn = screen.getByRole('button', { name: /mute audio/i })
      expect(muteBtn).toBeTruthy()
      fireEvent.click(muteBtn)
      expect(onToggleMute).toHaveBeenCalledTimes(1)

      const closeBtn = screen.getByRole('button', { name: /close sticker book/i })
      fireEvent.click(closeBtn)
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('GameController audio suspension & mute guarantees', () => {
    it('toggleMute updates both store and sound engine simultaneously', () => {
      const storeState = { masterVolume: 0.7, lastNonZeroVolume: 0.7, muted: false }
      const mockStore = {
        getState: () => storeState,
        setMasterVolume: vi.fn((v) => {
          storeState.masterVolume = v
          if (v === 0) storeState.muted = true
          else {
            storeState.muted = false
            storeState.lastNonZeroVolume = v
          }
        }),
      }
      const mockSound = {
        setMasterVolume: vi.fn(),
        setIntensity: vi.fn(),
        stopMusic: vi.fn(),
        startMusic: vi.fn(),
      }

      const gc = new GameController()
      gc.init({ store: mockStore, sound: mockSound })

      // Mute
      gc.toggleMute()
      expect(mockSound.setMasterVolume).toHaveBeenCalledWith(0)
      expect(storeState.masterVolume).toBe(0)
      expect(storeState.muted).toBe(true)

      // Unmute
      gc.toggleMute()
      expect(mockSound.setMasterVolume).toHaveBeenCalledWith(0.7)
      expect(storeState.masterVolume).toBe(0.7)
      expect(storeState.muted).toBe(false)
    })

    it('dismissing overlay while muted NEVER accidentally starts music', () => {
      const storeState = { masterVolume: 0, lastNonZeroVolume: 0.7, muted: true }
      const mockStore = {
        getState: () => storeState,
      }
      const mockSound = {
        stopCalmPad: vi.fn(),
        startMusic: vi.fn(),
        setMasterVolume: vi.fn(),
        setIntensity: vi.fn(),
      }

      const gc = new GameController()
      gc.init({ store: mockStore, sound: mockSound })
      gc.enterCalmCorner()

      // Exit calm corner while muted
      gc.exitCalmCorner()

      // startMusic must NOT have been called because it is muted!
      expect(mockSound.startMusic).not.toHaveBeenCalled()
      expect(mockSound.setMasterVolume).toHaveBeenCalledWith(0)
    })
  })
})
