import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('T10 — License status and terms', () => {
  const rootDir = path.resolve(__dirname, '..')
  const licensePath = path.join(rootDir, 'LICENSE')
  const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'))
  const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8')

  it('contains a LICENSE file with an explicit All Rights Reserved notice', () => {
    expect(fs.existsSync(licensePath)).toBe(true)
    const licenseText = fs.readFileSync(licensePath, 'utf8')
    expect(licenseText).toContain('Copyright (c) 2026 Vikas. All rights reserved.')
    expect(licenseText).toContain('proprietary and confidential')
  })

  it('matches the License section in README with the copyright notice', () => {
    expect(readme).toContain('## License')
    expect(readme).toContain('Copyright © 2026 Vikas. All rights reserved.')
    expect(readme).toContain('proprietary and confidential')
  })

  it('specifies UNLICENSED in package.json to reflect proprietary terms', () => {
    expect(packageJson.license).toBe('UNLICENSED')
  })
})
