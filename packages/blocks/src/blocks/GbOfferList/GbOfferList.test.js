// GbOfferList (dueño: bruno): offer-list.md «Verificación propia» + la batería común de _comun.md §8 y §20.
import { describe, it, expect, afterEach, vi } from 'vitest'
import meta from './GbOfferList.meta.json'
import * as bank from './offer-list.bank.js'
import * as section from './props.js'
import GbOfferList01 from './GbOfferList01.vue'
import GbOfferList02 from './GbOfferList02.vue'
import GbOfferList03 from './GbOfferList03.vue'
import { sectionSuite } from '../bank/suite.js'

const variants = { GbOfferList01, GbOfferList02, GbOfferList03 }
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbOfferList' })
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

import { nextTick } from 'vue'
import { GBtn, GCard, GText } from '@grana/vue'
import { GPrice, GPriceScope } from '@grana/vue/price'
import { GGalleryViewer } from '@grana/vue/gallery'
import { describeQuery } from '@grana/vue/booking'
import GbSearch02 from '../GbSearch/GbSearch02.vue'
import * as searchBank from '../GbSearch/search.bank.js'
import { click, mountBlock } from '../bank/harness.js'
import { PARTY_ROWS, QUERY, QUERY_LABELS } from '../bank/booking.js'

import { beforeEach } from 'vitest'
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { if (!this.hasAttribute('open')) return; this.removeAttribute('open'); this.dispatchEvent(new Event('close')) }
})
const run = (C, props = {}, extra = {}) => mountBlock(C, { props: { ...bank.props, ...props }, slots: bank.slots, ...extra })
const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbOfferList${n}]`) && t.includes(`(${code})`))
const ALL = Object.entries(variants).map(([k, C]) => [k.slice(-2), C])
const cardOf = (w, id) => w.findAllComponents(GCard).find((c) => c.props('title') === bank.props.offers.find((o) => o.id === id).name)
const LINE = `Para ${describeQuery(QUERY, { partyRows: PARTY_ROWS, locale: 'es', labels: QUERY_LABELS }).text} · ${describeQuery(QUERY, { partyRows: PARTY_ROWS, locale: 'es', labels: QUERY_LABELS }).checkout}`

describe('GbOfferList · una oferta', () => {
  it('una sola acción principal por tarjeta y ningún GBtn solid', () => {
    for (const [, C] of ALL) {
      const { w } = run(C)
      for (const b of w.findAllComponents(GBtn)) expect(b.props('variant')).not.toBe('solid')
      expect(cardOf(w, 'doble-patio').props('interaction')).toBe('link')
      expect(cardOf(w, 'suite-jardin').props('interaction')).toBe('button')
      // Elegir solo en la tarjeta-enlace disponible
      const elegir = w.findAllComponents(GBtn).filter((b) => b.text() === 'Elegir')
      expect(elegir).toHaveLength(1)
      expect(cardOf(w, 'doble-patio').findAllComponents(GBtn).some((b) => b.text() === 'Elegir')).toBe(true)
    }
  })
  it('no disponible: en el DOM con su motivo, sin elegir', () => {
    for (const [, C] of ALL) {
      const onSelect = vi.fn()
      const { w } = run(C, { onSelect })
      const card = cardOf(w, 'sencilla-cantera')
      expect(card.exists()).toBe(true)
      expect(card.text()).toContain('No quedan para el 14 de noviembre')
      expect(card.props('interaction')).toBe('none')
      expect(card.find('.g-card__primary').exists()).toBe(false)
      expect(card.findAllComponents(GBtn).some((b) => b.text() === 'Elegir')).toBe(false)
    }
    const { w } = run(GbOfferList01, { offers: [{ id: 'x', name: 'X', photos: bank.props.offers[0].photos.slice(0, 1), available: false }] })
    expect(w.text()).toContain(bank.props.labels.unavailable)
  })
  it('select: «Elegir» y la tarjeta-botón, con la oferta entera y la consulta', async () => {
    for (const [, C] of ALL) {
      const onSelect = vi.fn()
      const { w } = run(C, { onSelect })
      await cardOf(w, 'suite-jardin').find('button.g-card__primary').trigger('click')
      expect(onSelect.mock.calls[0][0].offer).toBe(bank.props.offers[0])
      expect(onSelect.mock.calls[0][0].query).toEqual(QUERY)
      expect(onSelect.mock.calls[0][0].event).toBeInstanceOf(Event)
      await w.findAll('button.g-btn').find((b) => b.text() === 'Elegir').trigger('click')
      expect(onSelect.mock.calls[1][0].offer).toBe(bank.props.offers[1])
    }
  })
  it('navigate con clic primario en la tarjeta-enlace; no con Ctrl', () => {
    const onNavigate = vi.fn((p) => p.event.preventDefault())
    const { w } = run(GbOfferList02, { onNavigate }, { attachTo: document.body })
    const a = cardOf(w, 'doble-patio').find('a.g-card__primary').element
    a.dispatchEvent(click({ ctrlKey: true }))
    expect(onNavigate).not.toHaveBeenCalled()
    const ev = click()
    a.dispatchEvent(ev)
    expect(onNavigate.mock.calls[0][0]).toMatchObject({ href: '/habitaciones/doble-patio', item: bank.props.offers[1] })
  })
  it('un solo GGalleryViewer en la sección, con from = el botón; photos se emite', async () => {
    for (const [, C] of ALL) {
      const onPhotos = vi.fn()
      const { w } = run(C, { onPhotos }, { attachTo: document.body })
      expect(w.findComponent(GGalleryViewer).exists()).toBe(false)
      const btns = w.findAll('button.g-btn').filter((b) => /^Ver \d+ fotos$/.test(b.text()))
      expect(btns.map((b) => b.text())).toEqual(['Ver 9 fotos', 'Ver 3 fotos', 'Ver 2 fotos'])
      await btns[0].trigger('click')
      await nextTick()
      await btns[1].trigger('click')
      await nextTick()
      const viewers = w.findAllComponents(GGalleryViewer)
      expect(viewers).toHaveLength(1)
      expect(viewers[0].props('title')).toBe('Doble Patio')
      expect(viewers[0].props('photos')).toHaveLength(3)
      expect(viewers[0].props('from')).toBe(btns[1].element)
      expect(viewers[0].props('modelValue')).toBe(true)
      expect(onPhotos.mock.calls[1][0]).toMatchObject({ offer: bank.props.offers[1], index: 0 })
      w.unmount()
    }
  })
  it('la línea de la consulta, una vez por lista: describeQuery con forQuery y la salida', () => {
    for (const [, C] of ALL) {
      const { w } = run(C)
      const lines = w.findAllComponents(GText).filter((t) => t.text().startsWith('Para '))
      expect(lines).toHaveLength(1)
      expect(lines[0].text()).toBe(LINE)
      expect(lines[0].props('tone')).toBe('muted')
    }
  })
  it('precios: PriceSpec tal cual en GPrice, una GPriceScope; la cuenta solo con consulta', () => {
    for (const [, C] of ALL) {
      const { w } = run(C)
      expect(w.findAllComponents(GPriceScope)).toHaveLength(1)
      expect(w.findComponent(GPriceScope).props('currency')).toBe('MXN')
      const p = w.findAllComponents(GPrice)[0]
      expect(p.props('value')).toEqual(bank.props.offers[0].price.value)
      expect(p.props('lead')).toBe('desde')
      expect(p.props('total')).toEqual(bank.props.offers[0].price.total)
      const sin = run(C, { query: null })
      expect(sin.w.findAllComponents(GPrice)[0].props('total')).toBe(null)
    }
  })
  it('03 sin media ni perks y con dos datos', () => {
    const { w } = run(GbOfferList03)
    expect(w.findAll('img')).toHaveLength(0)
    expect(w.text()).not.toContain('Desayuno incluido')
    expect(cardOf(w, 'suite-jardin').props('meta')).toHaveLength(2)
    expect(run(GbOfferList01).w.findAll('img').length).toBe(5)
  })
})

describe('GbOfferList · avisos', () => {
  it('K5: oferta sin id, una vez', () => {
    for (const [n, C] of ALL) expect(own(run(C, { offers: [{ name: 'X', photos: bank.props.offers[4].photos }] }).warnings, n, 'K5')).toHaveLength(1)
  })
  it('OL1 en 01 y 02, no en 03', () => {
    for (const [n, C] of ALL) expect(own(run(C, { offers: [{ id: 1, name: 'X' }] }).warnings, n, 'OL1')).toHaveLength(n === '03' ? 0 : 1)
  })
  it('K3: precio sin value y lista con precios sin prices', () => {
    for (const [n, C] of ALL) {
      expect(own(run(C, { offers: [{ id: 1, name: 'X', photos: bank.props.offers[4].photos, price: { unit: 'x' } }] }).warnings, n, 'K3')).toHaveLength(1)
      expect(own(run(C, { prices: undefined }).warnings, n, 'K3')).toHaveLength(1)
    }
  })
  it('K2: consulta sin partyRows; K1: consulta inválida', () => {
    for (const [n, C] of ALL) {
      const { w, warnings } = run(C, { partyRows: undefined })
      expect(own(warnings, n, 'K2')).toHaveLength(1)
      expect(w.text()).not.toContain(LINE)
      expect(own(run(C, { query: { kind: 'hotel' } }).warnings, n, 'K1')).toHaveLength(1)
    }
  })
  it('K4: available de otro tipo cuenta como disponible', () => {
    for (const [n, C] of ALL) {
      const { w, warnings } = run(C, { offers: [{ id: 1, name: 'X', photos: bank.props.offers[4].photos, available: 3 }] })
      expect(own(warnings, n, 'K4')).toHaveLength(1)
      expect(w.findComponent(GCard).props('interaction')).toBe('button')
    }
  })
  it('C7 con más de 24 ofertas; C5 sin labels.select', () => {
    for (const [n, C] of ALL) {
      const many = Array.from({ length: 25 }, (_, i) => ({ id: i, name: `O${i}`, photos: bank.props.offers[4].photos }))
      expect(own(run(C, { offers: many }).warnings, n, 'C7')).toHaveLength(1)
      expect(own(run(C, { labels: { ...bank.props.labels, select: undefined } }).warnings, n, 'C5')).toHaveLength(1)
    }
  })
})

describe('GbOfferList · idioma de la oferta (#885, #891)', () => {
  it('offer.lang va a la raíz de su tarjeta; las demás sin lang', () => {
    for (const [n, C] of ALL) {
      const { w } = run(C)
      const en = w.findAll('[lang="en"]')
      expect(en.length, n).toBe(1)
      expect(en[0].classes(), n).toContain('g-card')
      expect(en[0].text(), n).toContain('The Mezcal Room')
    }
  })
})

describe('GbOfferList · la consulta de mesa con «hoy» y «mañana» (§20.1, #884)', () => {
  it('la línea es describeQuery(table) y coincide con el resumen de GBookingBar, también con fecha relativa', () => {
    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const today = new Date()
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    const times = searchBank.tests.table.times
    for (const date of [iso(today), iso(tomorrow), '2026-11-13']) {
      const q = { kind: 'table', date, time: '20:00', party: { adults: 2, children: 0, rooms: 1 } }
      const text = describeQuery(q, { partyRows: PARTY_ROWS, times, locale: 'es', labels: QUERY_LABELS }).text
      if (date === iso(today)) expect(text).toMatch(/^hoy/)
      if (date === iso(tomorrow)) expect(text).toMatch(/^mañana/)
      const s = mountBlock(GbSearch02, { props: { ...searchBank.tests.table, query: q } }).w
      expect(s.find('.g-booking-bar__digest').text(), date).toBe(text)
      for (const [n, C] of ALL) {
        const { w } = run(C, { query: q, context: { times } })
        const line = w.findAllComponents(GText).find((t) => t.text().startsWith('Para '))
        expect(line && line.text(), `${n} ${date}`).toContain(`Para ${text}`)
      }
      s.unmount()
    }
  })
})
