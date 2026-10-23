import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { GameStoreProvider, useGameStore } from '../src/store/gameStore.jsx'
import { SAVE_KEY } from '../src/store/save.js'
import RewardOverlay from '../src/ui/RewardOverlay.jsx'
import StickerBook from '../src/ui/StickerBook.jsx'
import FestivalHome from '../src/ui/FestivalHome.jsx'
import ContextualAction from '../src/ui/ContextualAction.jsx'
import { CRACKERS } from '../src/crackers/crackerDefs.js'
import { GameController, STATES } from '../src/fsm/GameController.js'

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
      init: () => {},
      resume: async () => {},
      startMusic: () => {},
      stopMusic: () => {},
      stopCrackerAudio: () => {},
      setIntensity: () => {},
      setMasterVolume: () => {},
      playTestTone: () => {},
      getAudioLevel: () => 0,
    },
    chhotu: {
      setPosition: () => {},
      setFacing: () => {},
      setArmState: () => {},
      jump: () => {},
      walkTo: (fx, fy, tx, ty, d, cb) => cb?.(),
    },
    pip: {
      setPosition: () => {},
      setMood: () => {},
      jump: () => {},
    },
    particles: { flashes: [] },
    comicBubble: {},
    jellySquash: {},
    renderer: { width: 800, height: 600 },
    background: { setGameState: () => {} },
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

describe('T21 — Rewards and Progress Polish (U11)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('Grown-up unlock-all and persistence', () => {
    it('unlocks all 6 crackers and persists to localStorage via store.unlockAllCrackers', async () => {
      let storeHook
      function TestComponent() {
        storeHook = useGameStore()
        return <div>Test</div>
      }

      render(
        <GameStoreProvider>
          <TestComponent />
        </GameStoreProvider>
      )

      expect(storeHook.state.unlocked).toEqual([0])

      await act(async () => {
        storeHook.unlockAllCrackers()
      })

      expect(storeHook.state.unlocked).toEqual([0, 1, 2, 3, 4, 5])
      expect(storeHook.state.stickers).toEqual([0, 1, 2, 3, 4, 5])

      // Verify persistence in localStorage
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY))
      expect(saved.unlocked).toEqual([0, 1, 2, 3, 4, 5])
      expect(saved.stickers).toEqual([0, 1, 2, 3, 4, 5])
    })

    it('For Grown-ups panel contains the unlock-all button and triggers unlock-all', async () => {
      render(
        <GameStoreProvider>
          <FestivalHome onPlay={() => {}} motion={true} setMotion={() => {}} />
        </GameStoreProvider>
      )

      // Open For Grown-ups modal via Enter key
      const grownUpsBtn = screen.getByRole('button', { name: /For grown-ups/i })
      await act(async () => {
        fireEvent.keyDown(grownUpsBtn, { key: 'Enter' })
      })

      // Click the Unlock All button in For Grown-ups
      const unlockBtn = screen.getByRole('button', { name: /Unlock all fireworks/i })
      expect(unlockBtn).toBeTruthy()

      await act(async () => {
        fireEvent.click(unlockBtn)
      })

      // Saved state now has all 6 unlocked
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY))
      expect(saved.unlocked).toEqual([0, 1, 2, 3, 4, 5])
      expect(saved.stickers).toEqual([0, 1, 2, 3, 4, 5])
    })
  })

  describe('Reward skip moment never blocks next action', () => {
    it('renders a skip button in RewardOverlay that immediately triggers next action', () => {
      let skipped = false

      render(
        <RewardOverlay
          cracker={CRACKERS[0]}
          isNewSticker={true}
          onLightAgain={() => {}}
          onNextCracker={() => {}}
          onSkip={() => {
            skipped = true
          }}
          isLastCracker={false}
        />
      )

      const skipBtn = screen.getByRole('button', { name: /Skip celebration/i })
      expect(skipBtn).toBeTruthy()

      fireEvent.click(skipBtn)
      expect(skipped).toBe(true)
    })

    it('falls back to onNextCracker if onSkip is not provided, ensuring zero blocking', () => {
      let nextCalled = false

      render(
        <RewardOverlay
          cracker={CRACKERS[0]}
          isNewSticker={false}
          onLightAgain={() => {}}
          onNextCracker={() => {
            nextCalled = true
          }}
          isLastCracker={false}
        />
      )

      const skipBtn = screen.getByRole('button', { name: /Skip celebration/i })
      fireEvent.click(skipBtn)
      expect(nextCalled).toBe(true)
    })
  })

  describe('Sticker book shows locked stickers as silhouettes', () => {
    it('renders locked stickers with silhouette class and lock badge', () => {
      render(<StickerBook stickers={[0]} onClose={() => {}} onUnlockAll={() => {}} />)

      // Cracker 0 (unlocked) has no silhouette class
      const unlockedTile = screen.getByLabelText(/Phuljhari sticker collected/i)
      const unlockedEmoji = unlockedTile.querySelector('.sticker-tile__emoji')
      expect(unlockedEmoji.classList.contains('sticker-silhouette')).toBe(false)

      // Cracker 1 (locked) has silhouette class and lock badge
      const lockedTile = screen.getByLabelText(/Anar sticker locked/i)
      const lockedEmoji = lockedTile.querySelector('.sticker-tile__emoji')
      expect(lockedEmoji.classList.contains('sticker-silhouette')).toBe(true)
      expect(lockedTile.querySelector('.sticker-lock-badge')).toBeTruthy()
    })
  })

  describe('Every completed step earns something small', () => {
    it('awards a golden sparkle reward on each completed step in the flow tracker', () => {
      const { rerender } = render(<ContextualAction fsmState={STATES.IDLE} selectedCracker={0} />)

      // Step 1: None completed yet
      let dots = screen.getAllByText('✦')
      // Note: primary button has ✦ icon, but no step dots have ✦ yet
      let doneDots = document.querySelectorAll('.flow-step-dot.is-done')
      expect(doneDots.length).toBe(0)

      // Advance to Step 2 (READY_ON_STREET): Step 1 is done and earned ✦
      rerender(<ContextualAction fsmState={STATES.READY_ON_STREET} selectedCracker={0} />)
      doneDots = document.querySelectorAll('.flow-step-dot.is-done')
      expect(doneDots.length).toBe(2)
      expect(doneDots[0].textContent).toBe('✦')

      // Advance to Step 4 (COUNTDOWN_3_2_1): Steps 1, 2, 3 are done and earned ✦
      rerender(
        <ContextualAction
          fsmState={STATES.COUNTDOWN_3_2_1}
          selectedCracker={0}
          countdownNumber={3}
        />
      )
      doneDots = document.querySelectorAll('.flow-step-dot.is-done')
      expect(doneDots.length).toBe(3)
      doneDots.forEach((dot) => {
        expect(dot.textContent).toBe('✦')
      })

      // Advance to Step 5 (REWARD_CELEBRATION): Steps 1, 2, 3, 4 are done and earned ✦
      rerender(<ContextualAction fsmState={STATES.REWARD_CELEBRATION} selectedCracker={0} />)
      doneDots = document.querySelectorAll('.flow-step-dot.is-done')
      expect(doneDots.length).toBe(4)
      doneDots.forEach((dot) => {
        expect(dot.textContent).toBe('✦')
      })
    })
  })
})
