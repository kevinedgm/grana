import { describe, it, expect } from 'vitest'
import { radii, spacing, typography, fontStack } from '../src/scales.js'
import { generateTheme, toCss } from '../src/theme.js'
import { readConfig } from '../src/config.js'
import { validateTheme } from '../src/validate.js'
import { buildTheme } from '../src/index.js'
import { DEFAULTS } from '../src/defaults.js'

describe('escalas', () => {
  it('radios, espaciado y tipografía por defecto coinciden EXACTAMENTE con defaults.css', () => {
    const gen = { ...radii(6), ...spacing(4), ...typography(16, 1.25) }
    for (const [k, v] of Object.entries(gen)) expect(v, k).toBe(DEFAULTS[k])
  })

  it('radios: escala geométrica ×1.4 y shape', () => {
    const r = radii(20)
    expect(r['--g-radius-md']).toBe('20px')
    expect(r['--g-radius-lg']).toBe('28px')
    expect(r['--g-radius-sm']).toBe('14px')
    expect(r['--g-radius-shape']).toBe('var(--g-radius-md)')
    expect(radii(20, 'pill')['--g-radius-shape']).toBe('var(--g-radius-pill)')
  })

  it('espaciado: múltiplos de la unidad', () => {
    const s = spacing(5)
    expect(s['--g-space-1']).toBe('5px')
    expect(s['--g-space-12']).toBe('60px')
  })

  it('tipografía: caption nunca baja de 12px y el interlineado es múltiplo de 4px', () => {
    const t = typography(12, 1.2)
    expect(parseFloat(t['--g-text-caption-size']) * 16).toBeGreaterThanOrEqual(12)
    for (const k of Object.keys(t).filter((x) => x.endsWith('-line'))) expect((parseFloat(t[k]) * 16) % 4).toBe(0)
  })

  it('fontStack: un nombre recibe la pila del sistema; una pila completa se respeta', () => {
    expect(fontStack('Inter')).toBe('"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif')
    expect(fontStack('"Inter"')).toContain('"Inter", system-ui')
    expect(fontStack('Georgia, "Times New Roman", serif')).toBe('Georgia, "Times New Roman", serif')
  })
})

describe('readConfig', () => {
  it('acepta las 9 claves y overrides', () => {
    const { config, errors } = readConfig({ brand: '#f5b940', accent: '5b3fe0', radius: 20, shape: 'pill', space: 4, font: 'Inter', fontDisplay: 'Instrument Serif', fontSize: 16, typeScale: 1.4, overrides: { '--g-focus-width': '3px' } })
    expect(errors).toEqual([])
    expect(config.brand).toBe('#F5B940')
    expect(config.accent).toBe('#5B3FE0')
  })

  it('rechaza claves desconocidas, tipos y rangos con el motivo', () => {
    const { errors } = readConfig({ colour: 'x', brand: 'azul', radius: -1, space: '4', shape: 'square', typeScale: 5, overrides: { color: 'red', '--g-x': 3 } })
    const ids = errors.map((e) => e.id)
    expect(ids).toEqual(expect.arrayContaining(['unknown-key', 'bad-color', 'out-of-range', 'bad-number', 'bad-shape', 'bad-override']))
    expect(errors.find((e) => e.id === 'unknown-key').message).toContain('colour')
  })

  it('una configuración que no es un objeto se rechaza', () => {
    expect(readConfig([]).errors[0].id).toBe('config')
    expect(readConfig(null).errors[0].id).toBe('config')
  })
})

describe('generateTheme', () => {
  it('sin entradas no genera nada y el tema completo son los defaults', () => {
    const { generated, tokens } = generateTheme({})
    expect(generated).toEqual({})
    expect(tokens).toEqual(DEFAULTS)
  })

  it('brand genera sus 6 tokens; sin accent, accent se deriva del text de brand', () => {
    const { generated } = generateTheme({ brand: '#F5B940' })
    expect(Object.keys(generated).filter((k) => k.includes('brand'))).toHaveLength(6)
    expect(generated['--g-color-accent']).toBe(generated['--g-color-brand-text'])
    expect(Object.keys(generated).filter((k) => k.includes('accent'))).toHaveLength(6)
  })

  it('con accent explícito, accent no depende de brand', () => {
    const { generated } = generateTheme({ brand: '#F5B940', accent: '#5B3FE0' })
    expect(generated['--g-color-accent']).toBe('#5B3FE0')
  })

  it('shape sin radius solo cambia --g-radius-shape', () => {
    const { generated } = generateTheme({ shape: 'pill' })
    expect(generated).toEqual({ '--g-radius-shape': 'var(--g-radius-pill)' })
  })

  it('overrides ganan sobre lo generado', () => {
    const { generated } = generateTheme({ brand: '#F5B940', overrides: { '--g-color-brand-strong': '#000000' } })
    expect(generated['--g-color-brand-strong']).toBe('#000000')
  })

  it('toCss escribe un bloque :root sin @layer', () => {
    const css = toCss({ '--g-space-1': '5px' }, { source: 'x.json' })
    expect(css).toContain(':root {\n  --g-space-1: 5px;\n}')
    expect(css).not.toContain('@layer {')
    expect(css).toContain('x.json')
  })
})

describe('validateTheme', () => {
  const issuesOf = (config) => validateTheme(generateTheme(readConfig(config).config).tokens, { generated: config.overrides })
  const errors = (config) => issuesOf(config).filter((i) => i.severity === 'error')

  it('el tema por defecto no tiene ni errores ni avisos', () => {
    expect(issuesOf({})).toEqual([])
  })

  it('colores derivados de casos extremos siempre cumplen los mínimos', () => {
    for (const brand of ['#F5B940', '#FFE9A0', '#8A8A8A', '#0B1F4D', '#5B3FE0', '#E11D48', '#00FF00']) {
      expect(errors({ brand, accent: brand }), brand).toEqual([])
    }
  })

  it('foco de 1px se rechaza, y el mensaje explica por qué', () => {
    const e = errors({ overrides: { '--g-focus-width': '1px' } })
    expect(e.map((i) => i.id)).toContain('focus-width')
    expect(e.find((i) => i.id === 'focus-width').why).toContain('2.4.13')
  })

  it('un texto de bajo contraste se rechaza con la razón medida', () => {
    const e = errors({ overrides: { '--g-color-text-muted': '#BBBBBB' } })
    const t = e.find((i) => i.id === 'text-contrast')
    expect(t.ratio).toBeLessThan(4.5)
    expect(t.min).toBe(4.5)
  })

  it('un borde de control por debajo de 3:1 se rechaza', () => {
    expect(errors({ overrides: { '--g-color-border-control': '#DDDDDD' } }).map((i) => i.id)).toContain('border-control')
  })

  it('solo lectura (#186): el borde de control necesita 3:1 también sobre --g-color-neutral-soft', () => {
    // Por defecto pasa (3.02:1 sobre #F0F0F0); un neutral-soft más oscuro lo rompe aunque el borde pase sobre las superficies
    expect(errors({}).map((i) => i.id)).not.toContain('border-control-readonly')
    const e = errors({ overrides: { '--g-color-neutral-soft': '#C8C8C8' } })
    const r = e.find((i) => i.id === 'border-control-readonly')
    expect(r.tokens).toEqual(['--g-color-border-control', '--g-color-neutral-soft'])
    expect(r.ratio).toBeLessThan(3)
    expect(r.why).toContain('1.4.11')
    expect(e.map((i) => i.id)).not.toContain('border-control')
  })

  it('un par on/color roto por un override se detecta', () => {
    expect(errors({ overrides: { '--g-color-on-danger': '#FF9999' } }).map((i) => i.id)).toContain('on-solid')
    expect(errors({ overrides: { '--g-color-danger-text': '#FFCCCC' } }).map((i) => i.id)).toContain('color-text')
  })

  it('texto de menos de 12px se rechaza', () => {
    expect(errors({ overrides: { '--g-text-caption-size': '0.6rem' } }).map((i) => i.id)).toContain('font-size')
  })

  it('cristal: opacidad < 0.55 o velo que no llega a 4.5:1 sobre negro se rechaza (un solo error agrupado)', () => {
    const e = errors({ overrides: { '--g-glass-opacity': '0.4' } })
    expect(e.map((i) => i.id)).toEqual(expect.arrayContaining(['glass-opacity', 'glass-contrast']))
    expect(e.filter((i) => i.id === 'glass-contrast')).toHaveLength(1)
    // 0.62 y 0.72 con velo teñido y texto marrón: el peor caso decide (caso real de la auditoría de GBadge)
    expect(errors({ overrides: { '--g-color-text': '#3B2A1A', '--g-glass-tint': '#FFF6E5', '--g-glass-opacity': '0.6', '--g-color-brand-soft': '#F6E4EE' } }).map((i) => i.id)).toContain('glass-contrast')
    expect(errors({ overrides: { '--g-color-text': '#3B2A1A', '--g-glass-tint': '#FFF6E5', '--g-glass-opacity': '0.72', '--g-color-brand-soft': '#F6E4EE' } }).filter((i) => i.id === 'glass-contrast')).toEqual([])
  })

  it('un color ilegible avisa (warning) y no bloquea', () => {
    const i = issuesOf({ overrides: { '--g-color-text-muted': 'color-mix(in srgb, red, blue)' } })
    expect(i.some((x) => x.id === 'unverifiable' && x.severity === 'warning')).toBe(true)
  })

  it('un token que no existe avisa; space < 4 avisa', () => {
    expect(issuesOf({ overrides: { '--g-color-brnd': '#000000' } }).some((i) => i.id === 'unknown-token')).toBe(true)
    expect(issuesOf({ space: 3 }).some((i) => i.id === 'space-small' && i.severity === 'warning')).toBe(true)
  })

  it('un rgb() con transparencia se compone sobre la superficie', () => {
    expect(errors({ overrides: { '--g-color-border-control': 'rgb(0 0 0 / 0.2)' } }).map((i) => i.id)).toContain('border-control')
    expect(errors({ overrides: { '--g-color-border-control': 'rgb(0 0 0 / 0.7)' } }).map((i) => i.id)).not.toContain('border-control')
  })
})

describe('buildTheme', () => {
  it('un tema válido devuelve css; uno inválido, null y los errores', () => {
    const ok = buildTheme({ brand: '#7A1F5C', accent: '#0F766E', radius: 12, space: 5 }, { source: 'a.json' })
    expect(ok.ok).toBe(true)
    expect(ok.css).toContain('--g-color-brand: #7A1F5C')
    const bad = buildTheme({ overrides: { '--g-focus-width': '1px' } })
    expect(bad.ok).toBe(false)
    expect(bad.css).toBeNull()
    const cfg = buildTheme({ nope: 1 })
    expect(cfg.ok).toBe(false)
    expect(cfg.issues[0].kind).toBe('config')
  })
})
