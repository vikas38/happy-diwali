import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('T08 — Naming, README and public/ cleanup', () => {
  const rootDir = path.resolve(__dirname, '..')
  const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'))
  const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8')
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8')

  it('aligns product name in package.json to little-lights', () => {
    expect(packageJson.name).toBe('little-lights')
  })

  it('aligns description across package.json, README, and index.html meta description', () => {
    const canonicalDesc = 'A gentle, sensory-friendly virtual Diwali celebration. Light diyas, create rangoli, and discover pretend fireworks at your own pace.'
    expect(packageJson.description).toBe(canonicalDesc)
    expect(indexHtml).toContain(`<meta name="description" content="${canonicalDesc}" />`)
    expect(readme).toContain(canonicalDesc)
  })

  it('aligns title in README and index.html to Little Lights — Your Diwali Adventure', () => {
    expect(readme).toContain('# Little Lights — Your Diwali Adventure')
    expect(indexHtml).toContain('<title>Little Lights — Your Diwali Adventure</title>')
  })

  it('points README demo link to the active production domain', () => {
    expect(readme).toContain('[Play Little Lights](https://happy-diwali-alpha-mauve.vercel.app/)')
  })

  it('specifies the correct GitHub clone URL in README', () => {
    expect(readme).toContain('git clone https://github.com/vikas38/happy-diwali.git')
  })

  it('documents public/ in README Architecture and clarifies local assets', () => {
    expect(readme).toContain('public/')
    expect(readme).toContain('public/assets/characters/')
    expect(readme).toContain('no external network asset downloads')
  })

  it('verifies public/assets/characters contains local sprites referenced in codebase', () => {
    const charDir = path.join(rootDir, 'public', 'assets', 'characters')
    expect(fs.existsSync(path.join(charDir, 'chhotu_idle.png'))).toBe(true)
    expect(fs.existsSync(path.join(charDir, 'chhotu_safe_ears.png'))).toBe(true)
    expect(fs.existsSync(path.join(charDir, 'chhotu_celebrate.png'))).toBe(true)
  })
})
