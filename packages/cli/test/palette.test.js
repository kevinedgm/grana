import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildTheme, categoryBases, contrast, distance, parseHex, semanticAdjustments, separate, tintedNeutrals, toOklch, usageOf, MIN_DISTANCE } from '../src/index.js'
import { readConfig } from '../src/config.js'
import { run } from '../src/cli.js'

const lch = (hex) => toOklch(parseHex(hex))
const hueDiff = (a, b) => Math.abs(((a - b + 540) % 360) - 180)

describe('semánticos sin choque con la marca', () => {
  it('no toca nada si la marca y el acento no se parecen a un semántico', () => {
    expect(semanticAdjustments({ brand: '#0B1F4D', accent: '#6D28D9' })).toEqual({})
    expect(semanticAdjustments({})).toEqual({})
  })

  it('una marca roja separa «danger» (a ≥ 0.12 de la marca y del acento, en claro y en oscuro)', () => {
    const adj = semanticAdjustments({ brand: '#9D1635', accent: '#D85A70' })
    expect(Object.keys(adj)).toEqual(['danger'])
    expect(adj.danger.ok).toBe(true)
    expect(distance(lch(adj.danger.hex), lch('#9D1635'))).toBeGreaterThanOrEqual(MIN_DISTANCE)
    expect(distance(lch(adj.danger.hex), lch('#D85A70'))).toBeGreaterThanOrEqual(MIN_DISTANCE)
  })

  it('un acento verde azulado separa «success»; una marca gris separa «info» de un acento azul', () => {
    expect(Object.keys(semanticAdjustments({ brand: '#7A1F5C', accent: '#0F766E' }))).toEqual(['success'])
    expect(Object.keys(semanticAdjustments({ brand: '#1F1F1F', accent: '#0B63CE' }))).toEqual(['info'])
  })

  it('el giro es el mínimo: no sale de ±45° de tono ni de ±0.15 de luminosidad', () => {
    const adj = semanticAdjustments({ brand: '#9D1635', accent: '#D85A70' }).danger
    expect(Math.abs(adj.dh)).toBeLessThanOrEqual(45)
    expect(Math.abs(adj.dl)).toBeLessThanOrEqual(0.15 + 1e-9)
  })

  it('separate devuelve el color tal cual si ya está lejos', () => {
    const r = separate('#1E7A46', ['#9D1635'])
    expect(r.changed).toBe(false)
    expect(r.dh).toBe(0)
  })

  it('si no hay forma de separarlo lo dice (ok: false) y el tema avisa', () => {
    const r = buildTheme({ brand: '#0F7A55' })
    const warn = r.issues.filter((i) => i.id === 'semantic-close')
    expect(warn.length).toBeGreaterThan(0)
    expect(warn[0].severity).toBe('warning')
    expect(r.ok).toBe(true)
  })

  it('el tema emite los seis tokens del semántico ajustado, en claro y en oscuro, con contraste', () => {
    const r = buildTheme({ brand: '#9D1635', accent: '#D85A70' })
    expect(r.ok).toBe(true)
    expect(r.generated['--g-color-danger']).not.toBe('#C4321F')
    for (const k of ['', '-strong', '-soft', '-text']) expect(r.generated[`--g-color-danger${k}`]).toBeDefined()
    expect(r.dark.generated['--g-color-danger']).toBeDefined()
    expect(r.notes.some((n) => n.id === 'semantic-adjusted' && /danger/.test(n.message))).toBe(true)
    expect(r.issues.filter((i) => i.severity === 'error')).toEqual([])
  })

  it('un override de «danger» gana a la derivación (y se avisa si queda pegado a la marca)', () => {
    const r = buildTheme({ brand: '#9D1635', overrides: { '--g-color-danger': '#C4321F' } })
    expect(r.generated['--g-color-danger']).toBe('#C4321F')
    expect(r.issues.some((i) => i.id === 'semantic-close')).toBe(true)
  })
})

describe('neutros teñidos', () => {
  it('llevan el tono de la marca a croma bajo y conservan el contraste (texto 4.5:1, control 3:1)', () => {
    for (const dark of [false, true]) {
      const n = tintedNeutrals('#9D1635', { dark })
      const surface = parseHex(dark ? n['--g-color-surface'] : '#FFFFFF')
      const sunken = parseHex(n['--g-color-surface-sunken'])
      expect(lch(n['--g-color-text']).c).toBeGreaterThan(0)
      expect(lch(n['--g-color-text']).c).toBeLessThanOrEqual(0.021)
      expect(hueDiff(lch(n['--g-color-text-muted']).h, lch('#9D1635').h)).toBeLessThan(6)
      for (const bg of [surface, sunken]) {
        for (const t of ['--g-color-text', '--g-color-text-muted', '--g-color-text-subtle']) expect(contrast(parseHex(n[t]), bg)).toBeGreaterThanOrEqual(4.5)
        expect(contrast(parseHex(n['--g-color-border-control']), bg)).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it('una marca casi gris no tiñe nada; "neutrals": "pure" lo desactiva', () => {
    expect(tintedNeutrals('#1F1F1F')).toEqual({})
    const r = buildTheme({ brand: '#9D1635', neutrals: 'pure' })
    expect(r.generated['--g-color-text']).toBeUndefined()
    expect(buildTheme({ brand: '#9D1635' }).generated['--g-color-text']).toBeDefined()
    expect(buildTheme({}).generated['--g-color-text']).toBeUndefined()
  })

  it('el oscuro también se tiñe (fondo, superficie y texto)', () => {
    const r = buildTheme({ brand: '#9D1635' })
    for (const k of ['--g-color-bg', '--g-color-surface', '--g-color-surface-sunken', '--g-color-text']) expect(r.dark.generated[k]).toBeDefined()
    expect(r.css).toMatch(/\[data-theme="dark"\][^}]*--g-color-surface:/)
  })
})

describe('categorías', () => {
  it('reparte los tonos por igual con el mismo L y C', () => {
    const b = categoryBases(6, '#9D1635')
    const hs = b.map((h) => lch(h).h)
    for (let i = 1; i < hs.length; i++) expect(hueDiff(hs[i], hs[i - 1])).toBeGreaterThan(50)
    const ls = b.map((h) => lch(h).l)
    expect(Math.max(...ls) - Math.min(...ls)).toBeLessThan(0.05)
  })

  it('emite cat-1..N con sus seis tokens en claro y oscuro, y todos los pares cumplen el contraste', () => {
    const r = buildTheme({ brand: '#9D1635', categories: 5 })
    expect(r.ok).toBe(true)
    for (let k = 1; k <= 5; k++) {
      for (const s of ['', '-strong', '-soft', '-text']) expect(r.generated[`--g-color-cat-${k}${s}`]).toBeDefined()
      expect(r.generated[`--g-color-on-cat-${k}-soft`]).toBeDefined()
      expect(r.dark.generated[`--g-color-cat-${k}-soft`]).toBeDefined()
    }
    expect(r.generated['--g-color-cat-6']).toBeUndefined()
    expect(r.issues.filter((i) => i.severity === 'error')).toEqual([])
    expect(r.issues.some((i) => i.id === 'unknown-token')).toBe(false)
  })

  it('valida la configuración: 0 a 12, entero', () => {
    expect(readConfig({ categories: 13 }).errors).toHaveLength(1)
    expect(readConfig({ categories: 2.5 }).errors).toHaveLength(1)
    expect(readConfig({ categories: 0 }).errors).toHaveLength(0)
    expect(readConfig({ neutrals: 'otro' }).errors).toHaveLength(1)
    expect(readConfig({ name: 'Lustre', neutrals: 'pure' }).errors).toHaveLength(0)
  })
})

describe('hover (strong) en la dirección correcta', () => {
  it('se aleja del fondo de su texto: más oscuro con texto blanco, más claro con texto oscuro, y se nota (ΔL ≥ 0.05)', () => {
    const r = buildTheme({ brand: '#9D1635', accent: '#D85A70' })
    for (const c of ['brand', 'accent']) {
      const base = lch(r.generated[`--g-color-${c}`]), strong = lch(r.generated[`--g-color-${c}-strong`])
      expect(Math.abs(strong.l - base.l)).toBeGreaterThanOrEqual(0.05)
      const on = r.generated[`--g-color-on-${c}`]
      const onLight = lch(on).l > 0.6
      expect(onLight ? strong.l < base.l : strong.l > base.l).toBe(true)
    }
  })
})

describe('tokens.json', () => {
  it('documenta cada token con su valor claro y oscuro, su uso y el contraste medido', () => {
    const r = buildTheme({ name: 'Lustre', brand: '#9D1635', accent: '#D85A70', categories: 2 })
    expect(r.doc.name).toBe('Lustre')
    expect(r.doc.color.themes.map((t) => t.id)).toEqual(['light', 'dark'])
    const t = (n) => r.doc.color.tokens.find((x) => x.name === n)
    expect(t('brand').value).toEqual({ light: '#9D1635', dark: expect.stringMatching(/^#[0-9A-F]{6}$/) })
    expect(t('brand').usage).toMatch(/marca/)
    expect(t('on-brand').contrast.against).toBe('--g-color-brand')
    expect(t('on-brand').contrast.light).toBeGreaterThanOrEqual(4.5)
    expect(t('on-brand').contrast.dark).toBeGreaterThanOrEqual(4.5)
    expect(t('text-muted').contrast.against).toBe('--g-color-surface')
    expect(t('cat-2-soft').usage).toMatch(/categoría 2/)
    expect(r.doc.spacing.tokens.length).toBeGreaterThan(0)
    expect(r.doc.radius.tokens.some((x) => x.cssVar === '--g-radius-md')).toBe(true)
  })

  it('todos los tokens de color tienen un uso (ninguno queda como «Color del tema»)', () => {
    const r = buildTheme({ brand: '#9D1635', categories: 3 })
    expect(r.doc.color.tokens.filter((x) => x.usage === 'Color del tema.').map((x) => x.name)).toEqual([])
    expect(usageOf('on-danger-soft')).toMatch(/fondo suave/)
  })
})

describe('grana theme --doc', () => {
  let dir
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'grana-doc-')) })
  afterEach(() => rmSync(dir, { recursive: true, force: true }))
  const exec = (argv) => { let out = '', err = ''; const code = run(argv, { cwd: dir, out: (s) => (out += s), err: (s) => (err += s) }); return { code, out, err } }

  it('escribe tokens.json junto a tokens.css y cuenta la derivación', () => {
    writeFileSync(join(dir, 'grana.config.json'), JSON.stringify({ brand: '#9D1635', accent: '#D85A70' }))
    const r = exec(['theme', 'grana.config.json', '--doc'])
    expect(r.code).toBe(0)
    expect(r.out).toContain('tokens.json')
    expect(r.out).toContain('«danger» se separó')
    const doc = JSON.parse(readFileSync(join(dir, 'tokens.json'), 'utf8'))
    expect(doc.color.tokens.length).toBeGreaterThan(40)
    const r2 = exec(['theme', 'grana.config.json', '--doc=docs.json', '--out', 'x.css'])
    expect(r2.code).toBe(0)
    expect(JSON.parse(readFileSync(join(dir, 'docs.json'), 'utf8')).meta.source).toBe('@grana/cli')
  })
})
