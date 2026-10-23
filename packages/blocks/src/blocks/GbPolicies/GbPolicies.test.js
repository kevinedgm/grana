// GbPolicies (dueño: bruno): policies.md «Verificación propia» + la batería común de _comun.md §8 y §20.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { h, nextTick } from 'vue'
import { GAccordion, GAccordionItem, GCard, GSection } from '@grana/vue'
import meta from './GbPolicies.meta.json'
import * as bank from './policies.bank.js'
import * as section from './props.js'
import GbPolicies01 from './GbPolicies01.vue'
import GbPolicies02 from './GbPolicies02.vue'
import GbPolicies03 from './GbPolicies03.vue'
import { sectionSuite } from '../bank/suite.js'
import { click, mountBlock } from '../bank/harness.js'
import { paragraphs } from '../common/text.js'

const variants = { GbPolicies01, GbPolicies02, GbPolicies03 }
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbPolicies' })
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = ''; history.replaceState(null, '', '/') })

const run = (C, props = {}, extra = {}) => mountBlock(C, { props: { ...bank.props, ...props }, slots: bank.slots, icons: bank.appIcons, ...extra })
const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbPolicies${n}]`) && t.includes(`(${code})`))
const ALL = { '01': GbPolicies01, '02': GbPolicies02, '03': GbPolicies03 }
const ITEMS = bank.props.items

describe('GbPolicies · lo que decide en una línea, lo legal completo (#877)', () => {
  it('summary a la vista en las tres (peek en 01, descripción en 02 y 03)', () => {
    for (const C of Object.values(ALL)) {
      const { w } = run(C)
      for (const p of ITEMS) expect(w.text()).toContain(p.summary)
    }
    expect(run(GbPolicies01).w.findAllComponents(GAccordionItem).map((i) => i.props('peek'))).toEqual(ITEMS.map((p) => p.summary))
  })
  it('el cuerpo nunca se recorta: todos los párrafos de body en el DOM, en las tres', () => {
    for (const C of Object.values(ALL)) {
      const { w } = run(C)
      const ps = w.findAll('p').map((p) => p.text())
      for (const p of ITEMS) for (const para of paragraphs(p.body)) expect(ps).toContain(para)
    }
  })
  it('id como ancla en las tres: GAccordionItem (01), GSection (02) y GCard (03)', () => {
    for (const [n, C] of Object.entries(ALL)) {
      const { w } = run(C)
      for (const p of ITEMS.filter((x) => x.id)) {
        const el = w.find(`[id="${p.id}"]`)
        expect(el.exists(), `${n} #${p.id}`).toBe(true)
        expect(el.text()).toContain(p.title)
        const cls = { '01': 'g-accordion-item', '02': 'g-section', '03': 'g-card' }[n]
        expect(el.classes(), n).toContain(cls)
      }
    }
  })
  it('01: acordeón un nivel por debajo, plegado al montar, con hidden="until-found" (lo hace GAccordion)', () => {
    const { w } = run(GbPolicies01)
    expect(w.findComponent(GAccordion).props('headingLevel')).toBe(3)
    expect(w.findAll('[aria-expanded="true"]')).toHaveLength(0)
    expect(w.findAll('[hidden="until-found"]').length).toBe(ITEMS.length)
  })
  it('01: abre la política de location.hash al montar', async () => {
    history.replaceState(null, '', '#cancelacion')
    const { w } = run(GbPolicies01, {}, { attachTo: document.body })
    await nextTick(); await nextTick()
    const item = w.findAllComponents(GAccordionItem).find((i) => i.props('id') === 'cancelacion')
    expect(item.find('[aria-expanded]').attributes('aria-expanded')).toBe('true')
    w.unmount()
  })
  it('02: columna de lectura al inicio y una GSection anidada (h3) por política', () => {
    const { w } = run(GbPolicies02)
    expect(w.find('.g-container--width-reading').classes()).toContain('g-container--horizontal-start')
    expect(w.findAll('h3').map((x) => x.text())).toEqual(ITEMS.map((p) => p.title))
    const nested = run(GbPolicies02, {}, { wrap: (render) => h(GSection, { title: 'Página' }, render) })
    expect(nested.w.find('[data-gb]').findAll('h4')).toHaveLength(ITEMS.length)
  })
  it('03: una GCard por política con su icono decorativo en lead y el cuerpo en GText body-sm', () => {
    const { w } = run(GbPolicies03)
    const cards = w.findAllComponents(GCard)
    expect(cards).toHaveLength(ITEMS.length)
    expect(cards.map((c) => c.props('description'))).toEqual(ITEMS.map((p) => p.summary))
    expect(cards[2].find('svg').exists()).toBe(true)
    expect(cards[5].find('svg').exists()).toBe(false)
    expect(w.findAll('.g-text--size-body-sm').length).toBe(ITEMS.length)
  })
  it('slot body: contenido rico dentro de la misma GText, en las tres', () => {
    for (const C of Object.values(ALL)) {
      const { w } = mountBlock(C, { props: bank.props, slots: { body: ({ item }) => h('strong', { class: 'rico' }, item.title) }, icons: bank.appIcons })
      expect(w.findAll('.rico')).toHaveLength(ITEMS.length)
      expect(w.find('.rico').element.closest('.g-text')).not.toBeNull()
    }
  })
})

describe('GbPolicies · enlaces', () => {
  it('link interno: navigate { href, item: policy } con clic primario; no con modificadores; preventDefault lo deja a la aplicación', () => {
    for (const C of Object.values(ALL)) {
      const onNavigate = vi.fn((p) => p.event.preventDefault())
      const { w } = run(C, { onNavigate }, { attachTo: document.body })
      const a = w.find('a[href="/politicas/cancelacion"]')
      a.element.addEventListener('click', (e) => e.preventDefault()) // después del de GBtn: jsdom no navega
      a.element.dispatchEvent(click({ ctrlKey: true }))
      a.element.dispatchEvent(click({ button: 1 }))
      expect(onNavigate).not.toHaveBeenCalled()
      a.element.dispatchEvent(click())
      expect(onNavigate).toHaveBeenCalledTimes(1)
      expect(onNavigate.mock.calls[0][0].href).toBe('/politicas/cancelacion')
      expect(onNavigate.mock.calls[0][0].item).toBe(ITEMS[0])
      w.unmount()
    }
  })
  it('link externo: target _blank, nombre «{label}, {external}» y sin navigate', () => {
    for (const C of Object.values(ALL)) {
      const onNavigate = vi.fn()
      const { w } = run(C, { onNavigate }, { attachTo: document.body })
      const a = w.find('a[target="_blank"]')
      expect(a.attributes('rel')).toBe('noopener')
      expect(a.attributes('aria-label')).toBe('Formas de pago del banco, se abre en otra pestaña')
      a.element.addEventListener('click', (e) => e.preventDefault())
      a.element.dispatchEvent(click())
      expect(onNavigate).not.toHaveBeenCalled()
      w.unmount()
    }
  })
})

describe('GbPolicies · avisos', () => {
  it('P1: sin summary, una vez por instancia; 01 asoma el primer párrafo', () => {
    const items = ITEMS.map(({ summary, ...p }) => p)
    for (const [n, C] of Object.entries(ALL)) {
      const { w, warnings } = run(C, { items })
      expect(own(warnings, n, 'P1')).toHaveLength(1)
      if (n === '01') expect(w.findAllComponents(GAccordionItem)[0].props('peek')).toBe(paragraphs(ITEMS[0].body)[0])
    }
  })
  it('P2: id con espacios se pinta sin ancla', () => {
    for (const [n, C] of Object.entries(ALL)) {
      const { w, warnings } = run(C, { items: [{ ...ITEMS[0], id: 'mi politica' }] })
      expect(own(warnings, n, 'P2')).toHaveLength(1)
      expect(w.find('[id="mi politica"]').exists()).toBe(false)
    }
  })
  it('C1 vacía (no pinta); C2 sin body (se omite); C3 id repetido; C7 más de 20; C5 externo sin labels.external', () => {
    for (const [n, C] of Object.entries(ALL)) {
      const empty = run(C, { items: [] })
      expect(own(empty.warnings, n, 'C1')).toHaveLength(1)
      expect(empty.w.find('[data-gb]').exists()).toBe(false)
      const c2 = run(C, { items: [ITEMS[0], { title: 'Sin texto' }] })
      expect(own(c2.warnings, n, 'C2')).toHaveLength(1)
      expect(c2.w.text()).not.toContain('Sin texto')
      expect(own(run(C, { items: [ITEMS[0], { ...ITEMS[1], id: 'cancelacion' }] }).warnings, n, 'C3')).toHaveLength(1)
      expect(own(run(C, { items: Array.from({ length: 21 }, (_, i) => ({ title: `P${i}`, summary: 's', body: 'b' })) }).warnings, n, 'C7')).toHaveLength(1)
      expect(own(run(C, { labels: {} }).warnings, n, 'C5')).toHaveLength(1)
    }
  })
})
