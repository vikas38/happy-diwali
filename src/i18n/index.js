import { STRINGS_EN } from './strings.en.js'

/**
 * Tiny translation helper without third-party dependencies.
 *
 * @param {string} key - String key in STRINGS_EN
 * @param {Record<string, string | number>} [params] - Optional interpolation parameters {key: value}
 * @returns {string} Translated and interpolated string, or key if missing
 */
export function t(key, params) {
  const str = STRINGS_EN[key]
  if (typeof str !== 'string') {
    return key
  }
  if (!params) return str
  return str.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : `{${k}}`))
}

export { STRINGS_EN }
export default t
