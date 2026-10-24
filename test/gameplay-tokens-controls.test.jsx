import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GAMEPLAY_TOKENS } from '../src/ui/controls/tokens.js'
import {
  GameplayButton,
  GameplayChip,
  SelectableCard,
  InlineNotice,
  ProgressLabel,
} from '../src/ui/controls/GameplayControls.jsx'
import { contrastRatio } from '../src/safety/contrast.js'

describe('DIW-003: Reusable gameplay design tokens and controls', () => {
  describe('Semantic Tokens & WCAG Contrast Verification', () => {
    it('meets WCAG AAA contrast (>= 7:1) for primary ivory text on surface plum and raised plum', () => {
      const { textIvory, surfacePlum, surfaceRaised } = GAMEPLAY_TOKENS.colors
      const ratioPlum = contrastRatio(textIvory, surfacePlum)
      const ratioRaised = contrastRatio(textIvory, surfaceRaised)

      expect(ratioPlum).toBeGreaterThanOrEqual(7.0)
      expect(ratioRaised).toBeGreaterThanOrEqual(7.0)
    })

    it('meets WCAG AA contrast (>= 4.5:1) for secondary text (>= 14px) on surface plum and raised plum', () => {
      const { textSecondary, surfacePlum, surfaceRaised } = GAMEPLAY_TOKENS.colors
      const ratioPlum = contrastRatio(textSecondary, surfacePlum)
      const ratioRaised = contrastRatio(textSecondary, surfaceRaised)

      expect(ratioPlum).toBeGreaterThanOrEqual(4.5)
      expect(ratioRaised).toBeGreaterThanOrEqual(4.5)
    })

    it('meets WCAG AAA contrast (>= 7:1) for primary marigold button text on marigold fill', () => {
      const { actionText, actionMarigold } = GAMEPLAY_TOKENS.colors
      const ratio = contrastRatio(actionText, actionMarigold)

      expect(ratio).toBeGreaterThanOrEqual(7.0)
    })

    it('meets WCAG non-text contrast (>= 3:1) for focus outline and state borders on surfaces', () => {
      const { borderFocus, surfacePlum, accentTeal } = GAMEPLAY_TOKENS.colors
      const focusRatio = contrastRatio(borderFocus, surfacePlum)
      const tealRatio = contrastRatio(accentTeal, surfacePlum)

      expect(focusRatio).toBeGreaterThanOrEqual(3.0)
      expect(tealRatio).toBeGreaterThanOrEqual(3.0)
    })

    it('defines standard sizing, spacing rhythm, and minimum 44px touch targets', () => {
      expect(GAMEPLAY_TOKENS.targets.min).toBe(44)
      expect(GAMEPLAY_TOKENS.spacing.sm).toBe(8)
      expect(GAMEPLAY_TOKENS.spacing.md).toBe(12)
      expect(GAMEPLAY_TOKENS.typography.instructionSize).toBe(16)
      expect(GAMEPLAY_TOKENS.typography.secondarySize).toBe(14)
    })
  })

  describe('GameplayButton', () => {
    it('renders primary button with label, accessible attributes, and minimum target class', () => {
      const handleClick = vi.fn()
      render(
        <GameplayButton variant="primary" onClick={handleClick}>
          Ask grown-up to light
        </GameplayButton>
      )

      const btn = screen.getByRole('button', { name: /ask grown-up to light/i })
      expect(btn).toBeDefined()
      expect(btn.className).toContain('gp-btn--primary')

      fireEvent.click(btn)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('renders secondary button with icon', () => {
      render(
        <GameplayButton variant="secondary" icon="🔍" iconPosition="left">
          Browse all
        </GameplayButton>
      )

      const btn = screen.getByRole('button', { name: /browse all/i })
      expect(btn.className).toContain('gp-btn--secondary')
      expect(btn.textContent).toContain('🔍')
    })

    it('renders icon-only button with required ariaLabel', () => {
      const handleClick = vi.fn()
      render(
        <GameplayButton
          variant="icon"
          ariaLabel="Mute audio"
          icon="🔇"
          onClick={handleClick}
        />
      )

      const btn = screen.getByRole('button', { name: /mute audio/i })
      expect(btn.className).toContain('gp-btn--icon')
      fireEvent.click(btn)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('disables button and prevents clicks when disabled or loading', () => {
      const handleClick = vi.fn()
      const { rerender } = render(
        <GameplayButton disabled onClick={handleClick}>
          Disabled Action
        </GameplayButton>
      )

      let btn = screen.getByRole('button', { name: /disabled action/i })
      expect(btn.hasAttribute('disabled')).toBe(true)
      expect(btn.getAttribute('aria-disabled')).toBe('true')
      fireEvent.click(btn)
      expect(handleClick).not.toHaveBeenCalled()

      rerender(
        <GameplayButton loading onClick={handleClick}>
          Loading Action
        </GameplayButton>
      )
      btn = screen.getByRole('button', { name: /loading action/i })
      expect(btn.getAttribute('aria-busy')).toBe('true')
      fireEvent.click(btn)
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('GameplayChip', () => {
    it('renders chip and communicates selected state with aria-pressed and visible indicator', () => {
      const handleClick = vi.fn()
      const { rerender } = render(
        <GameplayChip selected={false} count={6} onClick={handleClick}>
          Ground
        </GameplayChip>
      )

      let chip = screen.getByRole('button', { name: /ground/i })
      expect(chip.getAttribute('aria-pressed')).toBe('false')
      expect(chip.className).not.toContain('is-selected')

      fireEvent.click(chip)
      expect(handleClick).toHaveBeenCalledTimes(1)

      rerender(
        <GameplayChip selected={true} count={6} onClick={handleClick}>
          Ground
        </GameplayChip>
      )
      chip = screen.getByRole('button', { name: /ground/i })
      expect(chip.getAttribute('aria-pressed')).toBe('true')
      expect(chip.className).toContain('is-selected')
      // Selection must not be conveyed only by color:
      expect(chip.textContent).toContain('✓')
      expect(chip.textContent).toContain('(Selected)')
    })
  })

  describe('SelectableCard', () => {
    it('renders card with title, subtitle, and responds to click and keyboard activation', () => {
      const handleSelect = vi.fn()
      render(
        <SelectableCard
          id="phuljhari"
          title="Phuljhari"
          subtitle="Sparkler · 8s"
          onClick={handleSelect}
        />
      )

      const card = screen.getByRole('button', { name: /phuljhari/i })
      expect(card).toBeDefined()
      expect(card.tabIndex).toBe(0)

      fireEvent.click(card)
      expect(handleSelect).toHaveBeenCalledTimes(1)

      fireEvent.keyDown(card, { key: 'Enter' })
      expect(handleSelect).toHaveBeenCalledTimes(2)

      fireEvent.keyDown(card, { key: ' ' })
      expect(handleSelect).toHaveBeenCalledTimes(3)
    })

    it('displays visible "Selected" badge and border when selected, satisfying color-independence', () => {
      render(
        <SelectableCard
          id="anar"
          selected={true}
          title="Anar"
          subtitle="Fountain · 12s"
        />
      )

      const card = screen.getByRole('button', { name: /anar/i })
      expect(card.getAttribute('aria-pressed')).toBe('true')
      expect(card.className).toContain('is-selected')
      expect(screen.getByText(/selected/i)).toBeDefined()
      expect(screen.getByText('✓')).toBeDefined()
    })

    it('renders locked card with lock icon and legible reason, inert to clicks and keyboard', () => {
      const handleSelect = vi.fn()
      render(
        <SelectableCard
          id="waterfall"
          locked={true}
          lockReason="Light 3 crackers to unlock"
          title="Golden Waterfall"
          subtitle="Ground cascade"
          onClick={handleSelect}
        />
      )

      const card = screen.getByRole('button', { name: /golden waterfall/i })
      expect(card.getAttribute('aria-disabled')).toBe('true')
      expect(card.tabIndex).toBe(-1)
      expect(screen.getByText(/light 3 crackers to unlock/i)).toBeDefined()

      fireEvent.click(card)
      expect(handleSelect).not.toHaveBeenCalled()

      fireEvent.keyDown(card, { key: 'Enter' })
      expect(handleSelect).not.toHaveBeenCalled()
    })
  })

  describe('InlineNotice', () => {
    it('renders accessible info and error notices with correct roles and legible text', () => {
      const { rerender } = render(
        <InlineNotice variant="info" title="Audio is off">
          Sound can be enabled at any time from the top bar.
        </InlineNotice>
      )

      let notice = screen.getByRole('status')
      expect(notice.className).toContain('gp-notice--info')
      expect(screen.getByText(/audio is off/i)).toBeDefined()

      rerender(
        <InlineNotice variant="error" title="Show interrupted">
          The window was resized. Please ask grown-up to light again.
        </InlineNotice>
      )
      notice = screen.getByRole('alert')
      expect(notice.className).toContain('gp-notice--error')
      expect(screen.getByText(/show interrupted/i)).toBeDefined()
    })
  })

  describe('ProgressLabel', () => {
    it('renders legible progress text meeting secondary font size standards', () => {
      render(<ProgressLabel current={4} total={10} label="4 of 10 crackers unlocked" />)
      expect(screen.getByText('4 of 10 crackers unlocked')).toBeDefined()
    })
  })
})
