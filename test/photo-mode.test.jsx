import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import PhotoModeModal from '../src/ui/PhotoModeModal.jsx'
import { GameController, STATES } from '../src/fsm/GameController.js'

describe('DIW-035 — Photo mode and festival postcard export', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      fillText: vi.fn(),
      setLineDash: vi.fn(),
      drawImage: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    }
    const proxyCtx = new Proxy(mockCtx, {
      get(target, prop) {
        if (prop in target) return target[prop]
        return vi.fn()
      },
      set(target, prop, value) {
        target[prop] = value
        return true
      },
    })
    HTMLCanvasElement.prototype.getContext = vi.fn(() => proxyCtx)
    HTMLCanvasElement.prototype.toDataURL = vi.fn(
      () => 'data:image/png;base64,mockPostcardImageData'
    )
  })

  it('renders postcard dialog with aspect ratio and frame controls', () => {
    const handleClose = vi.fn()

    render(
      <PhotoModeModal
        isOpen={true}
        onClose={handleClose}
        decorations={{
          rangoliMotif: 'lotus',
          toranStyle: 'marigold',
          diyaStyle: 'arch',
        }}
        selectedCracker={0}
        placement="center"
        palette="GOLD"
      />
    )

    expect(screen.getByRole('dialog')).toBeDefined()
    expect(
      screen.getByRole('heading', { name: /Festival Postcard/i })
    ).toBeDefined()

    // Aspect ratio buttons
    const landscapeBtn = screen.getByRole('radio', {
      name: /Landscape/i,
    })
    const portraitBtn = screen.getByRole('radio', {
      name: /Story/i,
    })
    expect(landscapeBtn.getAttribute('aria-checked')).toBe('true')
    expect(portraitBtn.getAttribute('aria-checked')).toBe('false')

    // Frame style buttons
    const framedBtn = screen.getByRole('radio', {
      name: /Happy Diwali Frame/i,
    })
    const cleanBtn = screen.getByRole('radio', {
      name: /Clean Scene/i,
    })
    expect(framedBtn.getAttribute('aria-checked')).toBe('true')
    expect(cleanBtn.getAttribute('aria-checked')).toBe('false')

    // Switch to portrait and clean frame
    fireEvent.click(portraitBtn)
    expect(portraitBtn.getAttribute('aria-checked')).toBe('true')

    fireEvent.click(cleanBtn)
    expect(cleanBtn.getAttribute('aria-checked')).toBe('true')

    // Image preview
    const preview = screen.getByRole('img', {
      name: /Festival celebration postcard preview/i,
    })
    expect(preview).toBeDefined()
    expect(preview.getAttribute('src')).toBe(
      'data:image/png;base64,mockPostcardImageData'
    )

    // Trigger download
    const downloadBtn = screen.getByRole('button', {
      name: /Download Postcard/i,
    })
    fireEvent.click(downloadBtn)

    // Success status
    expect(screen.getByRole('status')).toBeDefined()
    expect(screen.getByText(/Postcard saved to your device!/i)).toBeDefined()

    // Close action
    const closeBtn = screen.getByRole('button', { name: /^Close$/i })
    fireEvent.click(closeBtn)
    expect(handleClose).toHaveBeenCalled()
  })

  it('participates in GameController interruption model cleanly', () => {
    const gc = new GameController(STATES.IDLE)
    expect(gc.state).toBe(STATES.IDLE)

    gc.openPhotoMode()
    expect(gc.state).toBe(STATES.PHOTO_MODE_OVERLAY)

    gc.closePhotoMode()
    expect(gc.state).toBe(STATES.IDLE)
  })
})
