import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('T11 — Dependency upgrades', () => {
  const rootDir = path.resolve(__dirname, '..')
  const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'))

  it('keeps React on major 18', () => {
    expect(packageJson.dependencies.react).toMatch(/^18\./)
    expect(packageJson.dependencies['react-dom']).toMatch(/^18\./)
  })

  it('upgrades vite to 8.x and vitest to 5.x', () => {
    expect(packageJson.devDependencies.vite).toMatch(/^8\./)
    expect(packageJson.devDependencies.vitest).toMatch(/^5\./)
  })

  it('upgrades @vitejs/plugin-react to 6.x', () => {
    expect(packageJson.devDependencies['@vitejs/plugin-react']).toMatch(/^6\./)
  })

  it('pins all runtime and dev dependencies to exact versions (no carets or tildes)', () => {
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    }
    for (const [name, version] of Object.entries(allDeps)) {
      expect(version, `${name} has unpinned prefix`).not.toMatch(/^[\^~]/)
    }
  })
})
