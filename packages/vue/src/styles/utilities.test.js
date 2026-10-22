// Clases utilitarias (design/contracts/utilities.md «Verificación (a)», DECISIONS.md #804 a #811): utilities.css (de coco)
// debe ser exactamente la lista canónica de design/contracts/utilities.json, solo con tokens y palabras clave permitidas,
// y grana.css debe declarar el orden de capas completo e importarlo en grana.utilities. Lo de dist/ se comprueba si ya
// hay build (las compuertas de gates.sh lo exigen siempre).
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(process.cwd(), '..', '..')
const read = (p) => readFileSync(resolve(ROOT, p), 'utf8')
const spec = JSON.parse(read('design/contracts/utilities.json'))
const css = read('packages/vue/src/styles/utilities.css')
const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')

const parseRules = (text) =>
  [...text.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, body]) => ({
    selector: sel.trim(),
    decl: Object.fromEntries(
      body.split(';').map((d) => d.trim()).filter(Boolean).map((d) => {
        const i = d.indexOf(':')
        return [d.slice(0, i).trim(), d.slice(i + 1).trim()]
      })
    )
  }))

const rules = parseRules(stripped)
const bySelector = new Map(rules.map((r) => [r.selector, r]))
const baseOf = (selector) => selector.replace(/:where\(.*\)$/, '').replace(/^\./, '')
const classes = spec.classes

describe('utilities.css · transcripción fiel de utilities.json (#811 a)', () => {
  it('el JSON declara 229 clases y la capa grana.utilities', () => {
    expect(spec.count).toBe(229)
    expect(classes).toHaveLength(229)
    expect(spec.layer).toBe('grana.utilities')
  })

  it('mismo conjunto y mismo orden de clases', () => {
    expect(rules.map((r) => baseOf(r.selector))).toEqual(classes.map((c) => c.class))
  })

  it('cada declaración es exactamente la del JSON', () => {
    for (const c of classes) {
      const rule = rules.find((r) => baseOf(r.selector) === c.class)
      expect(rule?.decl, c.class).toEqual(c.decl)
    }
  })

  it('especificidad 0,1,0: un solo selector de clase (la guarda de hidden va en :where)', () => {
    for (const r of rules) expect(r.selector, r.selector).toMatch(/^\.g-[a-z0-9-]+(:where\(:not\(\[hidden\]\)\))?$/)
  })

  it('solo var(--g-*) sin respaldo o un literal permitido; los de g-sr-only solo en g-sr-only', () => {
    const allowed = new Set(spec.allowedLiterals)
    const srOnly = new Set(spec.allowedLiteralsSrOnly)
    for (const r of rules) {
      const cls = baseOf(r.selector)
      for (const [prop, value] of Object.entries(r.decl)) {
        const where = `${cls} { ${prop}: ${value} }`
        if (/var\(/.test(value)) {
          expect(value, where).toMatch(/^var\(--g-[a-z0-9-]+\)$/)
          continue
        }
        const ok = value.split(/\s+/).every((word) => allowed.has(word) || (cls === 'g-sr-only' && srOnly.has(word)))
        expect(ok, where).toBe(true)
      }
    }
    // Los literales de g-sr-only no se admiten en ninguna otra clase.
    for (const r of rules) {
      if (baseOf(r.selector) === 'g-sr-only') continue
      for (const [prop, value] of Object.entries(r.decl)) {
        if (/var\(/.test(value)) continue
        for (const word of value.split(/\s+/)) if (!spec.allowedLiterals.includes(word)) throw new Error(`${r.selector}: literal no permitido «${word}» en ${prop}`)
      }
    }
  })

  it('todo token que se lee existe en defaults.css (el tema por defecto)', () => {
    const defaults = read('packages/vue/src/styles/defaults.css')
    const read_ = new Set([...stripped.matchAll(/var\((--g-[a-z0-9-]+)\)/g)].map((m) => m[1]))
    expect(read_.size).toBeGreaterThan(20)
    for (const token of read_) expect(defaults, token).toContain(`${token}:`)
  })

  it('sin !important, sin @layer, sin @import ni respaldos en el archivo', () => {
    expect(stripped).not.toMatch(/!\s*important/)
    expect(stripped).not.toMatch(/@layer|@import|@media|@container/)
    expect(stripped).not.toMatch(/var\([^)]*,/)
  })

  it('la guarda :where(:not([hidden])) está en las seis de display y en ninguna otra', () => {
    const guarded = rules.filter((r) => r.selector.includes(spec.hiddenGuard)).map((r) => baseOf(r.selector))
    expect(guarded).toEqual(spec.hiddenGuardApplies)
    expect(spec.hiddenGuardApplies).toHaveLength(6)
  })

  it('g-hidden va después de las seis de display y g-sr-only es la última', () => {
    const order = rules.map((r) => baseOf(r.selector))
    const hidden = order.indexOf('g-hidden')
    for (const c of spec.hiddenGuardApplies) expect(order.indexOf(c), c).toBeLessThan(hidden)
    expect(order.at(-1)).toBe('g-sr-only')
    expect(bySelector.get('.g-hidden').decl).toEqual({ display: 'none' })
  })
})

describe('grana.css y blocks · orden de capas y paquete (#806, #810)', () => {
  const order = spec.layerOrder.join(', ')

  it('grana.css declara el orden completo antes de cualquier import e importa utilities.css en grana.utilities', () => {
    const grana = read('packages/vue/src/styles/grana.css').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(grana.indexOf(`@layer ${order};`)).toBeGreaterThanOrEqual(0)
    expect(grana.indexOf(`@layer ${order};`)).toBeLessThan(grana.indexOf('@import'))
    expect(grana).toContain('@import url("./utilities.css") layer(grana.utilities);')
    // components va antes que utilities: la hoja de utilidades es la última importada.
    expect(grana.indexOf('./components.css')).toBeLessThan(grana.indexOf('./utilities.css'))
  })

  it('la hoja de @grana/blocks declara el mismo orden completo', () => {
    const blocks = read('packages/blocks/src/components.css').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(blocks).toContain(`@layer ${order};`)
  })

  it('el package.json exporta ./utilities.css y el build lo genera', () => {
    const pkg = JSON.parse(read('packages/vue/package.json'))
    expect(pkg.exports['./utilities.css']).toBe('./dist/utilities.css')
    expect(pkg.scripts.build).toContain('node scripts/build-utilities.mjs')
    expect(pkg.files).toContain('dist')
  })

  const dist = resolve(ROOT, 'packages/vue/dist/utilities.css')
  it.skipIf(!existsSync(dist))('dist/utilities.css empieza por el orden completo y envuelve las reglas en @layer grana.utilities', () => {
    const out = readFileSync(dist, 'utf8')
    const body = out.replace(/\/\*[\s\S]*?\*\//g, '').trim()
    expect(body.startsWith(`@layer ${spec.layerOrder.join(',')};`)).toBe(true)
    expect(body).toContain('@layer grana.utilities{')
    expect(out).not.toMatch(/!\s*important/)
    const inner = body.slice(body.indexOf('@layer grana.utilities{') + '@layer grana.utilities{'.length, -1)
    const parsed = parseRules(inner)
    expect(parsed.map((r) => baseOf(r.selector))).toEqual(classes.map((c) => c.class))
    for (const c of classes) expect(parsed.find((r) => baseOf(r.selector) === c.class).decl, c.class).toEqual(c.decl)
  })
})
