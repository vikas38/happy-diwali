import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import CrackerInspector from '../src/ui/CrackerInspector.jsx'
import { getCrackerById } from '../src/crackers/crackerDefs.js'
import { PLACEMENT_X, effectOrigin } from '../src/render/layers/Courtyard.js'
import { drawAdult } from '../src/render/characters/Adult.js'
import { Background } from '../src/render/layers/Background.js'
import { GameStoreProvider, useGameStore } from '../src/store/gameStore.jsx'

describe('DIW-028 — Controlled launch placement', () => {
  it('defines normalized placement anchors: left (0.38), center (0.57), right (0.72)', () => {
    expect(PLACEMENT_X.left).toBeCloseTo(0.38, 2)
    expect(PLACEMENT_X.center).toBeCloseTo(0.57, 2)
    expect(PLACEMENT_X.right).toBeCloseTo(0.72, 2)
  })

  it('calculates effectOrigin for left, center, and right placements across viewports', () => {
    const width = 1000
    const height = 600

    const leftOrigin = effectOrigin(0, width, height, 'left')
    const centerOrigin = effectOrigin(0, width, height, 'center')
    const rightOrigin = effectOrigin(0, width, height, 'right')

    expect(leftOrigin.x).toBeLessThan(centerOrigin.x)
    expect(centerOrigin.x).toBeLessThan(rightOrigin.x)

    // Verify all origins stay safely within canvas bounds
    expect(leftOrigin.x).toBeGreaterThan(0.2 * width)
    expect(rightOrigin.x).toBeLessThan(0.85 * width)
  })

  it('drawAdult positions the adult relative to chosen launch placement', () => {
    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      beginPath: vi.fn(),
      ellipse: vi.fn(),
      arc: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
      textAlign: '',
      lineCap: '',
    }

    // Call drawAdult for left, center, right
    expect(() => drawAdult(ctx, 1000, 600, 0, 'left')).not.toThrow()
    expect(() => drawAdult(ctx, 1000, 600, 0, 'center')).not.toThrow()
    expect(() => drawAdult(ctx, 1000, 600, 0, 'right')).not.toThrow()
  })

  it('Background updates placement cleanly', () => {
    const bg = new Background()
    expect(bg.launchPlacement).toBe('center')

    bg.setPlacement('left')
    expect(bg.launchPlacement).toBe('left')

    bg.setPlacement('right')
    expect(bg.launchPlacement).toBe('right')

    // Rejects invalid placement
    bg.setPlacement('invalid')
    expect(bg.launchPlacement).toBe('right')
  })

  it('renders placement options in CrackerInspector and lets player choose position', () => {
    const cracker = getCrackerById(0)
    const onSelectPlacement = vi.fn()

    render(
      <CrackerInspector
        cracker={cracker}
        isOpen={true}
        selectedPlacement="center"
        onSelectPlacement={onSelectPlacement}
      />
    )

    const leftButton = screen.getByRole('radio', { name: /Left courtyard/i })
    const centerButton = screen.getByRole('radio', { name: /Center stage/i })
    const rightButton = screen.getByRole('radio', { name: /Right haveli/i })

    expect(leftButton).toBeTruthy()
    expect(centerButton).toBeTruthy()
    expect(rightButton).toBeTruthy()

    expect(centerButton.getAttribute('aria-checked')).toBe('true')
    expect(leftButton.getAttribute('aria-checked')).toBe('false')

    fireEvent.click(leftButton)
    expect(onSelectPlacement).toHaveBeenCalledWith('left')
  })

  it('persists launch placement in gameStore', () => {
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

    expect(capturedStore).toBeTruthy()

    act(() => {
      capturedStore.setLaunchPlacement('right')
    })
    expect(capturedStore.getState().launchPlacement).toBe('right')
  })
})
