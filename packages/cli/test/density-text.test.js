// Pieza 3 · el texto sigue la densidad (design/contracts/density.md §16, tokens.md §5.1; DECISIONS.md #986 a #995).
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { buildTheme, textDensity, compactSize, compactLine, lengthPx, TEXT_DENSITY_KEYS } from '../src/index.js'
import { typography } from '../src/scales.js'
import { DEFAULTS } from '../src/defaults.js'

const px = (v) => lengthPx(v)
const ROLES = ['caption', 'body-sm', 'body', 'title-sm', 'title', 'title-lg', 'display']
const RULES = [
  '[data-g-density="compact"] {',
  '[data-g-density="default"], [data-g-density="comfortable"] {',
  '  [data-g-density] {',
  '  [data-g-density="compact"][class*="--density-compact"] {'
]
// Declaraciones de una regla de una línea que empieza por `head`
const declsOf = (css, head) => {
  const line = css.split('\n').find((l) => l.startsWith(head))
  if (!line) return null
  return Object.fromEntries([...line.matchAll(/(--g-[a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2]]))
}
const gz = (s) => gzipSync(Buffer.from(s), { level: 9 }).length

describe('escala B (tokens.md §5.1)', () => {
  it('tema por defecto: los 9 tokens de la tabla y nada más', () => {
    const { C, D } = textDensity(DEFAULTS)
    const changed = Object.fromEntries(TEXT_DENSITY_KEYS.filter((k) => C[k] !== D[k]).map((k) => [k, Math.round(px(C[k]) * 1000) / 1000]))
    expect(changed).toEqual({
      '--g-text-body-sm-size': 13.125,
      '--g-text-body-size': 15,
      '--g-text-title-sm-size': 18.75,
      '--g-text-title-size': 23.437,
      '--g-text-title-line': 32,
      '--g-text-title-lg-size': 29.296,
      '--g-text-title-lg-line': 36,
      '--g-text-display-size': 36.621,
      '--g-text-display-line': 44
    })
  })

  it('la función compacta es la de typography() con fontSize × 15/16 (misma razón y redondeo a 4px)', () => {
    for (const [fs, ts] of [[16, 1.25], [18, 1.333], [15, 1.2]]) {
      const step1 = typography(fs, ts)
      const small = typography((fs * 15) / 16, ts)
      const { C } = textDensity({ ...DEFAULTS, ...step1 })
      for (const r of ROLES) {
        if (px(step1[`--g-text-${r}-size`]) * 15 / 16 < 12) continue
        expect(px(C[`--g-text-${r}-size`])).toBeCloseTo(px(small[`--g-text-${r}-size`]), 2)
        expect(px(C[`--g-text-${r}-line`])).toBe(px(small[`--g-text-${r}-line`]))
      }
    }
  })

  it('piso de 12 y nunca sube: malla fontSize 12 a 20 × typeScale 1,067 a 1,618', () => {
    for (let fs = 12; fs <= 20; fs += 0.5) {
      for (const ts of [1.067, 1.125, 1.2, 1.25, 1.333, 1.414, 1.5, 1.618]) {
        const r = buildTheme({ fontSize: fs, typeScale: ts })
        if (!r.ok) continue
        const { C, D } = r.text
        for (const k of Object.keys(C)) {
          const c = px(C[k])
          const d = px(D[k])
          expect(c, `${fs}/${ts} ${k}`).toBeLessThanOrEqual(d)
          if (k.endsWith('-size')) expect(c, `${fs}/${ts} ${k}`).toBeGreaterThanOrEqual(12)
        }
      }
    }
    expect(compactSize(11)).toBe(11)
    expect(compactSize(12.5)).toBe(12)
    expect(compactLine('body', 15, 24)).toBe(24)
  })
})

describe('reglas de región del CLI (density.md §16.5, #991)', () => {
  it('Δ0 bytes sin T ni compact (comfortable y default tampoco escriben texto)', () => {
    for (const base of [{}, { brand: '#0B1F4D', space: 5, radius: 8 }, { overrides: { '--g-text-body-tracking': '0.01em' } }]) {
      const r = buildTheme(base)
      expect(r.text).toBeNull()
      expect(r.css).not.toContain('[data-g-density')
      expect(buildTheme({ ...base, density: 'default' }).css).toBe(r.css)
      expect(buildTheme({ ...base, density: 'comfortable' }).css).not.toMatch(/data-g-density.*--g-text-/)
    }
  })

  it('con T: cuatro reglas en el orden de §16.5 (:root › clave › texto › color), (0,1,0) salvo la prop explícita', () => {
    for (const cfg of [{ fontSize: 14, typeScale: 1.2 }, { brand: '#0B1F4D', fontSize: 18, typeScale: 1.333, density: 'compact' }]) {
      const css = buildTheme(cfg).css
      const at = RULES.map((h) => css.indexOf(`\n${h}`))
      for (const i of at) expect(i).toBeGreaterThan(0)
      expect([...at].sort((a, b) => a - b)).toEqual(at)
      const iRoot = css.indexOf(':root {')
      expect(iRoot).toBeLessThan(at[0])
      const iKey = css.indexOf(':root:where(:not([data-g-density]))')
      if (cfg.density) expect(iKey).toBeLessThan(at[0])
      const iColor = css.indexOf(':root,\n[data-theme="light"]')
      if (iColor >= 0) expect(at[3]).toBeLessThan(iColor)
      // La consulta táctil envuelve las dos últimas
      expect(css.slice(at[1], at[2])).toContain('@media (pointer: coarse) {')
      // Nunca descendientes
      expect(css).not.toMatch(/\[data-g-density[^\]]*\][^{,\n]*\s+[.a-z[]/)
      expect(css).not.toMatch(/@layer [a-z]/)
    }
  })

  it('H7 · tema 14/1,2: unión de claves; --g-text-title-line = 28 px (el del tema) también en compact', () => {
    const css = buildTheme({ fontSize: 14, typeScale: 1.2 }).css
    const C = declsOf(css, RULES[0])
    const D = declsOf(css, RULES[1])
    // Las 9 de defaults.css están todas, aunque en este tema alguna no cambie
    for (const k of TEXT_DENSITY_KEYS.filter((k) => textDensity(DEFAULTS).C[k] !== DEFAULTS[k])) expect(Object.keys(C)).toContain(k)
    expect(px(C['--g-text-title-line'])).toBe(28)
    expect(px(D['--g-text-title-line'])).toBe(28)
    expect(px(C['--g-text-body-sm-size'])).toBe(12)
    expect(px(C['--g-text-body-size'])).toBeCloseTo(13.125, 2)
    expect(Object.keys(C)).toEqual(Object.keys(D))
    expect(declsOf(css, RULES[2])).toEqual(D)
    expect(declsOf(css, RULES[3])).toEqual(C)
  })

  it('tema 18/1,333: −6,25 % en todos los roles, caption incluido; body-sm y body bajan un renglón', () => {
    const r = buildTheme({ fontSize: 18, typeScale: 1.333 })
    const { C, D } = r.text
    for (const role of ROLES) expect(px(C[`--g-text-${role}-size`]) / px(D[`--g-text-${role}-size`])).toBeCloseTo(15 / 16, 3)
    expect([px(D['--g-text-body-sm-line']), px(C['--g-text-body-sm-line'])]).toEqual([24, 20])
    expect([px(D['--g-text-body-line']), px(C['--g-text-body-line'])]).toEqual([28, 24])
  })

  it('overrides: una clave de texto sobrescrita es T y entra en K; la región sigue el valor del tema', () => {
    const r = buildTheme({ overrides: { '--g-text-body-size': '1.125rem' } })
    const C = declsOf(r.css, RULES[0])
    const D = declsOf(r.css, RULES[1])
    expect(px(D['--g-text-body-size'])).toBe(18)
    expect(px(C['--g-text-body-size'])).toBeCloseTo(16.875, 3)
    // El resto, las de defaults.css (unión), con los valores del tema por defecto
    expect(C['--g-text-title-line']).toBe('2rem')
    // En px también se deriva
    const p = buildTheme({ overrides: { '--g-text-caption-size': '14px' } })
    expect(px(declsOf(p.css, RULES[0])['--g-text-caption-size'])).toBeCloseTo(13.125, 3)
    expect(declsOf(p.css, RULES[1])['--g-text-caption-size']).toBe('14px')
  })

  it('valor no derivable: igual en los tres pasos y nota text-density; el CSS sigue siendo válido', () => {
    const v = 'clamp(1rem, 0.9rem + 0.5vw, 1.25rem)'
    const r = buildTheme({ overrides: { '--g-text-body-size': v } })
    expect(r.ok).toBe(true)
    for (const h of RULES) expect(declsOf(r.css, h)['--g-text-body-size']).toBe(v)
    // El renglón de body no baja si su tamaño no puede
    expect(declsOf(r.css, RULES[0])['--g-text-body-line']).toBeUndefined()
    const note = r.notes.find((n) => n.code === 'text-density')
    expect(note.message).toBe('`--g-text-body-size` no es una longitud en rem o px: se queda igual en los tres pasos de densidad.')
    expect(r.notes.filter((n) => n.code === 'text-density')).toHaveLength(1)
    // Sin valores no derivables, sin nota
    expect(buildTheme({ fontSize: 15 }).notes.some((n) => n.code === 'text-density')).toBe(false)
  })

  it('dark.overrides de texto queda fuera de contrato: no es T ni entra en K', () => {
    const r = buildTheme({ dark: { overrides: { '--g-text-body-size': '1.125rem' } } })
    expect(r.text).toBeNull()
  })

  it('compact sin T: el texto (DEFAULTS) dentro de la regla de la clave, sin selector nuevo', () => {
    const css = buildTheme({ density: 'compact' }).css
    const key = declsOf(css, ':root:where(:not([data-g-density])) {')
    const touch = declsOf(css, '  :root:where(:not([data-g-density])) {')
    const { C, D } = textDensity(DEFAULTS)
    const nine = TEXT_DENSITY_KEYS.filter((k) => C[k] !== D[k])
    expect(Object.keys(key)).toEqual(['--g-density', ...nine])
    expect(key['--g-density']).toBe('0.75')
    expect(touch['--g-density']).toBe('1')
    for (const k of nine) { expect(key[k]).toBe(C[k]); expect(touch[k]).toBe(D[k]) }
    for (const h of RULES) expect(css.split('\n').some((l) => l.startsWith(h))).toBe(false)
    // comfortable: la regla de §6 sin texto
    expect(buildTheme({ density: 'comfortable' }).css).not.toContain('--g-text-')
  })

  it('compact con T: el texto del tema en la clave y además las cuatro reglas de región', () => {
    const r = buildTheme({ fontSize: 14, typeScale: 1.2, density: 'compact' })
    const key = declsOf(r.css, ':root:where(:not([data-g-density])) {')
    expect(px(key['--g-text-title-line'])).toBe(28)
    expect(px(key['--g-text-body-size'])).toBeCloseTo(13.125, 2)
    for (const h of RULES) expect(declsOf(r.css, h)).not.toBeNull()
  })

  it('tokens.json sin cambios (R5): no lista valores compactos', () => {
    const doc = JSON.stringify(buildTheme({ fontSize: 14, typeScale: 1.2, density: 'compact' }).doc)
    expect(doc).not.toMatch(/compact[^"]*-size|text-density/)
  })

  it('peso (gzip -9, density.md §16.9): compact sin T ≤ +256 B, con T ≤ +384 B, con ambas ≤ +448 B', () => {
    const base = { brand: '#0B1F4D', space: 5 }
    // Línea base: la salida del CLI sin las reglas de texto (las mismas configuraciones antes del lote)
    const strip = (css) => css.split('\n').map((l) => l.replace(/ --g-text-[a-z-]+: [^;]+;/g, '')).filter((l) => !RULES.some((h) => l.startsWith(h))).join('\n').replace(/@media \(pointer: coarse\) \{\n\}\n/g, '')
    const delta = (cfg) => { const css = buildTheme(cfg).css; return gz(css) - gz(strip(css)) }
    expect(delta({ ...base, density: 'compact' })).toBeLessThanOrEqual(256)
    for (const t of [{ fontSize: 14, typeScale: 1.2 }, { fontSize: 18, typeScale: 1.333 }, { fontSize: 15 }]) {
      expect(delta({ ...base, ...t })).toBeLessThanOrEqual(384)
      expect(delta({ ...base, ...t, density: 'compact' })).toBeLessThanOrEqual(448)
    }
  })
})

describe('defaults.css y el CLI dicen lo mismo (density.md §16.4)', () => {
  const css = readFileSync(fileURLToPath(new URL('../../vue/src/styles/defaults.css', import.meta.url)), 'utf8')
  const [light, after] = css.split('/* === OSCURO')
  const block = (sel) => {
    const i = after.indexOf(`${sel} {\n  --g-text-`)
    if (i < 0) return null
    const body = after.slice(i, after.indexOf('}', i))
    return Object.fromEntries([...body.matchAll(/(--g-text-[a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2]]))
  }

  it('sync-defaults deja fuera las reglas de región: DEFAULTS lleva el paso 1', () => {
    expect(light).not.toMatch(/\[data-g-density=/)
    for (const k of TEXT_DENSITY_KEYS) expect(DEFAULTS[k]).toBe(typography(16, 1.25)[k])
  })

  it.runIf(after.includes('--g-text-body-size'))('las reglas de región de defaults.css = la función del CLI sobre DEFAULTS (± 0,0001 rem)', () => {
    const { C, D } = textDensity(DEFAULTS)
    const nine = TEXT_DENSITY_KEYS.filter((k) => C[k] !== D[k])
    const c = block('[data-g-density="compact"]')
    const d = block('[data-g-density="comfortable"]') ?? block('[data-g-density="default"],\n[data-g-density="comfortable"]')
    expect(Object.keys(c).sort()).toEqual([...nine].sort())
    for (const k of nine) expect(Math.abs(px(c[k]) - px(C[k])) / 16).toBeLessThanOrEqual(0.0001)
    if (d) for (const k of nine) expect(d[k]).toBe(D[k])
  })
})
