import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import FestivalHome from '../src/ui/FestivalHome.jsx'
import CrackerCarousel from '../src/ui/CrackerCarousel.jsx'
import ContextualAction, { getStepFromState } from '../src/ui/ContextualAction.jsx'
import { STATES } from '../src/fsm/GameController.js'
import { GameStoreProvider } from '../src/store/gameStore.jsx'
import { t } from '../src/i18n/index.js'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function () {
    this.open = true
  })
  HTMLDialogElement.prototype.close = vi.fn(function () {
    this.open = false
  })
  window.scrollTo = vi.fn()
})

describe('Tasks U2 & U3 — Mobile Hierarchy and Landscape Clearance', () => {
  const rootDir = path.resolve(__dirname, '..')

  describe('U2 — Readable text hierarchy & clear labels', () => {
    it('uses clear, direct activity titles on FestivalHome instead of decorative microcopy', () => {
      render(
        <GameStoreProvider>
          <FestivalHome onPlay={vi.fn()} motion={true} setMotion={vi.fn()} />
        </GameStoreProvider>
      )

      // Direct, plain-language activity titles as required by Task U2
      expect(screen.getByText('Light diyas')).toBeTruthy()
      expect(screen.getByText('Make rangoli')).toBeTruthy()
      expect(screen.getByText('Watch fireworks')).toBeTruthy()

      // Confirm old poetic microcopy is removed
      expect(screen.queryByText('Light a little joy')).toBeNull()
      expect(screen.queryByText('A splash of happy')).toBeNull()
      expect(screen.queryByText('A sky full of wonder')).toBeNull()
    })

    it('displays the selected firework name and plain-language descriptor in the dock heading', () => {
      render(<CrackerCarousel unlocked={[0, 1]} selectedCracker={0} onSelect={vi.fn()} />)

      // Dock heading contains readable category and selected item descriptor
      const dockHeading = document.querySelector('.dock-heading')
      expect(dockHeading).not.toBeNull()
      expect(dockHeading.textContent).toContain('Phuljhari')
      expect(dockHeading.textContent).toContain(t('tagline_phuljhari'))
    })

    it('ensures no sub-11px font sizes exist in gameplay.css, festival.css, and styles.css', () => {
      const files = ['src/gameplay.css', 'src/festival.css', 'src/styles.css']

      for (const rel of files) {
        const content = fs.readFileSync(path.join(rootDir, rel), 'utf8')
        const lines = content.split('\n')

        lines.forEach((line, index) => {
          const match = line.match(/font-size:\s*([0-9.]+)(px|rem|em)/)
          if (match && match[2] === 'px') {
            const size = parseFloat(match[1])
            expect(
              size,
              `Found miniature text (${size}px) at ${rel}:${index + 1}: "${line.trim()}". All text must be >= 11px.`
            ).toBeGreaterThanOrEqual(11)
          }
        })
      }
    })

    it('ensures contextual primary button renders dominant next action with accessible text', () => {
      const { rerender } = render(
        <ContextualAction fsmState={STATES.IDLE} selectedCracker={0} onPlaceOnStreet={vi.fn()} />
      )

      const idleBtn = screen.getByRole('button', { name: /Place Phuljhari on street/i })
      expect(idleBtn).toBeTruthy()
      expect(idleBtn.className).toContain('contextual-primary-btn')

      rerender(
        <ContextualAction
          fsmState={STATES.READY_ON_STREET}
          selectedCracker={0}
          onLightFuse={vi.fn()}
        />
      )

      const readyBtn = screen.getByRole('button', { name: /Ask a grown-up to light/i })
      expect(readyBtn).toBeTruthy()
      expect(readyBtn.className).toContain('btn--bounce')
    })
  })

  describe('U3 — Reserved layout space for controls in short landscape viewports', () => {
    it('defines reserved, non-overlapping side-by-side coordinates for tray and action bar in short landscape', () => {
      const gameplayCss = fs.readFileSync(path.join(rootDir, 'src/gameplay.css'), 'utf8')

      // Short landscape media query must exist
      expect(gameplayCss).toContain('@media (orientation: landscape) and (max-height: 520px)')

      // Firework dock is positioned on the bottom left
      expect(gameplayCss).toContain('width: min(440px, 48vw)')
      expect(gameplayCss).toContain('max-width: 48vw')

      // Contextual action bar is positioned on the bottom right
      expect(gameplayCss).toContain('width: min(360px, 46vw)')
      expect(gameplayCss).toContain('max-width: 46vw')

      // Ready street banner is placed on the right above the action bar, keeping stage center clear
      expect(gameplayCss).toContain('.game-stage .ready-street-banner')
      expect(gameplayCss).toContain('bottom: calc(76px + var(--sab, 0px))')
    })

    it('ensures overlays and dialogs permit scrolling when height is constrained', () => {
      const gameplayCss = fs.readFileSync(path.join(rootDir, 'src/gameplay.css'), 'utf8')

      // Dialog cards must have max-height and overflow-y: auto
      expect(gameplayCss).toContain('max-height: calc(100vh - 20px)')
      expect(gameplayCss).toContain('max-height: calc(100dvh - 20px)')
      expect(gameplayCss).toContain('overflow-y: auto')
    })

    it('ensures top navbar in landscape maintains compact height and >= 44px touch targets', () => {
      const gameplayCss = fs.readFileSync(path.join(rootDir, 'src/gameplay.css'), 'utf8')

      // Navbar compact height
      expect(gameplayCss).toContain('height: calc(44px + var(--sat, 0px))')

      // Interactive buttons maintain 44px min targets
      expect(gameplayCss).toContain('min-height: 44px')
      expect(gameplayCss).toContain('min-width: 44px')
    })
  })
})
