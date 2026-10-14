// Zona de marca en el CLI (docs/contract/tokens.md §44; DECISIONS.md #620 a #625).
import { describe, it, expect } from 'vitest'
import { buildTheme, generateTheme } from '../src/index.js'
import { deriveZone, guard, mix, ratio, sunkenOf, validateZone, veil, ZONE_SOURCES, GUARDED } from '../src/zone.js'
import { DEFAULTS, DARK } from '../src/defaults.js'
import { pickOn } from '../src/derive.js'
import { parseHex, toHex } from '../src/color.js'

const c = (n) => `--g-color-${n}`
const SEM = { success: DEFAULTS[c('success')], warning: DEFAULTS[c('warning')], danger: DEFAULTS[c('danger')], info: DEFAULTS[c('info')] }

// tokens.md §44.8: Z / I · muted · accent (estado) · veil / accent-veil · success · warning · danger · info
const REFERENCE = [
  { name: 'Defecto', config: {}, row: ['#1F1F1F', '#FFFFFF', '#D2D2D2', '#4D96FF', 'adjusted', '#454545', '#2A3546', '#52A871', '#C28B43', '#FA664F', '#4D96FF'] },
  { name: 'NisaNabani', config: { brand: '#24366B', accent: '#C1D324' }, row: ['#24366B', '#FFFFFF', '#D3D8E4', '#C1D324', 'kept', '#4A5C88', '#3D566D', '#72C88F', '#E3AA63', '#FF9D8C', '#88B9FF'] },
  { name: 'Hallazgo 15', config: { brand: '#0B1F4D', accent: '#0F766E' }, row: ['#0B1F4D', '#FFFFFF', '#CDD3DE', '#4FA79E', 'adjusted', '#35486F', '#14395E', '#56AB74', '#C58E46', '#FD6952', '#549AFF'] },
  { name: 'Marca pálida', config: { brand: '#F5B940', accent: '#5B3FE0' }, row: ['#F5B940', '#17151A', '#382F26', '#4618C1', 'adjusted', '#C3953E', '#CBA275', '#004F27', '#633D00', '#8E0E00', '#004393'] }
]
const asRow = (t) => [c('brand-zone'), c('on-brand-zone'), c('on-brand-muted'), c('on-brand-accent'), null, c('on-brand-veil'), c('on-brand-accent-veil'), ...['success', 'warning', 'danger', 'info'].map((s) => c(`on-brand-${s}`))].map((k) => (k ? t[k] : null))

describe('zona · valores de referencia (§44.8)', () => {
  for (const { name, config, row } of REFERENCE) {
    it(`${name}: reproduce la tabla en claro y en oscuro (marca profunda, el mismo valor)`, () => {
      const r = buildTheme(config)
      expect(r.ok).toBe(true)
      const expected = row.map((v, i) => (i === 4 ? null : v))
      expect(asRow(r.tokens)).toEqual(expected)
      expect(asRow(r.dark.tokens)).toEqual(expected)
      expect(r.doc.color.tokens.find((t) => t.name === 'on-brand-accent').zone).toBe(row[4])
    })
  }

  it('el tema por defecto coincide con las fuentes de defaults.css (claro y oscuro) y no emite nada', () => {
    const r = generateTheme({})
    for (const k of ZONE_SOURCES) {
      expect(r.tokens[k], k).toBe(DEFAULTS[k])
      expect(r.dark.tokens[k], k).toBe(DARK[k])
      expect(k in r.generated, k).toBe(false)
      expect(k in r.dark.generated, k).toBe(false)
    }
    expect(r.zoneBlock).toBeNull()
  })
})

describe('zona · regla de guarda (§44.3)', () => {
  const zoneOf = (Z) => ({ Z, I: toHex(pickOn(parseHex(Z))) })

  it('kept: el acento del lado de la tinta y con 4,5:1 se queda (lima sobre navy, 6,95:1)', () => {
    const { Z, I } = zoneOf('#24366B')
    const g = guard('#C1D324', Z, I)
    expect(g).toEqual({ state: 'kept', value: '#C1D324', input: '#C1D324' })
    expect(ratio('#C1D324', Z)).toBeCloseTo(6.95, 2)
  })

  it('adjusted: solo mueve L hacia la tinta con el mismo tono', () => {
    const { Z, I } = zoneOf('#1F1F1F')
    expect(guard('#0B63CE', Z, I)).toEqual({ state: 'adjusted', value: '#4D96FF', input: '#0B63CE' })
  })

  it('lost: lima sobre la marca clara del oscuro (#768ECA) habría cumplido irreconocible: vale la tinta y dice cuál', () => {
    const { Z, I } = zoneOf('#768ECA')
    const g = guard('#C1D324', Z, I)
    expect(g.state).toBe('lost')
    expect(g.value).toBe(I)
    expect(g.moved).toMatch(/^#[0-9A-F]{6}$/)
    expect(ratio(g.moved, Z)).toBeGreaterThanOrEqual(4.5)
  })

  it('fallback: si ninguna L llega (marca de tono medio, la tinta apenas cumple), vale la tinta', () => {
    const { Z, I } = zoneOf('#E80E5D')
    const g = guard('#0B63CE', Z, I)
    expect(g.state).toBe('fallback')
    expect(g.value).toBe(I)
    expect(g.moved).toBeUndefined()
  })

  it('un color del lado contrario nunca es kept aunque tenga 4,5:1', () => {
    // #767676 con tinta blanca (4,54:1): el negro da 4,6:1 pero está del otro lado
    const g = guard('#000000', '#767676', '#FFFFFF', '#767676')
    expect(g.state).not.toBe('kept')
  })
})

describe('zona · regla «soft» y hundido (§44.4, §44.2)', () => {
  it('el velo es la marca con un 20 % de tinta cuando la tinta cumple encima', () => {
    expect(veil('#24366B', '#FFFFFF', '#FFFFFF')).toEqual({ value: mix('#24366B', '#FFFFFF', 0.2), share: 20 })
  })

  it('baja del 20 % hasta que la tinta dé 4,5:1; en 0 es la marca', () => {
    const v = veil('#768ECA', '#17151A', '#17151A')
    expect(v.share).toBe(12)
    expect(ratio('#17151A', v.value)).toBeGreaterThanOrEqual(4.5)
    expect(veil('#E80E5D', '#FFFFFF', '#FFFFFF')).toEqual({ value: '#E80E5D', share: 0 })
  })

  it('el hundido máximo es un 8 % de tinta; si la tinta no llega encima, baja (hueco del contrato, zone-sunken-limited)', () => {
    expect(sunkenOf('#24366B', '#FFFFFF')).toEqual({ value: mix('#24366B', '#FFFFFF', 0.08), share: 8 })
    const s = sunkenOf('#C36B3F', toHex(pickOn(parseHex('#C36B3F'))))
    expect(s.share).toBeLessThan(8)
    const r = buildTheme({ brand: '#C36B3F' })
    expect(r.ok).toBe(true)
    expect(r.diagnostics.find((d) => d.code === 'zone-sunken-limited')).toMatchObject({ status: 'warning', share: s.share })
  })
})

describe('zona · CSS (§44.6)', () => {
  it('las diez fuentes van en los tres bloques con el mismo valor; zone-edge no lo emite el CLI', () => {
    const r = buildTheme({ brand: '#0B1F4D', accent: '#0F766E' })
    const blocks = r.css.split(/\n(?=@media|\[data-theme="dark"\]|\[data-g-zone)/)
    const light = blocks.find((b) => b.includes(':root,')), media = blocks.find((b) => b.startsWith('@media')), dark = blocks.find((b) => b.startsWith('[data-theme="dark"]'))
    for (const k of ZONE_SOURCES) {
      const line = `${k}: ${r.tokens[k]};`
      for (const b of [light, media, dark]) expect(b, `${k}`).toContain(line)
    }
    expect(r.css).not.toContain('--g-color-zone-edge')
    expect(r.css).not.toContain('[data-g-zone')
  })

  it('zona clara (marca pálida): bloque [data-g-zone="brand"] sin capa con color-scheme: light', () => {
    const r = buildTheme({ brand: '#F5B940', accent: '#5B3FE0' })
    expect(r.css).toMatch(/\[data-g-zone="brand"\] \{\n {2}color-scheme: light;\n\}/)
    expect(r.css).not.toMatch(/@layer\s+[\w.]+\s*[{;]/)
  })

  it('con categorías, cat-k-text = la tinta dentro de la zona', () => {
    const r = buildTheme({ brand: '#24366B', categories: 3 })
    expect(r.zoneBlock).toEqual({ [c('cat-1-text')]: 'var(--g-color-on-brand-zone)', [c('cat-2-text')]: 'var(--g-color-on-brand-zone)', [c('cat-3-text')]: 'var(--g-color-on-brand-zone)' })
    expect(r.css).toContain('[data-g-zone="brand"] {\n  --g-color-cat-1-text: var(--g-color-on-brand-zone);')
    expect(r.css).not.toMatch(/\[data-g-zone="brand"\] \{[^}]*color-scheme/)
  })

  it('overrides de una fuente vale en claro y en oscuro; dark.overrides solo en el oscuro', () => {
    const both = generateTheme({ brand: '#24366B', accent: '#C1D324', overrides: { [c('on-brand-accent')]: '#D7E85A' } })
    expect(both.tokens[c('on-brand-accent')]).toBe('#D7E85A')
    expect(both.dark.tokens[c('on-brand-accent')]).toBe('#D7E85A')
    expect(both.dark.generated[c('on-brand-accent')]).toBe('#D7E85A')
    const dk = generateTheme({ brand: '#24366B', accent: '#C1D324', dark: { overrides: { [c('on-brand-accent')]: '#D7E85A' } } })
    expect(dk.tokens[c('on-brand-accent')]).toBe('#C1D324')
    expect(dk.dark.tokens[c('on-brand-accent')]).toBe('#D7E85A')
  })

  it('dark.overrides de la marca de la zona re-deriva el resto solo en el oscuro', () => {
    const r = buildTheme({ brand: '#24366B', accent: '#C1D324', dark: { overrides: { [c('brand-zone')]: '#0B1F4D' } } })
    expect(r.ok).toBe(true)
    expect(r.tokens[c('brand-zone')]).toBe('#24366B')
    expect(r.dark.tokens[c('brand-zone')]).toBe('#0B1F4D')
    expect(r.dark.tokens[c('on-brand-muted')]).toBe('#CDD3DE')
  })

  it('dark: false: las fuentes van en el claro (y en el claro repetido de la consulta oscura)', () => {
    const r = buildTheme({ brand: '#0B1F4D', dark: false })
    expect(r.ok).toBe(true)
    expect(r.css.match(/--g-color-on-brand-muted: #CDD3DE;/g)).toHaveLength(2)
  })
})

describe('zona · validación (§44.7)', () => {
  it('un overrides que no cumple es error y el tema no se emite', () => {
    const r = buildTheme({ brand: '#24366B', overrides: { [c('on-brand-accent')]: '#3B4F86' } })
    expect(r.ok).toBe(false)
    expect(r.css).toBeNull()
    const e = r.issues.filter((i) => i.id === 'zone-contrast')
    expect(e.length).toBeGreaterThan(0)
    expect(e.every((i) => i.severity === 'error')).toBe(true)
    expect(e.some((i) => i.scheme === 'dark')).toBe(true)
  })

  it('la tinta sobre un velo fijado a mano también se valida', () => {
    const r = buildTheme({ brand: '#24366B', overrides: { [c('on-brand-veil')]: '#C9D1E8' } })
    expect(r.ok).toBe(false)
    expect(r.issues.find((i) => i.id === 'zone-contrast' && i.tokens.includes(c('on-brand-veil')))).toBeTruthy()
  })

  it('un acento fijado del lado contrario a la tinta es error aunque tenga 4,5:1', () => {
    const r = buildTheme({ brand: '#767676', overrides: { [c('on-brand-accent')]: '#000000' } })
    expect(r.issues.find((i) => i.id === 'zone-side' && i.tokens[0] === c('on-brand-accent'))).toMatchObject({ severity: 'error' })
  })

  it('dark.overrides que rompe la zona solo en el oscuro es error del oscuro', () => {
    const r = buildTheme({ brand: '#24366B', dark: { overrides: { [c('on-brand-zone')]: '#3B4F86' } } })
    expect(r.ok).toBe(false)
    expect(r.issues.filter((i) => i.id === 'zone-contrast').every((i) => i.scheme === 'dark')).toBe(true)
  })
})

describe('zona · tokens.json y diagnósticos (§44.7)', () => {
  it('cada fuente es reference, con source, value, usage y contraste contra la zona', () => {
    const { doc } = buildTheme({ brand: '#0B1F4D', accent: '#0F766E' })
    const by = Object.fromEntries(doc.color.tokens.map((t) => [t.name, t]))
    for (const k of ZONE_SOURCES) {
      const t = by[k.slice('--g-color-'.length)]
      expect(t, k).toBeTruthy()
      expect(t.level).toBe('reference')
      expect(t.value.light).toBe(t.value.dark)
      expect(t.usage.length).toBeGreaterThan(10)
      expect(t.source).toBeTruthy()
      expect(t.status).toBe('derived')
    }
    expect(by['brand-zone'].source).toBe('brand')
    expect(by['on-brand-zone'].source).toBe('on-brand')
    expect(by['on-brand-accent'].source).toBe('accent')
    expect(by['on-brand-danger'].source).toBe('danger')
    expect(by['on-brand-muted'].contrast).toMatchObject({ against: c('brand-zone') })
    expect(by['on-brand-veil'].contrast).toMatchObject({ against: c('on-brand-veil'), foreground: c('on-brand-zone') })
    expect(by['on-brand-accent']).toMatchObject({ zone: 'adjusted', input: '#0F766E' })
    for (const s of ['success', 'warning', 'danger', 'info']) expect(by[`on-brand-${s}`].zone).toBe('adjusted')
    expect(by['zone-edge']).toMatchObject({ level: 'reference', source: 'border-strong' })
    expect(by['zone-edge'].zone).toBeUndefined()
  })

  it('lost: tokens.json da input y moved; el diagnóstico es aviso y dice qué color habría cumplido', () => {
    const r = buildTheme({ brand: '#768ECA', accent: '#C1D324' })
    expect(r.ok).toBe(true)
    const t = r.doc.color.tokens.find((x) => x.name === 'on-brand-accent')
    expect(t).toMatchObject({ zone: 'lost', input: '#C1D324', value: { light: '#17151A' } })
    expect(t.moved).toMatch(/^#/)
    const d = r.doc.diagnostics.find((x) => x.code === 'zone-accent-lost')
    expect(d).toMatchObject({ status: 'warning', moved: t.moved })
    expect(d.message).toContain(t.moved)
  })

  it('adjusted es informativo; fallback, aviso; zone-veil-flat, informativo; ninguno bloquea', () => {
    const adj = buildTheme({ brand: '#0B1F4D', accent: '#0F766E' })
    expect(adj.diagnostics.find((d) => d.code === 'zone-accent-adjusted')).toMatchObject({ status: 'informative', input: '#0F766E', value: '#4FA79E' })
    expect(adj.diagnostics.find((d) => d.code === 'zone-danger-adjusted')).toBeTruthy()
    const fb = buildTheme({ brand: '#E80E5D' })
    expect(fb.ok).toBe(true)
    expect(fb.diagnostics.find((d) => d.code === 'zone-accent-fallback')).toMatchObject({ status: 'warning' })
    expect(fb.diagnostics.find((d) => d.code === 'zone-veil-flat')).toMatchObject({ status: 'informative', share: 0 })
    expect(fb.doc.diagnostics.some((d) => d.code === 'zone-accent-fallback')).toBe(true)
  })

  it('kept no da diagnóstico; un overrides tampoco (es del usuario) y en tokens.json es override sin estado', () => {
    const k = buildTheme({ brand: '#24366B', accent: '#C1D324' })
    expect(k.diagnostics.some((d) => d.code.startsWith('zone-accent'))).toBe(false)
    const o = buildTheme({ brand: '#0B1F4D', accent: '#0F766E', overrides: { [c('on-brand-accent')]: '#7FD1C8' } })
    expect(o.ok).toBe(true)
    expect(o.diagnostics.some((d) => d.code.startsWith('zone-accent'))).toBe(false)
    const t = o.doc.color.tokens.find((x) => x.name === 'on-brand-accent')
    expect(t.status).toBe('override')
    expect(t.zone).toBeUndefined()
  })
})

describe('zona · 2000 temas aleatorios', () => {
  // Generador determinista (Park-Miller): los mismos 2000 temas en cada ejecución
  let seed = 20261013
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  const hex = () => toHex([0, 0, 0].map(() => Math.floor(rnd() * 256)))

  it('ninguna derivación deja un par de §44.7 bajo el mínimo, y los cuatro estados aparecen', () => {
    const states = { kept: 0, adjusted: 0, fallback: 0, lost: 0 }
    const failures = []
    for (let i = 0; i < 2000; i++) {
      const brand = hex()
      const onBrand = toHex(pickOn(parseHex(brand)))
      // El CLI ya rechaza la marca cuyo par on-brand no llega a 4,5:1 (on-solid): no es una zona posible
      if (ratio(onBrand, brand) < 4.5) continue
      const input = { brand, onBrand, accent: hex(), ...(rnd() < 0.5 ? SEM : { success: hex(), warning: hex(), danger: hex(), info: hex() }) }
      const z = deriveZone(input)
      for (const g of GUARDED) states[z.guarded[g].state]++
      const issues = validateZone(z.tokens).filter((x) => x.severity === 'error')
      if (issues.length) failures.push({ input, issues: issues.map((x) => x.message) })
    }
    expect(failures).toEqual([])
    for (const s of Object.keys(states)) expect(states[s], s).toBeGreaterThan(0)
  }, 300000)

  it('con el CLI completo (200 temas): ningún tema válido sin zona falla por la zona', () => {
    let checked = 0
    for (let i = 0; i < 200; i++) {
      const r = buildTheme({ brand: hex(), ...(rnd() < 0.7 ? { accent: hex() } : {}) })
      if (r.issues.some((x) => x.severity === 'error' && !x.id.startsWith('zone'))) continue
      checked++
      expect(r.issues.filter((x) => x.id.startsWith('zone') && x.severity === 'error'), JSON.stringify(r.tokens[c('brand')])).toEqual([])
      for (const k of ZONE_SOURCES) expect(r.dark.tokens[k]).toBe(r.tokens[k])
    }
    expect(checked).toBeGreaterThan(100)
  }, 120000)
})
