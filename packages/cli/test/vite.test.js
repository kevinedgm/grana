import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import grana, { VIRTUAL_ID } from '../src/vite.js'

let dir
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'grana-vite-')) })
afterEach(() => rmSync(dir, { recursive: true, force: true }))

// contexto mínimo de Rollup/Vite: error lanza, warn y addWatchFile se registran
const ctx = () => {
  const c = { watched: [], warnings: [] }
  c.addWatchFile = (f) => c.watched.push(f)
  c.warn = (m) => c.warnings.push(m)
  c.error = (m) => { throw new Error(m) }
  return c
}
const start = (opts) => {
  const p = grana(opts)
  p.configResolved({ root: dir })
  return p
}
const load = (p, c = ctx()) => p.load.call(c, p.resolveId(VIRTUAL_ID))

describe('plugin de Vite', () => {
  it('resuelve solo su módulo virtual y se ejecuta antes que los demás', () => {
    const p = start()
    expect(p.name).toBe('grana')
    expect(p.enforce).toBe('pre')
    expect(p.resolveId('virtual:grana/tokens.css')).toBe('\0virtual:grana/tokens.css')
    expect(p.resolveId('./otro.css')).toBeNull()
    expect(p.load.call(ctx(), './otro.css')).toBeNull()
  })

  it('genera el CSS del tema desde grana.config.json y vigila el archivo', () => {
    writeFileSync(join(dir, 'grana.config.json'), JSON.stringify({ brand: '#7A1F5C', space: 5 }))
    const c = ctx()
    const css = load(start(), c)
    expect(css).toContain('--g-color-brand: #7A1F5C;')
    expect(css).toContain('--g-space-1: 5px;')
    expect(c.watched).toEqual([join(dir, 'grana.config.json')])
  })

  it('acepta otra ruta o el objeto de configuración directamente', () => {
    writeFileSync(join(dir, 'tema.json'), JSON.stringify({ radius: 10 }))
    expect(load(start({ config: 'tema.json' }))).toContain('--g-radius')
    expect(load(start({ config: { space: 6 } }))).toContain('--g-space-1: 6px;')
  })

  it('falla con el motivo si el archivo no existe o no es JSON', () => {
    expect(() => load(start())).toThrow(/no se pudo leer grana\.config\.json: el archivo no existe/i)
    writeFileSync(join(dir, 'grana.config.json'), '{ no es json')
    expect(() => load(start())).toThrow(/No se pudo leer grana\.config\.json/)
  })

  it('falla si la configuración es inválida o el tema rompe un mínimo (nunca entrega CSS)', () => {
    expect(() => load(start({ config: { brand: 'rojo' } }))).toThrow(/El tema no es válido/)
    expect(() => load(start({ config: { overrides: { '--g-color-text': '#CCCCCC' } } }))).toThrow(/Por qué/)
  })

  it('los avisos no bloquean: se informan con warn', () => {
    const c = ctx()
    const css = load(start({ config: { space: 3 } }), c)
    expect(css).toContain('--g-space-1: 3px;')
    expect(c.warnings.length).toBeGreaterThan(0)
    expect(c.warnings[0]).toMatch(/^\[grana\]/)
  })
})
