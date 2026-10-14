// Ranuras del item actual de GSidebar en el CLI (tokens.md §43; DECISIONS.md #613 y #614): diagnóstico informativo de
// P1 a P3 en claro y oscuro y derivación del oscuro con el respaldo on-{f}-soft. Caso real: NisaNabani (marino + lima).
import { describe, it, expect } from 'vitest'
import { buildTheme, measureSidebarPairs, DEFAULTS, DARK, isColorGroup } from '../src/index.js'

const SLOTS = ['--g-sidebar-current', '--g-sidebar-on-current', '--g-sidebar-current-edge']
const NISA = { brand: '#24366B', accent: '#C1D324' }
const ROLES = { '--g-sidebar-current': 'var(--g-color-primary)', '--g-sidebar-on-current': 'var(--g-color-accent)' }
const sc = (r) => r.diagnostics.filter((d) => d.code.startsWith('sidebar-current'))
const darkSlots = (r) => Object.fromEntries(Object.entries(r.dark.generated).filter(([k]) => SLOTS.includes(k)))
const pair = (pairs, id) => pairs.find((p) => p.id === id)

describe('ranuras del item actual (--g-sidebar-current*) en el CLI', () => {
  it('son tokens de Grana del grupo de color: overrides no las marca como unknown-token y van a los bloques claro y oscuro', () => {
    for (const k of SLOTS) {
      expect(k in DEFAULTS, k).toBe(true)
      expect(k in DARK, k).toBe(true)
      expect(isColorGroup(k), k).toBe(true)
    }
    const r = buildTheme({ overrides: { '--g-sidebar-current': 'var(--g-color-accent)', '--g-sidebar-on-current': 'var(--g-color-on-accent)', '--g-sidebar-current-edge': 'var(--g-color-accent-text)' } })
    expect(r.ok).toBe(true)
    expect(r.issues.filter((i) => i.id === 'unknown-token')).toEqual([])
    expect(r.css).toMatch(/:root,\n\[data-theme="light"\] \{[^}]*--g-sidebar-current: var\(--g-color-accent\);/)
  })

  it('tema sin ranuras declaradas (por defecto y NisaNabani sin overrides): ni mide ni emite nada', () => {
    for (const cfg of [{}, NISA, { brand: '#9D1635' }]) {
      const r = buildTheme(cfg)
      expect(sc(r)).toEqual([])
      expect(darkSlots(r)).toEqual({})
      expect(r.css ?? '').not.toContain('--g-sidebar-current')
    }
  })

  it('los pares del tema por defecto cumplen en claro y oscuro (P1 4.5, P2 y P3 3)', () => {
    for (const tokens of [DEFAULTS, { ...DEFAULTS, ...DARK }]) {
      const p = measureSidebarPairs(tokens)
      expect(p.map((x) => x.id)).toEqual(['P1', 'P2', 'P3'])
      expect(p.every((x) => x.ok === true)).toBe(true)
    }
  })

  it('NisaNabani con primary/accent: el claro cumple; el oscuro heredado falla (1.94:1) y se deriva primary-soft + accent-text (9.31:1)', () => {
    const r = buildTheme({ ...NISA, overrides: ROLES })
    expect(r.ok).toBe(true)
    const d = sc(r)
    expect(d.find((x) => x.code === 'sidebar-current-contrast' && x.scheme === 'light')).toBeUndefined()
    const der = d.find((x) => x.code === 'sidebar-current-dark')
    expect(der).toMatchObject({ status: 'derived', scheme: 'dark' })
    expect(pair(der.before, 'P1').ratio).toBeCloseTo(1.94, 2)
    expect(pair(der.after, 'P1').ratio).toBeCloseTo(9.31, 2)
    expect(der.after.every((p) => p.ok)).toBe(true)
    expect(der.values).toEqual({ '--g-sidebar-current': 'var(--g-color-primary-soft)', '--g-sidebar-on-current': 'var(--g-color-accent-text)' })
    expect(darkSlots(r)).toEqual({ '--g-sidebar-current': 'var(--g-color-primary-soft)', '--g-sidebar-on-current': 'var(--g-color-accent-text)', '--g-sidebar-current-edge': 'var(--g-color-primary-text)' })
    // Ya derivado, el oscuro cumple: sin informativo de contraste en el oscuro
    expect(d.find((x) => x.code === 'sidebar-current-contrast' && x.scheme === 'dark')).toBeUndefined()
    // No ajusta lo que el usuario escribió en el claro
    expect(r.generated['--g-sidebar-current']).toBe('var(--g-color-primary)')
    expect(r.generated['--g-sidebar-on-current']).toBe('var(--g-color-accent)')
    // Va en los dos bloques oscuros
    const css = r.css
    expect(css).toMatch(/@media \(prefers-color-scheme: dark\) \{[\s\S]*--g-sidebar-current: var\(--g-color-primary-soft\);[\s\S]*\[data-theme="dark"\] \{[\s\S]*--g-sidebar-on-current: var\(--g-color-accent-text\);/)
    expect(r.notes.some((n) => n.code === 'sidebar-current-dark')).toBe(true)
  })

  it('las mismas ranuras sobre el tema por defecto: informativo en el claro (2.9:1) y respaldo on-primary-soft en el oscuro (accent-text daría 3.86:1)', () => {
    const r = buildTheme({ overrides: ROLES })
    expect(r.ok).toBe(true)
    const light = sc(r).find((x) => x.code === 'sidebar-current-contrast' && x.scheme === 'light')
    expect(light).toMatchObject({ status: 'informative' })
    expect(pair(light.pairs, 'P1').ratio).toBeCloseTo(2.9, 1)
    expect(pair(light.pairs, 'P1').ok).toBe(false)
    expect(light.message).toMatch(/No bloquea/)
    const der = sc(r).find((x) => x.code === 'sidebar-current-dark')
    expect(der.values['--g-sidebar-on-current']).toBe('var(--g-color-on-primary-soft)')
    expect(der.message).toMatch(/respaldo on-soft/)
    // accent-text sobre primary-soft en el oscuro por defecto: el motivo del respaldo
    const tried = measureSidebarPairs({ ...DEFAULTS, ...DARK, '--g-sidebar-current': 'var(--g-color-primary-soft)', '--g-sidebar-on-current': 'var(--g-color-accent-text)' })
    expect(pair(tried, 'P1').ratio).toBeCloseTo(3.86, 2)
    expect(der.after.every((p) => p.ok)).toBe(true)
    expect(r.issues.some((i) => i.severity === 'error')).toBe(false)
  })

  it('heredadas que cumplen en el oscuro: el oscuro conserva la identidad del claro sin diagnóstico', () => {
    const own = { '--g-sidebar-current': 'var(--g-color-accent)', '--g-sidebar-on-current': 'var(--g-color-on-accent)', '--g-sidebar-current-edge': 'var(--g-color-accent-text)' }
    const r = buildTheme({ overrides: own })
    expect(sc(r)).toEqual([])
    expect(darkSlots(r)).toEqual(own)
  })

  it('ranura declarada en dark.overrides: solo diagnostica, no deriva', () => {
    const r = buildTheme({ ...NISA, overrides: ROLES, dark: { overrides: { '--g-sidebar-on-current': 'var(--g-color-accent)' } } })
    expect(r.ok).toBe(true)
    // Las no declaradas en el oscuro se derivan (el relleno); la tinta declarada se respeta
    expect(darkSlots(r)['--g-sidebar-on-current']).toBe('var(--g-color-accent)')
    const all = buildTheme({ ...NISA, overrides: ROLES, dark: { overrides: { ...ROLES, '--g-sidebar-current-edge': 'var(--g-color-primary-text)' } } })
    expect(sc(all).find((x) => x.code === 'sidebar-current-dark')).toBeUndefined()
    const dk = sc(all).find((x) => x.code === 'sidebar-current-contrast' && x.scheme === 'dark')
    expect(pair(dk.pairs, 'P1').ratio).toBeCloseTo(1.94, 2)
    expect(darkSlots(all)['--g-sidebar-current']).toBe('var(--g-color-primary)')
  })

  it('solo en dark.overrides: diagnostica el oscuro sin emitir nada heredado', () => {
    const r = buildTheme({ dark: { overrides: { '--g-sidebar-current': '#000000' } } })
    const dk = sc(r).find((x) => x.scheme === 'dark')
    expect(dk.code).toBe('sidebar-current-contrast')
    expect(pair(dk.pairs, 'P1').ok).toBe(false)
    expect(darkSlots(r)).toEqual({ '--g-sidebar-current': '#000000' })
  })

  it('relleno que no es una familia (hex): el oscuro deriva primary-soft; un valor que no sabe leer queda «no medido»', () => {
    const r = buildTheme({ overrides: { '--g-sidebar-current': '#24366B', '--g-sidebar-on-current': '#C1D324' } })
    const der = sc(r).find((x) => x.code === 'sidebar-current-dark')
    if (der) expect(der.values['--g-sidebar-current']).toBe('var(--g-color-primary-soft)')
    const mix = buildTheme({ overrides: { '--g-sidebar-current': 'color-mix(in oklab, var(--g-color-primary), white 10%)' } })
    const d = sc(mix).find((x) => x.scheme === 'light')
    expect(pair(d.pairs, 'P1')).toMatchObject({ ratio: null, ok: null })
    expect(d.message).toMatch(/no medido/)
  })
})
