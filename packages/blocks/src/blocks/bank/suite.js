// Batería común de una sección de Marketing (dueño: bruno; _comun.md §8, puntos 1 a 4 y 7). Cada Gb<Sección>.test.js la
// llama con su banco y su meta.json y añade lo propio (eventos, avisos y estructura de su contrato).
import { describe, it, expect, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { h } from 'vue'
import { GSection } from '@grana/vue'
import { UTILITY, mountBlock, ownAnchor, ssr } from './harness.js'

/**
 * @param {object} o
 * @param {object} o.meta      el Gb<Sección>.meta.json
 * @param {object} o.bank      el módulo <seccion>.bank.js ({ props, slots, appIcons? })
 * @param {object} o.variants  { GbX01, GbX02, GbX03 } (los componentes reales)
 * @param {object} o.section   el módulo props.js de la sección ({ props, emits })
 * @param {string} o.dir       carpeta de la sección relativa a packages/blocks ('src/blocks/GbHero')
 * @param {number} [o.h1=0]    h1 que pinta cada variante (1 solo en Hero)
 * @param {string[]} [o.headless=[]] variantes que con el banco no pintan ningún encabezado (GbFooter02: una línea)
 * @param {object} [o.inner={}] bloques que el banco mete en un slot de la variante ({ GbFooter03: 1 }: la suscripción)
 */
export function sectionSuite({ meta, bank, variants, section, dir, h1 = 0, headless = [], inner = {} }) {
  const names = meta.variants.map((v) => v.name)
  const icons = bank.appIcons || []
  const run = (name, extra = {}) => mountBlock(variants[name], { props: bank.props, slots: bank.slots, icons, ...extra })
  afterEach(() => vi.restoreAllMocks())

  describe(`${meta.name} · interfaz compartida (#763, #815)`, () => {
    it('las variantes del meta.json son las exportadas', () => {
      expect(Object.keys(variants).sort()).toEqual([...names].sort())
    })
    it('las tres variantes usan el MISMO objeto props y emits de props.js', () => {
      for (const n of names) {
        expect(variants[n].props, n).toBe(section.props)
        expect(variants[n].emits, n).toBe(section.emits)
      }
    })
    it('las claves y la obligatoriedad de props coinciden con el meta.json; los eventos también', () => {
      expect(Object.keys(section.props).sort()).toEqual(meta.props.map((p) => p.name).sort())
      for (const p of meta.props) expect(Boolean(section.props[p.name].required), p.name).toBe(Boolean(p.required))
      expect([...section.emits].sort()).toEqual((meta.events || []).map((e) => e.name).sort())
    })
    it('etiquetas y data-gb siguen el nombre de la sección (#764)', () => {
      for (const v of meta.variants) expect(v.tag).toBe(`gb-${meta.name.slice(2).replace(/[A-Z]/g, (c, i) => (i ? '-' : '') + c.toLowerCase())}-${v.name.slice(-2)}`)
    })
  })

  describe(`${meta.name} · el banco por las tres variantes`, () => {
    for (const n of names) {
      it(`${n}: ningún aviso de Vue ni [Grana …], tampoco de lo compuesto`, () => {
        const { warnings } = run(n)
        expect(warnings).toEqual([])
      })
    }
  })

  describe(`${meta.name} · HTML semántico (_comun.md §8.3 y §8.4)`, () => {
    for (const v of meta.variants) {
      const n = v.name
      it(`${n}: un solo elemento raíz con data-gb="${v.tag.slice(3)}" que recibe $attrs`, () => {
        // (`id` no se comprueba aquí: GHero lo toma como prop para sus ids internos y no lo pone en la raíz)
        const { w } = run(n, { attrs: { class: 'g-bleed', 'data-x': '1', 'aria-describedby': 'nota' } })
        const root = w.element
        expect(root.getAttribute('data-gb')).toBe(v.tag.slice(3))
        expect(root.classList.contains('g-bleed')).toBe(true)
        expect(root.getAttribute('data-x')).toBe('1')
        expect(root.getAttribute('aria-describedby')).toBe('nota')
        expect(w.findAll('[data-gb]').length).toBe(1 + (inner[n] || 0))
      })
      it(`${n}: ${h1 ? 'exactamente un h1' : 'ningún h1'}`, () => {
        const { w } = run(n)
        expect(w.findAll('h1').length).toBe(h1)
      })
      it(`${n}: sin clases de utilidad y sin <a> que no sea de GBtn, GCard o GTag`, () => {
        const { w } = run(n)
        for (const el of w.element.querySelectorAll('[class]')) expect(el.getAttribute('class'), el.outerHTML.slice(0, 80)).not.toMatch(UTILITY)
        for (const a of w.element.querySelectorAll('a')) expect(ownAnchor(a), a.outerHTML.slice(0, 120)).toBe(true)
      })
      it(`${n}: listas reales (role="list" con listitem hijos directos y la misma pista, o ul/ol › li)`, () => {
        const { w } = run(n)
        // ul/ol de GStack llevan role="list" por la primitiva (#827): sus hijos son li, se comprueba abajo
        for (const list of w.element.querySelectorAll('[role="list"]:not(ul, ol)')) {
          const kids = [...list.children]
          expect(kids.length).toBeGreaterThan(0)
          for (const k of kids) expect(k.getAttribute('role')).toBe('listitem')
          const hints = new Set(kids.map((k) => [...k.classList].filter((c) => c.startsWith('g-adapt-')).join(' ')))
          expect(hints.size, 'misma pista').toBe(1)
          expect([...hints][0]).toMatch(/^g-adapt-/)
        }
        for (const list of w.element.querySelectorAll('ul, ol')) for (const k of list.children) expect(k.tagName).toBe('LI')
        for (const list of w.element.querySelectorAll('ul.g-stack, ol.g-stack')) expect(list.getAttribute('role'), 'GStack ul/ol lleva role="list" (#827)').toBe('list')
      })
      it(`${n}: el código no lleva <style>, style=, hN sueltos, <a> desnudos ni utilidades`, () => {
        const code = readFileSync(resolve(process.cwd(), dir, `${n}.vue`), 'utf8')
        const template = code.slice(code.indexOf('<template>'))
        expect(code).not.toMatch(/<style/)
        expect(template).not.toMatch(/\sstyle=|:style=/)
        expect(template).not.toMatch(/<h[1-6][\s>]/)
        expect(template).not.toMatch(/<a[\s>]/)
        expect(template).not.toMatch(new RegExp(`class="[^"]*${UTILITY.source}`))
      })
      it(`${n}: SSR sin errores ni avisos`, async () => {
        const { html, warnings } = await ssr(variants[n], { props: bank.props, slots: bank.slots, icons })
        expect(html).toContain(`data-gb="${v.tag.slice(3)}"`)
        expect(warnings).toEqual([])
      })
    }
  })

  if (!h1) {
    describe(`${meta.name} · encabezados por anidación (#720, #817)`, () => {
      for (const n of names.filter((x) => headless.includes(x))) {
        it(`${n}: sin encabezados (forma sin título), también dentro de una GSection de la aplicación`, () => {
          expect(run(n).w.findAll('h1, h2, h3, h4, h5, h6')).toHaveLength(0)
          const nested = run(n, { wrap: (render) => h(GSection, { title: 'Página' }, render) })
          expect(nested.w.element.querySelector('[data-gb]').querySelectorAll('h1, h2, h3, h4, h5, h6')).toHaveLength(0)
        })
      }
      for (const n of names.filter((x) => !headless.includes(x))) {
        it(`${n}: título de la sección h2 en la raíz y h3 dentro de una GSection de la aplicación`, () => {
          const top = run(n)
          expect(top.w.element.querySelector('h2, h3, h4, h5, h6').tagName).toBe('H2')
          const nested = run(n, { wrap: (render) => h(GSection, { title: 'Página' }, render) })
          const block = nested.w.element.querySelector('[data-gb]')
          expect(block.querySelector('h2, h3, h4, h5, h6').tagName).toBe('H3')
        })
      }
    })
  }
}
