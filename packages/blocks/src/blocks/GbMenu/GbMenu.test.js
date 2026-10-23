// GbMenu (dueño: bruno): menu.md «Verificación propia» + la batería común de _comun.md §8 y §20.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { h, nextTick } from 'vue'
import meta from './GbMenu.meta.json'
import * as bank from './menu.bank.js'
import * as section from './props.js'
import GbMenu01 from './GbMenu01.vue'
import GbMenu02 from './GbMenu02.vue'
import GbMenu03 from './GbMenu03.vue'
import { sectionSuite } from '../bank/suite.js'
import { GCard, GTabs } from '@grana/vue'
import { GPrice, GPriceScope } from '@grana/vue/price'
import { GTag } from '@grana/vue/tag'
import { mountBlock } from '../bank/harness.js'

const variants = { GbMenu01, GbMenu02, GbMenu03 }
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbMenu' })
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = ''; history.replaceState(null, '', '/') })

const run = (C, props = {}, extra = {}) => mountBlock(C, { props: { ...bank.props, ...props }, slots: bank.slots, ...extra })
const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbMenu${n}]`) && t.includes(`(${code})`))
const ALL = Object.entries(variants).map(([k, C]) => [k.slice(-2), C])
const DISHES = bank.props.sections.flatMap((s) => s.items)

describe('GbMenu · la carta', () => {
  it('una GPriceScope por carta (moneda y leyenda una vez) y cada precio en un GPrice', () => {
    for (const [, C] of ALL) {
      const { w } = run(C)
      expect(w.findAllComponents(GPriceScope)).toHaveLength(1)
      expect(w.findComponent(GPriceScope).props('currency')).toBe('MXN')
      // 02 pinta todos los paneles (los inactivos con hidden)
      const priced = DISHES.filter((d) => d.price)
      expect(w.findAllComponents(GPrice)).toHaveLength(priced.length)
      expect(w.findAllComponents(GPrice).map((p) => p.props('value'))).toEqual(priced.map((d) => d.price.value))
    }
  })
  it('01 y 02: un dl real dentro de GText, div por plato, dt con el nombre y los dd en el orden del contrato', () => {
    for (const C of [GbMenu01, GbMenu02]) {
      const { w } = run(C)
      const dl = w.find('dl')
      expect(dl.element.parentElement.classList.contains('g-text')).toBe(true)
      const first = dl.element.children[1] // Enfrijoladas: precio, descripción, avisos
      expect(first.tagName).toBe('DIV')
      expect([...first.children].map((c) => c.tagName)).toEqual(['DT', 'DD', 'DD', 'DD'])
      expect(first.children[0].textContent).toBe('Enfrijoladas')
      expect(first.children[1].querySelector('.g-price')).not.toBe(null)
      expect(first.children[2].textContent).toContain('cecina')
      expect(first.children[3].querySelector('ul[aria-label="Contiene"]')).not.toBe(null)
    }
  })
  it('lang en el nombre del plato (dt en 01, título de la tarjeta en 03)', () => {
    expect(run(GbMenu01).w.find('dt[lang="zap"]').text()).toBe('Nicuatole')
    expect(run(GbMenu03).w.find('[lang="zap"]').text()).toBe('Nicuatole')
  })
  it('avisos: GTag estáticas y neutras (sin href, sin pressed, sin color), en una lista con nombre', () => {
    for (const [, C] of ALL) {
      const tags = run(C).w.findAllComponents(GTag)
      expect(tags.length).toBeGreaterThan(0)
      for (const t of tags) {
        expect(t.props('href') ?? null).toBe(null)
        expect(t.props('pressed') ?? null).toBe(null)
        expect(t.props('color') ?? null).toBe(null)
        expect(t.props('size')).toBe('sm')
      }
    }
  })
  it('lo agotado hoy se queda a la vista con su motivo', () => {
    for (const C of [GbMenu01, GbMenu03]) {
      const { w } = run(C)
      expect(w.text()).toContain('Tlayuda')
      expect(w.text()).toContain('Agotado hoy')
    }
    const { w } = run(GbMenu01, { sections: [{ name: 'X', items: [{ name: 'Y', available: false }] }] })
    expect(w.text()).toContain(bank.props.labels.unavailable)
  })
  it('01 y 03: cada tiempo es una sección con su id de ancla y su horario rotulado', () => {
    for (const C of [GbMenu01, GbMenu03]) {
      const { w } = run(C)
      expect(['desayuno', 'comida', 'cena'].every((id) => w.find(`section#${id}`).exists())).toBe(true)
      expect(w.text()).toContain('Se sirve de 8:00 a 12:00')
    }
  })
  it('03: una tarjeta por plato en una rejilla, la foto solo donde hay, el título un nivel bajo el tiempo', () => {
    const { w } = run(GbMenu03)
    expect(w.findAllComponents(GCard)).toHaveLength(DISHES.length)
    expect(w.findAll('img')).toHaveLength(3)
    expect(w.findAll('[role="list"]:not(ul)')).toHaveLength(3)
    expect(w.find('section#desayuno h3').exists()).toBe(true)
    expect(w.findAll('h4').length).toBe(DISHES.length)
  })
  it('02: una pestaña por tiempo; la activa cambia con el clic; la del hash al montar', async () => {
    const { w } = run(GbMenu02, {}, { attachTo: document.body })
    const tabs = w.findComponent(GTabs)
    expect(tabs.props('items')).toEqual([{ id: 'desayuno', label: 'Desayuno' }, { id: 'comida', label: 'Comida' }, { id: 'cena', label: 'Cena' }])
    expect(tabs.props('label')).toBe('Tiempos de la carta')
    expect(w.findAll('[role="tab"]')).toHaveLength(3)
    await w.findAll('[role="tab"]')[2].trigger('click')
    await nextTick()
    expect(w.findComponent(GTabs).props('modelValue')).toBe('cena')
    w.unmount()
    history.replaceState(null, '', '#comida')
    const h2 = run(GbMenu02)
    await nextTick()
    expect(h2.w.findComponent(GTabs).props('modelValue')).toBe('comida')
    expect(h2.w.text()).toContain('Mole negro')
  })
  it('slot item: sustituye el cuerpo del plato', () => {
    const item = vi.fn(({ item: it }) => h('span', null, `propio ${it.name}`))
    for (const [, C] of ALL) {
      const { w } = mountBlock(C, { props: bank.props, slots: { item } })
      expect(w.text()).toContain('propio Enfrijoladas')
      expect(w.findAllComponents(GPrice)).toHaveLength(0)
    }
  })
})

describe('GbMenu · avisos', () => {
  it('M1: precio en otra moneda; K3: sin prices', () => {
    for (const [n, C] of ALL) {
      expect(own(run(C, { sections: [{ id: 'a', name: 'A', items: [{ name: 'X', price: { value: { amount: 3, currency: 'USD' } } }] }] }).warnings, n, 'M1')).toHaveLength(1)
      expect(own(run(C, { prices: undefined }).warnings, n, 'K3')).toHaveLength(1)
    }
  })
  it('M2 solo en 02: id ausente o repetido', () => {
    const secs = [{ name: 'A', items: [{ name: 'x' }] }, { id: 'b', name: 'B', items: [{ name: 'y' }] }, { id: 'b', name: 'C', items: [{ name: 'z' }] }]
    for (const [n, C] of ALL) expect(own(run(C, { sections: secs }).warnings, n, 'M2')).toHaveLength(n === '02' ? 2 : 0)
  })
  it('C1 sin tiempos; C2 plato sin nombre; C7 con más de 12 tiempos', () => {
    for (const [n, C] of ALL) {
      const empty = run(C, { sections: [] })
      expect(own(empty.warnings, n, 'C1')).toHaveLength(1)
      expect(empty.w.find('[data-gb]').exists()).toBe(false)
      expect(own(run(C, { sections: [{ id: 'a', name: 'A', items: [{ description: 'x' }] }] }).warnings, n, 'C2')).toHaveLength(1)
      const many = Array.from({ length: 13 }, (_, i) => ({ id: `s${i}`, name: `S${i}`, items: [{ name: 'x' }] }))
      expect(own(run(C, { sections: many }).warnings, n, 'C7')).toHaveLength(1)
    }
  })
  it('C5: tabs (02), tags y hours', () => {
    for (const [n, C] of ALL) {
      expect(own(run(C, { labels: { ...bank.props.labels, tabs: undefined } }).warnings, n, 'C5')).toHaveLength(n === '02' ? 1 : 0)
      expect(own(run(C, { labels: { ...bank.props.labels, tags: undefined } }).warnings, n, 'C5')).toHaveLength(1)
      expect(own(run(C, { labels: { ...bank.props.labels, hours: undefined } }).warnings, n, 'C5')).toHaveLength(1)
    }
  })
  it('C4 solo en 03 (media sin alt)', () => {
    const secs = [{ id: 'a', name: 'A', items: [{ name: 'x', media: { src: 'a.jpg', width: 10, height: 10 } }] }]
    for (const [n, C] of ALL) expect(own(run(C, { sections: secs }).warnings, n, 'C4')).toHaveLength(n === '03' ? 1 : 0)
  })
})
