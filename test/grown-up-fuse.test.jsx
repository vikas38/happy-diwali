import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { ARM_STATES } from '../src/render/characters/ChhotuChamp.js'
import { GameController, STATES } from '../src/fsm/GameController.js'
import { StepIndicator } from '../src/ui/ContextualAction.jsx'
import { render, screen } from '@testing-library/react'
import React from 'react'

function makeMockEngines() {
  return {
    sound: {
      init: () => {},
      resume: async () => {},
      startMusic: () => {},
      stopMusic: () => {},
      stopCrackerAudio: () => {},
      setIntensity: () => {},
      setMasterVolume: () => {},
      playChime: () => {},
      playTestTone: () => {},
      supported: true,
    },
    store: {
      getState: () => ({ intensity: 0, masterVolume: 0.7 }),
      isUnlocked: () => true,
      hasSeenIntro: () => true,
      markIntroSeen: () => {},
      recordCrackerLit: () => {},
      isAudioMuted: () => false,
    },
    chhotu: {
      setPosition: () => {},
      setFacing: () => {},
      setArmState: vi.fn(),
      walkTo: vi.fn((fx, fy, tx, ty, d, cb) => {
        cb?.()
      }),
    },
    pip: {
      setPosition: () => {},
      setMood: () => {},
    },
    renderer: { width: 800, height: 600 },
    background: { setGameState: () => {} },
  }
}

describe('T09 — Grown-up lights the fuse, copy wording', () => {
  const rootDir = path.resolve(__dirname, '..')

  it('keeps the child in safe posture (covering ears) and never triggers child lighting pose', () => {
    const gc = new GameController()
    const engines = makeMockEngines()
    gc.init(engines)
    gc.startGame()
    gc.selectCracker(0)
    gc.putOnStreet()

    expect(gc.state).toBe(STATES.READY_ON_STREET)
    gc.tapCracker()

    // Step-back triggers walk directly with ears covered
    expect(engines.chhotu.setArmState).toHaveBeenCalledWith(ARM_STATES.COVER_EARS_SMILE)
    expect(engines.chhotu.setArmState).not.toHaveBeenCalledWith(ARM_STATES.LIGHTING_REACH)
    expect(gc.state).toBe(STATES.COUNTDOWN_3_2_1)
    gc.dispose()
  })

  it('includes "this is a playful experience, not a treatment" in the For Grown-ups panel copy', () => {
    const copy = fs.readFileSync(path.join(rootDir, 'src', 'i18n', 'strings.en.js'), 'utf8')
    expect(copy).toContain('This is a playful experience, not a treatment.')
  })

  it('indicates an adult handles the fuse in the Step 3 indicator', () => {
    render(<StepIndicator step={3} totalSteps={5} />)
    expect(screen.getByText(/Grown-up lights fuse/i)).toBeTruthy()
  })

  it('contains zero user-facing occurrences of therapeutic or overcome fear in production copy', () => {
    const pkg = fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8')
    const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8')
    const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8')

    for (const text of [pkg, readme, indexHtml]) {
      expect(text.toLowerCase()).not.toContain('therapeutic')
      expect(text.toLowerCase()).not.toContain('overcome fear')
    }
  })
})
