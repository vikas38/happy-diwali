import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('T13 — Security headers', () => {
  const rootDir = path.resolve(__dirname, '..')
  const vercelJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'vercel.json'), 'utf8'))
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8')

  const globalHeaders = vercelJson.headers.find((h) => h.source === '/(.*)')?.headers || []
  const getHeader = (name) =>
    globalHeaders.find((h) => h.key.toLowerCase() === name.toLowerCase())?.value

  it('sets X-Content-Type-Options to nosniff', () => {
    expect(getHeader('X-Content-Type-Options')).toBe('nosniff')
  })

  it('sets Referrer-Policy to no-referrer', () => {
    expect(getHeader('Referrer-Policy')).toBe('no-referrer')
  })

  it('disables camera, microphone, geolocation, and payment in Permissions-Policy', () => {
    const policy = getHeader('Permissions-Policy')
    expect(policy).toContain('camera=()')
    expect(policy).toContain('microphone=()')
    expect(policy).toContain('geolocation=()')
    expect(policy).toContain('payment=()')
  })

  it('enforces a restrictive Content-Security-Policy with required directives', () => {
    const csp = getHeader('Content-Security-Policy')
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("img-src 'self' data:")
    expect(csp).toContain("connect-src 'self'")
    expect(csp).toContain("worker-src 'self'")
    expect(csp).toContain("manifest-src 'self'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("frame-ancestors 'none'")
  })

  it('complies with CSP by linking first-paint stylesheet instead of unhashed inline style', () => {
    expect(indexHtml).toContain('<link rel="stylesheet" href="/first-paint.css" />')
  })
})
