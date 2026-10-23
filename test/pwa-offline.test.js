import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('T16 — PWA and offline precache', () => {
  const rootDir = path.resolve(__dirname, '..')
  const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'))
  const manifest = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'public', 'manifest.webmanifest'), 'utf8')
  )
  const viteConfig = fs.readFileSync(path.join(rootDir, 'vite.config.js'), 'utf8')
  const vercelJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'vercel.json'), 'utf8'))

  it('declares exact vite-plugin-pwa 2.0.0 in devDependencies', () => {
    expect(packageJson.devDependencies['vite-plugin-pwa']).toBe('2.0.0')
  })

  it('configures VitePWA with generateSW, autoUpdate, and precaching', () => {
    expect(viteConfig).toContain('VitePWA')
    expect(viteConfig).toContain("registerType: 'autoUpdate'")
    expect(viteConfig).toContain("strategies: 'generateSW'")
    expect(viteConfig).toContain('globPatterns')
  })

  it('configures manifest with standalone display, dark theme/background #0B0726, and 192/512 icons', () => {
    expect(manifest.name).toBe('Little Lights — Your Diwali Adventure')
    expect(manifest.short_name).toBe('Little Lights')
    expect(manifest.display).toBe('standalone')
    expect(manifest.background_color).toBe('#0B0726')
    expect(manifest.theme_color).toBe('#0B0726')

    const iconSizes = manifest.icons.map((i) => i.sizes)
    expect(iconSizes).toContain('192x192')
    expect(iconSizes).toContain('512x512')
  })

  it('ensures CSP in vercel.json allows worker-src and manifest-src', () => {
    const globalHeaders = vercelJson.headers.find((h) => h.source === '/(.*)')?.headers || []
    const csp = globalHeaders.find((h) => h.key === 'Content-Security-Policy')?.value
    expect(csp).toContain("worker-src 'self'")
    expect(csp).toContain("manifest-src 'self'")
  })

  it('generates service worker and registration scripts upon build', () => {
    const distSw = path.join(rootDir, 'dist', 'sw.js')
    const distRegister = path.join(rootDir, 'dist', 'registerSW.js')
    expect(fs.existsSync(distSw)).toBe(true)
    expect(fs.existsSync(distRegister)).toBe(true)
  })
})
