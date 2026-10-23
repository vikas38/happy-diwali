import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('T12 — Lint, format, and coverage', () => {
  const rootDir = path.resolve(__dirname, '..')
  const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'))
  const viteConfig = fs.readFileSync(path.join(rootDir, 'vite.config.js'), 'utf8')
  const eslintConfig = fs.readFileSync(path.join(rootDir, 'eslint.config.js'), 'utf8')
  const ciWorkflow = fs.readFileSync(path.join(rootDir, '.github', 'workflows', 'ci.yml'), 'utf8')

  it('defines scripts for lint, format:check, and test:coverage in package.json', () => {
    expect(packageJson.scripts.lint).toBe('eslint src')
    expect(packageJson.scripts['format:check']).toBe('prettier --check .')
    expect(packageJson.scripts['test:coverage']).toBe('vitest run --coverage')
  })

  it('configures ESLint flat config with react and react-hooks plugins', () => {
    expect(eslintConfig).toContain('eslint-plugin-react-hooks')
    expect(eslintConfig).toContain('eslint-plugin-react')
    expect(eslintConfig).toContain('react-hooks/rules-of-hooks')
    expect(eslintConfig).toContain('react/jsx-uses-vars')
  })

  it('configures vitest coverage with v8 provider and thresholds for fsm and store', () => {
    expect(viteConfig).toContain("provider: 'v8'")
    expect(viteConfig).toContain('src/fsm/**')
    expect(viteConfig).toContain('src/store/**')
    expect(viteConfig).toContain('thresholds')
    expect(viteConfig).toContain('statements: 80')
    expect(viteConfig).toContain('branches: 75')
  })

  it('includes format:check and test:coverage in CI workflow', () => {
    expect(ciWorkflow).toContain('run: npm run format:check')
    expect(ciWorkflow).toContain('run: npm run test:coverage')
  })

  it('provides prettier configuration and ignore files', () => {
    expect(fs.existsSync(path.join(rootDir, '.prettierrc'))).toBe(true)
    expect(fs.existsSync(path.join(rootDir, '.prettierignore'))).toBe(true)
  })
})
