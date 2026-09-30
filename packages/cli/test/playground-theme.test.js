import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { buildTheme } from '../src/index.js'

const read = (rel) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')
const normalize = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim()

describe('tema de prueba del playground', () => {
  it('es la salida del CLI para playground/grana.config.json (con claro y oscuro), sin desfasarse', () => {
    const { ok, css } = buildTheme(JSON.parse(read('../../vue/playground/grana.config.json')))
    expect(ok).toBe(true)
    const html = read('../../vue/playground/index.html')
    const literal = html.match(/textContent\s*=\s*themed\.value\s*\?\s*("(?:[^"\\]|\\.)*")/)
    expect(literal).not.toBeNull()
    expect(normalize(JSON.parse(literal[1]))).toBe(normalize(css))
    expect(css).toContain('[data-theme="dark"]')
    expect(css).toContain('prefers-color-scheme: dark')
  })
})
