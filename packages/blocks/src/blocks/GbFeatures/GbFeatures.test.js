// GbFeatures (dueño: bruno): features.md «Verificación propia» + la batería común de _comun.md §8.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { h } from 'vue'
import { GCard, GSection } from '@grana/vue'
import meta from './GbFeatures.meta.json'
import * as bank from './features.bank.js'
import * as section from './props.js'
import GbFeatures01 from './GbFeatures01.vue'
import GbFeatures02 from './GbFeatures02.vue'
import GbFeatures03 from './GbFeatures03.vue'
import { sectionSuite } from '../bank/suite.js'
import { click, mountBlock } from '../bank/harness.js'

const variants = { GbFeatures01, GbFeatures02, GbFeatures03 }
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbFeatures' })
afterEach(() => vi.restoreAllMocks())

const run = (C, props = {}, extra = {}) => mountBlock(C, { props: { ...bank.props, ...props }, slots: bank.slots, icons: bank.appIcons, ...extra })
const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbFeatures${n}]`) && t.includes(`(${code})`))
const N = bank.props.items.length

describe('GbFeatures · estructura de cada forma', () => {
  it('01: role="list" con seis listitem hijos directos, todos g-adapt-standard, una GCard en cada uno', () => {
    const { w } = run(GbFeatures01)
    const list = w.find('[role="list"]').element
    expect([...list.children].map((k) => [k.getAttribute('role'), k.className])).toEqual(Array(N).fill(['listitem', 'g-adapt-standard']))
    expect(w.findAllComponents(GCard)).toHaveLength(N)
    expect(w.findAll('img')).toHaveLength(0) // 01 ignora media
  })
  it('02: ul › li (GCard as="li", orientation auto) con mediaPosition alterno entre las que traen foto', () => {
    const { w } = run(GbFeatures02)
    const ul = w.find('ul').element
    expect([...ul.children].every((k) => k.tagName === 'LI')).toBe(true)
    const cards = w.findAllComponents(GCard)
    expect(cards.map((c) => c.props('orientation'))).toEqual(Array(N).fill('auto'))
    const withMedia = cards.filter((c) => c.find('img').exists())
    expect(withMedia.map((c) => c.props('mediaPosition'))).toEqual(['start', 'end', 'start', 'end'])
    // Sin media, el icono va en lead (ubicación, wifi)
    expect(cards.filter((c) => !c.find('img').exists()).every((c) => c.find('.g-icon').exists())).toBe(true)
  })
  it('02: imágenes con width, height, alt, loading="lazy", decoding="async" y nunca fetchpriority="high"', () => {
    const { w } = run(GbFeatures02)
    for (const img of w.findAll('img')) {
      expect(img.attributes('width')).toBe('1200')
      expect(img.attributes('height')).toBe('900')
      expect(img.attributes('alt')).toBeTruthy()
      expect(img.attributes('loading')).toBe('lazy')
      expect(img.attributes('decoding')).toBe('async')
      expect(img.attributes('fetchpriority')).toBeUndefined()
    }
  })
  it('03: ul › li › section con su encabezado (h3 bajo el h2 de la sección), dentro de GContainer reading', () => {
    const { w } = run(GbFeatures03)
    const lis = w.findAll('ul > li')
    expect(lis).toHaveLength(N)
    for (const li of lis) expect(li.element.firstElementChild.tagName).toBe('SECTION')
    expect(w.findAll('ul > li > section h3')).toHaveLength(N)
    expect(w.findAll('img')).toHaveLength(0) // 03 ignora media
  })
  it('03: GContainer reading alineado al inicio, no centrado (MK-B2)', () => {
    const { w } = run(GbFeatures03)
    expect(w.find('.g-container--width-reading').classes()).toContain('g-container--horizontal-start')
  })
  it('títulos de dentro un nivel por debajo: h3 en la raíz, h4 dentro de una GSection de la aplicación (useSectionLevel)', () => {
    for (const C of Object.values(variants)) {
      expect(run(C).w.findAll('h3')).toHaveLength(N)
      const nested = run(C, {}, { wrap: (render) => h(GSection, { title: 'Página' }, render) })
      expect(nested.w.find('[data-gb]').findAll('h4')).toHaveLength(N)
    }
  })
  it('el slot description sustituye a la prop; el slot item, al contenido de cada elemento', () => {
    for (const C of Object.values(variants)) {
      const { w } = mountBlock(C, { props: bank.props, icons: bank.appIcons, slots: { description: () => 'DESC', item: ({ item, index }) => `ITEM ${index} ${item.id}` } })
      expect(w.find('.g-section__desc').text()).toBe('DESC')
      expect(w.text()).toContain('ITEM 0 patio')
    }
  })
})

describe('GbFeatures · la ventaja lleva a su prueba (#819)', () => {
  it('01 y 02: con action.href la tarjeta entera es el enlace; navigate reemite el de GCard con item', () => {
    for (const C of [GbFeatures01, GbFeatures02]) {
      const { w } = run(C)
      const card = w.findAllComponents(GCard)[1]
      expect(card.props('interaction')).toBe('link')
      const a = card.find('a.g-card__primary').element
      a.dispatchEvent(click())
      a.dispatchEvent(click({ ctrlKey: true }))
      a.dispatchEvent(click({ button: 1 }))
      const ev = w.findComponent(C).emitted('navigate')
      expect(ev).toHaveLength(1)
      expect(ev[0][0]).toMatchObject({ href: '#fotos-terraza', item: bank.props.items[1] })
    }
  })
  it('01 y 02: externa = enlace a otra pestaña con la marca nombrada en el título y sin navigate', () => {
    for (const C of [GbFeatures01, GbFeatures02]) {
      const { w } = run(C)
      const a = w.findAllComponents(GCard)[3].find('a.g-card__primary')
      expect(a.attributes('target')).toBe('_blank')
      expect(a.attributes('rel')).toBe('noopener')
      expect(a.find('.g-icon[role="img"]').attributes('aria-label')).toBe('se abre en otra pestaña')
      a.element.dispatchEvent(click())
      expect(w.findComponent(C).emitted('navigate')).toBeUndefined()
    }
  })
  it('01 y 02: action sin href = tarjeta botón con activate', async () => {
    const items = [{ id: 'carta', title: 'Desayuno', action: { label: 'Ver la carta' } }]
    for (const C of [GbFeatures01, GbFeatures02]) {
      const { w } = run(C, { items })
      await w.find('button.g-card__primary').trigger('click')
      expect(w.findComponent(C).emitted('activate')[0][0].item).toBe(items[0])
    }
  })
  it('03: la action es un GBtn variant="link" que dice adónde va; navigate y activate llevan la ventaja', async () => {
    const items = [...bank.props.items, { id: 'carta', title: 'Desayuno', action: { label: 'Ver la carta' } }]
    const { w } = run(GbFeatures03, { items })
    const link = w.find('a.g-btn--variant-link[href="#fotos-terraza"]')
    expect(link.text()).toContain('Ver las fotos de la terraza')
    link.element.dispatchEvent(click())
    link.element.dispatchEvent(click({ metaKey: true }))
    expect(w.findComponent(GbFeatures03).emitted('navigate')).toHaveLength(1)
    expect(w.findComponent(GbFeatures03).emitted('navigate')[0][0].item).toBe(items[1])
    const ext = w.find('a.g-btn[target="_blank"]')
    expect(ext.attributes('aria-label')).toBe('Abrir en Google Maps, se abre en otra pestaña')
    ext.element.dispatchEvent(click())
    expect(w.findComponent(GbFeatures03).emitted('navigate')).toHaveLength(1)
    await w.find('button.g-btn--variant-link').trigger('click')
    expect(w.findComponent(GbFeatures03).emitted('activate')[0][0].item).toBe(items[6])
  })
  it('preventDefault() en la escucha de navigate impide la navegación', () => {
    const { w } = mountBlock(GbFeatures01, { props: { ...bank.props, onNavigate: ({ event }) => event.preventDefault() }, icons: bank.appIcons })
    const e = click()
    w.findAllComponents(GCard)[1].find('a').element.dispatchEvent(e)
    expect(e.defaultPrevented).toBe(true)
  })
})

describe('GbFeatures · avisos (una vez por instancia y motivo)', () => {
  it('C1: lista vacía no pinta nada', () => {
    for (const [n, C] of Object.entries({ '01': GbFeatures01, '02': GbFeatures02, '03': GbFeatures03 })) {
      const { w, warnings } = run(C, { items: [] })
      expect(w.find('[data-gb]').exists()).toBe(false)
      expect(own(warnings, n, 'C1')).toHaveLength(1)
    }
  })
  it('C2: un elemento sin title se omite; C3: id repetido usa el índice', () => {
    const items = [{ id: 'a', title: 'Uno' }, { id: 'a', title: 'Dos' }, { description: 'sin título' }]
    for (const [n, C] of Object.entries({ '01': GbFeatures01, '02': GbFeatures02, '03': GbFeatures03 })) {
      const { w, warnings } = run(C, { items })
      expect(w.findAll('h3')).toHaveLength(2)
      expect(own(warnings, n, 'C2')).toHaveLength(1)
      expect(own(warnings, n, 'C3')).toHaveLength(1)
    }
  })
  it('C4 solo en 02 (la única que pinta media)', () => {
    const items = [{ title: 'Foto', media: { src: 'x.jpg' } }]
    expect(own(run(GbFeatures02, { items }).warnings, '02', 'C4')).toHaveLength(2)
    expect(own(run(GbFeatures01, { items }).warnings, '01', 'C4')).toHaveLength(0)
  })
  it('C5: externa sin labels.external; C6: href javascript: se ignora', () => {
    const items = [{ title: 'Mapa', action: { label: 'Mapa', href: 'https://maps', external: true } }, { title: 'Mal', action: { label: 'Mal', href: 'javascript:void(0)' } }]
    for (const [n, C] of Object.entries({ '01': GbFeatures01, '02': GbFeatures02, '03': GbFeatures03 })) {
      const { w, warnings } = run(C, { items, labels: {} })
      expect(own(warnings, n, 'C5')).toHaveLength(1)
      expect(own(warnings, n, 'C6')).toHaveLength(1)
      expect(w.find('a[href^="javascript"]').exists()).toBe(false)
    }
  })
  it('C7: más de doce se pintan todas y avisa', () => {
    const items = Array.from({ length: 13 }, (_, i) => ({ id: i, title: `V${i}` }))
    const { w, warnings } = run(GbFeatures01, { items })
    expect(w.findAll('[role="listitem"]')).toHaveLength(13)
    expect(own(warnings, '01', 'C7')).toHaveLength(1)
  })
  it('F1: 02 sin ningún elemento con media avisa; 01 y 03 no', () => {
    const items = [{ title: 'Uno', icon: 'globe' }, { title: 'Dos' }]
    expect(own(run(GbFeatures02, { items }).warnings, '02', 'F1')).toHaveLength(1)
    expect(own(run(GbFeatures01, { items }).warnings, '01', 'F1')).toHaveLength(0)
  })
})
