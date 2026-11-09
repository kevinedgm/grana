// Garantía de `{familia}-text` (docs/contract/tokens.md §2 «Garantía de `{familia}-text`», DECISIONS.md #1074, cierra #1072):
// todo `-text` ≥ 4.5:1 contra `surface`, `surface-sunken` y `bg`, en claro y en oscuro, en todas las familias.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { buildTheme, generateTheme, deriveColor, contrast, parseHex, toHex, toOklch, DEFAULTS, DARK } from '../src/index.js'

const BG = ['--g-color-surface', '--g-color-surface-sunken', '--g-color-bg']
const resolve = (t, v, d = 0) => { const m = /^var\((--[a-z0-9-]+)\)$/.exec(String(v ?? '').trim()); return m && d < 8 ? resolve(t, t[m[1]], d + 1) : v }
const isFamilyText = (k) => /^--g-color-[a-z0-9-]+-text$/.test(k) && !/^--g-color-(text|on-)/.test(k)
// Fallos `-text` / fondo de un tema completo
const failures = (tokens) => {
  const out = []
  for (const k of Object.keys(tokens).filter(isFamilyText)) {
    const fg = parseHex(resolve(tokens, tokens[k]))
    if (!fg) continue
    for (const b of BG) {
      const bg = parseHex(resolve(tokens, tokens[b]))
      const r = contrast(fg, bg)
      if (r + 1e-9 < 4.5) out.push(`${k} / ${b}: ${r.toFixed(2)}`)
    }
  }
  return out
}

describe('garantía de {familia}-text (#1074)', () => {
  it('2000 temas aleatorios (brand, accent, primary, categorías): 0 fallos contra los tres fondos, claro y oscuro', () => {
    let seed = 20261109
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
    const hex = () => toHex([0, 0, 0].map(() => Math.floor(rnd() * 256)))
    const bad = []
    for (let i = 0; i < 2000; i++) {
      const cfg = { brand: hex(), ...(rnd() < 0.7 ? { accent: hex() } : {}), ...(rnd() < 0.3 ? { categories: 1 + Math.floor(rnd() * 12) } : {}), ...(rnd() < 0.3 ? { primary: hex() } : {}) }
      const r = buildTheme(cfg)
      const f = [...failures(r.tokens).map((x) => `claro ${x}`), ...failures(r.dark.tokens).map((x) => `oscuro ${x}`)]
      const errs = r.issues.filter((x) => x.id === 'color-text')
      if (f.length || errs.length) bad.push({ cfg, f, errs: errs.map((x) => x.message) })
    }
    expect(bad.slice(0, 5)).toEqual([])
  }, 120000)

  describe('los 11 temas de Dark Color Presence', () => {
    const dir = fileURLToPath(new URL('../../../design/lab/tema-oscuro/dark-color-presence/themes/', import.meta.url))
    const themes = readdirSync(dir).filter((f) => f.endsWith('.json'))
    it('son 11', () => expect(themes).toHaveLength(11))
    for (const f of themes) {
      it(`${f.replace('.json', '')}: todos los -text ≥ 4.5:1 contra los tres fondos y ΔL ≤ 0,03 frente a la regla anterior`, () => {
        const r = buildTheme(JSON.parse(readFileSync(dir + f, 'utf8')))
        expect(r.ok).toBe(true)
        expect(failures(r.tokens)).toEqual([])
        expect(failures(r.dark.tokens)).toEqual([])
        for (const s of r.notes.filter((n) => n.code === 'color-text-shift')) expect(Math.abs(s.dl), `${s.scheme} ${s.token}`).toBeLessThanOrEqual(0.03)
        // cada desplazamiento informado es el valor emitido, y su ΔL es el real
        for (const [scheme, tokens] of [['light', r.tokens], ['dark', r.dark.tokens]]) {
          for (const s of r.notes.filter((n) => n.code === 'color-text-shift' && n.scheme === scheme)) {
            expect(tokens[s.cssVar]).toBe(s.value)
            expect(toOklch(parseHex(s.value)).l - toOklch(parseHex(s.from)).l).toBeCloseTo(s.dl, 2)
          }
        }
      })
    }
    it('apple: accent-text #0072EE → #006CE3 (ΔL −0,02, por surface-sunken), y la base del acento no cambia', () => {
      const r = buildTheme(JSON.parse(readFileSync(dir + 'apple.json', 'utf8')))
      expect(r.tokens['--g-color-accent-text']).toBe('#006CE3')
      expect(r.tokens['--g-color-accent']).toBe('#007AFF')
      const s = r.notes.find((n) => n.code === 'color-text-shift' && n.token === 'accent-text' && n.scheme === 'light')
      expect(s).toMatchObject({ severity: 'info', from: '#0072EE', value: '#006CE3', against: '--g-color-surface-sunken' })
      expect(s.dl).toBeCloseTo(-0.02, 2)
      expect(s.message).toMatch(/surface-sunken/)
    })
  })

  describe('tema por defecto: Δ0', () => {
    it('buildTheme({}) no genera colores, no mueve ningún -text y cumple en claro y oscuro', () => {
      const r = buildTheme({})
      expect(r.ok).toBe(true)
      expect(r.generated).toEqual({})
      expect(r.dark.generated).toEqual({})
      expect(r.derived.textShifts).toEqual([])
      expect([...r.derived.textAdjusted]).toEqual([])
      expect(failures(DEFAULTS)).toEqual([])
      expect(failures({ ...DEFAULTS, ...DARK })).toEqual([])
    })
    it('la derivación de los colores por defecto contra sus tres fondos da el mismo -text que defaults.js', () => {
      const light = { surface: DEFAULTS['--g-color-surface'], surfaceSunken: DEFAULTS['--g-color-surface-sunken'], bg: DEFAULTS['--g-color-bg'] }
      for (const c of ['brand', 'accent']) expect(deriveColor(DEFAULTS[`--g-color-${c}`], light).text).toBe(DEFAULTS[`--g-color-${c}-text`])
    })
  })

  describe('overrides', () => {
    // Fondo hundido más oscuro que el por defecto, con los neutros que lo acompañan para que el tema sea válido
    const sunken = { '--g-color-surface-sunken': '#EBEBEB', '--g-color-text-subtle': '#666666', '--g-color-border-control': '#7A7A7A' }
    it('un -text fijado a mano no se toca y, si no llega, da error color-text con el fondo en el mensaje', () => {
      const r = buildTheme({ overrides: { ...sunken, '--g-color-danger-text': '#D2402D' } })
      expect(r.generated['--g-color-danger-text']).toBe('#D2402D')
      expect(r.tokens['--g-color-danger-text']).toBe('#D2402D')
      const e = r.issues.filter((i) => i.id === 'color-text' && i.tokens[0] === '--g-color-danger-text')
      expect(e.length).toBeGreaterThan(0)
      expect(e.map((i) => i.against)).toContain('--g-color-surface-sunken')
      expect(e.find((i) => i.against === '--g-color-surface-sunken').message).toMatch(/«danger» sobre «surface-sunken» necesita 4.5:1/)
      expect(r.ok).toBe(false)
      expect(r.notes.filter((n) => n.code === 'color-text-shift' && n.token === 'danger-text')).toEqual([])
    })
    it('un -text de overrides de una familia derivada tampoco se toca ni se informa como desplazado', () => {
      const r = buildTheme({ brand: '#1DB954', overrides: { '--g-color-brand-text': '#0F7A3A' } })
      expect(r.tokens['--g-color-brand-text']).toBe('#0F7A3A')
      expect(r.notes.filter((n) => n.code === 'color-text-shift' && n.token === 'brand-text' && n.scheme === 'light')).toEqual([])
    })
    it('una familia no emitida solo aparece si su -text no cumple contra los fondos resueltos (status «adjusted»)', () => {
      const r = buildTheme({ overrides: sunken })
      expect(r.ok).toBe(true)
      // #6B6B6B (neutral) y #1E7A46 (success) caen a 4,27 y 4,28:1 sobre #EBEBEB: se emiten ajustados
      expect(Object.keys(r.generated).filter(isFamilyText).sort()).toEqual(['--g-color-neutral-text', '--g-color-success-text'])
      // los demás no se emiten (Δ0)
      for (const f of ['brand', 'accent', 'warning', 'danger', 'info']) expect(r.generated[`--g-color-${f}-text`]).toBeUndefined()
      expect(failures(r.tokens)).toEqual([])
      const doc = r.doc.color.tokens
      expect(doc.find((t) => t.name === 'neutral-text').status).toBe('adjusted')
      expect(doc.find((t) => t.name === 'success-text').status).toBe('adjusted')
      expect(doc.find((t) => t.name === 'danger-text').status).toBe('default')
      // solo cambia `-text`: la base y el resto de la familia siguen siendo los del tema por defecto
      for (const k of ['--g-color-success', '--g-color-success-strong', '--g-color-success-soft', '--g-color-on-success', '--g-color-on-success-soft']) expect(r.generated[k]).toBeUndefined()
    })
    it('en oscuro, una familia no emitida se ajusta contra la superficie oscura teñida (el danger-text fijo de #1074)', () => {
      // Caso de la muestra de lima: el danger-text oscuro #E4523D sobre una superficie teñida daba 4,49:1
      let found = null
      let seed = 20261109
      const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
      const hex = () => toHex([0, 0, 0].map(() => Math.floor(rnd() * 256)))
      for (let i = 0; i < 2000 && !found; i++) {
        const cfg = { brand: hex() }
        const g = generateTheme(cfg)
        if (g.dark.generated['--g-color-danger-text'] && g.dark.generated['--g-color-danger-text'] !== DARK['--g-color-danger-text']) found = { cfg, g }
      }
      expect(found).not.toBeNull()
      const { g } = found
      expect(g.generated['--g-color-danger-text']).toBeUndefined()
      expect(g.derived.textAdjusted.has('--g-color-danger-text')).toBe(true)
      expect(failures(g.dark.tokens)).toEqual([])
      const s = g.derived.textShifts.find((t) => t.family === 'danger' && t.scheme === 'dark')
      expect(s).toMatchObject({ from: DARK['--g-color-danger-text'], against: 'surface' })
      expect(s.dl).toBeGreaterThan(0)
    })
  })

  describe('tokens.json', () => {
    it('contrast sigue contra surface y añade contrast.min con el peor de los tres fondos por esquema', () => {
      const dir = fileURLToPath(new URL('../../../design/lab/tema-oscuro/dark-color-presence/themes/', import.meta.url))
      const r = buildTheme(JSON.parse(readFileSync(dir + 'apple.json', 'utf8')))
      const t = r.doc.color.tokens.find((x) => x.name === 'accent-text')
      expect(t.contrast.against).toBe('--g-color-surface')
      expect(t.contrast.min.light).toEqual({ against: '--g-color-surface-sunken', ratio: expect.any(Number) })
      expect(t.contrast.min.light.ratio).toBeGreaterThanOrEqual(4.5)
      expect(t.contrast.min.dark.ratio).toBeGreaterThanOrEqual(4.5)
      expect(t.contrast.light).toBeGreaterThanOrEqual(t.contrast.min.light.ratio)
      expect(t.usage).toMatch(/superficie, el fondo y la superficie hundida/)
      expect(r.doc.diagnostics.some((d) => d.code === 'color-text-shift' && d.token === 'accent-text')).toBe(true)
      // los demás tokens con contraste no llevan min
      expect(r.doc.color.tokens.find((x) => x.name === 'on-accent').contrast.min).toBeUndefined()
      expect(r.doc.color.tokens.find((x) => x.name === 'text').contrast.min).toBeUndefined()
    })
  })
})
