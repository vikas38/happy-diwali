import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import CrackerInspector from '../src/ui/CrackerInspector.jsx'
import { PALETTE_DEFINITIONS, getCrackerById } from '../src/crackers/crackerDefs.js'
import { GameStoreProvider, useGameStore } from '../src/store/gameStore.jsx'

describe('DIW-027 — Curated effect palettes', () => {
  it('defines the four curated palettes with name, swatches, and accessible labels', () => {
    expect(PALETTE_DEFINITIONS.GOLD).toBeDefined()
    expect(PALETTE_DEFINITIONS.GOLD.name).toBe('Marigold Gold')
    expect(PALETTE_DEFINITIONS.GOLD.swatches.length).toBeGreaterThanOrEqual(2)

    expect(PALETTE_DEFINITIONS.ROSE).toBeDefined()
    expect(PALETTE_DEFINITIONS.ROSE.name).toBe('Rose & Gold')

    expect(PALETTE_DEFINITIONS.EMERALD).toBeDefined()
    expect(PALETTE_DEFINITIONS.EMERALD.name).toBe('Peacock Emerald')

    expect(PALETTE_DEFINITIONS.RAINBOW).toBeDefined()
    expect(PALETTE_DEFINITIONS.RAINBOW.name).toBe('Festival Rainbow')
  })

  it('renders interactive palette chips for cracker with selection state', () => {
    const cracker = getCrackerById(0) // Phuljhari: ['GOLD', 'RAINBOW', 'ROSE', 'EMERALD']
    const onSelect = vi.fn()

    render(
      <CrackerInspector
        cracker={cracker}
        isOpen={true}
        selectedPalette="ROSE"
        onSelectPalette={onSelect}
      />
    )

    // Palette chips should be rendered
    const roseRadio = screen.getByRole('radio', { name: /Rose & Gold/i })
    expect(roseRadio).toBeTruthy()
    expect(roseRadio.getAttribute('aria-checked')).toBe('true')

    const goldRadio = screen.getByRole('radio', { name: /Marigold Gold/i })
    expect(goldRadio.getAttribute('aria-checked')).toBe('false')

    fireEvent.click(goldRadio)
    expect(onSelect).toHaveBeenCalledWith(cracker.id, 'GOLD')
  })

  it('persists selected palette per cracker ID in gameStore without altering duration or budget', () => {
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

    // Select palette EMERALD for Anar (ID 1)
    act(() => {
      capturedStore.setCrackerPalette(1, 'EMERALD')
    })
    const state = capturedStore.getState()
    expect(state.selectedPalettes[1]).toBe('EMERALD')
    expect(state.selectedPalette).toBe('EMERALD')

    // Duration and budget of Anar are untouched
    const anarDef = getCrackerById(1)
    expect(anarDef.durationMs).toBe(3500)
    expect(anarDef.budget.maxParticles).toBe(200)
  })
})
