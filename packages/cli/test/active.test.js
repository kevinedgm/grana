// Diagnóstico informativo de `active` sobre la superficie (DECISIONS.md #228, tokens.md §24, speech.md §13): el CLI no
// rechaza acentos pálidos (son marcas válidas como relleno); avisa en tokens.json y en las notas, sin bloquear.
import { describe, it, expect } from 'vitest'
import { buildTheme, activeContrast } from '../src/index.js'

describe('diagnóstico de active < 3:1 sobre surface', () => {
  it('acento pálido: el tema es válido y tokens.json lleva el diagnóstico informativo (claro y, si aplica, oscuro)', () => {
    const r = buildTheme({ brand: '#1F1F1F', accent: '#A7F3C1' })
    expect(r.ok).toBe(true)
    const d = r.doc.diagnostics.find((x) => x.code === 'active-contrast')
    expect(d).toMatchObject({ cssVar: '--g-color-active', against: '--g-color-surface', min: 3, status: 'informative' })
    expect(d.light).toBeLessThan(3)
    expect(d.message).toContain('accent-text')
    expect(r.notes.some((n) => n.code === 'active-contrast')).toBe(true)
    expect(r.issues.some((i) => i.severity === 'error')).toBe(false)
  })

  it('tema por defecto y acento con contraste: sin diagnóstico', () => {
    expect(buildTheme({}).doc.diagnostics.some((x) => x.code === 'active-contrast')).toBe(false)
    expect(buildTheme({ accent: '#0B63CE' }).doc.diagnostics.some((x) => x.code === 'active-contrast')).toBe(false)
  })

  it('activeContrast resuelve alias var(--g-color-accent)', () => {
    const light = { '--g-color-accent': '#FF9900', '--g-color-active': 'var(--g-color-accent)', '--g-color-surface': '#FFFFFF' }
    const d = activeContrast(light, null)
    expect(d.light).toBeCloseTo(2.14, 1)
    expect(d.dark).toBeUndefined()
    expect(activeContrast({ ...light, '--g-color-accent': '#0B63CE' }, null)).toBeNull()
  })
})
