import { describe, it, expect } from 'vitest'
import { DEFAULTS, DARK } from '../src/defaults.js'
import { isColorGroup, splitColorGroup } from '../src/scheme.js'
import { deriveDarkColor } from '../src/derive.js'
import { contrast, parseHex } from '../src/color.js'
import { readConfig } from '../src/config.js'
import { generateTheme, toCss } from '../src/theme.js'
import { validateTheme } from '../src/validate.js'
import { buildTheme } from '../src/index.js'

const SURFACE = DARK['--g-color-surface']
const C = (a, b) => contrast(parseHex(a), parseHex(b))

describe('DARK (defaults.js)', () => {
  it('redeclara exactamente el grupo de color del tema claro', () => {
    const light = Object.keys(splitColorGroup(DEFAULTS).color).sort()
    expect(Object.keys(DARK).sort()).toEqual(light)
  })

  it('isColorGroup: colores, superficies, sombras, cristal y calendario sí; radios, espaciado y tipografía no', () => {
    for (const k of ['--g-color-brand', '--g-surface-shell', '--g-surface-backdrop', '--g-shadow-2', '--g-glass-tint', '--g-calendar-grid-color']) expect(isColorGroup(k), k).toBe(true)
    for (const k of ['--g-radius-md', '--g-space-1', '--g-text-body-size', '--g-surface-gap', '--g-surface-radius', '--g-sidebar-width', '--g-widget-row', '--g-focus-width']) expect(isColorGroup(k), k).toBe(false)
  })

  it('el tema oscuro por defecto cumple los mínimos (sin errores ni avisos)', () => {
    expect(validateTheme({ ...DEFAULTS, ...DARK }, { scheme: 'dark' })).toEqual([])
  })

  it('fondo gris casi negro y lo elevado es más claro: sunken ≤ bg < surface', () => {
    const l = (k) => parseHex(DARK[k]).reduce((a, b) => a + b, 0)
    expect(l('--g-color-surface-sunken')).toBeLessThanOrEqual(l('--g-color-bg'))
    expect(l('--g-color-bg')).toBeLessThan(l('--g-color-surface'))
    expect(DARK['--g-color-bg']).not.toBe('#000000')
  })
})

describe('deriveDarkColor', () => {
  it('conserva una base clara (L ≥ 0.5) y la deja en ≥ 4.5:1 sobre la superficie', () => {
    const d = deriveDarkColor('#F5B940', { surface: SURFACE })
    expect(d.base).toBe('#F5B940')
    expect(C(d.base, SURFACE)).toBeGreaterThanOrEqual(4.5)
  })

  it('refleja una base oscura: una tinta y un azul marino pasan a tonos claros', () => {
    const ink = deriveDarkColor('#1F1F1F', { surface: SURFACE })
    const navy = deriveDarkColor('#0B1F4D', { surface: SURFACE })
    expect(parseHex(ink.base)[0]).toBeGreaterThan(150)
    expect(parseHex(navy.base)[2]).toBeGreaterThan(200)
    for (const d of [ink, navy]) expect(C(d.base, SURFACE)).toBeGreaterThanOrEqual(4.5)
  })

  it('todos los derivados cumplen sus pares en casos extremos', () => {
    for (const c of ['#F5B940', '#FFE9A0', '#8A8A8A', '#0B1F4D', '#5B3FE0', '#E11D48', '#00FF00', '#000000', '#FFFFFF', '#0B63CE']) {
      const d = deriveDarkColor(c, { surface: SURFACE })
      expect(C(d.base, SURFACE), `${c} base`).toBeGreaterThanOrEqual(4.49)
      expect(C(d.text, SURFACE), `${c} text`).toBeGreaterThanOrEqual(4.49)
      expect(C(d.on, d.base), `${c} on/base`).toBeGreaterThanOrEqual(4.49)
      expect(C(d.on, d.strong), `${c} on/strong`).toBeGreaterThanOrEqual(4.49)
      expect(C(d.onSoft, d.soft), `${c} on-soft`).toBeGreaterThanOrEqual(4.49)
    }
  })

  it('soft es un velo oscuro (L 0.26): más oscuro que la base y más claro que la superficie', () => {
    const d = deriveDarkColor('#0B63CE', { surface: SURFACE })
    const sum = (h) => parseHex(h).reduce((a, b) => a + b, 0)
    expect(sum(d.soft)).toBeLessThan(sum(d.base))
    expect(sum(d.soft)).toBeGreaterThan(sum(SURFACE))
  })

  it('rechaza un color inválido', () => {
    expect(() => deriveDarkColor('azul')).toThrow()
  })
})

describe('readConfig · dark', () => {
  it('acepta true, false y un objeto con brand, accent y overrides', () => {
    expect(readConfig({ dark: false }).config.dark).toBe(false)
    expect(readConfig({ dark: true }).config.dark).toBe(true)
    const { config, errors } = readConfig({ dark: { brand: 'f5b940', accent: '#5B3FE0', overrides: { '--g-color-text': '#fff' } } })
    expect(errors).toEqual([])
    expect(config.dark).toEqual({ brand: '#F5B940', accent: '#5B3FE0', overrides: { '--g-color-text': '#fff' } })
  })

  it('rechaza tipos, claves y colores inválidos con el motivo', () => {
    expect(readConfig({ dark: 'sí' }).errors[0].id).toBe('bad-dark')
    expect(readConfig({ dark: [] }).errors[0].id).toBe('bad-dark')
    const e = readConfig({ dark: { brand: 'azul', extra: 1, overrides: { color: 'red' } } }).errors
    expect(e.map((x) => x.id)).toEqual(expect.arrayContaining(['unknown-key', 'bad-color', 'bad-override']))
    expect(e.find((x) => x.id === 'unknown-key').message).toContain('dark.extra')
  })
})

describe('generateTheme · oscuro', () => {
  it('por defecto el oscuro está activo y sin colores del usuario no genera nada', () => {
    const { dark } = generateTheme({})
    expect(dark.enabled).toBe(true)
    expect(dark.generated).toEqual({})
  })

  it('brand genera sus 6 tokens oscuros; accent sin valor sale del text oscuro de brand', () => {
    const { dark } = generateTheme({ brand: '#0B1F4D' })
    expect(Object.keys(dark.generated).filter((k) => k.includes('brand'))).toHaveLength(6)
    expect(dark.generated['--g-color-accent']).toBe(dark.generated['--g-color-brand-text'])
  })

  it('dark.brand y dark.accent sustituyen a los derivados automáticos (con las mismas reglas)', () => {
    const { dark } = generateTheme({ brand: '#0B1F4D', dark: { brand: '#F5B940', accent: '#5B3FE0' } })
    expect(dark.generated['--g-color-brand']).toBe('#F5B940')
    expect(C(dark.generated['--g-color-accent-text'], SURFACE)).toBeGreaterThanOrEqual(4.49)
  })

  it('un override claro de un token de color también recibe su valor oscuro (si no, ganaría en el oscuro)', () => {
    const { generated, dark } = generateTheme({ overrides: { '--g-color-surface': '#FFF8E1', '--g-glass-tint': '#FFF6E5' } })
    expect(generated['--g-color-surface']).toBe('#FFF8E1')
    expect(dark.generated['--g-color-surface']).toBe(DARK['--g-color-surface'])
    expect(dark.generated['--g-glass-tint']).toBe(DARK['--g-glass-tint'])
  })

  it('dark.overrides se aplican solo al oscuro', () => {
    const { generated, dark } = generateTheme({ dark: { overrides: { '--g-color-text': '#FFFFFF' } } })
    expect(generated['--g-color-text']).toBeUndefined()
    expect(dark.generated['--g-color-text']).toBe('#FFFFFF')
    expect(dark.tokens['--g-color-text']).toBe('#FFFFFF')
  })

  it('los tokens que no son de color (radio, espacio) no pasan al oscuro', () => {
    const { dark, tokens } = generateTheme({ radius: 12, space: 5, brand: '#F5B940' })
    expect(Object.keys(dark.generated).some((k) => k.includes('radius') || k.includes('space'))).toBe(false)
    expect(dark.tokens['--g-space-1']).toBe('5px')
    expect(tokens['--g-space-1']).toBe('5px')
  })

  it('dark: false desactiva el oscuro y no hay tokens oscuros', () => {
    const { dark } = generateTheme({ brand: '#F5B940', dark: false })
    expect(dark.enabled).toBe(false)
    expect(dark.tokens).toBeNull()
  })
})

describe('toCss · bloques del tema oscuro', () => {
  const css = (config) => { const t = generateTheme(config); return toCss(t.generated, { source: 'x.json', dark: t.dark }) }
  const at = (text, s) => text.indexOf(s)

  it('con colores: no-color en :root, color claro, consulta oscura y [data-theme="dark"], en ese orden', () => {
    const c = css({ brand: '#F5B940', space: 5 })
    expect(c).toContain(':root {\n  --g-space-1: 5px;')
    expect(c).toContain(':root,\n[data-theme="light"] {\n  --g-color-brand: #F5B940;')
    expect(c).toContain('@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n    color-scheme: dark;')
    expect(c).toContain('[data-theme="dark"] {\n  color-scheme: dark;')
    expect(at(c, '[data-theme="light"] {')).toBeLessThan(at(c, '@media (prefers-color-scheme: dark)'))
    expect(at(c, '@media (prefers-color-scheme: dark)')).toBeLessThan(at(c, '[data-theme="dark"] {'))
    expect(c).not.toContain('@layer {')
  })

  it('el valor oscuro de brand no es el claro', () => {
    const c = css({ brand: '#0B1F4D' })
    const light = c.match(/\[data-theme="light"\] \{[\s\S]*?--g-color-brand: (#[0-9A-F]{6})/)[1]
    const dark = c.match(/\[data-theme="dark"\] \{[\s\S]*?--g-color-brand: (#[0-9A-F]{6})/)[1]
    expect(light).toBe('#0B1F4D')
    expect(dark).not.toBe(light)
  })

  it('sin colores cambiados no hay bloques de color (solo :root)', () => {
    const c = css({ space: 5 })
    expect(c).not.toContain('data-theme')
    expect(c).not.toContain('prefers-color-scheme')
  })

  it('dark: false restablece el grupo de color claro completo dentro de la consulta oscura', () => {
    const c = css({ brand: '#F5B940', dark: false })
    expect(c).toContain('@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="dark"]) {\n    color-scheme: light;')
    expect(c).not.toMatch(/^\s*color-scheme: dark;/m)
    expect(c).toContain('--g-color-surface: #FFFFFF;')
    expect(c).toContain('--g-color-brand: #F5B940;')
    for (const k of Object.keys(splitColorGroup(DEFAULTS).color)) expect(c, k).toContain(`${k}:`)
  })

  it('dark: false sin colores propios también restablece el claro (el sistema oscuro no activa el oscuro de los defaults)', () => {
    const c = css({ font: 'Inter', dark: false })
    expect(c).toContain(':root:not([data-theme="dark"])')
  })
})

describe('validateTheme · los dos esquemas', () => {
  it('casos extremos: todos los colores derivados cumplen en el claro y en el oscuro', () => {
    for (const brand of ['#F5B940', '#FFE9A0', '#8A8A8A', '#0B1F4D', '#5B3FE0', '#E11D48', '#00FF00']) {
      const r = buildTheme({ brand, accent: brand })
      expect(r.issues.filter((i) => i.severity === 'error'), brand).toEqual([])
      expect(r.ok).toBe(true)
    }
  })

  it('un override del oscuro que rompe un mínimo se rechaza y el mensaje lleva [oscuro]', () => {
    const r = buildTheme({ dark: { overrides: { '--g-color-text-muted': '#444444' } } })
    expect(r.ok).toBe(false)
    const e = r.issues.find((i) => i.id === 'text-contrast')
    expect(e.scheme).toBe('dark')
    expect(e.message.startsWith('[oscuro]')).toBe(true)
    expect(r.css).toBeNull()
  })

  it('un override claro que rompe el claro no se atribuye al oscuro', () => {
    const r = buildTheme({ overrides: { '--g-color-text-muted': '#BBBBBB' } })
    expect(r.ok).toBe(false)
    const ids = r.issues.filter((i) => i.severity === 'error')
    expect(ids.every((i) => i.scheme === undefined)).toBe(true)
  })

  it('el cristal del oscuro se valida contra el peor fondo (blanco)', () => {
    const r = buildTheme({ dark: { overrides: { '--g-glass-opacity': '0.56' } } })
    expect(r.ok).toBe(false)
    const g = r.issues.find((i) => i.id === 'glass-contrast')
    expect(g.message).toContain('fondo blanco')
  })

  it('los avisos de espacio y de tamaño de texto no se duplican en el oscuro', () => {
    const r = buildTheme({ space: 3 })
    expect(r.issues.filter((i) => i.id === 'space-small')).toHaveLength(1)
  })

  it('dark: false con colores propios avisa del oscuro forzado; sin colores no avisa', () => {
    expect(buildTheme({ brand: '#F5B940', dark: false }).issues.some((i) => i.id === 'dark-disabled')).toBe(true)
    expect(buildTheme({ font: 'Inter', dark: false }).issues.some((i) => i.id === 'dark-disabled')).toBe(false)
    expect(buildTheme({ brand: '#F5B940', dark: false }).ok).toBe(true)
  })

  it('buildTheme devuelve el bloque oscuro en el css y en dark', () => {
    const r = buildTheme({ brand: '#7A1F5C', accent: '#0F766E' }, { source: 'a.json' })
    expect(r.ok).toBe(true)
    expect(r.dark.enabled).toBe(true)
    expect(r.css).toContain('[data-theme="dark"]')
  })
})
