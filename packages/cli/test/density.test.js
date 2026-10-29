// Clave `density` del CLI (design/contracts/density.md §6; DECISIONS.md #981).
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { buildTheme, readConfig, KEYS, DENSITY_VALUES } from '../src/index.js'
import { DEFAULTS } from '../src/defaults.js'

const RULE = (v) => `:root:where(:not([data-g-density])) { --g-density: ${v};`
const TOUCH = '@media (pointer: coarse) {\n  :root:where(:not([data-g-density])) { --g-density: 1;'

describe('density · lectura', () => {
  it('es una clave conocida con tres valores de cadena', () => {
    expect(KEYS).toContain('density')
    for (const d of ['default', 'comfortable', 'compact']) {
      const { config, errors } = readConfig({ density: d })
      expect(errors).toEqual([])
      expect(config.density).toBe(d)
    }
    expect(DENSITY_VALUES).toEqual({ default: '1', comfortable: '0.875', compact: '0.75' })
  })

  it('otro valor o tipo, números incluidos: bad-density', () => {
    for (const v of ['tight', 'Compact', 0.75, 1, true, null, {}, ['compact'], '']) {
      const { errors } = readConfig({ density: v })
      expect(errors.map((e) => e.id), JSON.stringify(v)).toEqual(['bad-density'])
      expect(errors[0].message).toMatch(/`density` debe ser "default", "comfortable" o "compact"; se recibió/)
    }
  })

  it('--g-density en overrides o en dark.overrides: density-override', () => {
    for (const raw of [{ overrides: { '--g-density': '0.75' } }, { dark: { overrides: { '--g-density': '0.75' } } }]) {
      const { errors } = readConfig(raw)
      expect(errors.map((e) => e.id)).toEqual(['density-override'])
      expect(errors[0].message).toContain('usa la clave `density`')
      const r = buildTheme(raw)
      expect(r.ok).toBe(false)
      expect(r.css).toBeNull()
      expect(r.issues.map((i) => i.id)).toContain('density-override')
    }
  })
})

describe('density · salida', () => {
  it('sin clave y con "default": nada (Δ0 bytes en tokens.css)', () => {
    for (const base of [{}, { brand: '#0B1F4D', space: 5 }]) {
      const none = buildTheme(base).css
      expect(buildTheme({ ...base, density: 'default' }).css).toBe(none)
      expect(none).not.toContain('--g-density')
    }
  })

  it('con comfortable y compact: las dos reglas, (0,1,0), tras el :root de tokens que no son de color y antes del color', () => {
    for (const [d, v] of [['comfortable', '0.875'], ['compact', '0.75']]) {
      const css = buildTheme({ brand: '#0B1F4D', space: 5, density: d }).css
      expect(css).toContain(RULE(v))
      expect(css).toContain(TOUCH)
      const iOther = css.indexOf(':root {')
      const iRule = css.indexOf(RULE(v))
      const iColor = css.indexOf(':root,\n[data-theme="light"]')
      const iDark = css.indexOf('@media (prefers-color-scheme: dark)')
      expect(iOther).toBeGreaterThanOrEqual(0)
      expect(iOther).toBeLessThan(iRule)
      expect(iRule).toBeLessThan(iColor)
      expect(iColor).toBeLessThan(iDark)
      // Fuera de los bloques de color y de oscuro: una sola vez
      expect(css.split('--g-density').length - 1).toBe(2)
      // Sin capa, como el resto del tema
      expect(css).not.toMatch(/@layer [a-z]/)
    }
  })

  it('solo con density también emite (sin otros tokens)', () => {
    const css = buildTheme({ density: 'compact' }).css
    expect(css).toContain(RULE('0.75'))
    expect(css).toContain(TOUCH)
  })

  it('tokens.json lista --g-density con el valor emitido, sin oscuro, y su uso', () => {
    const t = (d) => buildTheme(d ? { density: d } : {}).doc.density.tokens[0]
    expect(t()).toMatchObject({ cssVar: '--g-density', value: '1', step: 'default' })
    expect(t('compact')).toMatchObject({ cssVar: '--g-density', value: '0.75', step: 'compact' })
    expect(t('comfortable').value).toBe('0.875')
    expect(t('compact').usage).toMatch(/data-g-density/)
    expect(t('compact')).not.toHaveProperty('dark')
  })
})

describe('density · sync-defaults', () => {
  it('DEFAULTS solo lleva --g-density: 1 del :root; las reglas de atributo y la consulta táctil no entran', () => {
    expect(DEFAULTS['--g-density']).toBe('1')
    const css = readFileSync(fileURLToPath(new URL('../../vue/src/styles/defaults.css', import.meta.url)), 'utf8')
    const [light, after] = css.split('/* === OSCURO')
    // Las reglas de atributo viven tras la marca OSCURO (fuera de lo que copia sync-defaults) y siguen existiendo
    expect(light).not.toMatch(/\[data-g-density=/)
    expect(after).toMatch(/\[data-g-density="compact"\]\s*\{\s*--g-density:\s*0\.75;/)
  })
})
