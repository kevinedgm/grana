// Separación de semánticos en oscuro (opción B): el semántico hace su propia búsqueda sobre su variante oscura
// (tono ±45° y L ±0.15 desde su color por defecto, croma conservado). Los casos encajonados entre marca y acento
// quedan con aviso como límite documentado, y la nota `semantic-adjusted` lo dice.
import { describe, expect, it } from 'vitest'
import { buildTheme, contrast, distance, generateTheme, parseHex, readConfig, toOklch, MIN_DISTANCE } from '../src/index.js'

const lch = (h) => toOklch(parseHex(h))
const SEM = ['danger', 'warning', 'success', 'info']

const collisions = (cfg) => buildTheme({ ...cfg, semanticCollision: 'adjust' }).issues.filter((i) => i.id === 'semantic-close' || i.id === 'semantic-adjusted')

describe('semanticCollision "adjust" en oscuro', () => {
  const fixed = [
    { brand: '#A3123A', accent: '#2F6A3D', radius: 8 },
    { brand: '#2F6A3D', accent: '#A3123A', radius: 6 },
    { brand: '#1D1517', accent: '#2F6A3D', neutrals: 'pure', radius: 2, fontSize: 14 }
  ]
  for (const cfg of fixed) {
    it(`sin avisos de colisión en claro ni en oscuro: ${cfg.brand} + ${cfg.accent}`, () => {
      expect(collisions(cfg).map((i) => i.message)).toEqual([])
    })
  }

  it('el tono del oscuro puede diferir del claro: success lleva su propia base oscura', () => {
    const r = buildTheme({ ...fixed[0], semanticCollision: 'adjust' })
    expect(r.ok).toBe(true)
    expect(r.derived.semantic.success.darkHex).toMatch(/^#[0-9A-F]{6}$/i)
    expect(r.dark.tokens['--g-color-success']).not.toBe(r.tokens['--g-color-success'])
  })

  it('Stripe (info encajonado entre marca y acento): sigue con aviso y la nota es honesta', () => {
    const cfg = { brand: '#635BFF', accent: '#00AFC7', radius: 10 }
    expect(collisions(cfg).length).toBeGreaterThan(0)
    const r = buildTheme({ ...cfg, semanticCollision: 'adjust' })
    const note = r.diagnostics.find((d) => d.code === 'semantic-adjusted' && d.token === 'info')
    expect(note.ok).toBe(false)
    expect(note.message).toMatch(/se acercó/)
    expect(note.message).toMatch(/no llega al mínimo/)
    expect(note.message).not.toMatch(/se separó/)
    expect(note.message).toMatch(/mínimo de 0\.12/)
    expect(note.scheme).toBe('dark')
    // llega como aviso, no como nota; y sustituye al semantic-close de ese token
    expect(r.notes.some((n) => n.code === 'semantic-adjusted' && n.token === 'info')).toBe(false)
    const w = r.issues.filter((i) => i.id === 'semantic-adjusted')
    expect(w).toHaveLength(1)
    expect(w[0]).toMatchObject({ severity: 'warning', scheme: 'dark' })
    expect(w[0].message).toMatch(/^\[oscuro\] «info» se acercó a la marca \(de 0\.073 a 0\.11\d*\) pero no llega al mínimo de 0\.12/)
    expect(r.issues.some((i) => i.id === 'semantic-close' && i.tokens[0] === '--g-color-info')).toBe(false)
  })

  it('una separación lograda sigue diciendo «se separó»', () => {
    const r = buildTheme({ ...fixed[0], semanticCollision: 'adjust' })
    for (const d of r.diagnostics.filter((x) => x.code === 'semantic-adjusted')) {
      expect(d.ok).toBe(true)
      expect(d.message).toMatch(/se separó/)
    }
  })

  it('sin colisión no cambia nada: el tema por defecto y una marca lejana no emiten semánticos', () => {
    const def = generateTheme(readConfig({}).config)
    expect(def.generated).toEqual({})
    const far = generateTheme(readConfig({ brand: '#0B1F4D', accent: '#6D28D9', semanticCollision: 'adjust' }).config)
    expect(Object.keys(far.derived.semantic)).toEqual([])
  })

  it('1000 temas al azar: el oscuro avisa solo en los huecos y todo aviso que queda es honesto (ok: false)', () => {
    let s = 7
    const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648 }
    const hex = () => '#' + Array.from({ length: 3 }, () => Math.floor(rnd() * 256).toString(16).padStart(2, '0')).join('')
    let dark = 0, total = 0
    for (let i = 0; i < 1000; i++) {
      const cfg = { brand: hex() }
      if (rnd() < 0.7) cfg.accent = hex()
      const r = buildTheme({ ...cfg, semanticCollision: 'adjust' })
      if (!r.ok) continue
      total++
      const d = r.issues.filter((x) => (x.id === 'semantic-close' || x.id === 'semantic-adjusted') && x.scheme === 'dark')
      dark += d.length ? 1 : 0
      // todo aviso que quede corresponde a una nota honesta (ok: false)
      for (const x of r.issues.filter((y) => y.id === 'semantic-close' || y.id === 'semantic-adjusted')) {
        const tok = x.tokens[0].replace('--g-color-', '')
        expect(r.diagnostics.find((n) => n.code === 'semantic-adjusted' && n.token === tok)?.ok, `${JSON.stringify(cfg)} ${x.message}`).toBe(false)
      }
    }
    expect(total).toBe(863) // los otros 137 temas al azar fallan por errores ajenos (on-solid, zone-contrast…)
    expect(dark).toBeLessThanOrEqual(10) // antes de #1077: 120
  }, 120000)

  // ok: true → en los tokens emitidos, ≥ 0.12 contra marca y acento y ≥ 0.09 contra los demás semánticos, en los dos esquemas
  const measured = (tokens, name) => {
    const c = lch(tokens[`--g-color-${name}`])
    const a = Math.min(...['brand', 'accent', 'primary'].map((k) => tokens[`--g-color-${k}`]).filter((h) => /^#/.test(h ?? '')).map((h) => distance(c, lch(h))))
    const s = Math.min(...SEM.filter((n) => n !== name).map((n) => distance(c, lch(tokens[`--g-color-${n}`]))))
    return { a, s }
  }
  for (const cfg of [...fixed, { brand: '#9D1635', accent: '#D85A70' }, { brand: '#E5483A' }]) {
    it(`ok: true cumple los umbrales y {familia}-text ≥ 4.5:1 en claro y oscuro: ${JSON.stringify(cfg)}`, () => {
      const r = buildTheme({ ...cfg, semanticCollision: 'adjust' })
      expect(r.ok).toBe(true)
      for (const [name, adj] of Object.entries(r.derived.semantic)) {
        if (!adj.ok) continue
        for (const t of [r.tokens, r.dark.tokens]) {
          const m = measured(t, name)
          expect(m.a).toBeGreaterThanOrEqual(MIN_DISTANCE - 0.0005)
          expect(m.s).toBeGreaterThanOrEqual(0.09 - 0.0005)
          for (const bg of ['surface', 'surface-sunken', 'bg']) expect(contrast(parseHex(t[`--g-color-${name}-text`]), parseHex(t[`--g-color-${bg}`]))).toBeGreaterThanOrEqual(4.5)
        }
      }
    })
  }

  it('determinista: la misma configuración da el mismo CSS', () => {
    const cfg = { brand: '#A3123A', accent: '#2F6A3D', semanticCollision: 'adjust' }
    expect(buildTheme(cfg).css).toBe(buildTheme(cfg).css)
  })

  it('con «warn» el oscuro no cambia: no se emite el semántico y el aviso lleva la alternativa', () => {
    const r = buildTheme({ brand: '#A3123A', accent: '#2F6A3D' })
    expect(r.dark.generated['--g-color-success']).toBeUndefined()
    expect(r.derived.semantic.success.darkHex).toBeUndefined()
    expect(r.issues.some((i) => i.id === 'semantic-close' && /Alternativa calculada/.test(i.message))).toBe(true)
  })
})
