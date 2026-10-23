import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('T05 — First paint, favicon, noscript, and share metadata', () => {
  const rootDir = path.resolve(__dirname, '..')
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8')
  const firstPaintCss = fs.readFileSync(path.join(rootDir, 'public', 'first-paint.css'), 'utf8')

  it('sets theme-color to #221b35 in index.html', () => {
    expect(indexHtml).toContain('<meta name="theme-color" content="#221b35"')
  })

  it('links /first-paint.css to prevent white flash before JS runs', () => {
    expect(indexHtml).toContain('<link rel="stylesheet" href="/first-paint.css"')
    expect(firstPaintCss).toContain('background-color: #221b35')
  })

  it('contains a CSS-only diya loader inside <div id="root">', () => {
    expect(indexHtml).toContain('class="first-paint-loader"')
    expect(indexHtml).toContain('class="fp-diya"')
    expect(indexHtml).toContain('class="fp-flame"')
    expect(indexHtml).toContain('Lighting the courtyard')
  })

  it('contains a polite <noscript> message informing users JavaScript is required', () => {
    expect(indexHtml).toContain('<noscript>')
    expect(indexHtml).toContain('Little Lights needs JavaScript')
    expect(indexHtml).toContain('Please enable JavaScript')
  })

  it('links favicon.svg, apple-touch-icon.png, and manifest.webmanifest', () => {
    expect(indexHtml).toContain('<link rel="icon" type="image/svg+xml" href="/favicon.svg"')
    expect(indexHtml).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png"')
    expect(indexHtml).toContain('<link rel="manifest" href="/manifest.webmanifest"')

    expect(fs.existsSync(path.join(rootDir, 'public', 'favicon.svg'))).toBe(true)
    expect(fs.existsSync(path.join(rootDir, 'public', 'apple-touch-icon.png'))).toBe(true)
    expect(fs.existsSync(path.join(rootDir, 'public', 'manifest.webmanifest'))).toBe(true)
  })

  it('syncs canonical, og:url, og:image, and twitter:image to the production domain', () => {
    const prodDomain = 'https://happy-diwali-alpha-mauve.vercel.app'
    expect(indexHtml).toContain(`<link rel="canonical" href="${prodDomain}/"`)
    expect(indexHtml).toContain(`<meta property="og:url" content="${prodDomain}/"`)
    expect(indexHtml).toContain(`<meta property="og:image" content="${prodDomain}/share-card.png"`)
    expect(indexHtml).toContain(`<meta name="twitter:image" content="${prodDomain}/share-card.png"`)

    expect(fs.existsSync(path.join(rootDir, 'public', 'share-card.png'))).toBe(true)
  })

  it('agrees on title and meta description with Little Lights branding', () => {
    expect(indexHtml).toContain('<title>Little Lights — Your Diwali Adventure</title>')
    expect(indexHtml).toContain('name="description" content="A gentle, sensory-friendly virtual Diwali celebration.')
  })

  it('first-paint.css honours prefers-reduced-motion: reduce', () => {
    expect(firstPaintCss).toContain('@media (prefers-reduced-motion: reduce)')
    expect(firstPaintCss).toContain('animation: none')
  })
})
