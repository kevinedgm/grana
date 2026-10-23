// GbOfferDetail (dueño: bruno): offer-detail.md «Verificación propia» + la batería común de _comun.md §8 y §20.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { h, nextTick } from 'vue'
import { GAccordionItem, GBtn, GCard, GTabs } from '@grana/vue'
import { GGallery } from '@grana/vue/gallery'
import { GPrice, GPriceScope } from '@grana/vue/price'
import { describeQuery } from '@grana/vue/booking'
import meta from './GbOfferDetail.meta.json'
import * as bank from './offer-detail.bank.js'
import * as section from './props.js'
import GbOfferDetail01 from './GbOfferDetail01.vue'
import GbOfferDetail02 from './GbOfferDetail02.vue'
import GbOfferDetail03 from './GbOfferDetail03.vue'
import GbSearch01 from '../GbSearch/GbSearch01.vue'
import * as searchBank from '../GbSearch/search.bank.js'
import { sectionSuite } from '../bank/suite.js'
import { click, mountBlock } from '../bank/harness.js'
import { PARTY_ROWS, QUERY, QUERY_LABELS } from '../bank/booking.js'

const variants = { GbOfferDetail01, GbOfferDetail02, GbOfferDetail03 }
// GGallery y GDialog: jsdom no implementa showModal/close
const proto = globalThis.HTMLDialogElement && HTMLDialogElement.prototype
if (proto && !proto.showModal) {
  proto.showModal = function () { this.setAttribute('open', '') }
  proto.close = function () { this.removeAttribute('open'); this.dispatchEvent(new Event('close')) }
}
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbOfferDetail' })
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

const run = (C, props = {}, extra = {}) => mountBlock(C, { props: { ...bank.props, ...props }, slots: bank.slots, ...extra })
const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbOfferDetail${n}]`) && t.includes(`(${code})`))
const ALL = { '01': GbOfferDetail01, '02': GbOfferDetail02, '03': GbOfferDetail03 }
const O = bank.props.offer
const TEXT = describeQuery(QUERY, { partyRows: PARTY_ROWS, locale: 'es', labels: QUERY_LABELS })
const ficha = (w) => w.findAllComponents(GCard).find((c) => c.props('title') === 'La suite')

describe('GbOfferDetail · galería, ficha y texto (#869)', () => {
  it('la galería con groups, el título de labels.photos y el nivel de dentro (h3; h4 anidada)', () => {
    for (const [n, C] of Object.entries(ALL)) {
      const g = run(C).w.findComponent(GGallery)
      expect(g.props('photos')).toHaveLength(9)
      expect(g.props('groups').map((x) => x.id)).toEqual(['fotos-habitacion', 'fotos-bano', 'fotos-terraza', 'fotos-jardin'])
      expect(g.props('title')).toBe('Fotos de la suite')
      expect(g.props('headingLevel'), n).toBe(3)
      expect(g.props('appearance')).toBe(n === '02' ? 'strip' : 'grid')
    }
  })
  it('la ficha: GCard outlined as="section" con los facts en un dl de GText, perks con nombre, la consulta y el precio en una GPriceScope', () => {
    for (const C of Object.values(ALL)) {
      const { w } = run(C)
      const f = ficha(w)
      expect(f.props('level')).toBe('outlined')
      expect(f.props('as')).toBe('section')
      expect(f.findAll('dl dt').map((x) => x.text())).toEqual(O.facts.map((x) => x.label))
      expect(f.find('dl').element.closest('.g-text')).not.toBeNull()
      expect(f.find('ul[aria-label="Incluye"]').findAll('li')).toHaveLength(2)
      expect(f.text()).toContain(`Para ${TEXT.text}`)
      expect(f.findAllComponents(GPriceScope)).toHaveLength(1)
      const p = f.findComponent(GPrice)
      expect(p.props('value')).toEqual(O.price.value)
      expect(p.props('total')).toEqual(O.price.total)
      expect(p.props('size')).toBe('lg')
    }
  })
  it('sin consulta, el precio es la tarifa sola (sin la cuenta) y no hay línea', () => {
    const f = ficha(run(GbOfferDetail01, { query: null }).w)
    expect(f.findComponent(GPrice).props('total')).toBeFalsy()
    expect(f.text()).not.toContain('Para ')
  })
  it('un dato con su espacio lleva a sus fotos: ancla #fotos-bano en 01 y 03', () => {
    for (const C of [GbOfferDetail01, GbOfferDetail03]) {
      const { w } = run(C)
      const a = ficha(w).find('dd a[href="#fotos-bano"]')
      expect(a.text()).toBe('Ver el baño')
      expect(a.classes()).toContain('g-btn--variant-link')
      expect(w.find('#fotos-bano').exists()).toBe(true)
    }
  })
  it('02: el dato abre el visor en la primera foto del espacio (v-model:index y open de GGallery)', async () => {
    const { w } = run(GbOfferDetail02, {}, { attachTo: document.body })
    const btn = ficha(w).find('dd button')
    expect(btn.text()).toBe('Ver el baño')
    expect(btn.attributes('aria-haspopup')).toBe('dialog')
    await btn.trigger('click')
    await nextTick()
    const g = w.findComponent(GGallery)
    expect(g.props('index')).toBe(O.photos.findIndex((p) => p.group === 'bano'))
    expect(g.props('open')).toBe(true)
    w.unmount()
  })
  it('sin consult: un solo GBtn solid «Reservar» → book { event, offer, query }; con consult no hay «Reservar»', async () => {
    for (const C of Object.values(ALL)) {
      const onBook = vi.fn()
      const { w } = run(C, { onBook }, { attachTo: document.body })
      const solids = w.findAll('.g-btn--variant-solid')
      expect(solids).toHaveLength(1)
      expect(solids[0].text()).toBe('Reservar esta suite')
      solids[0].element.dispatchEvent(click())
      expect(onBook).toHaveBeenCalledTimes(1)
      const p = onBook.mock.calls[0][0]
      expect(p.offer).toBe(O)
      expect(p.query).toEqual(QUERY)
      w.unmount()
      const withConsult = mountBlock(C, { props: bank.props, slots: { consult: () => h(GbSearch01, searchBank.props) } })
      expect(withConsult.w.findAll('.g-btn').some((b) => b.text() === 'Reservar esta suite')).toBe(false)
      expect(withConsult.w.find('[data-gb="search-01"]').exists()).toBe(true)
      expect(withConsult.warnings.filter((t) => t.includes('GbOfferDetail'))).toEqual([])
    }
  })
  it('no disponible: sin botón, el motivo en texto y la página se sigue leyendo', () => {
    for (const C of Object.values(ALL)) {
      const onBook = vi.fn()
      const { w } = run(C, { offer: { ...O, available: false }, onBook })
      expect(w.findAll('.g-btn--variant-solid')).toHaveLength(0)
      expect(ficha(w).text()).toContain('No disponible en tus fechas')
      expect(w.text()).toContain('Qué incluye')
      const reason = run(C, { offer: { ...O, available: 'No quedan para el 14 de noviembre' } }).w
      expect(ficha(reason).text()).toContain('No quedan para el 14 de noviembre')
    }
  })
  it('02: una pestaña por apartado más la descripción (label = labels.tabs); 03: un GAccordionItem por apartado y el texto antes que las fotos', () => {
    const tabs = run(GbOfferDetail02).w.findComponent(GTabs)
    expect(tabs.props('items').map((t) => t.label)).toEqual(['Descripción', 'Qué incluye', 'La cama', 'Llegada'])
    expect(tabs.props('items').map((t) => t.id)).toEqual(['details', 'incluye', 'cama', 'llegada-suite'])
    expect(tabs.props('label')).toBe('Sobre la suite')
    const { w } = run(GbOfferDetail03)
    const items = w.findAllComponents(GAccordionItem)
    expect(items.map((i) => [i.props('id'), i.props('title'), i.props('peek')])).toEqual([
      ['incluye', 'Qué incluye', 'Todo lo que necesitas para no salir de la casa.'],
      ['cama', 'La cama', 'Colchón firme de 2 × 2 m con sábanas de lino lavado.'],
      ['llegada-suite', 'Llegada', 'Te esperamos desde las 15:00; si llegas antes, guardamos tu equipaje.']
    ])
    const order = [w.find('.g-accordion').element, w.find('.g-gallery').element, ficha(w).element]
    for (let i = 1; i < order.length; i++) expect(order[i - 1].compareDocumentPosition(order[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(w.find('.g-container--width-reading').classes()).toContain('g-container--horizontal-start')
  })
  it('01: fotos primero y, debajo, la descripción con una GSection anidada (id) por apartado junto a la ficha', () => {
    const { w } = run(GbOfferDetail01)
    expect(w.find('.g-gallery').element.compareDocumentPosition(w.find('.g-adaptive-layout').element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    for (const s of O.sections) expect(w.find(`section#${s.id} h3`).text()).toBe(s.title)
    expect(w.find('section#incluye ul').findAll('li')).toHaveLength(3)
    const kids = [...w.find('.g-adaptive-layout').element.children]
    expect(kids.map((k) => [...k.classList].find((c) => c.startsWith('g-adapt-')))).toEqual(['g-adapt-wide', 'g-adapt-standard'])
  })
  it('offer.lang va a la raíz (#885)', () => {
    for (const C of Object.values(ALL)) expect(run(C, { offer: { ...O, lang: 'en' } }).w.element.getAttribute('lang')).toBe('en')
    expect(run(GbOfferDetail01).w.element.hasAttribute('lang')).toBe(false)
  })
  it('slots facts y section-{id}', () => {
    for (const C of Object.values(ALL)) {
      const { w } = mountBlock(C, { props: bank.props, slots: { facts: () => h('p', { class: 'mi-ficha' }, 'x'), 'section-cama': ({ section: s }) => h('p', { class: 'mi-cama' }, s.title) } })
      expect(w.find('.mi-ficha').exists()).toBe(true)
      expect(w.find('dl').exists()).toBe(false)
      if (C !== GbOfferDetail02) expect(w.find('.mi-cama').exists()).toBe(true)
    }
  })
})

describe('GbOfferDetail · avisos', () => {
  it('D1 group sin espacio con id; D2 sin fotos (la ficha sigue); D3 id de apartado repetido', () => {
    for (const [n, C] of Object.entries(ALL)) {
      const d1 = run(C, { offer: { ...O, facts: [...O.facts, { label: 'Vista', value: 'Al patio', group: 'patio' }] } })
      expect(own(d1.warnings, n, 'D1')).toHaveLength(1)
      const d2 = run(C, { offer: { ...O, photos: [] } })
      expect(own(d2.warnings, n, 'D2')).toHaveLength(1)
      expect(d2.w.findComponent(GGallery).exists()).toBe(false)
      expect(ficha(d2.w).exists()).toBe(true)
      expect(own(run(C, { offer: { ...O, sections: [O.sections[0], { ...O.sections[1], id: 'incluye' }] } }).warnings, n, 'D3')).toHaveLength(1)
    }
  })
  it('K2 sin labels.query; K3 sin prices; K5 sin id; C5 sin facts/photos/book; C7 más de 6 facts', () => {
    for (const [n, C] of Object.entries(ALL)) {
      expect(own(run(C, { labels: { ...bank.props.labels, query: undefined } }).warnings, n, 'K2')).toHaveLength(1)
      expect(own(run(C, { prices: undefined }).warnings, n, 'K3')).toHaveLength(1)
      const { id, ...noId } = O
      expect(own(run(C, { offer: noId }).warnings, n, 'K5')).toHaveLength(1)
      const c5 = own(run(C, { labels: { ...bank.props.labels, facts: undefined, photos: undefined, book: undefined } }).warnings, n, 'C5')
      expect(c5.map((t) => t.match(/labels\.(\w+)/)[1]).sort()).toEqual(['book', 'facts', 'photos'])
      expect(own(run(C, { offer: { ...O, facts: Array.from({ length: 7 }, (_, i) => ({ label: `D${i}`, value: 'v' })) } }).warnings, n, 'C7')).toHaveLength(1)
    }
    expect(own(run(GbOfferDetail02, { labels: { ...bank.props.labels, tabs: undefined, details: undefined } }).warnings, '02', 'C5')).toHaveLength(2)
    expect(own(run(GbOfferDetail01, { labels: { ...bank.props.labels, tabs: undefined, details: undefined } }).warnings, '01', 'C5')).toHaveLength(0)
  })
})
