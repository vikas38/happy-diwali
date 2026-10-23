import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('T15 — Privacy note', () => {
  const rootDir = path.resolve(__dirname, '..')
  const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8')
  const stringsEn = fs.readFileSync(path.join(rootDir, 'src', 'i18n', 'strings.en.js'), 'utf8')

  it('contains the three plain privacy lines in README.md', () => {
    expect(readme).toContain('Nothing leaves your device.')
    expect(readme).toContain('Progress is saved only in this browser.')
    expect(readme).toContain('There is no tracking, no analytics, and no accounts.')
  })

  it('contains the three plain privacy lines in For Grown-ups panel / strings', () => {
    expect(stringsEn).toContain('Nothing leaves your device.')
    expect(stringsEn).toContain('Progress is saved only in this browser.')
    expect(stringsEn).toContain('There is no tracking, no analytics, and no accounts.')
  })

  it('ensures zero network telemetry, tracking, or analytics calls exist in src/', () => {
    const srcDir = path.join(rootDir, 'src')
    function scanDir(dir) {
      const files = fs.readdirSync(dir)
      for (const file of files) {
        const full = path.join(dir, file)
        if (fs.statSync(full).isDirectory()) {
          scanDir(full)
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
          const content = fs.readFileSync(full, 'utf8')
          expect(content).not.toContain('fetch(')
          expect(content).not.toContain('XMLHttpRequest')
          expect(content).not.toContain('sendBeacon')
          expect(content).not.toContain('google-analytics')
          expect(content).not.toContain('gtag')
        }
      }
    }
    scanDir(srcDir)
  })
})
