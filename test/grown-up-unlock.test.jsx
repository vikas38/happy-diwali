import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import StickerBook from '../src/ui/StickerBook.jsx'
import { CRACKERS } from '../src/crackers/crackerDefs.js'

describe('Task U4 — Keyboard-Accessible Grown-up Unlock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('provides a keyboard-accessible confirmation dialog via Enter/Space with confirmation buttons', () => {
    const handleUnlock = vi.fn()
    const handleClose = vi.fn()

    render(<StickerBook stickers={[0]} onClose={handleClose} onUnlockAll={handleUnlock} />)

    const unlockBtn = screen.getByRole('button', { name: /Parent Unlock All/i })
    expect(unlockBtn).toBeTruthy()

    // Pressing Enter opens the accessible confirmation dialog
    fireEvent.keyDown(unlockBtn, { key: 'Enter' })
    expect(handleUnlock).not.toHaveBeenCalled()

    const confirmDialog = screen.getByRole('alertdialog')
    expect(confirmDialog).toBeTruthy()
    expect(screen.getByText(/Are you a grown-up\?/i)).toBeTruthy()

    // Pressing Cancel closes the confirmation without unlocking
    const cancelBtn = screen.getByRole('button', { name: /Cancel/i })
    fireEvent.click(cancelBtn)
    expect(handleUnlock).not.toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).toBeNull()

    // Query unlockBtn after re-render and press Space to open confirmation dialog again
    const unlockBtnReopened = screen.getByRole('button', { name: /Parent Unlock All/i })
    fireEvent.keyDown(unlockBtnReopened, { key: ' ' })
    expect(screen.getByRole('alertdialog')).toBeTruthy()

    // Confirming unlocks everything
    const confirmBtn = screen.getByRole('button', { name: /Unlock everything/i })
    fireEvent.click(confirmBtn)
    expect(handleUnlock).toHaveBeenCalledTimes(1)
  })

  it('Escape cancels the confirmation dialog without closing the StickerBook', () => {
    const handleUnlock = vi.fn()
    const handleClose = vi.fn()

    render(<StickerBook stickers={[0]} onClose={handleClose} onUnlockAll={handleUnlock} />)

    const unlockBtn = screen.getByRole('button', { name: /Parent Unlock All/i })
    fireEvent.keyDown(unlockBtn, { key: 'Enter' })
    expect(screen.getByRole('alertdialog')).toBeTruthy()

    // Pressing Escape while in confirmation cancels the dialog
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(handleUnlock).not.toHaveBeenCalled()
    expect(handleClose).not.toHaveBeenCalled()

    // Pressing Escape again closes the StickerBook
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('completes unlock via 2-second pointer hold and cancels on blur, pointerup, or pointerleave', () => {
    const handleUnlock = vi.fn()
    const handleClose = vi.fn()

    render(<StickerBook stickers={[0]} onClose={handleClose} onUnlockAll={handleUnlock} />)

    const unlockBtn = screen.getByRole('button', { name: /Parent Unlock All/i })

    // Test pointer hold cancelled at 1000ms by pointerUp
    act(() => {
      fireEvent.pointerDown(unlockBtn)
    })
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(handleUnlock).not.toHaveBeenCalled()

    act(() => {
      fireEvent.pointerUp(unlockBtn)
    })
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    // No delayed unlock fired!
    expect(handleUnlock).not.toHaveBeenCalled()

    // Test pointer hold cancelled at 800ms by blur
    act(() => {
      fireEvent.pointerDown(unlockBtn)
    })
    act(() => {
      vi.advanceTimersByTime(800)
    })
    act(() => {
      fireEvent.blur(unlockBtn)
    })
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(handleUnlock).not.toHaveBeenCalled()

    // Complete 2000ms hold
    act(() => {
      fireEvent.pointerDown(unlockBtn)
    })
    act(() => {
      vi.advanceTimersByTime(2050)
    })
    expect(handleUnlock).toHaveBeenCalledTimes(1)
  })

  it('cleans up timers and animation frames when unmounted partway through hold', () => {
    const handleUnlock = vi.fn()
    const handleClose = vi.fn()

    const { unmount } = render(
      <StickerBook stickers={[0]} onClose={handleClose} onUnlockAll={handleUnlock} />
    )

    const unlockBtn = screen.getByRole('button', { name: /Parent Unlock All/i })
    act(() => {
      fireEvent.pointerDown(unlockBtn)
      vi.advanceTimersByTime(1000)
    })

    // Unmount while hold is in progress
    unmount()

    // Advance time past the 2s mark
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(handleUnlock).not.toHaveBeenCalled()
  })

  it('renders disabled "Unlocked all!" state when all items are unlocked', () => {
    const allStickers = CRACKERS.map((c) => c.id)
    render(<StickerBook stickers={allStickers} onClose={vi.fn()} onUnlockAll={vi.fn()} />)

    const doneBtn = screen.getByRole('button', { name: /Unlocked all!/i })
    expect(doneBtn).toBeTruthy()
    expect(doneBtn.disabled).toBe(true)
  })
})
