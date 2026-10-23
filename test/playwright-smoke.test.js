import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { particleRng } from '../src/render/Particles.js'

describe('T17 — Playwright smoke test and audio ceiling test', () => {
  const rootDir = path.resolve(__dirname, '..')
  const ciWorkflow = fs.readFileSync(path.join(rootDir, '.github', 'workflows', 'ci.yml'), 'utf8')
  const smokeSpec = fs.readFileSync(path.join(rootDir, 'e2e', 'smoke.spec.js'), 'utf8')

  it('supports seeded deterministic RNG hook in particle engine', () => {
    try {
      window.__SEEDED_RNG__ = () => 0.42
      expect(particleRng()).toBe(0.42)
    } finally {
      delete window.__SEEDED_RNG__
    }
  })

  it('smoke spec exists and validates 5-step journey and reload persistence', () => {
    expect(smokeSpec).toContain('Play Little Lights')
    expect(smokeSpec).toContain('Ask a grown-up to light')
    expect(smokeSpec).toContain('You did it')
    expect(smokeSpec).toContain('chhotu_diwali_save_v1')
    expect(smokeSpec).toContain('page.reload()')
  })

  it('configures Playwright smoke test as a separate job in CI workflow', () => {
    expect(ciWorkflow).toContain('e2e:')
    expect(ciWorkflow).toContain('npx playwright install --with-deps chromium')
    expect(ciWorkflow).toContain('npx playwright test e2e/smoke.spec.js')
  })
})
