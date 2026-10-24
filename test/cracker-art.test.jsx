import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CrackerArt, { getCrackerArtKey } from '../src/ui/CrackerArt.jsx'

describe('DIW-008 — Consistent illustrated cracker asset set', () => {
  it('correctly maps numeric index and string aliases to canonical art keys', () => {
    // Original 6
    expect(getCrackerArtKey(0)).toBe('phuljhari')
    expect(getCrackerArtKey(1)).toBe('anar')
    expect(getCrackerArtKey(2)).toBe('chakri')
    expect(getCrackerArtKey(3)).toBe('rocket')
    expect(getCrackerArtKey(4)).toBe('ladi')
    expect(getCrackerArtKey(5)).toBe('sutli')

    // R1 4 new effects
    expect(getCrackerArtKey(6)).toBe('waterfall')
    expect(getCrackerArtKey(7)).toBe('comet_fan')
    expect(getCrackerArtKey(8)).toBe('ring_burst')
    expect(getCrackerArtKey(9)).toBe('peacock_fan')

    // String aliases
    expect(getCrackerArtKey('Golden Waterfall')).toBe('waterfall')
    expect(getCrackerArtKey('Comet Fan')).toBe('comet_fan')
    expect(getCrackerArtKey('Ring Burst')).toBe('ring_burst')
    expect(getCrackerArtKey('Peacock Fan')).toBe('peacock_fan')
    expect(getCrackerArtKey('sparkler')).toBe('phuljhari')
  })

  it('renders all 10 R1 cracker artworks with unique test IDs and grounding shadows', () => {
    const keys = [
      'phuljhari',
      'anar',
      'chakri',
      'rocket',
      'ladi',
      'sutli',
      'waterfall',
      'comet_fan',
      'ring_burst',
      'peacock_fan',
    ]

    for (let i = 0; i < keys.length; i++) {
      const { unmount } = render(<CrackerArt index={i} />)
      const svg = screen.getByTestId(`cracker-art-${keys[i]}`)
      expect(svg).toBeDefined()
      expect(svg.getAttribute('viewBox')).toBe('0 0 100 100')
      // Has grounding shadow ellipse
      expect(svg.innerHTML).toContain('ellipse')
      unmount()
    }
  })

  it('renders variants: default, locked, selected, and sticker with distinct classes', () => {
    const { rerender } = render(<CrackerArt index={6} variant="default" />)
    let svg = screen.getByTestId('cracker-art-waterfall')
    expect(svg.classList.contains('cracker-art')).toBe(true)
    expect(svg.classList.contains('is-locked')).toBe(false)

    rerender(<CrackerArt index={6} variant="locked" />)
    svg = screen.getByTestId('cracker-art-waterfall')
    expect(svg.classList.contains('is-locked')).toBe(true)

    rerender(<CrackerArt index={6} variant="selected" />)
    svg = screen.getByTestId('cracker-art-waterfall')
    expect(svg.classList.contains('is-selected')).toBe(true)

    rerender(<CrackerArt index={6} variant="sticker" />)
    svg = screen.getByTestId('cracker-art-waterfall')
    expect(svg.classList.contains('is-sticker')).toBe(true)
  })

  it('renders extension slots for the 4 R2 crackers', () => {
    const r2Keys = ['spiral_sky', 'chrysanthemum', 'double_blossom', 'constellation']
    for (const key of r2Keys) {
      const { unmount } = render(<CrackerArt id={key} />)
      expect(screen.getByTestId(`cracker-art-${key}`)).toBeDefined()
      unmount()
    }
  })

  it('generates unique gradient IDs to prevent collisions between multiple cracker art instances', () => {
    const { container } = render(
      <div>
        <CrackerArt index={0} />
        <CrackerArt index={0} />
      </div>
    )

    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBe(2)

    const linearGradients = container.querySelectorAll('linearGradient')
    const ids = Array.from(linearGradients).map((g) => g.id)
    const uniqueIds = new Set(ids)
    // Every gradient ID must be globally unique across multiple rendered instances
    expect(uniqueIds.size).toBe(ids.length)
  })
})
