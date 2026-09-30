import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { contrast, parseHex } from '../src/color.js'
import { deriveColor, pickOn } from '../src/derive.js'
import { DEFAULTS } from '../src/defaults.js'

const near = (a, b, tol) => parseHex(a).every((v, i) => Math.abs(v - parseHex(b)[i]) <= tol)

describe('deriveColor', () => {
  it('reproduce el tema por defecto (dentro de 6/255 por canal; neutral «on-soft» es una decisión manual)', () => {
    for (const c of ['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']) {
      const d = deriveColor(DEFAULTS[`--g-color-${c}`])
      expect(d.base).toBe(DEFAULTS[`--g-color-${c}`])
      expect(near(d.strong, DEFAULTS[`--g-color-${c}-strong`], 6), `${c} strong ${d.strong}`).toBe(true)
      expect(near(d.soft, DEFAULTS[`--g-color-${c}-soft`], 6), `${c} soft ${d.soft}`).toBe(true)
      expect(d.text).toBe(DEFAULTS[`--g-color-${c}-text`])
      expect(d.on).toBe(DEFAULTS[`--g-color-on-${c}`])
      if (c !== 'neutral') expect(d.onSoft).toBe(DEFAULTS[`--g-color-on-${c}-soft`])
    }
  })

  it('strong: oscurece con bases claras y aclara con bases muy oscuras (L < 0.3)', () => {
    const light = deriveColor('#F5B940')
    const dark = deriveColor('#1F1F1F')
    expect(contrast(parseHex(light.strong), [255, 255, 255])).toBeGreaterThan(contrast(parseHex(light.base), [255, 255, 255]))
    expect(parseHex(dark.strong)[0]).toBeGreaterThan(parseHex(dark.base)[0])
  })

  it('on: casi negro sobre amarillo pálido, blanco sobre azul marino', () => {
    expect(deriveColor('#FFE9A0').on).toBe('#17151A')
    expect(deriveColor('#0B1F4D').on).toBe('#FFFFFF')
    expect(pickOn([250, 250, 250])).toEqual([0x17, 0x15, 0x1a])
  })

  it('text y on-soft llegan a 4.5:1 con casos extremos (amarillo pálido, gris medio, azul marino)', () => {
    for (const hex of ['#F5B940', '#FFE9A0', '#8A8A8A', '#0B1F4D', '#5B3FE0', '#E11D48']) {
      const d = deriveColor(hex)
      expect(contrast(parseHex(d.text), [255, 255, 255]), `${hex} text ${d.text}`).toBeGreaterThanOrEqual(4.5)
      expect(contrast(parseHex(d.onSoft), parseHex(d.soft)), `${hex} on-soft`).toBeGreaterThanOrEqual(4.5)
      expect(contrast(parseHex(d.on), parseHex(d.base)), `${hex} on`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('un color que ya cumple no se toca al derivar text; uno claro se oscurece conservando el tono', () => {
    expect(deriveColor('#0B63CE').text).toBe('#0B63CE')
    const t = deriveColor('#F5B940').text
    expect(t).not.toBe('#F5B940')
    // el tono (matiz) se conserva aproximadamente: R ≥ G ≥ B como en el naranja original
    const [r, g, b] = parseHex(t)
    expect(r).toBeGreaterThanOrEqual(g)
    expect(g).toBeGreaterThanOrEqual(b)
  })

  it('con otra superficie (oscura), text se calcula contra ella', () => {
    const d = deriveColor('#0B63CE', { surface: '#101010' })
    expect(contrast(parseHex(d.text), parseHex('#101010'))).toBeGreaterThanOrEqual(4.5)
  })

  it('un color inválido lanza un error claro', () => {
    expect(() => deriveColor('azul')).toThrow(/Color inválido/)
  })
})

describe('defaults.js', () => {
  it('coincide con packages/vue/src/styles/defaults.css (si se desfasa, ejecuta scripts/sync-defaults.mjs)', () => {
    const css = readFileSync(fileURLToPath(new URL('../../vue/src/styles/defaults.css', import.meta.url)), 'utf8').split('/* === OSCURO')[0].replace(/\/\*[\s\S]*?\*\//g, '')
    const parsed = {}
    for (const m of css.matchAll(/(--g-[a-z0-9-]+)\s*:\s*([^;]+);/g)) parsed[m[1]] = m[2].trim().replace(/\s+/g, ' ')
    expect(DEFAULTS).toEqual(parsed)
  })
})
