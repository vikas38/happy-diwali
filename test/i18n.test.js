import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { parse } from '@babel/parser'
import { t, STRINGS_EN } from '../src/i18n/index.js'

describe('T20 — String Externalisation (i18n)', () => {
  const rootDir = path.resolve(__dirname, '..')
  const uiDir = path.join(rootDir, 'src', 'ui')

  describe('t(key, params) helper', () => {
    it('returns translation for existing key', () => {
      expect(t('brand_name')).toBe('LITTLE LIGHTS')
    })

    it('replaces interpolation parameters', () => {
      expect(t('countdown_aria', { number: 3 })).toBe('Countdown: 3')
      expect(t('place_cracker_on_street', { name: 'Anar' })).toBe('Place Anar on street')
      expect(t('step_display', { step: 2, total: 5 })).toBe('Step 2 of 5')
    })

    it('returns key if key is missing', () => {
      expect(t('non_existent_key_xyz')).toBe('non_existent_key_xyz')
    })

    it('handles undefined params without error', () => {
      expect(t('brand_name', undefined)).toBe('LITTLE LIGHTS')
    })

    it('all entries in STRINGS_EN are non-empty strings', () => {
      expect(Object.keys(STRINGS_EN).length).toBeGreaterThan(50)
      for (const [, value] of Object.entries(STRINGS_EN)) {
        expect(typeof value).toBe('string')
        expect(value.trim().length).toBeGreaterThan(0)
      }
    })
  })

  describe('no raw user-visible string literals in src/ui/', () => {
    // Allow-list for purely decorative non-text symbols, glyphs, punctuation, icons
    const ALLOWED_NON_TEXT = new Set([
      '✦',
      '×',
      '✕',
      '→',
      '←',
      '↗',
      '↓',
      '↙',
      '✧',
      '✳',
      '●',
      'Ⅱ',
      '·',
      ':',
      '—',
      '–',
      '-',
      '+',
      '/',
      '%',
      '!',
      '.',
      '🔒',
      '🔓',
      '🔇',
      '🔊',
      '🔔',
      '🍃',
      '⭐',
      '🪔',
      '👂',
      '✨',
      '🌸',
      '🌀',
      '🚀',
      '🎉',
      '💥',
      '☾',
      '▶',
      '⏱',
      'V', // Avatar initial glyph
    ])

    function isAllowlisted(text) {
      const clean = text.replace(/[\s\r\n\t]/g, '')
      if (!clean) return true
      if (ALLOWED_NON_TEXT.has(clean)) return true
      // Check if it consists only of allowed symbols, punctuation, or digits
      const stripped = clean.replace(
        /[✦×✕→←↗↓↙✧✳●Ⅱ·:—–\-\+\d🔒🔓🔇🔊🔔🍃⭐🪔👂✨🌸🌀🚀🎉💥☾▶⏱%!\.]/g,
        ''
      )
      return stripped.length === 0
    }

    function scanAstForLiterals(ast, file = 'Component.jsx') {
      const violations = []

      function walk(node) {
        if (!node || typeof node !== 'object') return

        // 1. Check JSXText
        if (node.type === 'JSXText') {
          const raw = node.value.trim()
          if (raw && !isAllowlisted(raw)) {
            violations.push(`${file}:${node.loc?.start?.line || '?'}: JSX text "${raw}"`)
          }
        }

        // 2. Check user-visible attributes: aria-label, aria-description, title, placeholder
        if (node.type === 'JSXAttribute') {
          const attrName = node.name?.name
          if (['aria-label', 'aria-description', 'title', 'placeholder'].includes(attrName)) {
            if (node.value && node.value.type === 'StringLiteral') {
              const val = node.value.value.trim()
              if (val && !isAllowlisted(val)) {
                violations.push(
                  `${file}:${node.loc?.start?.line || '?'}: attribute ${attrName}="${val}"`
                )
              }
            }
          }
        }

        for (const key of Object.keys(node)) {
          if (key === 'loc') continue
          const child = node[key]
          if (Array.isArray(child)) {
            child.forEach(walk)
          } else if (child && typeof child === 'object') {
            walk(child)
          }
        }
      }

      walk(ast)
      return violations
    }

    it('scanner correctly detects un-externalised raw string literals', () => {
      const badSnippet = `
        export default function BadComponent() {
          return (
            <div>
              <h1>Welcome to Diwali Celebration</h1>
              <button aria-label="Click here to proceed">Submit action</button>
            </div>
          )
        }
      `
      const ast = parse(badSnippet, { sourceType: 'module', plugins: ['jsx'] })
      const violations = scanAstForLiterals(ast, 'BadComponent.jsx')
      expect(violations.length).toBeGreaterThan(0)
      expect(violations.some((v) => v.includes('Welcome to Diwali Celebration'))).toBe(true)
      expect(violations.some((v) => v.includes('Click here to proceed'))).toBe(true)
    })

    it('components in src/ui/ do not contain raw text literals in JSX', () => {
      const files = fs.readdirSync(uiDir).filter((f) => f.endsWith('.jsx') || f.endsWith('.js'))
      const allViolations = []

      for (const file of files) {
        // Skip SVG-only art components if they contain no UI text
        if (['CrackerArt.jsx', 'Diya.jsx', 'FestivalSparkles.jsx'].includes(file)) continue

        const filePath = path.join(uiDir, file)
        const code = fs.readFileSync(filePath, 'utf8')
        const ast = parse(code, {
          sourceType: 'module',
          plugins: ['jsx'],
        })

        const violations = scanAstForLiterals(ast, file)
        allViolations.push(...violations)
      }

      expect(allViolations).toEqual([])
    })
  })
})
