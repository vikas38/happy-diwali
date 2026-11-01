import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import CelebrationSequenceEditor from '../src/ui/CelebrationSequenceEditor.jsx'
import { GameController, STATES } from '../src/fsm/GameController.js'
import { GameStoreProvider, useGameStore } from '../src/store/gameStore.jsx'
import { SHOW_DURATIONS } from '../src/crackers/crackerControllers.js'

describe('DIW-029 & DIW-030 — Celebration sequence editor and playback', () => {
  describe('DIW-029: Sequence Editor', () => {
    it('renders empty slot state and permits adding up to 3 slots', () => {
      const onAdd = vi.fn()
      const onPlay = vi.fn()

      const { rerender } = render(
        <CelebrationSequenceEditor
          isOpen={true}
          sequence={[]}
          unlockedIds={[0, 1, 2]}
          onAddSlot={onAdd}
          onPlaySequence={onPlay}
        />
      )

      expect(screen.getByText(/Empty show slot/i)).toBeTruthy()
      const addBtn = screen.getByRole('button', { name: /\+ Add sparkle/i })
      expect(addBtn).toBeTruthy()

      // Open picker
      fireEvent.click(addBtn)
      expect(screen.getByRole('heading', { name: /Add sparkle/i })).toBeTruthy()

      // Pick Anar (ID 1)
      const anarChoice = screen.getByRole('button', { name: /Anar/i })
      fireEvent.click(anarChoice)
      expect(onAdd).toHaveBeenCalledWith(1, 'GOLD', 'center')

      // Rerender with 2 slots
      rerender(
        <CelebrationSequenceEditor
          isOpen={true}
          sequence={[
            { crackerId: 0, palette: 'GOLD', placement: 'left' },
            { crackerId: 1, palette: 'ROSE', placement: 'center' },
          ]}
          unlockedIds={[0, 1, 2]}
          onAddSlot={onAdd}
          onPlaySequence={onPlay}
        />
      )

      expect(screen.getByText('Phuljhari')).toBeTruthy()
      expect(screen.getByText('Anar')).toBeTruthy()

      // Play button is enabled
      const playBtn = screen.getByRole('button', { name: /Play celebration show/i })
      expect(playBtn.hasAttribute('disabled')).toBe(false)
      fireEvent.click(playBtn)
      expect(onPlay).toHaveBeenCalled()
    })

    it('displays estimated duration derived from authored durations', () => {
      const seq = [
        { crackerId: 0, palette: 'GOLD', placement: 'center' }, // 3000ms show + 4400ms prep = 7.4s
        { crackerId: 1, palette: 'GOLD', placement: 'center' }, // 3500ms show + 4400ms prep = 7.9s
      ]
      render(<CelebrationSequenceEditor isOpen={true} sequence={seq} unlockedIds={[0, 1]} />)

      // Expected ~15 seconds total
      const estTotal = Math.round((SHOW_DURATIONS[0] + 4400 + SHOW_DURATIONS[1] + 4400) / 1000)
      expect(screen.getByText(new RegExp(`Estimated show time: ${estTotal}s`, 'i'))).toBeTruthy()
    })

    it('persists sequence draft in gameStore and supports move and remove', () => {
      let capturedStore = null
      function TestConsumer() {
        capturedStore = useGameStore()
        return <div>Store Test</div>
      }

      render(
        <GameStoreProvider>
          <TestConsumer />
        </GameStoreProvider>
      )

      act(() => {
        capturedStore.addSequenceSlot(0, 'GOLD', 'left')
        capturedStore.addSequenceSlot(1, 'ROSE', 'center')
      })

      expect(capturedStore.getState().sequenceDraft.length).toBe(2)

      // Move slot 0 to 1
      act(() => {
        capturedStore.moveSequenceSlot(0, 1)
      })
      expect(capturedStore.getState().sequenceDraft[0].crackerId).toBe(1)
      expect(capturedStore.getState().sequenceDraft[1].crackerId).toBe(0)

      // Remove slot 0
      act(() => {
        capturedStore.removeSequenceSlot(0)
      })
      expect(capturedStore.getState().sequenceDraft.length).toBe(1)
      expect(capturedStore.getState().sequenceDraft[0].crackerId).toBe(0)
    })
  })

  describe('DIW-030: Sequence Playback Controller', () => {
    let gc
    let mockEngines
    let storeState

    let triggerShowDone = null

    beforeEach(() => {
      vi.useFakeTimers()
      triggerShowDone = null
      storeState = {
        unlocked: [0, 1, 2],
        stickers: [],
        stars: 0,
      }
      const mockStore = {
        getState: () => storeState,
        awardShowCompletion: vi.fn((id) => {
          const isNew = !storeState.stickers.includes(id)
          if (isNew) storeState.stickers.push(id)
          storeState.stars += isNew ? 3 : 1
          return { isNewSticker: isNew, starsEarned: isNew ? 3 : 1 }
        }),
        setCrackerPalette: vi.fn(),
        setLaunchPlacement: vi.fn(),
      }
      mockEngines = {
        renderer: { width: 800, height: 600 },
        chhotu: {
          setPosition: vi.fn(),
          setFacing: vi.fn(),
          setArmState: vi.fn(),
          walkTo: vi.fn((fx, fy, tx, ty, d, cb) => cb && cb()),
          jump: vi.fn(),
        },
        pip: {
          setPosition: vi.fn(),
          setMood: vi.fn(),
          jump: vi.fn(),
        },
        sound: {
          supported: false,
          startMusic: vi.fn(),
        },
        background: {
          setGameState: vi.fn(),
          setPlacement: vi.fn(),
        },
        store: mockStore,
      }
      gc = new GameController(STATES.IDLE)
      gc.init(mockEngines)
      gc.setCrackerShowFn(
        vi.fn((id, eng, onDone) => {
          triggerShowDone = onDone
          return () => {}
        })
      )
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('plays celebration sequence in order and awards each segment', () => {
      const sequence = [
        { crackerId: 0, palette: 'GOLD', placement: 'left' },
        { crackerId: 1, palette: 'ROSE', placement: 'right' },
      ]

      gc.startSequence(sequence)
      expect(gc.isSequenceActive).toBe(true)
      expect(gc.sequenceIndex).toBe(0)
      expect(gc.state).toBe(STATES.COUNTDOWN_3_2_1)

      // Complete segment 0 countdown -> CRACKER_SHOW_ACTIVE
      vi.advanceTimersByTime(3500)
      expect(gc.state).toBe(STATES.CRACKER_SHOW_ACTIVE)

      // Trigger show done for segment 0
      act(() => {
        triggerShowDone?.()
      })

      // Advances to segment 1 through countdown
      expect(gc.isSequenceActive).toBe(true)
      expect(gc.sequenceIndex).toBe(1)
      expect(gc.state).toBe(STATES.COUNTDOWN_3_2_1)

      // Complete segment 1 countdown -> show
      vi.advanceTimersByTime(3500)
      expect(gc.state).toBe(STATES.CRACKER_SHOW_ACTIVE)

      // Trigger show done for final segment
      act(() => {
        triggerShowDone?.()
      })

      // Sequence finished -> transition to REWARD_CELEBRATION
      expect(gc.isSequenceActive).toBe(false)
      expect(gc.state).toBe(STATES.REWARD_CELEBRATION)
      expect(storeState.stars).toBeGreaterThanOrEqual(4) // 3 stars for Phuljhari + 3 stars for Anar
    })

    it('stopSequence cancels current show, preserves earned rewards, and returns to IDLE', () => {
      const sequence = [
        { crackerId: 0, palette: 'GOLD', placement: 'left' },
        { crackerId: 1, palette: 'ROSE', placement: 'right' },
      ]

      gc.startSequence(sequence)
      vi.advanceTimersByTime(3500) // into show 0
      expect(gc.state).toBe(STATES.CRACKER_SHOW_ACTIVE)

      // Complete show 0
      act(() => {
        triggerShowDone?.()
      })

      const starsAfterShow0 = storeState.stars
      expect(starsAfterShow0).toBe(3)

      // Segment 1 is in countdown
      expect(gc.state).toBe(STATES.COUNTDOWN_3_2_1)

      // Stop sequence midway during segment 1
      gc.stopSequence()
      expect(gc.isSequenceActive).toBe(false)
      expect(gc.sequence).toBe(null)
      expect(gc.state).toBe(STATES.IDLE)

      // No additional stars granted from cancelled segment 1
      expect(storeState.stars).toBe(starsAfterShow0)
    })
  })
})
