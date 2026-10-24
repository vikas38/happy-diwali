import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import CourtyardDecorationsModal from '../src/ui/CourtyardDecorationsModal.jsx'
import { drawCourtyard } from '../src/render/layers/Courtyard.js'
import { Background } from '../src/render/layers/Background.js'
import { createDefaultSave, validateSave, migrateSave } from '../src/store/save.js'

describe('DIW-031 — Courtyard decorations modal and renderers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('CourtyardDecorationsModal UI', () => {
    it('renders all decoration categories and options with accessible attributes', () => {
      const handleSelect = vi.fn()
      const handleReset = vi.fn()
      const handleClose = vi.fn()

      render(
        <CourtyardDecorationsModal
          isOpen={true}
          onClose={handleClose}
          decorations={{
            rangoliMotif: 'lotus',
            toranStyle: 'marigold',
            diyaStyle: 'arch',
          }}
          onSelectDecoration={handleSelect}
          onReset={handleReset}
        />
      )

      expect(screen.getByRole('dialog')).toBeDefined()
      expect(screen.getByRole('heading', { name: /Courtyard Decorations/i })).toBeDefined()

      // Section titles
      expect(screen.getByText(/Rangoli Motif/i)).toBeDefined()
      expect(screen.getByText(/Toran Garland/i)).toBeDefined()
      expect(screen.getByText(/Diya Arrangement/i)).toBeDefined()

      // Options
      const lotusBtn = screen.getByRole('radio', { name: /Lotus Bloom/i })
      expect(lotusBtn.getAttribute('aria-checked')).toBe('true')

      const geometricBtn = screen.getByRole('radio', { name: /Sacred Star/i })
      expect(geometricBtn.getAttribute('aria-checked')).toBe('false')

      // Click an unselected option
      fireEvent.click(geometricBtn)
      expect(handleSelect).toHaveBeenCalledWith('rangoliMotif', 'geometric')

      // Click toran option
      const mangoLeavesBtn = screen.getByRole('radio', { name: /Mango Leaves/i })
      fireEvent.click(mangoLeavesBtn)
      expect(handleSelect).toHaveBeenCalledWith('toranStyle', 'mango_leaves')

      // Click diya option
      const courtyardRowBtn = screen.getByRole('radio', { name: /Courtyard Border/i })
      fireEvent.click(courtyardRowBtn)
      expect(handleSelect).toHaveBeenCalledWith('diyaStyle', 'courtyard_row')

      // Reset action
      const resetBtn = screen.getByRole('button', { name: /Reset decorations/i })
      fireEvent.click(resetBtn)
      expect(handleReset).toHaveBeenCalled()

      // Done/Close action
      const doneBtn = screen.getByRole('button', { name: /Done/i })
      fireEvent.click(doneBtn)
      expect(handleClose).toHaveBeenCalled()
    })
  })

  describe('Canvas decoration renderers', () => {
    function createMockCtx() {
      return {
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        rotate: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        arc: vi.fn(),
        ellipse: vi.fn(),
        strokeRect: vi.fn(),
        fillRect: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        quadraticCurveTo: vi.fn(),
        bezierCurveTo: vi.fn(),
        setLineDash: vi.fn(),
        drawImage: vi.fn(),
        createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        fillStyle: '#000',
        strokeStyle: '#000',
        lineWidth: 1,
      }
    }

    it('renders courtyard across all rangoli motifs, toran styles, and diya arrangements without error', () => {
      const motifs = ['lotus', 'geometric', 'diyas']
      const torans = ['marigold', 'mango_leaves']
      const diyas = ['arch', 'courtyard_row', 'haveli_steps']

      for (const rangoliMotif of motifs) {
        for (const toranStyle of torans) {
          for (const diyaStyle of diyas) {
            const ctx = createMockCtx()
            expect(() => {
              drawCourtyard(ctx, 1024, 768, 1.5, 'IDLE', false, {
                rangoliMotif,
                toranStyle,
                diyaStyle,
              })
            }).not.toThrow()
          }
        }
      }
    })

    it('Background integrates setDecorations and draws them', () => {
      const bg = new Background()
      expect(bg.decorations.rangoliMotif).toBe('lotus')

      bg.setDecorations({ rangoliMotif: 'geometric', toranStyle: 'mango_leaves' })
      expect(bg.decorations.rangoliMotif).toBe('geometric')
      expect(bg.decorations.toranStyle).toBe('mango_leaves')
      expect(bg.decorations.diyaStyle).toBe('arch')

      const ctx = createMockCtx()
      expect(() => {
        bg.draw(ctx, 800, 600, 1.0)
      }).not.toThrow()
    })
  })

  describe('Save schema and isolation', () => {
    it('persists and validates courtyardDecorations in save state', () => {
      const def = createDefaultSave()
      expect(def.courtyardDecorations).toEqual({
        rangoliMotif: 'lotus',
        toranStyle: 'marigold',
        diyaStyle: 'arch',
      })

      const custom = {
        ...def,
        courtyardDecorations: {
          rangoliMotif: 'geometric',
          toranStyle: 'mango_leaves',
          diyaStyle: 'haveli_steps',
        },
      }

      const validated = validateSave(custom)
      expect(validated.courtyardDecorations.rangoliMotif).toBe('geometric')
      expect(validated.courtyardDecorations.toranStyle).toBe('mango_leaves')
      expect(validated.courtyardDecorations.diyaStyle).toBe('haveli_steps')

      // Invalid entries fallback gracefully
      const corrupt = {
        ...def,
        courtyardDecorations: {
          rangoliMotif: 'invalid_xyz',
          toranStyle: 123,
        },
      }
      const migrated = validateSave(corrupt)
      expect(migrated.courtyardDecorations.rangoliMotif).toBe('lotus')
      expect(migrated.courtyardDecorations.toranStyle).toBe('marigold')
    })
  })
})
